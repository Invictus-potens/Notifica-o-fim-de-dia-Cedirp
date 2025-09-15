/**
 * Teste que simula exatamente nossa implementação para encontrar o bug
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Simula exatamente o que está acontecendo no nosso código
 */
async function testExactImplementation() {
  try {
    console.log('🧪 Simulando exatamente nossa implementação...');
    
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
    
    console.log(`📋 Paciente encontrado:`);
    console.log(`   Nome: ${patientWithPhone.name}`);
    console.log(`   Telefone: ${patientWithPhone.phone}`);
    console.log(`   ID: ${patientWithPhone.id}`);
    
    // Simular o mapeamento do frontend (como no app.js)
    const mappedPatient = {
      number: patientWithPhone.phone, // Número de telefone do paciente
      contactId: patientWithPhone.id   // ID do chat/atendimento
    };
    
    console.log('\n📤 Dados mapeados (como no frontend):');
    console.log(`   number: "${mappedPatient.number}"`);
    console.log(`   contactId: "${mappedPatient.contactId}"`);
    
    // Simular a formatação do número (como no KrolikApiClient)
    let phoneNumber = mappedPatient.number;
    console.log(`\n🔍 Formatação do número:`);
    console.log(`   Número original: "${phoneNumber}"`);
    
    if (phoneNumber.startsWith('55')) {
      phoneNumber = phoneNumber.substring(2);
      console.log(`   Após remover código do país: "${phoneNumber}"`);
    }
    
    if (phoneNumber.length === 10) {
      phoneNumber = phoneNumber.substring(0, 2) + '9' + phoneNumber.substring(2);
      console.log(`   Após adicionar 9: "${phoneNumber}"`);
    }
    
    console.log(`   Número final formatado: "${phoneNumber}"`);
    
    // Simular o payload final (como no KrolikApiClient)
    const payload = {
      number: phoneNumber, // Número de telefone formatado
      contactId: mappedPatient.contactId, // ID do contato/chat
      templateId: "6878d983011d14f8e3ed6771",
      templateComponents: [],
      forceSend: true,
      verifyContact: true
    };
    
    console.log('\n📤 Payload final que seria enviado:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Verificar se há algum problema óbvio
    console.log('\n🔍 Verificações críticas:');
    console.log(`   payload.number = "${payload.number}"`);
    console.log(`   payload.contactId = "${payload.contactId}"`);
    console.log(`   payload.number é um ID MongoDB? ${payload.number.match(/^[a-f0-9]{24}$/) ? 'SIM' : 'NÃO'}`);
    console.log(`   payload.contactId é um ID MongoDB? ${payload.contactId.match(/^[a-f0-9]{24}$/) ? 'SIM' : 'NÃO'}`);
    
    // Verificar se os valores foram trocados
    if (payload.number === mappedPatient.contactId) {
      console.log('❌ PROBLEMA CRÍTICO: O campo number contém o contactId!');
    } else if (payload.contactId === mappedPatient.number) {
      console.log('❌ PROBLEMA CRÍTICO: O campo contactId contém o number!');
    } else {
      console.log('✅ Os campos estão corretos');
    }
    
    // Testar com nossa API local
    console.log('\n🧪 Testando com nossa API local...');
    const testData = {
      patients: [mappedPatient],
      templateId: "6878d983011d14f8e3ed6771",
      templateComponents: []
    };
    
    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-template`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Resposta da nossa API:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));
    
    // Verificar se o resultado indica sucesso ou falha
    if (response.data.success && response.data.data.results) {
      const result = response.data.data.results[0];
      if (result.success) {
        console.log('\n🎉 SUCESSO! Template enviado com sucesso!');
      } else {
        console.log('\n⚠️ Falha:', result.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

// Executar teste se este arquivo for executado diretamente
if (require.main === module) {
  testExactImplementation().catch(console.error);
}

module.exports = {
  testExactImplementation
};
