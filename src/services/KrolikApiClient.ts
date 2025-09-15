import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  Attendance, 
  Sector, 
  ActionCard, 
  Template, 
  ApiResponse, 
  KrolikApiConfig, 
  ApiError,
  ChatListRequest,
  ChatListResponse,
  ChatApiResponse,
  ChatData,
  Channel,
  ChannelListResponse
} from '../models/ApiTypes';
import { RetryUtils, retryApiCall } from '../utils/RetryUtils';
import { validateKrolikApiPayload, sanitizeData } from '../utils/ValidationUtils';
import { WaitingPatient } from '../models/WaitingPatient';
import { SECTORS_DATA, getSectorById, getAllSectors, sectorExists } from '../data/sectors';
import { shouldUseStaticData, isLoggingEnabled } from '../config/sectors';

export class KrolikApiClient {
  private axiosInstance: AxiosInstance;
  private config: KrolikApiConfig;

  constructor(config: KrolikApiConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'access-token': config.apiToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
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
    try {
      const result = await retryApiCall(
        async () => {
          try {
            const response = await requestFn();
            console.log(`📡 Status HTTP: ${response.status} ${response.statusText}`);
            console.log(`📡 Headers da resposta:`, response.headers);
            return response.data;
          } catch (error: any) {
            console.error(`❌ Erro na requisição HTTP:`, {
              message: error.message,
              code: error.code,
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              config: {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
              }
            });
            throw error;
          }
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
        console.error(`❌ Erro no retry:`, result.error);
        throw result.error;
      }
    } catch (error: any) {
      console.error(`❌ Erro final no executeWithRetry:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      throw error;
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
    
    const payload = {
      sectorId: "", // Buscar em todos os setores
      userId: "", // Buscar para todos os usuários
      number: "", // Buscar todos os números
      contactId: "", // Buscar todos os contatos
      protocol: "", // Buscar todos os protocolos
      typeChat: 2,
      status: 1, // Status 1 conforme schema fornecido
      dateFilters: {},
      page: 0
    };

    const response = await this.executeWithRetry(() =>
      this.axiosInstance.post<ChatApiResponse>('/core/v2/api/chats/list-lite', payload, {
        headers: {
          'Content-Type': 'application/json-patch+json'
        }
      })
    );

    // Log da resposta para debug (removido para produção)
    // console.log('🔍 Resposta da API:', JSON.stringify(response, null, 2));

    // Verificar se a resposta tem a estrutura esperada
    if (!response) {
      console.error('❌ Resposta inválida da API:', response);
      throw new Error('Resposta inválida da API');
    }

    // A API retorna diretamente os dados sem wrapper success/data
    if (!response.chats || !Array.isArray(response.chats)) {
      console.error('❌ Dados inválidos na resposta:', response);
      throw new Error('Dados inválidos na resposta da API');
    }

    // Converter dados da API para o modelo interno
    const patients = response.chats.map(chat => this.convertChatToWaitingPatient(chat));
    console.log(`👥 Encontrados ${patients.length} pacientes aguardando`);
    return patients;
  }

  /**
   * Lista chats com filtros avançados e paginação
   */
  async listChatsWithFilters(options: Partial<ChatListRequest> = {}): Promise<ChatListResponse> {
    console.log('👥 Listando chats com filtros avançados...');
    
    const payload: ChatListRequest = {
      typeChat: options.typeChat || 2,
      status: options.status || 1,
      dateFilters: options.dateFilters || {},
      page: options.page || 0,
      limit: options.limit || 100
    };

    const response = await this.executeWithRetry(() =>
      this.axiosInstance.post<ChatApiResponse>('/core/v2/api/chats/list-lite', payload, {
        headers: {
          'Content-Type': 'application/json-patch+json'
        }
      })
    );

    // Verificar se a resposta tem a estrutura esperada
    if (!response) {
      console.error('❌ Resposta inválida da API:', response);
      throw new Error('Resposta inválida da API');
    }

    // A API retorna diretamente os dados sem wrapper success/data
    if (!response.chats || !Array.isArray(response.chats)) {
      console.error('❌ Dados inválidos na resposta:', response);
      throw new Error('Dados inválidos na resposta da API');
    }

    // Converter dados da API para o modelo interno
    const chats = response.chats.map(chat => this.convertChatToWaitingPatient(chat));
    
    const result: ChatListResponse = {
      data: chats,
      total: response.totalAmountChats || chats.length,
      page: response.curPage || 0,
      totalPages: response.amountPage || 1
    };

    console.log(`👥 Encontrados ${result.data.length} chats (página ${result.page})`);
    return result;
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
   * Envia cartão de ação usando número de telefone e contactId
   */
  async sendActionCardByPhone(number: string, contactId: string, actionCardId: string): Promise<boolean> {
    try {
      console.log(`📤 Enviando cartão de ação (${actionCardId}) para ${number} (${contactId})...`);
      
      // Formato correto da API para Action Card
      console.log(`🔍 Número original recebido: "${number}"`);
      
      // Remover código do país se presente (55) e adicionar novamente
      let phoneNumber = number;
      console.log(`🔍 Número antes da formatação: "${phoneNumber}"`);
      
      if (phoneNumber.startsWith('55')) {
        phoneNumber = phoneNumber.substring(2);
        console.log(`🔍 Número após remover código do país: "${phoneNumber}"`);
      }
      
      // Garantir que o número tenha 11 dígitos (DDD + 9 dígitos)
      if (phoneNumber.length === 10) {
        phoneNumber = phoneNumber.substring(0, 2) + '9' + phoneNumber.substring(2);
        console.log(`🔍 Número após adicionar 9: "${phoneNumber}"`);
      }
      
      console.log(`🔍 Número final formatado: "${phoneNumber}"`);
      
      const payload = { 
        number: phoneNumber, // Número de telefone formatado
        contactId: contactId, // ID do contato/chat
        action_card_id: actionCardId,
        forceSend: true,
        verifyContact: true
      };
      
      console.log(`📤 Payload para Action Card ANTES da validação:`, payload);
      
      const validation = validateKrolikApiPayload(payload, 'send-action-card-by-phone');
      console.log(`🔍 Resultado da validação:`, validation);
      
      if (!validation.isValid) {
        console.error('❌ Payload inválido para send-action-card-by-phone:', validation.errors);
        return false;
      }

      // Sanitizar dados
      const sanitizedPayload = sanitizeData(payload);
      console.log(`🧹 Payload sanitizado para Action Card:`, sanitizedPayload);
      console.log(`🔍 Comparação - ANTES da sanitização:`, JSON.stringify(payload, null, 2));
      console.log(`🔍 Comparação - DEPOIS da sanitização:`, JSON.stringify(sanitizedPayload, null, 2));

      const response = await this.executeWithRetry(() => {
        console.log(`🚀 Fazendo requisição POST para: ${this.config.baseUrl}/core/v2/api/chats/send-action-card`);
        console.log(`🚀 Headers da requisição:`, {
          'access-token': this.config.apiToken,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        });
        console.log(`🚀 Body da requisição:`, JSON.stringify(sanitizedPayload, null, 2));
        
        return this.axiosInstance.post<ApiResponse<any>>('/core/v2/api/chats/send-action-card', sanitizedPayload);
      });

      console.log(`📡 Resposta completa da API para Action Card:`, JSON.stringify(response, null, 2));

      if (response.success) {
        console.log(`✅ Cartão de ação enviado com sucesso para ${number}`);
      } else {
        console.log(`❌ Falha ao enviar cartão de ação para ${number}`);
        console.log(`❌ Detalhes da falha:`, {
          success: response.success,
          message: response.message,
          data: response.data,
          error: response.error
        });
      }

      return response.success;
    } catch (error) {
      console.error(`❌ Erro ao enviar cartão de ação para ${number}:`, error);
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
   * Envia template usando número de telefone e contactId
   */
  async sendTemplateByPhone(number: string, contactId: string, templateId: string, templateComponents: any[] = []): Promise<boolean> {
    try {
      console.log(`📤 Enviando template (${templateId}) para ${number} (${contactId})...`);
      
      // Formato correto da API para Template
      // Remover código do país se presente (55) e adicionar novamente
      let phoneNumber = number;
      if (phoneNumber.startsWith('55')) {
        phoneNumber = phoneNumber.substring(2);
      }
      // Garantir que o número tenha 11 dígitos (DDD + 9 dígitos)
      if (phoneNumber.length === 10) {
        phoneNumber = phoneNumber.substring(0, 2) + '9' + phoneNumber.substring(2);
      }
      
      const payload = { 
        number: phoneNumber, // Número de telefone formatado
        contactId: contactId, // ID do contato/chat
        templateId,
        templateComponents,
        forceSend: true,
        verifyContact: true
      };
      
      console.log(`📤 Payload para Template:`, payload);
      
      const validation = validateKrolikApiPayload(payload, 'send-template-by-phone');
      
      if (!validation.isValid) {
        console.error('❌ Payload inválido para send-template-by-phone:', validation.errors);
        return false;
      }

      // Sanitizar dados
      const sanitizedPayload = sanitizeData(payload);
      console.log(`🧹 Payload sanitizado para Template:`, sanitizedPayload);

      const response = await this.executeWithRetry(() =>
        this.axiosInstance.post<ApiResponse<any>>('/core/v2/api/chats/send-template', sanitizedPayload)
      );

      console.log(`📡 Resposta completa da API para Template:`, JSON.stringify(response, null, 2));

      if (response.success) {
        console.log(`✅ Template enviado com sucesso para ${number}`);
      } else {
        console.log(`❌ Falha ao enviar template para ${number}`);
        console.log(`❌ Detalhes da falha:`, {
          success: response.success,
          message: response.message,
          data: response.data,
          error: response.error
        });
      }

      return response.success;
    } catch (error) {
      console.error(`❌ Erro ao enviar template para ${number}:`, error);
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
    if (shouldUseStaticData()) {
      return this.getSectorsFromStaticData();
    } else {
      return this.getSectorsFromAPI();
    }
  }

  /**
   * Lista setores usando dados estáticos (mais rápido)
   */
  private async getSectorsFromStaticData(): Promise<Sector[]> {
    if (isLoggingEnabled()) {
      console.log('📋 Buscando setores (dados estáticos)...');
    }
    
    try {
      // Converter dados estáticos para o formato da API
      const sectors: Sector[] = SECTORS_DATA.map(sectorData => ({
        id: sectorData.id,
        name: sectorData.name,
        active: true // Assumir que todos estão ativos
      }));

      if (isLoggingEnabled()) {
        console.log(`📋 Encontrados ${sectors.length} setores (dados estáticos)`);
      }
      return sectors;
    } catch (error) {
      console.error('❌ Erro ao processar setores estáticos:', error);
      throw new Error('Falha ao processar setores estáticos');
    }
  }

  /**
   * Lista setores consultando a API (fallback)
   */
  private async getSectorsFromAPI(): Promise<Sector[]> {
    if (isLoggingEnabled()) {
      console.log('📋 Buscando setores da API CAM Krolik...');
    }
    
    // A API retorna um array direto, não um objeto ApiResponse
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<Sector[]>('/core/v2/api/sectors')
    );

    if (isLoggingEnabled()) {
      console.log(`📋 Encontrados ${response.length} setores`);
    }
    return response;
  }

  /**
   * Obtém um setor específico
   */
  async getSector(sectorId: string): Promise<Sector> {
    if (shouldUseStaticData()) {
      return this.getSectorFromStaticData(sectorId);
    } else {
      return this.getSectorFromAPI(sectorId);
    }
  }

  /**
   * Obtém setor usando dados estáticos (mais rápido)
   */
  private async getSectorFromStaticData(sectorId: string): Promise<Sector> {
    if (isLoggingEnabled()) {
      console.log(`📋 Buscando setor ${sectorId} (dados estáticos)...`);
    }
    
    try {
      const sectorData = getSectorById(sectorId);
      
      if (!sectorData) {
        throw new Error(`Setor com ID ${sectorId} não encontrado`);
      }

      const sector: Sector = {
        id: sectorData.id,
        name: sectorData.name,
        active: true
      };

      if (isLoggingEnabled()) {
        console.log(`📋 Setor encontrado: ${sector.name}`);
      }
      return sector;
    } catch (error) {
      console.error(`❌ Erro ao buscar setor ${sectorId}:`, error);
      throw new Error(`Falha ao obter setor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obtém setor consultando a API (fallback)
   */
  private async getSectorFromAPI(sectorId: string): Promise<Sector> {
    if (isLoggingEnabled()) {
      console.log(`📋 Buscando setor ${sectorId} da API...`);
    }
    
    // A API retorna um objeto Sector direto, não um ApiResponse
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<Sector>(`/core/v2/api/sectors/${sectorId}`)
    );

    if (isLoggingEnabled()) {
      console.log(`📋 Setor encontrado: ${response.name}`);
    }
    return response;
  }

  /**
   * Lista cartões de ação disponíveis
   */
  async getActionCards(): Promise<ActionCard[]> {
    console.log('📋 Buscando cartões de ação da API CAM Krolik...');
    
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<ActionCard[]>('/core/v2/api/action-cards', {
        headers: {
          'accept': 'application/json',
          'access-token': this.config.apiToken
        }
      })
    );

    // A API retorna diretamente os dados sem wrapper success/data
    if (!response || !Array.isArray(response)) {
      console.error('❌ Dados inválidos na resposta de action-cards:', response);
      throw new Error('Dados inválidos na resposta da API');
    }

    console.log(`📋 Encontrados ${response.length} cartões de ação`);
    return response;
  }

  /**
   * Obtém um cartão de ação específico
   */
  async getActionCard(cardId: string): Promise<ActionCard> {
    console.log(`📋 Buscando cartão de ação ${cardId} da API CAM Krolik...`);
    
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<ActionCard>(`/core/v2/api/action-cards/${cardId}`, {
        headers: {
          'accept': 'application/json',
          'access-token': this.config.apiToken
        }
      })
    );

    if (!response) {
      console.error('❌ Cartão de ação não encontrado:', cardId);
      throw new Error('Cartão de ação não encontrado');
    }

    console.log(`📋 Cartão de ação encontrado: ${response.name || response.id}`);
    return response;
  }

  /**
   * Lista templates disponíveis
   */
  async getTemplates(): Promise<Template[]> {
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<Template[]>('/core/v2/api/action-cards/templates')
    );

    // A API retorna diretamente um array de templates, não um wrapper ApiResponse
    if (!response || !Array.isArray(response)) {
      console.error('❌ Dados inválidos na resposta de templates:', response);
      throw new Error('Dados inválidos na resposta da API');
    }

    console.log(`📋 Encontrados ${response.length} templates`);
    return response;
  }

