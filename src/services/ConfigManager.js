/**
 * @typedef {Object} SystemConfig
 * @property {boolean} flowPaused - Se o fluxo está pausado
 * @property {string[]} excludedSectors - Setores excluídos
 * @property {string[]} excludedChannels - Canais excluídos
 * @property {string} [selectedActionCard] - Action card selecionado
 * @property {string} [selectedActionCard30Min] - Action card para 30min
 * @property {string} [selectedActionCardEndDay] - Action card para fim do dia
 * @property {string} [selectedTemplate] - Template selecionado
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
      excludedSectors: [],
      excludedChannels: [],
      selectedActionCard: undefined,
      selectedActionCard30Min: undefined,
      selectedActionCardEndDay: undefined,
      selectedTemplate: undefined,
      endOfDayTime: '18:00'
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
      // Implementação simplificada - usar valores padrão
      this.systemConfig = {
        flowPaused: false,
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
        endOfDayTime: '18:00'
      };
    } catch (error) {
      this.errorHandler.logError(error, 'ConfigManager.loadSystemConfig');
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
      this.systemConfig = { ...this.systemConfig, ...updates };
      console.log('⚙️ Configuração do sistema atualizada');
    } catch (error) {
      this.errorHandler.logError(error, 'ConfigManager.updateSystemConfig');
      throw error;
    }
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
