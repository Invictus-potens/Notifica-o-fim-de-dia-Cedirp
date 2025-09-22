/**
 * Teste para verificar se os tokens estão sendo carregados corretamente do .env
 */

const path = require('path');

// Carregar variáveis do .env se o arquivo existir
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
  console.log('✅ Arquivo .env carregado com sucesso');
  
  // Verificar se as variáveis foram carregadas
  console.log('\n🔍 Verificando variáveis carregadas:');
  console.log('process.env.TOKEN_ANEXO1_ESTOQUE:', process.env.TOKEN_ANEXO1_ESTOQUE ? '✅ Carregado' : '❌ Não encontrado');
  console.log('process.env.TOKEN_WHATSAPP_OFICIAL:', process.env.TOKEN_WHATSAPP_OFICIAL ? '✅ Carregado' : '❌ Não encontrado');
} catch (error) {
  console.log('⚠️ Arquivo .env não encontrado ou erro ao carregar:', error.message);
}

// Simular o mapeamento de tokens
const tokenMapping = {
  'TOKEN_ANEXO1_ESTOQUE': 'anexo1-estoque',
  'TOKEN_WHATSAPP_OFICIAL': 'whatsapp-oficial', 
  'TOKEN_CONFIRMACAO1': 'confirmacao1',
  'TOKEN_CONFIRMACAO2_TI': 'confirmacao2-ti',
  'TOKEN_CONFIRMACAO3_CARLA': 'confirmacao3-carla'
};

console.log('\n🔍 Verificando tokens do .env:');
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

if (tokensFound === 0) {
  console.log('\n⚠️ Nenhum token encontrado! Verifique se:');
  console.log('1. O arquivo .env existe na raiz do projeto');
  console.log('2. As variáveis estão definidas corretamente');
  console.log('3. Não há espaços extras ou caracteres especiais');
  
  console.log('\n📝 Exemplo de arquivo .env:');
  console.log('TOKEN_ANEXO1_ESTOQUE=66180b4e5852dcf886a0ffd0');
  console.log('TOKEN_WHATSAPP_OFICIAL=65f06d5b867543e1d094fa0f');
  console.log('TOKEN_CONFIRMACAO1=6848611846467bfb329de619');
  console.log('TOKEN_CONFIRMACAO2_TI=68486231df08d48001f8951d');
  console.log('TOKEN_CONFIRMACAO3_CARLA=6878f61667716e87a4ca2fbd');
} else {
  console.log('\n🎉 Tokens carregados com sucesso!');
}
