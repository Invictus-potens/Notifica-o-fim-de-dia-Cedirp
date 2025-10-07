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
          this.handleEndOfDayMessages(), this.configManager
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
   * Manipula verificação de pacientes (FUNÇÃO UNIFICADA - COMPATIBILIDADE)
   * Agora chama as funções separadas internamente
   */
  async handlePatientCheck() {
    try {
      console.log('\n\n\n🔍 ===============================================');
      console.log('   INICIANDO CICLO DE VERIFICAÇÃO UNIFICADO');
      console.log('===============================================');
      
      // Verificar se é horário comercial (considerando configuração ignoreBusinessHours)
      const ignoreBusinessHours = this.configManager.shouldIgnoreBusinessHours();
      if (!ignoreBusinessHours && (!TimeUtils.isBusinessHours() || !TimeUtils.isWorkingDay())) {
        console.log('🕐 Fora do horário comercial - apenas monitorando');
        return { 
          thirtyMinute: { sent: 0, failed: 0, blocked: 0, details: [] },
          endOfDay: { sent: 0, failed: 0, blocked: 0, details: [] },
          timestamp: new Date().toISOString()
        };
      }

      // Verificar se fluxo está pausado
      if (this.configManager.isFlowPaused()) {
        console.log('⏸️ Fluxo pausado - apenas monitorando');
        return { 
          thirtyMinute: { sent: 0, failed: 0, blocked: 0, details: [] },
          endOfDay: { sent: 0, failed: 0, blocked: 0, details: [] },
          timestamp: new Date().toISOString()
        };
      }

      // 🌸 NOVA IMPLEMENTAÇÃO: Chamar funções separadas
      // 🚫 COMENTADO: Envio de mensagens de 30min (Felipe-chan pediu para comentar)
      // const thirtyMinuteResults = await this.handle30MinuteCheck();
      const thirtyMinuteResults = { sent: 0, failed: 0, blocked: 0, details: [], messageType: '30min', timestamp: new Date().toISOString() };
      const endOfDayResults = await this.handleEndOfDayCheck();
      
      // Consolidar resultados
      const consolidatedResults = {
        thirtyMinute: thirtyMinuteResults,
        endOfDay: endOfDayResults,
        totalSent: thirtyMinuteResults.sent + endOfDayResults.sent,
        totalFailed: thirtyMinuteResults.failed + endOfDayResults.failed,
        totalBlocked: thirtyMinuteResults.blocked + endOfDayResults.blocked,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ CICLO DE VERIFICAÇÃO UNIFICADO CONCLUÍDO');
      console.log(`📊 Resumo: ${consolidatedResults.totalSent} enviadas, ${consolidatedResults.totalFailed} falharam, ${consolidatedResults.totalBlocked} bloqueadas`);
      console.log('===============================================\n');
      
      return consolidatedResults;
      
    } catch (error) {
      console.log('❌ ERRO NO CICLO DE VERIFICAÇÃO UNIFICADO');
      console.log('===============================================\n');
      this.errorHandler.logError(error, 'ProductionScheduler.handlePatientCheck');
      
      return {
        thirtyMinute: { sent: 0, failed: 0, blocked: 0, details: [], error: error.message },
        endOfDay: { sent: 0, failed: 0, blocked: 0, details: [], error: error.message },
        timestamp: new Date().toISOString()
      };
    }
  }


  /* async handle30MinuteCheck() {
    try {
      console.log('\n\n\n⏰ ===============================================');
      console.log('   VERIFICAÇÃO ESPECÍFICA: MENSAGENS DE 30MIN');
      console.log('===============================================');
      
      // Verificar se é horário comercial (mensagem de 30min só durante expediente)
      const ignoreBusinessHours = this.configManager.shouldIgnoreBusinessHours();
      if (!ignoreBusinessHours && (!TimeUtils.isBusinessHours() || !TimeUtils.isWorkingDay())) {
        console.log('🕐 Fora do horário comercial - mensagens de 30min não são enviadas');
        return { sent: 0, failed: 0, blocked: 0, details: [], messageType: '30min', timestamp: new Date().toISOString() };
      }

      // Verificar se fluxo está pausado
      if (this.configManager.isFlowPaused()) {
        console.log('⏸️ Fluxo pausado - mensagens de 30min não são enviadas');
        return { sent: 0, failed: 0, blocked: 0, details: [], messageType: '30min', timestamp: new Date().toISOString() };
      }

      // Verificar se mensagens de 30min estão habilitadas
      if (!this.config.enable30MinuteMessages) {
        console.log('🚫 Mensagens de 30min desabilitadas via configuração');
        return { sent: 0, failed: 0, blocked: 0, details: [], messageType: '30min', timestamp: new Date().toISOString() };
      }

      // Buscar APENAS pacientes elegíveis para 30min
      const eligible30Min = await this.monitoringService.getEligiblePatientsFor30MinMessage();
      console.log(`⏰ ${eligible30Min.length} pacientes elegíveis para mensagem de 30min`);
      
      if (eligible30Min.length > 0) {
        const results = await this.handle30MinuteMessages(eligible30Min);
        console.log('✅ VERIFICAÇÃO DE 30MIN CONCLUÍDA');
        console.log(`📊 30min: ${results.sent} enviadas, ${results.failed} falharam, ${results.blocked} bloqueadas`);
        console.log('===============================================\n');
        
        return {
          ...results,
          messageType: '30min',
          timestamp: new Date().toISOString()
        };
      } else {
        console.log('📭 Nenhum paciente elegível para mensagem de 30min');
        console.log('===============================================\n');
        return { sent: 0, failed: 0, blocked: 0, details: [], messageType: '30min', timestamp: new Date().toISOString() };
      }
      
    } catch (error) {
      console.log('❌ ERRO NA VERIFICAÇÃO DE 30MIN');
      console.log('===============================================\n');
      this.errorHandler.logError(error, 'ProductionScheduler.handle30MinuteCheck');
      return { sent: 0, failed: 0, blocked: 0, details: [], error: error.message, messageType: '30min', timestamp: new Date().toISOString() };
    }
  } */

  /**
   * Manipula mensagens de 30 minutos
   * 🛡️ ATUALIZADO: Sistema de reserva para evitar race conditions
   */
  /* async handle30MinuteMessages(eligiblePatients) {
    try {
      console.log(`⏰ Processando ${eligiblePatients.length} pacientes elegíveis para mensagem de 30min...`);
      
      const results = { sent: 0, failed: 0, blocked: 0, details: [] };
      const messageInfo = {
        actionCardId: this.configManager.get30MinActionCardId(),
        sentAt: new Date(),
        sentAtFormatted: new Date().toLocaleString('pt-BR')
      };
      
      for (const patient of eligiblePatients) {
        try {
          // 🛡️ RESERVAR tag ANTES do envio (evita race condition)
          const tagReserved = await this.monitoringService.jsonPatientManager.reserveMessageTag(
            patient.id, 
            '30min',
            messageInfo
          );
          
          if (!tagReserved) {
            console.log(`🚫 Paciente ${patient.name} bloqueado - tag já reservada`);
            results.blocked++;
            results.details.push({
              patient: patient.name,
              phone: patient.phone,
              status: 'blocked',
              reason: 'Tag já reservada'
            });
            continue;
          }
          
          // Enviar mensagem
          const sendResult = await this.messageService.sendActionCard(patient, messageInfo.actionCardId, true, '30min');
          
          if (sendResult.success) {
            // ✅ Confirmar envio bem-sucedido
            await this.monitoringService.jsonPatientManager.confirmMessageSent(
              patient.id,
              '30min',
              messageInfo
            );
            
            results.sent++;
            results.details.push({
              patient: patient.name,
              phone: patient.phone,
              status: 'sent',
              actionCardId: messageInfo.actionCardId
            });
            
            console.log(`✅ Mensagem de 30min enviada para ${patient.name}`);
          } else {
            // ❌ Falha no envio - remover tag reservada
            console.log(`❌ Falha no envio para ${patient.name} - removendo tag reservada`);
            // TODO: Implementar remoção de tag reservada em caso de falha
            results.failed++;
            results.details.push({
              patient: patient.name,
              phone: patient.phone,
              status: 'failed',
              error: sendResult.error
            });
          }
          
        } catch (error) {
          console.error(`❌ Erro ao processar ${patient.name}:`, error.message);
          results.failed++;
          results.details.push({
            patient: patient.name,
            phone: patient.phone,
            status: 'error',
            error: error.message
          });
        }
      }
      
      console.log(`✅ Mensagens de 30min processadas: ${results.sent} enviadas, ${results.failed} falharam, ${results.blocked} bloqueadas`);
      
      return results;
      
    } catch (error) {
      this.errorHandler.logError(error, 'ProductionScheduler.handle30MinuteMessages');
    }
  } */

  /**
   * 🌅 NOVA FUNÇÃO: Verifica pacientes elegíveis para mensagem de fim de dia (18h)
   * Felipe-chan, esta função é independente e só verifica pacientes de fim de dia! 💕
   */
  async handleEndOfDayCheck() {
    try {
      console.log('\n\n\n🌅 ===============================================');
      console.log('   VERIFICAÇÃO ESPECÍFICA: MENSAGENS DE FIM DE DIA');
      console.log('===============================================');
      
      // Verificar se é horário de fim de expediente
      const isEndOfDayTime = TimeUtils.isEndOfDayTimeWithTolerance(5);
      if (!isEndOfDayTime) {
        console.log('🕐 Não é horário de fim de expediente - mensagens de fim de dia não são enviadas');
        return { sent: 0, failed: 0, blocked: 0, details: [], messageType: 'end_of_day', timestamp: new Date().toISOString() };
      }

      // Verificar se é dia útil (apenas se não estiver configurado para ignorar horário comercial)
      const ignoreBusinessHours = this.configManager.shouldIgnoreBusinessHours();
      if (!ignoreBusinessHours && !TimeUtils.isWorkingDay()) {
        console.log('📅 Não é dia útil - mensagens de fim de dia não são enviadas');
        return { sent: 0, failed: 0, blocked: 0, details: [], messageType: 'end_of_day', timestamp: new Date().toISOString() };
      }

      // Verificar se mensagem de fim de dia está pausada
      const isEndOfDayPaused = this.configManager.isEndOfDayPaused();
      if (isEndOfDayPaused) {
        console.log('⏸️ Mensagem de fim de dia está pausada via configuração');
        return { sent: 0, failed: 0, blocked: 0, details: [], messageType: 'end_of_day', timestamp: new Date().toISOString() };
      }

      // Verificar se fluxo está pausado
      if (this.configManager.isFlowPaused()) {
        console.log('⏸️ Fluxo pausado - mensagens de fim de dia não são enviadas');
        return { sent: 0, failed: 0, blocked: 0, details: [], messageType: 'end_of_day', timestamp: new Date().toISOString() };
      }

      // Verificar se mensagens de fim de dia estão habilitadas
      if (!this.config.enableEndOfDayMessages) {
        console.log('🚫 Mensagens de fim de dia desabilitadas via configuração');
        return { sent: 0, failed: 0, blocked: 0, details: [], messageType: 'end_of_day', timestamp: new Date().toISOString() };
      }

      // Buscar APENAS pacientes elegíveis para fim de dia
      const eligibleEndOfDay = await this.monitoringService.getEligiblePatientsForEndOfDayMessage();
      console.log(`🌅 ${eligibleEndOfDay.length} pacientes elegíveis para mensagem de fim de dia`);
      
      if (eligibleEndOfDay.length > 0) {
        const results = await this.handleEndOfDayMessages(eligibleEndOfDay);
        console.log('✅ VERIFICAÇÃO DE FIM DE DIA CONCLUÍDA');
        console.log(`📊 Fim de dia: ${results.sent} enviadas, ${results.failed} falharam, ${results.blocked} bloqueadas`);
        console.log('===============================================\n');
        
        return {
          ...results,
          messageType: 'end_of_day',
          timestamp: new Date().toISOString()
        };
      } else {
        console.log('📭 Nenhum paciente elegível para mensagem de fim de dia');
        console.log('===============================================\n');
        return { sent: 0, failed: 0, blocked: 0, details: [], messageType: 'end_of_day', timestamp: new Date().toISOString() };
      }
      
    } catch (error) {
      console.log('❌ ERRO NA VERIFICAÇÃO DE FIM DE DIA');
      console.log('===============================================\n');
      this.errorHandler.logError(error, 'ProductionScheduler.handleEndOfDayCheck');
      return { sent: 0, failed: 0, blocked: 0, details: [], error: error.message, messageType: 'end_of_day', timestamp: new Date().toISOString() };
    }
  }

  /**
   * Manipula mensagens de fim de dia
   * 🛡️ ATUALIZADO: Sistema de reserva para evitar race conditions
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
        console.log(`🌅 Processando ${patientsToProcess.length} pacientes para mensagem de fim de dia...`);
        
        const results = { sent: 0, failed: 0, blocked: 0, details: [] };
        const messageInfo = {
          actionCardId: this.configManager.getEndOfDayActionCardId(),
          sentAt: new Date(),
          sentAtFormatted: new Date().toLocaleString('pt-BR')
        };
        
        for (const patient of patientsToProcess) {
          try {
            // 🛡️ RESERVAR tag ANTES do envio (evita race condition)
            const tagReserved = await this.monitoringService.jsonPatientManager.reserveMessageTag(
              patient.id, 
              'end_of_day',
              messageInfo
            );
            
            if (!tagReserved) {
              console.log(`🚫 Paciente ${patient.name} bloqueado - tag já reservada`);
              results.blocked++;
              results.details.push({
                patient: patient.name,
                phone: patient.phone,
                status: 'blocked',
                reason: 'Tag já reservada'
              });
              continue;
            }
            
            // Enviar mensagem
            const sendResult = await this.messageService.sendActionCard(patient, messageInfo.actionCardId, true, 'end_of_day');
            
            if (sendResult.success) {
              // ✅ Confirmar envio bem-sucedido
              await this.monitoringService.jsonPatientManager.confirmMessageSent(
                patient.id,
                'end_of_day',
                messageInfo
              );
              
              results.sent++;
              results.details.push({
                patient: patient.name,
                phone: patient.phone,
                status: 'sent',
                actionCardId: messageInfo.actionCardId
              });
              
              console.log(`✅ Mensagem de fim de dia enviada para ${patient.name}`);
            } else {
              // ❌ Falha no envio - remover tag reservada
              console.log(`❌ Falha no envio para ${patient.name} - removendo tag reservada`);
              // TODO: Implementar remoção de tag reservada em caso de falha
              results.failed++;
              results.details.push({
                patient: patient.name,
                phone: patient.phone,
                status: 'failed',
                error: sendResult.error
              });
            }
            
          } catch (error) {
            console.error(`❌ Erro ao processar ${patient.name}:`, error.message);
            results.failed++;
            results.details.push({
              patient: patient.name,
              phone: patient.phone,
              status: 'error',
              error: error.message
            });
          }
        }
        
        console.log(`✅ Mensagens de fim de dia processadas: ${results.sent} enviadas, ${results.failed} falharam, ${results.blocked} bloqueadas`);
        
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
