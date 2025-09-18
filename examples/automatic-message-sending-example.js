/**
 * EXEMPLO PRÁTICO: Envio Automático de Action Cards
 * 
 * Este arquivo serve como referência para implementar o envio automático
 * de mensagens no sistema de monitoramento a cada 60 segundos.
 * 
 * Use este código como base para implementar no MonitoringService.ts
 */

const { KrolikApiClient } = require('../src/services/KrolikApiClient');

class AutomaticMessageSender {
  constructor(krolikClient, configManager, jsonPatientManager, metricsService) {
    this.krolikClient = krolikClient;
    this.configManager = configManager;
    this.jsonPatientManager = jsonPatientManager;
    this.metricsService = metricsService;
  }

  /**
   * Verifica pacientes elegíveis para mensagem de 30 minutos
   * @param {Array} patients - Lista de pacientes da API
   * @returns {Array} Pacientes elegíveis
   */
  getEligiblePatientsFor30MinMessage(patients) {
    return patients.filter(patient => {
      // Critério: 30 minutos ou mais de espera
      const waitTimeOk = patient.waitTimeMinutes >= 30;
      
      // Critério: Dentro do horário comercial (implementar conforme necessário)
      const businessHoursOk = this.isWithinBusinessHours();
      
      // Critério: Dia útil (implementar conforme necessário)
      const workingDayOk = this.isWorkingDay();
      
      // Critério: Setor não excluído
      const patientKey = `${patient.name}_${patient.phone}_${patient.sectorId}`;
      const sectorNotExcluded = !this.configManager.isAttendanceExcluded(patientKey);
      
      // Critério: Paciente não processado anteriormente
      const notProcessed = !this.jsonPatientManager.isPatientProcessed(patient.id);
      
      console.log(`🔍 Verificando elegibilidade para ${patient.name}:`, {
        waitTime: `${patient.waitTimeMinutes}min (>= 30)`,
        businessHours: businessHoursOk,
        workingDay: workingDayOk,
        sectorNotExcluded,
        notProcessed,
        eligible: waitTimeOk && businessHoursOk && workingDayOk && sectorNotExcluded && notProcessed
      });
      
      return waitTimeOk && businessHoursOk && workingDayOk && 
             sectorNotExcluded && notProcessed;
    });
  }

  /**
   * Verifica pacientes elegíveis para mensagem de fim de dia (18h)
   * @param {Array} patients - Lista de pacientes da API
   * @returns {Array} Pacientes elegíveis
   */
  getEligiblePatientsForEndOfDayMessage(patients) {
    return patients.filter(patient => {
      // Critério: Qualquer paciente em espera
      const isWaiting = patient.status === 'waiting';
      
      // Critério: Setor não excluído
      const patientKey = `${patient.name}_${patient.phone}_${patient.sectorId}`;
      const sectorNotExcluded = !this.configManager.isAttendanceExcluded(patientKey);
      
      console.log(`🔍 Verificando elegibilidade fim de dia para ${patient.name}:`, {
        isWaiting,
        sectorNotExcluded,
        eligible: isWaiting && sectorNotExcluded
      });
      
      return isWaiting && sectorNotExcluded;
    });
  }

