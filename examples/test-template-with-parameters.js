/**
 * Teste específico para o template iniciar_atendimento que tem dynamicComponents
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa o template iniciar_atendimento com parâmetros corretos
 */
async function testTemplateWithParameters() {
  try {
    console.log('🧪 Testando template iniciar_atendimento com parâmetros...');
    
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
    
    // Template iniciar_atendimento (6878d983011d14f8e3ed6770)
    const templateId = "6878d983011d14f8e3ed6770";
    
    // Estrutura correta baseada no JSON fornecido
    const templateComponents = [
      {
        type: "HEADER",
        text: "Krolik Tech",
        format: "TEXT"
      },
      {
        type: "BODY",
        text: "Olá! 👋\n\nAqui é Felipe da *KROLIK* e quero muitooo falar com você! 🙏"
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
        console.log('\n🎉 SUCESSO! Template enviado com sucesso!');
        console.log('   O template com dynamicComponents está funcionando');
      } else {
        console.log('\n⚠️ Falha:', result.message);
        console.log('   Verifique os logs do servidor para mais detalhes');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar template com parâmetros:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa com templateComponents vazio para comparar
 */
async function testTemplateWithoutComponents() {
  try {
    console.log('\n🧪 Testando template sem templateComponents...');
    
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
    
    // Template iniciar_atendimento (6878d983011d14f8e3ed6770)
    const templateId = "6878d983011d14f8e3ed6770";
    
    const testData = {
      patients: [
        {
          number: patientWithPhone.phone,
          contactId: patientWithPhone.id
        }
      ],
      templateId: templateId,
      templateComponents: [] // Vazio para teste
    };

    console.log('\n📤 Dados sendo enviados (sem templateComponents):');
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
    console.error('❌ Erro ao testar template sem componentes:');
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
  testTemplateWithParameters()
    .then(() => testTemplateWithoutComponents())
    .catch(console.error);
}

module.exports = {
  testTemplateWithParameters,
  testTemplateWithoutComponents
};
