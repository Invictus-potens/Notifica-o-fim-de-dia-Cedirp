const { JsonPatientManager } = require('./JsonPatientManager');
const { KrolikApiClient } = require('./KrolikApiClient');
const { ConfigManager } = require('./ConfigManager');
const { TimeUtils } = require('../utils/TimeUtils');

/**
 * Serviço de monitoramento de pacientes
 * Responsável por verificar pacientes elegíveis e coordenar o envio de mensagens
 */
class MonitoringService {
  constructor(errorHandler, configManager, messageService = null) {
    this.errorHandler = errorHandler;
    this.configManager = configManager;
    this.messageService = messageService; // Receber MessageService para evitar duplicação
    this.jsonPatientManager = new JsonPatientManager(errorHandler);
    this.krolikApiClient = null; // Será inicializado com credenciais
    
    this.isInitialized = false;
    this.lastCheckTime = null;
    this.stats = {
      totalChecks: 0,
      patientsProcessed: 0,
      messagesSent: 0,
      errors: 0,
      lastCheck: null
    };
  }

  /**
   * Inicializa o serviço de monitoramento
   */
  async initialize(krolikCredentials) {
    try {
      console.log('🔧 Inicializando MonitoringService...');
      
      // Inicializar JsonPatientManager
      await this.jsonPatientManager.initialize();
      
      // Inicializar KrolikApiClient
      if (krolikCredentials) {
        this.krolikApiClient = new KrolikApiClient({
          baseURL: krolikCredentials.baseURL,
          token: krolikCredentials.token
        });
        
        // Testar conexão
        await this.krolikApiClient.testConnection();
        console.log('✅ Conexão com API CAM Krolik estabelecida');
      }
      
      this.isInitialized = true;
      console.log('✅ MonitoringService inicializado');
      
    } catch (error) {
      this.errorHandler.logError(error, 'MonitoringService.initialize');
      throw error;
    }
  }

  /**
   * Executa verificação de pacientes elegíveis por canal
   */
  async checkEligiblePatients() {
    try {
      if (!this.isInitialized) {
        throw new Error('MonitoringService não inicializado');
      }

      console.log('🔍 Verificando pacientes elegíveis por canal...');
      
      // 1. Obter todos os canais configurados
      const channels = this.configManager.getChannels();
      console.log(`📱 Verificando ${channels.length} canais configurados`);
      
      const allResults = {
        eligible30Min: [],
        eligibleEndOfDay: [],
        totalActive: 0,
        updateStats: { new: 0, updated: 0, removed: 0 },
        channelResults: []
      };
      
      // 2. Processar cada canal separadamente
      for (const channel of channels) {
        if (!channel.active) {
          console.log(`⏸️ Canal ${channel.name} está inativo - pulando`);
          continue;
        }
        
        try {
          console.log(`📞 Processando canal: ${channel.name} (${channel.number})`);
          
          // Verificar se token existe
          if (!channel.token) {
            console.error(`❌ Token não encontrado para canal ${channel.name}`);
            continue;
          }
          
          // Criar cliente API específico para este canal
          const { KrolikApiClient } = require('./KrolikApiClient');
          const channelApiClient = new KrolikApiClient(
            process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com.br',
            channel.token
          );
          
          // Buscar pacientes aguardando neste canal específico
          const channelPatients = await channelApiClient.listWaitingAttendances();
          console.log(`👥 Canal ${channel.name}: ${channelPatients.length} pacientes aguardando`);
          
          if (channelPatients.length === 0) {
            console.log(`📭 Canal ${channel.name}: Nenhum paciente aguardando`);
            continue;
          }
          
          // Adicionar informações do canal aos pacientes
          const patientsWithChannel = channelPatients.map(patient => ({
            ...patient,
            channelId: channel.id,
            channelName: channel.name,
            channelNumber: channel.number,
            channelToken: channel.token
          }));
          
          // Atualizar lista de pacientes ativos para este canal
          const updateStats = await this.jsonPatientManager.updateActivePatients(patientsWithChannel);
          console.log(`📈 Canal ${channel.name}: +${updateStats.new} ~${updateStats.updated} -${updateStats.removed}`);
          
          // Buscar pacientes elegíveis para mensagem de 30min neste canal
          const eligible30Min = await this.getEligiblePatientsFor30MinMessageByChannel(channel.id);
          console.log(`⏰ Canal ${channel.name}: ${eligible30Min.length} pacientes elegíveis para mensagem de 30min`);
          
          // Buscar pacientes elegíveis para mensagem de fim de dia neste canal
          const eligibleEndOfDay = await this.getEligiblePatientsForEndOfDayMessageByChannel(channel.id);
          console.log(`🌅 Canal ${channel.name}: ${eligibleEndOfDay.length} pacientes elegíveis para mensagem de fim de dia`);
          
          // Adicionar aos resultados gerais
          allResults.eligible30Min.push(...eligible30Min);
          allResults.eligibleEndOfDay.push(...eligibleEndOfDay);
          allResults.totalActive += channelPatients.length;
          allResults.updateStats.new += updateStats.new;
          allResults.updateStats.updated += updateStats.updated;
          allResults.updateStats.removed += updateStats.removed;
          
          // Armazenar resultados por canal
          allResults.channelResults.push({
            channelId: channel.id,
            channelName: channel.name,
            channelNumber: channel.number,
            totalPatients: channelPatients.length,
            eligible30Min: eligible30Min.length,
            eligibleEndOfDay: eligibleEndOfDay.length,
            updateStats
          });
          
        } catch (channelError) {
          console.error(`❌ Erro ao processar canal ${channel.name}:`, channelError.message);
          this.errorHandler.logError(channelError, `MonitoringService.checkEligiblePatients.channel.${channel.id}`);
        }
      }
      
      // 3. Atualizar estatísticas
      this.updateStats();
      
      console.log(`📊 RESUMO: ${allResults.channelResults.length} canais | ${allResults.totalActive} pacientes | 30min: ${allResults.eligible30Min.length} | Fim dia: ${allResults.eligibleEndOfDay.length}`);
      
      return allResults;
      
    } catch (error) {
      this.stats.errors++;
      this.errorHandler.error('Erro ao verificar pacientes elegíveis', 'MonitoringService.checkEligiblePatients', error);
      throw error;
    }
  }

