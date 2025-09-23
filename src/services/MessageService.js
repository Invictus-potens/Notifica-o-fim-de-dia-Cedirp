const { KrolikApiClient } = require('./KrolikApiClient');
const { ConfigManager } = require('./ConfigManager');
const { MultiChannelManager } = require('./MultiChannelManager');
const { MessageHistoryManager } = require('./MessageHistoryManager');
const { UserActionLogger } = require('./UserActionLogger');

/**
 * Serviço de envio de mensagens
 * Coordena o envio de action cards e templates para pacientes usando múltiplos canais
 */
class MessageService {
  constructor(errorHandler, configManager) {
    this.errorHandler = errorHandler;
    this.configManager = configManager;
    this.multiChannelManager = new MultiChannelManager(configManager, errorHandler);
    this.messageHistoryManager = new MessageHistoryManager(errorHandler);
    this.userActionLogger = new UserActionLogger(errorHandler);
    
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
  async initialize() {
    try {
      console.log('🔧 Inicializando MessageService com múltiplos canais...');
      
      // MultiChannelManager já foi inicializado no construtor
      const activeChannels = this.multiChannelManager.getActiveChannels();
      console.log(`📱 Canais ativos carregados: ${activeChannels.length}`);
      
      // Testar conexão de cada canal ativo
      for (const channel of activeChannels) {
        try {
          await channel.apiClient.testConnection();
          console.log(`✅ Canal ${channel.name} (${channel.number}) - Conexão OK`);
        } catch (error) {
          console.warn(`⚠️ Canal ${channel.name} (${channel.number}) - Falha na conexão: ${error.message}`);
        }
      }
      
      console.log('✅ MessageService inicializado com múltiplos canais');
      
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
      const phone = patient.phone;
      console.log(`📤 Preparando envio de mensagem para ${patient.name} (${phone})`);
      
      // 1. Verificar se já existe contexto de conversa
      let channel = this.multiChannelManager.getChannelForConversation(phone);
      
      if (!channel) {
        // 2. Nova conversa - escolher canal apropriado
        channel = this.multiChannelManager.getBestChannelForPatient(patient);
        
        if (!channel) {
          throw new Error('Nenhum canal ativo disponível');
        }
        
        // 3. Registrar novo contexto de conversa
        this.multiChannelManager.registerConversation(phone, channel.id);
        
        console.log(`🆕 Nova conversa: ${phone} -> ${channel.name} (${channel.number})`);
      } else {
        console.log(`🔄 Continuando conversa: ${phone} -> ${channel.name} (${channel.number})`);
      }

      // 4. Usar action card ID fornecido ou o padrão da configuração
      const cardId = actionCardId || this.configManager.getActionCardId();
      
      if (!cardId) {
        throw new Error('ID do action card não especificado');
      }

      // 5. Validar dados do paciente
      if (!patient.phone || !patient.contactId) {
        throw new Error('Dados do paciente incompletos (phone ou contactId faltando)');
      }

      // 6. Preparar payload
      const payload = {
        number: patient.phone,
        contactId: patient.contactId,
        action_card_id: cardId,
        forceSend: forceSend
      };

      console.log(`📤 Enviando action card via ${channel.name} (${channel.number})`);
      console.log(`📋 Payload:`, payload);

      // 7. Enviar mensagem usando o canal específico com fallback
      let result;
      let success = false;
      let fallbackUsed = false;
      
      try {
        result = await channel.apiClient.sendActionCard(payload);
        success = true;
        console.log(`✅ Mensagem enviada com sucesso via ${channel.name}`);
      } catch (error) {
        console.warn(`⚠️ Falha no canal principal ${channel.name}: ${error.message}`);
        
        // Tentar fallback para outro canal saudável
        const fallbackChannel = await this.tryFallbackChannel(phone, patient, channel.id);
        if (fallbackChannel) {
          try {
            result = await fallbackChannel.apiClient.sendActionCard(payload);
            success = true;
            fallbackUsed = true;
            channel = fallbackChannel; // Atualizar referência do canal
            console.log(`✅ Mensagem enviada via canal de fallback: ${fallbackChannel.name}`);
          } catch (fallbackError) {
            console.error(`❌ Falha também no canal de fallback ${fallbackChannel.name}: ${fallbackError.message}`);
            throw new Error(`Falha em todos os canais disponíveis. Principal: ${error.message}, Fallback: ${fallbackError.message}`);
          }
        } else {
          throw new Error(`Canal principal falhou e nenhum canal de fallback disponível: ${error.message}`);
        }
      }
      
      // 8. Atualizar contexto da conversa
      this.multiChannelManager.updateLastMessage(phone);
      
      // 9. Atualizar métricas do canal
      this.multiChannelManager.updateChannelMetrics(channel.id, success);
      
      // 10. Atualizar estatísticas gerais
      this.stats.totalSent++;
      this.stats.lastSent = new Date().toISOString();
      
      // 11. Registrar mensagem no histórico
      await this.messageHistoryManager.recordMessageSent({
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        actionCardId: cardId,
        messageType: messageType,
        channelId: channel.id,
        channelName: channel.name,
        channelNumber: channel.number,
        sentAt: new Date(),
        success: true
      });

      // 12. Log automático para ações do usuário
      await this.userActionLogger.logAutomaticMessage(
        patient.name,
        cardId,
        messageType,
        true,
        {
          patientPhone: patient.phone,
          contactId: patient.contactId,
          channel: channel.name,
          channelNumber: channel.number,
          fallbackUsed: fallbackUsed
        }
      );

      console.log(`✅ Action card enviado com sucesso via ${channel.name} (${channel.number})${fallbackUsed ? ' (fallback)' : ''}`);
      
      return {
        success: true,
        patient: patient.name,
        phone: patient.phone,
        actionCardId: cardId,
        channel: {
          id: channel.id,
          name: channel.name,
          number: channel.number
        },
        result: result,
        fallbackUsed: fallbackUsed,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      // Atualizar métricas de erro do canal
      if (channel) {
        this.multiChannelManager.updateChannelMetrics(channel.id, false);
      }
      
      // Atualizar estatísticas de erro
      this.stats.totalFailed++;
      this.stats.errors.push({
        patient: patient.name,
        phone: patient.phone,
        error: error.message,
        channel: channel ? channel.name : 'unknown',
        timestamp: new Date().toISOString()
      });
      
      console.error(`❌ Erro ao enviar action card para ${patient.name}:`, error.message);
      
      // Log automático de falha
      await this.userActionLogger.logAutomaticMessage(
        patient.name,
        actionCardId || 'N/A',
        messageType,
        false,
        {
          patientPhone: patient.phone,
          contactId: patient.contactId,
          channel: channel ? channel.name : 'unknown',
          error: error.message
        }
      );
      
      return {
        success: false,
        patient: patient.name,
        phone: patient.phone,
        error: error.message,
        channel: channel ? {
          id: channel.id,
          name: channel.name,
          number: channel.number
        } : null,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Envia action card para um paciente (versão interna sem registro no histórico)
   */
  async sendActionCardInternal(patient, cardId = null, messageType = 'manual') {
    try {
      const phone = patient.phone;
      console.log(`📤 Enviando action card para ${patient.name} (${phone})`);
      
      // 1. Verificar se já existe contexto de conversa
      let channel = this.multiChannelManager.getChannelForConversation(phone);
      
      if (!channel) {
        // 2. Nova conversa - escolher canal apropriado
        channel = this.multiChannelManager.getBestChannelForPatient(patient);
        
        if (!channel) {
          throw new Error('Nenhum canal ativo disponível');
        }
        
        // 3. Registrar novo contexto de conversa
        this.multiChannelManager.registerConversation(phone, channel.id);
        
        console.log(`🆕 Nova conversa: ${phone} -> ${channel.name} (${channel.number})`);
      } else {
        console.log(`🔄 Continuando conversa: ${phone} -> ${channel.name} (${channel.number})`);
      }

      // 4. Usar action card ID fornecido ou o padrão da configuração
      const actionCardId = cardId || this.configManager.getDefaultActionCardId();
      
      if (!actionCardId) {
        throw new Error('ID do action card não fornecido');
      }

      // 5. Validar dados do paciente
      if (!patient.phone || !patient.contactId) {
        throw new Error('Dados do paciente incompletos (phone ou contactId faltando)');
      }

      // 6. Preparar payload
      const payload = {
        number: patient.phone,
        contactId: patient.contactId,
        action_card_id: actionCardId,
        forceSend: true
      };

      console.log(`📤 Enviando action card via ${channel.name} (${channel.number})`);
      console.log(`📋 Payload:`, payload);

      // 7. Enviar mensagem usando o canal específico com fallback
      let result;
      let success = false;
      let fallbackUsed = false;

      try {
        result = await channel.apiClient.sendActionCard(payload);
        success = true;
        console.log(`✅ Action card enviado com sucesso via ${channel.name} (${channel.number})`);
      } catch (channelError) {
        console.warn(`⚠️ Falha no canal principal ${channel.name}, tentando fallback...`);
        
        // Tentar canal de fallback
        const fallbackChannel = this.multiChannelManager.getFallbackChannel();
        if (fallbackChannel && fallbackChannel.id !== channel.id) {
          try {
            result = await fallbackChannel.apiClient.sendActionCard(payload);
            success = true;
            fallbackUsed = true;
            console.log(`✅ Action card enviado via fallback ${fallbackChannel.name} (${fallbackChannel.number})`);
          } catch (fallbackError) {
            throw new Error(`Falha em ambos os canais: ${channelError.message} | ${fallbackError.message}`);
          }
        } else {
          throw channelError;
        }
      }

      // Atualizar estatísticas
      this.stats.totalSent++;
      this.stats.lastSent = new Date().toISOString();
      
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
      
      // Marcar pacientes como processados
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
      
      // Marcar pacientes como processados
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

  /**
   * Tenta encontrar um canal de fallback saudável
   * @param {string} phone - Número do telefone
   * @param {Object} patient - Dados do paciente
   * @param {string} excludedChannelId - ID do canal que falhou
   * @returns {Object|null} Canal de fallback ou null
   */
  async tryFallbackChannel(phone, patient, excludedChannelId) {
    try {
      console.log(`🔄 Tentando encontrar canal de fallback para ${phone}...`);
      
      // Verificar se há canais saudáveis disponíveis
      if (!this.multiChannelManager.hasHealthyChannelsAvailable()) {
        console.warn('⚠️ Nenhum canal saudável disponível para fallback');
        return null;
      }

      // Obter canais ativos e saudáveis (excluindo o que falhou)
      const activeChannels = this.multiChannelManager.getActiveChannels();
      const healthyChannels = activeChannels.filter(channel => {
        if (channel.id === excludedChannelId) return false;
        
        const health = this.multiChannelManager.getChannelHealth(channel.id);
        return health.status === 'healthy' || health.status === 'degraded';
      });

      if (healthyChannels.length === 0) {
        console.warn('⚠️ Nenhum canal saudável encontrado para fallback');
        return null;
      }

      // Aplicar algoritmo de balanceamento para escolher o melhor canal de fallback
      const fallbackChannel = this.multiChannelManager.selectChannelByLoad(healthyChannels);
      
      if (fallbackChannel) {
        console.log(`🎯 Canal de fallback selecionado: ${fallbackChannel.name} (${fallbackChannel.number})`);
        
        // Testar conectividade do canal de fallback
        try {
          await fallbackChannel.apiClient.testConnection();
          console.log(`✅ Canal de fallback ${fallbackChannel.name} testado com sucesso`);
          return fallbackChannel;
        } catch (testError) {
          console.warn(`⚠️ Canal de fallback ${fallbackChannel.name} falhou no teste de conectividade: ${testError.message}`);
          
          // Se o teste falhar, tentar o próximo canal saudável
          const remainingChannels = healthyChannels.filter(c => c.id !== fallbackChannel.id);
          if (remainingChannels.length > 0) {
            return this.tryFallbackChannel(phone, patient, excludedChannelId);
          }
        }
      }

      return null;
    } catch (error) {
      this.errorHandler.logError(error, 'MessageService.tryFallbackChannel');
      return null;
    }
  }

  /**
   * Atualiza configurações do serviço de mensagens
   */
  updateConfig(newConfig) {
    try {
      console.log('⚙️ MessageService: Configurações atualizadas');
      
      // As configurações são obtidas dinamicamente do ConfigManager
      // Não precisamos armazenar localmente, apenas logar a atualização
      console.log('🔄 MessageService: Usando configurações atualizadas do sistema');
      
      // Se necessário, podemos reconfigurar action cards ou outros aspectos específicos aqui
      
    } catch (error) {
      console.error('❌ Erro ao atualizar configurações do MessageService:', error);
      this.errorHandler.logError(error, 'MessageService.updateConfig');
    }
  }
}

module.exports = { MessageService };
