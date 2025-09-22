/**
 * @typedef {Object} SystemConfig
 * @property {boolean} flowPaused - Se o fluxo está pausado
 * @property {string[]} excludedSectors - Setores excluídos
 * @property {string[]} excludedChannels - Canais excluídos
 * @property {string} [selectedActionCard] - Action card selecionado
 * @property {string} [selectedActionCard30Min] - Action card para 30min
 * @property {string} [selectedActionCardEndDay] - Action card para fim do dia
 * @property {string} [selectedTemplate] - Template selecionado
 * @property {string} startOfDayTime - Horário de início de expediente
 * @property {string} endOfDayTime - Horário de fim de expediente
 */

/**
 * @typedef {Object} ExclusionEntry
 * @property {string} id - ID único
 * @property {string} attendanceId - ID do atendimento
 * @property {'30min'|'end_of_day'} messageType - Tipo de mensagem
 * @property {Date} createdAt - Data de criação
 * @property {Date} expiresAt - Data de expiração
 */

/**
 * Gerenciador de configurações do sistema
 */
class ConfigManager {
  constructor(errorHandler) {
    this.errorHandler = errorHandler;
    this.exclusionList = new Map();
    this.systemConfig = this.createDefaultSystemConfig();
  }

  /**
   * Cria configuração padrão do sistema
   * @returns {SystemConfig} Configuração padrão
   */
  createDefaultSystemConfig() {
    return {
      flowPaused: false,
      endOfDayPaused: false,
      ignoreBusinessHours: false,
      minWaitTime: 60,
      maxWaitTime: 180,
      excludedSectors: [],
      excludedChannels: [],
      selectedActionCard: undefined,
      selectedActionCard30Min: undefined,
      selectedActionCardEndDay: undefined,
      selectedTemplate: undefined,
      startOfDayTime: '08:00',
      endOfDayTime: '18:00',
      logCleanupTime: '02:00',
      refreshInterval: 30,
      channels: [],
      channelMetrics: {}
    };
  }

  /**
   * Inicializa o gerenciador de configurações
   */
  async initialize() {
    try {
      await this.loadSystemConfig();
      console.log('⚙️ ConfigManager inicializado com sucesso');
    } catch (error) {
      this.errorHandler.logError(error, 'ConfigManager.initialize');
    }
  }

  /**
   * Carrega tokens do arquivo .env
   * @returns {Object} Mapa de tokens por canal
   */
  loadTokensFromEnv() {
    const tokens = {};
    
    try {
      // Mapeamento de tokens do .env para IDs dos canais
      const tokenMapping = {
        'TOKEN_ANEXO1_ESTOQUE': 'anexo1-estoque',
        'TOKEN_WHATSAPP_OFICIAL': 'whatsapp-oficial', 
        'TOKEN_CONFIRMACAO1': 'confirmacao1',
        'TOKEN_CONFIRMACAO2_TI': 'confirmacao2-ti',
        'TOKEN_CONFIRMACAO3_CARLA': 'confirmacao3-carla'
      };

      // Carregar tokens do .env
      Object.entries(tokenMapping).forEach(([envVar, channelId]) => {
        const token = process.env[envVar];
        if (token) {
          tokens[channelId] = token;
          console.log(`🔑 Token carregado para ${channelId}: ${token.substring(0, 8)}...`);
        } else {
          console.warn(`⚠️ Token não encontrado no .env: ${envVar}`);
        }
      });

      return tokens;
    } catch (error) {
      console.error('❌ Erro ao carregar tokens do .env:', error);
      return {};
    }
  }

  /**
   * Carrega configuração do sistema
   */
  async loadSystemConfig() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const configPath = path.join(__dirname, '../../data/system_config.json');
      
