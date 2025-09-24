/**
 * Teste para verificar funcionalidades de estatísticas de canais
 */

async function testChannelsStats() {
    console.log('📊 Testando Funcionalidades de Estatísticas de Canais\n');
    console.log('=' .repeat(60));

    const baseUrl = 'http://localhost:3000';

    try {
        // 1. Testar API de canais
        console.log('1. 📱 Testando API /api/channels...');
        const channelsResponse = await fetch(`${baseUrl}/api/channels`);
        const channelsData = await channelsResponse.json();
        
        if (channelsData.success) {
            console.log(`   ✅ ${channelsData.data.length} canais carregados`);
            console.log(`   📋 Canais:`, channelsData.data.map(c => `${c.name} (${c.active ? 'Ativo' : 'Inativo'})`).join(', '));
        } else {
            console.log('   ❌ Erro ao carregar canais:', channelsData.error);
        }

        // 2. Testar API de estatísticas de carga
        console.log('\n2. 📊 Testando API /api/channels/stats/load...');
        const loadStatsResponse = await fetch(`${baseUrl}/api/channels/stats/load`);
        const loadStatsData = await loadStatsResponse.json();
        
        if (loadStatsData.success) {
            console.log('   ✅ Estatísticas de carga obtidas com sucesso');
            console.log('   📊 Dados:', JSON.stringify(loadStatsData.data, null, 2));
        } else {
            console.log('   ❌ Erro ao obter estatísticas de carga:', loadStatsData.error);
        }

        // 3. Testar API de estatísticas de conversas
        console.log('\n3. 💬 Testando API /api/channels/stats/conversations...');
        const convStatsResponse = await fetch(`${baseUrl}/api/channels/stats/conversations`);
        const convStatsData = await convStatsResponse.json();
        
        if (convStatsData.success) {
            console.log('   ✅ Estatísticas de conversas obtidas com sucesso');
            console.log('   📊 Dados:', JSON.stringify(convStatsData.data, null, 2));
        } else {
            console.log('   ❌ Erro ao obter estatísticas de conversas:', convStatsData.error);
        }

        // 4. Testar contador de canais no frontend (simulação)
        console.log('\n4. 🔢 Testando contador de canais...');
        const channelsCount = channelsData.success ? channelsData.data.length : 0;
        console.log(`   ✅ Contador de canais: ${channelsCount}`);

        // 5. Testar contador de conversas ativas
        console.log('\n5. 💬 Testando contador de conversas ativas...');
        const activeConversations = convStatsData.success ? convStatsData.data.total : 0;
        console.log(`   ✅ Conversas ativas: ${activeConversations}`);

        console.log('\n' + '=' .repeat(60));
        console.log('✅ Teste de estatísticas de canais concluído!');
        
        // Resumo
        console.log('\n📋 RESUMO:');
        console.log(`   📱 Total de canais: ${channelsCount}`);
        console.log(`   💬 Conversas ativas: ${activeConversations}`);
        console.log(`   📊 APIs funcionando: ${channelsResponse.ok && loadStatsResponse.ok && convStatsResponse.ok ? '✅' : '❌'}`);

    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        console.log('\n💡 Verifique se o servidor está rodando na porta 3000');
    }
}

// Executar teste
testChannelsStats();
