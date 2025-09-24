const { ConfigManager } = require('./src/services/ConfigManager');
const { MonitoringService } = require('./src/services/MonitoringService');
const { MessageService } = require('./src/services/MessageService');
const { ErrorHandler } = require('./src/services/ErrorHandler');

async function test5Felipes() {
  try {
    console.log('🔍 ===============================================');
    console.log('   TESTE COM 5 PACIENTES FELIPE');
    console.log('===============================================\n');
    
    // 1. Inicializar serviços
    const configManager = new ConfigManager();
    await configManager.initialize();
    
    const errorHandler = new ErrorHandler();
    const monitoringService = new MonitoringService(errorHandler, configManager);
    await monitoringService.initialize();
    
    // 2. Criar 5 pacientes Felipe em canais diferentes
    const felipes = [
      {
        id: "felipe1",
        name: "Felipe",
        phone: "5519995068303",
        channelId: "anexo1-estoque",
        channelName: "ANEXO1-CLAROpré cel Estoque",
        channelNumber: "5516991003715",
        channelToken: "66180b4e5852dcf886a0ffd0",
        waitTimeMinutes: 130
      },
      {
        id: "felipe2",
        name: "Felipe",
        phone: "5519995068303",
        channelId: "whatsapp-oficial",
        channelName: "WhatsApp Oficial",
        channelNumber: "551639775100",
        channelToken: "65f06d5b867543e1d094fa0f",
        waitTimeMinutes: 130
      },
      {
        id: "felipe3",
        name: "Felipe",
        phone: "5519995068303",
        channelId: "confirmacao1",
        channelName: "Confirmação 1",
        channelNumber: "5516991703483",
        channelToken: "6848611846467bfb329de619",
        waitTimeMinutes: 130
      },
      {
        id: "felipe4",
        name: "Felipe",
        phone: "5519995068303",
        channelId: "confirmacao2-ti",
        channelName: "Confirmação 2 TI",
        channelNumber: "5516991703484",
        channelToken: "68486231df08d48001f8951d",
        waitTimeMinutes: 130
      },
      {
        id: "felipe5",
        name: "Felipe",
        phone: "5519995068303",
        channelId: "confirmacao3-carla",
        channelName: "Confirmação 3 Carla",
        channelNumber: "5516991703485",
        channelToken: "6878f61667716e87a4ca2fbd",
        waitTimeMinutes: 130
      }
    ];
    
    console.log(`👥 CRIANDO ${felipes.length} PACIENTES FELIPE...`);
    
    // 3. Enviar mensagens para cada paciente Felipe
    for (const patient of felipes) {
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
        
      } catch (error) {
        console.error(`   ❌ Erro ao enviar mensagem:`, error.message);
      }
    }
    
    // 4. Verificar arquivo de mensagens
    console.log('\n📋 VERIFICANDO ARQUIVO DE MENSAGENS...');
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
    
    console.log('\n✅ TESTE COM 5 FELIPES CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error(error.stack);
  }
}

test5Felipes();
