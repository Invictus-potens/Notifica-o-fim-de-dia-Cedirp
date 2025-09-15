/**
 * Exemplo de uso da funcionalidade de listagem de canais
 * 
 * Este exemplo demonstra como usar a nova funcionalidade para listar canais
 * da API CAM Krolik baseada no curl fornecido.
 */

const axios = require('axios');

// Configuração da API
const API_CONFIG = {
  baseUrl: 'https://api.camkrolik.com.br',
  apiToken: '63e68f168a48875131856df8'
};

/**
 * Lista canais usando a API CAM Krolik
 * Baseado no curl: curl -X 'GET' 'https://api.camkrolik.com.br/core/v2/api/channel/list'
 */
async function listChannels() {
  try {
    console.log('📋 Buscando canais da API CAM Krolik...');
    console.log(`🔗 URL: ${API_CONFIG.baseUrl}/core/v2/api/channel/list`);
    console.log(`🔑 Token: ${API_CONFIG.apiToken}\n`);

    const response = await axios.get(`${API_CONFIG.baseUrl}/core/v2/api/channel/list`, {
      headers: {
        'accept': 'application/json',
        'access-token': API_CONFIG.apiToken
      },
      timeout: 10000
    });

    console.log('✅ Resposta recebida com sucesso!');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Estrutura da resposta:`, JSON.stringify(response.data, null, 2));
    console.log(`📋 Total de canais: ${response.data.channels?.length || 0}\n`);

    if (response.data.channels && response.data.channels.length > 0) {
      console.log('📋 ===========================================');
      console.log('   LISTA DE CANAIS ENCONTRADOS');
      console.log('===========================================');
      
      response.data.channels.forEach((channel, index) => {
        console.log(`\n${index + 1}. Canal:`);
        console.log(`   📝 ID: ${channel.id}`);
        console.log(`   📋 Descrição: ${channel.description || 'N/A'}`);
        console.log(`   🏷️  Identificador: ${channel.identifier || 'N/A'}`);
        console.log(`   🔢 Tipo: ${channel.type || 'N/A'}`);
        console.log(`   ✅ Ativo: ${channel.active !== false ? 'Sim' : 'Não'}`);
        if (channel.organizationId) {
          console.log(`   🏢 Organização: ${channel.organizationId}`);
        }
      });

      console.log('\n📋 ===========================================');
      console.log('   RESUMO');
      console.log('===========================================');
      console.log(`📊 Total de canais: ${response.data.channels.length}`);
      
      const activeChannels = response.data.channels.filter(c => c.active !== false).length;
      const inactiveChannels = response.data.channels.length - activeChannels;
      
      console.log(`✅ Canais ativos: ${activeChannels}`);
      console.log(`❌ Canais inativos: ${inactiveChannels}`);
      
      // Agrupar por tipo
      const channelsByType = response.data.channels.reduce((acc, channel) => {
        const type = channel.type || 'Não especificado';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Canais por tipo:');
      Object.entries(channelsByType).forEach(([type, count]) => {
        console.log(`   🔢 Tipo ${type}: ${count} canais`);
      });

    } else {
      console.log('⚠️  Nenhum canal encontrado na resposta');
    }

    return response.data;

  } catch (error) {
    console.error('\n❌ ===========================================');
    console.error('   ERRO AO BUSCAR CANAIS');
    console.error('===========================================');
    
    if (error.response) {
      console.error(`📊 Status HTTP: ${error.response.status}`);
      console.error(`📝 Mensagem: ${error.response.data?.message || error.response.statusText}`);
      console.error(`🔗 URL: ${error.config?.url}`);
    } else if (error.request) {
      console.error('🌐 Erro de rede - nenhuma resposta recebida');
      console.error(`🔗 URL: ${error.config?.url}`);
    } else {
      console.error(`💥 Erro: ${error.message}`);
    }
    
    throw error;
  }
}

/**
 * Testa a conectividade com a API
 */
async function testApiConnection() {
  try {
    console.log('🔍 Testando conectividade com a API...');
    
    const response = await axios.get(`${API_CONFIG.baseUrl}/core/v2/api/health`, {
      headers: {
        'accept': 'application/json',
        'access-token': API_CONFIG.apiToken
      },
      timeout: 5000
    });

    console.log('✅ API conectada com sucesso!');
    console.log(`📊 Status: ${response.status}`);
    return true;

  } catch (error) {
    console.error('❌ Falha na conectividade com a API');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
    }
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 ===========================================');
  console.log('   EXEMPLO DE LISTAGEM DE CANAIS');
  console.log('   API CAM Krolik');
  console.log('===========================================\n');

  try {
    // Testar conectividade primeiro
    const isConnected = await testApiConnection();
    if (!isConnected) {
      console.log('\n⚠️  Continuando mesmo com falha de conectividade...\n');
    }

    // Listar canais
    const channelsData = await listChannels();
    
    console.log('\n✅ ===========================================');
    console.log('   EXEMPLO CONCLUÍDO COM SUCESSO!');
    console.log('===========================================');
    console.log(`📋 Total de canais processados: ${channelsData.channels?.length || 0}`);

  } catch (error) {
    console.error('\n💥 ===========================================');
    console.error('   EXEMPLO FALHOU');
    console.error('===========================================');
    console.error(`❌ Erro: ${error.message}`);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  listChannels,
  testApiConnection,
  API_CONFIG
};
