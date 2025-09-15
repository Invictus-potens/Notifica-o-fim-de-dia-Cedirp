/**
 * Exemplo de teste para verificar se o schema com status: 1 está funcionando
 * 
 * Este exemplo testa se a busca de contatos com status: 1 está retornando
 * os dados corretos e se o envio de mensagens funciona.
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa a busca de pacientes com status: 1
 */
async function testPatientSearchWithStatus1() {
  try {
    console.log('🧪 Testando busca de pacientes com status: 1...');
    
    const response = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/patients`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta recebida:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Total de pacientes: ${response.data.total}`);
    
    if (response.data.patients && response.data.patients.length > 0) {
      console.log('\n📋 Pacientes encontrados com status: 1:');
      
      response.data.patients.forEach((patient, index) => {
        console.log(`\n👤 Paciente ${index + 1}:`);
        console.log(`   ID: ${patient.id}`);
        console.log(`   Nome: ${patient.name}`);
        console.log(`   Telefone: ${patient.phone}`);
        console.log(`   Setor: ${patient.sectorName}`);
        console.log(`   Tempo de espera: ${patient.waitTimeMinutes} minutos`);
        
        // Verificar se o telefone parece ser um número válido
        if (patient.phone && patient.phone !== 'Telefone não informado') {
          if (patient.phone.match(/^[\+]?[0-9\s\-\(\)]+$/)) {
            console.log('   ✅ Telefone parece ser um número válido');
          } else {
            console.log('   ⚠️ Telefone pode não ser um número válido');
          }
        } else {
          console.log('   ❌ Telefone não encontrado ou inválido');
        }
      });
    } else {
      console.log('⚠️ Nenhum paciente encontrado com status: 1');
      console.log('   Isso pode indicar que não há pacientes aguardando ou que o status está incorreto');
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
 * Testa o envio de mensagem com dados do status: 1
 */
async function testMessageSendingWithStatus1() {
  try {
    console.log('🧪 Testando envio de mensagem com dados do status: 1...');
    
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
    console.log(`   Tempo de espera: ${patientWithPhone.waitTimeMinutes} minutos`);
    
    const testData = {
      patients: [
        {
          number: patientWithPhone.phone,
          contactId: patientWithPhone.id
        }
      ],
      action_card_id: "633d8fadab671674331b0cde"
    };

    console.log('\n📤 Dados sendo enviados:');
    console.log(`   number: "${testData.patients[0].number}"`);
    console.log(`   contactId: "${testData.patients[0].contactId}"`);

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-action-card`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Resposta recebida:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

    // Verificar se o erro de número inválido foi resolvido
    if (response.data.success && response.data.data.results) {
      const result = response.data.data.results[0];
      if (result.message && result.message.includes('INVALID_WA_NUMBER')) {
        console.log('\n❌ Ainda há erro de número inválido');
        console.log(`   Número enviado: "${result.number}"`);
        console.log(`   ContactId enviado: "${result.contactId}"`);
        console.log('   Isso indica que ainda há problema com o mapeamento dos dados');
      } else if (result.success) {
        console.log('\n✅ Sucesso! Mensagem enviada corretamente');
        console.log('   O schema com status: 1 está funcionando corretamente');
      } else {
        console.log('\n⚠️ Falha por outro motivo:', result.message);
        console.log('   Mas não é mais erro de número inválido');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar envio com status: 1:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Executa todos os testes de status: 1
 */
async function runStatusTests() {
  console.log('🧪 ===========================================');
  console.log('   TESTE DE SCHEMA COM STATUS: 1');
  console.log('===========================================\n');

  await testPatientSearchWithStatus1();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testMessageSendingWithStatus1();
  
  console.log('\n🎉 Testes de status: 1 concluídos!');
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  runStatusTests().catch(console.error);
}

module.exports = {
  testPatientSearchWithStatus1,
  testMessageSendingWithStatus1,
  runStatusTests
};
