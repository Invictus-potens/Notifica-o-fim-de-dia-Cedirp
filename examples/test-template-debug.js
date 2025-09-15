/**
 * Debug específico para encontrar onde os valores estão sendo trocados
 */

const axios = require('axios');

// Configuração da API externa
const EXTERNAL_API_CONFIG = {
  baseUrl: 'https://api.camkrolik.com.br',
  token: '63e68f168a48875131856df8'
};

/**
 * Testa diretamente com a API externa para verificar se o problema está no nosso código
 */
async function testDirectTemplateCall() {
  try {
    console.log('🧪 Testando chamada direta para API externa (template)...');
    
    // Payload correto baseado no curl
    const correctPayload = {
      number: "16981892476", // Número formatado
      contactId: "68c8490b633da7451787ba9d", // ID do chat
      templateId: "6878d983011d14f8e3ed6771", // Template ID válido
      templateComponents: [], // Vazio para teste
      forceSend: true,
      verifyContact: true
    };
    
    console.log('📤 Payload correto sendo enviado:');
    console.log(JSON.stringify(correctPayload, null, 2));
    
    // Fazer a chamada direta
    const response = await axios.post(`${EXTERNAL_API_CONFIG.baseUrl}/core/v2/api/chats/send-template`, correctPayload, {
      headers: {
        'accept': 'application/json',
        'access-token': EXTERNAL_API_CONFIG.token,
        'Content-Type': 'application/json-patch+json'
      }
    });
    
    console.log('\n✅ Resposta da API externa:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro na chamada direta para API externa:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data && error.response.data.msg) {
        console.error(`📋 Mensagem de erro: ${error.response.data.msg}`);
        
        // Verificar se o erro é sobre número inválido
        if (error.response.data.msg.includes('INVALID_WA_NUMBER')) {
          const invalidNumber = error.response.data.msg.match(/The number ([a-f0-9]+) is invalid/);
          if (invalidNumber) {
            const reportedNumber = invalidNumber[1];
            console.error('\n🔍 ANÁLISE DO ERRO:');
            console.error(`   API reportou número inválido: "${reportedNumber}"`);
            console.error(`   Número que enviamos: "16981892476"`);
            console.error(`   ContactId que enviamos: "68c8490b633da7451787ba9d"`);
            
            if (reportedNumber === '68c8490b633da7451787ba9d') {
              console.error('❌ CONFIRMADO: API está recebendo contactId no lugar do number!');
              console.error('   Isso indica um bug na nossa implementação');
            } else if (reportedNumber === '16981892476') {
              console.error('⚠️ API está recebendo o número correto, mas considera inválido');
              console.error('   Pode ser problema de formato ou registro no WhatsApp');
            } else {
              console.error('❓ API está recebendo um valor diferente do esperado');
            }
          }
        }
      }
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa com payload incorreto para confirmar o erro
 */
async function testIncorrectPayload() {
  try {
    console.log('\n🧪 Testando payload incorreto (trocando number e contactId)...');
    
    // Payload incorreto (trocando os valores)
    const incorrectPayload = {
      number: "68c8490b633da7451787ba9d", // ContactId no lugar do number (ERRADO)
      contactId: "16981892476", // Number no lugar do contactId (ERRADO)
      templateId: "6878d983011d14f8e3ed6771",
      templateComponents: [],
      forceSend: true,
      verifyContact: true
    };
    
    console.log('📤 Payload incorreto sendo enviado:');
    console.log(JSON.stringify(incorrectPayload, null, 2));
    
    const response = await axios.post(`${EXTERNAL_API_CONFIG.baseUrl}/core/v2/api/chats/send-template`, incorrectPayload, {
      headers: {
        'accept': 'application/json',
        'access-token': EXTERNAL_API_CONFIG.token,
        'Content-Type': 'application/json-patch+json'
      }
    });
    
    console.log('\n⚠️ Resposta inesperada (deveria dar erro):');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n✅ Erro esperado com payload incorreto:');
    if (error.response && error.response.data && error.response.data.msg) {
      console.log(`📋 Mensagem: ${error.response.data.msg}`);
      
      if (error.response.data.msg.includes('INVALID_WA_NUMBER')) {
        console.log('✅ Confirmado: API rejeita contactId quando usado como number');
      }
    }
  }
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  testDirectTemplateCall()
    .then(() => testIncorrectPayload())
    .catch(console.error);
}

module.exports = {
  testDirectTemplateCall,
  testIncorrectPayload
};
