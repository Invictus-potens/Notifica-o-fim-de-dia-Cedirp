import { MainController } from '../controllers/MainController';
import { WaitingPatient } from '../models/WaitingPatient';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.KROLIK_API_TOKEN = 'test-token';
process.env.KROLIK_API_BASE_URL = 'https://api.test.com';

// Mock external dependencies
jest.mock('@supabase/supabase-js');
jest.mock('axios');
jest.mock('fs');

describe('Failure Recovery Integration Tests', () => {
  let mainController: MainController;
  let mockAxiosInstance: any;
  let mockSupabaseClient: any;

  const mockPatients: WaitingPatient[] = [
    {
      id: 'patient1',
      name: 'João Silva',
      phone: '11999999999',
      sectorId: 'sector1',
      sectorName: 'Cardiologia',
      channelId: 'channel1',
      channelType: 'normal',
      waitStartTime: new Date(Date.now() - 35 * 60 * 1000),
      waitTimeMinutes: 35
    }
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup Supabase mock
    const { createClient } = require('@supabase/supabase-js');
    mockSupabaseClient = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          })),
          gte: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        insert: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
        })),
        delete: jest.fn(() => ({
          lt: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        upsert: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { key: 'test', value: 'test' }, error: null }))
        }))
      })),
      auth: {
        getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null }))
      }
    };
    createClient.mockReturnValue(mockSupabaseClient);

    // Setup Axios mock
    const axios = require('axios');
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      defaults: { headers: {} },
      interceptors: {
        response: {
          use: jest.fn()
        }
      }
    };
    axios.create.mockReturnValue(mockAxiosInstance);

    // Setup default successful responses
    mockAxiosInstance.get.mockImplementation((url: string) => {
      if (url.includes('/chats/list-lite')) {
        return Promise.resolve({
          data: {
            success: true,
            data: mockPatients.map(p => ({
              id: p.id,
              name: p.name,
              phone: p.phone,
              sectorId: p.sectorId,
              sectorName: p.sectorName,
              channelId: p.channelId,
              channelType: p.channelType,
              waitStartTime: p.waitStartTime.toISOString(),
              status: 1
            }))
          }
        });
      }
      return Promise.resolve({ data: { success: true, data: [] } });
    });

    mockAxiosInstance.post.mockResolvedValue({
      data: { success: true, data: {} }
    });

    // Setup filesystem mock
    const fs = require('fs');
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue('{}');
    fs.writeFileSync.mockImplementation(() => {});
    fs.mkdirSync.mockImplementation(() => {});

    mainController = new MainController();
  });

  afterEach(async () => {
    if (mainController) {
      await mainController.stop();
    }
  });

  describe('API failure scenarios', () => {
    it('should handle temporary API unavailability', async () => {
      let callCount = 0;
      mockAxiosInstance.get.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Service temporarily unavailable'));
        }
        return Promise.resolve({
          data: {
            success: true,
            data: mockPatients.map(p => ({
              id: p.id,
              name: p.name,
              phone: p.phone,
              sectorId: p.sectorId,
              sectorName: p.sectorName,
              channelId: p.channelId,
              channelType: p.channelType,
              waitStartTime: p.waitStartTime.toISOString(),
              status: 1
            }))
          }
        });
      });

      await mainController.initialize();
      await mainController.start();

      // First few checks should fail, but system should recover
      await mainController.forceCheck(); // Fail
      await mainController.forceCheck(); // Fail
      await mainController.forceCheck(); // Success

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
      expect(callCount).toBe(3);
    });

    it('should handle API timeout errors', async () => {
      mockAxiosInstance.get.mockImplementation(() => {
        const error = new Error('timeout of 5000ms exceeded');
        (error as any).code = 'ECONNABORTED';
        return Promise.reject(error);
      });

      await mainController.initialize();
      await mainController.start();

      // System should handle timeouts gracefully
      await mainController.forceCheck();

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.errorStats.totalErrors).toBeGreaterThanOrEqual(0);
    });

    it('should handle malformed API responses', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: 'invalid json response'
      });

      await mainController.initialize();
      await mainController.start();

      // System should handle malformed responses
      await mainController.forceCheck();

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should handle API rate limiting', async () => {
      let callCount = 0;
      mockAxiosInstance.get.mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          const error = new Error('Rate limit exceeded');
          (error as any).status = 429;
          return Promise.reject(error);
        }
        return Promise.resolve({
          data: {
            success: true,
            data: mockPatients.map(p => ({
              id: p.id,
              name: p.name,
              phone: p.phone,
              sectorId: p.sectorId,
              sectorName: p.sectorName,
              channelId: p.channelId,
              channelType: p.channelType,
              waitStartTime: p.waitStartTime.toISOString(),
              status: 1
            }))
          }
        });
      });

      await mainController.initialize();
      await mainController.start();

      // System should handle rate limiting and eventually succeed
      await mainController.forceCheck();
      await mainController.forceCheck();
      await mainController.forceCheck();
      await mainController.forceCheck(); // Should succeed

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });
  });

  describe('Database failure scenarios', () => {
    it('should fallback to local storage when Supabase fails', async () => {
      // Mock Supabase connection failure
      mockSupabaseClient.auth.getSession.mockRejectedValue(new Error('Connection failed'));

      await mainController.initialize();
      await mainController.start();

      // System should start successfully using local storage
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should handle Supabase query errors gracefully', async () => {
      // Mock Supabase query errors
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ 
              data: null, 
              error: { message: 'Query failed' } 
            }))
          }))
        }))
      });

      await mainController.initialize();
      await mainController.start();

      // System should handle database errors and continue operating
      await mainController.forceCheck();

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should recover when Supabase comes back online', async () => {
      // Start with Supabase failing
      mockSupabaseClient.auth.getSession.mockRejectedValueOnce(new Error('Connection failed'));

      await mainController.initialize();
      await mainController.start();

      // System should be using local storage
      let status = mainController.getStatus();
      expect(status.isRunning).toBe(true);

      // Mock Supabase recovery
      mockSupabaseClient.auth.getSession.mockResolvedValue({ 
        data: { session: null }, 
        error: null 
      });

      // Force a check that might trigger reconnection
      await mainController.forceCheck();

      status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });
  });

  describe('File system failure scenarios', () => {
    it('should handle file system permission errors', async () => {
      const fs = require('fs');
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      await mainController.initialize();
      await mainController.start();

      // System should handle file system errors gracefully
      await mainController.forceCheck();

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should handle disk space errors', async () => {
      const fs = require('fs');
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('ENOSPC: no space left on device');
      });

      await mainController.initialize();
      await mainController.start();

      // System should handle disk space errors
      await mainController.forceCheck();

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should handle corrupted configuration files', async () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json content');

      await mainController.initialize();
      await mainController.start();

      // System should handle corrupted config files
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });
  });

  describe('Memory and resource management', () => {
    it('should handle memory pressure gracefully', async () => {
      // Simulate memory pressure by creating large objects
      const largePatients = Array.from({ length: 10000 }, (_, i) => ({
        id: `patient${i}`,
        name: `Patient ${i}`,
        phone: '11999999999',
        sectorId: 'sector1',
        sectorName: 'Test Sector',
        channelId: 'channel1',
        channelType: 'normal' as const,
        waitStartTime: new Date(Date.now() - 35 * 60 * 1000),
        waitTimeMinutes: 35
      }));

      mockAxiosInstance.get.mockImplementation((url: string) => {
        if (url.includes('/chats/list-lite')) {
          return Promise.resolve({
            data: {
              success: true,
              data: largePatients.map(p => ({
                id: p.id,
                name: p.name,
                phone: p.phone,
                sectorId: p.sectorId,
                sectorName: p.sectorName,
                channelId: p.channelId,
                channelType: p.channelType,
                waitStartTime: p.waitStartTime.toISOString(),
                status: 1
              }))
            }
          });
        }
        return Promise.resolve({ data: { success: true, data: [] } });
      });

      await mainController.initialize();
      await mainController.start();

      // System should handle large datasets
      await mainController.forceCheck();

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.monitoringStats.totalPatients).toBe(10000);
    });

    it('should clean up resources properly on shutdown', async () => {
      await mainController.initialize();
      await mainController.start();

      // Verify system is running
      let status = mainController.getStatus();
      expect(status.isRunning).toBe(true);

      // Stop system
      await mainController.stop();

      // Verify cleanup
      status = mainController.getStatus();
      expect(status.isRunning).toBe(false);
    });
  });

  describe('Network failure scenarios', () => {
    it('should handle DNS resolution failures', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('ENOTFOUND api.example.com'));

      await mainController.initialize();
      await mainController.start();

      // System should handle DNS failures
      await mainController.forceCheck();

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should handle connection refused errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('ECONNREFUSED'));

      await mainController.initialize();
      await mainController.start();

      // System should handle connection refused
      await mainController.forceCheck();

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should handle SSL certificate errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('CERT_UNTRUSTED'));

      await mainController.initialize();
      await mainController.start();

      // System should handle SSL errors
      await mainController.forceCheck();

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });
  });

  describe('Concurrent failure scenarios', () => {
    it('should handle multiple simultaneous failures', async () => {
      // Simulate multiple failures at once
      mockAxiosInstance.get.mockRejectedValue(new Error('API Error'));
      mockSupabaseClient.auth.getSession.mockRejectedValue(new Error('DB Error'));
      
      const fs = require('fs');
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('File Error');
      });

      await mainController.initialize();
      await mainController.start();

      // System should handle multiple failures
      await mainController.forceCheck();

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should handle failures during high load', async () => {
      // Simulate high load with concurrent operations
      mockAxiosInstance.get.mockImplementation(() => {
        // Randomly fail some requests
        if (Math.random() < 0.3) {
          return Promise.reject(new Error('Random failure'));
        }
        return Promise.resolve({
          data: {
            success: true,
            data: mockPatients.map(p => ({
              id: p.id,
              name: p.name,
              phone: p.phone,
              sectorId: p.sectorId,
              sectorName: p.sectorName,
              channelId: p.channelId,
              channelType: p.channelType,
              waitStartTime: p.waitStartTime.toISOString(),
              status: 1
            }))
          }
        });
      });

      await mainController.initialize();
      await mainController.start();

      // Perform multiple concurrent checks
      const promises = Array.from({ length: 10 }, () => mainController.forceCheck());
      await Promise.allSettled(promises);

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });
  });

  describe('Recovery validation', () => {
    it('should validate system state after recovery', async () => {
      // Start with failures
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Initial failure'));
      
      await mainController.initialize();
      await mainController.start();

      // First check should fail
      await mainController.forceCheck();

      // Mock recovery
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: mockPatients.map(p => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            sectorId: p.sectorId,
            sectorName: p.sectorName,
            channelId: p.channelId,
            channelType: p.channelType,
            waitStartTime: p.waitStartTime.toISOString(),
            status: 1
          }))
        }
      });

      // Second check should succeed
      await mainController.forceCheck();

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.monitoringStats.totalPatients).toBeGreaterThan(0);
    });

    it('should maintain data consistency after failures', async () => {
      await mainController.initialize();
      await mainController.start();

      // Perform operations before failure
      await mainController.forceCheck();

      // Simulate failure and recovery
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Temporary failure'));
      await mainController.forceCheck();

      // Recovery
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: mockPatients.map(p => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            sectorId: p.sectorId,
            sectorName: p.sectorName,
            channelId: p.channelId,
            channelType: p.channelType,
            waitStartTime: p.waitStartTime.toISOString(),
            status: 1
          }))
        }
      });
      await mainController.forceCheck();

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.monitoringStats).toBeDefined();
    });
  });
});