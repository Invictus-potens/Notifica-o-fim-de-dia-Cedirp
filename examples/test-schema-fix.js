/**
 * Exemplo de teste para verificar se o schema de busca está correto
 * 
 * Este exemplo testa se a busca de contatos está seguindo o schema correto
 * e verifica os logs de debug para identificar o problema do número de telefone.
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa a busca de pacientes para ver os logs de debug
 */
async function testPatientSearch() {
  try {
    console.log('🧪 Testando busca de pacientes para ver logs de debug...');
    
    const response = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/patients`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta recebida:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Total de pacientes: ${response.data.total}`);
    
    if (response.data.patients && response.data.patients.length > 0) {
      console.log('\n📋 Primeiro paciente encontrado:');
      const firstPatient = response.data.patients[0];
      console.log(`   ID: ${firstPatient.id}`);
      console.log(`   Nome: ${firstPatient.name}`);
      console.log(`   Telefone: ${firstPatient.phone}`);
      console.log(`   Setor: ${firstPatient.sectorName}`);
      
      // Verificar se o telefone está correto
      if (firstPatient.phone && firstPatient.phone !== 'Telefone não informado') {
        console.log('✅ Telefone encontrado corretamente');
      } else {
        console.log('❌ Problema: Telefone não encontrado ou inválido');
      }
      
      // Verificar se o ID não é o número de telefone
      if (firstPatient.id && firstPatient.id.length > 10) {
        console.log('✅ ID parece ser um ID de chat (não é número de telefone)');
      } else {
        console.log('⚠️ ID pode estar incorreto');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao buscar pacientes:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa o envio de mensagem com dados reais dos pacientes
 */
async function testMessageSendingWithRealData() {
  try {
    console.log('🧪 Testando envio de mensagem com dados reais...');
    
    // Primeiro buscar pacientes reais
    const patientsResponse = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/patients`);
    const patients = patientsResponse.data.patients;
    
    if (patients.length === 0) {
      console.log('❌ Nenhum paciente encontrado para teste');
      return;
    }
    
    const firstPatient = patients[0];
    console.log(`📋 Usando paciente: ${firstPatient.name} (${firstPatient.phone})`);
    
    const testData = {
      patients: [
        {
          number: firstPatient.phone, // Usar telefone real do paciente
          contactId: firstPatient.id  // Usar ID real do paciente
        }
      ],
      action_card_id: "633d8fadab671674331b0cde"
    };

    console.log('📤 Dados sendo enviados:');
    console.log(`   number: "${testData.patients[0].number}"`);
    console.log(`   contactId: "${testData.patients[0].contactId}"`);

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta recebida:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

    // Verificar se ainda há erro de número inválido
    if (response.data.success && response.data.data.results) {
      const result = response.data.data.results[0];
      if (result.message && result.message.includes('INVALID_WA_NUMBER')) {
        console.log('❌ Ainda há erro de número inválido');
        console.log(`   Número enviado: "${result.number}"`);
        console.log(`   ContactId enviado: "${result.contactId}"`);
      } else if (result.success) {
        console.log('✅ Sucesso! Mensagem enviada corretamente');
      } else {
        console.log('⚠️ Falha por outro motivo:', result.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar envio com dados reais:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Executa todos os testes de schema
 */
async function runSchemaTests() {
  console.log('🧪 ===========================================');
  console.log('   TESTE DE SCHEMA DE BUSCA DE CONTATOS');
  console.log('===========================================\n');

  await testPatientSearch();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testMessageSendingWithRealData();
  
  console.log('\n🎉 Testes de schema concluídos!');
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  runSchemaTests().catch(console.error);
}

module.exports = {
  testPatientSearch,
  testMessageSendingWithRealData,
  runSchemaTests
};