  /**
   * Processa pacientes elegíveis e envia action cards
   * @param {Array} eligiblePatients - Pacientes elegíveis
   * @param {string} actionCardId - ID do action card
   * @param {string} messageType - Tipo da mensagem ('30min' ou 'endday')
   * @returns {Object} Resultado do processamento
   */
  async processEligiblePatients(eligiblePatients, actionCardId, messageType = '30min') {
    if (!eligiblePatients || eligiblePatients.length === 0) {
      console.log(`🤖 [AUTOMÁTICO] Nenhum paciente elegível para mensagem de ${messageType}`);
      return { success: 0, failed: 0, results: [] };
    }

    console.log(`🤖 [AUTOMÁTICO] Processando ${eligiblePatients.length} pacientes para mensagem de ${messageType}`);
    
    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (const patient of eligiblePatients) {
      try {
        // Preparar payload seguindo a lógica corrigida
        const payload = {
          number: patient.phone,           // Número de telefone
          contactId: patient.contactId,    // ID do contato (NÃO attendanceId)
          action_card_id: actionCardId,    // ID do action card configurado
          forceSend: true
        };

        console.log(`🤖 [AUTOMÁTICO] Enviando action card para ${patient.name} (${patient.phone})`);

        // Enviar via API CAM Krolik
        const response = await this.krolikClient.sendActionCard(payload);
        
        // Marcar como processado (apenas para mensagem de 30 minutos)
        if (messageType === '30min') {
          await this.jsonPatientManager.markPatientAsProcessed(patient.id);
          
          // Adicionar à lista de exclusão para evitar reenvios
          const patientKey = `${patient.name}_${patient.phone}_${patient.sectorId}`;
          this.configManager.addAttendanceExclusion(patientKey);
        }

        results.push({
          patientId: patient.id,
          patientName: patient.name,
          phone: patient.phone,
          sectorName: patient.sectorName,
          waitTime: patient.waitTimeMinutes,
          success: true,
          message: `Enviado automaticamente (${messageType})`,
          response: response
        });
        
        successCount++;
        
        console.log(`✅ [AUTOMÁTICO] Sucesso para ${patient.name}`);
        
      } catch (error) {
        console.error(`❌ [AUTOMÁTICO] Falha ao enviar para ${patient.name}:`, error.message);
        
        if (error.response) {
          console.error('📋 Detalhes do erro:', {
            status: error.response.status,
            data: error.response.data
          });
        }
        
        results.push({
          patientId: patient.id,
          patientName: patient.name,
          phone: patient.phone,
          sectorName: patient.sectorName,
          waitTime: patient.waitTimeMinutes,
          success: false,
          error: error.message,
          errorDetails: error.response?.data
        });
        
        failedCount++;
      }
    }

    // Log do resultado
    console.log(`🤖 [AUTOMÁTICO] Resultado ${messageType}: ${successCount} sucessos, ${failedCount} falhas`);
    
    // Registrar métricas se disponível
    if (this.metricsService && this.metricsService.recordAutomaticMessageSent) {
      this.metricsService.recordAutomaticMessageSent(successCount, failedCount, messageType);
    }
    
    return {
      success: successCount,
      failed: failedCount,
      results: results,
      messageType: messageType
    };
  }

  /**
   * Executa o ciclo completo de verificação e envio de mensagens
   * @returns {Object} Resultado do ciclo
   */
  async executeMonitoringCycle() {
    try {
      console.log(`🔄 [AUTOMÁTICO] Iniciando ciclo de monitoramento...`);
      
      // 1. Buscar pacientes da API CAM Krolik
      const currentPatients = await this.krolikClient.listWaitingAttendances();
      console.log(`📊 [AUTOMÁTICO] Encontrados ${currentPatients.length} pacientes aguardando`);
      
      // 2. Verificar pacientes elegíveis para mensagem de 30 minutos
      const eligibleFor30Min = this.getEligiblePatientsFor30MinMessage(currentPatients);
      
      let result30Min = { success: 0, failed: 0, results: [] };
      if (eligibleFor30Min.length > 0) {
        const actionCardId30Min = this.configManager.getSelectedActionCard30Min();
        
        if (actionCardId30Min) {
          console.log(`🤖 [AUTOMÁTICO] Encontrados ${eligibleFor30Min.length} pacientes elegíveis para mensagem de 30 minutos`);
          result30Min = await this.processEligiblePatients(eligibleFor30Min, actionCardId30Min, '30min');
        } else {
          console.log(`⚠️ [AUTOMÁTICO] Nenhum action card de 30 minutos configurado`);
        }
      }
      
      // 3. Verificar se é hora da mensagem de fim de dia (18h)
      const isEndOfDayTime = this.isEndOfDayTime();
      let resultEndDay = { success: 0, failed: 0, results: [] };
      
      if (isEndOfDayTime) {
        const eligibleForEndDay = this.getEligiblePatientsForEndOfDayMessage(currentPatients);
        
        if (eligibleForEndDay.length > 0) {
          const actionCardIdEndDay = this.configManager.getSelectedActionCardEndDay();
          
          if (actionCardIdEndDay) {
            console.log(`🤖 [AUTOMÁTICO] Encontrados ${eligibleForEndDay.length} pacientes elegíveis para mensagem de fim de dia`);
            resultEndDay = await this.processEligiblePatients(eligibleForEndDay, actionCardIdEndDay, 'endday');
          } else {
            console.log(`⚠️ [AUTOMÁTICO] Nenhum action card de fim de dia configurado`);
          }
        }
      }
      
      // 4. Resumo do ciclo
      const totalSuccess = result30Min.success + resultEndDay.success;
      const totalFailed = result30Min.failed + resultEndDay.failed;
      
      console.log(`🎯 [AUTOMÁTICO] Ciclo concluído: ${totalSuccess} sucessos, ${totalFailed} falhas`);
      
      return {
        totalPatients: currentPatients.length,
        eligible30Min: eligibleFor30Min.length,
        eligibleEndDay: isEndOfDayTime ? this.getEligiblePatientsForEndOfDayMessage(currentPatients).length : 0,
        result30Min,
        resultEndDay,
        totalSuccess,
        totalFailed
      };
      
    } catch (error) {
      console.error('❌ [AUTOMÁTICO] Erro no ciclo de monitoramento:', error);
      throw error;
    }
  }

