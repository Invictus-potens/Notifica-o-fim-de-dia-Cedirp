/**
 * TESTE MOCK - Mensagem de 30 minutos
 * 
 * Este arquivo testa o envio de mensagem para pacientes que estão aguardando há mais de 30 minutos.
 * CONFIGURADO PARA ENVIAR APENAS PARA: 16981892476 (Felipe Prado)
 * 
 * Como usar:
 * node test-30min-message.js
 */

//KROLIK_API_BASE_URL=https:/api.camkrolik.com.br
//KROLIK_API_TOKEN=63e68f168a48875131856df8

const axios = require('axios');

// Configuração da API CAM Krolik
const KROLIK_API_URL = process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com.br';
const KROLIK_API_TOKEN = process.env.KROLIK_API_TOKEN || '63e68f168a48875131856df8';

// Número de teste - APENAS FELIPE PRADO
const TEST_PHONE_NUMBER = '5516981892476';
const TEST_PATIENT_NAME = 'Felipe Prado';

// Dados mock do paciente
const mockPatient = {
  id: 'test-patient-001',
  name: TEST_PATIENT_NAME,
  phone: TEST_PHONE_NUMBER,
  sectorId: 'suporte-geral',
  sectorName: 'Suporte Geral',
  channelId: 'channel-001',
  channelType: 'normal', // Tipo 4 - WhatsApp Business (Principal)
  waitTimeMinutes: 32, // Mais de 30 minutos
  status: 'waiting',
  createdAt: new Date(Date.now() - (32 * 60 * 1000)) // 32 minutos atrás
};

// ID do Action Card para mensagem de 30 minutos (usar um ID real da API)
const ACTION_CARD_ID = '65cfa07c262227749fb036f3'; // "Feliz ano Novo" - ID real da API

/**
 * Função para enviar Action Card via API CAM Krolik
 */
async function sendActionCard(patient, actionCardId) {
  try {
    console.log(`\n🚀 Enviando mensagem de 30min para ${patient.name} (${patient.phone})...`);
    
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
      action_card_id: ACTION_CARD_ID,
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
 * Função principal do teste
 */
async function runTest() {
  console.log('🧪 ===========================================');
  console.log('   TESTE MOCK - MENSAGEM DE 30 MINUTOS');
  console.log('============================================');
  console.log(`📱 Número de teste: ${TEST_PHONE_NUMBER}`);
  console.log(`👤 Paciente: ${TEST_PATIENT_NAME}`);
  console.log(`⏰ Tempo de espera: ${mockPatient.waitTimeMinutes} minutos`);
  console.log(`🏥 Setor: ${mockPatient.sectorName}`);
  console.log(`📲 Canal: ${mockPatient.channelType}`);
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

    // Enviar mensagem de 30 minutos
    const result = await sendActionCard(mockPatient, ACTION_CARD_ID);

    console.log('\n📊 ===========================================');
    console.log('   RESULTADO DO TESTE');
    console.log('============================================');
    
    if (result.success) {
      console.log('✅ SUCESSO: Mensagem enviada com sucesso!');
      console.log(`📱 Para: ${TEST_PATIENT_NAME} (${TEST_PHONE_NUMBER})`);
      console.log(`⏰ Tempo de espera: ${mockPatient.waitTimeMinutes} minutos`);
      console.log(`📅 Timestamp: ${new Date().toLocaleString('pt-BR')}`);
    } else {
      console.log('❌ FALHA: Erro ao enviar mensagem');
      console.log(`🔍 Erro: ${result.error}`);
      console.log(`📊 Status: ${result.status}`);
    }
    
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
  sendActionCard,
  mockPatient,
  ACTION_CARD_ID
};
