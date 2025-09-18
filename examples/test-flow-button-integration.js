/**
 * Teste de integração completo do botão de fluxo
 * Simula o comportamento do frontend
 */

const http = require('http');

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

function simulateFrontendButtonLogic(isPaused) {
    if (isPaused) {
        return {
            text: '▶️ Retomar Fluxo',
            class: 'btn btn-success btn-sm',
            action: 'resume'
        };
    } else {
        return {
            text: '⏸️ Pausar Fluxo', 
            class: 'btn btn-outline-primary btn-sm',
            action: 'pause'
        };
    }
}

async function testFlowButtonIntegration() {
    console.log('🧪 TESTE DE INTEGRAÇÃO DO BOTÃO DE FLUXO\n');

    try {
        // 1. Carregar estado inicial (como o frontend faz)
        console.log('📊 1. Carregando estado inicial...');
        const initialStatus = await makeRequest('GET', '/api/status');
        
        if (initialStatus.status !== 200) {
            throw new Error(`Falha ao carregar status: ${initialStatus.status}`);
        }
        
        console.log(`   ✅ Sistema: ${initialStatus.data.isRunning ? 'Ativo' : 'Inativo'}`);
        console.log(`   ✅ isPaused: ${initialStatus.data.isPaused}`);
        
        // Simular lógica do frontend
        const initialButton = simulateFrontendButtonLogic(initialStatus.data.isPaused);
        console.log(`   🎨 Botão mostra: "${initialButton.text}"`);
        console.log(`   🎨 Classe CSS: "${initialButton.class}"`);
        console.log(`   🎬 Próxima ação: ${initialButton.action}`);

        // 2. Executar ação do botão (pausar ou retomar)
        console.log(`\n🔄 2. Executando ação: ${initialButton.action}...`);
        
        const actionEndpoint = initialButton.action === 'pause' ? '/api/system/pause' : '/api/system/resume';
        const actionResult = await makeRequest('POST', actionEndpoint);
        
        if (actionResult.status === 200) {
            console.log(`   ✅ Ação "${initialButton.action}" executada com sucesso`);
        } else {
            console.log(`   ❌ Erro na ação: ${actionResult.status}`);
            console.log(`   📄 Resposta: ${JSON.stringify(actionResult.data)}`);
            return;
        }

        // 3. Verificar novo estado (como o frontend faria após a ação)
        console.log('\n📊 3. Verificando novo estado...');
        const newStatus = await makeRequest('GET', '/api/status');
        
        if (newStatus.status !== 200) {
            throw new Error(`Falha ao verificar novo status: ${newStatus.status}`);
        }
        
        console.log(`   ✅ Sistema: ${newStatus.data.isRunning ? 'Ativo' : 'Inativo'}`);
        console.log(`   ✅ isPaused: ${newStatus.data.isPaused}`);
        
        // Simular nova lógica do frontend
        const newButton = simulateFrontendButtonLogic(newStatus.data.isPaused);
        console.log(`   🎨 Botão agora mostra: "${newButton.text}"`);
        console.log(`   🎨 Nova classe CSS: "${newButton.class}"`);
        console.log(`   🎬 Próxima ação seria: ${newButton.action}`);

        // 4. Validar mudança de estado
        console.log('\n🔍 4. Validando mudança de estado...');
        
        const stateChanged = initialStatus.data.isPaused !== newStatus.data.isPaused;
        const buttonChanged = initialButton.text !== newButton.text;
        
        console.log(`   Estado mudou: ${stateChanged ? 'Sim' : 'Não'}`);
        console.log(`   Botão mudou: ${buttonChanged ? 'Sim' : 'Não'}`);
        
        if (stateChanged && buttonChanged) {
            console.log('   ✅ Mudança correta detectada');
        } else {
            console.log('   ❌ Problema: Estado ou botão não mudou como esperado');
        }

        // 5. Teste completo: pausar e retomar
        console.log('\n🔄 5. Teste completo: pausar → retomar...');
        
        // Garantir que está ativo
        if (newStatus.data.isPaused) {
            await makeRequest('POST', '/api/system/resume');
        }
        
        // Pausar
        console.log('   ⏸️ Pausando...');
        const pauseResult = await makeRequest('POST', '/api/system/pause');
        const pausedStatus = await makeRequest('GET', '/api/status');
        const pausedButton = simulateFrontendButtonLogic(pausedStatus.data.isPaused);
        
        console.log(`   Estado após pausar: ${pausedStatus.data.isPaused ? 'PAUSADO' : 'ATIVO'}`);
        console.log(`   Botão após pausar: "${pausedButton.text}"`);
        
        // Retomar
        console.log('   ▶️ Retomando...');
        const resumeResult = await makeRequest('POST', '/api/system/resume');
        const resumedStatus = await makeRequest('GET', '/api/status');
        const resumedButton = simulateFrontendButtonLogic(resumedStatus.data.isPaused);
        
        console.log(`   Estado após retomar: ${resumedStatus.data.isPaused ? 'PAUSADO' : 'ATIVO'}`);
        console.log(`   Botão após retomar: "${resumedButton.text}"`);

        // 6. Resumo final
        console.log('\n📊 RESUMO FINAL:');
        
        const fullCycleWorks = !pausedStatus.data.isPaused === false && 
                              pausedStatus.data.isPaused === true && 
                              resumedStatus.data.isPaused === false;
        
        const buttonsCorrect = pausedButton.text.includes('Retomar') && 
                              resumedButton.text.includes('Pausar');
        
        console.log(`   Ciclo completo funciona: ${fullCycleWorks ? 'Sim' : 'Não'}`);
        console.log(`   Botões corretos: ${buttonsCorrect ? 'Sim' : 'Não'}`);
        
        if (fullCycleWorks && buttonsCorrect) {
            console.log('\n   🎉 SUCESSO TOTAL: Botão de fluxo funcionando perfeitamente!');
            console.log('   ✅ Backend fornece dados corretos');
            console.log('   ✅ Frontend pode processar corretamente');
            console.log('   ✅ Endpoints estão corretos');
            console.log('   ✅ Mudanças de estado funcionam');
            console.log('   ✅ Interface reflete estado real');
        } else {
            console.log('\n   ❌ PROBLEMAS DETECTADOS');
            if (!fullCycleWorks) {
                console.log('   🔧 Verificar lógica de pause/resume');
            }
            if (!buttonsCorrect) {
                console.log('   🔧 Verificar lógica de atualização do botão');
            }
        }

    } catch (error) {
        console.error('\n❌ Erro durante o teste:', error.message);
        console.log('\n🔧 Verificar:');
        console.log('   1. Servidor rodando na porta 3000');
        console.log('   2. Endpoints /api/status, /api/system/pause, /api/system/resume');
        console.log('   3. MainController inicializado corretamente');
    }
}

// Executar teste
testFlowButtonIntegration();