  // Métodos auxiliares (implementar conforme necessário)
  isWithinBusinessHours() {
    // Implementar lógica de horário comercial
    // Exemplo: 08:00 às 18:00, segunda a sexta
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = domingo, 1 = segunda, etc.
    
    return hour >= 8 && hour < 18 && day >= 1 && day <= 5;
  }

  isWorkingDay() {
    // Implementar lógica de dias úteis
    const now = new Date();
    const day = now.getDay();
    
    return day >= 1 && day <= 5; // Segunda a sexta
  }

  isEndOfDayTime() {
    // Implementar lógica para mensagem de fim de dia (18h)
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Considerar 18:00 como fim de dia
    return hour === 18 && minute === 0;
  }
}

// Exemplo de uso
async function exampleUsage() {
  console.log('🧪 EXEMPLO DE USO: Envio Automático de Action Cards\n');

  // Inicializar cliente
  const krolikClient = new KrolikApiClient({
    baseURL: 'https://api.camkrolik.com.br',
    token: process.env.KROLIK_API_TOKEN || '63e68f168a48875131856df8',
    timeout: 10000
  });

  // Mock dos outros serviços (substituir por instâncias reais)
  const configManager = {
    getSelectedActionCard30Min: () => '631f2b4f307d23f46ac80a2b',
    getSelectedActionCardEndDay: () => '631f2b4f307d23f46ac80a2b',
    isAttendanceExcluded: (key) => false,
    addAttendanceExclusion: (key) => console.log(`Exclusão adicionada: ${key}`)
  };

  const jsonPatientManager = {
    markPatientAsProcessed: async (id) => console.log(`Paciente processado: ${id}`),
    isPatientProcessed: (id) => false
  };

  const metricsService = {
    recordAutomaticMessageSent: (success, failed, type) => 
      console.log(`Métricas registradas: ${success} sucessos, ${failed} falhas (${type})`)
  };

  // Criar instância do sender
  const messageSender = new AutomaticMessageSender(
    krolikClient,
    configManager,
    jsonPatientManager,
    metricsService
  );

  try {
    // Executar ciclo de monitoramento
    const result = await messageSender.executeMonitoringCycle();
    
    console.log('\n📊 RESULTADO DO CICLO:');
    console.log(`   Total de pacientes: ${result.totalPatients}`);
    console.log(`   Elegíveis 30min: ${result.eligible30Min}`);
    console.log(`   Elegíveis fim de dia: ${result.eligibleEndDay}`);
    console.log(`   Total sucessos: ${result.totalSuccess}`);
    console.log(`   Total falhas: ${result.totalFailed}`);
    
  } catch (error) {
    console.error('❌ Erro no exemplo:', error.message);
  }
}

// Executar exemplo se chamado diretamente
if (require.main === module) {
  exampleUsage().catch(console.error);
}

module.exports = { AutomaticMessageSender, exampleUsage };
