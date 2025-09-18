const { KrolikApiClient } = require('../src/services/KrolikApiClient');

async function testKrolikApi() {
  console.log('🧪 TESTANDO API CAM KROLIK...\n');

  // Configurar cliente
  const krolikClient = new KrolikApiClient({
    baseURL: 'https://api.camkrolik.com.br',
    token: process.env.KROLIK_API_TOKEN || '63e68f168a48875131856df8', // Token de exemplo
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

    // 2. Listar pacientes aguardando
    console.log('2️⃣ Listando pacientes aguardando...');
    const patients = await krolikClient.listWaitingAttendances();
    console.log(`   📊 Encontrados: ${patients.length} pacientes`);
    
    if (patients.length > 0) {
      console.log('   📋 Primeiros 3 pacientes:');
      patients.slice(0, 3).forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name} - ${patient.phone} - ${patient.waitTimeMinutes}min`);
      });
    }
    console.log('');

    // 3. Listar setores
    console.log('3️⃣ Listando setores...');
    const sectors = await krolikClient.listSectors();
    console.log(`   📊 Encontrados: ${sectors.length} setores`);
    
    if (sectors.length > 0) {
      console.log('   🏥 Primeiros 3 setores:');
      sectors.slice(0, 3).forEach((sector, index) => {
        console.log(`   ${index + 1}. ${sector.name} (ID: ${sector.id})`);
      });
    }
    console.log('');

    // 4. Listar action cards
    console.log('4️⃣ Listando action cards...');
    const actionCards = await krolikClient.listActionCards();
    console.log(`   📊 Encontrados: ${actionCards.length} action cards`);
    
    if (actionCards.length > 0) {
      console.log('   📋 Primeiros 3 action cards:');
      actionCards.slice(0, 3).forEach((card, index) => {
        console.log(`   ${index + 1}. ${card.description || 'Sem descrição'} (ID: ${card.id})`);
      });
    }
    console.log('');

    // 5. Listar canais
    console.log('5️⃣ Listando canais...');
    const channels = await krolikClient.listChannels();
    console.log(`   📊 Encontrados: ${channels.length} canais`);
    
    if (channels.length > 0) {
      console.log('   📱 Primeiros 3 canais:');
      channels.slice(0, 3).forEach((channel, index) => {
        console.log(`   ${index + 1}. ${channel.description || 'Sem descrição'} (ID: ${channel.id})`);
      });
    }
    console.log('');

    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ Todas as rotas da API CAM Krolik estão funcionando');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    console.error('   Detalhes:', error.response?.data || error.stack);
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testKrolikApi().catch(console.error);
}

module.exports = { testKrolikApi };
