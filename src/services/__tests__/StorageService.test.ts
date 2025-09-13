import { StorageService } from '../StorageService';
import { SupabaseClient } from '../SupabaseClient';
import { LocalStorageClient } from '../LocalStorageClient';
import { ErrorHandler } from '../ErrorHandler';
import { ExclusionEntry } from '../../models';

// Mock the dependencies
jest.mock('../SupabaseClient');
jest.mock('../LocalStorageClient');
jest.mock('../ErrorHandler');

describe('StorageService', () => {
  let storageService: StorageService;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;
  let mockSupabaseClient: jest.Mocked<SupabaseClient>;
  let mockLocalClient: jest.Mocked<LocalStorageClient>;

  beforeEach(() => {
    mockErrorHandler = new ErrorHandler() as jest.Mocked<ErrorHandler>;
    storageService = new StorageService(mockErrorHandler);
    
    // Get the mocked instances
    mockSupabaseClient = (storageService as any).supabaseClient;
    mockLocalClient = (storageService as any).localClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should connect to Supabase successfully', async () => {
      mockSupabaseClient.connect.mockResolvedValue(true);

      await storageService.initialize();

      expect(mockSupabaseClient.connect).toHaveBeenCalled();
      expect(storageService.isUsingSupabase()).toBe(true);
    });

    it('should fallback to local storage when Supabase fails', async () => {
      mockSupabaseClient.connect.mockResolvedValue(false);

      await storageService.initialize();

      expect(mockSupabaseClient.connect).toHaveBeenCalled();
      expect(storageService.isUsingSupabase()).toBe(false);
    });

    it('should handle Supabase connection errors', async () => {
      const error = new Error('Connection failed');
      mockSupabaseClient.connect.mockRejectedValue(error);

      await storageService.initialize();

      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'StorageService.initialize');
      expect(storageService.isUsingSupabase()).toBe(false);
    });
  });

  describe('addExclusionEntry', () => {
    const mockEntry: Omit<ExclusionEntry, 'id'> = {
      attendanceId: 'att123',
      messageType: '30min',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    it('should add entry using Supabase when available', async () => {
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.addExclusionEntry.mockResolvedValue('entry123');
      
      await storageService.initialize();
      const result = await storageService.addExclusionEntry(mockEntry);

      expect(mockSupabaseClient.addExclusionEntry).toHaveBeenCalledWith(mockEntry);
      expect(result).toBe('entry123');
    });

    it('should fallback to local storage when Supabase fails', async () => {
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.addExclusionEntry.mockResolvedValue(null);
      mockLocalClient.addExclusionEntry.mockResolvedValue('local123');
      
      await storageService.initialize();
      const result = await storageService.addExclusionEntry(mockEntry);

      expect(mockSupabaseClient.addExclusionEntry).toHaveBeenCalledWith(mockEntry);
      expect(mockLocalClient.addExclusionEntry).toHaveBeenCalledWith(mockEntry);
      expect(result).toBe('local123');
      expect(storageService.isUsingSupabase()).toBe(false);
    });

    it('should use local storage when initialized without Supabase', async () => {
      mockSupabaseClient.connect.mockResolvedValue(false);
      mockLocalClient.addExclusionEntry.mockResolvedValue('local123');
      
      await storageService.initialize();
      const result = await storageService.addExclusionEntry(mockEntry);

      expect(mockLocalClient.addExclusionEntry).toHaveBeenCalledWith(mockEntry);
      expect(result).toBe('local123');
    });
  });

  describe('getExclusionEntries', () => {
    const mockEntries: ExclusionEntry[] = [
      {
        id: '1',
        attendanceId: 'att123',
        messageType: '30min',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    ];

    it('should get entries from Supabase when available', async () => {
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.getExclusionEntries.mockResolvedValue(mockEntries);
      
      await storageService.initialize();
      const result = await storageService.getExclusionEntries();

      expect(mockSupabaseClient.getExclusionEntries).toHaveBeenCalled();
      expect(result).toEqual(mockEntries);
    });

    it('should fallback to local storage when Supabase is unhealthy', async () => {
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.getExclusionEntries.mockResolvedValue([]);
      mockSupabaseClient.isHealthy.mockReturnValue(false);
      mockLocalClient.getExclusionEntries.mockResolvedValue(mockEntries);
      
      await storageService.initialize();
      const result = await storageService.getExclusionEntries();

      expect(mockSupabaseClient.getExclusionEntries).toHaveBeenCalled();
      expect(mockLocalClient.getExclusionEntries).toHaveBeenCalled();
      expect(result).toEqual(mockEntries);
      expect(storageService.isUsingSupabase()).toBe(false);
    });
  });

  describe('cleanupExpiredEntries', () => {
    it('should cleanup entries using active client', async () => {
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.cleanupExpiredEntries.mockResolvedValue(5);
      
      await storageService.initialize();
      const result = await storageService.cleanupExpiredEntries();

      expect(mockSupabaseClient.cleanupExpiredEntries).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it('should fallback to local storage on error', async () => {
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.cleanupExpiredEntries.mockRejectedValue(new Error('Cleanup failed'));
      mockLocalClient.cleanupExpiredEntries.mockResolvedValue(3);
      
      await storageService.initialize();
      const result = await storageService.cleanupExpiredEntries();

      expect(mockSupabaseClient.cleanupExpiredEntries).toHaveBeenCalled();
      expect(mockLocalClient.cleanupExpiredEntries).toHaveBeenCalled();
      expect(result).toBe(3);
      expect(storageService.isUsingSupabase()).toBe(false);
    });
  });

  describe('config operations', () => {
    it('should set config value using active client', async () => {
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.setConfigValue.mockResolvedValue(true);
      
      await storageService.initialize();
      const result = await storageService.setConfigValue('key', 'value');

      expect(mockSupabaseClient.setConfigValue).toHaveBeenCalledWith('key', 'value');
      expect(result).toBe(true);
    });

    it('should get config value using active client', async () => {
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.getConfigValue.mockResolvedValue('value');
      
      await storageService.initialize();
      const result = await storageService.getConfigValue('key');

      expect(mockSupabaseClient.getConfigValue).toHaveBeenCalledWith('key');
      expect(result).toBe('value');
    });

    it('should get all config using active client', async () => {
      const mockConfig = { key1: 'value1', key2: 'value2' };
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.getAllConfig.mockResolvedValue(mockConfig);
      
      await storageService.initialize();
      const result = await storageService.getAllConfig();

      expect(mockSupabaseClient.getAllConfig).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });
  });

  describe('reconnectSupabase', () => {
    it('should successfully reconnect to Supabase', async () => {
      mockSupabaseClient.connect.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      
      await storageService.initialize();
      expect(storageService.isUsingSupabase()).toBe(false);
      
      const result = await storageService.reconnectSupabase();
      
      expect(result).toBe(true);
      expect(storageService.isUsingSupabase()).toBe(true);
    });

    it('should handle reconnection failures', async () => {
      const error = new Error('Reconnection failed');
      mockSupabaseClient.connect.mockRejectedValue(error);
      
      const result = await storageService.reconnectSupabase();
      
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'StorageService.reconnectSupabase');
      expect(result).toBe(false);
    });
  });

  describe('performDailyCleanup', () => {
    it('should perform daily cleanup successfully', async () => {
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.cleanupExpiredEntries.mockResolvedValue(10);
      
      await storageService.initialize();
      await storageService.performDailyCleanup();

      expect(mockSupabaseClient.cleanupExpiredEntries).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const error = new Error('Cleanup failed');
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.cleanupExpiredEntries.mockRejectedValue(error);
      mockLocalClient.cleanupExpiredEntries.mockResolvedValue(3);
      
      await storageService.initialize();
      await storageService.performDailyCleanup();

      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'StorageService.cleanupExpiredEntries');
    });
  });

  describe('isHealthy', () => {
    it('should return health status of active client', async () => {
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.isHealthy.mockReturnValue(true);
      
      await storageService.initialize();
      const result = storageService.isHealthy();

      expect(result).toBe(true);
    });

    it('should return local client health when using local storage', async () => {
      mockSupabaseClient.connect.mockResolvedValue(false);
      mockLocalClient.isHealthy.mockReturnValue(true);
      
      await storageService.initialize();
      const result = storageService.isHealthy();

      expect(result).toBe(true);
    });
  });

  describe('exclusion persistence methods', () => {
    const mockEntries: ExclusionEntry[] = [
      {
        id: '1',
        attendanceId: 'att123',
        messageType: '30min',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        attendanceId: 'att456',
        messageType: 'end_of_day',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      },
      {
        id: '3',
        attendanceId: 'att123',
        messageType: 'end_of_day',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() - 60 * 60 * 1000) // Expired
      }
    ];

    beforeEach(async () => {
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.getExclusionEntries.mockResolvedValue(mockEntries);
      await storageService.initialize();
    });

    describe('isAttendanceExcluded', () => {
      it('should return true for excluded attendance with valid entry', async () => {
        const result = await storageService.isAttendanceExcluded('att123', '30min');
        expect(result).toBe(true);
      });

      it('should return false for non-excluded attendance', async () => {
        const result = await storageService.isAttendanceExcluded('att999', '30min');
        expect(result).toBe(false);
      });

      it('should return false for expired exclusion entry', async () => {
        const result = await storageService.isAttendanceExcluded('att123', 'end_of_day');
        expect(result).toBe(false);
      });

      it('should handle errors gracefully', async () => {
        mockSupabaseClient.getExclusionEntries.mockRejectedValue(new Error('Database error'));
        
        const result = await storageService.isAttendanceExcluded('att123', '30min');
        
        expect(result).toBe(false);
        expect(mockErrorHandler.logError).toHaveBeenCalled();
      });
    });

    describe('getExclusionEntriesForAttendance', () => {
      it('should return all entries for specific attendance', async () => {
        const result = await storageService.getExclusionEntriesForAttendance('att123');
        
        expect(result).toHaveLength(2);
        expect(result.every(entry => entry.attendanceId === 'att123')).toBe(true);
      });

      it('should return empty array for non-existent attendance', async () => {
        const result = await storageService.getExclusionEntriesForAttendance('att999');
        expect(result).toHaveLength(0);
      });

      it('should handle errors gracefully', async () => {
        mockSupabaseClient.getExclusionEntries.mockRejectedValue(new Error('Database error'));
        
        const result = await storageService.getExclusionEntriesForAttendance('att123');
        
        expect(result).toHaveLength(0);
        expect(mockErrorHandler.logError).toHaveBeenCalled();
      });
    });

    describe('getExclusionEntriesByType', () => {
      it('should return entries filtered by message type', async () => {
        const result = await storageService.getExclusionEntriesByType('30min');
        
        expect(result).toHaveLength(1);
        expect(result[0].messageType).toBe('30min');
      });

      it('should return entries for end_of_day type', async () => {
        const result = await storageService.getExclusionEntriesByType('end_of_day');
        
        expect(result).toHaveLength(2);
        expect(result.every(entry => entry.messageType === 'end_of_day')).toBe(true);
      });

      it('should handle errors gracefully', async () => {
        mockSupabaseClient.getExclusionEntries.mockRejectedValue(new Error('Database error'));
        
        const result = await storageService.getExclusionEntriesByType('30min');
        
        expect(result).toHaveLength(0);
        expect(mockErrorHandler.logError).toHaveBeenCalled();
      });
    });

    describe('getExclusionStats', () => {
      it('should return correct statistics', async () => {
        const result = await storageService.getExclusionStats();
        
        expect(result).toEqual({
          total: 3,
          expired: 1,
          by30min: 1,
          byEndOfDay: 2
        });
      });

      it('should handle errors gracefully', async () => {
        mockSupabaseClient.getExclusionEntries.mockRejectedValue(new Error('Database error'));
        
        const result = await storageService.getExclusionStats();
        
        expect(result).toEqual({
          total: 0,
          expired: 0,
          by30min: 0,
          byEndOfDay: 0
        });
        expect(mockErrorHandler.logError).toHaveBeenCalled();
      });
    });

    describe('removeExclusionEntry', () => {
      it('should log warning for unimplemented functionality', async () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        const result = await storageService.removeExclusionEntry('att123', '30min');
        
        expect(result).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith('removeExclusionEntry not implemented - entries will expire automatically');
        
        consoleSpy.mockRestore();
      });
    });
  });

  describe('daily cleanup integration', () => {
    it('should perform complete daily cleanup workflow', async () => {
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.cleanupExpiredEntries.mockResolvedValue(5);
      
      await storageService.initialize();
      await storageService.performDailyCleanup();

      expect(mockSupabaseClient.cleanupExpiredEntries).toHaveBeenCalled();
    });

    it('should handle cleanup errors and continue operation', async () => {
      const error = new Error('Cleanup failed');
      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.cleanupExpiredEntries.mockRejectedValue(error);
      mockLocalClient.cleanupExpiredEntries.mockResolvedValue(3);
      
      await storageService.initialize();
      await storageService.performDailyCleanup();

      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'StorageService.cleanupExpiredEntries');
      expect(mockLocalClient.cleanupExpiredEntries).toHaveBeenCalled();
    });
  });

  describe('exclusion persistence workflow', () => {
    it('should handle complete 30-minute message exclusion workflow', async () => {
      const mockEntry: Omit<ExclusionEntry, 'id'> = {
        attendanceId: 'att123',
        messageType: '30min',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.addExclusionEntry.mockResolvedValue('entry123');
      mockSupabaseClient.getExclusionEntries.mockResolvedValue([{ ...mockEntry, id: 'entry123' }]);
      
      await storageService.initialize();
      
      // Add exclusion entry
      const entryId = await storageService.addExclusionEntry(mockEntry);
      expect(entryId).toBe('entry123');
      
      // Check if attendance is excluded
      const isExcluded = await storageService.isAttendanceExcluded('att123', '30min');
      expect(isExcluded).toBe(true);
      
      // Get stats
      const stats = await storageService.getExclusionStats();
      expect(stats.by30min).toBe(1);
    });

    it('should handle end-of-day message exclusion workflow', async () => {
      const mockEntry: Omit<ExclusionEntry, 'id'> = {
        attendanceId: 'att456',
        messageType: 'end_of_day',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      };

      mockSupabaseClient.connect.mockResolvedValue(true);
      mockSupabaseClient.addExclusionEntry.mockResolvedValue('entry456');
      mockSupabaseClient.getExclusionEntries.mockResolvedValue([{ ...mockEntry, id: 'entry456' }]);
      
      await storageService.initialize();
      
      // Add exclusion entry
      const entryId = await storageService.addExclusionEntry(mockEntry);
      expect(entryId).toBe('entry456');
      
      // Check if attendance is excluded
      const isExcluded = await storageService.isAttendanceExcluded('att456', 'end_of_day');
      expect(isExcluded).toBe(true);
      
      // Get entries by type
      const endOfDayEntries = await storageService.getExclusionEntriesByType('end_of_day');
      expect(endOfDayEntries).toHaveLength(1);
    });
  });
});