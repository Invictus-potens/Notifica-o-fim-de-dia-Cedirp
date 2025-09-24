const { ConfigManager } = require('./src/services/ConfigManager');
const { MonitoringService } = require('./src/services/MonitoringService');
const { ErrorHandler } = require('./src/services/ErrorHandler');

async function testDebugEligibility() {
  try {
    console.log('🔍 ===============================================');
    console.log('   DEBUG DE ELEGIBILIDADE');
    console.log('===============================================\n');
    
    // 1. Inicializar serviços
    const configManager = new ConfigManager();
    await configManager.initialize();
    
    const errorHandler = new ErrorHandler();
    const monitoringService = new MonitoringService(errorHandler, configManager);
    await monitoringService.initialize();
    
    // 2. Verificar pacientes ativos
    const activePatients = await monitoringService.jsonPatientManager.loadPatientsFromFile(
      monitoringService.jsonPatientManager.files.active
    );
    
    console.log(`👥 PACIENTES ATIVOS: ${activePatients.length}`);
    
    for (const patient of activePatients) {
      console.log(`\n📋 Paciente: ${patient.name} (${patient.id})`);
      console.log(`   📞 Telefone: ${patient.phone}`);
      console.log(`   ⏰ Tempo de espera: ${patient.waitTimeMinutes} minutos`);
      console.log(`   📅 Canal: ${patient.channelId}`);
      
      // Verificar se foi processado
      const isProcessed = await monitoringService.jsonPatientManager.isPatientProcessed(patient.id);
      console.log(`   ✅ Processado: ${isProcessed}`);
      
      // Verificar critérios específicos
      const minWait = configManager.getMinWaitTime();
      const maxWait = configManager.getMaxWaitTime();
      const waitTime = patient.waitTimeMinutes;
      
      console.log(`   ⏰ Range: ${minWait}-${maxWait} min, Atual: ${waitTime} min`);
      
      if (waitTime < minWait) {
        console.log(`   ❌ Tempo insuficiente: ${waitTime} < ${minWait} min`);
      } else if (waitTime > maxWait) {
        console.log(`   ❌ Tempo excessivo: ${waitTime} > ${maxWait} min`);
      } else {
        console.log(`   ✅ Tempo OK: ${waitTime} min`);
      }
      
      // Verificar horário comercial
      const ignoreBusinessHours = configManager.shouldIgnoreBusinessHours();
      console.log(`   🕐 Ignore Business Hours: ${ignoreBusinessHours}`);
      
      // Verificar se fluxo está pausado
      const flowPaused = configManager.isFlowPaused();
      console.log(`   ⏸️ Flow Paused: ${flowPaused}`);
      
      // Verificar elegibilidade completa
      const isEligible = await monitoringService.isPatientEligibleFor30MinMessage(patient);
      console.log(`   🎯 Elegível 30min: ${isEligible}`);
      
      if (isEligible) {
        console.log(`   ✅ PACIENTE ELEGÍVEL PARA MENSAGEM!`);
      } else {
        console.log(`   ❌ Paciente não elegível`);
      }
    }
    
    console.log('\n✅ DEBUG CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
    console.error(error.stack);
  }
}

testDebugEligibility();
