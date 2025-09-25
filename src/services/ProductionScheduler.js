const { MonitoringService } = require('./MonitoringService');
const { MessageService } = require('./MessageService');
const { CronService } = require('./CronService');
const { TimeUtils } = require('../utils/TimeUtils');

/**
 * Agendador principal para produção
 * Coordena todos os serviços de monitoramento e envio de mensagens
 */
class ProductionScheduler {
  constructor(errorHandler, configManager, metricsCallback = null) {
    this.errorHandler = errorHandler;
    this.configManager = configManager;
    this.metricsCallback = metricsCallback; // Callback para incrementar métricas
    
    // Serviços
    this.monitoringService = null;
    this.messageService = null;
    this.cronService = null;
    
    // Status
    this.isRunning = false;
    this.isInitialized = false;
    
    // Configurações
    this.config = {
      patientCheckInterval: '1min', // Verificação principal a cada minuto
      enable30MinuteMessages: true,
      enableEndOfDayMessages: true,
      enableDailyCleanup: true,
      enableDailyBackup: true
    };
  }

  /**
   * Inicializa o agendador de produção
   */
  async initialize(krolikCredentials) {
    try {
      console.log('🔧 Inicializando ProductionScheduler...');
      
      // Inicializar serviços
      this.messageService = new MessageService(this.errorHandler, this.configManager, this.metricsCallback);
      this.monitoringService = new MonitoringService(this.errorHandler, this.configManager, this.messageService);
      this.cronService = new CronService(this.errorHandler);
      
      // Inicializar serviços individuais
      await this.monitoringService.initialize(krolikCredentials);
      await this.messageService.initialize(krolikCredentials);
      this.cronService.start();
      
      this.isInitialized = true;
      console.log('✅ ProductionScheduler inicializado');
      
    } catch (error) {
      this.errorHandler.logError(error, 'ProductionScheduler.initialize');
      throw error;
    }
  }

  /**
   * Inicia o agendamento de produção
   */
  async start() {
    try {
      if (!this.isInitialized) {
        throw new Error('ProductionScheduler não inicializado');
      }

      if (this.isRunning) {
        console.log('⚠️ ProductionScheduler já está rodando');
        return;
      }

      console.log('🚀 Iniciando agendamento de produção...');
      
      // Agendar verificação de pacientes (sempre a cada minuto para verificação principal)
      this.cronService.scheduleIntensivePatientCheck(() => 
        this.handlePatientCheck()
      );
      
      // Agendar mensagens de fim de dia
      if (this.config.enableEndOfDayMessages) {
        this.cronService.scheduleEndOfDayMessages(() => 
          this.handleEndOfDayMessages()
        );
      }
      
      // Agendar limpeza diária
      if (this.config.enableDailyCleanup) {
        this.cronService.scheduleDailyCleanup(() => 
          this.handleDailyCleanup(), this.configManager
        );
      }
      
      // Agendar backup diário
      if (this.config.enableDailyBackup) {
        this.cronService.scheduleDailyBackup(() => 
          this.handleDailyBackup()
        );
      }
      
      this.isRunning = true;
      console.log('✅ Agendamento de produção iniciado');
      
      // Mostrar jobs ativos
      this.cronService.listActiveJobs();
      
    } catch (error) {
      this.errorHandler.logError(error, 'ProductionScheduler.start');
      throw error;
    }
  }

  /**
   * Para o agendamento de produção
   */
  async stop() {
    try {
      if (!this.isRunning) {
        console.log('⚠️ ProductionScheduler não está rodando');
        return;
      }

      console.log('🛑 Parando agendamento de produção...');
      
      // Parar serviço de cron
      this.cronService.stop();
      
      this.isRunning = false;
      console.log('✅ Agendamento de produção parado');
      
    } catch (error) {
      this.errorHandler.logError(error, 'ProductionScheduler.stop');
      throw error;
    }
  }

  /**
   * Manipula verificação de pacientes
   */
  async handlePatientCheck() {
    try {
      console.log('\n\n\n🔍 ===============================================');
      console.log('   INICIANDO NOVO CICLO DE VERIFICAÇÃO');
      console.log('===============================================');
      
      // Verificar se é horário comercial (considerando configuração ignoreBusinessHours)
      const ignoreBusinessHours = this.configManager.shouldIgnoreBusinessHours();
      if (!ignoreBusinessHours && (!TimeUtils.isBusinessHours() || !TimeUtils.isWorkingDay())) {
        console.log('🕐 Fora do horário comercial - apenas monitorando');
        return;
      }

      // Verificar se fluxo está pausado
      if (this.configManager.isFlowPaused()) {
        console.log('⏸️ Fluxo pausado - apenas monitorando');
        return;
      }

      // Verificar pacientes elegíveis
      const checkResult = await this.monitoringService.checkEligiblePatients();
      
      // Processar pacientes elegíveis para mensagem de 30min
      if (this.config.enable30MinuteMessages && checkResult.eligible30Min.length > 0) {
        await this.handle30MinuteMessages(checkResult.eligible30Min);
      }
      
      // Processar pacientes elegíveis para mensagem de fim de dia
      const isEndOfDayPaused = this.configManager.isEndOfDayPaused();
      const isEndOfDayTime = TimeUtils.isEndOfDayTimeWithTolerance(5);
      
      if (this.config.enableEndOfDayMessages && !isEndOfDayPaused && isEndOfDayTime && checkResult.eligibleEndOfDay.length > 0) {
        await this.handleEndOfDayMessages(checkResult.eligibleEndOfDay);
      }
      
      console.log('✅ CICLO DE VERIFICAÇÃO CONCLUÍDO');
      console.log('===============================================\n');
      
    } catch (error) {
      console.log('❌ ERRO NO CICLO DE VERIFICAÇÃO');
      console.log('===============================================\n');
      this.errorHandler.logError(error, 'ProductionScheduler.handlePatientCheck');
    }
  }

