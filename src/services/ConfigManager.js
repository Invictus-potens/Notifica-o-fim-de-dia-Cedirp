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
      logCleanupTime: '02:00'
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
        
        this.systemConfig = {
          flowPaused: parsedConfig.flowPaused === 'true' || parsedConfig.flowPaused === true,
          endOfDayPaused: parsedConfig.endOfDayPaused === 'true' || parsedConfig.endOfDayPaused === true,
          ignoreBusinessHours: parsedConfig.ignoreBusinessHours === 'true' || parsedConfig.ignoreBusinessHours === true,
          minWaitTime: parseInt(parsedConfig.minWaitTime) || 60,
          maxWaitTime: parseInt(parsedConfig.maxWaitTime) || 180,
          excludedSectors: this.parseJsonArray(parsedConfig.excludedSectors),
          excludedChannels: this.parseJsonArray(parsedConfig.excludedChannels),
          selectedActionCard: parsedConfig.selectedActionCard || '631f2b4f307d23f46ac80a2b',
          selectedActionCard30Min: parsedConfig.selectedActionCard30Min || '631f2b4f307d23f46ac80a2b',
          selectedActionCardEndDay: parsedConfig.selectedActionCardEndDay || '631f2b4f307d23f46ac80a2b',
          selectedTemplate: parsedConfig.selectedTemplate || '',
          startOfDayTime: parsedConfig.startOfDayTime || '08:00',
          endOfDayTime: parsedConfig.endOfDayTime || '18:00',
          logCleanupTime: parsedConfig.logCleanupTime || '02:00'
        };
        
        console.log('✅ Configuração carregada do arquivo system_config.json');
        console.log('📋 Action Cards configurados:', {
          padrão: this.systemConfig.selectedActionCard,
          '30min': this.systemConfig.selectedActionCard30Min,
          'fim_dia': this.systemConfig.selectedActionCardEndDay
        });
        
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
          logCleanupTime: '02:00'
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
        logCleanupTime: this.systemConfig.logCleanupTime
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
}

module.exports = { ConfigManager };
