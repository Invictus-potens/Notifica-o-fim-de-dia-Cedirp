/**
 * Exemplo de teste para a funcionalidade de envio manual de mensagens
 * 
 * Este exemplo demonstra como testar os novos endpoints para envio
 * de cartões de ação e templates para pacientes selecionados.
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa o endpoint de envio de cartão de ação
 */
async function testSendActionCard() {
  try {
    console.log('🧪 Testando endpoint de envio de cartão de ação...');
    
    const testData = {
      patientIds: ['test-patient-1', 'test-patient-2'],
      actionCardId: 'test-action-card-id'
    };

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta do endpoint de cartão de ação:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

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
 * Testa o endpoint de envio de template
 */
async function testSendTemplate() {
  try {
    console.log('🧪 Testando endpoint de envio de template...');
    
    const testData = {
      patientIds: ['test-patient-1', 'test-patient-2'],
      templateId: 'test-template-id'
    };

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-template`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta do endpoint de template:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

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
    
    // Teste sem patientIds
    try {
      await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, {
        actionCardId: 'test-id'
      });
      console.log('❌ Validação falhou: deveria ter rejeitado dados sem patientIds');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validação funcionando: rejeitou dados sem patientIds');
      } else {
        console.log('❌ Erro inesperado na validação:', error.message);
      }
    }

    // Teste sem actionCardId
    try {
      await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, {
        patientIds: ['test-patient-1']
      });
      console.log('❌ Validação falhou: deveria ter rejeitado dados sem actionCardId');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validação funcionando: rejeitou dados sem actionCardId');
      } else {
        console.log('❌ Erro inesperado na validação:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar validação:', error.message);
  }
}

/**
 * Executa todos os testes
 */
async function runAllTests() {
  console.log('🧪 ===========================================');
  console.log('   TESTE DOS ENDPOINTS DE ENVIO DE MENSAGENS');
  console.log('===========================================\n');

  await testSendActionCard();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testSendTemplate();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testValidation();
  
  console.log('\n🎉 Testes concluídos!');
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testSendActionCard,
  testSendTemplate,
  testValidation,
  runAllTests
};
