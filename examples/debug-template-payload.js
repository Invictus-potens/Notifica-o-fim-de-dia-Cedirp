/**
 * Debug específico para verificar o payload sendo enviado para a API externa
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa e mostra exatamente o que está sendo enviado
 */
async function debugTemplatePayload() {
  try {
    console.log('🔍 Debug: Verificando payload de template...');
    
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
    console.log(`   Setor: ${patientWithPhone.sectorName}`);
    
    // Verificar se o problema está no mapeamento
    console.log('\n🔍 Verificando mapeamento de dados:');
    console.log(`   patientWithPhone.phone = "${patientWithPhone.phone}"`);
    console.log(`   patientWithPhone.id = "${patientWithPhone.id}"`);
    
    // Simular o mapeamento do frontend
    const mappedPatient = {
      number: patientWithPhone.phone, // Número de telefone do paciente
      contactId: patientWithPhone.id   // ID do chat/atendimento
    };
    
    console.log('\n📤 Dados mapeados (como no frontend):');
    console.log(`   number: "${mappedPatient.number}"`);
    console.log(`   contactId: "${mappedPatient.contactId}"`);
    
    // Verificar se o problema está na formatação do número
    console.log('\n🔍 Verificando formatação do número:');
    let phoneNumber = mappedPatient.number;
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
    
    // Payload final que seria enviado
    const finalPayload = {
      number: phoneNumber,
      contactId: mappedPatient.contactId,
      templateId: "6878d983011d14f8e3ed6771",
      templateComponents: [],
      forceSend: true,
      verifyContact: true
    };
    
    console.log('\n📤 Payload final que seria enviado para a API:');
    console.log(JSON.stringify(finalPayload, null, 2));
    
    // Verificar se há algum problema óbvio
    console.log('\n🔍 Verificações de validação:');
    console.log(`   number é string? ${typeof finalPayload.number === 'string'}`);
    console.log(`   number tem conteúdo? ${finalPayload.number.length > 0}`);
    console.log(`   contactId é string? ${typeof finalPayload.contactId === 'string'}`);
    console.log(`   contactId tem conteúdo? ${finalPayload.contactId.length > 0}`);
    console.log(`   templateId é string? ${typeof finalPayload.templateId === 'string'}`);
    console.log(`   templateId tem conteúdo? ${finalPayload.templateId.length > 0}`);
    
    // Verificar se o número parece ser um ID em vez de telefone
    if (finalPayload.number.match(/^[a-f0-9]{24}$/)) {
      console.log('❌ PROBLEMA ENCONTRADO: O campo number contém um ID MongoDB em vez de número de telefone!');
      console.log('   Isso explica o erro "INVALID_WA_NUMBER"');
    } else if (finalPayload.number.match(/^\d+$/)) {
      console.log('✅ O campo number contém apenas dígitos (número de telefone válido)');
    } else {
      console.log('⚠️ O campo number contém caracteres não numéricos');
    }
    
    if (finalPayload.contactId.match(/^[a-f0-9]{24}$/)) {
      console.log('✅ O campo contactId contém um ID MongoDB válido');
    } else {
      console.log('⚠️ O campo contactId não parece ser um ID MongoDB válido');
    }

  } catch (error) {
    console.error('❌ Erro no debug:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

// Executar debug se este arquivo for executado diretamente
if (require.main === module) {
  debugTemplatePayload().catch(console.error);
}

module.exports = {
  debugTemplatePayload
};