      // Tentar carregar configuração do arquivo
      try {
        const configData = await fs.readFile(configPath, 'utf8');
        const parsedConfig = JSON.parse(configData);
        
        // Carregar tokens do .env
        const envTokens = this.loadTokensFromEnv();
        
        // Atualizar tokens dos canais com valores do .env
        const channels = (parsedConfig.channels || []).map(channel => {
          const envToken = envTokens[channel.id];
          if (envToken) {
            return { ...channel, token: envToken };
          }
          return channel;
        });

        this.systemConfig = {
          flowPaused: parsedConfig.flowPaused === 'true' || parsedConfig.flowPaused === true,
          endOfDayPaused: parsedConfig.endOfDayPaused === 'true' || parsedConfig.endOfDayPaused === true,
          ignoreBusinessHours: parsedConfig.ignoreBusinessHours === 'true' || parsedConfig.ignoreBusinessHours === true,
          minWaitTime: parseInt(parsedConfig.minWaitTime) || 60,
          maxWaitTime: parseInt(parsedConfig.maxWaitTime) || 180,
          excludedSectors: this.parseJsonArray(parsedConfig.excludedSectors),
          excludedChannels: this.parseJsonArray(parsedConfig.excludedChannels),
          selectedActionCard: parsedConfig.selectedActionCard || '631f2b4f307d23f46ac80a10',
          selectedActionCardDescription: parsedConfig.selectedActionCardDescription || 'Mensagem transferência padrão',
          selectedActionCard30Min: parsedConfig.selectedActionCard30Min || '631f2b4f307d23f46ac80a2b',
          selectedActionCard30MinDescription: parsedConfig.selectedActionCard30MinDescription || 'Mensagem de 30 Minutos',
          selectedActionCardEndDay: parsedConfig.selectedActionCardEndDay || '631f2b4f307d23f46ac80a2b',
          selectedActionCardEndDayDescription: parsedConfig.selectedActionCardEndDayDescription || 'Fim de Expediente',
          selectedTemplate: parsedConfig.selectedTemplate || '',
          startOfDayTime: parsedConfig.startOfDayTime || '08:00',
          endOfDayTime: parsedConfig.endOfDayTime || '18:00',
          logCleanupTime: parsedConfig.logCleanupTime || '02:00',
          refreshInterval: parseInt(parsedConfig.refreshInterval) || 30,
          channels: channels,
          channelMetrics: parsedConfig.channelMetrics || {}
        };
        
        console.log('✅ Configuração carregada do arquivo system_config.json');
        console.log('📋 Action Cards configurados:', {
          padrão: this.systemConfig.selectedActionCard,
          '30min': this.systemConfig.selectedActionCard30Min,
          'fim_dia': this.systemConfig.selectedActionCardEndDay
        });
        console.log(`⏰ Refresh Interval: ${this.systemConfig.refreshInterval}s`);
        console.log(`📱 Canais configurados: ${this.systemConfig.channels.length}`);
        if (this.systemConfig.channels.length > 0) {
          this.systemConfig.channels.forEach((channel, index) => {
            console.log(`   ${index + 1}. ${channel.name} (${channel.number}) - ${channel.active ? 'Ativo' : 'Inativo'}`);
          });
        }
        
      } catch (fileError) {
        console.log('⚠️ Arquivo de configuração não encontrado, usando valores padrão');
        // Usar valores padrão
        this.systemConfig = {
          flowPaused: false,
          endOfDayPaused: false,
          ignoreBusinessHours: false,
          minWaitTime: 60,
          maxWaitTime: 180,
          excludedSectors: [
            '631f2b4f307d23f46ac80a1c',
            '631f7d27307d23f46af88983', 
            '6400efb5343817d4ddbb2a4c',
            '6401f4f49b1ff8512b525e9c'
          ],
          excludedChannels: [
            '6787af30bf31d23b04ac8bd1',
            '65e1db3b3362eebbe8e2afe5'
          ],
          selectedActionCard: '631f2b4f307d23f46ac80a2b',
          selectedActionCard30Min: '631f2b4f307d23f46ac80a2b',
          selectedActionCardEndDay: '631f2b4f307d23f46ac80a2b',
          selectedTemplate: '',
          startOfDayTime: '08:00',
          endOfDayTime: '18:00',
          logCleanupTime: '02:00',
          refreshInterval: 30
        };
      }
    } catch (error) {
      this.errorHandler.logError(error, 'ConfigManager.loadSystemConfig');
    }
  }

  /**
   * Converte string JSON em array
   * @param {string} jsonString - String JSON
   * @returns {Array} Array convertido
   */
  parseJsonArray(jsonString) {
    try {
      if (typeof jsonString === 'string') {
        return JSON.parse(jsonString);
      }
      return Array.isArray(jsonString) ? jsonString : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtém setores excluídos
   * @returns {string[]} Lista de setores excluídos
   */
  getExcludedSectors() {
    console.log(`🔍 ConfigManager: Retornando ${this.systemConfig.excludedSectors.length} setores excluídos:`, this.systemConfig.excludedSectors);
    return this.systemConfig.excludedSectors || [];
  }

  /**
   * Obtém canais excluídos
   * @returns {string[]} Lista de canais excluídos
   */
  getExcludedChannels() {
    console.log(`🔍 ConfigManager: Retornando ${this.systemConfig.excludedChannels.length} canais excluídos:`, this.systemConfig.excludedChannels);
    return this.systemConfig.excludedChannels || [];
  }

  /**
   * Adiciona atendimento à lista de exclusão
   * @param {string} attendanceId - ID do atendimento
   * @param {'30min'|'end_of_day'} messageType - Tipo de mensagem
   */
  async addToExclusionList(attendanceId, messageType) {
    try {
      const key = `${attendanceId}_${messageType}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expira em 24 horas
      
      const entry = {
        id: key,
        attendanceId,
        messageType,
        createdAt: new Date(),
        expiresAt
      };
      
      this.exclusionList.set(key, entry);
      console.log(`📝 Adicionado à lista de exclusão: ${attendanceId} (${messageType})`);
    } catch (error) {
      this.errorHandler.logError(error, 'ConfigManager.addToExclusionList');
    }
  }

  /**
   * Verifica se fluxo está pausado
   * @returns {boolean} True se pausado
   */
  isFlowPaused() {
    return this.systemConfig.flowPaused || false;
  }

  /**
   * Verifica se mensagem de fim de dia (18h) está pausada
   * @returns {boolean} True se pausado
   */
  isEndOfDayPaused() {
    return this.systemConfig.endOfDayPaused || false;
  }

  /**
   * Verifica se deve ignorar verificação de horário comercial
   * @returns {boolean} True se deve ignorar
   */
  shouldIgnoreBusinessHours() {
    return this.systemConfig.ignoreBusinessHours || false;
  }

  /**
   * Obtém o tempo mínimo de espera configurado
   * @returns {number} Tempo mínimo em minutos
   */
  getMinWaitTime() {
    return this.systemConfig.minWaitTime || 30;
  }

  /**
   * Obtém o tempo máximo de espera configurado
   * @returns {number} Tempo máximo em minutos
   */
  getMaxWaitTime() {
    return this.systemConfig.maxWaitTime || 40;
  }

  /**
   * Obtém o horário de início do dia configurado
   * @returns {string} Horário no formato HH:MM
   */
  getStartOfDayTime() {
    return this.systemConfig.startOfDayTime || '08:00';
  }

  /**
   * Obtém o horário de fim do dia configurado
   * @returns {string} Horário no formato HH:MM
   */
  getEndOfDayTime() {
    return this.systemConfig.endOfDayTime || '18:00';
  }

  /**
   * Obtém o horário de limpeza de logs configurado
   * @returns {string} Horário no formato HH:MM
   */
  getLogCleanupTime() {
    return this.systemConfig.logCleanupTime || '02:00';
  }

  /**
   * Verifica se atendimento está excluído
   * @param {string} attendanceId - ID do atendimento
   * @param {'30min'|'end_of_day'} messageType - Tipo de mensagem
   * @returns {Promise<boolean>} True se excluído
   */
  async isAttendanceExcluded(attendanceId, messageType) {
    const key = `${attendanceId}_${messageType}`;
    const entry = this.exclusionList.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Verificar se não expirou
    if (new Date() > entry.expiresAt) {
      this.exclusionList.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Obtém configuração do sistema
   * @returns {SystemConfig} Configuração atual
   */
  getSystemConfig() {
    return { ...this.systemConfig };
  }

  /**
   * Atualiza configuração do sistema
   * @param {Partial<SystemConfig>} updates - Atualizações
   */
  async updateSystemConfig(updates) {
    try {
      // Atualizar configuração na memória
      this.systemConfig = { ...this.systemConfig, ...updates };
      
      // Salvar no arquivo JSON
      await this.saveSystemConfigToFile();
      
      console.log('⚙️ Configuração do sistema atualizada e salva no arquivo');
      
      // Log das mudanças específicas
      if (updates.selectedActionCard) {
        console.log(`📋 Action Card padrão: ${updates.selectedActionCard}`);
      }
      if (updates.selectedActionCard30Min) {
        console.log(`📋 Action Card 30min: ${updates.selectedActionCard30Min}`);
      }
      if (updates.selectedActionCardEndDay) {
        console.log(`📋 Action Card fim de dia: ${updates.selectedActionCardEndDay}`);
      }
      
    } catch (error) {
      this.errorHandler.logError(error, 'ConfigManager.updateSystemConfig');
      throw error;
    }
  }

  /**
   * Salva configuração do sistema no arquivo JSON
   */
  async saveSystemConfigToFile() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const configPath = path.join(__dirname, '../../data/system_config.json');
      
      // Converter configuração para formato do arquivo
      const configToSave = {
        excludedSectors: JSON.stringify(this.systemConfig.excludedSectors),
        excludedChannels: JSON.stringify(this.systemConfig.excludedChannels),
        flowPaused: this.systemConfig.flowPaused.toString(),
        endOfDayPaused: this.systemConfig.endOfDayPaused.toString(),
        ignoreBusinessHours: this.systemConfig.ignoreBusinessHours.toString(),
        minWaitTime: this.systemConfig.minWaitTime.toString(),
        maxWaitTime: this.systemConfig.maxWaitTime.toString(),
        selectedActionCard: this.systemConfig.selectedActionCard,
        selectedActionCard30Min: this.systemConfig.selectedActionCard30Min,
        selectedActionCardEndDay: this.systemConfig.selectedActionCardEndDay,
        selectedTemplate: this.systemConfig.selectedTemplate,
        startOfDayTime: this.systemConfig.startOfDayTime,
        endOfDayTime: this.systemConfig.endOfDayTime,
        logCleanupTime: this.systemConfig.logCleanupTime,
        refreshInterval: this.systemConfig.refreshInterval.toString()
      };
      
      // Salvar arquivo
      await fs.writeFile(configPath, JSON.stringify(configToSave, null, 2), 'utf8');
      
      console.log('💾 Configuração salva em system_config.json');
      
    } catch (error) {
      this.errorHandler.logError(error, 'ConfigManager.saveSystemConfigToFile');
      throw error;
    }
  }

  /**
   * Obtém ID do action card padrão
   * @returns {string} ID do action card
   */
  getActionCardId() {
    return this.systemConfig.selectedActionCard || '631f2b4f307d23f46ac80a2b';
  }

  /**
   * Obtém ID do action card para mensagens de 30 minutos
   * @returns {string} ID do action card para 30min
   */
  get30MinActionCardId() {
    return this.systemConfig.selectedActionCard30Min || '631f2b4f307d23f46ac80a2b';
  }

  /**
   * Obtém ID do action card para mensagens de fim de dia
   * @returns {string} ID do action card para fim de dia
   */
  getEndOfDayActionCardId() {
    return this.systemConfig.selectedActionCardEndDay || '631f2b4f307d23f46ac80a2b';
  }

  /**
   * Atualiza Action Card padrão
   * @param {string} actionCardId - ID do action card
   */
  async setActionCardId(actionCardId) {
    await this.updateSystemConfig({ selectedActionCard: actionCardId });
  }

  /**
   * Atualiza Action Card para mensagens de 30 minutos
   * @param {string} actionCardId - ID do action card
   */
  async set30MinActionCardId(actionCardId) {
    await this.updateSystemConfig({ selectedActionCard30Min: actionCardId });
  }

  /**
   * Atualiza Action Card para mensagens de fim de dia
   * @param {string} actionCardId - ID do action card
   */
  async setEndOfDayActionCardId(actionCardId) {
    await this.updateSystemConfig({ selectedActionCardEndDay: actionCardId });
  }

  /**
   * Atualiza todos os 3 Action Cards de uma vez
   * @param {Object} actionCards - Objeto com os 3 action cards
   * @param {string} actionCards.default - Action card padrão
   * @param {string} actionCards.thirtyMin - Action card para 30min
   * @param {string} actionCards.endOfDay - Action card para fim de dia
   */
  async setAllActionCards(actionCards) {
    const updates = {};
    
    if (actionCards.default) {
      updates.selectedActionCard = actionCards.default;
    }
    if (actionCards.thirtyMin) {
      updates.selectedActionCard30Min = actionCards.thirtyMin;
    }
    if (actionCards.endOfDay) {
      updates.selectedActionCardEndDay = actionCards.endOfDay;
    }
    
    await this.updateSystemConfig(updates);
  }

  /**
   * Obtém configuração completa do sistema
   * @returns {Object} Configuração completa
   */
  getSystemConfig() {
    // Forçar recarga se os campos importantes estão undefined
    if (!this.systemConfig.selectedActionCard30Min || !this.systemConfig.selectedActionCardEndDay) {
      console.log('⚠️ Action Cards não carregados, forçando recarga...');
      this.loadSystemConfig();
    }
    
    return {
      ...this.systemConfig,
      // Garantir que todos os campos estejam presentes com valores corretos do arquivo
      flowPaused: this.systemConfig.flowPaused || false,
      endOfDayPaused: this.systemConfig.endOfDayPaused || false,
      ignoreBusinessHours: this.systemConfig.ignoreBusinessHours || false,
      minWaitTime: this.systemConfig.minWaitTime || 30,
      maxWaitTime: this.systemConfig.maxWaitTime || 40,
      selectedActionCard: this.systemConfig.selectedActionCard || '631f2b4f307d23f46ac80a10',
      selectedActionCardDescription: this.systemConfig.selectedActionCardDescription || 'Mensagem transferência padrão',
      selectedActionCard30Min: this.systemConfig.selectedActionCard30Min || '68cbfa96b8640e9721e4feab',
      selectedActionCard30MinDescription: this.systemConfig.selectedActionCard30MinDescription || 'Mensagem de 30 Minutos',
      selectedActionCardEndDay: this.systemConfig.selectedActionCardEndDay || '631f2b4f307d23f46ac80a2b',
      selectedActionCardEndDayDescription: this.systemConfig.selectedActionCardEndDayDescription || 'Fim de Expediente',
      startOfDayTime: this.systemConfig.startOfDayTime || '08:00',
      endOfDayTime: this.systemConfig.endOfDayTime || '18:00',
      logCleanupTime: this.systemConfig.logCleanupTime || '02:00',
      refreshInterval: this.systemConfig.refreshInterval || 30
    };
  }

  /**
   * Limpeza diária de dados
   */
  async cleanupDailyData() {
    try {
      const now = new Date();
      const expiredKeys = [];
      
      this.exclusionList.forEach((entry, key) => {
        if (now > entry.expiresAt) {
          expiredKeys.push(key);
        }
      });

      expiredKeys.forEach(key => {
        this.exclusionList.delete(key);
      });

      console.log(`🧹 Limpeza diária: ${expiredKeys.length} entradas expiradas removidas`);
    } catch (error) {
      this.errorHandler.logError(error, 'ConfigManager.cleanupDailyData');
    }
  }

  /**
   * ========================================
   * MÉTODOS DE GERENCIAMENTO DE CANAIS
   * ========================================
   */

  /**
   * Obtém todos os canais configurados
   * @returns {Array} Lista de canais
   */
  getChannels() {
    return this.systemConfig.channels || [];
  }

  /**
   * Obtém canais ativos
   * @returns {Array} Lista de canais ativos
   */
  getActiveChannels() {
    return this.getChannels().filter(channel => channel.active === true);
  }

  /**
   * Obtém canal por ID
   * @param {string} channelId - ID do canal
   * @returns {Object|null} Canal encontrado ou null
   */
  getChannelById(channelId) {
    return this.getChannels().find(channel => channel.id === channelId) || null;
  }

  /**
   * Obtém canal por número
   * @param {string} number - Número do canal
   * @returns {Object|null} Canal encontrado ou null
   */
  getChannelByNumber(number) {
    return this.getChannels().find(channel => channel.number === number) || null;
  }

  /**
   * Obtém canais por departamento
   * @param {string} department - Departamento
   * @returns {Array} Lista de canais do departamento
   */
  getChannelsByDepartment(department) {
    return this.getChannels().filter(channel => channel.department === department);
  }

  /**
   * Adiciona novo canal
   * @param {Object} channelData - Dados do canal
   * @returns {boolean} Sucesso da operação
   */
  addChannel(channelData) {
    try {
      if (!channelData.id || !channelData.name || !channelData.number || !channelData.token) {
        throw new Error('Dados obrigatórios do canal não fornecidos');
      }

      // Verificar se já existe canal com mesmo ID ou número
      if (this.getChannelById(channelData.id)) {
        throw new Error(`Canal com ID '${channelData.id}' já existe`);
      }

      if (this.getChannelByNumber(channelData.number)) {
        throw new Error(`Canal com número '${channelData.number}' já existe`);
      }

      // Adicionar canal
      this.systemConfig.channels.push({
        id: channelData.id,
        name: channelData.name,
        number: channelData.number,
        token: channelData.token,
        active: channelData.active !== undefined ? channelData.active : true,
        priority: channelData.priority || 999,
        department: channelData.department || 'default',
        description: channelData.description || ''
      });

      // Inicializar métricas do canal
      this.systemConfig.channelMetrics[channelData.id] = {
        messagesSent: 0,
        messagesFailed: 0,
        activeConversations: 0,
        lastActivity: null
      };

      console.log(`✅ Canal adicionado: ${channelData.name} (${channelData.number})`);
      return true;
    } catch (error) {
      this.errorHandler.logError(error, 'ConfigManager.addChannel');
      return false;
    }
  }

  /**
   * Atualiza canal existente
   * @param {string} channelId - ID do canal
   * @param {Object} updateData - Dados para atualizar
   * @returns {boolean} Sucesso da operação
   */
  updateChannel(channelId, updateData) {
    try {
      const channelIndex = this.systemConfig.channels.findIndex(channel => channel.id === channelId);
      
      if (channelIndex === -1) {
        throw new Error(`Canal '${channelId}' não encontrado`);
      }

      // Atualizar dados do canal
      this.systemConfig.channels[channelIndex] = {
        ...this.systemConfig.channels[channelIndex],
        ...updateData
      };

      console.log(`✅ Canal atualizado: ${channelId}`);
      return true;
    } catch (error) {
      this.errorHandler.logError(error, 'ConfigManager.updateChannel');
      return false;
    }
  }

  /**
   * Remove canal
   * @param {string} channelId - ID do canal
   * @returns {boolean} Sucesso da operação
   */
  removeChannel(channelId) {
    try {
      const channelIndex = this.systemConfig.channels.findIndex(channel => channel.id === channelId);
      
      if (channelIndex === -1) {
        throw new Error(`Canal '${channelId}' não encontrado`);
      }

      // Remover canal
      this.systemConfig.channels.splice(channelIndex, 1);

      // Remover métricas do canal
      delete this.systemConfig.channelMetrics[channelId];

      console.log(`✅ Canal removido: ${channelId}`);
      return true;
    } catch (error) {
      this.errorHandler.logError(error, 'ConfigManager.removeChannel');
      return false;
    }
  }

  /**
   * Ativa/desativa canal
   * @param {string} channelId - ID do canal
   * @param {boolean} active - Status ativo
   * @returns {boolean} Sucesso da operação
   */
  toggleChannel(channelId, active) {
    return this.updateChannel(channelId, { active });
  }

  /**
   * Obtém métricas de um canal
   * @param {string} channelId - ID do canal
   * @returns {Object} Métricas do canal
   */
  getChannelMetrics(channelId) {
    return this.systemConfig.channelMetrics[channelId] || {
      messagesSent: 0,
      messagesFailed: 0,
      activeConversations: 0,
      lastActivity: null
    };
  }

  /**
   * Atualiza métricas de um canal
   * @param {string} channelId - ID do canal
   * @param {Object} metrics - Métricas para atualizar
   * @returns {boolean} Sucesso da operação
   */
  updateChannelMetrics(channelId, metrics) {
    try {
      if (!this.systemConfig.channelMetrics[channelId]) {
        this.systemConfig.channelMetrics[channelId] = {
          messagesSent: 0,
          messagesFailed: 0,
          activeConversations: 0,
          lastActivity: null
        };
      }

      this.systemConfig.channelMetrics[channelId] = {
        ...this.systemConfig.channelMetrics[channelId],
        ...metrics,
        lastActivity: new Date().toISOString()
      };

      return true;
    } catch (error) {
      this.errorHandler.logError(error, 'ConfigManager.updateChannelMetrics');
      return false;
    }
  }

  /**
   * Incrementa contador de mensagens enviadas
   * @param {string} channelId - ID do canal
   * @returns {boolean} Sucesso da operação
   */
  incrementChannelMessagesSent(channelId) {
    const metrics = this.getChannelMetrics(channelId);
    return this.updateChannelMetrics(channelId, {
      messagesSent: metrics.messagesSent + 1
    });
  }

  /**
   * Incrementa contador de mensagens falhadas
   * @param {string} channelId - ID do canal
   * @returns {boolean} Sucesso da operação
   */
  incrementChannelMessagesFailed(channelId) {
    const metrics = this.getChannelMetrics(channelId);
    return this.updateChannelMetrics(channelId, {
      messagesFailed: metrics.messagesFailed + 1
    });
  }

  /**
   * Atualiza contador de conversas ativas
   * @param {string} channelId - ID do canal
   * @param {number} count - Número de conversas ativas
   * @returns {boolean} Sucesso da operação
   */
  updateChannelActiveConversations(channelId, count) {
    return this.updateChannelMetrics(channelId, {
      activeConversations: count
    });
  }
}

module.exports = { ConfigManager };
