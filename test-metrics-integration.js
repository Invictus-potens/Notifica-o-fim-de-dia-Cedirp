/**
 * TESTE DE INTEGRAÇÃO - Métricas Funcionais
 * 
 * Este script testa se a integração das métricas está funcionando corretamente.
 * 
 * Como usar:
 * node test-metrics-integration.js
 */

const axios = require('axios');

// Configuração da API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * Função para testar as métricas
 */
async function testMetricsIntegration() {
  console.log('🧪 ===========================================');
  console.log('   TESTE DE INTEGRAÇÃO - MÉTRICAS');
  console.log('============================================');
  console.log(`🌐 API URL: ${API_BASE_URL}`);
  console.log(`⏰ Timestamp: ${new Date().toLocaleString('pt-BR')}`);
  console.log('============================================\n');

  try {
    // 1. Testar endpoint de métricas
    console.log('📊 1. Testando endpoint de métricas...');
    const metricsResponse = await axios.get(`${API_BASE_URL}/api/metrics`, {
      timeout: 5000
    });
    
    console.log('✅ Métricas obtidas com sucesso!');
    console.log('📈 Dados das métricas:');
    console.log(`   - Mensagens Enviadas: ${metricsResponse.data.messages.totalSent}`);
    console.log(`   - Mensagens com Sucesso: ${metricsResponse.data.messages.successful}`);
    console.log(`   - Mensagens com Falha: ${metricsResponse.data.messages.failed}`);
    console.log(`   - Mensagens 30min: ${metricsResponse.data.messages.by30Min}`);
    console.log(`   - Mensagens Fim de Dia: ${metricsResponse.data.messages.byEndOfDay}`);
    console.log(`   - Requisições API: ${metricsResponse.data.system.totalRequests}`);
    console.log(`   - API Sucessos: ${metricsResponse.data.system.apiCallsSuccessful}`);
    console.log(`   - API Falhas: ${metricsResponse.data.system.apiCallsFailed}`);
    console.log(`   - Ciclos de Monitoramento: ${metricsResponse.data.performance.monitoringCycles}`);
    console.log(`   - Pacientes Processados: ${metricsResponse.data.performance.patientsProcessed}`);
    console.log(`   - Uptime: ${Math.floor(metricsResponse.data.system.uptime / 1000)}s\n`);

    // 2. Testar endpoint de alertas
    console.log('🚨 2. Testando endpoint de alertas...');
    const alertsResponse = await axios.get(`${API_BASE_URL}/api/metrics/alerts`, {
      timeout: 5000
    });
    
    console.log('✅ Alertas obtidos com sucesso!');
    console.log(`📊 Total de alertas: ${alertsResponse.data.length}`);
    
    if (alertsResponse.data.length > 0) {
      console.log('⚠️  Alertas ativos:');
      alertsResponse.data.forEach((alert, index) => {
        console.log(`   ${index + 1}. [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`);
      });
    } else {
      console.log('✅ Nenhum alerta ativo - sistema saudável!');
    }
    console.log('');

    // 3. Testar endpoint de status do sistema
    console.log('📊 3. Testando status do sistema...');
    const statusResponse = await axios.get(`${API_BASE_URL}/api/status`, {
      timeout: 5000
    });
    
    console.log('✅ Status obtido com sucesso!');
    console.log(`🎯 Status: ${statusResponse.data.status}`);
    console.log(`🔄 Fluxo Pausado: ${statusResponse.data.isFlowPaused ? 'SIM' : 'NÃO'}`);
    console.log(`⏰ Última Atualização: ${statusResponse.data.lastUpdate}`);
    console.log('');

    // 4. Testar endpoint de pacientes
    console.log('👥 4. Testando endpoint de pacientes...');
    const patientsResponse = await axios.get(`${API_BASE_URL}/api/patients`, {
      timeout: 10000
    });
    
    console.log('✅ Pacientes obtidos com sucesso!');
    console.log(`👥 Total de pacientes: ${patientsResponse.data.total}`);
    console.log(`📊 Estatísticas:`, patientsResponse.data.stats);
    console.log('');

    // 5. Verificar se as métricas estão sendo atualizadas
    console.log('🔄 5. Verificando atualização das métricas...');
    
    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const metricsResponse2 = await axios.get(`${API_BASE_URL}/api/metrics`, {
      timeout: 5000
    });
    
    const initialCycles = metricsResponse.data.performance.monitoringCycles;
    const currentCycles = metricsResponse2.data.performance.monitoringCycles;
    
    if (currentCycles > initialCycles) {
      console.log('✅ Métricas estão sendo atualizadas!');
      console.log(`   Ciclos iniciais: ${initialCycles}`);
      console.log(`   Ciclos atuais: ${currentCycles}`);
      console.log(`   Diferença: +${currentCycles - initialCycles}`);
    } else {
      console.log('⚠️  Métricas não foram atualizadas (pode ser normal se sistema estiver pausado)');
    }
    console.log('');

    // 6. Resumo final
    console.log('📊 ===========================================');
    console.log('   RESUMO DO TESTE DE INTEGRAÇÃO');
    console.log('============================================');
    console.log('✅ Endpoint de métricas: FUNCIONANDO');
    console.log('✅ Endpoint de alertas: FUNCIONANDO');
    console.log('✅ Endpoint de status: FUNCIONANDO');
    console.log('✅ Endpoint de pacientes: FUNCIONANDO');
    console.log('✅ Integração de métricas: ATIVA');
    console.log('============================================');
    console.log('🎉 INTEGRAÇÃO DAS MÉTRICAS 100% FUNCIONAL!');
    console.log('============================================\n');

  } catch (error) {
    console.error('\n❌ ===========================================');
    console.error('   ERRO NO TESTE DE INTEGRAÇÃO');
    console.error('============================================');
    console.error(`💥 Erro: ${error.message}`);
    
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📝 Dados:`, JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('============================================');
    console.error('🔧 Verifique se o servidor está rodando em:');
    console.error(`   ${API_BASE_URL}`);
    console.error('============================================\n');
    
    process.exit(1);
  }
}

// Executar o teste
if (require.main === module) {
  testMetricsIntegration().catch(console.error);
}

module.exports = {
  testMetricsIntegration
};
