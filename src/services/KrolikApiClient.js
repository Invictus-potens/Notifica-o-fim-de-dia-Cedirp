const axios = require('axios');

class KrolikApiClient {
  constructor(baseURL = null, token = null) {
    // Suporte para dois tipos de chamada:
    // 1. new KrolikApiClient(baseURL, token) - para canais específicos
    // 2. new KrolikApiClient(config) - para compatibilidade com código existente
    
    if (typeof baseURL === 'object' && baseURL !== null) {
      // Chamada antiga: new KrolikApiClient(config)
      const config = baseURL;
      this.baseURL = config.baseURL || process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com.br';
      this.token = config.token || process.env.KROLIK_API_TOKEN;
    } else {
      // Chamada nova: new KrolikApiClient(baseURL, token)
      this.baseURL = baseURL || process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com.br';
      this.token = token || process.env.KROLIK_API_TOKEN;
    }
    
    // Contadores de API
    this.apiCalls = 0;
    this.apiSuccess = 0;
    this.apiFailures = 0;
    this.systemMetrics = null;
    
    // Cache compartilhado de setores para mapeamento de nomes (estático)
    if (!KrolikApiClient.sharedSectorsCache) {
      KrolikApiClient.sharedSectorsCache = {
        data: null,
        time: null,
        ttl: 5 * 60 * 1000 // 5 minutos
      };
    }
    
    // Configurações padrão
    const defaultConfig = {
      timeout: 10000,
      systemMetrics: null
    };
    
    // Se baseURL era um objeto (chamada antiga), usar suas configurações
    if (typeof baseURL === 'object' && baseURL !== null) {
      const config = baseURL;
      this.systemMetrics = config.systemMetrics || null;
      defaultConfig.timeout = config.timeout || 10000;
    }
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: defaultConfig.timeout,
      headers: {
        'access-token': this.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Interceptor para contar requisições
    this.setupInterceptors();
  }

  /**
   * Configura interceptors para contar requisições
   */
  setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        config.startTime = Date.now();
        this.apiCalls++;
        if (this.systemMetrics && typeof this.systemMetrics.incrementRequests === 'function') {
          this.systemMetrics.incrementRequests();
        }
        return config;
      },
      (error) => {
        this.apiFailures++;
        if (this.systemMetrics && typeof this.systemMetrics.incrementApiFailures === 'function') {
          this.systemMetrics.incrementApiFailures();
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const responseTime = Date.now() - response.config.startTime;
        this.apiSuccess++;
        if (this.systemMetrics && typeof this.systemMetrics.incrementApiSuccess === 'function') {
          this.systemMetrics.incrementApiSuccess();
          this.systemMetrics.addResponseTime(responseTime);
        }
        return response;
      },
      (error) => {
        this.apiFailures++;
        if (this.systemMetrics && typeof this.systemMetrics.incrementApiFailures === 'function') {
          this.systemMetrics.incrementApiFailures();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Define o SystemMetricsManager para contagem
   */
  setSystemMetrics(systemMetrics) {
    this.systemMetrics = systemMetrics;
  }

  /**
   * Obtém estatísticas de API
   */
  getApiStats() {
    return {
      totalCalls: this.apiCalls,
      success: this.apiSuccess,
      failures: this.apiFailures,
      successRate: this.apiCalls > 0 ? ((this.apiSuccess / this.apiCalls) * 100).toFixed(2) : 0
    };
  }

  /**
   * Lista atendimentos aguardando (status=1)
   * Rota correta: POST /core/v2/api/chats/list-lite
   */
  async listWaitingAttendances() {
    try {
      const payload = {
        typeChat: 2,
        status: 1
      };

      const response = await this.axiosInstance.post('/core/v2/api/chats/list-lite', payload, {
        headers: {
          'accept': 'application/json',
          'access-token': this.token,
          'Content-Type': 'application/json-patch+json'
        }
      });

      // Converter dados da API para o modelo interno
      const patients = await Promise.all(
        response.data.chats?.map(chat => this.convertChatToWaitingPatient(chat)) || []
      );
      console.log(`👥 Encontrados ${patients.length} pacientes aguardando`);
      return patients;
    } catch (error) {
      console.error('Erro ao listar atendimentos aguardando:', error.message);
      throw error;
    }
  }

  /**
   * Lista atendimentos aguardando de um canal específico
   * Rota correta: POST /core/v2/api/chats/list-lite
   */
  async listWaitingAttendancesByChannel(channelId) {
    try {
      const payload = {
        typeChat: 2,
        status: 1,
        channelId: channelId
      };

      const response = await this.axiosInstance.post('/core/v2/api/chats/list-lite', payload, {
        headers: {
          'accept': 'application/json',
          'access-token': this.token,
          'Content-Type': 'application/json-patch+json'
        }
      });

      // Converter dados da API para o modelo interno
      const patients = await Promise.all(
        response.data.chats?.map(chat => this.convertChatToWaitingPatient(chat)) || []
      );
      console.log(`👥 Canal ${channelId}: ${patients.length} pacientes aguardando`);
      return patients;
    } catch (error) {
      console.error(`Erro ao listar atendimentos do canal ${channelId}:`, error.message);
      throw error;
    }
  }

  /**
   * Lista setores disponíveis
   * Rota correta: GET /core/v2/api/sectors
   */
  async listSectors() {
    try {
      const response = await this.axiosInstance.get('/core/v2/api/sectors');
      console.log(`🏥 Encontrados ${response.data.length} setores`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar setores:', error.message);
      throw error;
    }
  }

  /**
   * Lista cartões de ação
   * Rota correta: GET /core/v2/api/action-cards
   */
  async listActionCards() {
    try {
      const response = await this.axiosInstance.get('/core/v2/api/action-cards');
      console.log(`📋 Encontrados ${response.data.length} cartões de ação`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar cartões de ação:', error.message);
      throw error;
    }
  }

  /**
   * Lista canais disponíveis
   * Rota correta: GET /core/v2/api/channel/list
   */
  async listChannels() {
    try {
      const response = await this.axiosInstance.get('/core/v2/api/channel/list');
      console.log(`📱 Encontrados ${response.data.length} canais`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar canais:', error.message);
      throw error;
    }
  }

  /**
   * Envia cartão de ação
   * Rota correta: POST /core/v2/api/chats/send-action-card
   * Segue o modelo do curl fornecido
   */
  async sendActionCard(payload) {
    try {
      // Validar payload obrigatório
      if (!payload.number || !payload.contactId || !payload.action_card_id) {
        throw new Error('Payload incompleto: number, contactId e action_card_id são obrigatórios');
      }

      // Preparar payload seguindo exatamente o modelo do curl
      const requestPayload = {
        number: payload.number,
        contactId: payload.contactId,
        action_card_id: payload.action_card_id,
        forceSend: payload.forceSend !== undefined ? payload.forceSend : true
      };

      console.log(`📤 Enviando action card para ${payload.number}:`, requestPayload);

      const response = await this.axiosInstance.post('/core/v2/api/chats/send-action-card', requestPayload, {
        headers: {
          'accept': 'application/json',
          'access-token': this.token,
          'Content-Type': 'application/json-patch+json'
        }
      });

      console.log(`📤 Cartão de ação enviado com sucesso para ${payload.number}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao enviar cartão de ação para ${payload.number}:`, error.message);
      if (error.response) {
        console.error('📋 Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  }

  /**
   * Converte dados da API para modelo interno de WaitingPatient
   */
  async convertChatToWaitingPatient(chat) {
    // Calcular tempo de espera baseado no tempo total em espera (em segundos)
    const waitTimeSeconds = chat.timeInWaiting || 0;
    const waitTimeMinutes = Math.floor(waitTimeSeconds / 60);
    
    // Determinar tipo de canal baseado no tipo numérico
    const channelTypeMap = {
      1: 'WhatsApp Pessoal',
      2: 'WhatsApp Business', 
      3: 'WhatsApp Business API',
      4: 'WhatsApp Business (Principal)',
      5: 'Telegram',
      6: 'Instagram',
      7: 'Facebook Messenger',
      8: 'SMS',
      9: 'Email',
      10: 'API Externa'
    };

    // Buscar nome do setor usando cache
    const sectorName = await this.getSectorName(chat.sectorId);

    return {
      id: chat.attendanceId, // ID do atendimento
      contactId: chat.contact?.id || '', // ID do contato (para envio de mensagens)
      name: chat.contact?.name || chat.description || 'Nome não informado',
      phone: chat.contact?.number || '',
      sectorId: chat.sectorId || '',
      sectorName: sectorName,
      channelId: chat.channel?.id || '',
      channelType: channelTypeMap[chat.channel?.type] || 'normal',
      waitStartTime: chat.utcDhStartChat ? new Date(chat.utcDhStartChat) : null,
      waitTimeMinutes: waitTimeMinutes,
      status: 'waiting'
    };
  }

  /**
   * Busca o nome do setor baseado no ID usando cache compartilhado
   */
  async getSectorName(sectorId) {
    if (!sectorId) return 'Setor não informado';
    
    try {
      // Verificar se cache compartilhado está válido
      if (!KrolikApiClient.sharedSectorsCache.data || !KrolikApiClient.sharedSectorsCache.time || 
          (Date.now() - KrolikApiClient.sharedSectorsCache.time) > KrolikApiClient.sharedSectorsCache.ttl) {
        await this.loadSectorsCache();
      }
      
      // Buscar setor no cache compartilhado
      const sector = KrolikApiClient.sharedSectorsCache.data.find(s => s.id === sectorId);
      return sector ? sector.name : `Setor ${sectorId}`;
      
    } catch (error) {
      console.error('Erro ao buscar nome do setor:', error.message);
      return `Setor ${sectorId}`;
    }
  }

  /**
   * Carrega cache compartilhado de setores da API
   */
  async loadSectorsCache() {
    try {
      const response = await this.axiosInstance.get('/core/v2/api/sectors');
      KrolikApiClient.sharedSectorsCache.data = response.data;
      KrolikApiClient.sharedSectorsCache.time = Date.now();
      console.log(`📋 Cache compartilhado de setores atualizado: ${response.data.length} setores`);
    } catch (error) {
      console.error('Erro ao carregar cache de setores:', error.message);
      KrolikApiClient.sharedSectorsCache.data = [];
    }
  }

  /**
   * Calcula tempo de espera em minutos
   */
  calculateWaitTimeMinutes(startTime) {
    const now = new Date();
    const diffMs = now - startTime;
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * Lista Action Cards disponíveis
   * Rota correta: GET /core/v2/api/action-cards
   */
  async listActionCards() {
    try {
      const response = await this.axiosInstance.get('/core/v2/api/action-cards');
      console.log(`🃏 Encontrados ${response.data.length} Action Cards`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar Action Cards:', error.message);
      throw error;
    }
  }

  /**
   * Testa conexão com a API
   */
  async testConnection() {
    try {
      await this.axiosInstance.get('/core/v2/api/channel/list');
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão:', error.message);
      return false;
    }
  }
}

module.exports = { KrolikApiClient };
