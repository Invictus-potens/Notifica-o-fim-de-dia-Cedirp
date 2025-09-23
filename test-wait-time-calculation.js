/**
 * Teste do cálculo do tempo de espera
 */

// Carregar variáveis de ambiente primeiro
require('dotenv').config();

const { MainController } = require('./src/controllers/MainController');

async function testWaitTimeCalculation() {
  console.log('🧪 TESTE DO CÁLCULO DO TEMPO DE ESPERA\n');
  
  try {
    // Inicializar MainController
    console.log('📋 Inicializando MainController...');
    const mainController = new MainController();
    await mainController.initialize();
    console.log('✅ MainController inicializado');
    
    // Teste 1: Verificar dados brutos da API
    console.log('\n📋 Teste 1: Verificar dados brutos da API');
    const { KrolikApiClient } = require('./src/services/KrolikApiClient');
    const apiClient = new KrolikApiClient(
      process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com.br',
      process.env.TOKEN_WHATSAPP_OFICIAL || '65f06d5b867543e1d094fa0f'
    );
    
    // Buscar dados brutos da API
    const response = await apiClient.axiosInstance.post('/core/v2/api/chats/list-lite', {
      typeChat: 2,
      status: 1
    }, {
      headers: {
        'accept': 'application/json',
        'access-token': apiClient.token,
        'Content-Type': 'application/json-patch+json'
      }
    });
    
    const rawChats = response.data.chats || [];
    console.log(`✅ ${rawChats.length} chats encontrados na API`);
    
    if (rawChats.length > 0) {
      console.log('\n📊 Dados brutos do primeiro chat:');
      const firstChat = rawChats[0];
      console.log(`   ID: ${firstChat.attendanceId}`);
      console.log(`   Nome: ${firstChat.contact?.name || 'N/A'}`);
      console.log(`   timeInWaiting: ${firstChat.timeInWaiting || 'N/A'} segundos`);
      console.log(`   utcDhStartChat: ${firstChat.utcDhStartChat || 'N/A'}`);
      
      // Calcular tempo manualmente
      if (firstChat.timeInWaiting) {
        const manualMinutes = Math.floor(firstChat.timeInWaiting / 60);
        console.log(`   Tempo calculado manualmente: ${manualMinutes} minutos`);
      }
      
      if (firstChat.utcDhStartChat) {
        const startTime = new Date(firstChat.utcDhStartChat);
        const now = new Date();
        const diffMs = now - startTime;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        console.log(`   Tempo calculado por data: ${diffMinutes} minutos`);
        console.log(`   Data início: ${startTime.toLocaleString('pt-BR')}`);
        console.log(`   Data agora: ${now.toLocaleString('pt-BR')}`);
      }
    }
    
    // Teste 2: Verificar pacientes processados
    console.log('\n📋 Teste 2: Verificar pacientes processados');
    const patients = await apiClient.listWaitingAttendances();
    console.log(`✅ ${patients.length} pacientes processados`);
    
    if (patients.length > 0) {
      console.log('\n📊 Dados processados dos primeiros 5 pacientes:');
      patients.slice(0, 5).forEach((patient, index) => {
        console.log(`\n   Paciente ${index + 1}:`);
        console.log(`   Nome: ${patient.name}`);
        console.log(`   waitTimeMinutes: ${patient.waitTimeMinutes}`);
        console.log(`   waitStartTime: ${patient.waitStartTime ? patient.waitStartTime.toLocaleString('pt-BR') : 'N/A'}`);
        
        // Verificar se tempo está sendo calculado corretamente
        if (patient.waitStartTime) {
          const now = new Date();
          const diffMs = now - patient.waitStartTime;
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          console.log(`   Tempo real desde início: ${diffMinutes} minutos`);
          console.log(`   Diferença com waitTimeMinutes: ${Math.abs(diffMinutes - patient.waitTimeMinutes)} minutos`);
        }
      });
    }
    
    // Teste 3: Verificar API consolidada
    console.log('\n📋 Teste 3: Verificar API consolidada');
    const allAttendances = await mainController.getAllWaitingAttendances();
    
    let totalPatients = 0;
    for (const [channelId, channelData] of Object.entries(allAttendances)) {
      if (channelData.attendances && channelData.attendances.length > 0) {
        totalPatients += channelData.attendances.length;
        console.log(`\n📞 Canal ${channelData.channel.number} (${channelData.channel.name}): ${channelData.attendances.length} pacientes`);
        
        // Mostrar alguns pacientes com tempos
        channelData.attendances.slice(0, 3).forEach(patient => {
          console.log(`   👤 ${patient.name}: ${patient.waitTimeMinutes} minutos`);
        });
      }
    }
    
    console.log(`\n✅ Total: ${totalPatients} pacientes consolidados`);
    
    // Teste 4: Verificar se há pacientes com tempo excedido
    console.log('\n📋 Teste 4: Verificar pacientes com tempo excedido');
    let patientsOver30Min = 0;
    let patientsOver60Min = 0;
    
    for (const [channelId, channelData] of Object.entries(allAttendances)) {
      if (channelData.attendances) {
        channelData.attendances.forEach(patient => {
          if (patient.waitTimeMinutes >= 30) {
            patientsOver30Min++;
          }
          if (patient.waitTimeMinutes >= 60) {
            patientsOver60Min++;
          }
        });
      }
    }
    
    console.log(`✅ Pacientes com mais de 30 minutos: ${patientsOver30Min}`);
    console.log(`✅ Pacientes com mais de 60 minutos: ${patientsOver60Min}`);
    
    if (patientsOver30Min > 0) {
      console.log('\n📊 Pacientes com tempo excedido:');
      for (const [channelId, channelData] of Object.entries(allAttendances)) {
        if (channelData.attendances) {
          channelData.attendances.forEach(patient => {
            if (patient.waitTimeMinutes >= 30) {
              console.log(`   👤 ${patient.name}: ${patient.waitTimeMinutes} minutos (${Math.floor(patient.waitTimeMinutes / 60)}h ${patient.waitTimeMinutes % 60}min)`);
            }
          });
        }
      }
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error.stack);
  }
}

// Executar teste
testWaitTimeCalculation();
