const axios = require('axios');

/**
 * Script de teste para enviar mensagem para Felipe Prado
 * Testa se os Action Cards estão funcionando corretamente
 */

async function testMessageToFelipe() {
  try {
    console.log('🧪 Iniciando teste de mensagem para Felipe Prado...');
    
    // Dados do Felipe (número com DDD local conforme especificação)
    const felipeData = {
      patients: [
        {
          number: "16981892476", // Número do Felipe com DDD local
          contactId: "test_felipe_contact_id_" + Date.now(), // ID temporário para teste
          name: "FELIPE PRADO"
        }
      ],
      action_card_id: "631f2b4f307d23f46ac80a2b" // Action Card ID configurado
    };

    console.log('📋 Dados do teste:');
    console.log('   📱 Número:', felipeData.patients[0].number);
    console.log('   🆔 Contact ID:', felipeData.patients[0].contactId);
    console.log('   🎫 Action Card ID:', felipeData.action_card_id);

    // Fazer requisição para a rota de teste
    const response = await axios.post('http://localhost:3000/api/messages/send-action-card', felipeData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos de timeout
    });

    console.log('\n✅ Resposta da API:');
    console.log('   📊 Status:', response.status);
    console.log('   📋 Dados:', JSON.stringify(response.data, null, 2));

    // Verificar resultado baseado na estrutura real da resposta
    const responseData = response.data.data || response.data;
    
    if (responseData.success > 0) {
      console.log('\n🎉 TESTE BEM-SUCEDIDO!');
      console.log('   ✅ Mensagem enviada para Felipe Prado');
      console.log('   📱 Número:', felipeData.patients[0].number);
      console.log('   📈 Sucessos:', responseData.success);
      console.log('   ❌ Falhas:', responseData.failed);
    } else {
      console.log('\n❌ TESTE FALHOU!');
      console.log('   🚫 Nenhuma mensagem foi enviada com sucesso');
      console.log('   📈 Sucessos:', responseData.success);
      console.log('   ❌ Falhas:', responseData.failed);
      
      if (responseData.results && responseData.results.length > 0) {
        console.log('   💡 Detalhes dos erros:');
        responseData.results.forEach((result, index) => {
          if (!result.success) {
            console.log(`      ${index + 1}. ${result.error}`);
          }
        });
      }
    }

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error('   🚫 Mensagem:', error.message);
    
    if (error.response) {
      console.error('   📊 Status HTTP:', error.response.status);
      console.error('   📋 Resposta:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   🌐 Servidor não está rodando na porta 3000');
      console.error('   💡 Inicie o servidor primeiro: npm start');
    }
  }
}

// Executar teste
testMessageToFelipe();
