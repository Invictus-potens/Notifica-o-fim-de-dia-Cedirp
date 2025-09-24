/**
 * Teste para verificar se há problema com os IDs dos canais
 */

async function testChannelIds() {
    console.log('🔍 Testando IDs dos Canais\n');
    console.log('=' .repeat(60));

    const baseUrl = 'http://localhost:3000';

    try {
        // 1. Obter canais da API
        console.log('1. 📱 Obtendo canais da API...');
        const channelsResponse = await fetch(`${baseUrl}/api/channels`);
        const channelsData = await channelsResponse.json();
        
        if (!channelsData.success) {
            console.log('❌ Erro ao obter canais:', channelsData.error);
            return;
        }

        console.log(`✅ ${channelsData.data.length} canais obtidos:`);
        channelsData.data.forEach((channel, index) => {
            console.log(`   ${index + 1}. ID: "${channel.id}" | Nome: "${channel.name}"`);
        });

        // 2. Obter estatísticas da API
        console.log('\n2. 📊 Obtendo estatísticas da API...');
        const statsResponse = await fetch(`${baseUrl}/api/channels/stats/load`);
        const statsData = await statsResponse.json();
        
        if (!statsData.success) {
            console.log('❌ Erro ao obter estatísticas:', statsData.error);
            return;
        }

        console.log(`✅ Estatísticas obtidas para ${Object.keys(statsData.data).length} canais:`);
        Object.keys(statsData.data).forEach(channelId => {
            console.log(`   📊 Canal ID: "${channelId}"`);
        });

        // 3. Verificar correspondência entre IDs
        console.log('\n3. 🔍 Verificando correspondência entre IDs...');
        const channelIds = channelsData.data.map(c => c.id);
        const statsIds = Object.keys(statsData.data);
        
        console.log('📱 IDs dos canais:', channelIds);
        console.log('📊 IDs das estatísticas:', statsIds);
        
        const missingInStats = channelIds.filter(id => !statsIds.includes(id));
        const missingInChannels = statsIds.filter(id => !channelIds.includes(id));
        
        if (missingInStats.length > 0) {
            console.log(`❌ IDs de canais sem estatísticas: ${missingInStats.join(', ')}`);
        }
        
        if (missingInChannels.length > 0) {
            console.log(`❌ IDs de estatísticas sem canais: ${missingInChannels.join(', ')}`);
        }
        
        if (missingInStats.length === 0 && missingInChannels.length === 0) {
            console.log('✅ Todos os IDs correspondem!');
        }

        // 4. Simular elementos DOM que seriam criados
        console.log('\n4. 🎴 Simulando elementos DOM...');
        channelIds.forEach(channelId => {
            const conversationsId = `conversations-${channelId}`;
            const sentId = `sent-${channelId}`;
            const rateId = `rate-${channelId}`;
            
            console.log(`   📱 Canal ${channelId}:`);
            console.log(`      - conversations-${channelId}`);
            console.log(`      - sent-${channelId}`);
            console.log(`      - rate-${channelId}`);
        });

        // 5. Verificar se há dados nas estatísticas
        console.log('\n5. 📊 Verificando dados das estatísticas...');
        Object.keys(statsData.data).forEach(channelId => {
            const stat = statsData.data[channelId];
            console.log(`   📱 ${channelId}:`);
            console.log(`      💬 Conversas: ${stat.activeConversations}`);
            console.log(`      📤 Mensagens: ${stat.totalMessages}`);
            console.log(`      📊 Taxa: ${stat.successRate}%`);
        });

        console.log('\n' + '=' .repeat(60));
        console.log('✅ Teste de IDs concluído!');
        
        console.log('\n💡 Para debug no navegador:');
        console.log('   1. Abra a aba "Canais"');
        console.log('   2. Abra o console (F12)');
        console.log('   3. Verifique os logs de criação dos cards');
        console.log('   4. Verifique os logs de atualização das estatísticas');
        console.log('   5. Procure por mensagens de "não encontrado"');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
    }
}

// Executar teste
testChannelIds();
