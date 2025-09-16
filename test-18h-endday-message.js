/**
 * TESTE MOCK - Mensagem de Fim de Expediente (18h)
 * 
 * Este arquivo testa o envio de mensagem de fim de dia para pacientes que ainda estão aguardando.
 * CONFIGURADO PARA ENVIAR APENAS PARA: 16981892476 (Felipe Prado)
 * 
 * Como usar:
 * node test-18h-endday-message.js
 */

const axios = require('axios');

// Configuração da API CAM Krolik
const KROLIK_API_URL = process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com.br';
const KROLIK_API_TOKEN = process.env.KROLIK_API_TOKEN || '63e68f168a48875131856df8';

// Número de teste - APENAS FELIPE PRADO
const TEST_PHONE_NUMBER = '16981892476';
const TEST_PATIENT_NAME = 'Felipe Prado';

// Simular horário de fim de expediente (18h)
const END_OF_DAY_TIME = '18:00';
const CURRENT_TIME = new Date();
const END_OF_DAY_DATE = new Date();
END_OF_DAY_DATE.setHours(18, 0, 0, 0);

// Dados mock do paciente
const mockPatient = {
  id: 'test-patient-001',
  name: TEST_PATIENT_NAME,
  phone: TEST_PHONE_NUMBER,
  sectorId: 'suporte-geral',
  sectorName: 'Suporte Geral',
  channelId: 'channel-001',
  channelType: 'normal', // Tipo 4 - WhatsApp Business (Principal)
  waitTimeMinutes: 480, // 8 horas de espera (simulando fim de dia)
  status: 'waiting',
  createdAt: new Date(Date.now() - (8 * 60 * 60 * 1000)) // 8 horas atrás
};

// ID do Action Card para mensagem de fim de dia (usar um ID real da API)
const ENDDAY_ACTION_CARD_ID = '676aab697745217d0a03dc0a'; // "Feliz Natal" - ID real da API

/**
 * Função para enviar Action Card de fim de dia via API CAM Krolik
 */
