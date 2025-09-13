import { MainController } from '../MainController';
import { WaitingPatient } from '../../models';

// Mock all services for integration testing
jest.mock('../../services/ConfigManager');
jest.mock('../../services/MonitoringService');
jest.mock('../../services/MessageService');
jest.mock('../../services/KrolikApiClient');
jest.mock('../../services/ErrorHandler');
jest.mock('../../services/Scheduler', () => ({
  createMonitoringScheduler: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    isRunning: jest.fn(() => true),
    isPaused: jest.fn(() => false),
    onEligiblePatientsFound: jest.fn(),
    forceCheck: jest.fn(),
    getStats: jest.fn(() => ({
      isRunning: true,
      isPaused: false,
      interval: 60000,
      monitoringStats: {
        totalPatients: 2,
        patientsOver30Min: 1,
        averageWaitTime: 35,
        lastUpdate: new Date()
      }
    }))
  }))
}));

describe('MainController - Integration Tests', () => {
  let mainController: MainController;
  let mockConfigManager: any;
  let mockMonitoringService: any;
  let mockMessageService: any;
  let mockErrorHandler: any;

  const mockPatients: WaitingPatient[] = [
    {
      id: 'patient1',
      name: 'João Silva',
      phone: '11999999999',
      sectorId: 'sector1',
      sectorName: 'Cardiologia',
      channelId: 'channel1',
      channelType: 'normal',
      waitStartTime: new Date(Date.now() - 35 * 60 * 1000), // 35 minutos atrás
      waitTimeMinutes: 35
    },
    {
      id: 'patient2',
      name: 'Maria Santos',
      phone: '11888888888',
      sectorId: 'sector2',
      sectorName: 'Pediatria',
      channelId: 'channel2',
      channelType: 'api_oficial',
      waitStartTime: new Date(Date.now() - 20 * 60 * 1000), // 20 minutos atrás
      waitTimeMinutes: 20
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock implementations
    mockConfigManager = {
      initialize: jest.fn(),
      getExcludedSectors: jest.fn(() => []),
      getExcludedChannels: jest.fn(() => []),
      addToExclusionList: jest.fn(),
      isFlowPaused: jest.fn(() => false),
      cleanupDailyData: jest.fn(),
      getSystemConfig: jest.fn(() => ({
        flowPaused: false,
        excludedSectors: [],
        excludedChannels: [],
        selectedActionCard: 'card1',
        selectedTemplate: 'template1',
        endOfDayTime: '18:00'
      })),
      updateSystemConfig: jest.fn(),
      isAttendanceExcluded: jest.fn(() => Promise.resolve(false))
    };

    mockMonitoringService = {
      checkWaitingPatients: jest.fn(() => Promise.resolve(mockPatients)),
      getPatientWaitTime: jest.fn((id) => {
        const patient = mockPatients.find(p => p.id === id);
        return patient ? patient.waitTimeMinutes : 0;
      }),
      isEligibleFor30MinMessage: jest.fn((patient) => patient.waitTimeMinutes >= 30),
      isBusinessHours: jest.fn(() => true),
      isWorkingDay: jest.fn(() => true),
      getEligiblePatientsFor30MinMessage: jest.fn(() => 
        Promise.resolve(mockPatients.filter(p => p.waitTimeMinutes >= 30))
      ),
      getEligiblePatientsForEndOfDayMessage: jest.fn(() => Promise.resolve(mockPatients)),
      getMonitoringStats: jest.fn(() => ({
        totalPatients: mockPatients.length,
        patientsOver30Min: mockPatients.filter(p => p.waitTimeMinutes >= 30).length,
        averageWaitTime: mockPatients.reduce((sum, p) => sum + p.waitTimeMinutes, 0) / mockPatients.length,
        lastUpdate: new Date()
      }))
    };

    mockMessageService = {
      send30MinuteMessage: jest.fn(() => Promise.resolve(true)),
      sendEndOfDayMessages: jest.fn(() => Promise.resolve()),
      isChannelExcluded: jest.fn(() => false),
      isSectorExcluded: jest.fn(() => false)
    };

    mockErrorHandler = {
      logError: jest.fn(),
      notifyAdministrator: jest.fn(),
      getErrorStats: jest.fn(() => ({
        totalErrors: 0,
        errorsByType: {},
        errorsByContext: {},
        lastError: undefined
      }))
    };

    // Mock the constructors
    require('../../services/ConfigManager').ConfigManager.mockImplementation(() => mockConfigManager);
    require('../../services/MonitoringService').MonitoringService.mockImplementation(() => mockMonitoringService);
    require('../../services/MessageService').MessageService.mockImplementation(() => mockMessageService);
    require('../../services/ErrorHandler').ErrorHandler.mockImplementation(() => mockErrorHandler);
    require('../../services/KrolikApiClient').KrolikApiClient.mockImplementation(() => ({}));

    mainController = new MainController();
  });

  describe('Fluxo completo de mensagens de 30 minutos', () => {
    test('deve processar pacientes elegíveis para mensagem de 30 minutos', async () => {
      // Arrange
      await mainController.initialize();
      await mainController.start();

      // Act
      await mainController.forceCheck();

      // Assert
      expect(mockMonitoringService.getEligiblePatientsFor30MinMessage).toHaveBeenCalled();
      expect(mockMessageService.send30MinuteMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'patient1',
          waitTimeMinutes: 35
        })
      );
    });

    test('deve respeitar lista de exclusão para mensagens de 30 minutos', async () => {
      // Arrange
      mockConfigManager.isAttendanceExcluded.mockImplementation((id: string, type: string) => 
        Promise.resolve(id === 'patient1' && type === '30min')
      );
      
      await mainController.initialize();
      await mainController.start();

      // Act
      await mainController.forceCheck();

      // Assert
      expect(mockConfigManager.isAttendanceExcluded).toHaveBeenCalledWith('patient1', '30min');
      // Paciente já excluído não deve receber mensagem
      expect(mockMessageService.send30MinuteMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: 'patient1' })
      );
    });

    test('deve tratar erros no envio de mensagens de 30 minutos', async () => {
      // Arrange
      mockMessageService.send30MinuteMessage.mockRejectedValue(new Error('Erro de envio'));
      
      await mainController.initialize();
      await mainController.start();

      // Act
      await mainController.forceCheck();

      // Assert
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('process30MinuteMessages')
      );
    });
  });

  describe('Fluxo completo de mensagens de fim de expediente', () => {
    beforeEach(() => {
      // Mock para simular horário de fim de expediente (18:00)
      const mockDate = new Date();
      mockDate.setHours(18, 0, 0, 0);
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('deve processar mensagens de fim de expediente às 18h', async () => {
      // Arrange
      await mainController.initialize();
      await mainController.start();

      // Act
      await mainController.forceCheck();

      // Assert
      expect(mockMonitoringService.getEligiblePatientsForEndOfDayMessage).toHaveBeenCalled();
      expect(mockMessageService.sendEndOfDayMessages).toHaveBeenCalledWith(mockPatients);
    });

    test('não deve processar mensagens de fim de expediente fora do horário', async () => {
      // Arrange
      const mockDate = new Date();
      mockDate.setHours(15, 0, 0, 0); // 15:00
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      await mainController.initialize();
      await mainController.start();

      // Act
      await mainController.forceCheck();

      // Assert
      expect(mockMessageService.sendEndOfDayMessages).not.toHaveBeenCalled();
    });

    test('não deve processar mensagens de fim de expediente em fins de semana', async () => {
      // Arrange
      mockMonitoringService.isWorkingDay.mockReturnValue(false);
      
      await mainController.initialize();
      await mainController.start();

      // Act
      await mainController.forceCheck();

      // Assert
      expect(mockMessageService.sendEndOfDayMessages).not.toHaveBeenCalled();
    });
  });

  describe('Fluxo de pausa e retomada', () => {
    test('deve pausar o fluxo mantendo o monitoramento ativo', async () => {
      // Arrange
      await mainController.initialize();
      await mainController.start();

      // Act
      mainController.pauseFlow();

      // Assert
      expect(mockConfigManager.updateSystemConfig).toHaveBeenCalledWith({ flowPaused: true });
      
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true); // Sistema ainda rodando
      expect(status.flowActive).toBe(false); // Mas fluxo inativo
    });

    test('deve retomar o fluxo após pausa', async () => {
      // Arrange
      await mainController.initialize();
      await mainController.start();
      mainController.pauseFlow();

      // Act
      mockConfigManager.isFlowPaused.mockReturnValue(false);
      mainController.resumeFlow();

      // Assert
      expect(mockConfigManager.updateSystemConfig).toHaveBeenCalledWith({ flowPaused: false });
      
      const status = mainController.getStatus();
      expect(status.flowActive).toBe(true);
    });

    test('não deve processar mensagens quando fluxo está pausado', async () => {
      // Arrange
      mockConfigManager.isFlowPaused.mockReturnValue(true);
      
      await mainController.initialize();
      await mainController.start();

      // Act
      await mainController.forceCheck();

      // Assert
      expect(mockMessageService.send30MinuteMessage).not.toHaveBeenCalled();
      expect(mockMessageService.sendEndOfDayMessages).not.toHaveBeenCalled();
    });
  });

  describe('Integração completa do sistema', () => {
    test('deve executar ciclo completo de monitoramento e envio', async () => {
      // Arrange
      await mainController.initialize();
      await mainController.start();

      // Act
      await mainController.forceCheck();

      // Assert - Verificar sequência completa
      expect(mockMonitoringService.getEligiblePatientsFor30MinMessage).toHaveBeenCalled();
      expect(mockMessageService.send30MinuteMessage).toHaveBeenCalled();
      expect(mockConfigManager.addToExclusionList).toHaveBeenCalled();
    });

    test('deve manter estatísticas atualizadas', async () => {
      // Arrange
      await mainController.initialize();
      await mainController.start();

      // Act
      const stats = mainController.getDetailedStats();

      // Assert
      expect(stats).toHaveProperty('system');
      expect(stats).toHaveProperty('monitoring');
      expect(stats).toHaveProperty('scheduler');
      expect(stats).toHaveProperty('config');
      
      expect(stats.monitoring.totalPatients).toBe(2);
      expect(stats.monitoring.patientsOver30Min).toBe(1);
    });

    test('deve tratar erros globais sem interromper o sistema', async () => {
      // Arrange
      mockMonitoringService.getEligiblePatientsFor30MinMessage.mockRejectedValue(
        new Error('Erro crítico no monitoramento')
      );
      
      await mainController.initialize();
      await mainController.start();

      // Act
      await mainController.forceCheck();

      // Assert
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('processEligiblePatients')
      );
      
      // Sistema deve continuar funcionando
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });

    test('deve executar limpeza diária ao parar o sistema', async () => {
      // Arrange
      await mainController.initialize();
      await mainController.start();

      // Act
      await mainController.stop();

      // Assert
      expect(mockConfigManager.cleanupDailyData).toHaveBeenCalled();
    });
  });

  describe('Cenários de horário comercial', () => {
    test('deve processar apenas durante horário comercial', async () => {
      // Arrange
      mockMonitoringService.isBusinessHours.mockReturnValue(false);
      
      await mainController.initialize();
      await mainController.start();

      // Act
      await mainController.forceCheck();

      // Assert
      expect(mockMessageService.send30MinuteMessage).not.toHaveBeenCalled();
    });

    test('deve processar apenas em dias úteis', async () => {
      // Arrange
      mockMonitoringService.isWorkingDay.mockReturnValue(false);
      
      await mainController.initialize();
      await mainController.start();

      // Act
      await mainController.forceCheck();

      // Assert
      expect(mockMessageService.send30MinuteMessage).not.toHaveBeenCalled();
    });
  });
});