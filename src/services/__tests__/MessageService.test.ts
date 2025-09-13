import { MessageService } from '../MessageService';
import { IConfigManager } from '../ConfigManager';
import { KrolikApiClient } from '../KrolikApiClient';
import { IErrorHandler } from '../ErrorHandler';
import { WaitingPatient, SystemConfig } from '../../models';

// Mocks
const mockConfigManager: jest.Mocked<IConfigManager> = {
  initialize: jest.fn(),
  getExcludedSectors: jest.fn(),
  getExcludedChannels: jest.fn(),
  addToExclusionList: jest.fn(),
  isFlowPaused: jest.fn(),
  cleanupDailyData: jest.fn(),
  getSystemConfig: jest.fn(),
  updateSystemConfig: jest.fn(),
  isAttendanceExcluded: jest.fn()
};

const mockKrolikApiClient: jest.Mocked<KrolikApiClient> = {
  listWaitingAttendances: jest.fn(),
  sendActionCard: jest.fn(),
  sendTemplate: jest.fn(),
  getSectors: jest.fn(),
  getActionCards: jest.fn(),
  getTemplates: jest.fn(),
  testConnection: jest.fn(),
  updateApiToken: jest.fn(),
  getConfig: jest.fn()
} as any;

const mockErrorHandler: jest.Mocked<IErrorHandler> = {
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  logError: jest.fn(),
  notifyAdministrator: jest.fn(),
  getErrorStats: jest.fn(),
  setLogLevel: jest.fn(),
  clearLogs: jest.fn()
};

