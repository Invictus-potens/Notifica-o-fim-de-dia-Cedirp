/**
 * Teste final para verificar se as estatísticas estão funcionando após todas as correções
 */

async function testFinalStats() {
    console.log('🎯 TESTE FINAL: Verificando Estatísticas dos Canais\n');
    console.log('=' .repeat(70));

    const baseUrl = 'http://localhost:3000';

    try {
        // 1. Aguardar um pouco para o sistema inicializar
        console.log('⏳ Aguardando sistema inicializar...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. Testar API de estatísticas de carga
        console.log('\n1. 📊 Testando API /api/channels/stats/load...');
        const loadStatsResponse = await fetch(`${baseUrl}/api/channels/stats/load`);
        const loadStatsData = await loadStatsResponse.json();
        
        if (loadStatsData.success) {
            console.log('✅ Estatísticas de carga obtidas com sucesso');
            console.log('📊 Dados por canal:');
            
            let totalConversations = 0;
            let hasRealData = false;
            
            Object.keys(loadStatsData.data).forEach(channelId => {
                const stat = loadStatsData.data[channelId];
                console.log(`   📱 ${channelId}:`);
                console.log(`      💬 Conversas: ${stat.activeConversations}`);
                console.log(`      📤 Mensagens: ${stat.totalMessages}`);
                console.log(`      📊 Taxa: ${stat.successRate}%`);
                console.log(`      ❤️ Saudável: ${stat.isHealthy}`);
                
                totalConversations += stat.activeConversations;
                if (stat.activeConversations > 0 || stat.totalMessages > 0) {
                    hasRealData = true;
                }
            });
            
            console.log(`\n📊 Total de conversas ativas: ${totalConversations}`);
            
            if (hasRealData) {
                console.log('🎉 SUCESSO! Dados reais encontrados!');
            } else {
                console.log('⚠️ Ainda não há dados reais. Verificando outras possibilidades...');
            }
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
            
            if (convStatsData.data.total > 0) {
                console.log('🎉 SUCESSO! Total de conversas ativas > 0!');
            } else {
                console.log('⚠️ Total de conversas ainda é 0. Investigando...');
            }
        } else {
            console.log('❌ Erro ao obter estatísticas de conversas:', convStatsData.error);
        }

        // 4. Verificar se o canal 2 específico tem dados
        console.log('\n3. 🎯 Verificando Canal 2 (WHATSAPP OFICIAL)...');
        
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

        // 5. Verificar se há problema na inicialização
        console.log('\n4. 🔍 Verificando se há problema na inicialização...');
        console.log('💡 Se ainda estiver mostrando 0, pode ser que:');
        console.log('   1. O MultiChannelManager não está sendo inicializado corretamente');
        console.log('   2. O channelLoad não está sendo populado com dados reais');
        console.log('   3. As conversas não estão sendo registradas no MultiChannelManager');
        console.log('   4. Há problema na ordem de inicialização dos serviços');

        // 6. Testar se o frontend está funcionando
        console.log('\n5. 🌐 Testando se o frontend está funcionando...');
        console.log('💡 Para testar no frontend:');
        console.log('   1. Abra a aba "Canais"');
        console.log('   2. Os cards devem mostrar os números corretos agora');
        console.log('   3. Se ainda mostrar 0, verifique os logs do console');

        console.log('\n' + '=' .repeat(70));
        console.log('✅ Teste final concluído!');
        
        console.log('\n💡 Próximos passos se ainda houver problema:');
        console.log('   1. Verificar logs do servidor para erros de inicialização');
        console.log('   2. Verificar se o MultiChannelManager está sendo usado em outros lugares');
        console.log('   3. Verificar se as conversas estão sendo registradas corretamente');
        console.log('   4. Verificar se há problema na ordem de inicialização dos serviços');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
    }
}

// Executar teste
testFinalStats();
