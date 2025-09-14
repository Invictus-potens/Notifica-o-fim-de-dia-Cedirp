import { KrolikApiClient } from '../services/KrolikApiClient';
import { ChatListRequest, ChatListResponse } from '../models/ApiTypes';

// Mock do axios
const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
  defaults: {
    headers: {}
  },
  interceptors: {
    response: {
      use: jest.fn()
    }
  }
};

jest.mock('axios', () => ({
  create: () => mockAxiosInstance
}));

describe('KrolikApiClient - Updated API Format', () => {
  let client: KrolikApiClient;

  beforeEach(() => {
    client = new KrolikApiClient({
      baseUrl: 'https://api.camkrolik.com.br',
      apiToken: 'test-token',
      timeout: 10000,
      maxRetries: 3,
      retryDelay: 1000
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listWaitingAttendances', () => {
    it('should use POST method with correct payload format', async () => {
      const mockAttendances = [
        {
          id: '1',
          name: 'João Silva',
          phone: '11999999999',
          sectorId: '65eb5a0e681c0098402e5839',
          sectorName: 'Ressonância Magnética',
          channelId: 'channel1',
          channelType: 'normal' as const,
          waitStartTime: '2024-01-01T10:00:00Z',
          status: 1
        }
      ];

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          data: mockAttendances
        }
      });

      await client.listWaitingAttendances();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/core/v2/api/chats/list-lite',
        {
          typeChat: 2,
          status: 1,
          dateFilters: {},
          page: 0
        },
        {
          headers: {
            'Content-Type': 'application/json-patch+json'
          }
        }
      );
    });

    it('should use correct headers', () => {
      expect(client.getConfig().apiToken).toBe('test-token');
    });
  });

  describe('listChatsWithFilters', () => {
    it('should use POST method with custom filters', async () => {
      const mockResponse: ChatListResponse = {
        data: [
          {
            id: '1',
            name: 'João Silva',
            phone: '11999999999',
            sectorId: '65eb5a0e681c0098402e5839',
            sectorName: 'Ressonância Magnética',
            channelId: 'channel1',
            channelType: 'normal' as const,
            waitStartTime: '2024-01-01T10:00:00Z',
            status: 1
          }
        ],
        total: 1,
        page: 0,
        totalPages: 1
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse
        }
      });

      const options: Partial<ChatListRequest> = {
        typeChat: 2,
        status: 1,
        dateFilters: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        page: 0,
        limit: 50
      };

      const result = await client.listChatsWithFilters(options);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/core/v2/api/chats/list-lite',
        {
          typeChat: 2,
          status: 1,
          dateFilters: {
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          },
          page: 0,
          limit: 50
        },
        {
          headers: {
            'Content-Type': 'application/json-patch+json'
          }
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should use default values when no options provided', async () => {
      const mockResponse: ChatListResponse = {
        data: [],
        total: 0,
        page: 0
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse
        }
      });

      await client.listChatsWithFilters();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/core/v2/api/chats/list-lite',
        {
          typeChat: 2,
          status: 1,
          dateFilters: {},
          page: 0,
          limit: 100
        },
        {
          headers: {
            'Content-Type': 'application/json-patch+json'
          }
        }
      );
    });
  });

  describe('authentication headers', () => {
    it('should use access-token header instead of Authorization', () => {
      const config = client.getConfig();
      expect(config.apiToken).toBe('test-token');
    });

    it('should update access-token when token is updated', () => {
      const newToken = 'new-test-token';
      client.updateApiToken(newToken);
      
      expect(client.getConfig().apiToken).toBe(newToken);
    });
  });
});
