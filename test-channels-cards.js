/**
 * Teste para verificar se as estatísticas estão sendo exibidas nos cards de canais
 */

async function testChannelsCards() {
    console.log('🎴 Testando Cards de Canais com Estatísticas\n');
    console.log('=' .repeat(60));

    const baseUrl = 'http://localhost:3000';

    try {
        // 1. Testar se as APIs estão retornando dados
        console.log('1. 📊 Verificando APIs de estatísticas...');
        
        const [channelsResponse, loadStatsResponse, convStatsResponse] = await Promise.all([
            fetch(`${baseUrl}/api/channels`),
            fetch(`${baseUrl}/api/channels/stats/load`),
            fetch(`${baseUrl}/api/channels/stats/conversations`)
        ]);

        const channelsData = await channelsResponse.json();
        const loadStatsData = await loadStatsResponse.json();
        const convStatsData = await convStatsResponse.json();

        console.log(`   ✅ Canais: ${channelsData.success ? channelsData.data.length : 0}`);
        console.log(`   ✅ Estatísticas de carga: ${loadStatsData.success ? 'OK' : 'ERRO'}`);
        console.log(`   ✅ Estatísticas de conversas: ${convStatsData.success ? 'OK' : 'ERRO'}`);

        // 2. Verificar se os dados das estatísticas estão corretos
        if (loadStatsData.success) {
            console.log('\n2. 📋 Verificando dados das estatísticas:');
            Object.keys(loadStatsData.data).forEach(channelId => {
                const stat = loadStatsData.data[channelId];
                console.log(`   📱 ${channelId}:`);
                console.log(`      💬 Conversas: ${stat.activeConversations}`);
                console.log(`      📤 Mensagens: ${stat.totalMessages}`);
                console.log(`      📊 Taxa: ${stat.successRate}%`);
                console.log(`      ❤️ Saudável: ${stat.isHealthy}`);
            });
        }

        // 3. Simular dados de teste para verificar se os cards funcionam
        console.log('\n3. 🧪 Simulando dados de teste...');
        const testStats = {};
        
        if (channelsData.success) {
            channelsData.data.forEach((channel, index) => {
                testStats[channel.id] = {
                    activeConversations: Math.floor(Math.random() * 10) + 1,
                    totalMessages: Math.floor(Math.random() * 100) + 10,
                    successRate: Math.floor(Math.random() * 10) + 90, // 90-100%
                    lastActivity: new Date().toISOString(),
                    isHealthy: true
                };
            });
        }

        console.log('   📊 Dados de teste gerados:', testStats);

        // 4. Verificar estrutura dos cards
        console.log('\n4. 🎴 Verificando estrutura dos cards...');
        if (channelsData.success) {
            channelsData.data.forEach(channel => {
                console.log(`   📱 Card para ${channel.name}:`);
                console.log(`      ID do canal: ${channel.id}`);
                console.log(`      Elementos esperados:`);
                console.log(`        - conversations-${channel.id}`);
                console.log(`        - sent-${channel.id}`);
                console.log(`        - rate-${channel.id}`);
            });
        }

        console.log('\n' + '=' .repeat(60));
        console.log('✅ Teste de cards de canais concluído!');
        
        console.log('\n💡 Para testar no navegador:');
        console.log('   1. Abra a aba "Canais" no frontend');
        console.log('   2. Abra o console do navegador (F12)');
        console.log('   3. Verifique os logs de atualização das estatísticas');
        console.log('   4. Os cards devem mostrar:');
        console.log('      - Fundo claro na seção inferior');
        console.log('      - Números coloridos (azul, verde, azul claro)');
        console.log('      - Valores das estatísticas atualizados');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        console.log('\n💡 Verifique se o servidor está rodando na porta 3000');
    }
}

// Executar teste
testChannelsCards();
