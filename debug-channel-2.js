/**
 * Debug específico para descobrir por que o canal 2 não mostra 38 conversas
 */

async function debugChannel2() {
    console.log('🔍 DEBUG: Investigando Canal 2 (WHATSAPP OFICIAL)\n');
    console.log('=' .repeat(70));

    const baseUrl = 'http://localhost:48026';

    try {
        // 1. Obter todos os canais
        console.log('1. 📱 Obtendo todos os canais...');
        const channelsResponse = await fetch(`${baseUrl}/api/channels`);
        const channelsData = await channelsResponse.json();
        
        if (!channelsData.success) {
            console.log('❌ Erro ao obter canais:', channelsData.error);
            return;
        }

        console.log(`✅ ${channelsData.data.length} canais obtidos:`);
        channelsData.data.forEach((channel, index) => {
            console.log(`   ${index + 1}. ID: "${channel.id}" | Nome: "${channel.name}" | Ativo: ${channel.active}`);
        });

        // 2. Identificar o canal 2
        const channel2 = channelsData.data.find(c => c.name === 'WHATSAPP OFICIAL');
        if (!channel2) {
            console.log('❌ Canal 2 (WHATSAPP OFICIAL) não encontrado!');
            return;
        }

        console.log(`\n2. 🎯 Canal 2 identificado:`);
        console.log(`   ID: "${channel2.id}"`);
        console.log(`   Nome: "${channel2.name}"`);
        console.log(`   Número: ${channel2.number}`);
        console.log(`   Departamento: "${channel2.department}"`);
        console.log(`   Ativo: ${channel2.active}`);

        // 3. Testar API de estatísticas de carga
        console.log(`\n3. 📊 Testando API /api/channels/stats/load...`);
        const loadStatsResponse = await fetch(`${baseUrl}/api/channels/stats/load`);
        const loadStatsData = await loadStatsResponse.json();
        
        if (loadStatsData.success) {
            console.log('✅ Estatísticas de carga obtidas');
            
            // Verificar se o canal 2 está nas estatísticas
            if (loadStatsData.data[channel2.id]) {
                const channel2Stats = loadStatsData.data[channel2.id];
                console.log(`\n📊 Estatísticas do Canal 2:`);
                console.log(`   💬 Conversas ativas: ${channel2Stats.activeConversations}`);
                console.log(`   📤 Mensagens totais: ${channel2Stats.totalMessages}`);
                console.log(`   📊 Taxa de sucesso: ${channel2Stats.successRate}%`);
                console.log(`   ❤️ Saudável: ${channel2Stats.isHealthy}`);
                console.log(`   🕐 Última atividade: ${channel2Stats.lastActivity}`);
            } else {
                console.log(`❌ Canal 2 (${channel2.id}) não encontrado nas estatísticas!`);
                console.log('📋 Canais disponíveis nas estatísticas:', Object.keys(loadStatsData.data));
            }
        } else {
            console.log('❌ Erro ao obter estatísticas de carga:', loadStatsData.error);
        }

        // 4. Testar API de atendimentos para ver quantos atendimentos o canal 2 tem
        console.log(`\n4. ⏳ Testando API /api/attendances/waiting...`);
        const attendancesResponse = await fetch(`${baseUrl}/api/attendances/waiting`);
        const attendancesData = await attendancesResponse.json();
        
        if (attendancesData.success) {
            console.log('✅ Atendimentos obtidos');
            console.log(`📊 Total geral: ${attendancesData.totalAttendances}`);
            
            // Verificar atendimentos por canal
            if (attendancesData.data && attendancesData.data[channel2.id]) {
                const channel2Attendances = attendancesData.data[channel2.id];
                console.log(`\n⏳ Atendimentos do Canal 2:`);
                console.log(`   📊 Total: ${channel2Attendances.length}`);
                console.log(`   📋 Primeiros 3:`, channel2Attendances.slice(0, 3).map(a => ({
                    id: a.id,
                    name: a.name,
                    phone: a.phone,
                    waitTime: a.waitTime
                })));
            } else {
                console.log(`❌ Canal 2 não tem atendimentos ou não está nos dados!`);
                console.log('📋 Canais com atendimentos:', Object.keys(attendancesData.data || {}));
            }
        } else {
            console.log('❌ Erro ao obter atendimentos:', attendancesData.error);
        }

        // 5. Testar API de estatísticas de conversas
        console.log(`\n5. 💬 Testando API /api/channels/stats/conversations...`);
        const convStatsResponse = await fetch(`${baseUrl}/api/channels/stats/conversations`);
        const convStatsData = await convStatsResponse.json();
        
        if (convStatsData.success) {
            console.log('✅ Estatísticas de conversas obtidas');
            console.log(`📊 Total de conversas ativas: ${convStatsData.data.total}`);
            console.log(`📱 Canais ativos: ${convStatsData.data.channelsCount}`);
            console.log(`📊 Média por canal: ${convStatsData.data.averagePerChannel}`);
        } else {
            console.log('❌ Erro ao obter estatísticas de conversas:', convStatsData.error);
        }

        // 6. Verificar se há problema no MultiChannelManager
        console.log(`\n6. 🔧 Verificando MultiChannelManager...`);
        console.log('💡 Para verificar o MultiChannelManager, precisamos:');
        console.log('   1. Verificar se o channelLoad está sendo populado');
        console.log('   2. Verificar se as conversas estão sendo registradas');
        console.log('   3. Verificar se há problema na inicialização');

        // 7. Resumo do debug
        console.log(`\n7. 📋 RESUMO DO DEBUG:`);
        console.log(`   🎯 Canal 2 ID: "${channel2.id}"`);
        console.log(`   📊 Conversas nas estatísticas: ${loadStatsData.success && loadStatsData.data[channel2.id] ? loadStatsData.data[channel2.id].activeConversations : 'N/A'}`);
        console.log(`   ⏳ Atendimentos do canal: ${attendancesData.success && attendancesData.data[channel2.id] ? attendancesData.data[channel2.id].length : 'N/A'}`);
        console.log(`   💬 Total de conversas ativas: ${convStatsData.success ? convStatsData.data.total : 'N/A'}`);

        // 8. Possíveis causas
        console.log(`\n8. 🤔 POSSÍVEIS CAUSAS:`);
        console.log(`   ❓ MultiChannelManager não está sendo inicializado`);
        console.log(`   ❓ channelLoad não está sendo populado`);
        console.log(`   ❓ Conversas não estão sendo registradas no MultiChannelManager`);
        console.log(`   ❓ Problema na função getChannelsLoadStats()`);
        console.log(`   ❓ ID do canal não corresponde entre APIs`);

        console.log('\n' + '=' .repeat(70));
        console.log('✅ Debug do Canal 2 concluído!');

    } catch (error) {
        console.error('❌ Erro durante o debug:', error.message);
    }
}

// Executar debug
debugChannel2();
