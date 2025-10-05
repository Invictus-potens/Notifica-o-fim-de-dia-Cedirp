const { KrolikApiClient } = require('./KrolikApiClient');
const { ConfigManager } = require('./ConfigManager');
const { MessageHistoryManager } = require('./MessageHistoryManager');
const { UserActionLogger } = require('./UserActionLogger');

/**
 * Serviço de envio de mensagens
 * Coordena o envio de action cards e templates para pacientes
 */
class MessageService {
  constructor(errorHandler, configManager, metricsCallback = null) {
    this.errorHandler = errorHandler;
    this.configManager = configManager;
    this.krolikApiClient = null;
    this.messageHistoryManager = new MessageHistoryManager(errorHandler);
    this.userActionLogger = new UserActionLogger(errorHandler);
    this.metricsCallback = metricsCallback; // Callback para incrementar métricas
    
    this.stats = {
      totalSent: 0,
      totalFailed: 0,
      lastSent: null,
      errors: []
    };
  }

  /**
   * Inicializa o serviço de mensagens
   */
  async initialize(krolikCredentials) {
    try {
      console.log('🔧 Inicializando MessageService...');
      
      if (krolikCredentials) {
        this.krolikApiClient = new KrolikApiClient({
          baseURL: krolikCredentials.baseURL,
          token: krolikCredentials.token
        });
        
        // Testar conexão
        await this.krolikApiClient.testConnection();
        console.log('✅ Conexão com API CAM Krolik estabelecida');
      }
      
      console.log('✅ MessageService inicializado');
      
    } catch (error) {
      this.errorHandler.logError(error, 'MessageService.initialize');
      throw error;
    }
  }

