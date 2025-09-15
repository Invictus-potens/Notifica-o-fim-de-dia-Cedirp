/**
 * Teste específico para verificar se action cards ainda funcionam após remoção de templates
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa se action cards ainda funcionam
 */
async function testActionCardsOnly() {
  try {
    console.log('🧪 Testando funcionalidade de Action Cards...');
    
    // Primeiro buscar pacientes reais
    const patientsResponse = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/patients`);
    const patients = patientsResponse.data.patients;
    
    if (patients.length === 0) {
      console.log('❌ Nenhum paciente encontrado para teste');
      return;
    }
    
    // Encontrar um paciente com telefone válido
    const patientWithPhone = patients.find(p => 
      p.phone && 
      p.phone !== 'Telefone não informado' && 
      p.phone.match(/^[\+]?[0-9\s\-\(\)]+$/)
    );
    
    if (!patientWithPhone) {
      console.log('❌ Nenhum paciente com telefone válido encontrado');
      return;
    }
    
    console.log(`📋 Usando paciente: ${patientWithPhone.name}`);
    console.log(`   Telefone: ${patientWithPhone.phone}`);
    console.log(`   ID: ${patientWithPhone.id}`);
    
    // Buscar action cards disponíveis
    const actionCardsResponse = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/action-cards`);
    const actionCards = actionCardsResponse.data.data;
    
    if (!actionCards || actionCards.length === 0) {
      console.log('❌ Nenhum action card encontrado');
      return;
    }
    
    // Usar o primeiro action card disponível
    const actionCard = actionCards[0];
    console.log(`📋 Usando Action Card: ${actionCard.description || actionCard.name || actionCard.id}`);
    console.log(`   ID: ${actionCard.id}`);
    
    const testData = {
      patients: [
        {
          number: patientWithPhone.phone,
          contactId: patientWithPhone.id
        }
      ],
      action_card_id: actionCard.id
    };

    console.log('\n📤 Dados sendo enviados:');
    console.log(`   number: "${testData.patients[0].number}"`);
    console.log(`   contactId: "${testData.patients[0].contactId}"`);
    console.log(`   action_card_id: "${testData.action_card_id}"`);

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Resposta recebida:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

    // Verificar se o envio foi bem-sucedido
    if (response.data.success && response.data.data.results) {
      const result = response.data.data.results[0];
      if (result.success) {
        console.log('\n🎉 SUCESSO! Action Card enviado com sucesso!');
        console.log('   A funcionalidade de Action Cards está funcionando corretamente');
      } else {
        console.log('\n⚠️ Falha:', result.message);
        console.log('   Verifique os logs do servidor para mais detalhes');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar Action Cards:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa se a interface ainda carrega action cards
 */
async function testActionCardsLoading() {
  try {
    console.log('\n🧪 Testando carregamento de Action Cards...');
    
    const response = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/action-cards`);
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      console.log(`✅ ${response.data.data.length} Action Cards carregados com sucesso`);
    } else {
      console.log('❌ Falha ao carregar Action Cards');
    }

  } catch (error) {
    console.error('❌ Erro ao testar carregamento de Action Cards:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa se endpoints de templates foram removidos
 */
async function testTemplatesRemoved() {
  try {
    console.log('\n🧪 Testando se endpoints de templates foram removidos...');
    
    const response = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/templates`);
    
    console.log('❌ ERRO: Endpoint de templates ainda existe!');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ SUCESSO: Endpoint de templates foi removido corretamente');
    } else {
      console.error('❌ Erro inesperado ao testar remoção de templates:');
      console.error(`📊 Status: ${error.response?.status || 'N/A'}`);
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  testActionCardsLoading()
    .then(() => testActionCardsOnly())
    .then(() => testTemplatesRemoved())
    .catch(console.error);
}

module.exports = {
  testActionCardsOnly,
  testActionCardsLoading,
  testTemplatesRemoved
};
