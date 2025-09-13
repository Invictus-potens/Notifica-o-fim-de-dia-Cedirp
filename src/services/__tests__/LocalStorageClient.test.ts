import * as fs from 'fs';
import * as path from 'path';
import { LocalStorageClient } from '../LocalStorageClient';
import { ErrorHandler } from '../ErrorHandler';
import { ExclusionEntry } from '../../models';

// Mock fs module
jest.mock('fs');
jest.mock('../ErrorHandler');

describe('LocalStorageClient', () => {
  let localClient: LocalStorageClient;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;
  let mockFs: jest.Mocked<typeof fs>;
  const testDataDir = './test-data';

  beforeEach(() => {
    mockErrorHandler = new ErrorHandler() as jest.Mocked<ErrorHandler>;
    mockFs = fs as jest.Mocked<typeof fs>;
    localClient = new LocalStorageClient(mockErrorHandler, testDataDir);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create data directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      new LocalStorageClient(mockErrorHandler, testDataDir);
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(testDataDir, { recursive: true });
    });

    it('should not create directory if it already exists', () => {
      mockFs.existsSync.mockReturnValue(true);
      
      new LocalStorageClient(mockErrorHandler, testDataDir);
      
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should handle directory creation errors', () => {
      const error = new Error('Permission denied');
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw error;
      });
      
      new LocalStorageClient(mockErrorHandler, testDataDir);
      
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'LocalStorageClient.ensureDataDirectory');
    });
  });

  describe('addExclusionEntry', () => {
    const mockEntry: Omit<ExclusionEntry, 'id'> = {
      attendanceId: 'att123',
      messageType: '30min',
      sentAt: new Date('2023-01-01T10:00:00Z'),
      expiresAt: new Date('2023-01-02T10:00:00Z')
    };

    it('should add new exclusion entry successfully', async () => {
      const existingEntries: ExclusionEntry[] = [];
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingEntries));
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await localClient.addExclusionEntry(mockEntry);

      expect(result).toMatch(/^local_\d+_[a-z0-9]+$/);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle empty exclusion file', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await localClient.addExclusionEntry(mockEntry);

      expect(result).toMatch(/^local_\d+_[a-z0-9]+$/);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle file read errors', async () => {
      const error = new Error('File read error');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw error;
      });

      const result = await localClient.addExclusionEntry(mockEntry);

      expect(result).toBeNull();
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'LocalStorageClient.getExclusionEntries');
    });

    it('should handle file write errors', async () => {
      const error = new Error('File write error');
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {
        throw error;
      });

      const result = await localClient.addExclusionEntry(mockEntry);

      expect(result).toBeNull();
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'LocalStorageClient.addExclusionEntry');
    });
  });

  describe('getExclusionEntries', () => {
    it('should return empty array when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await localClient.getExclusionEntries();

      expect(result).toEqual([]);
    });

    it('should return valid entries and filter expired ones', async () => {
      const now = new Date();
      const validEntry = {
        id: '1',
        attendanceId: 'att123',
        messageType: '30min',
        sentAt: new Date(now.getTime() - 60000).toISOString(),
        expiresAt: new Date(now.getTime() + 60000).toISOString()
      };
      const expiredEntry = {
        id: '2',
        attendanceId: 'att456',
        messageType: '30min',
        sentAt: new Date(now.getTime() - 120000).toISOString(),
        expiresAt: new Date(now.getTime() - 60000).toISOString()
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify([validEntry, expiredEntry]));

      const result = await localClient.getExclusionEntries();

      expect(result).toHaveLength(1);
      expect(result[0].attendanceId).toBe('att123');
      expect(result[0].sentAt).toBeInstanceOf(Date);
      expect(result[0].expiresAt).toBeInstanceOf(Date);
    });

    it('should handle file read errors', async () => {
      const error = new Error('File read error');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw error;
      });

      const result = await localClient.getExclusionEntries();

      expect(result).toEqual([]);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'LocalStorageClient.getExclusionEntries');
    });
  });

  describe('cleanupExpiredEntries', () => {
    it('should remove expired entries and return count', async () => {
      const now = new Date();
      const validEntry = {
        id: '1',
        attendanceId: 'att123',
        messageType: '30min',
        sentAt: new Date(now.getTime() - 60000),
        expiresAt: new Date(now.getTime() + 60000)
      };
      const expiredEntry = {
        id: '2',
        attendanceId: 'att456',
        messageType: '30min',
        sentAt: new Date(now.getTime() - 120000),
        expiresAt: new Date(now.getTime() - 60000)
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify([validEntry, expiredEntry]));
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await localClient.cleanupExpiredEntries();

      expect(result).toBe(1);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle cleanup errors', async () => {
      const error = new Error('Cleanup error');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw error;
      });

      const result = await localClient.cleanupExpiredEntries();

      expect(result).toBe(0);
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'LocalStorageClient.cleanupExpiredEntries');
    });
  });

  describe('config operations', () => {
    describe('setConfigValue', () => {
      it('should set config value successfully', async () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify({ existing: 'value' }));
        mockFs.writeFileSync.mockImplementation(() => {});

        const result = await localClient.setConfigValue('newKey', 'newValue');

        expect(result).toBe(true);
        expect(mockFs.writeFileSync).toHaveBeenCalled();
      });

      it('should handle config write errors', async () => {
        const error = new Error('Write error');
        mockFs.existsSync.mockReturnValue(false);
        mockFs.writeFileSync.mockImplementation(() => {
          throw error;
        });

        const result = await localClient.setConfigValue('key', 'value');

        expect(result).toBe(false);
        expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'LocalStorageClient.setConfigValue');
      });
    });

    describe('getConfigValue', () => {
      it('should get config value successfully', async () => {
        const config = { testKey: 'testValue' };
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify(config));

        const result = await localClient.getConfigValue('testKey');

        expect(result).toBe('testValue');
      });

      it('should return null for non-existent key', async () => {
        const config = { otherKey: 'otherValue' };
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify(config));

        const result = await localClient.getConfigValue('nonExistentKey');

        expect(result).toBeNull();
      });

      it('should handle config read errors', async () => {
        const error = new Error('Read error');
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockImplementation(() => {
          throw error;
        });

        const result = await localClient.getConfigValue('key');

        expect(result).toBeNull();
        expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'LocalStorageClient.getAllConfig');
      });
    });

    describe('getAllConfig', () => {
      it('should return all config when file exists', async () => {
        const config = { key1: 'value1', key2: 'value2' };
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify(config));

        const result = await localClient.getAllConfig();

        expect(result).toEqual(config);
      });

      it('should return empty object when file does not exist', async () => {
        mockFs.existsSync.mockReturnValue(false);

        const result = await localClient.getAllConfig();

        expect(result).toEqual({});
      });

      it('should handle config read errors', async () => {
        const error = new Error('Read error');
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockImplementation(() => {
          throw error;
        });

        const result = await localClient.getAllConfig();

        expect(result).toEqual({});
        expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'LocalStorageClient.getAllConfig');
      });
    });
  });

  describe('isHealthy', () => {
    it('should return true when data directory exists', () => {
      mockFs.existsSync.mockReturnValue(true);

      const result = localClient.isHealthy();

      expect(result).toBe(true);
    });

    it('should return false when data directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = localClient.isHealthy();

      expect(result).toBe(false);
    });

    it('should return false when fs operations throw errors', () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('FS error');
      });

      const result = localClient.isHealthy();

      expect(result).toBe(false);
    });
  });

  describe('clearAllData', () => {
    it('should clear all data files successfully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {});

      await localClient.clearAllData();

      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(2);
    });

    it('should handle file deletion errors', async () => {
      const error = new Error('Delete error');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {
        throw error;
      });

      await localClient.clearAllData();

      expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, 'LocalStorageClient.clearAllData');
    });
  });
});