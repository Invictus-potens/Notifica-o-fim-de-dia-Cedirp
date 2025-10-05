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
        this.krolikApiClient = new KrolikApiClient(
          krolikCredentials.baseURL,
          krolikCredentials.token
        );
        
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
   * Executa verificação de pacientes elegíveis
   */
  async checkEligiblePatients() {
    try {
      if (!this.isInitialized || !this.krolikApiClient) {
        throw new Error('MonitoringService não inicializado ou API não disponível');
      }

      console.log('🔍 Verificando pacientes elegíveis...\n');
      
      let apiPatients = [];
      let updateStats = { new: 0, updated: 0, removed: 0 };
      
      try {
        // 1. Buscar pacientes atuais da API
        apiPatients = await this.krolikApiClient.listWaitingAttendances();
        console.log(`📊 ${apiPatients.length} pacientes encontrados na API`);
        
        // 2. Atualizar lista de pacientes ativos
        updateStats = await this.jsonPatientManager.updateActivePatients(apiPatients);
        console.log(`📈 Pacientes atualizados: +${updateStats.new} ~${updateStats.updated} -${updateStats.removed}`);
        
      } catch (apiError) {
        console.error('⚠️ Erro ao buscar pacientes da API, usando dados locais como fallback:', apiError.message);
        
        // Fallback: usar dados locais se API falhar
        try {
          const localPatients = await this.jsonPatientManager.loadPatientsFromFile(
            this.jsonPatientManager.files.active
          );
          apiPatients = localPatients || [];
          console.log(`📋 Usando ${apiPatients.length} pacientes do arquivo local`);
          
          // Marcar estatísticas como fallback
          updateStats = { new: 0, updated: 0, removed: 0, fallback: true };
          
        } catch (fallbackError) {
          console.error('❌ Erro também no fallback local:', fallbackError.message);
          apiPatients = [];
        }
      }
      
      // 3. Buscar pacientes elegíveis para mensagem de 30min
      const eligible30Min = await this.getEligiblePatientsFor30MinMessage();
      console.log(`⏰ ${eligible30Min.length} pacientes elegíveis para mensagem de 30min`);
      
      // 4. Buscar pacientes elegíveis para mensagem de fim de dia
      const eligibleEndOfDay = await this.getEligiblePatientsForEndOfDayMessage();
      console.log(`🌅 ${eligibleEndOfDay.length} pacientes elegíveis para mensagem de fim de dia`);
      
      // 5. Atualizar estatísticas
      this.updateStats();
      
      return {
        eligible30Min,
        eligibleEndOfDay,
        totalActive: apiPatients.length,
        updateStats
      };
      
    } catch (error) {
      this.stats.errors++;
      console.error('❌ Erro crítico no MonitoringService:', error.message);
      this.errorHandler.logError(error, 'MonitoringService.checkEligiblePatients');
      
      // Retornar resultado vazio em caso de erro crítico
      return {
        eligible30Min: [],
        eligibleEndOfDay: [],
        totalActive: 0,
        updateStats: { new: 0, updated: 0, removed: 0, error: true }
      };
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
   * Verifica se paciente é elegível para mensagem de 30min
   * 🎀 ATUALIZADO: Usa sistema de TAGS ao invés de isPatientProcessed
   */
  async isPatientEligibleFor30MinMessage(patient) {
    try {
      // 1. Verificar tempo de espera (usando configuração personalizada)
      const minWaitTime = this.configManager.getMinWaitTime();
      const maxWaitTime = this.configManager.getMaxWaitTime();
      if (!patient.waitTimeMinutes || patient.waitTimeMinutes < minWaitTime || patient.waitTimeMinutes > maxWaitTime) {
        return false;
      }
      
      // 2. 🎀 NOVO: Verificar se já recebeu mensagem de 30min (usando TAGS)
      if (await this.jsonPatientManager.hasMessageTag(patient.id, '30min')) {
        return false;
      }
      
      // 3. Verificar se está na lista de exclusões
      const patientKey = this.jsonPatientManager.getPatientKey(patient);
      if (await this.configManager.isAttendanceExcluded(patientKey, '30min')) {
        return false;
      }
      
      // 4. Verificar se o setor do paciente está excluído
      const excludedSectors = this.configManager.getExcludedSectors();
      if (excludedSectors.includes(patient.sectorId)) {
        console.log(`🚫 Paciente ${patient.name} (${patient.phone}) do setor ${patient.sectorId} está em setor excluído`);
        return false;
      }
      
      // 5. 🎀 IMPORTANTE: Verificar horário comercial (mensagem de 30min SÓ durante expediente)
      if (!this.configManager.shouldIgnoreBusinessHours() && !TimeUtils.isBusinessHours()) {
        console.log(`🕐 Paciente ${patient.name} não receberá mensagem de 30min - fora do horário comercial`);
        return false;
      }
      
      // 5.1. 🚫 NOVA RESTRIÇÃO: Verificar se está no período de bloqueio (17h-18h)
      if (!this.configManager.shouldIgnoreBusinessHours() && TimeUtils.isWaitingMessageBlocked()) {
        console.log(`🚫 Paciente ${patient.name} não receberá mensagem de 30min - período de bloqueio ativo (17h-18h)`);
        return false;
      }
      
      // 6. Verificar dia útil (apenas se não estiver configurado para ignorar horário comercial)
      if (!this.configManager.shouldIgnoreBusinessHours() && !TimeUtils.isWorkingDay()) {
        return false;
      }
      
      // 7. Verificar se fluxo não está pausado
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
   * 🎀 ATUALIZADO: Usa sistema de TAGS - TODOS os pacientes aguardando devem receber, 
   * EXCETO os de setores excluídos ou que JÁ RECEBERAM mensagem de fim de dia
   */
  async isPatientEligibleForEndOfDayMessage(patient) {
    try {
      // 1. 🚫 NOVA VERIFICAÇÃO: Verificar se mensagem de fim de expediente está permitida
      if (!TimeUtils.canSendEndOfDayMessage()) {
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
      
      // 5. Verificar se o setor do paciente está excluído
      const excludedSectors = this.configManager.getExcludedSectors();
      if (excludedSectors.includes(patient.sectorId)) {
        console.log(`🚫 Paciente ${patient.name} (${patient.phone}) do setor ${patient.sectorId} está em setor excluído - não receberá mensagem de fim de dia`);
        return false;
      }
      
      // 6. 🎀 NOVO: Verificar se já recebeu mensagem de fim de dia (usando TAGS)
      // NÃO IMPORTA se recebeu mensagem de 30min, pode receber fim de dia!
      if (await this.jsonPatientManager.hasMessageTag(patient.id, 'end_of_day')) {
        console.log(`🚫 Paciente ${patient.name} já recebeu mensagem de fim de dia`);
        return false;
      }
      
      // 7. Verificar se está na lista de exclusões
      const patientKey = this.jsonPatientManager.getPatientKey(patient);
      if (await this.configManager.isAttendanceExcluded(patientKey, 'end_of_day')) {
        return false;
      }
      
      // 8. TODOS os demais pacientes aguardando são elegíveis para fim de dia
      // (mesmo se já tiverem recebido mensagem de 30min)
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
}

module.exports = { MonitoringService };
