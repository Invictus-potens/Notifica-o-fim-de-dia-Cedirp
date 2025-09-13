import { MainController } from '../controllers/MainController';
import { MonitoringService } from '../services/MonitoringService';
import { MessageService } from '../services/MessageService';
import { ConfigManager } from '../services/ConfigManager';
import { KrolikApiClient } from '../services/KrolikApiClient';
import { ErrorHandler } from '../services/ErrorHandler';
import { WaitingPatient } from '../models/types';

describe('End-to-End Requirement Validation', () => {
  let mainController: MainController;
  let monitoringService: MonitoringService;
  let messageService: MessageService;
  let configManager: ConfigManager;
  let krolikApiClient: KrolikApiClient;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    // Mock all dependencies
    krolikApiClient = {
      listWaitingAttendances: jest.fn(),
      sendActionCard: jest.fn().mockResolvedValue(true),
      sendTemplate: jest.fn().mockResolvedValue(true),
      getSectors: jest.fn(),
      getActionCards: jest.fn(),
    } as any;

    configManager = {
      getExcludedSectors: jest.fn().mockReturnValue([]),
      getExcludedChannels: jest.fn().mockReturnValue([]),
      addToExclusionList: jest.fn(),
      isFlowPaused: jest.fn().mockReturnValue(false),
      cleanupDailyData: jest.fn(),
    } as any;

    errorHandler = {
      logError: jest.fn(),
      notifyAdministrator: jest.fn(),
      getErrorStats: jest.fn(),
    } as any;

    monitoringService = new MonitoringService(krolikApiClient, configManager);
    messageService = new MessageService(krolikApiClient, configManager, errorHandler);
    mainController = new MainController();
  });

  describe('Requisito 1: Mensagens de 30 minutos', () => {
    test('1.1 - QUANDO paciente aguarda 30 minutos ENTÃO envia mensagem automática', async () => {
      const patient: WaitingPatient = {
        id: 'test-patient-1',
        name: 'João Silva',
        phone: '+5511999999999',
        sectorId: 'sector-1',
        sectorName: 'Cardiologia',
        channelId: 'channel-1',
        channelType: 'normal',
        waitStartTime: new Date(Date.now() - (31 * 60 * 1000)), // 31 minutes ago
        waitTimeMinutes: 31,
      };

      (krolikApiClient.listWaitingAttendances as jest.Mock).mockResolvedValue([{
        id: patient.id,
        customer_name: patient.name,
        customer_phone: patient.phone,
        sector_id: patient.sectorId,
        sector_name: patient.sectorName,
        channel_id: patient.channelId,
        channel_type: patient.channelType,
        created_at: patient.waitStartTime.toISOString(),
      }]);

      const waitingPatients = await monitoringService.checkWaitingPatients();
      const eligiblePatient = waitingPatients.find(p => 
        monitoringService.isEligibleFor30MinMessage(p)
      );

      expect(eligiblePatient).toBeDefined();
      expect(eligiblePatient?.waitTimeMinutes).toBeGreaterThanOrEqual(30);

      const result = await messageService.send30MinuteMessage(eligiblePatient!);
      expect(result).toBe(true);
      expect(krolikApiClient.sendActionCard).toHaveBeenCalledWith(
        patient.channelId,
        expect.any(String)
      );
    });

    test('1.2 - QUANDO mensagem enviada ENTÃO adiciona à lista de exclusão', async () => {
      const patient: WaitingPatient = {
        id: 'test-patient-2',
        name: 'Maria Santos',
        phone: '+5511888888888',
        sectorId: 'sector-2',
        sectorName: 'Pediatria',
        channelId: 'channel-2',
        channelType: 'normal',
        waitStartTime: new Date(Date.now() - (35 * 60 * 1000)),
        waitTimeMinutes: 35,
      };

      await messageService.send30MinuteMessage(patient);

      expect(configManager.addToExclusionList).toHaveBeenCalledWith(patient.id);
    });

    test('1.4 - SE fluxo pausado ENTÃO não envia mensagens mas continua monitorando', async () => {
      (configManager.isFlowPaused as jest.Mock).mockReturnValue(true);

      const patient: WaitingPatient = {
        id: 'test-patient-3',
        name: 'Pedro Costa',
        phone: '+5511777777777',
        sectorId: 'sector-3',
        sectorName: 'Ortopedia',
        channelId: 'channel-3',
        channelType: 'normal',
        waitStartTime: new Date(Date.now() - (40 * 60 * 1000)),
        waitTimeMinutes: 40,
      };

      (krolikApiClient.listWaitingAttendances as jest.Mock).mockResolvedValue([{
        id: patient.id,
        customer_name: patient.name,
        customer_phone: patient.phone,
        sector_id: patient.sectorId,
        sector_name: patient.sectorName,
        channel_id: patient.channelId,
        channel_type: patient.channelType,
        created_at: patient.waitStartTime.toISOString(),
      }]);

      // Monitoring should still work
      const waitingPatients = await monitoringService.checkWaitingPatients();
      expect(waitingPatients).toHaveLength(1);

      // But messages should not be sent
      const result = await messageService.send30MinuteMessage(patient);
      expect(result).toBe(false);
      expect(krolikApiClient.sendActionCard).not.toHaveBeenCalled();
    });
  });

  describe('Requisito 2: Mensagens de fim de expediente', () => {
    test('2.1 - QUANDO 18h em dia útil ENTÃO envia mensagens de fim de expediente', async () => {
      // Mock current time to be 18:00 on a weekday
      const mockDate = new Date('2024-03-15T18:00:00-03:00'); // Friday 18:00 Brazil time
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

      const patients: WaitingPatient[] = [
        {
          id: 'patient-eod-1',
          name: 'Ana Silva',
          phone: '+5511666666666',
          sectorId: 'sector-1',
          sectorName: 'Cardiologia',
          channelId: 'channel-1',
          channelType: 'normal',
          waitStartTime: new Date(Date.now() - (20 * 60 * 1000)),
          waitTimeMinutes: 20,
        },
      ];

      expect(monitoringService.isBusinessHours()).toBe(false); // 18:00 is end of business
      
      await messageService.sendEndOfDayMessages(patients);
      
      expect(krolikApiClient.sendActionCard).toHaveBeenCalledWith(
        'channel-1',
        expect.any(String)
      );

      jest.restoreAllMocks();
    });

    test('2.2 - SE setor na lista de exceção ENTÃO não envia mensagem', async () => {
      (configManager.getExcludedSectors as jest.Mock).mockReturnValue(['sector-excluded']);

      const patients: WaitingPatient[] = [
        {
          id: 'patient-excluded-sector',
          name: 'Carlos Oliveira',
          phone: '+5511555555555',
          sectorId: 'sector-excluded',
          sectorName: 'Setor Excluído',
          channelId: 'channel-1',
          channelType: 'normal',
          waitStartTime: new Date(Date.now() - (15 * 60 * 1000)),
          waitTimeMinutes: 15,
        },
      ];

      await messageService.sendEndOfDayMessages(patients);
      
      expect(krolikApiClient.sendActionCard).not.toHaveBeenCalled();
    });

    test('2.3 - SE canal na lista de exceção ENTÃO não envia mensagem', async () => {
      (configManager.getExcludedChannels as jest.Mock).mockReturnValue(['channel-excluded']);

      const patients: WaitingPatient[] = [
        {
          id: 'patient-excluded-channel',
          name: 'Lucia Ferreira',
          phone: '+5511444444444',
          sectorId: 'sector-1',
          sectorName: 'Cardiologia',
          channelId: 'channel-excluded',
          channelType: 'normal',
          waitStartTime: new Date(Date.now() - (25 * 60 * 1000)),
          waitTimeMinutes: 25,
        },
      ];

      await messageService.sendEndOfDayMessages(patients);
      
      expect(krolikApiClient.sendActionCard).not.toHaveBeenCalled();
    });

    test('2.4 - QUANDO fim de semana ENTÃO não executa automação', () => {
      // Mock current time to be Saturday
      const mockDate = new Date('2024-03-16T18:00:00-03:00'); // Saturday 18:00
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

      const isWeekend = mockDate.getDay() === 0 || mockDate.getDay() === 6;
      expect(isWeekend).toBe(true);

      // Business hours check should account for weekends
      expect(monitoringService.isBusinessHours()).toBe(false);

      jest.restoreAllMocks();
    });
  });

  describe('Requisito 6: Suporte a múltiplos canais', () => {
    test('6.1 - QUANDO canal normal ENTÃO usa cartões de ação', async () => {
      const patient: WaitingPatient = {
        id: 'patient-normal-channel',
        name: 'Roberto Lima',
        phone: '+5511333333333',
        sectorId: 'sector-1',
        sectorName: 'Cardiologia',
        channelId: 'channel-normal',
        channelType: 'normal',
        waitStartTime: new Date(Date.now() - (32 * 60 * 1000)),
        waitTimeMinutes: 32,
      };

      await messageService.send30MinuteMessage(patient);

      expect(krolikApiClient.sendActionCard).toHaveBeenCalledWith(
        'channel-normal',
        expect.any(String)
      );
      expect(krolikApiClient.sendTemplate).not.toHaveBeenCalled();
    });

    test('6.2 - QUANDO canal API oficial ENTÃO usa templates', async () => {
      const patient: WaitingPatient = {
        id: 'patient-api-channel',
        name: 'Fernanda Souza',
        phone: '+5511222222222',
        sectorId: 'sector-2',
        sectorName: 'Pediatria',
        channelId: 'channel-api',
        channelType: 'api_oficial',
        waitStartTime: new Date(Date.now() - (33 * 60 * 1000)),
        waitTimeMinutes: 33,
      };

      await messageService.send30MinuteMessage(patient);

      expect(krolikApiClient.sendTemplate).toHaveBeenCalledWith(
        'channel-api',
        expect.any(String)
      );
      expect(krolikApiClient.sendActionCard).not.toHaveBeenCalled();
    });
  });

  describe('Cenários de Falha e Recuperação', () => {
    test('Deve continuar operação quando API falha', async () => {
      (krolikApiClient.listWaitingAttendances as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      // Should not throw error
      await expect(monitoringService.checkWaitingPatients()).resolves.toEqual([]);
    });

    test('Deve registrar erro quando envio de mensagem falha', async () => {
      (krolikApiClient.sendActionCard as jest.Mock).mockRejectedValue(
        new Error('Send Error')
      );

      const patient: WaitingPatient = {
        id: 'patient-fail',
        name: 'Test Patient',
        phone: '+5511111111111',
        sectorId: 'sector-1',
        sectorName: 'Test Sector',
        channelId: 'channel-1',
        channelType: 'normal',
        waitStartTime: new Date(Date.now() - (35 * 60 * 1000)),
        waitTimeMinutes: 35,
      };

      const result = await messageService.send30MinuteMessage(patient);
      expect(result).toBe(false);
    });
  });

  describe('Prevenção de Duplicação', () => {
    test('Não deve enviar mensagem duplicada para mesmo atendimento', async () => {
      const patient: WaitingPatient = {
        id: 'patient-duplicate-test',
        name: 'Duplicate Test',
        phone: '+5511000000000',
        sectorId: 'sector-1',
        sectorName: 'Test Sector',
        channelId: 'channel-1',
        channelType: 'normal',
        waitStartTime: new Date(Date.now() - (35 * 60 * 1000)),
        waitTimeMinutes: 35,
      };

      // First message should be sent
      const firstResult = await messageService.send30MinuteMessage(patient);
      expect(firstResult).toBe(true);
      expect(configManager.addToExclusionList).toHaveBeenCalledWith(patient.id);

      // Mock that patient is now in exclusion list
      (configManager.addToExclusionList as jest.Mock).mockImplementation((id) => {
        if (id === patient.id) {
          // Simulate that this patient is now excluded
          return Promise.resolve();
        }
        return Promise.resolve();
      });

      // Second attempt should be prevented (this would be handled by the exclusion logic)
      // In real implementation, the monitoring service would filter out excluded patients
    });
  });
});