async function sendEndDayActionCard(patient, actionCardId) {
  try {
    console.log(`\n🚀 Enviando mensagem de fim de dia para ${patient.name} (${patient.phone})...`);
    
    // Formatar número de telefone corretamente (igual ao KrolikApiClient)
    let phoneNumber = patient.phone;
    console.log(`🔍 Número original recebido: "${phoneNumber}"`);
    
    // Remover código do país se presente (55) e adicionar novamente
    if (phoneNumber.startsWith('55')) {
      phoneNumber = phoneNumber.substring(2);
      console.log(`🔍 Número após remover código do país: "${phoneNumber}"`);
    }
    
    // Garantir que o número tenha 11 dígitos (DDD + 9 dígitos)
    if (phoneNumber.length === 10) {
      phoneNumber = phoneNumber.substring(0, 2) + '9' + phoneNumber.substring(2);
      console.log(`🔍 Número após adicionar 9: "${phoneNumber}"`);
    }
    
    console.log(`🔍 Número final formatado: "${phoneNumber}"`);
    
    const payload = {
      number: phoneNumber, // Número de telefone formatado
      action_card_id: actionCardId,
      forceSend: true
    };

    console.log('📤 Payload da mensagem:');
    console.log(JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${KROLIK_API_URL}/core/v2/api/chats/send-action-card`,
      payload,
      {
        headers: {
          'access-token': KROLIK_API_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Resposta da API:');
    console.log(`Status: ${response.status}`);
    console.log(`Data:`, JSON.stringify(response.data, null, 2));

    return {
      success: true,
      status: response.status,
      data: response.data
    };

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:');
    console.error(`Status: ${error.response?.status || 'N/A'}`);
    console.error(`Mensagem: ${error.response?.data?.message || error.message}`);
    console.error(`Dados:`, JSON.stringify(error.response?.data || {}, null, 2));

    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

/**
 * Função para simular verificação de horário de fim de expediente
 */
function isEndOfDayTime() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Verificar se é 18h ou depois
  const isAfter18h = currentHour >= 18;
  
  console.log(`🕐 Verificação de horário:`);
  console.log(`   Hora atual: ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
  console.log(`   Horário de fim: ${END_OF_DAY_TIME}`);
  console.log(`   É fim de expediente: ${isAfter18h ? '✅ SIM' : '❌ NÃO'}`);
  
  return isAfter18h;
}

/**
 * Função para simular filtro de pacientes elegíveis para fim de dia
 */
function getEligiblePatientsForEndDay() {
  // Simular lista de pacientes que ainda estão aguardando no fim do dia
  const allPatients = [
    mockPatient,
    // Outros pacientes mock (mas não vamos enviar para eles)
    {
      id: 'test-patient-002',
      name: 'Sergio',
      phone: '5516991593888',
      sectorId: 'administrativo',
      sectorName: 'Administrativo/Financeiro',
      channelId: 'channel-002',
      channelType: 'api_oficial',
      waitTimeMinutes: 226, // 3h 46min
      status: 'waiting'
    },
    {
      id: 'test-patient-003',
      name: 'Gabriel Ferrari',
      phone: '5517991244540',
      sectorId: 'administrativo',
      sectorName: 'Administrativo/Financeiro',
      channelId: 'channel-003',
      channelType: 'api_oficial',
      waitTimeMinutes: 284, // 4h 44min
      status: 'waiting'
    }
  ];

  // Filtrar apenas o paciente de teste (Felipe Prado)
  const eligiblePatients = allPatients.filter(patient => 
    patient.phone === TEST_PHONE_NUMBER && 
    patient.status === 'waiting'
  );

  console.log(`\n👥 Pacientes elegíveis para mensagem de fim de dia:`);
  console.log(`   Total de pacientes aguardando: ${allPatients.length}`);
  console.log(`   Pacientes elegíveis (apenas teste): ${eligiblePatients.length}`);
  
  eligiblePatients.forEach(patient => {
    console.log(`   - ${patient.name} (${patient.phone}) - ${Math.floor(patient.waitTimeMinutes / 60)}h ${patient.waitTimeMinutes % 60}min`);
  });

  return eligiblePatients;
}

/**
 * Função principal do teste
 */
async function runTest() {
  console.log('🧪 ===========================================');
  console.log('   TESTE MOCK - MENSAGEM FIM DE EXPEDIENTE');
  console.log('============================================');
  console.log(`📱 Número de teste: ${TEST_PHONE_NUMBER}`);
  console.log(`👤 Paciente: ${TEST_PATIENT_NAME}`);
  console.log(`⏰ Tempo de espera: ${Math.floor(mockPatient.waitTimeMinutes / 60)}h ${mockPatient.waitTimeMinutes % 60}min`);
  console.log(`🏥 Setor: ${mockPatient.sectorName}`);
  console.log(`📲 Canal: ${mockPatient.channelType}`);
  console.log(`🕐 Horário de fim: ${END_OF_DAY_TIME}`);
  console.log('============================================\n');

  // Verificar se as variáveis de ambiente estão configuradas
  if (!KROLIK_API_TOKEN) {
    console.error('❌ ERRO: KROLIK_API_TOKEN não está configurado!');
    console.log('💡 Configure a variável de ambiente KROLIK_API_TOKEN');
    process.exit(1);
  }

  if (!KROLIK_API_URL) {
    console.error('❌ ERRO: KROLIK_API_URL não está configurado!');
    console.log('💡 Configure a variável de ambiente KROLIK_API_BASE_URL');
    process.exit(1);
  }

  console.log(`🌐 API URL: ${KROLIK_API_URL}`);
  console.log(`🔑 Token: ${KROLIK_API_TOKEN.substring(0, 10)}...`);

  try {
    // Verificar se é horário de fim de expediente
    const isEndTime = isEndOfDayTime();
    
    if (!isEndTime) {
      console.log('\n⚠️  AVISO: Não é horário de fim de expediente ainda!');
      console.log('💡 Este teste simula o envio de mensagem de fim de dia.');
      console.log('   Em produção, esta funcionalidade só executa após 18h.\n');
    }

    // Testar conexão com a API primeiro
    console.log('\n🔍 Testando conexão com a API...');
    const healthResponse = await axios.get(`${KROLIK_API_URL}/core/v2/api/channel/list`, {
      headers: {
        'access-token': KROLIK_API_TOKEN
      },
      timeout: 5000
    });
    
    console.log('✅ Conexão com API estabelecida!');
    console.log(`Status: ${healthResponse.status}`);

    // Obter pacientes elegíveis
    const eligiblePatients = getEligiblePatientsForEndDay();

    if (eligiblePatients.length === 0) {
      console.log('⚠️  Nenhum paciente elegível encontrado para mensagem de fim de dia.');
      return;
    }

    // Enviar mensagem de fim de dia para cada paciente elegível
    const results = [];
    for (const patient of eligiblePatients) {
      const result = await sendEndDayActionCard(patient, ENDDAY_ACTION_CARD_ID);
      results.push({ patient, result });
      
      // Pequena pausa entre envios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 ===========================================');
    console.log('   RESULTADO DO TESTE');
    console.log('============================================');
    
    let successCount = 0;
    let failureCount = 0;
    
    results.forEach(({ patient, result }) => {
      if (result.success) {
        console.log(`✅ SUCESSO: ${patient.name} (${patient.phone})`);
        successCount++;
      } else {
        console.log(`❌ FALHA: ${patient.name} (${patient.phone}) - ${result.error}`);
        failureCount++;
      }
    });
    
    console.log('============================================');
    console.log(`📈 Estatísticas:`);
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Falhas: ${failureCount}`);
    console.log(`   📅 Timestamp: ${new Date().toLocaleString('pt-BR')}`);
    console.log('============================================\n');

  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO no teste:');
    console.error(error.message);
    process.exit(1);
  }
}

// Executar o teste
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = {
  runTest,
  sendEndDayActionCard,
  getEligiblePatientsForEndDay,
  isEndOfDayTime,
  mockPatient,
  ENDDAY_ACTION_CARD_ID
};
