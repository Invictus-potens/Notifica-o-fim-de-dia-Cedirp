/**
 * Teste para verificar se há problemas na navegação do frontend
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa se todas as rotas estão funcionando
 */
async function testAllRoutes() {
  try {
    console.log('🧪 Testando todas as rotas da API...');
    
    const routes = [
      { name: 'Dashboard', endpoint: '/api/status' },
      { name: 'Atendimentos', endpoint: '/api/patients' },
      { name: 'Action Cards', endpoint: '/api/action-cards' },
      { name: 'Setores', endpoint: '/api/sectors' },
      { name: 'Canais', endpoint: '/api/channels' },
      { name: 'Configurações', endpoint: '/api/config' },
      { name: 'Métricas', endpoint: '/api/metrics' },
      { name: 'Logs', endpoint: '/api/logs' }
    ];
    
    const results = [];
    
    for (const route of routes) {
      try {
        console.log(`\n📋 Testando ${route.name}...`);
        const response = await axios.get(`${LOCAL_API_CONFIG.baseUrl}${route.endpoint}`);
        
        results.push({
          name: route.name,
          endpoint: route.endpoint,
          status: response.status,
          success: true,
          data: response.data
        });
        
        console.log(`✅ ${route.name}: Status ${response.status}`);
        
      } catch (error) {
        results.push({
          name: route.name,
          endpoint: route.endpoint,
          status: error.response?.status || 'N/A',
          success: false,
          error: error.message
        });
        
        console.log(`❌ ${route.name}: ${error.message}`);
      }
    }
    
    console.log('\n📊 Resumo dos testes:');
    console.log('=====================================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Sucessos: ${successful.length}`);
    console.log(`❌ Falhas: ${failed.length}`);
    
    if (failed.length > 0) {
      console.log('\n❌ Rotas com problemas:');
      failed.forEach(route => {
        console.log(`   - ${route.name}: ${route.error}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
    return [];
  }
}

/**
 * Testa se a página HTML está sendo servida corretamente
 */
async function testHtmlPage() {
  try {
    console.log('\n🧪 Testando página HTML...');
    
    const response = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/`);
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Content-Type: ${response.headers['content-type']}`);
    
    if (response.data.includes('AutomationInterface')) {
      console.log('✅ JavaScript da interface encontrado');
    } else {
      console.log('❌ JavaScript da interface não encontrado');
    }
    
    if (response.data.includes('data-route')) {
      console.log('✅ Links de navegação encontrados');
    } else {
      console.log('❌ Links de navegação não encontrados');
    }
    
    if (response.data.includes('route-content')) {
      console.log('✅ Conteúdo das rotas encontrado');
    } else {
      console.log('❌ Conteúdo das rotas não encontrado');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao testar página HTML:', error.message);
    return false;
  }
}

/**
 * Testa se há problemas específicos com action cards
 */
async function testActionCardsSpecific() {
  try {
    console.log('\n🧪 Testando Action Cards especificamente...');
    
    const response = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/action-cards`);
    
    if (response.data.success && response.data.data) {
      console.log(`✅ ${response.data.data.length} Action Cards carregados`);
      
      // Verificar se há action cards válidos
      const validCards = response.data.data.filter(card => 
        card.id && (card.description || card.name || card.title)
      );
      
      console.log(`✅ ${validCards.length} Action Cards válidos`);
      
      if (validCards.length === 0) {
        console.log('⚠️ Nenhum Action Card válido encontrado');
      }
      
    } else {
      console.log('❌ Resposta inválida da API de Action Cards');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao testar Action Cards:', error.message);
    return false;
  }
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  testHtmlPage()
    .then(() => testActionCardsSpecific())
    .then(() => testAllRoutes())
    .catch(console.error);
}

module.exports = {
  testAllRoutes,
  testHtmlPage,
  testActionCardsSpecific
};
