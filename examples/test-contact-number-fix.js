/**
 * Exemplo de teste para verificar se o contactNumber está sendo usado corretamente
 * 
 * Este exemplo testa especificamente se estamos usando chat.contact?.number
 * como prioridade para o campo phone.
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa a busca de pacientes para verificar se contactNumber está sendo usado
 */
async function testContactNumberUsage() {
  try {
    console.log('🧪 Testando se contactNumber está sendo usado corretamente...');
    
    const response = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/patients`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta recebida:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Total de pacientes: ${response.data.total}`);
    
    if (response.data.patients && response.data.patients.length > 0) {
      console.log('\n📋 Análise dos pacientes encontrados:');
      
      response.data.patients.forEach((patient, index) => {
        console.log(`\n👤 Paciente ${index + 1}:`);
        console.log(`   ID: ${patient.id}`);
        console.log(`   Nome: ${patient.name}`);
        console.log(`   Telefone: ${patient.phone}`);
        console.log(`   Setor: ${patient.sectorName}`);
        
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
 * Testa o envio de mensagem com o contactNumber corrigido
 */
async function testMessageSendingWithContactNumber() {
  try {
    console.log('🧪 Testando envio de mensagem com contactNumber corrigido...');
    
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
    
    const testData = {
      patients: [
        {
          number: patientWithPhone.phone, // Usar contactNumber corrigido
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
        console.log('   Isso indica que o contactNumber ainda não está sendo usado corretamente');
      } else if (result.success) {
        console.log('\n✅ Sucesso! Mensagem enviada corretamente');
        console.log('   O contactNumber está sendo usado corretamente');
      } else {
        console.log('\n⚠️ Falha por outro motivo:', result.message);
        console.log('   Mas não é mais erro de número inválido');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar envio com contactNumber:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Executa todos os testes de contactNumber
 */
async function runContactNumberTests() {
  console.log('🧪 ===========================================');
  console.log('   TESTE DE CONTACTNUMBER CORRIGIDO');
  console.log('===========================================\n');

  await testContactNumberUsage();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testMessageSendingWithContactNumber();
  
  console.log('\n🎉 Testes de contactNumber concluídos!');
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  runContactNumberTests().catch(console.error);
}

module.exports = {
  testContactNumberUsage,
  testMessageSendingWithContactNumber,
  runContactNumberTests
};
