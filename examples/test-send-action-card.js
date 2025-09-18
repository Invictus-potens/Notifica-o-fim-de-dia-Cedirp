const { KrolikApiClient } = require('../src/services/KrolikApiClient');

async function testSendActionCard() {
  console.log('🧪 TESTANDO ENVIO DE ACTION CARD...\n');

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

    // 2. Buscar pacientes para testar
    console.log('2️⃣ Buscando pacientes para teste...');
    const patients = await krolikClient.listWaitingAttendances();
    console.log(`   📊 Encontrados ${patients.length} pacientes aguardando\n`);

    if (patients.length === 0) {
      console.log('⚠️  Nenhum paciente encontrado para testar o envio\n');
      return;
    }

    // 3. Usar primeiro paciente para teste
    const testPatient = patients[0];
    console.log('3️⃣ Paciente selecionado para teste:');
    console.log(`   👤 Nome: ${testPatient.name}`);
    console.log(`   📞 Telefone: ${testPatient.phone}`);
    console.log(`   🆔 AttendanceId: ${testPatient.id}`);
    console.log(`   🆔 ContactId: ${testPatient.contactId}\n`);

    // 4. Buscar action cards disponíveis
    console.log('4️⃣ Buscando action cards disponíveis...');
    const actionCards = await krolikClient.listActionCards();
    console.log(`   📋 Encontrados ${actionCards.length} action cards\n`);

    if (actionCards.length === 0) {
      console.log('⚠️  Nenhum action card encontrado para teste\n');
      return;
    }

    // 5. Usar primeiro action card para teste
    const testActionCard = actionCards[0];
    console.log('5️⃣ Action card selecionado para teste:');
    console.log(`   🆔 ID: ${testActionCard.id}`);
    console.log(`   📝 Nome: ${testActionCard.name || 'Sem nome'}\n`);

    // 6. Preparar payload seguindo o modelo do curl
    console.log('6️⃣ Preparando payload seguindo modelo do curl...');
    const payload = {
      number: testPatient.phone,
      contactId: testPatient.contactId,
      action_card_id: testActionCard.id,
      forceSend: true
    };
    
    console.log('   📋 Payload preparado:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    // 7. Testar envio
    console.log('7️⃣ Testando envio do action card...');
    console.log('   ⚠️  ATENÇÃO: Este é um teste real que enviará uma mensagem!');
    console.log('   ⚠️  Pressione Ctrl+C para cancelar em 5 segundos...\n');
    
    // Aguardar 5 segundos para cancelamento
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('   🚀 Enviando action card...');
    const response = await krolikClient.sendActionCard(payload);
    
    console.log('   ✅ Action card enviado com sucesso!');
    console.log('   📋 Resposta da API:');
    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    if (error.response) {
      console.error('   📋 Status:', error.response.status);
      console.error('   📋 Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   📋 Stack:', error.stack);
    }
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testSendActionCard().catch(console.error);
}

module.exports = { testSendActionCard };
