/**
 * Teste para verificar se os tokens estão sendo carregados corretamente
 */

const path = require('path');

// Simular as variáveis de ambiente diretamente
process.env.TOKEN_ANEXO1_ESTOQUE = '66180b4e5852dcf886a0ffd0';
process.env.TOKEN_WHATSAPP_OFICIAL = '65f06d5b867543e1d094fa0f';
process.env.TOKEN_CONFIRMACAO1 = '6848611846467bfb329de619';
process.env.TOKEN_CONFIRMACAO2_TI = '68486231df08d48001f8951d';
process.env.TOKEN_CONFIRMACAO3_CARLA = '6878f61667716e87a4ca2fbd';

console.log('✅ Variáveis de ambiente simuladas');

// Simular o mapeamento de tokens
const tokenMapping = {
  'TOKEN_ANEXO1_ESTOQUE': 'anexo1-estoque',
  'TOKEN_WHATSAPP_OFICIAL': 'whatsapp-oficial', 
  'TOKEN_CONFIRMACAO1': 'confirmacao1',
  'TOKEN_CONFIRMACAO2_TI': 'confirmacao2-ti',
  'TOKEN_CONFIRMACAO3_CARLA': 'confirmacao3-carla'
};

console.log('\n🔍 Verificando tokens:');
console.log('================================');

const tokens = {};
let tokensFound = 0;

Object.entries(tokenMapping).forEach(([envVar, channelId]) => {
  const token = process.env[envVar];
  if (token) {
    tokens[channelId] = token;
    tokensFound++;
    console.log(`✅ ${envVar} -> ${channelId}: ${token.substring(0, 8)}...`);
  } else {
    console.log(`❌ ${envVar} -> ${channelId}: NÃO ENCONTRADO`);
  }
});

console.log('\n📊 Resumo:');
console.log(`Tokens encontrados: ${tokensFound}/${Object.keys(tokenMapping).length}`);

if (tokensFound === 5) {
  console.log('\n🎉 Todos os tokens estão configurados!');
  
  // Testar a função getValidToken
  function getValidToken() {
    const tokens = [
      process.env.TOKEN_ANEXO1_ESTOQUE,
      process.env.TOKEN_WHATSAPP_OFICIAL,
      process.env.TOKEN_CONFIRMACAO1,
      process.env.TOKEN_CONFIRMACAO2_TI,
      process.env.TOKEN_CONFIRMACAO3_CARLA
    ].filter(token => token);

    return tokens[0] || null;
  }
  
  const validToken = getValidToken();
  console.log(`\n🔑 Token válido para KrolikApiClient: ${validToken?.substring(0, 8)}...`);
}