  /**
   * Obtém pacientes elegíveis para mensagem de 30 minutos
   */
  async getEligiblePatientsFor30MinMessage() {
    try {
      const activePatients = await this.jsonPatientManager.loadPatientsFromFile(
        this.jsonPatientManager.files.active
      );
      
      const eligiblePatients = [];
      
      for (const patient of activePatients) {
        // Verificar critérios de elegibilidade
        if (await this.isPatientEligibleFor30MinMessage(patient)) {
          eligiblePatients.push(patient);
        }
      }
      
      return eligiblePatients;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MonitoringService.getEligiblePatientsFor30MinMessage');
      return [];
    }
  }

  /**
   * Obtém pacientes elegíveis para mensagem de 30 minutos por canal específico
   */
  async getEligiblePatientsFor30MinMessageByChannel(channelId) {
    try {
      const activePatients = await this.jsonPatientManager.loadPatientsFromFile(
        this.jsonPatientManager.files.active
      );
      
      // Filtrar pacientes apenas do canal específico
      const channelPatients = activePatients.filter(patient => patient.channelId === channelId);
      
      const eligiblePatients = [];
      
      for (const patient of channelPatients) {
        // Verificar critérios de elegibilidade
        if (await this.isPatientEligibleFor30MinMessage(patient)) {
          eligiblePatients.push(patient);
        }
      }
      
      return eligiblePatients;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MonitoringService.getEligiblePatientsFor30MinMessageByChannel');
      return [];
    }
  }

  /**
   * Obtém pacientes elegíveis para mensagem de fim de dia
   */
  async getEligiblePatientsForEndOfDayMessage() {
    try {
      const activePatients = await this.jsonPatientManager.loadPatientsFromFile(
        this.jsonPatientManager.files.active
      );
      
      const eligiblePatients = [];
      
      for (const patient of activePatients) {
        // Verificar critérios de elegibilidade para fim de dia
        if (await this.isPatientEligibleForEndOfDayMessage(patient)) {
          eligiblePatients.push(patient);
        }
      }
      
      return eligiblePatients;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MonitoringService.getEligiblePatientsForEndOfDayMessage');
      return [];
    }
  }

