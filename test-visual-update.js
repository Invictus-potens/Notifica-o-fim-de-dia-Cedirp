/**
 * Teste para verificar se os dados estão sendo exibidos visualmente nos cards
 */

async function testVisualUpdate() {
    console.log('👁️ Testando Atualização Visual dos Cards\n');
    console.log('=' .repeat(60));

    const baseUrl = 'http://localhost:3000';

    try {
        // 1. Obter dados da API
        console.log('1. 📊 Obtendo dados da API...');
        const [channelsResponse, statsResponse] = await Promise.all([
            fetch(`${baseUrl}/api/channels`),
            fetch(`${baseUrl}/api/channels/stats/load`)
        ]);

        const channelsData = await channelsResponse.json();
        const statsData = await statsResponse.json();

        if (!channelsData.success || !statsData.success) {
            console.log('❌ Erro ao obter dados da API');
            return;
        }

        console.log(`✅ ${channelsData.data.length} canais obtidos`);
        console.log(`✅ Estatísticas obtidas para ${Object.keys(statsData.data).length} canais`);

        // 2. Verificar dados das estatísticas
        console.log('\n2. 📋 Verificando dados das estatísticas:');
        Object.keys(statsData.data).forEach(channelId => {
            const stat = statsData.data[channelId];
            console.log(`   📱 ${channelId}:`);
            console.log(`      💬 Conversas: ${stat.activeConversations}`);
            console.log(`      📤 Mensagens: ${stat.totalMessages}`);
            console.log(`      📊 Taxa: ${stat.successRate}%`);
        });

        // 3. Simular dados de teste mais realistas
        console.log('\n3. 🧪 Simulando dados de teste realistas...');
        const testStats = {};
        
        channelsData.data.forEach((channel, index) => {
            testStats[channel.id] = {
                activeConversations: (index + 1) * 2, // 2, 4, 6, 8, 10
                totalMessages: (index + 1) * 25, // 25, 50, 75, 100, 125
                successRate: 95 + (index * 1), // 95%, 96%, 97%, 98%, 99%
                lastActivity: new Date().toISOString(),
                isHealthy: true
            };
        });

        console.log('📊 Dados de teste gerados:');
        Object.keys(testStats).forEach(channelId => {
            const stat = testStats[channelId];
            console.log(`   📱 ${channelId}:`);
            console.log(`      💬 Conversas: ${stat.activeConversations}`);
            console.log(`      📤 Mensagens: ${stat.totalMessages}`);
            console.log(`      📊 Taxa: ${stat.successRate}%`);
        });

        // 4. Instruções para teste manual
        console.log('\n4. 🖥️ Para testar no navegador:');
        console.log('   1. Abra a aba "Canais"');
        console.log('   2. Abra o console (F12)');
        console.log('   3. Cole o seguinte código no console:');
        console.log('');
        console.log('// Simular dados de teste');
        console.log('const testStats = ' + JSON.stringify(testStats, null, 2) + ';');
        console.log('app.updateChannelStatsCards(testStats);');
        console.log('');
        console.log('   4. Os cards devem mostrar os novos valores');
        console.log('   5. Se não mostrar, há problema na atualização visual');

        // 5. Verificar se há problema com CSS
        console.log('\n5. 🎨 Verificando possível problema de CSS:');
        console.log('   - Os elementos podem estar sendo atualizados');
        console.log('   - Mas o CSS pode estar ocultando ou sobrescrevendo');
        console.log('   - Verifique se as classes text-primary, text-success, text-info estão funcionando');

        console.log('\n' + '=' .repeat(60));
        console.log('✅ Teste de atualização visual concluído!');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
    }
}

// Executar teste
testVisualUpdate();
