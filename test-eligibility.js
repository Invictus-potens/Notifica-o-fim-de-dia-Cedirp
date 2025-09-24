const { ConfigManager } = require('./src/services/ConfigManager');
const { MonitoringService } = require('./src/services/MonitoringService');
const { ErrorHandler } = require('./src/services/ErrorHandler');

async function testEligibility() {
  try {
    console.log('🔍 ===============================================');
    console.log('   TESTE DE ELEGIBILIDADE COMPLETO');
    console.log('===============================================\n');
    
    // 1. Inicializar serviços
    const configManager = new ConfigManager();
    await configManager.initialize();
    
    const errorHandler = new ErrorHandler();
    const monitoringService = new MonitoringService(errorHandler, configManager);
    await monitoringService.initialize();
    
    // 2. Verificar configurações
    console.log('📋 CONFIGURAÇÕES:');
    console.log(`   Min Wait Time: ${configManager.getMinWaitTime()} minutos`);
    console.log(`   Max Wait Time: ${configManager.getMaxWaitTime()} minutos`);
    console.log(`   Flow Paused: ${configManager.isFlowPaused()}`);
    console.log(`   End of Day Paused: ${configManager.isEndOfDayPaused()}`);
    console.log(`   Ignore Business Hours: ${configManager.shouldIgnoreBusinessHours()}\n`);
    
    // 3. Verificar canais
    const channels = configManager.getChannels();
    console.log(`📱 CANAIS CONFIGURADOS: ${channels.length}`);
    
    for (const channel of channels) {
      console.log(`   📞 ${channel.name} (${channel.number}) - Token: ${channel.token ? '✅' : '❌'}`);
    }
    console.log('');
    
    // 4. Verificar pacientes ativos
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
      
      // Verificar elegibilidade
      const isEligible = await monitoringService.isPatientEligibleFor30MinMessage(patient);
      console.log(`   🎯 Elegível 30min: ${isEligible}`);
      
      if (isEligible) {
        console.log(`   ✅ PACIENTE ELEGÍVEL PARA MENSAGEM!`);
      } else {
        console.log(`   ❌ Paciente não elegível`);
        
        // Verificar critérios específicos
        const minWait = configManager.getMinWaitTime();
        const maxWait = configManager.getMaxWaitTime();
        const waitTime = patient.waitTimeMinutes;
        
        if (waitTime < minWait) {
          console.log(`   ⏰ Tempo insuficiente: ${waitTime} < ${minWait} min`);
        } else if (waitTime > maxWait) {
          console.log(`   ⏰ Tempo excessivo: ${waitTime} > ${maxWait} min`);
        }
      }
    }
    
    // 5. Verificar pacientes elegíveis
    console.log('\n🔍 VERIFICANDO PACIENTES ELEGÍVEIS...');
    const result = await monitoringService.checkEligiblePatients();
    
    console.log('\n📊 RESULTADOS:');
    console.log(`   📱 Canais processados: ${result.channelResults.length}`);
    console.log(`   👥 Total de pacientes: ${result.totalActive}`);
    console.log(`   ⏰ Elegíveis 30min: ${result.eligible30Min.length}`);
    console.log(`   🌅 Elegíveis fim dia: ${result.eligibleEndOfDay.length}`);
    
    if (result.eligible30Min.length > 0) {
      console.log('\n✅ PACIENTES ELEGÍVEIS ENCONTRADOS!');
      result.eligible30Min.forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name} - Canal: ${patient.channelId}`);
      });
    } else {
      console.log('\n❌ NENHUM PACIENTE ELEGÍVEL ENCONTRADO');
    }
    
    // 6. Verificar resultados por canal
    if (result.channelResults.length > 0) {
      console.log('\n📊 RESULTADOS POR CANAL:');
      result.channelResults.forEach(channelResult => {
        console.log(`   📞 ${channelResult.channelName}:`);
        console.log(`      👥 Pacientes: ${channelResult.totalPatients}`);
        console.log(`      ⏰ Elegíveis 30min: ${channelResult.eligible30Min}`);
        console.log(`      🌅 Elegíveis fim dia: ${channelResult.eligibleEndOfDay}`);
      });
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error(error.stack);
  }
}

testEligibility();