  /**
   * Manipula mensagens de 30 minutos
   */
  async handle30MinuteMessages(eligiblePatients) {
    try {
      console.log(`⏰ Processando ${eligiblePatients.length} pacientes elegíveis para mensagem de 30min...`);
      
      const results = await this.messageService.send30MinuteMessages(eligiblePatients);
      
      // Marcar pacientes como processados no JsonPatientManager
      for (const patient of eligiblePatients) {
        await this.monitoringService.jsonPatientManager.markPatientAsProcessed(patient.id, results.messageInfo);
      }
      
      console.log(`✅ Mensagens de 30min processadas: ${results.sent} enviadas, ${results.failed} falharam`);
      
      return results;
      
    } catch (error) {
      this.errorHandler.logError(error, 'ProductionScheduler.handle30MinuteMessages');
    }
  }

  /**
   * Manipula mensagens de fim de dia
   */
  async handleEndOfDayMessages(eligiblePatients = null) {
    try {
      console.log('🌅 Processando mensagens de fim de dia...');
      
      let patientsToProcess = eligiblePatients;
      
      // Se não foram fornecidos pacientes, buscar elegíveis
      if (!patientsToProcess) {
        const checkResult = await this.monitoringService.checkEligiblePatients();
        patientsToProcess = checkResult.eligibleEndOfDay;
      }
      
      if (patientsToProcess.length > 0) {
        const results = await this.messageService.sendEndOfDayMessages(patientsToProcess);
        
        // Marcar pacientes como processados no JsonPatientManager
        for (const patient of patientsToProcess) {
          await this.monitoringService.jsonPatientManager.markPatientAsProcessed(patient.id, results.messageInfo);
        }
        
        console.log(`✅ Mensagens de fim de dia processadas: ${results.sent} enviadas, ${results.failed} falharam`);
      } else {
        console.log('📭 Nenhum paciente elegível para mensagem de fim de dia');
      }
      
    } catch (error) {
      this.errorHandler.logError(error, 'ProductionScheduler.handleEndOfDayMessages');
    }
  }

  /**
   * Manipula limpeza diária
   */
  async handleDailyCleanup() {
    try {
      console.log('🧹 Executando limpeza diária...');
      
      await this.monitoringService.executeDailyCleanup();
      
      // Limpar estatísticas dos serviços
      this.messageService.clearStats();
      
      console.log('✅ Limpeza diária concluída');
      
    } catch (error) {
      this.errorHandler.logError(error, 'ProductionScheduler.handleDailyCleanup');
    }
  }

  /**
   * Manipula backup diário
   */
  async handleDailyBackup() {
    try {
      console.log('💾 Executando backup diário...');
      
      // Criar backup dos dados JSON
      await this.monitoringService.jsonPatientManager.createBackup();
      
      console.log('✅ Backup diário concluído');
      
    } catch (error) {
      this.errorHandler.logError(error, 'ProductionScheduler.handleDailyBackup');
    }
  }

  /**
   * Executa verificação manual de pacientes
   */
  async runManualPatientCheck() {
    try {
      console.log('🔍 Executando verificação manual de pacientes...');
      
      await this.handlePatientCheck();
      
      console.log('✅ Verificação manual concluída');
      
    } catch (error) {
      this.errorHandler.logError(error, 'ProductionScheduler.runManualPatientCheck');
      throw error;
    }
  }

  /**
   * Executa envio manual de mensagens de fim de dia
   */
  async runManualEndOfDayMessages() {
    try {
      console.log('🌅 Executando mensagens de fim de dia manual...');
      
      await this.handleEndOfDayMessages();
      
      console.log('✅ Mensagens de fim de dia manuais concluídas');
      
    } catch (error) {
      this.errorHandler.logError(error, 'ProductionScheduler.runManualEndOfDayMessages');
      throw error;
    }
  }

  /**
   * Atualiza configurações do agendador
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configurações do agendador atualizadas:', this.config);
  }

  /**
   * Obtém status do agendador
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isInitialized: this.isInitialized,
      config: this.config,
      cronJobs: this.cronService ? this.cronService.getJobsStatus() : null,
      monitoringStats: this.monitoringService ? this.monitoringService.getStats() : null,
      messageStats: this.messageService ? this.messageService.getStats() : null
    };
  }

  /**
   * Obtém estatísticas detalhadas
   */
  getDetailedStats() {
    return {
      scheduler: {
        isRunning: this.isRunning,
        isInitialized: this.isInitialized,
        config: this.config
      },
      monitoring: this.monitoringService ? this.monitoringService.getStats() : null,
      messages: this.messageService ? this.messageService.getStats() : null,
      cronJobs: this.cronService ? this.cronService.getJobsStatus() : null,
      timeInfo: TimeUtils.getTimeInfo()
    };
  }

  /**
   * Lista todos os jobs ativos
   */
  listActiveJobs() {
    if (this.cronService) {
      this.cronService.listActiveJobs();
    } else {
      console.log('⚠️ CronService não inicializado');
    }
  }
}

module.exports = { ProductionScheduler };
