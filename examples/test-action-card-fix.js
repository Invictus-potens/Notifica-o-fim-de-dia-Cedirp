/**
 * Exemplo de teste para verificar se o envio de cartão de ação está funcionando
 * com o payload correto (sem contactId)
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa o envio de cartão de ação com payload corrigido
 */
async function testActionCardSending() {
  try {
    console.log('🧪 Testando envio de cartão de ação com payload corrigido...');
    
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
      action_card_id: "6329cf2f212a3a6c2a931aa9" // ID do cartão de ação do exemplo
    };

    console.log('\n📤 Dados sendo enviados:');
    console.log(`   number: "${testData.patients[0].number}"`);
    console.log(`   contactId: "${testData.patients[0].contactId}" (será ignorado)`);
    console.log(`   action_card_id: "${testData.action_card_id}"`);

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
        console.log('   Isso indica que ainda há problema com o formato do número');
      } else if (result.success) {
        console.log('\n✅ Sucesso! Cartão de ação enviado corretamente');
        console.log('   O payload corrigido (sem contactId) está funcionando');
      } else {
        console.log('\n⚠️ Falha por outro motivo:', result.message);
        console.log('   Mas não é mais erro de número inválido');
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar envio de cartão de ação:');
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
function showCorrectPayload() {
  console.log('\n📋 PAYLOAD CORRETO PARA ENVIO DE CARTÃO DE AÇÃO:');
  console.log('   Baseado no curl fornecido:');
  console.log('');
  console.log('   curl -X POST \\');
  console.log('     "https://api.camkrolik.com.br/core/v2/api/chats/send-action-card" \\');
  console.log('     -H "accept: application/json" \\');
  console.log('     -H "access-token: 63e68f168a48875131856df8" \\');
  console.log('     -H "Content-Type: application/json-patch+json" \\');
  console.log('     -d "{');
  console.log('       \\"number\\": \\"5519995068303\\",');
  console.log('       \\"action_card_id\\": \\"6329cf2f212a3a6c2a931aa9\\"');
  console.log('     }"');
  console.log('');
  console.log('   ✅ Campos obrigatórios:');
  console.log('   - number: string (número de telefone)');
  console.log('   - action_card_id: string (ID do cartão de ação)');
  console.log('');
  console.log('   ❌ Campos removidos:');
  console.log('   - contactId: não é necessário');
  console.log('   - forceSend: não é necessário');
  console.log('   - verifyContact: não é necessário');
}

// Executar teste se este arquivo for executado diretamente
if (require.main === module) {
  showCorrectPayload();
  console.log('\n' + '='.repeat(50) + '\n');
  testActionCardSending().catch(console.error);
}

module.exports = {
  testActionCardSending,
  showCorrectPayload
};
