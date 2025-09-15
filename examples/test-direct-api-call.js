/**
 * Teste direto para a API externa para verificar se o problema está no nosso código
 */

const axios = require('axios');

// Configuração da API externa
const EXTERNAL_API_CONFIG = {
  baseUrl: 'https://api.camkrolik.com.br',
  token: '63e68f168a48875131856df8'
};

/**
 * Testa diretamente a API externa com payload correto
 */
async function testDirectApiCall() {
  try {
    console.log('🧪 Testando chamada direta para a API externa...');
    
    // Payload correto baseado no curl
    const payload = {
      number: "16981892476", // Número formatado
      contactId: "68c8490b633da7451787ba9d", // ID do chat
      templateId: "6878d983011d14f8e3ed6771", // Template ID válido
      templateComponents: [], // Vazio para teste
      forceSend: true,
      verifyContact: true
    };
    
    console.log('📤 Payload sendo enviado:');
    console.log(JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${EXTERNAL_API_CONFIG.baseUrl}/core/v2/api/chats/send-template`, payload, {
      headers: {
        'accept': 'application/json',
        'access-token': EXTERNAL_API_CONFIG.token,
        'Content-Type': 'application/json-patch+json'
      }
    });
    
    console.log('\n✅ Resposta da API externa:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 202) {
      console.log('\n🎉 SUCESSO! Template enviado com sucesso!');
      console.log('   O payload está correto e a API externa aceita');
    } else {
      console.log('\n⚠️ Resposta inesperada da API externa');
    }
    
  } catch (error) {
    console.error('❌ Erro na chamada direta para a API externa:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data && error.response.data.msg) {
        console.error(`📋 Mensagem de erro: ${error.response.data.msg}`);
        
        // Verificar se o erro é sobre número inválido
        if (error.response.data.msg.includes('INVALID_WA_NUMBER')) {
          console.error('\n🔍 ANÁLISE DO ERRO:');
          console.error('   A API está reclamando que o número é inválido');
          console.error('   Isso pode indicar que:');
          console.error('   1. O número não está no formato correto');
          console.error('   2. O número não está registrado no WhatsApp Business');
          console.error('   3. Há algum problema com o contactId');
        }
      }
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa com diferentes formatos de número
 */
async function testDifferentNumberFormats() {
  try {
    console.log('\n🧪 Testando diferentes formatos de número...');
    
    const numberFormats = [
      "16981892476", // Formato atual
      "5516981892476", // Com código do país
      "+5516981892476", // Com + e código do país
      "16981892476" // Formato sem código do país
    ];
    
    for (const numberFormat of numberFormats) {
      console.log(`\n📤 Testando formato: "${numberFormat}"`);
      
      const payload = {
        number: numberFormat,
        contactId: "68c8490b633da7451787ba9d",
        templateId: "6878d983011d14f8e3ed6771",
        templateComponents: [],
        forceSend: true,
        verifyContact: true
      };
      
      try {
        const response = await axios.post(`${EXTERNAL_API_CONFIG.baseUrl}/core/v2/api/chats/send-template`, payload, {
          headers: {
            'accept': 'application/json',
            'access-token': EXTERNAL_API_CONFIG.token,
            'Content-Type': 'application/json-patch+json'
          }
        });
        
        console.log(`✅ Sucesso com formato "${numberFormat}"`);
        console.log(`   Status: ${response.status}`);
        return; // Se funcionou, não precisa testar outros formatos
        
      } catch (error) {
        if (error.response && error.response.data && error.response.data.msg) {
          console.log(`❌ Falha com formato "${numberFormat}": ${error.response.data.msg}`);
        } else {
          console.log(`❌ Falha com formato "${numberFormat}": ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar formatos de número:', error.message);
  }
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  testDirectApiCall()
    .then(() => {
      return testDifferentNumberFormats();
    })
    .catch(console.error);
}

module.exports = {
  testDirectApiCall,
  testDifferentNumberFormats
};
