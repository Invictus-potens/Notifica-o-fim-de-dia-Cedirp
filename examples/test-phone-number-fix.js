/**
 * Exemplo de teste para verificar se o número de telefone está sendo enviado corretamente
 * 
 * Este exemplo testa especificamente se o campo 'number' está sendo enviado
 * corretamente para a API CAM Krolik.
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa o envio com número de telefone válido
 */
async function testWithValidPhoneNumber() {
  try {
    console.log('🧪 Testando envio com número de telefone válido...');
    
    const testData = {
      patients: [
        {
          number: "+5511999999999", // Número válido
          contactId: "test-patient-1"
        }
      ],
      action_card_id: "test-action-card-id"
    };

    console.log('📤 Dados sendo enviados:', JSON.stringify(testData, null, 2));

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta recebida:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Erro ao testar com número válido:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
      
      // Verificar se o erro é específico sobre número
      if (error.response.data && error.response.data.message && 
          error.response.data.message.includes('Number is required')) {
        console.log('🔍 PROBLEMA IDENTIFICADO: A API está rejeitando o número de telefone');
      }
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa o envio com número de telefone inválido
 */
async function testWithInvalidPhoneNumber() {
  try {
    console.log('🧪 Testando envio com número de telefone inválido...');
    
    const testData = {
      patients: [
        {
          number: "", // Número vazio
          contactId: "test-patient-1"
        }
      ],
      action_card_id: "test-action-card-id"
    };

    console.log('📤 Dados sendo enviados:', JSON.stringify(testData, null, 2));

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta recebida (inesperada - deveria falhar):');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('✅ Resposta esperada (erro):');
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(`📋 Erro: ${error.message}`);
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
    "5511999999999",
    "11999999999"
  ];

  console.log('🧪 Testando diferentes formatos de número de telefone...');

  for (const phoneNumber of phoneFormats) {
    try {
      console.log(`\n📱 Testando formato: "${phoneNumber}"`);
      
      const testData = {
        patients: [
          {
            number: phoneNumber,
            contactId: "test-patient-1"
          }
        ],
        action_card_id: "test-action-card-id"
      };

      const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, testData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Formato "${phoneNumber}" aceito - Status: ${response.status}`);

    } catch (error) {
      if (error.response) {
        console.log(`❌ Formato "${phoneNumber}" rejeitado - Status: ${error.response.status}`);
        if (error.response.data && error.response.data.message) {
          console.log(`   Motivo: ${error.response.data.message}`);
        }
      } else {
        console.log(`❌ Formato "${phoneNumber}" erro: ${error.message}`);
      }
    }
  }
}

/**
 * Executa todos os testes de número de telefone
 */
async function runPhoneNumberTests() {
  console.log('🧪 ===========================================');
  console.log('   TESTE DE NÚMERO DE TELEFONE');
  console.log('===========================================\n');

  await testWithValidPhoneNumber();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testWithInvalidPhoneNumber();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testDifferentPhoneFormats();
  
  console.log('\n🎉 Testes de número de telefone concluídos!');
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  runPhoneNumberTests().catch(console.error);
}

module.exports = {
  testWithValidPhoneNumber,
  testWithInvalidPhoneNumber,
  testDifferentPhoneFormats,
  runPhoneNumberTests
};