  /**
   * Obtém um template específico
   */
  async getTemplate(templateId: string): Promise<Template> {
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<Template>(`/core/v2/api/action-cards/templates/${templateId}`)
    );

    if (!response) {
      console.error('❌ Template não encontrado:', templateId);
      throw new Error('Template não encontrado');
    }

    console.log(`📋 Template encontrado: ${response.name || response.id}`);
    return response;
  }

  /**
   * Lista canais disponíveis
   */
  async getChannels(): Promise<Channel[]> {
    console.log('📋 Buscando canais da API CAM Krolik...');
    
    try {
      const response = await this.executeWithRetry(() =>
        this.axiosInstance.get<Channel[]>('/core/v2/api/channel/list', {
          headers: {
            'accept': 'application/json',
            'access-token': this.config.apiToken
          }
        })
      );

      console.log('📋 Resposta bruta da API:', JSON.stringify(response, null, 2));

      // A API retorna diretamente um array de canais
      if (!response || !Array.isArray(response)) {
        console.error('❌ Dados inválidos na resposta de channels:', response);
        throw new Error('Dados inválidos na resposta da API');
      }

      console.log(`📋 Encontrados ${response.length} canais`);
      return response;
    } catch (error) {
      console.error('❌ Erro detalhado ao buscar canais:', error);
      throw error;
    }
  }

  /**
   * Obtém um canal específico
   */
  async getChannel(channelId: string): Promise<Channel> {
    console.log(`📋 Buscando canal ${channelId} da API CAM Krolik...`);
    
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<Channel>(`/core/v2/api/channel/${channelId}`, {
        headers: {
          'accept': 'application/json',
          'access-token': this.config.apiToken
        }
      })
    );

    if (!response) {
      console.error('❌ Canal não encontrado:', channelId);
      throw new Error('Canal não encontrado');
    }

    console.log(`📋 Canal encontrado: ${response.description || response.id}`);
    return response;
  }

  /**
   * Converte dados da API para o modelo interno WaitingPatient
   */
  private convertToWaitingPatient(attendance: Attendance): WaitingPatient {
    const waitStartTime = new Date(attendance.waitStartTime);
    const now = new Date();
    const waitTimeMinutes = Math.floor((now.getTime() - waitStartTime.getTime()) / (1000 * 60));

    // Buscar nome do setor nos dados estáticos se não estiver disponível
    let sectorName = attendance.sectorName;
    if (!sectorName && attendance.sectorId) {
      const sectorData = getSectorById(attendance.sectorId);
      if (sectorData) {
        sectorName = sectorData.name;
      }
    }

    return {
      id: attendance.id,
      name: attendance.name,
      phone: attendance.phone,
      sectorId: attendance.sectorId,
      sectorName: sectorName || 'Setor não identificado',
      channelId: attendance.channelId,
      channelType: attendance.channelType,
      waitStartTime,
      waitTimeMinutes
    };
  }

  /**
   * Converte dados de chat da API para o modelo interno WaitingPatient
   */
  private convertChatToWaitingPatient(chat: ChatData): WaitingPatient {
    const waitStartTime = new Date(chat.utcDhStartChat);
    const now = new Date();
    const waitTimeMinutes = Math.floor((now.getTime() - waitStartTime.getTime()) / (1000 * 60));

    // Buscar nome do setor nos dados estáticos
    const sectorData = getSectorById(chat.sectorId);
    const sectorName = sectorData ? sectorData.name : 'Setor não identificado';
    
    // Debug: Log dos dados do chat para identificar o problema
    console.log('🔍 Debug - Dados do chat:', {
      attendanceId: chat.attendanceId,
      description: chat.description,
      secondaryDescription: chat.secondaryDescription,
      contactNumber: chat.contact?.number,
      contactId: chat.contact?.id
    });
    
    const patient: WaitingPatient = {
      id: chat.attendanceId,
      name: chat.description || chat.contact?.name || 'Nome não informado',
      phone: chat.contact?.number || chat.secondaryDescription || 'Telefone não informado',
      sectorId: chat.sectorId,
      sectorName: sectorName,
      channelId: chat.channel?.id || 'channel-unknown',
      channelType: chat.channel?.type === 4 ? 'normal' as const : 'api_oficial' as const,
      waitStartTime: waitStartTime,
      waitTimeMinutes: waitTimeMinutes
    };
    
    // Debug: Log do paciente convertido
    console.log('🔍 Debug - Paciente convertido:', {
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      source: chat.contact?.number ? 'contactNumber' : 'secondaryDescription'
    });
    
    return patient;
  }

  /**
   * Verifica se um setor existe (usando dados estáticos)
   */
  isSectorValid(sectorId: string): boolean {
    return sectorExists(sectorId);
  }

  /**
   * Obtém informações completas do setor (usando dados estáticos)
   */
  getSectorInfo(sectorId: string): { id: string; name: string; organizationId: string } | null {
    const sectorData = getSectorById(sectorId);
    if (!sectorData) {
      return null;
    }

    return {
      id: sectorData.id,
      name: sectorData.name,
      organizationId: sectorData.organizationId
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
    this.axiosInstance.defaults.headers['access-token'] = newToken;
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
    baseUrl: process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com.br',
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