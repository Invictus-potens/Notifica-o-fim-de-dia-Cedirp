/**
 * Exemplo de uso da API atualizada para listar chats aguardando
 * Baseado no curl fornecido pelo usuário
 */

const { KrolikApiClient } = require('../dist/services/KrolikApiClient');

// Configuração da API
const config = {
  baseUrl: 'https://api.camkrolik.com.br',
  apiToken: '65f06d5b867543e1d094fa0f', // Token do exemplo
  timeout: 10000,
  maxRetries: 3,
  retryDelay: 1000
};

async function exemploListarChatsAguardando() {
  try {
    console.log('🚀 Iniciando exemplo de listagem de chats aguardando...\n');
    
    const client = new KrolikApiClient(config);
    
    // 1. Listar pacientes aguardando (método simplificado)
    console.log('📋 1. Listando pacientes aguardando (método simplificado):');
    const pacientesAguardando = await client.listWaitingAttendances();
    console.log(`   Encontrados ${pacientesAguardando.length} pacientes aguardando`);
    
    if (pacientesAguardando.length > 0) {
      console.log('   Primeiro paciente:');
      console.log(`   - Nome: ${pacientesAguardando[0].name}`);
      console.log(`   - Telefone: ${pacientesAguardando[0].phone}`);
      console.log(`   - Setor: ${pacientesAguardando[0].sectorName}`);
      console.log(`   - Tempo de espera: ${pacientesAguardando[0].waitTime}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 2. Listar chats com filtros avançados
    console.log('📋 2. Listando chats com filtros avançados:');
    const chatsComFiltros = await client.listChatsWithFilters({
      typeChat: 2,
      status: 1,
      dateFilters: {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      },
      page: 0,
      limit: 50
    });
    
    console.log(`   Total de chats: ${chatsComFiltros.total}`);
    console.log(`   Página atual: ${chatsComFiltros.page}`);
    console.log(`   Chats nesta página: ${chatsComFiltros.data.length}`);
    
    if (chatsComFiltros.data.length > 0) {
      console.log('   Primeiros 3 chats:');
      chatsComFiltros.data.slice(0, 3).forEach((chat, index) => {
        console.log(`   ${index + 1}. ${chat.name} - ${chat.phone} (${chat.sectorName})`);
      });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 3. Exemplo de paginação
    console.log('📋 3. Exemplo de paginação:');
    const pagina2 = await client.listChatsWithFilters({
      typeChat: 2,
      status: 1,
      page: 1,
      limit: 10
    });
    
    console.log(`   Página 2: ${pagina2.data.length} chats`);
    console.log(`   Total geral: ${pagina2.total}`);
    
    console.log('\n✅ Exemplo concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no exemplo:', error.message);
    console.error('Detalhes:', error);
  }
}

// Executar exemplo se chamado diretamente
if (require.main === module) {
  exemploListarChatsAguardando();
}

module.exports = { exemploListarChatsAguardando };
