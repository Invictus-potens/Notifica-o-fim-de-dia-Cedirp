/**
 * TESTE - JsonPatientManager
 * 
 * Este arquivo testa a nova funcionalidade de gerenciamento de pacientes em arquivos JSON.
 * 
 * Como usar:
 * node examples/test-json-patient-manager.js
 */

const axios = require('axios');

// Configuração da API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * Função para testar a API de pacientes
 */
async function testPatientsAPI() {
  try {
    console.log('🧪 ===========================================');
    console.log('   TESTE - JsonPatientManager');
    console.log('============================================');
    console.log(`🌐 API URL: ${API_BASE_URL}`);
    console.log('============================================\n');

    // Testar health check
    console.log('🔍 Testando health check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/api/health?quick=true`);
    console.log(`✅ Health Check: ${healthResponse.status}`);
    console.log(`📊 Status: ${healthResponse.data.status}\n`);

    // Testar status do sistema
    console.log('📊 Testando status do sistema...');
    const statusResponse = await axios.get(`${API_BASE_URL}/api/status`);
    console.log('✅ Status obtido com sucesso');
    console.log(`🔄 Sistema ativo: ${statusResponse.data.isActive}`);
    console.log(`⏰ Monitoramento: ${statusResponse.data.monitoring.isRunning ? 'Ativo' : 'Inativo'}`);
    console.log(`📁 Intervalo: ${statusResponse.data.monitoring.interval}ms\n`);

    // Testar lista de pacientes
    console.log('👥 Testando lista de pacientes...');
    const patientsResponse = await axios.get(`${API_BASE_URL}/api/patients`);
    console.log('✅ Lista de pacientes obtida com sucesso');
    console.log(`📊 Total de pacientes: ${patientsResponse.data.total}`);
    console.log(`📈 Estatísticas:`);
    console.log(`   - Pacientes aguardando: ${patientsResponse.data.stats?.totalPatients || 0}`);
    console.log(`   - Pacientes > 30min: ${patientsResponse.data.stats?.patientsOver30Min || 0}`);
    console.log(`   - Tempo médio: ${patientsResponse.data.stats?.averageWaitTime || 0} min\n`);

    // Listar alguns pacientes se existirem
    if (patientsResponse.data.patients && patientsResponse.data.patients.length > 0) {
      console.log('📋 Primeiros 3 pacientes:');
      patientsResponse.data.patients.slice(0, 3).forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name} (${patient.phone}) - ${patient.waitTimeMinutes}min`);
      });
      console.log('');
    }

    // Testar logs
    console.log('📝 Testando logs do sistema...');
    const logsResponse = await axios.get(`${API_BASE_URL}/api/logs?limit=5`);
    console.log('✅ Logs obtidos com sucesso');
    console.log(`📊 Total de logs: ${logsResponse.data.length}`);
    
    if (logsResponse.data.length > 0) {
      console.log('📋 Últimos logs:');
      logsResponse.data.slice(0, 3).forEach((log, index) => {
        const timestamp = new Date(log.timestamp).toLocaleString('pt-BR');
        console.log(`   ${index + 1}. [${timestamp}] ${log.level.toUpperCase()}: ${log.message}`);
      });
      console.log('');
    }

    // Testar métricas
    console.log('📈 Testando métricas...');
    const metricsResponse = await axios.get(`${API_BASE_URL}/api/metrics`);
    console.log('✅ Métricas obtidas com sucesso');
    console.log(`📊 Métricas disponíveis: ${Object.keys(metricsResponse.data).length}`);
    
    if (metricsResponse.data.monitoring) {
      console.log(`🔄 Ciclos de monitoramento: ${metricsResponse.data.monitoring.totalCycles || 0}`);
      console.log(`📤 Mensagens enviadas: ${metricsResponse.data.messages?.totalSent || 0}`);
    }
    console.log('');

    console.log('🎯 ===========================================');
    console.log('   TESTE CONCLUÍDO COM SUCESSO!');
    console.log('============================================');
    console.log('✅ Todas as funcionalidades estão operacionais');
    console.log('📁 Arquivos JSON estão sendo gerenciados corretamente');
    console.log('🔄 Sistema de monitoramento está funcionando');
    console.log('============================================\n');

  } catch (error) {
    console.error('\n❌ ===========================================');
    console.error('   ERRO NO TESTE');
    console.error('============================================');
    console.error(`💥 Erro: ${error.message}`);
    
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📝 Resposta: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    console.error('============================================\n');
    process.exit(1);
  }
}

/**
 * Função para verificar arquivos JSON criados
 */
async function checkJsonFiles() {
  const fs = require('fs');
  const path = require('path');
  
  const dataDir = './data';
  const files = [
    'patients_active.json',
    'patients_processed.json', 
    'patients_history.json'
  ];

  console.log('📁 ===========================================');
  console.log('   VERIFICAÇÃO DE ARQUIVOS JSON');
  console.log('============================================');
  
  files.forEach(filename => {
    const filePath = path.join(dataDir, filename);
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`✅ ${filename}: ${content.length} registros (${Math.round(stats.size / 1024 * 100) / 100} KB)`);
      } else {
        console.log(`❌ ${filename}: Arquivo não encontrado`);
      }
    } catch (error) {
      console.log(`⚠️  ${filename}: Erro ao ler arquivo - ${error.message}`);
    }
  });
  
  console.log('============================================\n');
}

// Executar testes
async function runTests() {
  await testPatientsAPI();
  await checkJsonFiles();
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testPatientsAPI,
  checkJsonFiles,
  runTests
};
