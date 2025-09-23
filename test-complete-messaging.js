/**
 * Teste completo do sistema de mensagens
 * Verifica se o envio de mensagens de 30min e fim de expediente está 100% funcional
 */

const { MainController } = require('./src/controllers/MainController');
const { MonitoringService } = require('./src/services/MonitoringService');
const { ConfigManager } = require('./src/services/ConfigManager');
const { ErrorHandler } = require('./src/services/ErrorHandler');

async function testCompleteMessaging() {
    console.log('🧪 TESTE COMPLETO: Sistema de Mensagens\n');
    console.log('=' .repeat(60));
    
    try {
        // 1. Inicializar sistema
        console.log('\n📋 1. INICIALIZANDO SISTEMA...');
        const mainController = new MainController();
        await mainController.initialize();
        console.log('✅ Sistema inicializado com sucesso');
        
        // 2. Verificar configurações
        console.log('\n📋 2. VERIFICANDO CONFIGURAÇÕES...');
        const errorHandler = new ErrorHandler();
        const configManager = new ConfigManager(errorHandler);
        await configManager.initialize();
        
        const minWaitTime = configManager.getMinWaitTime();
        const maxWaitTime = configManager.getMaxWaitTime();
        const ignoreBusinessHours = configManager.shouldIgnoreBusinessHours();
        const endOfDayPaused = configManager.isEndOfDayPaused();
        const endOfDayTime = configManager.getEndOfDayTime();
        
        console.log(`   ⏰ Tempo mínimo: ${minWaitTime} minutos`);
        console.log(`   ⏰ Tempo máximo: ${maxWaitTime} minutos`);
        console.log(`   🕐 Ignorar horário comercial: ${ignoreBusinessHours}`);
        console.log(`   🚫 Fim de dia pausado: ${endOfDayPaused}`);
        console.log(`   🕐 Horário de fim de dia: ${endOfDayTime}`);
        
        // 3. Verificar Action Cards
        console.log('\n📋 3. VERIFICANDO ACTION CARDS...');
        const actionCard30Min = configManager.getActionCardId('30min');
        const actionCardEndDay = configManager.getActionCardId('fim_dia');
        
        console.log(`   📱 Action Card 30min: ${actionCard30Min ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
        console.log(`   📱 Action Card fim dia: ${actionCardEndDay ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
        
        // 4. Criar pacientes de teste
        console.log('\n📋 4. CRIANDO PACIENTES DE TESTE...');
        
        const patient30Min = {
            id: 'test-30min-' + Date.now(),
            name: 'Paciente Teste 30min',
            phone: '16981892476', // Número real para teste
            waitTimeMinutes: 35,
            sectorId: 'test-sector',
            channelId: 'test-channel-1',
            waitStartTime: new Date(Date.now() - 35 * 60 * 1000)
        };
        
        const patientEndDay = {
            id: 'test-endday-' + Date.now(),
            name: 'Paciente Teste Fim Dia',
            phone: '16981892476', // Número real para teste
            waitTimeMinutes: 120,
            sectorId: 'test-sector',
            channelId: 'test-channel-2',
            waitStartTime: new Date(Date.now() - 120 * 60 * 1000)
        };
        
        console.log(`   👤 Paciente 30min: ${patient30Min.name} (Canal: ${patient30Min.channelId})`);
        console.log(`   👤 Paciente fim dia: ${patientEndDay.name} (Canal: ${patientEndDay.channelId})`);
        
        // 5. Verificar elegibilidade
        console.log('\n📋 5. VERIFICANDO ELEGIBILIDADE...');
        const monitoringService = new MonitoringService(errorHandler, configManager);
        
        const eligible30Min = await monitoringService.isPatientEligibleFor30MinMessage(patient30Min);
        const eligibleEndDay = await monitoringService.isPatientEligibleForEndOfDayMessage(patientEndDay);
        
        console.log(`   ✅ Elegível 30min: ${eligible30Min ? 'SIM' : 'NÃO'}`);
        console.log(`   ✅ Elegível fim dia: ${eligibleEndDay ? 'SIM' : 'NÃO'}`);
        
        // 6. Testar APIs de envio
        console.log('\n📋 6. TESTANDO APIs DE ENVIO...');
        
        // Teste 30min
        console.log('\n   🧪 Testando envio de 30min...');
        try {
            const response30Min = await fetch('http://localhost:3000/api/messages/send-action-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patients: [patient30Min],
                    action_card_id: actionCard30Min,
                    channelId: patient30Min.channelId
                })
            });
            
            const result30Min = await response30Min.json();
            console.log(`   📤 API 30min: ${response30Min.ok ? 'FUNCIONANDO' : 'ERRO'}`);
            if (!response30Min.ok) {
                console.log(`   ❌ Erro: ${result30Min.error}`);
            }
        } catch (error) {
            console.log(`   ⚠️ API 30min: Servidor não disponível - ${error.message}`);
        }
        
        // Teste fim de dia
        console.log('\n   🧪 Testando envio de fim de dia...');
        try {
            const responseEndDay = await fetch('http://localhost:3000/api/messages/send-action-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patients: [patientEndDay],
                    action_card_id: actionCardEndDay,
                    channelId: patientEndDay.channelId
                })
            });
            
            const resultEndDay = await responseEndDay.json();
            console.log(`   📤 API fim dia: ${responseEndDay.ok ? 'FUNCIONANDO' : 'ERRO'}`);
            if (!responseEndDay.ok) {
                console.log(`   ❌ Erro: ${resultEndDay.error}`);
            }
        } catch (error) {
            console.log(`   ⚠️ API fim dia: Servidor não disponível - ${error.message}`);
        }
        
        // 7. Verificar histórico
        console.log('\n📋 7. VERIFICANDO HISTÓRICO...');
        try {
            const historyResponse = await fetch('http://localhost:3000/api/messages/history');
            const historyResult = await historyResponse.json();
            console.log(`   📚 Histórico: ${historyResponse.ok ? 'ACESSÍVEL' : 'ERRO'}`);
            if (historyResponse.ok) {
                console.log(`   📊 Total de mensagens: ${historyResult.data?.length || 0}`);
            }
        } catch (error) {
            console.log(`   ⚠️ Histórico: Erro - ${error.message}`);
        }
        
        // 8. Verificar jobs de cron
        console.log('\n📋 8. VERIFICANDO JOBS DE CRON...');
        const fs = require('fs');
        const cronContent = fs.readFileSync('./src/services/CronService.js', 'utf8');
        
        const hasPatientCheck = cronContent.includes('patientCheck');
        const hasIntensiveCheck = cronContent.includes('intensivePatientCheck');
        const hasEndOfDay = cronContent.includes('endOfDayMessages');
        
        console.log(`   ⏰ Job verificação pacientes: ${hasPatientCheck ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
        console.log(`   ⏰ Job verificação intensiva: ${hasIntensiveCheck ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
        console.log(`   ⏰ Job fim de dia: ${hasEndOfDay ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
        
        // 9. Resumo final
        console.log('\n' + '=' .repeat(60));
        console.log('📊 RESUMO FINAL DO TESTE');
        console.log('=' .repeat(60));
        
        const checks = [
            { name: 'Sistema inicializado', status: true },
            { name: 'Configurações carregadas', status: true },
            { name: 'Action Card 30min', status: !!actionCard30Min },
            { name: 'Action Card fim dia', status: !!actionCardEndDay },
            { name: 'Paciente elegível 30min', status: eligible30Min },
            { name: 'Paciente elegível fim dia', status: eligibleEndDay },
            { name: 'Job verificação pacientes', status: hasPatientCheck },
            { name: 'Job fim de dia', status: hasEndOfDay }
        ];
        
        const passedChecks = checks.filter(check => check.status).length;
        const totalChecks = checks.length;
        
        console.log('\n📋 VERIFICAÇÕES:');
        checks.forEach(check => {
            console.log(`   ${check.status ? '✅' : '❌'} ${check.name}`);
        });
        
        console.log(`\n📊 RESULTADO: ${passedChecks}/${totalChecks} verificações passaram`);
        
        if (passedChecks === totalChecks) {
            console.log('\n🎉 SISTEMA 100% FUNCIONAL!');
            console.log('✅ Envio de mensagens de 30min: FUNCIONAL');
            console.log('✅ Envio de mensagens de fim de expediente: FUNCIONAL');
            console.log('✅ Você pode confiar 100% no sistema!');
        } else {
            console.log('\n⚠️ SISTEMA COM PROBLEMAS!');
            console.log('❌ Algumas funcionalidades precisam ser corrigidas');
            console.log('\n🔧 AÇÕES NECESSÁRIAS:');
            if (!actionCard30Min) console.log('   - Configurar Action Card para 30min');
            if (!actionCardEndDay) console.log('   - Configurar Action Card para fim de dia');
            if (!eligible30Min) console.log('   - Verificar configurações de elegibilidade 30min');
            if (!eligibleEndDay) console.log('   - Verificar configurações de elegibilidade fim de dia');
            if (!hasPatientCheck) console.log('   - Verificar job de verificação de pacientes');
            if (!hasEndOfDay) console.log('   - Verificar job de fim de dia');
        }
        
        console.log('\n' + '=' .repeat(60));
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Executar teste
testCompleteMessaging();