  /**
   * Envia action card para um paciente
   */
  async sendActionCard(patient, actionCardId = null, forceSend = true, messageType = 'manual') {
    try {
      if (!this.krolikApiClient) {
        throw new Error('KrolikApiClient não inicializado');
      }

      // Usar action card ID fornecido ou o padrão da configuração
      const cardId = actionCardId || this.configManager.getActionCardId();
      
      if (!cardId) {
        throw new Error('ID do action card não especificado');
      }

      // Validar dados do paciente
      if (!patient.phone || !patient.contactId) {
        throw new Error('Dados do paciente incompletos (phone ou contactId faltando)');
      }

      // Preparar payload
      const payload = {
        number: patient.phone,
        contactId: patient.contactId,
        action_card_id: cardId,
        forceSend: forceSend
      };

      console.log(`📤 Enviando action card para ${patient.name} (${patient.phone})`);
      console.log(`📋 Payload:`, payload);

      // Enviar mensagem
      const result = await this.krolikApiClient.sendActionCard(payload);
      
      // Atualizar estatísticas
      this.stats.totalSent++;
      this.stats.lastSent = new Date().toISOString();
      
      // Incrementar métricas persistentes
      if (this.metricsCallback && this.metricsCallback.incrementSent) {
        await this.metricsCallback.incrementSent(messageType);
      }
      
      // Registrar mensagem no histórico
      await this.messageHistoryManager.recordMessageSent({
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        actionCardId: cardId,
        messageType: messageType, // Usar tipo fornecido como parâmetro
        sentAt: new Date(),
        success: true
      });
      
      console.log(`✅ Action card enviado com sucesso para ${patient.name}`);
      
      // Log automático para ações do usuário (envio automático)
      await this.userActionLogger.logAutomaticMessage(
        patient.name,
        cardId,
        messageType,
        true,
        {
          patientPhone: patient.phone,
          contactId: patient.contactId
        }
      );
      
      return {
        success: true,
        patient: patient.name,
        phone: patient.phone,
        actionCardId: cardId,
        result: result,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.stats.totalFailed++;
      this.stats.errors.push({
        patient: patient.name,
        phone: patient.phone,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.error(`❌ Erro ao enviar action card para ${patient.name}:`, error.message);
      
      // Log automático de falha
      await this.userActionLogger.logAutomaticMessage(
        patient.name,
        actionCardId || 'N/A',
        'automática',
        false,
        {
          patientPhone: patient.phone,
          contactId: patient.contactId,
          error: error.message
        }
      );
      
      return {
        success: false,
        patient: patient.name,
        phone: patient.phone,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Envia action card para um paciente (versão interna sem registro no histórico)
   */
  async sendActionCardInternal(patient, cardId = null, messageType = 'manual') {
    try {
      if (!this.krolikApiClient) {
        throw new Error('Cliente Krolik não inicializado');
      }

      const actionCardId = cardId || this.configManager.getDefaultActionCardId();
      
      if (!actionCardId) {
        throw new Error('ID do action card não fornecido');
      }

      console.log(`📤 Enviando action card ${actionCardId} para ${patient.name} (${patient.phone})`);

      const payload = {
        action_card_id: actionCardId,
        contactId: patient.contactId,
        number: patient.phone
      };

      console.log(`📋 Payload:`, payload);

      // Enviar mensagem
      const result = await this.krolikApiClient.sendActionCard(payload);
      
      // Atualizar estatísticas
      this.stats.totalSent++;
      this.stats.lastSent = new Date().toISOString();
      
      // Incrementar métricas persistentes
      if (this.metricsCallback && this.metricsCallback.incrementSent) {
        await this.metricsCallback.incrementSent(messageType);
      }
      
      console.log(`✅ Action card enviado com sucesso para ${patient.name}`);
      
      return {
        success: true,
        patient: patient.name,
        phone: patient.phone,
        actionCardId: actionCardId,
        result: result,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.stats.totalFailed++;
      this.stats.errors.push({
        patient: patient.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Incrementar métricas de falha
      if (this.metricsCallback && this.metricsCallback.incrementFailed) {
        await this.metricsCallback.incrementFailed();
      }
      
      console.error(`❌ Erro ao enviar action card para ${patient.name}:`, error.message);
      
      return {
        success: false,
        patient: patient.name,
        phone: patient.phone,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Envia action cards para múltiplos pacientes
   */
  async sendActionCardsToMultiple(patients, actionCardId = null, delayBetweenMessages = 1000, messageType = 'manual') {
    try {
      console.log(`📤 Enviando action cards para ${patients.length} pacientes...`);
      
      const results = {
        total: patients.length,
        sent: 0,
        failed: 0,
        details: []
      };

      for (let i = 0; i < patients.length; i++) {
        const patient = patients[i];
        
        try {
          const result = await this.sendActionCardInternal(patient, actionCardId, messageType);
          results.details.push(result);
          
          if (result.success) {
            results.sent++;
          } else {
            results.failed++;
          }
          
          // Pausa entre envios para evitar spam
          if (i < patients.length - 1 && delayBetweenMessages > 0) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenMessages));
          }
          
        } catch (error) {
          results.failed++;
          results.details.push({
            success: false,
            patient: patient.name,
            phone: patient.phone,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          
          console.error(`❌ Erro ao processar paciente ${patient.name}:`, error.message);
        }
      }
      
      console.log(`📊 Resultado do envio em lote: ${results.sent} enviados, ${results.failed} falharam`);
      
      return results;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MessageService.sendActionCardsToMultiple');
      throw error;
    }
  }

  /**
   * Envia mensagem de 30 minutos para pacientes elegíveis
   */
  async send30MinuteMessages(eligiblePatients) {
    try {
      console.log(`⏰ Enviando mensagens de 30min para ${eligiblePatients.length} pacientes...`);
      
      const actionCardId = this.configManager.get30MinActionCardId();
      const sentAt = new Date();
      
      const results = await this.sendActionCardsToMultiple(
        eligiblePatients, 
        actionCardId, 
        2000, // 2 segundos entre mensagens
        '30min' // Tipo de mensagem correto
      );
      
      // Registrar mensagens no histórico
      for (const patient of eligiblePatients) {
        await this.messageHistoryManager.recordMessageSent({
          patientId: patient.id,
          patientName: patient.name,
          patientPhone: patient.phone,
          actionCardId,
          messageType: '30min',
          sentAt,
          success: true
        });
      }
      
      // Adicionar informações da mensagem aos resultados
      results.messageInfo = {
        actionCardId,
        messageType: '30min',
        sentAt,
        sentAtFormatted: sentAt.toLocaleString('pt-BR')
      };
      
      // 🎀 SISTEMA DE TAGS: As tags são adicionadas no ProductionScheduler
      // A lista de exclusões abaixo ainda é usada como backup/compatibilidade
      for (const patient of eligiblePatients) {
        const patientKey = `${patient.name}_${patient.phone}_${patient.sectorId}`;
        this.configManager.addToExclusionList(patientKey);
      }
      
      console.log(`✅ Mensagens de 30min processadas: ${results.sent} enviadas`);
      
      return results;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MessageService.send30MinuteMessages');
      throw error;
    }
  }

  /**
   * Envia mensagens de fim de dia para pacientes elegíveis
   */
  async sendEndOfDayMessages(eligiblePatients) {
    try {
      console.log(`🌅 Enviando mensagens de fim de dia para ${eligiblePatients.length} pacientes...`);
      
      const actionCardId = this.configManager.getEndOfDayActionCardId();
      const sentAt = new Date();
      
      const results = await this.sendActionCardsToMultiple(
        eligiblePatients, 
        actionCardId, 
        1500, // 1.5 segundos entre mensagens
        'end_of_day' // Tipo de mensagem correto
      );
      
      // Registrar mensagens no histórico
      for (const patient of eligiblePatients) {
        await this.messageHistoryManager.recordMessageSent({
          patientId: patient.id,
          patientName: patient.name,
          patientPhone: patient.phone,
          actionCardId,
          messageType: 'end_of_day',
          sentAt,
          success: true
        });
      }
      
      // Adicionar informações da mensagem aos resultados
      results.messageInfo = {
        actionCardId,
        messageType: 'end_of_day',
        sentAt,
        sentAtFormatted: sentAt.toLocaleString('pt-BR')
      };
      
      // 🎀 SISTEMA DE TAGS: As tags são adicionadas no ProductionScheduler
      // A lista de exclusões abaixo ainda é usada como backup/compatibilidade
      for (const patient of eligiblePatients) {
        const patientKey = `${patient.name}_${patient.phone}_${patient.sectorId}`;
        this.configManager.addToExclusionList(patientKey);
      }
      
      console.log(`✅ Mensagens de fim de dia processadas: ${results.sent} enviadas`);
      
      return results;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MessageService.sendEndOfDayMessages');
      throw error;
    }
  }

  /**
   * Testa envio de mensagem para um paciente específico
   */
  async testMessageSending(patient, actionCardId = null) {
    try {
      console.log(`🧪 Testando envio de mensagem para ${patient.name}...`);
      
      const result = await this.sendActionCard(patient, actionCardId);
      
      if (result.success) {
        console.log(`✅ Teste de envio bem-sucedido para ${patient.name}`);
      } else {
        console.log(`❌ Teste de envio falhou para ${patient.name}: ${result.error}`);
      }
      
      return result;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MessageService.testMessageSending');
      throw error;
    }
  }

  /**
   * Obtém estatísticas do serviço de mensagens
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalSent > 0 
        ? ((this.stats.totalSent / (this.stats.totalSent + this.stats.totalFailed)) * 100).toFixed(2)
        : 0,
      lastErrors: this.stats.errors.slice(-5) // Últimos 5 erros
    };
  }

  /**
   * Limpa estatísticas do serviço
   */
  clearStats() {
    this.stats = {
      totalSent: 0,
      totalFailed: 0,
      lastSent: null,
      errors: []
    };
    
    console.log('🧹 Estatísticas do MessageService limpas');
  }

  /**
   * Obtém lista de action cards disponíveis
   */
  async getAvailableActionCards() {
    try {
      if (!this.krolikApiClient) {
        throw new Error('KrolikApiClient não inicializado');
      }
      
      const actionCards = await this.krolikApiClient.listActionCards();
      console.log(`📋 ${actionCards.length} action cards disponíveis`);
      
      return actionCards;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MessageService.getAvailableActionCards');
      throw error;
    }
  }

  /**
   * Valida se um paciente pode receber mensagens
   */
  validatePatientForMessage(patient) {
    const errors = [];
    
    if (!patient) {
      errors.push('Paciente não fornecido');
      return { isValid: false, errors };
    }
    
    if (!patient.name) {
      errors.push('Nome do paciente não fornecido');
    }
    
    if (!patient.phone) {
      errors.push('Telefone do paciente não fornecido');
    }
    
    if (!patient.contactId) {
      errors.push('ContactId do paciente não fornecido');
    }
    
    // Validar formato do telefone (básico)
    if (patient.phone && !/^\d{10,15}$/.test(patient.phone.replace(/\D/g, ''))) {
      errors.push('Formato de telefone inválido');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtém status do serviço
   */
  getStatus() {
    return {
      isInitialized: !!this.krolikApiClient,
      totalSent: this.stats.totalSent,
      totalFailed: this.stats.totalFailed,
      lastSent: this.stats.lastSent,
      recentErrors: this.stats.errors.length
    };
  }
}

module.exports = { MessageService };
