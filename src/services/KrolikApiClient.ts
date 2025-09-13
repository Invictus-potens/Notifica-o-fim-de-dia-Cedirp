import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  Attendance, 
  Sector, 
  ActionCard, 
  Template, 
  ApiResponse, 
  KrolikApiConfig, 
  ApiError 
} from '../models/ApiTypes';
import { RetryUtils, retryApiCall } from '../utils/RetryUtils';
import { validateKrolikApiPayload, sanitizeData } from '../utils/ValidationUtils';
import { WaitingPatient } from '../models/WaitingPatient';

export class KrolikApiClient {
  private axiosInstance: AxiosInstance;
  private config: KrolikApiConfig;

  constructor(config: KrolikApiConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Interceptor para tratamento de erros
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => this.handleApiError(error)
    );
  }

  /**
   * Trata erros da API com informações detalhadas
   */
  private handleApiError(error: any): Promise<never> {
    const apiError: ApiError = new Error(
      error.response?.data?.message || error.message || 'Erro desconhecido na API'
    );
    
    apiError.status = error.response?.status;
    apiError.code = error.response?.data?.code || error.code;
    apiError.response = error.response?.data;
    
    return Promise.reject(apiError);
  }

  /**
   * Executa requisição com retry automático usando RetryUtils
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    const result = await retryApiCall(
      async () => {
        const response = await requestFn();
        return response.data;
      },
      {
        maxRetries: retries,
        baseDelay: this.config.retryDelay,
        retryCondition: (error: any) => this.shouldRetry(error as ApiError)
      }
    );

    if (result.success) {
      return result.data!;
    } else {
      throw result.error;
    }
  }

  /**
   * Determina se deve tentar novamente baseado no tipo de erro
   */
  private shouldRetry(error: ApiError): boolean {
    // Retry em erros de rede ou servidor (5xx)
    if (!error.status) return true; // Erro de rede
    if (error.status >= 500) return true; // Erro do servidor
    if (error.status === 429) return true; // Rate limit
    if (error.status === 408) return true; // Timeout
    if (error.status === 503) return true; // Service Unavailable
    if (error.status === 502) return true; // Bad Gateway
    if (error.status === 504) return true; // Gateway Timeout
    return false;
  }

  /**
   * Delay para retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Lista atendimentos aguardando (status=1)
   */
  async listWaitingAttendances(): Promise<WaitingPatient[]> {
    console.log('👥 Listando pacientes aguardando na API CAM Krolik...');
    
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<ApiResponse<Attendance[]>>('/core/v2/api/chats/list-lite', {
        params: { status: 1 }
      })
    );

    if (!response.success || !response.data) {
      console.error('❌ Erro ao listar pacientes aguardando:', response.error);
      throw new Error(response.error || 'Falha ao listar atendimentos');
    }

    // Converter dados da API para o modelo interno
    const patients = response.data.map(attendance => this.convertToWaitingPatient(attendance));
    console.log(`👥 Encontrados ${patients.length} pacientes aguardando`);
    return patients;
  }

  /**
   * Envia cartão de ação para canal normal
   */
  async sendActionCard(chatId: string, cardId: string): Promise<boolean> {
    try {
      console.log(`📤 Enviando cartão de ação (${cardId}) para chat ${chatId}...`);
      
      // Validar payload
      const payload = { chatId, actionCardId: cardId };
      const validation = validateKrolikApiPayload(payload, 'send-action-card');
      
      if (!validation.isValid) {
        console.error('❌ Payload inválido para send-action-card:', validation.errors);
        return false;
      }

      // Sanitizar dados
      const sanitizedPayload = sanitizeData(payload);

      const response = await this.executeWithRetry(() =>
        this.axiosInstance.post<ApiResponse<any>>('/core/v2/api/chats/send-action-card', sanitizedPayload)
      );

      if (response.success) {
        console.log(`✅ Cartão de ação enviado com sucesso para chat ${chatId}`);
      } else {
        console.log(`❌ Falha ao enviar cartão de ação para chat ${chatId}`);
      }

      return response.success;
    } catch (error) {
      console.error(`❌ Erro ao enviar cartão de ação para chat ${chatId}:`, error);
      return false;
    }
  }

  /**
   * Envia template para canal API oficial
   */
  async sendTemplate(chatId: string, templateId: string): Promise<boolean> {
    try {
      // Validar payload
      const payload = { chatId, templateId };
      const validation = validateKrolikApiPayload(payload, 'send-template');
      
      if (!validation.isValid) {
        console.error('Payload inválido para send-template:', validation.errors);
        return false;
      }

      // Sanitizar dados
      const sanitizedPayload = sanitizeData(payload);

      const response = await this.executeWithRetry(() =>
        this.axiosInstance.post<ApiResponse<any>>('/core/v2/api/chats/send-template', sanitizedPayload)
      );

      return response.success;
    } catch (error) {
      console.error(`Erro ao enviar template para chat ${chatId}:`, error);
      return false;
    }
  }

  /**
   * Envia mensagem de texto simples
   */
  async sendTextMessage(chatId: string, message: string): Promise<boolean> {
    try {
      // Validar payload
      const payload = { chatId, message };
      const validation = validateKrolikApiPayload(payload, 'send-text');
      
      if (!validation.isValid) {
        console.error('Payload inválido para send-text:', validation.errors);
        return false;
      }

      // Sanitizar dados
      const sanitizedPayload = sanitizeData(payload);

      const response = await this.executeWithRetry(() =>
        this.axiosInstance.post<ApiResponse<any>>('/core/v2/api/chats/send-text', sanitizedPayload)
      );

      return response.success;
    } catch (error) {
      console.error(`Erro ao enviar mensagem de texto para chat ${chatId}:`, error);
      return false;
    }
  }

  /**
   * Lista setores disponíveis
   */
  async getSectors(): Promise<Sector[]> {
    console.log('📋 Buscando setores da API CAM Krolik...');
    
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<ApiResponse<Sector[]>>('/core/v2/api/sectors')
    );

    if (!response.success || !response.data) {
      console.error('❌ Erro ao buscar setores:', response.error);
      throw new Error(response.error || 'Falha ao listar setores');
    }

    console.log(`📋 Encontrados ${response.data.length} setores`);
    return response.data;
  }

  /**
   * Obtém um setor específico
   */
  async getSector(sectorId: string): Promise<Sector> {
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<ApiResponse<Sector>>(`/core/v2/api/sectors/${sectorId}`)
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Falha ao obter setor');
    }

    return response.data;
  }

  /**
   * Lista cartões de ação disponíveis
   */
  async getActionCards(): Promise<ActionCard[]> {
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<ApiResponse<ActionCard[]>>('/core/v2/api/action-cards')
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Falha ao listar cartões de ação');
    }

    return response.data;
  }

  /**
   * Obtém um cartão de ação específico
   */
  async getActionCard(cardId: string): Promise<ActionCard> {
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<ApiResponse<ActionCard>>(`/core/v2/api/action-cards/${cardId}`)
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Falha ao obter cartão de ação');
    }

    return response.data;
  }

  /**
   * Lista templates disponíveis
   */
  async getTemplates(): Promise<Template[]> {
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<ApiResponse<Template[]>>('/core/v2/api/action-cards/templates')
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Falha ao listar templates');
    }

    return response.data;
  }

  /**
   * Obtém um template específico
   */
  async getTemplate(templateId: string): Promise<Template> {
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<ApiResponse<Template>>(`/core/v2/api/action-cards/templates/${templateId}`)
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Falha ao obter template');
    }

    return response.data;
  }

  /**
   * Converte dados da API para o modelo interno WaitingPatient
   */
  private convertToWaitingPatient(attendance: Attendance): WaitingPatient {
    const waitStartTime = new Date(attendance.waitStartTime);
    const now = new Date();
    const waitTimeMinutes = Math.floor((now.getTime() - waitStartTime.getTime()) / (1000 * 60));

    return {
      id: attendance.id,
      name: attendance.name,
      phone: attendance.phone,
      sectorId: attendance.sectorId,
      sectorName: attendance.sectorName,
      channelId: attendance.channelId,
      channelType: attendance.channelType,
      waitStartTime,
      waitTimeMinutes
    };
  }

  /**
   * Testa conectividade com a API
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testando conectividade com API CAM Krolik...');
      console.log(`📡 URL: ${this.config.baseUrl}`);
      console.log(`🔑 Token: ${this.config.apiToken ? 'Configurado' : 'NÃO CONFIGURADO'}`);
      
      const response = await this.executeWithRetry(() =>
        this.axiosInstance.get('/core/v2/api/health')
      );
      
      console.log('✅ API CAM Krolik conectada com sucesso!');
      console.log(`📊 Status: ${response.status}`);
      return true;
    } catch (error) {
      console.error('❌ Falha no teste de conectividade com API CAM Krolik:');
      console.error(`   Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      console.error(`   URL: ${this.config.baseUrl}/core/v2/api/health`);
      return false;
    }
  }

  /**
   * Atualiza token de autenticação
   */
  updateApiToken(newToken: string): void {
    this.config.apiToken = newToken;
    this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${newToken}`;
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): Readonly<KrolikApiConfig> {
    return { ...this.config };
  }
}

/**
 * Factory function para criar instância do cliente
 */
export function createKrolikApiClient(config: Partial<KrolikApiConfig>): KrolikApiClient {
  const defaultConfig: KrolikApiConfig = {
    baseUrl: process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com',
    apiToken: process.env.KROLIK_API_TOKEN || '',
    timeout: 10000, // 10 segundos
    maxRetries: 3,
    retryDelay: 1000 // 1 segundo
  };

  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.apiToken) {
    throw new Error('Token da API é obrigatório');
  }

  return new KrolikApiClient(finalConfig);
}