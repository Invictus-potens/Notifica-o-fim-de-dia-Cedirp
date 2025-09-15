/**
 * Teste para verificar a estrutura correta dos templateComponents
 * baseado na resposta da API de templates
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa o envio de template com estrutura correta baseada na API
 */
async function testTemplateWithCorrectStructure() {
  try {
    console.log('🧪 Testando envio de template com estrutura correta...');
    
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
    console.log(`   Setor: ${patientWithPhone.sectorName}`);
    
    // Template ID válido da API
    const templateId = "6878d983011d14f8e3ed6771"; // pesquisa_de_satisfacao
    
    // Estrutura correta baseada na API
    const templateComponents = [
      {
        type: "BODY",
        text: "Lamentamos que sua experiência não tenha sido ótima. 😟 Estamos encaminhando seu caso a um gestor para melhor entendimento e ação. Aguardamos a oportunidade de melhor servir você."
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

    console.log('\n📤 Dados sendo enviados:');
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

    // Verificar se o envio foi bem-sucedido
    if (response.data.success && response.data.data.results) {
      const result = response.data.data.results[0];
      if (result.success) {
        console.log('\n✅ Sucesso! Template enviado corretamente');
        console.log('   A estrutura está funcionando conforme a API');
      } else {
        console.log('\n⚠️ Falha por outro motivo:', result.message);
        console.log('   Mas não é mais erro de estrutura do payload');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar envio de template:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa com template que tem dynamicComponents
 */
async function testTemplateWithDynamicComponents() {
  try {
    console.log('\n🧪 Testando template com dynamicComponents...');
    
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
    
    // Template ID que tem dynamicComponents
    const templateId = "6878d983011d14f8e3ed6770"; // iniciar_atendimento
    
    // Estrutura com dynamicComponents baseada na API
    const templateComponents = [
      {
        type: "HEADER",
        text: "Krolik Tech",
        format: "TEXT"
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "QUICK_REPLY",
            text: "Vamos conversar agora!"
          },
          {
            type: "QUICK_REPLY", 
            text: "Espera um pouquinho!"
          }
        ]
      },
      {
        type: "BODY",
        text: "Olá! 👋\n\nAqui é Felipe da *KROLIK* e quero muitooo falar com você! 🙏"
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

    console.log('\n📤 Dados sendo enviados (com dynamicComponents):');
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
    console.error('❌ Erro ao testar template com dynamicComponents:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Mostra a estrutura correta dos templates baseada na API
 */
function showCorrectTemplateStructure() {
  console.log('\n📋 ESTRUTURA CORRETA DOS TEMPLATES:');
  console.log('   Baseado na resposta da API /core/v2/api/action-cards/templates');
  console.log('');
  console.log('   ✅ Templates têm:');
  console.log('   - id: string (ID único do template)');
  console.log('   - description: string (descrição do template)');
  console.log('   - canEdit: boolean (se pode ser editado)');
  console.log('   - staticComponents: array (componentes estáticos)');
  console.log('   - dynamicComponents: array (componentes dinâmicos)');
  console.log('');
  console.log('   📋 Tipos de componentes:');
  console.log('   - HEADER: { type: "HEADER", text: "string", format: "TEXT" }');
  console.log('   - BODY: { type: "BODY", text: "string" }');
  console.log('   - FOOTER: { type: "FOOTER", text: "string" }');
  console.log('   - BUTTONS: { type: "BUTTONS", buttons: [...] }');
  console.log('');
  console.log('   🔧 Para envio, usar templateComponents com a estrutura dos staticComponents');
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  showCorrectTemplateStructure();
  console.log('\n' + '='.repeat(50) + '\n');
  testTemplateWithCorrectStructure()
    .then(() => {
      console.log('\n' + '='.repeat(50) + '\n');
      return testTemplateWithDynamicComponents();
    })
    .catch(console.error);
}

module.exports = {
  testTemplateWithCorrectStructure,
  testTemplateWithDynamicComponents,
  showCorrectTemplateStructure
};