describe('MessageService', () => {
  let messageService: MessageService;
  let mockPatient: WaitingPatient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    messageService = new MessageService(
      mockConfigManager,
      mockKrolikApiClient,
      mockErrorHandler
    );

    mockPatient = {
      id: 'patient-123',
      name: 'João Silva',
      phone: '11999999999',
      sectorId: 'sector-1',
      sectorName: 'Cardiologia',
      channelId: 'channel-1',
      channelType: 'normal',
      waitStartTime: new Date(Date.now() - 35 * 60 * 1000), // 35 minutos atrás
      waitTimeMinutes: 35
    };

    // Default mocks
    mockConfigManager.isFlowPaused.mockReturnValue(false);
    mockConfigManager.getExcludedSectors.mockReturnValue([]);
    mockConfigManager.getExcludedChannels.mockReturnValue([]);
    mockConfigManager.isAttendanceExcluded.mockResolvedValue(false);
    mockConfigManager.getSystemConfig.mockReturnValue({
      flowPaused: false,
      excludedSectors: [],
      excludedChannels: [],
      endOfDayTime: '18:00'
    } as SystemConfig);
  });

  describe('send30MinuteMessage', () => {
    it('should return false when flow is paused', async () => {
      mockConfigManager.isFlowPaused.mockReturnValue(true);

      const result = await messageService.send30MinuteMessage(mockPatient);

      expect(result).toBe(false);
      expect(mockConfigManager.isFlowPaused).toHaveBeenCalled();
    });

    it('should return false when sector is excluded', async () => {
      mockConfigManager.getExcludedSectors.mockReturnValue(['sector-1']);

      const result = await messageService.send30MinuteMessage(mockPatient);

      expect(result).toBe(false);
    });

    it('should return false when channel is excluded', async () => {
      mockConfigManager.getExcludedChannels.mockReturnValue(['channel-1']);

      const result = await messageService.send30MinuteMessage(mockPatient);

      expect(result).toBe(false);
    });

    it('should return false when attendance is already excluded', async () => {
      mockConfigManager.isAttendanceExcluded.mockResolvedValue(true);

      const result = await messageService.send30MinuteMessage(mockPatient);

      expect(result).toBe(false);
      expect(mockConfigManager.isAttendanceExcluded).toHaveBeenCalledWith('patient-123', '30min');
    });

    it('should return false when patient has not waited 30 minutes', async () => {
      const recentPatient = {
        ...mockPatient,
        waitTimeMinutes: 25
      };

      const result = await messageService.send30MinuteMessage(recentPatient);

      expect(result).toBe(false);
    });

    it('should handle errors and log them', async () => {
      const error = new Error('Test error');
      mockConfigManager.isFlowPaused.mockImplementation(() => {
        throw error;
      });

      const result = await messageService.send30MinuteMessage(mockPatient);

      expect(result).toBe(false);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        error,
        'MessageService.send30MinuteMessage - Patient: patient-123'
      );
    });

    it('should send action card for normal channel type', async () => {
      mockConfigManager.getSystemConfig.mockReturnValue({
        flowPaused: false,
        excludedSectors: [],
        excludedChannels: [],
        selectedActionCard: 'action-card-123',
        endOfDayTime: '18:00'
      } as SystemConfig);
      
      mockKrolikApiClient.sendActionCard.mockResolvedValue(true);

      const result = await messageService.send30MinuteMessage(mockPatient);

      expect(mockKrolikApiClient.sendActionCard).toHaveBeenCalledWith(
        'channel-1',
        'action-card-123'
      );
      expect(mockConfigManager.addToExclusionList).toHaveBeenCalledWith('patient-123', '30min');
      expect(result).toBe(true);
    });

    it('should send template for api_oficial channel type', async () => {
      const apiOficialPatient = {
        ...mockPatient,
        channelType: 'api_oficial' as const
      };

      mockConfigManager.getSystemConfig.mockReturnValue({
        flowPaused: false,
        excludedSectors: [],
        excludedChannels: [],
        selectedTemplate: 'template-123',
        endOfDayTime: '18:00'
      } as SystemConfig);
      
      mockKrolikApiClient.sendTemplate.mockResolvedValue(true);

      const result = await messageService.send30MinuteMessage(apiOficialPatient);

      expect(mockKrolikApiClient.sendTemplate).toHaveBeenCalledWith(
        'channel-1',
        'template-123'
      );
      expect(mockConfigManager.addToExclusionList).toHaveBeenCalledWith('patient-123', '30min');
      expect(result).toBe(true);
    });

    it('should return false when no action card is configured for normal channel', async () => {
      mockConfigManager.getSystemConfig.mockReturnValue({
        flowPaused: false,
        excludedSectors: [],
        excludedChannels: [],
        endOfDayTime: '18:00'
      } as SystemConfig);

      const result = await messageService.send30MinuteMessage(mockPatient);

      expect(result).toBe(false);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('MessageService.sendActionCardMessage')
      );
    });

    it('should return false when no template is configured for api_oficial channel', async () => {
      const apiOficialPatient = {
        ...mockPatient,
        channelType: 'api_oficial' as const
      };

      mockConfigManager.getSystemConfig.mockReturnValue({
        flowPaused: false,
        excludedSectors: [],
        excludedChannels: [],
        endOfDayTime: '18:00'
      } as SystemConfig);

      const result = await messageService.send30MinuteMessage(apiOficialPatient);

      expect(result).toBe(false);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('MessageService.sendTemplateMessage')
      );
    });

    it('should handle API failures gracefully', async () => {
      mockConfigManager.getSystemConfig.mockReturnValue({
        flowPaused: false,
        excludedSectors: [],
        excludedChannels: [],
        selectedActionCard: 'action-card-123',
        endOfDayTime: '18:00'
      } as SystemConfig);
      
      mockKrolikApiClient.sendActionCard.mockResolvedValue(false);

      const result = await messageService.send30MinuteMessage(mockPatient);

      expect(result).toBe(false);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('MessageService.sendActionCardMessage')
      );
    });

    it('should handle unknown channel types', async () => {
      const unknownChannelPatient = {
        ...mockPatient,
        channelType: 'unknown' as any
      };

      const result = await messageService.send30MinuteMessage(unknownChannelPatient);

      expect(result).toBe(false);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('MessageService.sendMessageByChannelType')
      );
    });

    it('should handle API client exceptions', async () => {
      mockConfigManager.getSystemConfig.mockReturnValue({
        flowPaused: false,
        excludedSectors: [],
        excludedChannels: [],
        selectedActionCard: 'action-card-123',
        endOfDayTime: '18:00'
      } as SystemConfig);
      
      const apiError = new Error('API connection failed');
      mockKrolikApiClient.sendActionCard.mockRejectedValue(apiError);

      const result = await messageService.send30MinuteMessage(mockPatient);

      expect(result).toBe(false);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        apiError,
        expect.stringContaining('MessageService.sendActionCardMessage')
      );
    });
  });

  describe('sendEndOfDayMessages', () => {
    let mockPatients: WaitingPatient[];

    beforeEach(() => {
      mockPatients = [
        mockPatient,
        {
          ...mockPatient,
          id: 'patient-456',
          sectorId: 'sector-2',
          channelId: 'channel-2'
        }
      ];

      // Mock para simular que é 18:00 em um dia útil
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1); // Segunda-feira
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not send messages on weekends', async () => {
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(0); // Domingo

      await messageService.sendEndOfDayMessages(mockPatients);

      // Não deve tentar enviar mensagens
      expect(mockConfigManager.addToExclusionList).not.toHaveBeenCalled();
    });

    it('should not send messages outside end of day time', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(17); // 17:00

      await messageService.sendEndOfDayMessages(mockPatients);

      // Não deve tentar enviar mensagens
      expect(mockConfigManager.addToExclusionList).not.toHaveBeenCalled();
    });

    it('should filter out excluded sectors and channels', async () => {
      mockConfigManager.getExcludedSectors.mockReturnValue(['sector-1']);
      mockConfigManager.getExcludedChannels.mockReturnValue(['channel-2']);

      await messageService.sendEndOfDayMessages(mockPatients);

      // Nenhum paciente deve ser elegível
      expect(mockConfigManager.addToExclusionList).not.toHaveBeenCalled();
    });

    it('should handle errors for individual patients', async () => {
      await messageService.sendEndOfDayMessages(mockPatients);

      // Should log errors for each patient since no action card/template is configured
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('MessageService.sendActionCardMessage')
      );
      expect(mockErrorHandler.logError).toHaveBeenCalledTimes(2); // One for each patient
    });

    it('should send messages successfully for eligible patients', async () => {
      mockConfigManager.getSystemConfig.mockReturnValue({
        flowPaused: false,
        excludedSectors: [],
        excludedChannels: [],
        selectedActionCard: 'action-card-123',
        endOfDayTime: '18:00'
      } as SystemConfig);
      
      mockKrolikApiClient.sendActionCard.mockResolvedValue(true);

      await messageService.sendEndOfDayMessages(mockPatients);

      expect(mockKrolikApiClient.sendActionCard).toHaveBeenCalledTimes(2);
      expect(mockConfigManager.addToExclusionList).toHaveBeenCalledWith('patient-123', 'end_of_day');
      expect(mockConfigManager.addToExclusionList).toHaveBeenCalledWith('patient-456', 'end_of_day');
    });
  });

  describe('isChannelExcluded', () => {
    it('should return true when channel is in excluded list', () => {
      mockConfigManager.getExcludedChannels.mockReturnValue(['channel-1', 'channel-2']);

      const result = messageService.isChannelExcluded('channel-1');

      expect(result).toBe(true);
    });

    it('should return false when channel is not in excluded list', () => {
      mockConfigManager.getExcludedChannels.mockReturnValue(['channel-2']);

      const result = messageService.isChannelExcluded('channel-1');

      expect(result).toBe(false);
    });
  });

  describe('isSectorExcluded', () => {
    it('should return true when sector is in excluded list', () => {
      mockConfigManager.getExcludedSectors.mockReturnValue(['sector-1', 'sector-2']);

      const result = messageService.isSectorExcluded('sector-1');

      expect(result).toBe(true);
    });

    it('should return false when sector is not in excluded list', () => {
      mockConfigManager.getExcludedSectors.mockReturnValue(['sector-2']);

      const result = messageService.isSectorExcluded('sector-1');

      expect(result).toBe(false);
    });
  });
});