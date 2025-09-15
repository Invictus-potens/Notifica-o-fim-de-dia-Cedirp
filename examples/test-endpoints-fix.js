/**
 * Exemplo de teste para verificar se os endpoints estão funcionando corretamente
 * 
 * Este exemplo testa especificamente se os endpoints estão sendo chamados
 * corretamente e se não há mais erros de validação.
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa o endpoint de cartão de ação com dados reais
 */
async function testActionCardEndpoint() {
  try {
    console.log('🧪 Testando endpoint de cartão de ação...');
    
    const testData = {
      patients: [
        {
          number: "+5511999999999",
          contactId: "real-patient-id"
        }
      ],
      action_card_id: "633d8fadab671674331b0cde" // ID real de cartão de ação
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

    // Verificar se não há mais erros de validação
    if (response.data.success && response.data.data.results) {
      const hasValidationErrors = response.data.data.results.some(result => 
        result.message && result.message.includes('Payload inválido')
      );
      
      if (!hasValidationErrors) {
        console.log('✅ Validação funcionando corretamente - sem erros de endpoint');
      } else {
        console.log('❌ Ainda há erros de validação');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar endpoint de cartão de ação:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa o endpoint de template com dados reais
 */
async function testTemplateEndpoint() {
  try {
    console.log('🧪 Testando endpoint de template...');
    
    const testData = {
      patients: [
        {
          number: "+5511999999999",
          contactId: "real-patient-id"
        }
      ],
      templateId: "real-template-id", // ID real de template
      templateComponents: []
    };

    console.log('📤 Dados sendo enviados:', JSON.stringify(testData, null, 2));

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-template`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta recebida:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

    // Verificar se não há mais erros de validação
    if (response.data.success && response.data.data.results) {
      const hasValidationErrors = response.data.data.results.some(result => 
        result.message && result.message.includes('Payload inválido')
      );
      
      if (!hasValidationErrors) {
        console.log('✅ Validação funcionando corretamente - sem erros de endpoint');
      } else {
        console.log('❌ Ainda há erros de validação');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar endpoint de template:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa validação de dados obrigatórios
 */
async function testValidation() {
  try {
    console.log('🧪 Testando validação de dados obrigatórios...');
    
    // Teste 1: Sem patients
    try {
      await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, {
        action_card_id: "test-id"
      });
      console.log('❌ Deveria ter falhado sem patients');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validação funcionando: rejeitou dados sem patients');
      } else {
        console.log('❌ Validação não funcionou como esperado');
      }
    }

    // Teste 2: Sem action_card_id
    try {
      await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, {
        patients: [{ number: "+5511999999999", contactId: "test-id" }]
      });
      console.log('❌ Deveria ter falhado sem action_card_id');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validação funcionando: rejeitou dados sem action_card_id');
      } else {
        console.log('❌ Validação não funcionou como esperado');
      }
    }

    // Teste 3: Patients sem number
    try {
      await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, {
        patients: [{ contactId: "test-id" }],
        action_card_id: "test-id"
      });
      console.log('❌ Deveria ter falhado com patients sem number');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validação funcionando: rejeitou patients sem number');
      } else {
        console.log('❌ Validação não funcionou como esperado');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar validação:', error.message);
  }
}

/**
 * Executa todos os testes de endpoints
 */
async function runEndpointTests() {
  console.log('🧪 ===========================================');
  console.log('   TESTE DE ENDPOINTS CORRIGIDOS');
  console.log('===========================================\n');

  await testActionCardEndpoint();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testTemplateEndpoint();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testValidation();
  
  console.log('\n🎉 Testes de endpoints concluídos!');
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  runEndpointTests().catch(console.error);
}

module.exports = {
  testActionCardEndpoint,
  testTemplateEndpoint,
  testValidation,
  runEndpointTests
};