  /**
   * Obtém pacientes elegíveis para mensagem de fim de dia por canal específico
   */
  async getEligiblePatientsForEndOfDayMessageByChannel(channelId) {
    try {
      const activePatients = await this.jsonPatientManager.loadPatientsFromFile(
        this.jsonPatientManager.files.active
      );
      
      // Filtrar pacientes apenas do canal específico
      const channelPatients = activePatients.filter(patient => patient.channelId === channelId);
      
      const eligiblePatients = [];
      
      for (const patient of channelPatients) {
        // Verificar critérios de elegibilidade para fim de dia
        if (await this.isPatientEligibleForEndOfDayMessage(patient)) {
          eligiblePatients.push(patient);
        }
      }
      
      return eligiblePatients;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MonitoringService.getEligiblePatientsForEndOfDayMessageByChannel');
      return [];
    }
  }

  /**
   * Verifica se paciente é elegível para mensagem de 30min
   */
  async isPatientEligibleFor30MinMessage(patient) {
    try {
      // 1. Verificar tempo de espera (usando configuração personalizada)
      const minWaitTime = this.configManager.getMinWaitTime();
      const maxWaitTime = this.configManager.getMaxWaitTime();
      if (!patient.waitTimeMinutes || patient.waitTimeMinutes < minWaitTime || patient.waitTimeMinutes > maxWaitTime) {
        return false;
      }
      
      // 2. Verificar se já foi processado
      if (await this.jsonPatientManager.isPatientProcessed(patient.id)) {
        return false;
      }
      
      // 3. Verificar se está na lista de exclusões
      const patientKey = this.jsonPatientManager.getPatientKey(patient);
      if (await this.configManager.isAttendanceExcluded(patientKey, '30min')) {
        return false;
      }
      
      // 4. Verificar horário comercial (se não estiver configurado para ignorar)
      if (!this.configManager.shouldIgnoreBusinessHours() && !TimeUtils.isBusinessHours()) {
        return false;
      }
      
      // 5. Verificar dia útil (apenas se não estiver configurado para ignorar horário comercial)
      if (!this.configManager.shouldIgnoreBusinessHours() && !TimeUtils.isWorkingDay()) {
        return false;
      }
      
      // 6. Verificar se fluxo não está pausado
      if (this.configManager.isFlowPaused()) {
        return false;
      }
      
      return true;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MonitoringService.isPatientEligibleFor30MinMessage');
      return false;
    }
  }

  /**
   * Verifica se paciente é elegível para mensagem de fim de dia
   * TODOS os pacientes aguardando devem receber mensagem de fim de dia
   */
  async isPatientEligibleForEndOfDayMessage(patient) {
    try {
      // 1. Verificar se é fim de dia (18h) com tolerância de 5 minutos
      if (!TimeUtils.isEndOfDayTimeWithTolerance(5)) {
        return false;
      }
      
      // 2. Verificar dia útil (apenas se não estiver configurado para ignorar horário comercial)
      if (!this.configManager.shouldIgnoreBusinessHours() && !TimeUtils.isWorkingDay()) {
        return false;
      }
      
      // 3. Verificar se mensagem de fim de dia (18h) está pausada
      if (this.configManager.isEndOfDayPaused()) {
        console.log('🚫 Mensagem de fim de dia (18h) está PAUSADA via configuração');
        return false;
      }
      
      // 4. Verificar se fluxo não está pausado
      if (this.configManager.isFlowPaused()) {
        return false;
      }
      
      // 5. TODOS os pacientes aguardando são elegíveis para fim de dia
      // (removido: verificação de processamento e exclusões)
      
      return true;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MonitoringService.isPatientEligibleForEndOfDayMessage');
      return false;
    }
  }

