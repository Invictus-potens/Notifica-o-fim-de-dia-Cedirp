import { ConfigManager } from '../ConfigManager';
import { StorageService } from '../StorageService';
import { ErrorHandler } from '../ErrorHandler';
import { SystemConfig, createDefaultSystemConfig } from '../../models/SystemConfig';
import { ExclusionEntry } from '../../models/ExclusionEntry';

// Mock dependencies
jest.mock('../StorageService');
jest.mock('../ErrorHandler');

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;
  let mockStorageService: jest.Mocked<StorageService>;

  beforeEach(() => {
    mockErrorHandler = new ErrorHandler() as jest.Mocked<ErrorHandler>;
    configManager = new ConfigManager(mockErrorHandler);
    mockStorageService = (configManager as any).storageService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize storage service and load data', async () => {
      const mockConfig = {
        flowPaused: 'false',
        excludedSectors: '["sector1"]',
        excludedChannels: '["channel1"]',
        selectedActionCard: 'card1',
        selectedTemplate: 'template1',
        endOfDayTime: '18:00'
      };
      const mockEntries: ExclusionEntry[] = [
        {
          id: '1',
          attendanceId: 'att123',
          messageType: '30min',
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + 60000)
        }
      ];

      mockStorageService.initialize.mockResolvedValue();
      mockStorageService.getAllConfig.mockResolvedValue(mockConfig);
      mockStorageService.getExclusionEntries.mockResolvedValue(mockEntries);

      await configManager.initialize();

      expect(mockStorageService.initialize).toHaveBeenCalled();
      expect(mockStorageService.getAllConfig).toHaveBeenCalled();
      expect(mockStorageService.getExclusionEntries).toHaveBeenCalled();
    });

    it('should use default config when storage returns empty config', async () => {
      mockStorageService.initialize.mockResolvedValue();
      mockStorageService.getAllConfig.mockResolvedValue({});
      mockStorageService.getExclusionEntries.mockResolvedValue([]);

      await configManager.initialize();

      const config = configManager.getSystemConfig();
      expect(config).toEqual(createDefaultSystemConfig());
    });

    it('should handle storage initialization errors', async () => {
      const error = new Error('Storage init failed');
      mockStorageService.initialize.mockRejectedValue(error);
      mockStorageService.getAllConfig.mockResolvedValue({});
      mockStorageService.getExclusionEntries.mockResolvedValue([]);

      await configManager.initialize();

      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'ConfigManager.loadSystemConfig');
    });
  });

  describe('getExcludedSectors', () => {
    it('should return copy of excluded sectors', async () => {
      const mockConfig = {
        flowPaused: 'false',
        excludedSectors: '["sector1", "sector2"]',
        excludedChannels: '[]',
        endOfDayTime: '18:00'
      };

      mockStorageService.initialize.mockResolvedValue();
      mockStorageService.getAllConfig.mockResolvedValue(mockConfig);
      mockStorageService.getExclusionEntries.mockResolvedValue([]);

      await configManager.initialize();
      const sectors = configManager.getExcludedSectors();

      expect(sectors).toEqual(['sector1', 'sector2']);
      // Verify it's a copy
      sectors.push('sector3');
      expect(configManager.getExcludedSectors()).toEqual(['sector1', 'sector2']);
    });
  });

  describe('getExcludedChannels', () => {
    it('should return copy of excluded channels', async () => {
      const mockConfig = {
        flowPaused: 'false',
        excludedSectors: '[]',
        excludedChannels: '["channel1", "channel2"]',
        endOfDayTime: '18:00'
      };

      mockStorageService.initialize.mockResolvedValue();
      mockStorageService.getAllConfig.mockResolvedValue(mockConfig);
      mockStorageService.getExclusionEntries.mockResolvedValue([]);

      await configManager.initialize();
      const channels = configManager.getExcludedChannels();

      expect(channels).toEqual(['channel1', 'channel2']);
    });
  });

  describe('addToExclusionList', () => {
    beforeEach(async () => {
      mockStorageService.initialize.mockResolvedValue();
      mockStorageService.getAllConfig.mockResolvedValue({});
      mockStorageService.getExclusionEntries.mockResolvedValue([]);
      await configManager.initialize();
    });

    it('should add entry to exclusion list and storage', async () => {
      mockStorageService.addExclusionEntry.mockResolvedValue('entry123');

      await configManager.addToExclusionList('att123', '30min');

      expect(mockStorageService.addExclusionEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          attendanceId: 'att123',
          messageType: '30min'
        })
      );
    });

    it('should handle storage errors gracefully', async () => {
      const error = new Error('Storage error');
      mockStorageService.addExclusionEntry.mockRejectedValue(error);

      await expect(configManager.addToExclusionList('att123', '30min')).rejects.toThrow();
    });
  });

  describe('isFlowPaused', () => {
    it('should return flow paused status', async () => {
      const mockConfig = {
        flowPaused: 'true',
        excludedSectors: '[]',
        excludedChannels: '[]',
        endOfDayTime: '18:00'
      };

      mockStorageService.initialize.mockResolvedValue();
      mockStorageService.getAllConfig.mockResolvedValue(mockConfig);
      mockStorageService.getExclusionEntries.mockResolvedValue([]);

      await configManager.initialize();
      const isPaused = configManager.isFlowPaused();

      expect(isPaused).toBe(true);
    });
  });

  describe('cleanupDailyData', () => {
    beforeEach(async () => {
      const mockEntries: ExclusionEntry[] = [
        {
          id: '1',
          attendanceId: 'att123',
          messageType: '30min',
          sentAt: new Date(),
          expiresAt: new Date(Date.now() - 60000) // Expired
        },
        {
          id: '2',
          attendanceId: 'att456',
          messageType: '30min',
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + 60000) // Valid
        }
      ];

      mockStorageService.initialize.mockResolvedValue();
      mockStorageService.getAllConfig.mockResolvedValue({});
      mockStorageService.getExclusionEntries.mockResolvedValue(mockEntries);
      await configManager.initialize();
    });

    it('should cleanup expired entries from memory and storage', async () => {
      mockStorageService.cleanupExpiredEntries.mockResolvedValue(5);

      await configManager.cleanupDailyData();

      expect(mockStorageService.cleanupExpiredEntries).toHaveBeenCalled();
    });
  });

  describe('updateSystemConfig', () => {
    beforeEach(async () => {
      mockStorageService.initialize.mockResolvedValue();
      mockStorageService.getAllConfig.mockResolvedValue({});
      mockStorageService.getExclusionEntries.mockResolvedValue([]);
      await configManager.initialize();
    });

    it('should update system config and save to storage', async () => {
      const updates: Partial<SystemConfig> = {
        flowPaused: true,
        excludedSectors: ['newSector']
      };

      mockStorageService.setConfigValue.mockResolvedValue(true);

      await configManager.updateSystemConfig(updates);

      expect(mockStorageService.setConfigValue).toHaveBeenCalledWith('flowPaused', 'true');
      expect(mockStorageService.setConfigValue).toHaveBeenCalledWith('excludedSectors', '["newSector"]');
    });

    it('should reject invalid config updates', async () => {
      const invalidUpdates = {
        flowPaused: 'invalid' as any,
        excludedSectors: 'not-an-array' as any
      };

      await expect(configManager.updateSystemConfig(invalidUpdates)).rejects.toThrow('Invalid system configuration');
    });
  });

  describe('isAttendanceExcluded', () => {
    beforeEach(async () => {
      const mockEntries: ExclusionEntry[] = [
        {
          id: '1',
          attendanceId: 'att123',
          messageType: '30min',
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + 60000) // Valid
        },
        {
          id: '2',
          attendanceId: 'att456',
          messageType: '30min',
          sentAt: new Date(),
          expiresAt: new Date(Date.now() - 60000) // Expired
        }
      ];

      mockStorageService.initialize.mockResolvedValue();
      mockStorageService.getAllConfig.mockResolvedValue({});
      mockStorageService.getExclusionEntries.mockResolvedValue(mockEntries);
      await configManager.initialize();
    });

    it('should return true for excluded attendance', async () => {
      const result = await configManager.isAttendanceExcluded('att123', '30min');
      expect(result).toBe(true);
    });

    it('should return false for non-excluded attendance', async () => {
      const result = await configManager.isAttendanceExcluded('att999', '30min');
      expect(result).toBe(false);
    });

    it('should return false and remove expired entries', async () => {
      const result = await configManager.isAttendanceExcluded('att456', '30min');
      expect(result).toBe(false);
    });
  });

  describe('getSystemConfig', () => {
    it('should return copy of system config', async () => {
      mockStorageService.initialize.mockResolvedValue();
      mockStorageService.getAllConfig.mockResolvedValue({});
      mockStorageService.getExclusionEntries.mockResolvedValue([]);

      await configManager.initialize();
      const config = configManager.getSystemConfig();

      expect(config).toEqual(createDefaultSystemConfig());
      
      // Verify it's a copy
      config.flowPaused = true;
      expect(configManager.getSystemConfig().flowPaused).toBe(false);
    });
  });
});