/**
 * Teste simples para verificar se o problema está na estrutura dos templateComponents
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa com templateComponents vazio (sem componentes)
 */
async function testTemplateWithEmptyComponents() {
  try {
    console.log('🧪 Testando template com templateComponents vazio...');
    
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
    
    // Template ID válido da API
    const templateId = "6878d983011d14f8e3ed6771"; // pesquisa_de_satisfacao
    
    // Testar com templateComponents vazio
    const testData = {
      patients: [
        {
          number: patientWithPhone.phone,
          contactId: patientWithPhone.id
        }
      ],
      templateId: templateId,
      templateComponents: [] // Vazio para testar
    };

    console.log('\n📤 Dados sendo enviados (templateComponents vazio):');
    console.log(`   number: "${testData.patients[0].number}"`);
    console.log(`   contactId: "${testData.patients[0].contactId}"`);
    console.log(`   templateId: "${testData.templateId}"`);
    console.log(`   templateComponents: ${JSON.stringify(testData.templateComponents)}`);

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-template`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Resposta recebida:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Erro ao testar template com componentes vazios:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa com estrutura mínima de templateComponents
 */
async function testTemplateWithMinimalComponents() {
  try {
    console.log('\n🧪 Testando template com estrutura mínima...');
    
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
    
    // Template ID válido da API
    const templateId = "6878d983011d14f8e3ed6771"; // pesquisa_de_satisfacao
    
    // Estrutura mínima baseada no curl fornecido
    const templateComponents = [
      {
        type: "string",
        sub_type: "string", 
        parameters: [
          {
            type: "string",
            text: "string"
          }
        ],
        index: 0
      }
    ];

    const testData = {
      patients: [
        {
          number: patientWithPhone.phone,
          contactId: patientWithPhone.id
        }
      ],
      templateId: templateId,
      templateComponents: templateComponents
    };

    console.log('\n📤 Dados sendo enviados (estrutura mínima do curl):');
    console.log(`   number: "${testData.patients[0].number}"`);
    console.log(`   contactId: "${testData.patients[0].contactId}"`);
    console.log(`   templateId: "${testData.templateId}"`);
    console.log(`   templateComponents: ${JSON.stringify(testData.templateComponents, null, 2)}`);

    const response = await axios.post(`${LOCAL_API_CONFIG.baseUrl}/api/messages/send-template`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Resposta recebida:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados:`, JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Erro ao testar template com estrutura mínima:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  testTemplateWithEmptyComponents()
    .then(() => {
      return testTemplateWithMinimalComponents();
    })
    .catch(console.error);
}

module.exports = {
  testTemplateWithEmptyComponents,
  testTemplateWithMinimalComponents
};