  /**
   * Envia mensagens para pacientes elegíveis
   */
  async sendMessagesToEligiblePatients(eligiblePatients, messageType = '30min') {
    try {
      // VALIDAÇÃO RIGOROSA: Apenas 30min e end_of_day são permitidos
      if (messageType !== '30min' && messageType !== 'end_of_day') {
        throw new Error(`Tipo de mensagem não permitido: ${messageType}. Apenas '30min' e 'end_of_day' são permitidos.`);
      }
      
      if (!this.krolikApiClient) {
        throw new Error('KrolikApiClient não inicializado');
      }
      
      const results = {
        sent: 0,
        failed: 0,
        errors: []
      };
      
      console.log(`📤 Enviando ${messageType} messages para ${eligiblePatients.length} pacientes...`);
      
      for (const patient of eligiblePatients) {
        try {
          // Verificar se MessageService está disponível
          if (!this.messageService) {
            throw new Error('MessageService não está disponível');
          }
          
          // Enviar mensagem através do MessageService (evita duplicação)
          const actionCardId = this.configManager.get30MinActionCardId();
          const result = await this.messageService.sendActionCard(patient, actionCardId, true, messageType);
          
          if (result.success) {
            // Marcar como processado
            await this.jsonPatientManager.markPatientAsProcessed(patient.id);
            
            // Adicionar à lista de exclusões
            const patientKey = this.jsonPatientManager.getPatientKey(patient);
            this.configManager.addToExclusionList(patientKey);
            
            results.sent++;
            console.log(`✅ Mensagem enviada para ${patient.name} (${patient.phone})`);
          } else {
            throw new Error(result.error || 'Falha no envio');
          }
          
          // Pequena pausa entre envios para evitar spam
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          results.failed++;
          results.errors.push({
            patient: patient.name,
            phone: patient.phone,
            error: error.message
          });
          
          console.error(`❌ Erro ao enviar mensagem para ${patient.name}:`, error.message);
        }
      }
      
      // Atualizar estatísticas
      this.stats.messagesSent += results.sent;
      this.stats.patientsProcessed += results.sent;
      
      console.log(`📊 Resultado do envio: ${results.sent} enviadas, ${results.failed} falharam`);
      
      return results;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MonitoringService.sendMessagesToEligiblePatients');
      throw error;
    }
  }

  /**
   * Executa limpeza diária (após mensagens de 18h)
   */
  async executeDailyCleanup() {
    try {
      console.log('🧹 Executando limpeza diária...');
      
      // Limpar todos os arquivos JSON
      await this.jsonPatientManager.clearAllFiles();
      
      // Limpar lista de exclusões
      await this.configManager.cleanupDailyData();
      
      // Resetar estatísticas
      this.stats = {
        totalChecks: 0,
        patientsProcessed: 0,
        messagesSent: 0,
        errors: 0,
        lastCheck: null
      };
      
      console.log('✅ Limpeza diária concluída');
      
    } catch (error) {
      this.errorHandler.logError(error, 'MonitoringService.executeDailyCleanup');
      throw error;
    }
  }

  /**
   * Atualiza estatísticas do serviço
   */
  updateStats() {
    this.stats.totalChecks++;
    this.stats.lastCheck = new Date().toISOString();
    this.lastCheckTime = new Date();
  }

  /**
   * Obtém estatísticas do monitoramento
   */
  getStats() {
    return {
      ...this.stats,
      isInitialized: this.isInitialized,
      lastCheckTime: this.lastCheckTime,
      jsonStats: this.jsonPatientManager.getStats()
    };
  }

  /**
   * Obtém status do serviço
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasApiClient: !!this.krolikApiClient,
      lastCheck: this.stats.lastCheck,
      totalChecks: this.stats.totalChecks,
      messagesSent: this.stats.messagesSent,
      errors: this.stats.errors
    };
  }

  /**
   * Atualiza configurações do serviço de monitoramento
   */
  updateConfig(newConfig) {
    try {
      console.log('⚙️ MonitoringService: Configurações atualizadas');
      
      // As configurações são obtidas dinamicamente do ConfigManager
      // Não precisamos armazenar localmente, apenas logar a atualização
      console.log('🔄 MonitoringService: Usando configurações atualizadas do sistema');
      
      // Se necessário, podemos reconfigurar timers ou outros aspectos específicos aqui
      
    } catch (error) {
      console.error('❌ Erro ao atualizar configurações do MonitoringService:', error);
      this.errorHandler.logError(error, 'MonitoringService.updateConfig');
    }
  }
}

module.exports = { MonitoringService };
