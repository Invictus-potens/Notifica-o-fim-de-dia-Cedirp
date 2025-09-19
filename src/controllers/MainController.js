const { ErrorHandler } = require('../services/ErrorHandler');
const { ConfigManager } = require('../services/ConfigManager');
const { JsonPatientManager } = require('../services/JsonPatientManager');
const { ProductionScheduler } = require('../services/ProductionScheduler');
const { MessageHistoryManager } = require('../services/MessageHistoryManager');
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
    
    // Inicializar MessageHistoryManager
    this.messageHistoryManager = new MessageHistoryManager(this.errorHandler);
    
    // Inicializar ProductionScheduler
    this.productionScheduler = new ProductionScheduler(this.errorHandler, this.configManager);
    
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

      // Inicializar ProductionScheduler com credenciais da API CAM Krolik
      const krolikCredentials = {
        baseURL: process.env.KROLIK_BASE_URL || 'https://api.camkrolik.com.br',
        token: process.env.KROLIK_TOKEN || '63e68f168a48875131856df8'
      };
      
      await this.productionScheduler.initialize(krolikCredentials);
      console.log('✅ ProductionScheduler inicializado');

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

      // Iniciar ProductionScheduler (substitui o ciclo simplificado)
      await this.productionScheduler.start();
      
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
      
      // Verificar se é horário comercial (considerando configuração ignoreBusinessHours)
      const ignoreBusinessHours = this.configManager.shouldIgnoreBusinessHours();
      if (!ignoreBusinessHours && (!TimeUtils.isBusinessHours() || !TimeUtils.isWorkingDay())) {
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
      // Parar ProductionScheduler
      if (this.productionScheduler) {
        await this.productionScheduler.stop();
      }
      
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
      
      const flowPaused = this.configManager.isFlowPaused();
      
      // Buscar dados reais para monitoringStats
      const activePatients = await this.jsonPatientManager.loadPatientsFromFile(this.jsonPatientManager.files.active);
      const messagesSent = await this.messageHistoryManager.getTodaysMessages();
      
      // Contar mensagens enviadas por tipo (do messages_sent.json)
      const messages30Min = messagesSent.filter(msg => msg.messageType === '30min').length;
      const messagesEndOfDay = messagesSent.filter(msg => msg.messageType === 'end_of_day').length;
      
      const result = {
        isRunning: this.isRunning,
        isInitialized: this.initialized,
        startTime: this.startTime,
        currentTime: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
        isBusinessHours: timeInfo.isBusinessHours,
        isWorkingDay: timeInfo.isWorkingDay,
        flowPaused: flowPaused, // Para compatibilidade
        isPaused: flowPaused, // Nome que o frontend espera
        version: '1.0.0-js',
        environment: process.env.NODE_ENV || 'development',
        productionScheduler: this.productionScheduler ? this.productionScheduler.getStatus() : null,
        monitoringStats: {
          totalPatients: activePatients.length,
          patientsOver30Min: messages30Min,
          patientsEndOfDay: messagesEndOfDay,
          messagesSentToday: messagesSent.length,
          lastCheck: new Date().toISOString()
        }
      };
      
      return result;
    } catch (error) {
      this.errorHandler.logError(error, 'MainController.getStatus');
      throw error;
    }
  }

  /**
   * Obtém métricas do sistema
   */
  async getMetrics() {
    try {
      // Buscar dados reais dos pacientes
      const activePatients = await this.jsonPatientManager.loadPatientsFromFile(this.jsonPatientManager.files.active);
      const processedPatients = await this.jsonPatientManager.loadPatientsFromFile(this.jsonPatientManager.files.processed);
      
      // Buscar mensagens enviadas hoje
      const messagesSent = await this.messageHistoryManager.getTodaysMessages();
      
      const result = {
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: '1.0.0-js',
          apiCallsSuccessful: 0, // TODO: Implementar contador
          apiCallsFailed: 0, // TODO: Implementar contador
          averageApiResponseTime: 0 // TODO: Implementar contador
        },
        messages: {
          totalSent: messagesSent.length,
          sent: messagesSent.length,
          failed: 0, // TODO: Implementar contador
          pending: 0,
          averageResponseTime: 0 // TODO: Implementar contador
        },
        patients: {
          active: activePatients.length,
          processed: processedPatients.length,
          waiting: activePatients.length,
          total: activePatients.length + processedPatients.length
        }
      };
      
      return result;
    } catch (error) {
      console.error('❌ Erro em getMetrics:', error);
      this.errorHandler.logError(error, 'MainController.getMetrics');
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
   * Pausa mensagem de fim de dia (18h)
   */
  pauseEndOfDayMessage() {
    this.configManager.updateSystemConfig({ endOfDayPaused: true });
    console.log('⏸️ Mensagem de fim de dia (18h) pausada');
  }

  /**
   * Ativa mensagem de fim de dia (18h)
   */
  resumeEndOfDayMessage() {
    this.configManager.updateSystemConfig({ endOfDayPaused: false });
    console.log('▶️ Mensagem de fim de dia (18h) ativada');
  }

  /**
   * Ignora verificação de horário comercial (permite mensagens 24h)
   */
  ignoreBusinessHours() {
    this.configManager.updateSystemConfig({ ignoreBusinessHours: true });
    console.log('🕐 Verificação de horário comercial DESABILITADA - mensagens 24h');
  }

  /**
   * Ativa verificação de horário comercial (apenas 8h às 18h)
   */
  enableBusinessHours() {
    this.configManager.updateSystemConfig({ ignoreBusinessHours: false });
    console.log('🕐 Verificação de horário comercial ATIVADA - apenas 8h às 18h');
  }

  /**
   * Define o intervalo de tempo para mensagens de espera
   * @param {number} minTime - Tempo mínimo em minutos
   * @param {number} maxTime - Tempo máximo em minutos
   */
  setWaitTimeInterval(minTime, maxTime) {
    this.configManager.updateSystemConfig({ 
      minWaitTime: minTime, 
      maxWaitTime: maxTime 
    });
    console.log(`⏱️ Intervalo de espera configurado: ${minTime}-${maxTime} minutos`);
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
   * Atualiza Action Cards específicos
   * @param {Object} actionCards - Action cards para atualizar
   */
  async updateActionCards(actionCards) {
    await this.configManager.setAllActionCards(actionCards);
  }

  /**
   * Obtém Action Cards atuais
   * @returns {Object} Action cards configurados
   */
  getActionCards() {
    return {
      default: this.configManager.getActionCardId(),
      thirtyMin: this.configManager.get30MinActionCardId(),
      endOfDay: this.configManager.getEndOfDayActionCardId()
    };
  }

  /**
   * Obtém histórico de mensagens para um paciente específico
   * @param {string} patientId - ID do paciente
   * @returns {Array} Lista de mensagens enviadas
   */
  getMessageHistoryForPatient(patientId) {
    try {
      console.log(`🔍 [TERMINAL] Buscando histórico para paciente: ${patientId}`);
      
      if (this.productionScheduler && this.productionScheduler.messageService) {
        const messages = this.productionScheduler.messageService.messageHistoryManager.getMessagesForPatient(patientId);
        console.log(`📨 [TERMINAL] Encontradas ${messages.length} mensagens para paciente ${patientId}`);
        return messages;
      }
      
      console.log(`⚠️ [TERMINAL] MessageService não disponível para paciente ${patientId}`);
      return [];
    } catch (error) {
      this.errorHandler.logError(error, 'MainController.getMessageHistoryForPatient');
      return [];
    }
  }

  /**
   * Obtém mensagens enviadas hoje
   * @returns {Array} Lista de mensagens enviadas hoje
   */
  getTodaysMessages() {
    try {
      console.log(`📅 [TERMINAL] Buscando mensagens do dia...`);
      
      if (this.productionScheduler && this.productionScheduler.messageService) {
        const messages = this.productionScheduler.messageService.messageHistoryManager.getTodaysMessages();
        console.log(`📨 [TERMINAL] Total de mensagens hoje: ${messages.length}`);
        
        if (messages.length > 0) {
          messages.forEach((msg, index) => {
            console.log(`   ${index + 1}. ${msg.patientName} - ${msg.messageType} - ${msg.sentAtFormatted}`);
          });
        }
        
        return messages;
      }
      
      console.log(`⚠️ [TERMINAL] MessageService não disponível`);
      return [];
    } catch (error) {
      this.errorHandler.logError(error, 'MainController.getTodaysMessages');
      return [];
    }
  }

  /**
   * Obtém informações da próxima mensagem
   * @returns {Object} Informações da próxima mensagem
   */
  getNextMessageInfo() {
    try {
      const systemConfig = this.configManager.getSystemConfig();
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Determinar qual tipo de mensagem será enviada próxima
      let nextMessageType = null;
      let timeUntilNext = null;
      let actionCardId = null;
      let actionCardName = 'N/A';
      
      // Verificar se mensagem de fim de dia está ativa
      if (!systemConfig.endOfDayPaused && currentHour >= 17 && currentHour < 18) {
        // Próxima mensagem será de fim de dia (18h)
        nextMessageType = 'end_of_day';
        const endOfDayTime = new Date(now);
        endOfDayTime.setHours(18, 0, 0, 0);
        timeUntilNext = endOfDayTime.getTime() - now.getTime();
        actionCardId = systemConfig.selectedActionCardEndDay;
      } else if (currentHour >= 8 && currentHour < 18) {
        // Durante horário comercial, próxima mensagem será de 30min
        nextMessageType = '30min';
        // Simular próximo envio em 3 minutos (intervalo de verificação)
        timeUntilNext = 3 * 60 * 1000; // 3 minutos em millisegundos
        actionCardId = systemConfig.selectedActionCard30Min;
      } else {
        // Fora do horário comercial
        nextMessageType = 'outside_hours';
        const nextBusinessDay = new Date(now);
        nextBusinessDay.setDate(nextBusinessDay.getDate() + (nextBusinessDay.getDay() === 6 ? 2 : 1)); // Próxima segunda
        nextBusinessDay.setHours(8, 0, 0, 0);
        timeUntilNext = nextBusinessDay.getTime() - now.getTime();
        actionCardId = systemConfig.selectedActionCard30Min;
      }
      
      // Definir nome do action card baseado no tipo
      if (actionCardId) {
        if (nextMessageType === 'end_of_day') {
          actionCardName = `Fim de Dia - ${actionCardId}`;
        } else if (nextMessageType === '30min') {
          actionCardName = `30 Minutos - ${actionCardId}`;
        } else {
          actionCardName = `Action Card ${actionCardId}`;
        }
      }
      
      return {
        nextMessageType,
        timeUntilNext: Math.max(0, timeUntilNext),
        actionCardId,
        actionCardName,
        timestamp: now.toISOString(),
        systemConfig: {
          endOfDayPaused: systemConfig.endOfDayPaused,
          ignoreBusinessHours: systemConfig.ignoreBusinessHours,
          minWaitTime: systemConfig.minWaitTime,
          maxWaitTime: systemConfig.maxWaitTime
        }
      };
      
    } catch (error) {
      this.errorHandler.logError(error, 'MainController.getNextMessageInfo');
      return {
        nextMessageType: 'error',
        timeUntilNext: 0,
        actionCardId: null,
        actionCardName: 'Erro ao carregar',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
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

  /**
   * Executa verificação manual de pacientes
   */
  async runManualPatientCheck() {
    try {
      if (!this.productionScheduler) {
        throw new Error('ProductionScheduler não inicializado');
      }
      
      console.log('🔍 Executando verificação manual de pacientes...');
      await this.productionScheduler.runManualPatientCheck();
      console.log('✅ Verificação manual concluída');
      
    } catch (error) {
      this.errorHandler.logError(error, 'MainController.runManualPatientCheck');
      throw error;
    }
  }

  /**
   * Executa mensagens de fim de dia manualmente
   */
  async runManualEndOfDayMessages() {
    try {
      if (!this.productionScheduler) {
        throw new Error('ProductionScheduler não inicializado');
      }
      
      console.log('🌅 Executando mensagens de fim de dia manual...');
      await this.productionScheduler.runManualEndOfDayMessages();
      console.log('✅ Mensagens de fim de dia manuais concluídas');
      
    } catch (error) {
      this.errorHandler.logError(error, 'MainController.runManualEndOfDayMessages');
      throw error;
    }
  }

  /**
   * Obtém estatísticas detalhadas do sistema
   */
  async getDetailedStats() {
    try {
      if (!this.productionScheduler) {
        throw new Error('ProductionScheduler não inicializado');
      }
      
      return this.productionScheduler.getDetailedStats();
      
    } catch (error) {
      this.errorHandler.logError(error, 'MainController.getDetailedStats');
      throw error;
    }
  }

  /**
   * Lista jobs ativos do agendador
   */
  listActiveJobs() {
    try {
      if (!this.productionScheduler) {
        console.log('⚠️ ProductionScheduler não inicializado');
        return;
      }
      
      this.productionScheduler.listActiveJobs();
      
    } catch (error) {
      this.errorHandler.logError(error, 'MainController.listActiveJobs');
    }
  }

  /**
   * Atualiza configurações do agendador
   */
  updateSchedulerConfig(newConfig) {
    try {
      if (!this.productionScheduler) {
        throw new Error('ProductionScheduler não inicializado');
      }
      
      this.productionScheduler.updateConfig(newConfig);
      
    } catch (error) {
      this.errorHandler.logError(error, 'MainController.updateSchedulerConfig');
      throw error;
    }
  }
}

module.exports = { MainController };
