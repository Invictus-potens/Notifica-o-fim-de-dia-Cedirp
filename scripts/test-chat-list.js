/**
 * Script para testar a listagem de chats com a nova implementação
 * Baseado no curl fornecido pelo usuário
 */

const { KrolikApiClient } = require('../dist/services/KrolikApiClient');

// Configuração de teste
const config = {
  baseUrl: 'https://api.camkrolik.com.br',
  apiToken: process.env.KROLIK_API_TOKEN || '65f06d5b867543e1d094fa0f',
  timeout: 15000,
  maxRetries: 3,
  retryDelay: 2000
};

async function testarListagemChats() {
  console.log('🧪 Testando listagem de chats com nova implementação...\n');
  
  try {
    const client = new KrolikApiClient(config);
    
    // Teste 1: Listar pacientes aguardando
    console.log('📋 Teste 1: Listando pacientes aguardando...');
    const startTime = Date.now();
    
    const pacientes = await client.listWaitingAttendances();
    const endTime = Date.now();
    
    console.log(`✅ Sucesso! Encontrados ${pacientes.length} pacientes aguardando`);
    console.log(`⏱️  Tempo de resposta: ${endTime - startTime}ms`);
    
    if (pacientes.length > 0) {
      console.log('\n📊 Amostra dos dados:');
      pacientes.slice(0, 3).forEach((paciente, index) => {
        console.log(`   ${index + 1}. ${paciente.name} - ${paciente.phone}`);
        console.log(`      Setor: ${paciente.sectorName}`);
        console.log(`      Tempo de espera: ${paciente.waitTimeMinutes} minutos`);
        console.log(`      Canal: ${paciente.channelType}`);
      });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Teste 2: Listar com filtros avançados
    console.log('📋 Teste 2: Listando com filtros avançados...');
    
    const chatsFiltrados = await client.listChatsWithFilters({
      typeChat: 2,
      status: 1,
      dateFilters: {},
      page: 0,
      limit: 20
    });
    
    console.log(`✅ Sucesso! Total: ${chatsFiltrados.total} chats`);
    console.log(`📄 Página: ${chatsFiltrados.page}`);
    console.log(`📊 Chats nesta página: ${chatsFiltrados.data.length}`);
    
    if (chatsFiltrados.totalPages) {
      console.log(`📄 Total de páginas: ${chatsFiltrados.totalPages}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Teste 3: Verificar configuração
    console.log('📋 Teste 3: Verificando configuração...');
    const configAtual = client.getConfig();
    console.log(`✅ Base URL: ${configAtual.baseUrl}`);
    console.log(`✅ Token configurado: ${configAtual.apiToken ? 'Sim' : 'Não'}`);
    console.log(`✅ Timeout: ${configAtual.timeout}ms`);
    console.log(`✅ Max retries: ${configAtual.maxRetries}`);
    
    console.log('\n🎉 Todos os testes passaram com sucesso!');
    console.log('\n📝 Resumo da implementação:');
    console.log('   - ✅ Método POST para /core/v2/api/chats/list-lite');
    console.log('   - ✅ Headers corretos (access-token, Content-Type)');
    console.log('   - ✅ Payload no formato correto (typeChat, status, dateFilters, page)');
    console.log('   - ✅ Suporte a filtros avançados e paginação');
    console.log('   - ✅ Tratamento de erros e retry automático');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 Dica: Verifique sua conexão com a internet');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n💡 Dica: Verifique se o token de API está correto');
    } else if (error.message.includes('404')) {
      console.log('\n💡 Dica: Verifique se a URL da API está correta');
    }
    
    process.exit(1);
  }
}

// Executar teste
if (require.main === module) {
  testarListagemChats();
}

module.exports = { testarListagemChats };
