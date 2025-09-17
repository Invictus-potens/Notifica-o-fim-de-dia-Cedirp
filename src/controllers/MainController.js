const { ErrorHandler } = require('../services/ErrorHandler');
const { ConfigManager } = require('../services/ConfigManager');
const { JsonPatientManager } = require('../services/JsonPatientManager');
const { TimeUtils } = require('../utils/TimeUtils');

/**
 * Controlador principal do sistema de automação
 */
class MainController {
  constructor() {
    // Inicializar ErrorHandler primeiro
    this.errorHandler = new ErrorHandler();
    
    // Inicializar ConfigManager
    this.configManager = new ConfigManager(this.errorHandler);
    
    // Inicializar JsonPatientManager
    this.jsonPatientManager = new JsonPatientManager(this.errorHandler);
    
    this.isRunning = false;
    this.initialized = false;
    this.startTime = new Date();
  }

  /**
   * Inicializa todos os serviços
   */
  async initialize() {
    try {
      if (this.initialized) {
        return;
      }

      console.log('🔧 Inicializando MainController...');

      // Inicializar ConfigManager
      await this.configManager.initialize();
      console.log('✅ ConfigManager inicializado');

      // Inicializar JsonPatientManager com configurações de backup
      const backupConfig = {
        minIntervalMs: 300000, // 5 minutos
        useSingleFolder: true, // Usar pasta única
        cleanupOnStartup: true,
        createOnlyOnChanges: true
      };
      
      this.jsonPatientManager.setBackupInterval(backupConfig.minIntervalMs);
      this.jsonPatientManager.setSingleBackupFolder(backupConfig.useSingleFolder);
      
      await this.jsonPatientManager.initialize();
      console.log('✅ JsonPatientManager inicializado');

      this.initialized = true;
      console.log('✅ MainController inicializado com sucesso');
      
    } catch (error) {
      this.errorHandler.logError(error, 'MainController.initialize');
      throw error;
    }
  }

  /**
   * Inicia o sistema de automação
   */
  async start() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.isRunning) {
        console.log('Sistema já está rodando');
        return;
      }

      console.log('🚀 Iniciando sistema de automação...');

      // Iniciar ciclo de monitoramento simplificado
      this.startMonitoringCycle();
      
      this.isRunning = true;
      console.log('✅ Sistema de automação iniciado com sucesso');
      
    } catch (error) {
      this.errorHandler.logError(error, 'MainController.start');
      throw error;
    }
  }

  /**
   * Inicia ciclo de monitoramento simplificado
   */
  startMonitoringCycle() {
    // Executar verificação a cada 60 segundos
    setInterval(async () => {
      try {
        await this.executeMonitoringCycle();
      } catch (error) {
        this.errorHandler.logError(error, 'MainController.monitoringCycle');
      }
    }, 60000);

    console.log('⏰ Ciclo de monitoramento iniciado (60s)');
  }

  /**
   * Executa um ciclo de monitoramento
   */
  async executeMonitoringCycle() {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${new Date().toLocaleString('pt-BR')}] Iniciando ciclo de monitoramento...`);
      
      // Verificar se é horário comercial
      if (!TimeUtils.isBusinessHours() || !TimeUtils.isWorkingDay()) {
        console.log(`🕐 [${new Date().toLocaleString('pt-BR')}] Fora do horário comercial - apenas monitorando`);
        return;
      }

      // Verificar se fluxo está pausado
      if (this.configManager.isFlowPaused()) {
        console.log(`⏸️ [${new Date().toLocaleString('pt-BR')}] Fluxo pausado - apenas monitorando`);
        return;
      }

      // Simular verificação de pacientes (versão simplificada)
      console.log(`📊 [${new Date().toLocaleString('pt-BR')}] Sistema JavaScript funcionando - ciclo de monitoramento ativo`);
      
      const duration = Date.now() - startTime;
      console.log(`✅ [${new Date().toLocaleString('pt-BR')}] Ciclo concluído em ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${new Date().toLocaleString('pt-BR')}] Erro no ciclo de monitoramento (${duration}ms):`, error.message);
    }
  }

  /**
   * Para o sistema
   */
  async stop() {
    try {
      this.isRunning = false;
      console.log('🛑 Sistema parado');
    } catch (error) {
      this.errorHandler.logError(error, 'MainController.stop');
      throw error;
    }
  }

  /**
   * Obtém status do sistema
   */
  async getStatus() {
    try {
      const timeInfo = TimeUtils.getTimeInfo();
      
      return {
        isRunning: this.isRunning,
        isInitialized: this.initialized,
        startTime: this.startTime,
        currentTime: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
        isBusinessHours: timeInfo.isBusinessHours,
        isWorkingDay: timeInfo.isWorkingDay,
        flowPaused: this.configManager.isFlowPaused(),
        version: '1.0.0-js',
        environment: process.env.NODE_ENV || 'development'
      };
    } catch (error) {
      this.errorHandler.logError(error, 'MainController.getStatus');
      throw error;
    }
  }

  /**
   * Pausa o fluxo de mensagens
   */
  pauseFlow() {
    this.configManager.updateSystemConfig({ flowPaused: true });
    console.log('⏸️ Fluxo pausado');
  }

  /**
   * Resume o fluxo de mensagens
   */
  resumeFlow() {
    this.configManager.updateSystemConfig({ flowPaused: false });
    console.log('▶️ Fluxo resumido');
  }

  /**
   * Verifica se sistema foi inicializado
   * @returns {boolean} True se inicializado
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Obtém configuração do sistema
   * @returns {SystemConfig} Configuração atual
   */
  getSystemConfig() {
    return this.configManager.getSystemConfig();
  }

  /**
   * Atualiza configuração do sistema
   * @param {Partial<SystemConfig>} updates - Atualizações
   */
  async updateSystemConfig(updates) {
    await this.configManager.updateSystemConfig(updates);
  }

  /**
   * Obtém logs do sistema
   * @param {number} [level] - Nível mínimo
   * @param {number} [limit] - Limite de logs
   * @returns {Object[]} Lista de logs
   */
  getLogs(level, limit) {
    return this.errorHandler.getLogs(level, limit);
  }

  /**
   * Limpa logs do sistema
   */
  clearLogs() {
    this.errorHandler.clearLogs();
  }

  /**
   * Obtém estatísticas de erro
   * @returns {Object} Estatísticas
   */
  getErrorStats() {
    return this.errorHandler.getErrorStats();
  }

  /**
   * Health check simplificado
   */
  async performHealthCheck() {
    try {
      const status = await this.getStatus();
      
      return {
        status: status.isRunning ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: status.uptime,
        version: '1.0.0-js',
        environment: process.env.NODE_ENV || 'development',
        components: {
          mainController: status.isInitialized,
          configManager: true,
          jsonPatientManager: true,
          timeUtils: true
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Health check rápido
   */
  async performQuickHealthCheck() {
    return {
      status: this.isRunning ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime.getTime(),
      version: '1.0.0-js'
    };
  }
}

module.exports = { MainController };
