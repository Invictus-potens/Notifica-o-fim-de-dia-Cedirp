/**
 * Exemplo de análise dos dados salvos no banco de dados
 * 
 * Este exemplo mostra quais informações estão sendo salvas
 * no banco de dados Supabase.
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Analisa os dados salvos no banco de dados
 */
async function analyzeDatabaseData() {
  try {
    console.log('🧪 ===========================================');
    console.log('   ANÁLISE DOS DADOS NO BANCO DE DADOS');
    console.log('===========================================\n');

    // 1. Verificar configurações do sistema
    console.log('📋 1. CONFIGURAÇÕES DO SISTEMA:');
    console.log('   Estas são as configurações salvas na tabela system_config:');
    console.log('   - flowPaused: boolean (se o fluxo está pausado)');
    console.log('   - excludedSectors: string[] (setores excluídos)');
    console.log('   - excludedChannels: string[] (canais excluídos)');
    console.log('   - selectedActionCard: string (cartão de ação selecionado)');
    console.log('   - selectedTemplate: string (template selecionado)');
    console.log('   - endOfDayTime: string (horário de fim de dia)');
    
    const configResponse = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/config`);
    console.log('\n   📊 Configuração atual:');
    console.log(`   - Fluxo pausado: ${configResponse.data.flowPaused}`);
    console.log(`   - Setores excluídos: ${configResponse.data.excludedSectors.length} setores`);
    console.log(`   - Canais excluídos: ${configResponse.data.excludedChannels.length} canais`);
    console.log(`   - Cartão de ação: ${configResponse.data.selectedActionCard || 'Nenhum'}`);
    console.log(`   - Template: ${configResponse.data.selectedTemplate || 'Nenhum'}`);
    console.log(`   - Horário fim de dia: ${configResponse.data.endOfDayTime}`);

    // 2. Verificar dados de exclusão
    console.log('\n📋 2. DADOS DE EXCLUSÃO:');
    console.log('   Estes são os dados salvos na tabela exclusion_entries:');
    console.log('   - attendance_id: string (ID do atendimento)');
    console.log('   - message_type: string (tipo de mensagem: "30min" ou "end_of_day")');
    console.log('   - sent_at: timestamp (quando foi enviada)');
    console.log('   - expires_at: timestamp (quando expira)');
    console.log('   - created_at: timestamp (quando foi criada)');
    
    // Nota: Não há endpoint específico para exclusion_entries, mas podemos inferir
    console.log('\n   📊 Status: Os dados de exclusão são salvos automaticamente');
    console.log('   quando mensagens são enviadas para evitar duplicatas.');

    // 3. Verificar estrutura das tabelas
    console.log('\n📋 3. ESTRUTURA DAS TABELAS:');
    
    console.log('\n   🗃️ Tabela: system_config');
    console.log('   Campos:');
    console.log('   - id: UUID (chave primária)');
    console.log('   - key: TEXT (chave da configuração)');
    console.log('   - value: TEXT (valor da configuração)');
    console.log('   - updated_at: TIMESTAMPTZ (última atualização)');
    console.log('   - created_at: TIMESTAMPTZ (criação)');
    
    console.log('\n   🗃️ Tabela: exclusion_entries');
    console.log('   Campos:');
    console.log('   - id: UUID (chave primária)');
    console.log('   - attendance_id: TEXT (ID do atendimento)');
    console.log('   - message_type: TEXT (tipo: "30min" ou "end_of_day")');
    console.log('   - sent_at: TIMESTAMPTZ (quando foi enviada)');
    console.log('   - expires_at: TIMESTAMPTZ (quando expira)');
    console.log('   - created_at: TIMESTAMPTZ (criação)');

    // 4. Verificar dados em tempo real
    console.log('\n📋 4. DADOS EM TEMPO REAL:');
    
    const patientsResponse = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/patients`);
    const patients = patientsResponse.data.patients;
    
    console.log(`   📊 Pacientes aguardando: ${patients.length}`);
    console.log('   Estes dados NÃO são salvos no banco, são obtidos da API CAM Krolik:');
    
    if (patients.length > 0) {
      patients.slice(0, 3).forEach((patient, index) => {
        console.log(`\n   👤 Paciente ${index + 1}:`);
        console.log(`   - ID: ${patient.id}`);
        console.log(`   - Nome: ${patient.name}`);
        console.log(`   - Telefone: ${patient.phone}`);
        console.log(`   - Setor: ${patient.sectorName}`);
        console.log(`   - Tempo de espera: ${patient.waitTimeMinutes} minutos`);
      });
    }

    // 5. Resumo dos dados salvos
    console.log('\n📋 5. RESUMO DOS DADOS SALVOS:');
    console.log('   ✅ Configurações do sistema (system_config)');
    console.log('   ✅ Histórico de exclusões (exclusion_entries)');
    console.log('   ❌ Dados de pacientes (obtidos da API, não salvos)');
    console.log('   ❌ Dados de setores (dados estáticos, não salvos)');
    console.log('   ❌ Dados de canais (obtidos da API, não salvos)');
    console.log('   ❌ Dados de cartões/templates (obtidos da API, não salvos)');

    console.log('\n🎉 Análise concluída!');

  } catch (error) {
    console.error('❌ Erro ao analisar dados do banco:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Mostra exemplos de dados que seriam salvos
 */
function showDataExamples() {
  console.log('\n📋 EXEMPLOS DE DADOS QUE SERIAM SALVOS:');
  
  console.log('\n🗃️ Exemplo de entrada em exclusion_entries:');
  console.log(JSON.stringify({
    attendance_id: "68c8490b633da7451787ba9d",
    message_type: "30min",
    sent_at: "2025-09-15T18:00:00.000Z",
    expires_at: "2025-09-15T19:00:00.000Z"
  }, null, 2));
  
  console.log('\n🗃️ Exemplo de entrada em system_config:');
  console.log(JSON.stringify({
    key: "excludedSectors",
    value: '["6401f4f49b1ff8512b525e9c", "6400efb5343817d4ddbb2a4c"]'
  }, null, 2));
}

// Executar análise se este arquivo for executado diretamente
if (require.main === module) {
  analyzeDatabaseData()
    .then(() => showDataExamples())
    .catch(console.error);
}

module.exports = {
  analyzeDatabaseData,
  showDataExamples
};
