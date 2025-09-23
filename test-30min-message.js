/**
 * Teste de envio de mensagem de 30 minutos
 * Verifica se o sistema está funcionando 100% para mensagens de 30min
 */

const { MainController } = require('./src/controllers/MainController');
const { MonitoringService } = require('./src/services/MonitoringService');
const { ConfigManager } = require('./src/services/ConfigManager');
const { ErrorHandler } = require('./src/services/ErrorHandler');

async function test30MinMessage() {
    console.log('🧪 TESTE: Envio de Mensagem de 30 Minutos\n');
    
    try {
        // 1. Inicializar sistema
        console.log('📋 1. Inicializando sistema...');
        const mainController = new MainController();
        await mainController.initialize();
        console.log('✅ Sistema inicializado');
        
        // 2. Verificar configurações
        console.log('\n📋 2. Verificando configurações...');
        const errorHandler = new ErrorHandler();
        const configManager = new ConfigManager(errorHandler);
        await configManager.initialize();
        
        const minWaitTime = configManager.getMinWaitTime();
        const maxWaitTime = configManager.getMaxWaitTime();
        const ignoreBusinessHours = configManager.shouldIgnoreBusinessHours();
        const endOfDayPaused = configManager.isEndOfDayPaused();
        
        console.log(`   Tempo mínimo: ${minWaitTime} minutos`);
        console.log(`   Tempo máximo: ${maxWaitTime} minutos`);
        console.log(`   Ignorar horário comercial: ${ignoreBusinessHours}`);
        console.log(`   Fim de dia pausado: ${endOfDayPaused}`);
        
        // 3. Criar paciente de teste para 30min
        console.log('\n📋 3. Criando paciente de teste...');
        const testPatient = {
            id: 'test-30min-' + Date.now(),
            name: 'Paciente Teste 30min',
            phone: '16981892476', // Número real para teste
            waitTimeMinutes: 35, // Dentro do intervalo ideal
            sectorId: 'test-sector',
            channelId: 'test-channel-1', // Canal específico
            waitStartTime: new Date(Date.now() - 35 * 60 * 1000) // 35 min atrás
        };
        
        console.log(`   Paciente: ${testPatient.name}`);
        console.log(`   Telefone: ${testPatient.phone}`);
        console.log(`   Tempo de espera: ${testPatient.waitTimeMinutes} minutos`);
        console.log(`   Canal: ${testPatient.channelId}`);
        
        // 4. Verificar elegibilidade
        console.log('\n📋 4. Verificando elegibilidade...');
        const monitoringService = new MonitoringService(errorHandler, configManager);
        
        const isEligible = await monitoringService.isPatientEligibleFor30MinMessage(testPatient);
        console.log(`   Elegível para 30min: ${isEligible ? 'SIM' : 'NÃO'}`);
        
        if (!isEligible) {
            console.log('❌ Paciente não é elegível - verificar configurações');
            return;
        }
        
        // 5. Simular envio via API
        console.log('\n📋 5. Simulando envio via API...');
        
        const actionCardId = configManager.getActionCardId('30min');
        console.log(`   Action Card ID: ${actionCardId}`);
        
        // Dados para envio
        const sendData = {
            patients: [testPatient],
            action_card_id: actionCardId,
            channelId: testPatient.channelId
        };
        
        console.log('   Dados de envio:', JSON.stringify(sendData, null, 2));
        
        // 6. Testar API de envio
        console.log('\n📋 6. Testando API de envio...');
        
        try {
            const response = await fetch('http://localhost:3000/api/messages/send-action-card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sendData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('✅ API de envio funcionando!');
                console.log(`   Resposta: ${JSON.stringify(result, null, 2)}`);
            } else {
                console.log('❌ Erro na API de envio:');
                console.log(`   Status: ${response.status}`);
                console.log(`   Erro: ${result.error || 'Erro desconhecido'}`);
            }
            
        } catch (apiError) {
            console.log('⚠️ Servidor não está rodando ou API não disponível');
            console.log(`   Erro: ${apiError.message}`);
        }
        
        // 7. Verificar histórico
        console.log('\n📋 7. Verificando histórico de mensagens...');
        
        try {
            const historyResponse = await fetch('http://localhost:3000/api/messages/history');
            const historyResult = await historyResponse.json();
            
            if (historyResponse.ok && historyResult.success) {
                console.log('✅ Histórico de mensagens acessível');
                console.log(`   Total de mensagens: ${historyResult.data?.length || 0}`);
            } else {
                console.log('❌ Erro ao acessar histórico');
            }
            
        } catch (historyError) {
            console.log('⚠️ Erro ao acessar histórico:', historyError.message);
        }
        
        // 8. Resumo final
        console.log('\n✅ TESTE DE 30 MINUTOS CONCLUÍDO!');
        console.log('\n📊 RESULTADO:');
        console.log(`✅ Sistema inicializado: SIM`);
        console.log(`✅ Configurações carregadas: SIM`);
        console.log(`✅ Paciente elegível: ${isEligible ? 'SIM' : 'NÃO'}`);
        console.log(`✅ Action Card configurado: ${actionCardId ? 'SIM' : 'NÃO'}`);
        console.log(`✅ API de envio: ${response?.ok ? 'FUNCIONANDO' : 'COM PROBLEMAS'}`);
        console.log(`✅ Histórico acessível: ${historyResponse?.ok ? 'SIM' : 'NÃO'}`);
        
        if (isEligible && actionCardId && response?.ok) {
            console.log('\n🎉 MENSAGEM DE 30 MINUTOS: 100% FUNCIONAL!');
            console.log('✅ Você pode confiar no sistema para envio de mensagens de 30min!');
        } else {
            console.log('\n⚠️ MENSAGEM DE 30 MINUTOS: COM PROBLEMAS!');
            console.log('❌ Verifique as configurações e tokens dos canais');
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Executar teste
test30MinMessage();
