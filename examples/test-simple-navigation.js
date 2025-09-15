/**
 * Teste simples para verificar se há problemas na navegação
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa se a página principal está funcionando
 */
async function testMainPage() {
  try {
    console.log('🧪 Testando página principal...');
    
    const response = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/`);
    
    console.log(`📊 Status: ${response.status}`);
    
    // Verificar se há elementos essenciais
    const hasAutomationInterface = response.data.includes('AutomationInterface');
    const hasDataRoute = response.data.includes('data-route');
    const hasRouteContent = response.data.includes('route-content');
    
    console.log(`✅ AutomationInterface: ${hasAutomationInterface ? 'Encontrado' : 'NÃO ENCONTRADO'}`);
    console.log(`✅ data-route: ${hasDataRoute ? 'Encontrado' : 'NÃO ENCONTRADO'}`);
    console.log(`✅ route-content: ${hasRouteContent ? 'Encontrado' : 'NÃO ENCONTRADO'}`);
    
    if (!hasAutomationInterface || !hasDataRoute || !hasRouteContent) {
      console.log('❌ Elementos essenciais não encontrados na página');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao testar página principal:', error.message);
    return false;
  }
}

/**
 * Testa se as APIs estão funcionando
 */
async function testApis() {
  try {
    console.log('\n🧪 Testando APIs essenciais...');
    
    const apis = [
      '/api/status',
      '/api/action-cards',
      '/api/config'
    ];
    
    for (const api of apis) {
      try {
        const response = await axios.get(`${LOCAL_API_CONFIG.baseUrl}${api}`);
        console.log(`✅ ${api}: Status ${response.status}`);
      } catch (error) {
        console.log(`❌ ${api}: ${error.message}`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao testar APIs:', error.message);
    return false;
  }
}

// Executar testes
if (require.main === module) {
  testMainPage()
    .then(() => testApis())
    .catch(console.error);
}

module.exports = {
  testMainPage,
  testApis
};
