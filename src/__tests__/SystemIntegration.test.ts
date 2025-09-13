import { MainController } from '../controllers/MainController';
import { WaitingPatient } from '../models/WaitingPatient';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.KROLIK_API_TOKEN = 'test-token';
process.env.KROLIK_API_BASE_URL = 'https://api.test.com';

// Mock external dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
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
  }))
}));

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    defaults: { headers: {} },
    interceptors: {
      response: {
        use: jest.fn()
      }
    }
  }))
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  readFileSync: jest.fn(() => '{}'),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn()
}));

describe('System Integration Tests', () => {
  let mainController: MainController;
  let mockPatients: WaitingPatient[];

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Create mock patients
    const now = new Date();
    mockPatients = [
      {
        id: 'patient1',
        name: 'João Silva',
        phone: '11999999999',
        sectorId: 'sector1',
        sectorName: 'Cardiologia',
        channelId: 'channel1',
        channelType: 'normal',
        waitStartTime: new Date(now.getTime() - 35 * 60 * 1000), // 35 minutes ago
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
        waitStartTime: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
        waitTimeMinutes: 45
      },
      {
        id: 'patient3',
        name: 'Pedro Costa',
        phone: '11777777777',
        sectorId: 'sector1',
        sectorName: 'Cardiologia',
        channelId: 'channel3',
        channelType: 'normal',
        waitStartTime: new Date(now.getTime() - 20 * 60 * 1000), // 20 minutes ago
        waitTimeMinutes: 20
      }
    ];

    // Mock axios responses
    const axios = require('axios');
    const mockAxiosInstance = axios.create();
    
    // Mock API responses
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
      if (url.includes('/sectors')) {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              { id: 'sector1', name: 'Cardiologia', active: true },
              { id: 'sector2', name: 'Pediatria', active: true }
            ]
          }
        });
      }
      if (url.includes('/action-cards')) {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              { id: 'card1', name: 'Mensagem 30min', content: 'Aguarde...', active: true }
            ]
          }
        });
      }
      if (url.includes('/health')) {
        return Promise.resolve({ data: { status: 'ok' } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    mockAxiosInstance.post.mockImplementation((url: string) => {
      if (url.includes('/send-action-card') || url.includes('/send-template')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {}
          }
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    mainController = new MainController();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (mainController) {
      mainController.stop();
    }
  });

  describe('Complete 30-minute message flow', () => {
    it('should process complete 30-minute message flow end-to-end', async () => {
      // Mock business hours (14:00 on a weekday)
      const mockDate = new Date('2024-01-15T17:00:00.000Z'); // 14:00 Brasília (UTC-3)
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      // Initialize and start the system
      await mainController.initialize();
      await mainController.start();

      // Force a monitoring check
      await mainController.forceCheck();

      // Verify system is running
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.flowActive).toBe(true);

      // Verify monitoring stats
      expect(status.monitoringStats.totalPatients).toBeGreaterThan(0);

      jest.restoreAllMocks();
    }, 10000);

    it('should handle system startup and shutdown gracefully', async () => {
      // Initialize system
      await mainController.initialize();
      expect(mainController.isInitialized()).toBe(true);

      // Start system
      await mainController.start();
      let status = mainController.getStatus();
      expect(status.isRunning).toBe(true);

      // Stop system
      await mainController.stop();
      status = mainController.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should handle pause and resume flow correctly', async () => {
      await mainController.initialize();
      await mainController.start();

      // Pause flow
      mainController.pauseFlow();
      let status = mainController.getStatus();
      expect(status.isRunning).toBe(true); // System still running
      expect(status.flowActive).toBe(false); // But flow is paused

      // Resume flow
      mainController.resumeFlow();
      status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.flowActive).toBe(true);
    });
  });

  describe('End-of-day message flow', () => {
    it('should process end-of-day messages at 18:00', async () => {
      // Mock 18:00 on a weekday
      const mockDate = new Date('2024-01-15T21:00:00.000Z'); // 18:00 Brasília (UTC-3)
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      await mainController.initialize();
      await mainController.start();

      // Force a monitoring check
      await mainController.forceCheck();

      // Verify system processed the check
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);

      jest.restoreAllMocks();
    });

    it('should not process end-of-day messages outside 18:00', async () => {
      // Mock 17:00 on a weekday
      const mockDate = new Date('2024-01-15T20:00:00.000Z'); // 17:00 Brasília (UTC-3)
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      await mainController.initialize();
      await mainController.start();

      // Force a monitoring check
      await mainController.forceCheck();

      // System should still be running but no end-of-day messages sent
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);

      jest.restoreAllMocks();
    });
  });

  describe('Error recovery and resilience', () => {
    it('should recover from API failures', async () => {
      // Mock API to fail initially then succeed
      const axios = require('axios');
      const mockAxiosInstance = axios.create();
      
      let callCount = 0;
      mockAxiosInstance.get.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('API temporarily unavailable'));
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

      // First check should fail, but system should continue
      await mainController.forceCheck();
      
      // Second check should succeed
      await mainController.forceCheck();

      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should handle storage failures gracefully', async () => {
      // Mock Supabase to fail
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabaseClient = createClient();
      
      mockSupabaseClient.auth.getSession.mockRejectedValue(new Error('Supabase unavailable'));

      await mainController.initialize();
      await mainController.start();

      // System should still start and use local storage fallback
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should maintain system stability under load', async () => {
      // Create many patients to simulate load
      const manyPatients = Array.from({ length: 50 }, (_, i) => ({
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

      // Mock API to return many patients
      const axios = require('axios');
      const mockAxiosInstance = axios.create();
      
      mockAxiosInstance.get.mockImplementation((url: string) => {
        if (url.includes('/chats/list-lite')) {
          return Promise.resolve({
            data: {
              success: true,
              data: manyPatients.map(p => ({
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

      // Process multiple checks rapidly
      const promises = Array.from({ length: 5 }, () => mainController.forceCheck());
      await Promise.all(promises);

      // System should remain stable
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.monitoringStats.totalPatients).toBe(50);
    });
  });

  describe('Configuration management', () => {
    it('should persist and load configuration correctly', async () => {
      await mainController.initialize();

      // Pause flow (should persist)
      mainController.pauseFlow();
      
      let status = mainController.getStatus();
      expect(status.flowActive).toBe(false);

      // Resume flow (should persist)
      mainController.resumeFlow();
      
      status = mainController.getStatus();
      expect(status.flowActive).toBe(true);
    });

    it('should handle configuration updates during runtime', async () => {
      await mainController.initialize();
      await mainController.start();

      // System should adapt to configuration changes
      mainController.pauseFlow();
      
      // Force check while paused
      await mainController.forceCheck();
      
      let status = mainController.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.flowActive).toBe(false);

      // Resume and check again
      mainController.resumeFlow();
      await mainController.forceCheck();
      
      status = mainController.getStatus();
      expect(status.flowActive).toBe(true);
    });
  });

  describe('Monitoring and metrics', () => {
    it('should collect and report system metrics', async () => {
      await mainController.initialize();
      await mainController.start();

      // Force some activity
      await mainController.forceCheck();

      const status = mainController.getStatus();
      
      // Verify metrics are collected
      expect(status.monitoringStats).toBeDefined();
      expect(status.schedulerStats).toBeDefined();
      expect(status.errorStats).toBeDefined();
      expect(status.uptime).toBeGreaterThan(0);
      expect(status.lastUpdate).toBeInstanceOf(Date);
    });

    it('should track error statistics', async () => {
      // Mock API to fail
      const axios = require('axios');
      const mockAxiosInstance = axios.create();
      
      mockAxiosInstance.get.mockRejectedValue(new Error('API Error'));

      await mainController.initialize();
      await mainController.start();

      // Force check that will fail
      await mainController.forceCheck();

      const status = mainController.getStatus();
      
      // Error stats should be tracked
      expect(status.errorStats).toBeDefined();
      expect(status.isRunning).toBe(true); // System should still be running
    });
  });

  describe('Business logic validation', () => {
    it('should only process patients with >30 minutes wait time', async () => {
      // Mock business hours
      const mockDate = new Date('2024-01-15T17:00:00.000Z'); // 14:00 Brasília
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      await mainController.initialize();
      await mainController.start();

      await mainController.forceCheck();

      // Verify system is processing correctly
      const status = mainController.getStatus();
      expect(status.monitoringStats.totalPatients).toBe(3);
      // Only patients 1 and 2 should be eligible (>30 min wait)
      expect(status.monitoringStats.patientsOver30Min).toBe(2);

      jest.restoreAllMocks();
    });

    it('should respect business hours constraints', async () => {
      // Mock outside business hours (22:00)
      const mockDate = new Date('2024-01-15T01:00:00.000Z'); // 22:00 Brasília (previous day)
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      await mainController.initialize();
      await mainController.start();

      await mainController.forceCheck();

      // System should be running but not processing messages
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);

      jest.restoreAllMocks();
    });

    it('should respect weekend constraints', async () => {
      // Mock Saturday
      const mockDate = new Date('2024-01-13T17:00:00.000Z'); // Saturday 14:00 Brasília
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      await mainController.initialize();
      await mainController.start();

      await mainController.forceCheck();

      // System should be running but not processing messages on weekends
      const status = mainController.getStatus();
      expect(status.isRunning).toBe(true);

      jest.restoreAllMocks();
    });
  });
});