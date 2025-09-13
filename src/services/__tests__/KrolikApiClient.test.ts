import { KrolikApiClient, createKrolikApiClient } from '../KrolikApiClient';
import { KrolikApiConfig } from '../../models/ApiTypes';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('KrolikApiClient', () => {
  let client: KrolikApiClient;
  let mockAxiosInstance: any;

  const testConfig: KrolikApiConfig = {
    baseUrl: 'https://api.test.com',
    apiToken: 'test-token',
    timeout: 5000,
    maxRetries: 2,
    retryDelay: 500
  };

  beforeEach(() => {
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

    mockAxios.create.mockReturnValue(mockAxiosInstance);
    client = new KrolikApiClient(testConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create axios instance with correct configuration', () => {
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: testConfig.baseUrl,
        timeout: testConfig.timeout,
        headers: {
          'Authorization': `Bearer ${testConfig.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    });

    it('should setup response interceptor for error handling', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('listWaitingAttendances', () => {
    it('should call correct endpoint with status parameter', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: '1',
              name: 'Test Patient',
              phone: '11999999999',
              sectorId: 'sector1',
              sectorName: 'Test Sector',
              channelId: 'channel1',
              channelType: 'normal',
              waitStartTime: '2023-10-01T10:00:00Z',
              status: 1
            }
          ]
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.listWaitingAttendances();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/core/v2/api/chats/list-lite', {
        params: { status: 1 }
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Patient');
    });

    it('should throw error when API returns unsuccessful response', async () => {
      const mockResponse = {
        data: {
          success: false,
          data: [],
          error: 'API Error'
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await expect(client.listWaitingAttendances()).rejects.toThrow('API Error');
    });
  });

  describe('sendActionCard', () => {
    it('should send action card to correct endpoint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {}
        }
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.sendActionCard('chat123', 'card456');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/core/v2/api/chats/send-action-card', {
        chatId: 'chat123',
        actionCardId: 'card456'
      });
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network Error'));

      const result = await client.sendActionCard('chat123', 'card456');

      expect(result).toBe(false);
    });
  });

  describe('sendTemplate', () => {
    it('should send template to correct endpoint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {}
        }
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.sendTemplate('chat123', 'template456');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/core/v2/api/chats/send-template', {
        chatId: 'chat123',
        templateId: 'template456'
      });
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network Error'));

      const result = await client.sendTemplate('chat123', 'template456');

      expect(result).toBe(false);
    });
  });

  describe('getSectors', () => {
    it('should fetch sectors from correct endpoint', async () => {
      const mockSectors = [
        { id: '1', name: 'Cardiology', active: true },
        { id: '2', name: 'Neurology', active: true }
      ];
      const mockResponse = {
        data: {
          success: true,
          data: mockSectors
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getSectors();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/core/v2/api/sectors');
      expect(result).toEqual(mockSectors);
    });
  });

  describe('getActionCards', () => {
    it('should fetch action cards from correct endpoint', async () => {
      const mockCards = [
        { id: '1', name: 'Welcome Card', content: 'Welcome!', active: true }
      ];
      const mockResponse = {
        data: {
          success: true,
          data: mockCards
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getActionCards();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/core/v2/api/action-cards');
      expect(result).toEqual(mockCards);
    });
  });

  describe('testConnection', () => {
    it('should return true on successful health check', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      const result = await client.testConnection();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/core/v2/api/health');
      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'));

      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('updateApiToken', () => {
    it('should update authorization header with new token', () => {
      const newToken = 'new-test-token';
      
      client.updateApiToken(newToken);

      expect(mockAxiosInstance.defaults.headers['Authorization']).toBe(`Bearer ${newToken}`);
    });
  });
});

describe('createKrolikApiClient factory', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.KROLIK_API_TOKEN;
    delete process.env.KROLIK_API_BASE_URL;
  });

  it('should create client with environment variables', () => {
    process.env.KROLIK_API_TOKEN = 'env-token';
    process.env.KROLIK_API_BASE_URL = 'https://env.api.com';

    const client = createKrolikApiClient({});
    const config = client.getConfig();

    expect(config.apiToken).toBe('env-token');
    expect(config.baseUrl).toBe('https://env.api.com');
  });

  it('should override defaults with provided config', () => {
    process.env.KROLIK_API_TOKEN = 'env-token';

    const customConfig = {
      timeout: 15000,
      maxRetries: 5
    };

    const client = createKrolikApiClient(customConfig);
    const config = client.getConfig();

    expect(config.timeout).toBe(15000);
    expect(config.maxRetries).toBe(5);
    expect(config.apiToken).toBe('env-token');
  });

  it('should throw error when no API token is provided', () => {
    expect(() => createKrolikApiClient({})).toThrow('Token da API é obrigatório');
  });
});