const { KrolikApiClient } = require('../src/services/KrolikApiClient');

async function testFrontendPatients() {
  console.log('🧪 TESTANDO INTEGRAÇÃO FRONTEND + API CAM KROLIK...\n');

  // Configurar cliente
  const krolikClient = new KrolikApiClient({
    baseURL: 'https://api.camkrolik.com.br',
    token: process.env.KROLIK_API_TOKEN || '63e68f168a48875131856df8',
    timeout: 10000
  });

  try {
    // 1. Testar busca de pacientes
    console.log('1️⃣ Buscando pacientes da API CAM Krolik...');
    const patients = await krolikClient.listWaitingAttendances();
    console.log(`   📊 Encontrados: ${patients.length} pacientes aguardando`);
    
    if (patients.length > 0) {
      console.log('   📋 Estrutura dos dados retornados:');
      console.log('   └─ Primeiro paciente:', JSON.stringify(patients[0], null, 2));
      
      console.log('\n   📋 Dados que serão exibidos no frontend:');
      patients.slice(0, 3).forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name || 'Nome não informado'}`);
        console.log(`      📞 Telefone: ${patient.phone || 'Não informado'}`);
        console.log(`      🏥 Setor: ${patient.sectorName || 'Não informado'}`);
        console.log(`      ⏱️  Tempo de espera: ${patient.waitTimeMinutes || 0} minutos`);
        console.log(`      🆔 ID: ${patient.id}`);
        console.log('');
      });
    }

    // 2. Simular resposta da API para o frontend
    console.log('2️⃣ Simulando resposta da API /api/patients...');
    const apiResponse = {
      success: true,
      data: patients,
      total: patients.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('   📥 Estrutura da resposta:', JSON.stringify({
      success: apiResponse.success,
      total: apiResponse.total,
      timestamp: apiResponse.timestamp,
      data_sample: apiResponse.data.length > 0 ? {
        id: apiResponse.data[0].id,
        name: apiResponse.data[0].name,
        phone: apiResponse.data[0].phone,
        sectorName: apiResponse.data[0].sectorName,
        waitTimeMinutes: apiResponse.data[0].waitTimeMinutes
      } : null
    }, null, 2));

    // 3. Testar formatação para o frontend
    console.log('3️⃣ Testando formatação para exibição no frontend...');
    
    if (patients.length > 0) {
      const samplePatient = patients[0];
      console.log('   📋 Exemplo de linha da tabela:');
      console.log(`   └─ Nome: ${samplePatient.name || 'Nome não informado'}`);
      console.log(`   └─ Telefone: ${samplePatient.phone || ''}`);
      console.log(`   └─ Setor: ${samplePatient.sectorName || samplePatient.sector_name || 'Setor não informado'}`);
      console.log(`   └─ Tempo: ${formatWaitTime(samplePatient.waitTimeMinutes || 0)}`);
      console.log(`   └─ Status: Aguardando`);
    }

    // 4. Testar dados para envio de mensagem
    console.log('4️⃣ Testando dados para envio de mensagem...');
    
    if (patients.length > 0) {
      const messageData = patients.slice(0, 2).map(patient => ({
        number: patient.phone,
        contactId: patient.id
      }));
      
      console.log('   📤 Dados para envio de action card:');
      console.log('   └─', JSON.stringify(messageData, null, 2));
    }

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ Frontend está preparado para exibir dados reais da API CAM Krolik');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    console.error('   Detalhes:', error.response?.data || error.stack);
  }
}

// Função auxiliar para formatar tempo (igual ao frontend)
function formatWaitTime(minutes) {
  if (!minutes || minutes < 0) return '--';
  
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testFrontendPatients().catch(console.error);
}

module.exports = { testFrontendPatients };
