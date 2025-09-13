import { MainController } from '../MainController';
import { SystemStatus } from '../../models';

// Mock dos serviços
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
    isRunning: jest.fn(() => false),
    isPaused: jest.fn(() => false),
    onEligiblePatientsFound: jest.fn(),
    forceCheck: jest.fn(),
    getStats: jest.fn(() => ({
      isRunning: false,
      isPaused: false,
      interval: 60000,
      monitoringStats: {
        totalPatients: 0,
        patientsOver30Min: 0,
        averageWaitTime: 0,
        lastUpdate: new Date()
      }
    }))
  }))
}));

// Mock implementations
const mockConfigManager = {
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
    selectedActionCard: '',
    selectedTemplate: '',
    endOfDayTime: '18:00'
  })),
  updateSystemConfig: jest.fn(),
  isAttendanceExcluded: jest.fn(() => Promise.resolve(false))
};

const mockMonitoringService = {
  checkWaitingPatients: jest.fn(() => Promise.resolve([])),
  getPatientWaitTime: jest.fn(() => 0),
  isEligibleFor30MinMessage: jest.fn(() => false),
  isBusinessHours: jest.fn(() => true),
  isWorkingDay: jest.fn(() => true),
  getEligiblePatientsFor30MinMessage: jest.fn(() => Promise.resolve([])),
  getEligiblePatientsForEndOfDayMessage: jest.fn(() => Promise.resolve([])),
  getMonitoringStats: jest.fn(() => ({
    totalPatients: 0,
    patientsOver30Min: 0,
    averageWaitTime: 0,
    lastUpdate: new Date()
  }))
};

const mockMessageService = {
  send30MinuteMessage: jest.fn(() => Promise.resolve(true)),
  sendEndOfDayMessages: jest.fn(() => Promise.resolve()),
  isChannelExcluded: jest.fn(() => false),
  isSectorExcluded: jest.fn(() => false)
};

const mockErrorHandler = {
  logError: jest.fn(),
  notifyAdministrator: jest.fn(),
  getErrorStats: jest.fn(() => ({
    totalErrors: 0,
    errorsByType: {},
    errorsByContext: {},
    lastError: undefined
  }))
};

describe('MainController', () => {
  let mainController: MainController;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock the constructors
    require('../../services/ConfigManager').ConfigManager.mockImplementation(() => mockConfigManager);
    require('../../services/MonitoringService').MonitoringService.mockImplementation(() => mockMonitoringService);
    require('../../services/MessageService').MessageService.mockImplementation(() => mockMessageService);
    require('../../services/ErrorHandler').ErrorHandler.mockImplementation(() => mockErrorHandler);
    require('../../services/KrolikApiClient').KrolikApiClient.mockImplementation(() => ({}));
    
    mainController = new MainController();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Inicialização', () => {
    test('deve criar instância do MainController', () => {
      expect(mainController).toBeInstanceOf(MainController);
    });

    test('deve inicializar corretamente', async () => {
      await expect(mainController.initialize()).resolves.not.toThrow();
      expect(mainController.isInitialized()).toBe(true);
    });

    test('não deve inicializar duas vezes', async () => {
      await mainController.initialize();
      await mainController.initialize(); // Segunda chamada não deve falhar
      expect(mainController.isInitialized()).toBe(true);
    });
  });

  describe('Ciclo de vida', () => {
    beforeEach(async () => {
      await mainController.initialize();
    });

    test('deve iniciar o sistema', async () => {
      await expect(mainController.start()).resolves.not.toThrow();
      
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });

    test('deve parar o sistema', async () => {
      await mainController.start();
      await expect(mainController.stop()).resolves.not.toThrow();
      
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(false);
    });

    test('deve pausar o fluxo', async () => {
      await mainController.start();
      
      // Mock the config manager to return paused state
      mockConfigManager.isFlowPaused.mockReturnValue(true);
      
      expect(() => mainController.pauseFlow()).not.toThrow();
      
      const status = mainController.getStatus();
      expect(status.isPaused).toBe(true);
      expect(status.flowActive).toBe(false);
    });

    test('deve retomar o fluxo', async () => {
      await mainController.start();
      mainController.pauseFlow();
      
      // Mock the config manager to return false after resume
      mockConfigManager.isFlowPaused.mockReturnValue(false);
      
      expect(() => mainController.resumeFlow()).not.toThrow();
      
      const status = mainController.getStatus();
      expect(status.isPaused).toBe(false);
      expect(status.flowActive).toBe(true);
    });
  });

  describe('Status do sistema', () => {
    test('deve retornar status válido', () => {
      const status = mainController.getStatus();
      
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('isPaused');
      expect(status).toHaveProperty('flowActive');
      expect(status).toHaveProperty('lastUpdate');
      expect(status).toHaveProperty('monitoringStats');
      expect(status).toHaveProperty('schedulerStats');
      expect(status).toHaveProperty('errorStats');
      expect(status).toHaveProperty('uptime');
      
      expect(typeof status.isRunning).toBe('boolean');
      expect(typeof status.isPaused).toBe('boolean');
      expect(typeof status.flowActive).toBe('boolean');
      expect(status.lastUpdate).toBeInstanceOf(Date);
      expect(typeof status.uptime).toBe('number');
    });

    test('flowActive deve ser false quando pausado', async () => {
      await mainController.initialize();
      await mainController.start();
      
      // Mock the config manager to return paused state
      mockConfigManager.isFlowPaused.mockReturnValue(true);
      mainController.pauseFlow();
      
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.isPaused).toBe(true);
      expect(status.flowActive).toBe(false);
    });

    test('flowActive deve ser true quando rodando e não pausado', async () => {
      await mainController.initialize();
      await mainController.start();
      
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.isPaused).toBe(false);
      expect(status.flowActive).toBe(true);
    });
  });

  describe('Tratamento de erros', () => {
    test('deve tratar erro na inicialização', async () => {
      // Mock the initialize method to fail
      mockConfigManager.initialize.mockRejectedValueOnce(new Error('Erro de teste'));
      
      const controller = new MainController();
      await expect(controller.initialize()).rejects.toThrow('Falha na inicialização do sistema');
    });

    test('deve retornar status de erro quando getStatus falha', () => {
      // Mock the monitoring service to throw an error
      mockMonitoringService.getMonitoringStats.mockImplementationOnce(() => {
        throw new Error('Erro de teste');
      });
      
      const controller = new MainController();
      const status = controller.getStatus();
      
      expect(status.isRunning).toBe(false);
      expect(status.errorStats.totalErrors).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Funcionalidades auxiliares', () => {
    beforeEach(async () => {
      await mainController.initialize();
      await mainController.start();
    });

    test('deve executar verificação forçada', async () => {
      await expect(mainController.forceCheck()).resolves.not.toThrow();
    });

    test('deve falhar verificação forçada quando não está rodando', async () => {
      await mainController.stop();
      await expect(mainController.forceCheck()).rejects.toThrow('Sistema não está rodando');
    });

    test('deve obter configuração do sistema', () => {
      expect(() => mainController.getSystemConfig()).not.toThrow();
    });

    test('deve atualizar configuração do sistema', async () => {
      await expect(mainController.updateSystemConfig({ flowPaused: true })).resolves.not.toThrow();
    });

    test('deve obter estatísticas detalhadas', () => {
      const stats = mainController.getDetailedStats();
      
      expect(stats).toHaveProperty('system');
      expect(stats).toHaveProperty('monitoring');
      expect(stats).toHaveProperty('scheduler');
      expect(stats).toHaveProperty('config');
    });
  });
});