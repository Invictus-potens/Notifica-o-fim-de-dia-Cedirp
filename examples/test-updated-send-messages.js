/**
 * Exemplo de teste para a funcionalidade atualizada de envio de mensagens
 * 
 * Este exemplo demonstra como testar os endpoints atualizados que usam
 * os schemas corretos com number e contactId.
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa o endpoint de envio de cartão de ação com novo schema
 */
async function testSendActionCardUpdated() {
  try {
    console.log('🧪 Testando endpoint de envio de cartão de ação (schema atualizado)...');
    
    const testData = {
      patients: [
        {
          number: "+5511999999999",
          contactId: "test-patient-1"
        },
        {
          number: "+5511888888888", 
          contactId: "test-patient-2"
        }
      ],
      action_card_id: "test-action-card-id"
    };

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta do endpoint de cartão de ação (atualizado):');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Erro ao testar endpoint de cartão de ação (atualizado):');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa o endpoint de envio de template com novo schema
 */
async function testSendTemplateUpdated() {
  try {
    console.log('🧪 Testando endpoint de envio de template (schema atualizado)...');
    
    const testData = {
      patients: [
        {
          number: "+5511999999999",
          contactId: "test-patient-1"
        },
        {
          number: "+5511888888888",
          contactId: "test-patient-2"
        }
      ],
      templateId: "test-template-id",
      templateComponents: [
        {
          type: "text",
          sub_type: "text",
          parameters: [
            {
              type: "text",
              text: "Olá! Esta é uma mensagem de teste."
            }
          ],
          index: 0
        }
      ]
    };

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-template`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta do endpoint de template (atualizado):');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Erro ao testar endpoint de template (atualizado):');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa validação de dados obrigatórios com novo schema
 */
async function testValidationUpdated() {
  try {
    console.log('🧪 Testando validação de dados obrigatórios (schema atualizado)...');
    
    // Teste sem patients
    try {
      await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, {
        action_card_id: 'test-id'
      });
      console.log('❌ Validação falhou: deveria ter rejeitado dados sem patients');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validação funcionando: rejeitou dados sem patients');
      } else {
        console.log('❌ Erro inesperado na validação:', error.message);
      }
    }

    // Teste sem action_card_id
    try {
      await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, {
        patients: [{ number: "+5511999999999", contactId: "test-patient-1" }]
      });
      console.log('❌ Validação falhou: deveria ter rejeitado dados sem action_card_id');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validação funcionando: rejeitou dados sem action_card_id');
      } else {
        console.log('❌ Erro inesperado na validação:', error.message);
      }
    }

    // Teste com patients inválidos (sem number ou contactId)
    try {
      await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, {
        patients: [{ contactId: "test-patient-1" }], // Sem number
        action_card_id: 'test-id'
      });
      console.log('❌ Validação falhou: deveria ter rejeitado patients sem number');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validação funcionando: rejeitou patients sem number');
      } else {
        console.log('❌ Erro inesperado na validação:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar validação:', error.message);
  }
}

/**
 * Executa todos os testes atualizados
 */
async function runAllUpdatedTests() {
  console.log('🧪 ===========================================');
  console.log('   TESTE DOS ENDPOINTS ATUALIZADOS');
  console.log('===========================================\n');

  await testSendActionCardUpdated();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testSendTemplateUpdated();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testValidationUpdated();
  
  console.log('\n🎉 Testes atualizados concluídos!');
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  runAllUpdatedTests().catch(console.error);
}

module.exports = {
  testSendActionCardUpdated,
  testSendTemplateUpdated,
  testValidationUpdated,
  runAllUpdatedTests
};
