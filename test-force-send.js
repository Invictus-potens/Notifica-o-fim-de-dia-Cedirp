const { ConfigManager } = require('./src/services/ConfigManager');
const { MonitoringService } = require('./src/services/MonitoringService');
const { MessageService } = require('./src/services/MessageService');
const { ErrorHandler } = require('./src/services/ErrorHandler');

async function testForceSend() {
  try {
    console.log('🔍 ===============================================');
    console.log('   TESTE FORÇADO DE ENVIO DE MENSAGENS');
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
    
    // 3. Filtrar pacientes Felipe
    const felipePatients = activePatients.filter(p => p.name === 'Felipe');
    console.log(`👤 PACIENTES FELIPE: ${felipePatients.length}`);
    
    if (felipePatients.length === 0) {
      console.log('❌ Nenhum paciente Felipe encontrado');
      return;
    }
    
    // 4. Enviar mensagens para cada paciente Felipe
    for (const patient of felipePatients) {
      console.log(`\n📤 Enviando mensagem para ${patient.name} (${patient.phone})`);
      console.log(`   📅 Canal: ${patient.channelId} - ${patient.channelName}`);
      
      try {
        // Criar MessageService específico para o canal
        const messageService = new MessageService(errorHandler, configManager);
        
        // Obter canal do paciente
        const channel = configManager.getChannelById(patient.channelId);
        if (!channel) {
          console.error(`❌ Canal ${patient.channelId} não encontrado`);
          continue;
        }
        
        // Inicializar MessageService com token do canal
        await messageService.initialize({
          baseURL: process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com.br',
          token: channel.token
        });
        
        // Enviar mensagem
        const result = await messageService.sendActionCard(
          patient, 
          '68d2f410506558bc378e840c', // Action card 30min
          true, 
          '30min'
        );
        
        console.log(`   ✅ Mensagem enviada com sucesso!`);
        
        // Verificar arquivo de mensagens
        const fs = require('fs');
        const messagesFile = './data/messages_sent.json';
        
        if (fs.existsSync(messagesFile)) {
          const messagesData = JSON.parse(fs.readFileSync(messagesFile, 'utf8'));
          const lastMessage = messagesData.messages[messagesData.messages.length - 1];
          
          if (lastMessage) {
            console.log(`   📨 Canal ID: ${lastMessage.channelId || 'NULL'}`);
            console.log(`   📨 Canal Nome: ${lastMessage.channelName || 'NULL'}`);
            console.log(`   📨 Canal Número: ${lastMessage.channelNumber || 'NULL'}`);
          }
        }
        
      } catch (error) {
        console.error(`   ❌ Erro ao enviar mensagem:`, error.message);
      }
    }
    
    console.log('\n✅ TESTE FORÇADO CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error(error.stack);
  }
}

testForceSend();
