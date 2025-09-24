/**
 * Debug específico para verificar se o MultiChannelManager está sendo inicializado
 */

async function testMultiChannelDebug() {
    console.log('🔍 DEBUG: Verificando Inicialização do MultiChannelManager\n');
    console.log('=' .repeat(70));

    const baseUrl = 'http://localhost:3000';

    try {
        // 1. Aguardar um pouco para o sistema inicializar
        console.log('⏳ Aguardando sistema inicializar...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 2. Testar API de estatísticas de carga
        console.log('\n1. 📊 Testando API /api/channels/stats/load...');
        const loadStatsResponse = await fetch(`${baseUrl}/api/channels/stats/load`);
        const loadStatsData = await loadStatsResponse.json();
        
        if (loadStatsData.success) {
            console.log('✅ Estatísticas de carga obtidas com sucesso');
            console.log('📊 Dados por canal:');
            
            Object.keys(loadStatsData.data).forEach(channelId => {
                const stat = loadStatsData.data[channelId];
                console.log(`   📱 ${channelId}:`);
                console.log(`      💬 Conversas: ${stat.activeConversations}`);
                console.log(`      📤 Mensagens: ${stat.totalMessages}`);
                console.log(`      📊 Taxa: ${stat.successRate}%`);
                console.log(`      ❤️ Saudável: ${stat.isHealthy}`);
            });
        } else {
            console.log('❌ Erro ao obter estatísticas de carga:', loadStatsData.error);
        }

        // 3. Testar API de estatísticas de conversas
        console.log('\n2. 💬 Testando API /api/channels/stats/conversations...');
        const convStatsResponse = await fetch(`${baseUrl}/api/channels/stats/conversations`);
        const convStatsData = await convStatsResponse.json();
        
        if (convStatsData.success) {
            console.log('✅ Estatísticas de conversas obtidas com sucesso');
            console.log('📊 Dados gerais:');
            console.log(`   💬 Total de conversas ativas: ${convStatsData.data.total}`);
            console.log(`   📱 Canais ativos: ${convStatsData.data.channelsCount}`);
            console.log(`   📊 Média por canal: ${convStatsData.data.averagePerChannel}`);
        } else {
            console.log('❌ Erro ao obter estatísticas de conversas:', convStatsData.error);
        }

        // 4. Verificar se há problema na inicialização
        console.log('\n3. 🔍 Verificando se há problema na inicialização...');
        console.log('💡 Se ainda estiver mostrando 0, pode ser que:');
        console.log('   1. O MultiChannelManager não está sendo inicializado corretamente');
        console.log('   2. O channelLoad não está sendo populado com dados reais');
        console.log('   3. As conversas não estão sendo registradas no MultiChannelManager');
        console.log('   4. Há problema na ordem de inicialização dos serviços');

        // 5. Verificar se o canal 2 específico tem dados
        console.log('\n4. 🎯 Verificando Canal 2 (WHATSAPP OFICIAL)...');
        
        // Obter canais para identificar o canal 2
        const channelsResponse = await fetch(`${baseUrl}/api/channels`);
        const channelsData = await channelsResponse.json();
        
        if (channelsData.success) {
            const channel2 = channelsData.data.find(c => c.name === 'WHATSAPP OFICIAL');
            if (channel2 && loadStatsData.success) {
                const channel2Stats = loadStatsData.data[channel2.id];
                if (channel2Stats) {
                    console.log(`📊 Canal 2 (${channel2.id}):`);
                    console.log(`   💬 Conversas ativas: ${channel2Stats.activeConversations}`);
                    console.log(`   📤 Mensagens totais: ${channel2Stats.totalMessages}`);
                    
                    if (channel2Stats.activeConversations > 0) {
                        console.log('🎉 SUCESSO! Canal 2 tem conversas ativas!');
                    } else {
                        console.log('⚠️ Canal 2 ainda mostra 0 conversas ativas');
                        console.log('💡 Isso pode indicar que:');
                        console.log('   - O MultiChannelManager não está sendo inicializado corretamente');
                        console.log('   - O channelLoad não está sendo populado com dados reais');
                        console.log('   - As conversas não estão sendo registradas no MultiChannelManager');
                        console.log('   - Há problema na ordem de inicialização dos serviços');
                    }
                } else {
                    console.log('❌ Canal 2 não encontrado nas estatísticas');
                }
            }
        }

        console.log('\n' + '=' .repeat(70));
        console.log('✅ Debug do MultiChannelManager concluído!');

    } catch (error) {
        console.error('❌ Erro durante o debug:', error.message);
    }
}

// Executar debug
testMultiChannelDebug();
