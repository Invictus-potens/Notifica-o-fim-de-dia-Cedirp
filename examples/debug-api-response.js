const { KrolikApiClient } = require('../src/services/KrolikApiClient');

async function debugApiResponse() {
  console.log('🔍 DEBUGANDO RESPOSTA DA API CAM KROLIK...\n');

  // Configurar cliente
  const krolikClient = new KrolikApiClient({
    baseURL: 'https://api.camkrolik.com.br',
    token: process.env.KROLIK_API_TOKEN || '63e68f168a48875131856df8',
    timeout: 10000
  });

  try {
    // 1. Testar conexão
    console.log('1️⃣ Testando conexão...');
    const connected = await krolikClient.testConnection();
    console.log(`   ${connected ? '✅ Conectado' : '❌ Falha na conexão'}\n`);

    if (!connected) {
      console.log('⚠️  Não foi possível conectar à API. Verifique:');
      console.log('   - Token de acesso válido');
      console.log('   - Conectividade com a internet');
      console.log('   - URL da API correta\n');
      return;
    }

    // 2. Fazer requisição direta para ver a estrutura real
    console.log('2️⃣ Fazendo requisição direta para /core/v2/api/chats/list-lite...');
    
    const axios = require('axios');
    const response = await axios.post('https://api.camkrolik.com.br/core/v2/api/chats/list-lite', {
      typeChat: 2,
      status: 1
    }, {
      headers: {
        'accept': 'application/json',
        'access-token': process.env.KROLIK_API_TOKEN || '63e68f168a48875131856df8',
        'Content-Type': 'application/json-patch+json'
      },
      timeout: 10000
    });

    console.log('📥 Resposta completa da API:');
    console.log('   Status:', response.status);
    console.log('   Headers:', response.headers);
    console.log('   Data structure:');
    console.log(JSON.stringify(response.data, null, 2));

    // 3. Analisar estrutura dos chats
    if (response.data && response.data.chats) {
      console.log('\n3️⃣ Analisando estrutura dos chats...');
      const chats = response.data.chats;
      console.log(`   📊 Total de chats: ${chats.length}`);
      
      if (chats.length > 0) {
        console.log('\n   📋 Estrutura do primeiro chat:');
        const firstChat = chats[0];
        console.log('   └─ Campos disponíveis:', Object.keys(firstChat));
        console.log('\n   📋 Valores do primeiro chat:');
        Object.entries(firstChat).forEach(([key, value]) => {
          console.log(`   └─ ${key}: ${typeof value} = ${JSON.stringify(value)}`);
        });
      }
    }

    // 4. Testar conversão atual
    console.log('\n4️⃣ Testando conversão atual...');
    const patients = await krolikClient.listWaitingAttendances();
    console.log(`   📊 Pacientes convertidos: ${patients.length}`);
    
    if (patients.length > 0) {
      console.log('\n   📋 Primeiro paciente convertido:');
      console.log(JSON.stringify(patients[0], null, 2));
    }

  } catch (error) {
    console.error('❌ ERRO NO DEBUG:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Stack:', error.stack);
    }
  }
}

// Executar debug se chamado diretamente
if (require.main === module) {
  debugApiResponse().catch(console.error);
}

module.exports = { debugApiResponse };
