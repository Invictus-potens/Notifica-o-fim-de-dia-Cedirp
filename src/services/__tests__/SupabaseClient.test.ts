import { SupabaseClient } from '../SupabaseClient';
import { IErrorHandler } from '../ErrorHandler';
import { ExclusionEntry } from '../../models/ExclusionEntry';

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getSession: jest.fn()
  }
};

const mockTable = {
  select: jest.fn(),
  insert: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  upsert: jest.fn()
};

const mockQuery = {
  eq: jest.fn(),
  lt: jest.fn(),
  gte: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  single: jest.fn()
};

// Mock createClient
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Mock ErrorHandler
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

describe('SupabaseClient', () => {
  let supabaseClient: SupabaseClient;
  let mockEntry: Omit<ExclusionEntry, 'id'>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock chain
    mockSupabaseClient.from.mockReturnValue(mockTable);
    mockTable.select.mockReturnValue(mockQuery);
    mockTable.insert.mockReturnValue(mockQuery);
    mockTable.delete.mockReturnValue(mockQuery);
    mockTable.update.mockReturnValue(mockQuery);
    mockTable.upsert.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.lt.mockReturnValue(mockQuery);
    mockQuery.gte.mockReturnValue(mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
    mockQuery.limit.mockReturnValue(mockQuery);
    mockQuery.single.mockReturnValue(mockQuery);

    supabaseClient = new SupabaseClient(mockErrorHandler);

    mockEntry = {
      attendanceId: 'att123',
      messageType: '30min',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  });

  describe('constructor', () => {
    it('should create Supabase client with environment variables', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-key';

      const client = new SupabaseClient(mockErrorHandler);
      
      expect(client).toBeInstanceOf(SupabaseClient);
    });

    it('should throw error when environment variables are missing', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;

      expect(() => new SupabaseClient(mockErrorHandler)).toThrow('Variáveis de ambiente do Supabase não configuradas');
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const result = await supabaseClient.testConnection();

      expect(result).toBe(true);
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
    });

    it('should return false when connection fails', async () => {
      const error = new Error('Connection failed');
      mockSupabaseClient.auth.getSession.mockRejectedValue(error);

      const result = await supabaseClient.testConnection();

      expect(result).toBe(false);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'SupabaseClient.testConnection');
    });

    it('should return false when auth returns error', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Auth error' }
      });

      const result = await supabaseClient.testConnection();

      expect(result).toBe(false);
      expect(mockErrorHandler.logError).toHaveBeenCalled();
    });
  });

  describe('isHealthy', () => {
    it('should return true when healthy', () => {
      // Mock successful connection test
      jest.spyOn(supabaseClient, 'testConnection').mockResolvedValue(true);
      
      const result = supabaseClient.isHealthy();
      
      expect(result).toBe(true);
    });

    it('should return false when unhealthy', () => {
      // Simulate unhealthy state by setting internal flag
      (supabaseClient as any).healthy = false;
      
      const result = supabaseClient.isHealthy();
      
      expect(result).toBe(false);
    });
  });

  describe('addExclusionEntry', () => {
    it('should add exclusion entry successfully', async () => {
      const mockId = 'generated-id';
      mockQuery.single.mockResolvedValue({
        data: { id: mockId, ...mockEntry },
        error: null
      });

      const result = await supabaseClient.addExclusionEntry(mockEntry);

      expect(result).toBe(mockId);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('exclusion_entries');
      expect(mockTable.insert).toHaveBeenCalledWith(mockEntry);
      expect(mockQuery.single).toHaveBeenCalled();
    });

    it('should return null when insert fails', async () => {
      const error = { message: 'Insert failed' };
      mockQuery.single.mockResolvedValue({
        data: null,
        error
      });

      const result = await supabaseClient.addExclusionEntry(mockEntry);

      expect(result).toBeNull();
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        'SupabaseClient.addExclusionEntry'
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockQuery.single.mockRejectedValue(error);

      const result = await supabaseClient.addExclusionEntry(mockEntry);

      expect(result).toBeNull();
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'SupabaseClient.addExclusionEntry');
    });
  });

  describe('getExclusionEntries', () => {
    it('should return exclusion entries successfully', async () => {
      const mockEntries = [
        { id: '1', ...mockEntry },
        { id: '2', ...mockEntry, attendanceId: 'att456' }
      ];

      mockQuery.order.mockResolvedValue({
        data: mockEntries,
        error: null
      });

      const result = await supabaseClient.getExclusionEntries();

      expect(result).toEqual(mockEntries.map(entry => ({
        ...entry,
        sentAt: new Date(entry.sentAt),
        expiresAt: new Date(entry.expiresAt)
      })));
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('exclusion_entries');
      expect(mockTable.select).toHaveBeenCalledWith('*');
      expect(mockQuery.gte).toHaveBeenCalledWith('expires_at', expect.any(String));
      expect(mockQuery.order).toHaveBeenCalledWith('sent_at', { ascending: false });
    });

    it('should return empty array when no entries found', async () => {
      mockQuery.order.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await supabaseClient.getExclusionEntries();

      expect(result).toEqual([]);
    });

    it('should handle query errors', async () => {
      const error = { message: 'Query failed' };
      mockQuery.order.mockResolvedValue({
        data: null,
        error
      });

      const result = await supabaseClient.getExclusionEntries();

      expect(result).toEqual([]);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        'SupabaseClient.getExclusionEntries'
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockQuery.order.mockRejectedValue(error);

      const result = await supabaseClient.getExclusionEntries();

      expect(result).toEqual([]);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'SupabaseClient.getExclusionEntries');
    });
  });

  describe('cleanupExpiredEntries', () => {
    it('should cleanup expired entries successfully', async () => {
      mockQuery.eq.mockResolvedValue({
        data: [{ id: '1' }, { id: '2' }],
        error: null
      });

      const result = await supabaseClient.cleanupExpiredEntries();

      expect(result).toBe(2);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('exclusion_entries');
      expect(mockTable.delete).toHaveBeenCalled();
      expect(mockQuery.lt).toHaveBeenCalledWith('expires_at', expect.any(String));
    });

    it('should return 0 when no entries to cleanup', async () => {
      mockQuery.eq.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await supabaseClient.cleanupExpiredEntries();

      expect(result).toBe(0);
    });

    it('should handle cleanup errors', async () => {
      const error = { message: 'Cleanup failed' };
      mockQuery.eq.mockResolvedValue({
        data: null,
        error
      });

      const result = await supabaseClient.cleanupExpiredEntries();

      expect(result).toBe(0);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        'SupabaseClient.cleanupExpiredEntries'
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockQuery.eq.mockRejectedValue(error);

      const result = await supabaseClient.cleanupExpiredEntries();

      expect(result).toBe(0);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'SupabaseClient.cleanupExpiredEntries');
    });
  });

  describe('setConfigValue', () => {
    it('should set config value successfully', async () => {
      mockQuery.single.mockResolvedValue({
        data: { key: 'test-key', value: 'test-value' },
        error: null
      });

      const result = await supabaseClient.setConfigValue('test-key', 'test-value');

      expect(result).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_config');
      expect(mockTable.upsert).toHaveBeenCalledWith({
        key: 'test-key',
        value: 'test-value',
        updated_at: expect.any(String)
      });
    });

    it('should return false when upsert fails', async () => {
      const error = { message: 'Upsert failed' };
      mockQuery.single.mockResolvedValue({
        data: null,
        error
      });

      const result = await supabaseClient.setConfigValue('test-key', 'test-value');

      expect(result).toBe(false);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        'SupabaseClient.setConfigValue'
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockQuery.single.mockRejectedValue(error);

      const result = await supabaseClient.setConfigValue('test-key', 'test-value');

      expect(result).toBe(false);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'SupabaseClient.setConfigValue');
    });
  });

  describe('getConfigValue', () => {
    it('should get config value successfully', async () => {
      mockQuery.single.mockResolvedValue({
        data: { key: 'test-key', value: 'test-value' },
        error: null
      });

      const result = await supabaseClient.getConfigValue('test-key');

      expect(result).toBe('test-value');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_config');
      expect(mockTable.select).toHaveBeenCalledWith('value');
      expect(mockQuery.eq).toHaveBeenCalledWith('key', 'test-key');
      expect(mockQuery.single).toHaveBeenCalled();
    });

    it('should return null when key not found', async () => {
      const error = { message: 'No rows returned', code: 'PGRST116' };
      mockQuery.single.mockResolvedValue({
        data: null,
        error
      });

      const result = await supabaseClient.getConfigValue('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should handle other query errors', async () => {
      const error = { message: 'Query failed', code: 'OTHER' };
      mockQuery.single.mockResolvedValue({
        data: null,
        error
      });

      const result = await supabaseClient.getConfigValue('test-key');

      expect(result).toBeNull();
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        'SupabaseClient.getConfigValue'
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockQuery.single.mockRejectedValue(error);

      const result = await supabaseClient.getConfigValue('test-key');

      expect(result).toBeNull();
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'SupabaseClient.getConfigValue');
    });
  });

  describe('getAllConfig', () => {
    it('should get all config successfully', async () => {
      const mockConfig = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' }
      ];

      mockTable.select.mockResolvedValue({
        data: mockConfig,
        error: null
      });

      const result = await supabaseClient.getAllConfig();

      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2'
      });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_config');
      expect(mockTable.select).toHaveBeenCalledWith('key, value');
    });

    it('should return empty object when no config found', async () => {
      mockTable.select.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await supabaseClient.getAllConfig();

      expect(result).toEqual({});
    });

    it('should handle query errors', async () => {
      const error = { message: 'Query failed' };
      mockTable.select.mockResolvedValue({
        data: null,
        error
      });

      const result = await supabaseClient.getAllConfig();

      expect(result).toEqual({});
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        expect.any(Error),
        'SupabaseClient.getAllConfig'
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockTable.select.mockRejectedValue(error);

      const result = await supabaseClient.getAllConfig();

      expect(result).toEqual({});
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'SupabaseClient.getAllConfig');
    });
  });

  describe('error handling', () => {
    it('should handle malformed data gracefully', async () => {
      // Test with malformed date strings
      const malformedEntry = {
        id: '1',
        attendanceId: 'att123',
        messageType: '30min',
        sentAt: 'invalid-date',
        expiresAt: 'invalid-date'
      };

      mockQuery.order.mockResolvedValue({
        data: [malformedEntry],
        error: null
      });

      const result = await supabaseClient.getExclusionEntries();

      // Should handle invalid dates gracefully
      expect(result).toHaveLength(1);
      expect(result[0].sentAt).toBeInstanceOf(Date);
      expect(result[0].expiresAt).toBeInstanceOf(Date);
    });

    it('should handle null data responses', async () => {
      mockQuery.order.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await supabaseClient.getExclusionEntries();

      expect(result).toEqual([]);
    });
  });
});