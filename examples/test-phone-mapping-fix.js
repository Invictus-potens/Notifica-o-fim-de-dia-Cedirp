/**
 * Exemplo de teste para verificar se o mapeamento do número de telefone está correto
 * 
 * Este exemplo testa especificamente se estamos enviando o número de telefone
 * correto e não o ID do chat.
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa com dados que simulam a estrutura real dos pacientes
 */
async function testWithRealPatientStructure() {
  try {
    console.log('🧪 Testando com estrutura real de pacientes...');
    
    // Simular dados como vêm do frontend
    const testData = {
      patients: [
        {
          number: "+5511999999999", // Número de telefone real
          contactId: "68c82f4e0b7be3d33138058d" // ID do chat real
        }
      ],
      action_card_id: "633d8fadab671674331b0cde"
    };

    console.log('📤 Dados sendo enviados (estrutura corrigida):');
    console.log(`   number: "${testData.patients[0].number}" (número de telefone)`);
    console.log(`   contactId: "${testData.patients[0].contactId}" (ID do chat)`);
    console.log(`   action_card_id: "${testData.action_card_id}"`);

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta recebida:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

    // Verificar se o erro mudou
    if (response.data.success && response.data.data.results) {
      const result = response.data.data.results[0];
      if (result.message && result.message.includes('INVALID_WA_NUMBER')) {
        console.log('🔍 Erro ainda persiste - verificando se é problema de formato do número');
        console.log(`   Número enviado: "${result.number}"`);
        console.log(`   ContactId enviado: "${result.contactId}"`);
      } else if (result.success) {
        console.log('✅ Sucesso! Mapeamento correto funcionando');
      } else {
        console.log('⚠️ Falha, mas não é mais erro de número inválido');
        console.log(`   Mensagem: ${result.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar estrutura real:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa diferentes formatos de número de telefone
 */
async function testDifferentPhoneFormats() {
  const phoneFormats = [
    "+5511999999999",
    "11999999999", 
    "+55 11 99999-9999",
    "5511999999999"
  ];

  console.log('🧪 Testando diferentes formatos de número de telefone...');

  for (const phoneNumber of phoneFormats) {
    try {
      console.log(`\n📱 Testando formato: "${phoneNumber}"`);
      
      const testData = {
        patients: [
          {
            number: phoneNumber,
            contactId: "68c82f4e0b7be3d33138058d"
          }
        ],
        action_card_id: "633d8fadab671674331b0cde"
      };

      const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, testData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.data.results) {
        const result = response.data.data.results[0];
        if (result.message && result.message.includes('INVALID_WA_NUMBER')) {
          console.log(`❌ Formato "${phoneNumber}" rejeitado - INVALID_WA_NUMBER`);
        } else if (result.success) {
          console.log(`✅ Formato "${phoneNumber}" aceito`);
        } else {
          console.log(`⚠️ Formato "${phoneNumber}" falhou por outro motivo: ${result.message}`);
        }
      }

    } catch (error) {
      if (error.response) {
        console.log(`❌ Formato "${phoneNumber}" erro HTTP: ${error.response.status}`);
      } else {
        console.log(`❌ Formato "${phoneNumber}" erro: ${error.message}`);
      }
    }
  }
}

/**
 * Testa se estamos enviando os dados corretos para a API externa
 */
async function testApiPayloadStructure() {
  try {
    console.log('🧪 Testando estrutura do payload enviado para API externa...');
    
    const testData = {
      patients: [
        {
          number: "+5511999999999",
          contactId: "68c82f4e0b7be3d33138058d"
        }
      ],
      action_card_id: "633d8fadab671674331b0cde"
    };

    console.log('📤 Payload que será enviado para API externa:');
    console.log('   Endpoint: /core/v2/api/chats/send-action-card');
    console.log('   Payload esperado:');
    console.log('   {');
    console.log('     "number": "+5511999999999",');
    console.log('     "contactId": "68c82f4e0b7be3d33138058d",');
    console.log('     "action_card_id": "633d8fadab671674331b0cde"');
    console.log('   }');

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta da API local:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Erro ao testar estrutura do payload:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Executa todos os testes de mapeamento
 */
async function runMappingTests() {
  console.log('🧪 ===========================================');
  console.log('   TESTE DE MAPEAMENTO DE NÚMERO DE TELEFONE');
  console.log('===========================================\n');

  await testWithRealPatientStructure();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testDifferentPhoneFormats();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testApiPayloadStructure();
  
  console.log('\n🎉 Testes de mapeamento concluídos!');
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  runMappingTests().catch(console.error);
}

module.exports = {
  testWithRealPatientStructure,
  testDifferentPhoneFormats,
  testApiPayloadStructure,
  runMappingTests
};
