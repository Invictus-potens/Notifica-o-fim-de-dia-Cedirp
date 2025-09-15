/**
 * Exemplo de teste para verificar se o envio de templates está funcionando
 * com o payload correto baseado no curl fornecido
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa o envio de template com payload correto
 */
async function testTemplateSending() {
  try {
    console.log('🧪 Testando envio de template com payload correto...');
    
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
    
    const testData = {
      patients: [
        {
          number: patientWithPhone.phone,
          contactId: patientWithPhone.id
        }
      ],
      templateId: "6878d983011d14f8e3ed6774", // ID do template do exemplo
      templateComponents: [
        {
          type: "body",
          sub_type: "text",
          parameters: [
            {
              type: "text",
              text: "Olá! Esta é uma mensagem de teste."
            }
          ],
          index: 0
        }
      ]
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
        console.log('   O payload está funcionando conforme o curl fornecido');
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
 * Mostra o payload correto que deveria ser enviado
 */
function showCorrectTemplatePayload() {
  console.log('\n📋 PAYLOAD CORRETO PARA ENVIO DE TEMPLATE:');
  console.log('   Baseado no curl fornecido:');
  console.log('');
  console.log('   curl -X POST \\');
  console.log('     "https://api.camkrolik.com.br/core/v2/api/chats/send-template" \\');
  console.log('     -H "accept: application/json" \\');
  console.log('     -H "access-token: 63e68f168a48875131856df8" \\');
  console.log('     -H "Content-Type: application/json-patch+json" \\');
  console.log('     -d "{');
  console.log('       \\"number\\": \\"string\\",');
  console.log('       \\"contactId\\": \\"string\\",');
  console.log('       \\"templateId\\": \\"string\\",');
  console.log('       \\"templateComponents\\": [...],');
  console.log('       \\"forceSend\\": true,');
  console.log('       \\"verifyContact\\": true');
  console.log('     }"');
  console.log('');
  console.log('   ✅ Campos obrigatórios:');
  console.log('   - number: string (número de telefone)');
  console.log('   - contactId: string (ID do contato/chat)');
  console.log('   - templateId: string (ID do template)');
  console.log('   - templateComponents: array (componentes do template)');
  console.log('   - forceSend: boolean (forçar envio)');
  console.log('   - verifyContact: boolean (verificar contato)');
}

/**
 * Testa a busca de template por ID
 */
async function testTemplateById() {
  try {
    console.log('\n🧪 Testando busca de template por ID...');
    
    const templateId = "6878d983011d14f8e3ed6774";
    console.log(`📋 Buscando template: ${templateId}`);
    
    // Simular a busca de template (já que não temos endpoint específico)
    const templatesResponse = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/templates`);
    const templates = templatesResponse.data.templates;
    
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      console.log('✅ Template encontrado:');
      console.log(`   ID: ${template.id}`);
      console.log(`   Descrição: ${template.description}`);
      console.log(`   Pode editar: ${template.canEdit}`);
    } else {
      console.log('❌ Template não encontrado na lista');
      console.log('   Verificando se o ID está correto...');
    }

  } catch (error) {
    console.error('❌ Erro ao testar busca de template:');
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
  showCorrectTemplatePayload();
  console.log('\n' + '='.repeat(50) + '\n');
  testTemplateById()
    .then(() => {
      console.log('\n' + '='.repeat(50) + '\n');
      return testTemplateSending();
    })
    .catch(console.error);
}

module.exports = {
  testTemplateSending,
  showCorrectTemplatePayload,
  testTemplateById
};
