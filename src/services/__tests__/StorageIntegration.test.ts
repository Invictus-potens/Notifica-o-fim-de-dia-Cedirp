import { StorageService } from '../StorageService';
import { SupabaseClient } from '../SupabaseClient';
import { LocalStorageClient } from '../LocalStorageClient';
import { ErrorHandler } from '../ErrorHandler';
import { ExclusionEntry } from '../../models/ExclusionEntry';

// Mock dependencies
jest.mock('../SupabaseClient');
jest.mock('../LocalStorageClient');
jest.mock('../ErrorHandler');

describe('Storage Integration Tests', () => {
  let storageService: StorageService;
  let mockSupabaseClient: jest.Mocked<SupabaseClient>;
  let mockLocalClient: jest.Mocked<LocalStorageClient>;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;

  const mockEntry: Omit<ExclusionEntry, 'id'> = {
    attendanceId: 'att123',
    messageType: '30min',
    sentAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mocked instances
    mockSupabaseClient = new SupabaseClient({} as any) as jest.Mocked<SupabaseClient>;
    mockLocalClient = new LocalStorageClient({} as any) as jest.Mocked<LocalStorageClient>;
    mockErrorHandler = new ErrorHandler() as jest.Mocked<ErrorHandler>;

    // Setup default mock implementations
    mockSupabaseClient.testConnection = jest.fn().mockResolvedValue(true);
    mockSupabaseClient.isHealthy = jest.fn().mockReturnValue(true);
    mockSupabaseClient.addExclusionEntry = jest.fn().mockResolvedValue('supabase-id');
    mockSupabaseClient.getExclusionEntries = jest.fn().mockResolvedValue([]);
    mockSupabaseClient.cleanupExpiredEntries = jest.fn().mockResolvedValue(0);
    mockSupabaseClient.setConfigValue = jest.fn().mockResolvedValue(true);
    mockSupabaseClient.getConfigValue = jest.fn().mockResolvedValue('test-value');
    mockSupabaseClient.getAllConfig = jest.fn().mockResolvedValue({});

    mockLocalClient.addExclusionEntry = jest.fn().mockResolvedValue('local-id');
    mockLocalClient.getExclusionEntries = jest.fn().mockResolvedValue([]);
    mockLocalClient.cleanupExpiredEntries = jest.fn().mockResolvedValue(0);
    mockLocalClient.setConfigValue = jest.fn().mockResolvedValue(true);
    mockLocalClient.getConfigValue = jest.fn().mockResolvedValue('test-value');
    mockLocalClient.getAllConfig = jest.fn().mockResolvedValue({});

    mockErrorHandler.logError = jest.fn();

    storageService = new StorageService(mockErrorHandler);
  });

  describe('Initialization and connection management', () => {
    it('should initialize with Supabase when connection is successful', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);

      await storageService.initialize();

      expect(mockSupabaseClient.testConnection).toHaveBeenCalled();
      expect(storageService.isUsingSupabase()).toBe(true);
    });

    it('should fallback to local storage when Supabase connection fails', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(false);

      await storageService.initialize();

      expect(mockSupabaseClient.testConnection).toHaveBeenCalled();
      expect(storageService.isUsingSupabase()).toBe(false);
    });

    it('should handle Supabase initialization errors', async () => {
      mockSupabaseClient.testConnection.mockRejectedValue(new Error('Connection failed'));

      await storageService.initialize();

      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        'StorageService.initialize'
      );
      expect(storageService.isUsingSupabase()).toBe(false);
    });
  });

  describe('Exclusion entry operations with fallback', () => {
    it('should use Supabase when healthy', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      const result = await storageService.addExclusionEntry(mockEntry);

      expect(result).toBe('supabase-id');
      expect(mockSupabaseClient.addExclusionEntry).toHaveBeenCalledWith(mockEntry);
      expect(mockLocalClient.addExclusionEntry).not.toHaveBeenCalled();
    });

    it('should fallback to local storage when Supabase fails', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      // Simulate Supabase failure
      mockSupabaseClient.addExclusionEntry.mockResolvedValue(null);

      const result = await storageService.addExclusionEntry(mockEntry);

      expect(result).toBe('local-id');
      expect(mockSupabaseClient.addExclusionEntry).toHaveBeenCalledWith(mockEntry);
      expect(mockLocalClient.addExclusionEntry).toHaveBeenCalledWith(mockEntry);
      expect(storageService.isUsingSupabase()).toBe(false); // Should switch to local
    });

    it('should use local storage when Supabase is unhealthy', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      // Simulate Supabase becoming unhealthy
      mockSupabaseClient.isHealthy.mockReturnValue(false);

      const result = await storageService.addExclusionEntry(mockEntry);

      expect(result).toBe('local-id');
      expect(mockSupabaseClient.addExclusionEntry).not.toHaveBeenCalled();
      expect(mockLocalClient.addExclusionEntry).toHaveBeenCalledWith(mockEntry);
    });

    it('should handle complete storage failure gracefully', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(false);
      await storageService.initialize();

      // Simulate local storage failure too
      mockLocalClient.addExclusionEntry.mockResolvedValue(null);

      const result = await storageService.addExclusionEntry(mockEntry);

      expect(result).toBeNull();
      expect(mockErrorHandler.logError).toHaveBeenCalled();
    });
  });

  describe('Configuration operations with fallback', () => {
    it('should sync configuration between Supabase and local storage', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      await storageService.setConfigValue('test-key', 'test-value');

      expect(mockSupabaseClient.setConfigValue).toHaveBeenCalledWith('test-key', 'test-value');
      expect(mockLocalClient.setConfigValue).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should fallback to local config when Supabase fails', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      // Simulate Supabase failure
      mockSupabaseClient.getConfigValue.mockResolvedValue(null);
      mockLocalClient.getConfigValue.mockResolvedValue('local-value');

      const result = await storageService.getConfigValue('test-key');

      expect(result).toBe('local-value');
      expect(mockSupabaseClient.getConfigValue).toHaveBeenCalledWith('test-key');
      expect(mockLocalClient.getConfigValue).toHaveBeenCalledWith('test-key');
    });

    it('should merge configurations from both sources', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      mockSupabaseClient.getAllConfig.mockResolvedValue({
        key1: 'supabase-value1',
        key2: 'supabase-value2'
      });
      mockLocalClient.getAllConfig.mockResolvedValue({
        key2: 'local-value2', // Should be overridden by Supabase
        key3: 'local-value3'
      });

      const result = await storageService.getAllConfig();

      expect(result).toEqual({
        key1: 'supabase-value1',
        key2: 'supabase-value2', // Supabase takes precedence
        key3: 'local-value3'
      });
    });
  });

  describe('Data cleanup and maintenance', () => {
    it('should perform cleanup on both storage systems', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      mockSupabaseClient.cleanupExpiredEntries.mockResolvedValue(5);
      mockLocalClient.cleanupExpiredEntries.mockResolvedValue(3);

      const result = await storageService.performDailyCleanup();

      expect(result).toBe(8); // 5 + 3
      expect(mockSupabaseClient.cleanupExpiredEntries).toHaveBeenCalled();
      expect(mockLocalClient.cleanupExpiredEntries).toHaveBeenCalled();
    });

    it('should continue cleanup even if one storage fails', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      mockSupabaseClient.cleanupExpiredEntries.mockRejectedValue(new Error('Cleanup failed'));
      mockLocalClient.cleanupExpiredEntries.mockResolvedValue(3);

      const result = await storageService.performDailyCleanup();

      expect(result).toBe(3); // Only local cleanup succeeded
      expect(mockErrorHandler.logError).toHaveBeenCalled();
    });
  });

  describe('Connection recovery and health monitoring', () => {
    it('should attempt to reconnect to Supabase when unhealthy', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      // Simulate Supabase becoming unhealthy
      mockSupabaseClient.isHealthy.mockReturnValue(false);
      
      // Then healthy again
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      mockSupabaseClient.isHealthy.mockReturnValue(true);

      const success = await storageService.reconnectSupabase();

      expect(success).toBe(true);
      expect(mockSupabaseClient.testConnection).toHaveBeenCalled();
      expect(storageService.isUsingSupabase()).toBe(true);
    });

    it('should not reconnect when Supabase is still unhealthy', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(false);
      await storageService.initialize();

      const success = await storageService.reconnectSupabase();

      expect(success).toBe(false);
      expect(storageService.isUsingSupabase()).toBe(false);
    });

    it('should provide accurate health status', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      const status = storageService.getHealthStatus();

      expect(status).toEqual({
        supabaseHealthy: true,
        localStorageHealthy: true,
        usingSupabase: true,
        lastHealthCheck: expect.any(Date)
      });
    });
  });

  describe('Concurrent operations and race conditions', () => {
    it('should handle concurrent exclusion entry additions', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      const entries = Array.from({ length: 10 }, (_, i) => ({
        ...mockEntry,
        attendanceId: `att${i}`
      }));

      mockSupabaseClient.addExclusionEntry.mockImplementation(async (entry) => 
        `supabase-${entry.attendanceId}`
      );

      const promises = entries.map(entry => storageService.addExclusionEntry(entry));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(results.every(result => result?.startsWith('supabase-'))).toBe(true);
      expect(mockSupabaseClient.addExclusionEntry).toHaveBeenCalledTimes(10);
    });

    it('should handle concurrent configuration updates', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      const updates = Array.from({ length: 5 }, (_, i) => ({
        key: `key${i}`,
        value: `value${i}`
      }));

      const promises = updates.map(({ key, value }) => 
        storageService.setConfigValue(key, value)
      );
      const results = await Promise.all(promises);

      expect(results.every(result => result === true)).toBe(true);
      expect(mockSupabaseClient.setConfigValue).toHaveBeenCalledTimes(5);
      expect(mockLocalClient.setConfigValue).toHaveBeenCalledTimes(5);
    });

    it('should handle storage switching during operations', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      // Start with Supabase healthy
      expect(storageService.isUsingSupabase()).toBe(true);

      // Simulate Supabase failure during operation
      mockSupabaseClient.addExclusionEntry.mockImplementation(async () => {
        // Simulate Supabase becoming unhealthy
        mockSupabaseClient.isHealthy.mockReturnValue(false);
        return null;
      });

      const result = await storageService.addExclusionEntry(mockEntry);

      expect(result).toBe('local-id');
      expect(storageService.isUsingSupabase()).toBe(false);
    });
  });

  describe('Data consistency and synchronization', () => {
    it('should maintain data consistency between storage systems', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      const testEntries = [
        { id: '1', ...mockEntry, attendanceId: 'att1' },
        { id: '2', ...mockEntry, attendanceId: 'att2' }
      ];

      mockSupabaseClient.getExclusionEntries.mockResolvedValue(testEntries);
      mockLocalClient.getExclusionEntries.mockResolvedValue([]);

      const result = await storageService.getExclusionEntries();

      expect(result).toEqual(testEntries);
      expect(mockSupabaseClient.getExclusionEntries).toHaveBeenCalled();
    });

    it('should handle data conflicts between storage systems', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      const supabaseEntries = [
        { id: '1', ...mockEntry, attendanceId: 'att1' }
      ];
      const localEntries = [
        { id: '2', ...mockEntry, attendanceId: 'att2' }
      ];

      mockSupabaseClient.getExclusionEntries.mockResolvedValue(supabaseEntries);
      mockLocalClient.getExclusionEntries.mockResolvedValue(localEntries);

      // Simulate Supabase failure to trigger fallback
      mockSupabaseClient.isHealthy.mockReturnValue(false);

      const result = await storageService.getExclusionEntries();

      // Should return local entries when Supabase is unhealthy
      expect(result).toEqual(localEntries);
    });
  });

  describe('Performance and optimization', () => {
    it('should cache health status to avoid excessive checks', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      // Multiple health status calls should not trigger multiple connection tests
      storageService.getHealthStatus();
      storageService.getHealthStatus();
      storageService.getHealthStatus();

      // testConnection should only be called during initialization
      expect(mockSupabaseClient.testConnection).toHaveBeenCalledTimes(1);
    });

    it('should handle large datasets efficiently', async () => {
      mockSupabaseClient.testConnection.mockResolvedValue(true);
      await storageService.initialize();

      // Create large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `entry${i}`,
        ...mockEntry,
        attendanceId: `att${i}`
      }));

      mockSupabaseClient.getExclusionEntries.mockResolvedValue(largeDataset);

      const startTime = Date.now();
      const result = await storageService.getExclusionEntries();
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});