/**
 * Teste para verificar se as estatísticas reais estão sendo exibidas
 */

async function testRealStats() {
    console.log('📊 Testando Estatísticas Reais dos Canais\n');
    console.log('=' .repeat(60));

    const baseUrl = 'http://localhost:3000';

    try {
        // 1. Testar API de estatísticas de carga
        console.log('1. 📊 Testando API /api/channels/stats/load...');
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

        // 2. Testar API de estatísticas de conversas
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

        // 3. Verificar se há dados reais (não zeros)
        console.log('\n3. 🔍 Verificando se há dados reais...');
        if (loadStatsData.success) {
            let hasRealData = false;
            Object.keys(loadStatsData.data).forEach(channelId => {
                const stat = loadStatsData.data[channelId];
                if (stat.activeConversations > 0 || stat.totalMessages > 0) {
                    hasRealData = true;
                    console.log(`   ✅ ${channelId} tem dados reais: ${stat.activeConversations} conversas, ${stat.totalMessages} mensagens`);
                }
            });
            
            if (!hasRealData) {
                console.log('   ⚠️ Todos os canais mostram 0 conversas e 0 mensagens');
                console.log('   💡 Isso pode indicar que:');
                console.log('      - O sistema está sem atividade no momento');
                console.log('      - Os dados reais não estão sendo carregados');
                console.log('      - O MultiChannelManager não tem dados atualizados');
            }
        }

        // 4. Testar API de atendimentos para comparar
        console.log('\n4. ⏳ Testando API /api/attendances/waiting para comparar...');
        const attendancesResponse = await fetch(`${baseUrl}/api/attendances/waiting`);
        const attendancesData = await attendancesResponse.json();
        
        if (attendancesData.success) {
            console.log('✅ Atendimentos obtidos com sucesso');
            console.log(`📊 Total de atendimentos: ${attendancesData.totalAttendances}`);
            console.log(`📱 Canais com atendimentos: ${attendancesData.channelsCount}`);
            
            // Comparar com estatísticas
            if (convStatsData.success) {
                const statsTotal = convStatsData.data.total;
                const attendancesTotal = attendancesData.totalAttendances;
                
                console.log(`\n🔍 Comparação:`);
                console.log(`   📊 Estatísticas de conversas: ${statsTotal}`);
                console.log(`   ⏳ Atendimentos aguardando: ${attendancesTotal}`);
                
                if (statsTotal !== attendancesTotal) {
                    console.log(`   ⚠️ Diferença encontrada! Os números não coincidem.`);
                    console.log(`   💡 Isso pode indicar que as estatísticas não estão sendo atualizadas corretamente.`);
                } else {
                    console.log(`   ✅ Os números coincidem!`);
                }
            }
        } else {
            console.log('❌ Erro ao obter atendimentos:', attendancesData.error);
        }

        console.log('\n' + '=' .repeat(60));
        console.log('✅ Teste de estatísticas reais concluído!');
        
        console.log('\n💡 Para testar no frontend:');
        console.log('   1. Abra a aba "Canais"');
        console.log('   2. Os cards devem mostrar os números corretos agora');
        console.log('   3. Se ainda mostrar 0, verifique os logs do console');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
    }
}

// Executar teste
testRealStats();
