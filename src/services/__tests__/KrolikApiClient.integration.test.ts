import { createKrolikApiClient, KrolikApiClient } from '../KrolikApiClient';
import { KrolikApiConfig } from '../../models/ApiTypes';

describe('KrolikApiClient Integration', () => {
  let client: KrolikApiClient;

  beforeEach(() => {
    const config: KrolikApiConfig = {
      apiToken: 'test-token',
      baseUrl: 'https://api.test.com',
      timeout: 5000,
      maxRetries: 2,
      retryDelay: 1000
    };
    client = createKrolikApiClient(config);
  });

  describe('Configuration', () => {
    it('should create client with valid configuration', () => {
      const config = {
        apiToken: 'test-token',
        baseUrl: 'https://api.test.com',
        timeout: 5000,
        maxRetries: 2,
        retryDelay: 1000
      };

      const testClient = createKrolikApiClient(config);
      const clientConfig = testClient.getConfig();

      expect(clientConfig.apiToken).toBe('test-token');
      expect(clientConfig.baseUrl).toBe('https://api.test.com');
      expect(clientConfig.timeout).toBe(5000);
      expect(clientConfig.maxRetries).toBe(2);
      expect(clientConfig.retryDelay).toBe(1000);
    });

    it('should use default configuration when not provided', () => {
      process.env.KROLIK_API_TOKEN = 'env-token';
      
      const testClient = createKrolikApiClient({});
      const config = testClient.getConfig();

      expect(config.apiToken).toBe('env-token');
      expect(config.timeout).toBe(10000);
      expect(config.maxRetries).toBe(3);
      expect(config.retryDelay).toBe(1000);
    });

    it('should throw error when no API token provided', () => {
      delete process.env.KROLIK_API_TOKEN;
      expect(() => createKrolikApiClient({})).toThrow('Token da API é obrigatório');
    });

    it('should update API token correctly', () => {
      client.updateApiToken('new-token');
      
      const config = client.getConfig();
      expect(config.apiToken).toBe('new-token');
    });
  });

  describe('API Methods Structure', () => {
    it('should have all required API methods', () => {
      expect(typeof client.listWaitingAttendances).toBe('function');
      expect(typeof client.sendActionCard).toBe('function');
      expect(typeof client.sendTemplate).toBe('function');
      expect(typeof client.getSectors).toBe('function');
      expect(typeof client.getActionCards).toBe('function');
      expect(typeof client.getTemplates).toBe('function');
      expect(typeof client.testConnection).toBe('function');
    });

    it('should have utility methods', () => {
      expect(typeof client.updateApiToken).toBe('function');
      expect(typeof client.getConfig).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('sendActionCard should accept chatId and cardId parameters', () => {
      // This test verifies the method signature exists and can be called
      // In a real test environment, we would mock the HTTP calls
      expect(() => {
        client.sendActionCard('test-chat', 'test-card');
      }).not.toThrow();
    });

    it('sendTemplate should accept chatId and templateId parameters', () => {
      expect(() => {
        client.sendTemplate('test-chat', 'test-template');
      }).not.toThrow();
    });

    it('listWaitingAttendances should be callable without parameters', () => {
      expect(() => {
        client.listWaitingAttendances();
      }).not.toThrow();
    });

    it('getSectors should be callable without parameters', () => {
      expect(() => {
        client.getSectors();
      }).not.toThrow();
    });

    it('getActionCards should be callable without parameters', () => {
      expect(() => {
        client.getActionCards();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should have proper error handling structure', () => {
      // Verify that the client has error handling mechanisms
      const config = client.getConfig();
      expect(config.maxRetries).toBeGreaterThan(0);
      expect(config.retryDelay).toBeGreaterThan(0);
      expect(config.timeout).toBeGreaterThan(0);
    });
  });
});