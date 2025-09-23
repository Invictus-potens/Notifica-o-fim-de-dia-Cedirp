/**
 * Teste de envio de mensagem de fim de expediente
 * Verifica se o sistema está funcionando 100% para mensagens de fim de dia
 */

const { MainController } = require('./src/controllers/MainController');
const { MonitoringService } = require('./src/services/MonitoringService');
const { ConfigManager } = require('./src/services/ConfigManager');
const { ErrorHandler } = require('./src/services/ErrorHandler');

async function testEndDayMessage() {
    console.log('🧪 TESTE: Envio de Mensagem de Fim de Expediente\n');
    
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
        
        const ignoreBusinessHours = configManager.shouldIgnoreBusinessHours();
        const endOfDayPaused = configManager.isEndOfDayPaused();
        const endOfDayTime = configManager.getEndOfDayTime();
        
        console.log(`   Ignorar horário comercial: ${ignoreBusinessHours}`);
        console.log(`   Fim de dia pausado: ${endOfDayPaused}`);
        console.log(`   Horário de fim de dia: ${endOfDayTime}`);
        
        // 3. Verificar se é horário de fim de dia
        console.log('\n📋 3. Verificando horário atual...');
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        console.log(`   Hora atual: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
        
        // Simular horário de fim de dia para teste
        const isEndOfDayTime = currentHour >= 17 && currentHour < 19; // 17h-19h
        console.log(`   É horário de fim de dia: ${isEndOfDayTime ? 'SIM' : 'NÃO'}`);
        
        if (!isEndOfDayTime && !ignoreBusinessHours) {
            console.log('⚠️ Não é horário de fim de dia - teste pode não funcionar corretamente');
        }
        
        // 4. Criar paciente de teste para fim de dia
        console.log('\n📋 4. Criando paciente de teste...');
        const testPatient = {
            id: 'test-endday-' + Date.now(),
            name: 'Paciente Teste Fim Dia',
            phone: '16981892476', // Número real para teste
            waitTimeMinutes: 120, // Paciente aguardando há 2 horas
            sectorId: 'test-sector',
            channelId: 'test-channel-2', // Canal específico
            waitStartTime: new Date(Date.now() - 120 * 60 * 1000) // 2h atrás
        };
        
        console.log(`   Paciente: ${testPatient.name}`);
        console.log(`   Telefone: ${testPatient.phone}`);
        console.log(`   Tempo de espera: ${testPatient.waitTimeMinutes} minutos`);
        console.log(`   Canal: ${testPatient.channelId}`);
        
        // 5. Verificar elegibilidade
        console.log('\n📋 5. Verificando elegibilidade...');
        const monitoringService = new MonitoringService(errorHandler, configManager);
        
        const isEligible = await monitoringService.isPatientEligibleForEndOfDayMessage(testPatient);
        console.log(`   Elegível para fim de dia: ${isEligible ? 'SIM' : 'NÃO'}`);
        
        if (!isEligible) {
            console.log('❌ Paciente não é elegível - verificar configurações e horário');
            console.log('   Dica: Verifique se endOfDayPaused está false e se é horário correto');
        }
        
        // 6. Simular envio via API
        console.log('\n📋 6. Simulando envio via API...');
        
        const actionCardId = configManager.getActionCardId('fim_dia');
        console.log(`   Action Card ID: ${actionCardId}`);
        
        // Dados para envio
        const sendData = {
            patients: [testPatient],
            action_card_id: actionCardId,
            channelId: testPatient.channelId
        };
        
        console.log('   Dados de envio:', JSON.stringify(sendData, null, 2));
        
        // 7. Testar API de envio
        console.log('\n📋 7. Testando API de envio...');
        
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
        
        // 8. Verificar histórico
        console.log('\n📋 8. Verificando histórico de mensagens...');
        
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
        
        // 9. Verificar jobs de cron
        console.log('\n📋 9. Verificando jobs de cron...');
        
        // Verificar se o job de fim de dia está configurado
        const fs = require('fs');
        const cronContent = fs.readFileSync('./src/services/CronService.js', 'utf8');
        const hasEndOfDayJob = cronContent.includes('endOfDayMessages');
        
        console.log(`   Job de fim de dia configurado: ${hasEndOfDayJob ? 'SIM' : 'NÃO'}`);
        
        // 10. Resumo final
        console.log('\n✅ TESTE DE FIM DE EXPEDIENTE CONCLUÍDO!');
        console.log('\n📊 RESULTADO:');
        console.log(`✅ Sistema inicializado: SIM`);
        console.log(`✅ Configurações carregadas: SIM`);
        console.log(`✅ Paciente elegível: ${isEligible ? 'SIM' : 'NÃO'}`);
        console.log(`✅ Action Card configurado: ${actionCardId ? 'SIM' : 'NÃO'}`);
        console.log(`✅ API de envio: ${response?.ok ? 'FUNCIONANDO' : 'COM PROBLEMAS'}`);
        console.log(`✅ Histórico acessível: ${historyResponse?.ok ? 'SIM' : 'NÃO'}`);
        console.log(`✅ Job de cron configurado: ${hasEndOfDayJob ? 'SIM' : 'NÃO'}`);
        
        if (isEligible && actionCardId && response?.ok && hasEndOfDayJob) {
            console.log('\n🎉 MENSAGEM DE FIM DE EXPEDIENTE: 100% FUNCIONAL!');
            console.log('✅ Você pode confiar no sistema para envio de mensagens de fim de dia!');
        } else {
            console.log('\n⚠️ MENSAGEM DE FIM DE EXPEDIENTE: COM PROBLEMAS!');
            console.log('❌ Verifique as configurações, tokens e horário');
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Executar teste
testEndDayMessage();
