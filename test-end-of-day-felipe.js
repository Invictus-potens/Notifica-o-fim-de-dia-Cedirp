const { KrolikApiClient } = require('./src/services/KrolikApiClient');

/**
 * Script para testar envio de mensagem de FIM DE EXPEDIENTE para Felipe
 * Baseado no test-felipe-with-real-contact.js
 * Usa o action card configurado para fim de expediente
 */

async function testEndOfDayMessageToFelipe() {
  try {
    console.log('🌅 Iniciando teste de MENSAGEM DE FIM DE EXPEDIENTE para Felipe Prado...');
    
    // Configurar cliente da API
    const krolikClient = new KrolikApiClient({
      baseURL: process.env.KROLIK_BASE_URL || 'https://api.camkrolik.com.br',
      token: process.env.KROLIK_TOKEN || '63e68f168a48875131856df8',
      timeout: 15000
    });

    // 1. Testar conexão
    console.log('\n1️⃣ Testando conexão com API CAM Krolik...');
    const connected = await krolikClient.testConnection();
    if (!connected) {
      throw new Error('Não foi possível conectar à API CAM Krolik');
    }
    console.log('✅ Conexão estabelecida com sucesso!');

    // 2. Buscar pacientes/contatos atuais
    console.log('\n2️⃣ Buscando contatos atuais da API...');
    const patients = await krolikClient.listWaitingAttendances();
    console.log(`📊 Encontrados ${patients.length} contatos aguardando`);

    if (patients.length === 0) {
      console.log('⚠️ Nenhum contato encontrado. Vou criar um teste com dados fictícios válidos...');
      return await testEndOfDayWithFakeData(krolikClient);
    }

    // 3. Procurar pelo número do Felipe ou usar primeiro contato disponível
    console.log('\n3️⃣ Procurando contato para teste...');
    const felipeNumber = '16981892476';
    
    let targetPatient = patients.find(p => 
      p.phone && (
        p.phone.includes('981892476') || 
        p.phone.includes('16981892476') ||
        p.phone.includes('5516981892476')
      )
    );

    if (!targetPatient && patients.length > 0) {
      // Usar primeiro contato disponível se Felipe não for encontrado
      targetPatient = patients[0];
      console.log(`⚠️ Número do Felipe não encontrado. Usando contato: ${targetPatient.name}`);
    }

    if (!targetPatient) {
      throw new Error('Nenhum contato adequado encontrado para teste');
    }

    console.log('👤 Contato selecionado para teste:');
    console.log(`   📝 Nome: ${targetPatient.name}`);
    console.log(`   📱 Telefone: ${targetPatient.phone}`);
    console.log(`   🆔 Contact ID: ${targetPatient.contactId}`);
    console.log(`   🆔 Attendance ID: ${targetPatient.id}`);

    // 4. Preparar e enviar mensagem de FIM DE EXPEDIENTE
    console.log('\n4️⃣ Enviando mensagem de FIM DE EXPEDIENTE...');
    const payload = {
      number: targetPatient.phone,
      contactId: targetPatient.contactId,
      action_card_id: '631f2b4f307d23f46ac80a2b', // Action Card de Fim de Expediente
      forceSend: true
    };

    console.log('📋 Payload (Fim de Expediente):');
    console.log(JSON.stringify(payload, null, 2));

    const response = await krolikClient.sendActionCard(payload);
    
    console.log('\n✅ TESTE DE FIM DE EXPEDIENTE CONCLUÍDO!');
    console.log('📋 Resposta da API:');
    console.log(JSON.stringify(response, null, 2));

    console.log('\n🎉 Mensagem de FIM DE EXPEDIENTE enviada com sucesso!');
    console.log(`📱 Para: ${targetPatient.name} (${targetPatient.phone})`);
    console.log('🌅 Tipo: Mensagem de Fim de Expediente');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE DE FIM DE EXPEDIENTE:');
    console.error('🚫 Mensagem:', error.message);
    
    if (error.response) {
      console.error('📊 Status HTTP:', error.response.status);
      console.error('📋 Dados da resposta:');
      console.error(JSON.stringify(error.response.data, null, 2));
      
      // Analisar erro específico
      if (error.response.status === 400) {
        console.error('\n💡 Análise do erro 400:');
        const errorData = error.response.data;
        if (errorData.message && errorData.message.includes('INVALID_WA_NUMBER')) {
          console.error('   📱 Problema: Número de WhatsApp inválido');
          console.error('   💡 Solução: Verificar se o número está correto e tem WhatsApp ativo');
        } else if (errorData.message && errorData.message.includes('contactId')) {
          console.error('   🆔 Problema: Contact ID inválido');
          console.error('   💡 Solução: Usar um Contact ID válido da API');
        } else {
          console.error('   📋 Detalhes:', errorData);
        }
      }
    }
  }
}

/**
 * Teste de fim de expediente com dados fictícios mas estruturalmente válidos
 */
async function testEndOfDayWithFakeData(krolikClient) {
  console.log('\n🧪 Testando FIM DE EXPEDIENTE com dados estruturalmente válidos...');
  
  try {
    const payload = {
      number: '16981892476', // Número do Felipe
      contactId: '507f1f77bcf86cd799439011', // ObjectId válido fictício
      action_card_id: '631f2b4f307d23f46ac80a2b', // Action Card de Fim de Expediente
      forceSend: true
    };

    console.log('📋 Payload de teste (Fim de Expediente):');
    console.log(JSON.stringify(payload, null, 2));
    
    const response = await krolikClient.sendActionCard(payload);
    console.log('✅ Resposta:', JSON.stringify(response, null, 2));
    console.log('🌅 Mensagem de FIM DE EXPEDIENTE enviada!');
    
  } catch (error) {
    console.log('⚠️ Erro esperado com dados fictícios:', error.message);
    if (error.response) {
      console.log('📋 Status:', error.response.status);
      console.log('📋 Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Executar teste
testEndOfDayMessageToFelipe();
