const { JsonPatientManager } = require('./JsonPatientManager');
const { KrolikApiClient } = require('./KrolikApiClient');
const { ConfigManager } = require('./ConfigManager');
const { TimeUtils } = require('../utils/TimeUtils');

/**
 * Serviço de monitoramento de pacientes
 * Responsável por verificar pacientes elegíveis e coordenar o envio de mensagens
 */
class MonitoringService {
  constructor(errorHandler, configManager) {
    this.errorHandler = errorHandler;
    this.configManager = configManager;
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

      console.log('🔍 Verificando pacientes elegíveis...');
      
      // 1. Buscar pacientes atuais da API
      const apiPatients = await this.krolikApiClient.listWaitingAttendances();
      console.log(`📊 ${apiPatients.length} pacientes encontrados na API`);
      
      // 2. Atualizar lista de pacientes ativos
      const updateStats = await this.jsonPatientManager.updateActivePatients(apiPatients);
      console.log(`📈 Pacientes atualizados: +${updateStats.new} ~${updateStats.updated} -${updateStats.removed}`);
      
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
      this.errorHandler.logError(error, 'MonitoringService.checkEligiblePatients');
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
   */
  async isPatientEligibleFor30MinMessage(patient) {
    try {
      // 1. Verificar tempo de espera (30-40 minutos para evitar spam)
      if (!patient.waitTimeMinutes || patient.waitTimeMinutes < 30 || patient.waitTimeMinutes > 40) {
        return false;
      }
      
      // 2. Verificar se já foi processado
      if (await this.jsonPatientManager.isPatientProcessed(patient.id)) {
        return false;
      }
      
      // 3. Verificar se está na lista de exclusões
      const patientKey = this.jsonPatientManager.getPatientKey(patient);
      if (this.configManager.isAttendanceExcluded(patientKey)) {
        return false;
      }
      
      // 4. Verificar horário comercial
      if (!TimeUtils.isBusinessHours()) {
        return false;
      }
      
      // 5. Verificar dia útil
      if (!TimeUtils.isWorkingDay()) {
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
      // 1. Verificar se é fim de dia (18h)
      if (!TimeUtils.isEndOfDayTime()) {
        return false;
      }
      
      // 2. Verificar dia útil
      if (!TimeUtils.isWorkingDay()) {
        return false;
      }
      
      // 3. Verificar se fluxo não está pausado
      if (this.configManager.isFlowPaused()) {
        return false;
      }
      
      // 4. TODOS os pacientes aguardando são elegíveis para fim de dia
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
          // Preparar payload para envio
          const payload = {
            number: patient.phone,
            contactId: patient.contactId,
            action_card_id: this.configManager.get30MinActionCardId(), // ID do action card para 30min
            forceSend: true
          };
          
          // Enviar mensagem
          await this.krolikApiClient.sendActionCard(payload);
          
          // Marcar como processado
          await this.jsonPatientManager.markPatientAsProcessed(patient.id);
          
          // Adicionar à lista de exclusões
          const patientKey = this.jsonPatientManager.getPatientKey(patient);
          this.configManager.addToExclusionList(patientKey);
          
          results.sent++;
          console.log(`✅ Mensagem enviada para ${patient.name} (${patient.phone})`);
          
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
      this.configManager.clearExclusionList();
      
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
