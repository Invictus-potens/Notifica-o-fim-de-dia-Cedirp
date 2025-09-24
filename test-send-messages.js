const { ConfigManager } = require('./src/services/ConfigManager');
const { MonitoringService } = require('./src/services/MonitoringService');
const { ProductionScheduler } = require('./src/services/ProductionScheduler');
const { ErrorHandler } = require('./src/services/ErrorHandler');

async function testSendMessages() {
  try {
    console.log('🔍 ===============================================');
    console.log('   TESTE DE ENVIO DE MENSAGENS');
    console.log('===============================================\n');
    
    // 1. Inicializar serviços
    const configManager = new ConfigManager();
    await configManager.initialize();
    
    const errorHandler = new ErrorHandler();
    const monitoringService = new MonitoringService(errorHandler, configManager);
    await monitoringService.initialize();
    
    const productionScheduler = new ProductionScheduler(monitoringService, errorHandler, configManager);
    
    // 2. Verificar pacientes elegíveis
    console.log('🔍 Verificando pacientes elegíveis...');
    const result = await monitoringService.checkEligiblePatients();
    
    console.log(`📊 Pacientes elegíveis 30min: ${result.eligible30Min.length}`);
    
    if (result.eligible30Min.length > 0) {
      console.log('\n📤 Enviando mensagens...');
      
      // 3. Enviar mensagens
      const sendResult = await productionScheduler.handle30MinuteMessages(result.eligible30Min);
      
      console.log(`\n📊 RESULTADOS DO ENVIO:`);
      console.log(`   ✅ Enviadas: ${sendResult.sent}`);
      console.log(`   ❌ Falharam: ${sendResult.failed}`);
      
      if (sendResult.channelResults) {
        console.log(`\n📱 RESULTADOS POR CANAL:`);
        sendResult.channelResults.forEach(channelResult => {
          console.log(`   📞 ${channelResult.channelName}:`);
          console.log(`      ✅ Enviadas: ${channelResult.sent}`);
          console.log(`      ❌ Falharam: ${channelResult.failed}`);
        });
      }
      
      // 4. Verificar arquivo de mensagens
      console.log('\n📋 Verificando arquivo de mensagens...');
      const fs = require('fs');
      const messagesFile = './data/messages_sent.json';
      
      if (fs.existsSync(messagesFile)) {
        const messagesData = JSON.parse(fs.readFileSync(messagesFile, 'utf8'));
        console.log(`📨 Total de mensagens: ${messagesData.messages.length}`);
        
        if (messagesData.messages.length > 0) {
          console.log('\n📋 DETALHES DAS MENSAGENS:');
          messagesData.messages.forEach((msg, index) => {
            console.log(`\n   ${index + 1}. ${msg.patientName} (${msg.patientPhone})`);
            console.log(`      📞 Canal ID: ${msg.channelId || 'NULL'}`);
            console.log(`      📞 Canal Nome: ${msg.channelName || 'NULL'}`);
            console.log(`      📞 Canal Número: ${msg.channelNumber || 'NULL'}`);
            console.log(`      ✅ Sucesso: ${msg.success}`);
          });
        }
      }
      
    } else {
      console.log('❌ Nenhum paciente elegível encontrado');
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error(error.stack);
  }
}

testSendMessages();
