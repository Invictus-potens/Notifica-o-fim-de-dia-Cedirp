/**
 * Script para testar o controle de fluxo (pausar/retomar)
 */

const http = require('http');

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 48026,
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

async function testFlowControl() {
    console.log('🧪 TESTE DE CONTROLE DE FLUXO\n');

    try {
        // 1. Verificar status inicial
        console.log('📊 1. Verificando status inicial...');
        const initialStatus = await makeRequest('GET', '/api/status');
        
        if (initialStatus.status === 200) {
            console.log(`   ✅ Status: ${initialStatus.data.isRunning ? 'Ativo' : 'Inativo'}`);
            console.log(`   ✅ Fluxo: ${initialStatus.data.isPaused ? 'PAUSADO' : 'ATIVO'}`);
            console.log(`   ✅ flowPaused: ${initialStatus.data.flowPaused}`);
            console.log(`   ✅ isPaused: ${initialStatus.data.isPaused}`);
        } else {
            throw new Error(`Status inicial falhou: ${initialStatus.status}`);
        }

        // 2. Pausar fluxo
        console.log('\n⏸️ 2. Pausando fluxo...');
        const pauseResult = await makeRequest('POST', '/api/system/pause');
        
        if (pauseResult.status === 200) {
            console.log('   ✅ Fluxo pausado com sucesso');
        } else {
            console.log(`   ❌ Erro ao pausar: ${pauseResult.status}`);
            console.log(`   📄 Resposta: ${JSON.stringify(pauseResult.data)}`);
        }

        // 3. Verificar status após pausar
        console.log('\n📊 3. Verificando status após pausar...');
        const pausedStatus = await makeRequest('GET', '/api/status');
        
        if (pausedStatus.status === 200) {
            console.log(`   ✅ Status: ${pausedStatus.data.isRunning ? 'Ativo' : 'Inativo'}`);
            console.log(`   ✅ Fluxo: ${pausedStatus.data.isPaused ? 'PAUSADO' : 'ATIVO'}`);
            console.log(`   ✅ flowPaused: ${pausedStatus.data.flowPaused}`);
            console.log(`   ✅ isPaused: ${pausedStatus.data.isPaused}`);
            
            if (pausedStatus.data.isPaused) {
                console.log('   🎯 Frontend deve mostrar: "▶️ Retomar Fluxo" (botão verde)');
            } else {
                console.log('   ❌ PROBLEMA: Fluxo deveria estar pausado!');
            }
        }

        // 4. Retomar fluxo
        console.log('\n▶️ 4. Retomando fluxo...');
        const resumeResult = await makeRequest('POST', '/api/system/resume');
        
        if (resumeResult.status === 200) {
            console.log('   ✅ Fluxo retomado com sucesso');
        } else {
            console.log(`   ❌ Erro ao retomar: ${resumeResult.status}`);
            console.log(`   📄 Resposta: ${JSON.stringify(resumeResult.data)}`);
        }

        // 5. Verificar status final
        console.log('\n📊 5. Verificando status final...');
        const finalStatus = await makeRequest('GET', '/api/status');
        
        if (finalStatus.status === 200) {
            console.log(`   ✅ Status: ${finalStatus.data.isRunning ? 'Ativo' : 'Inativo'}`);
            console.log(`   ✅ Fluxo: ${finalStatus.data.isPaused ? 'PAUSADO' : 'ATIVO'}`);
            console.log(`   ✅ flowPaused: ${finalStatus.data.flowPaused}`);
            console.log(`   ✅ isPaused: ${finalStatus.data.isPaused}`);
            
            if (!finalStatus.data.isPaused) {
                console.log('   🎯 Frontend deve mostrar: "⏸️ Pausar Fluxo" (botão azul)');
            } else {
                console.log('   ❌ PROBLEMA: Fluxo deveria estar ativo!');
            }
        }

        // 6. Resumo
        console.log('\n📊 RESUMO DO TESTE:');
        
        const initialPaused = initialStatus.data.isPaused;
        const afterPause = pausedStatus.data.isPaused;
        const afterResume = finalStatus.data.isPaused;
        
        console.log(`   Estado inicial: ${initialPaused ? 'Pausado' : 'Ativo'}`);
        console.log(`   Após pausar: ${afterPause ? 'Pausado' : 'Ativo'}`);
        console.log(`   Após retomar: ${afterResume ? 'Pausado' : 'Ativo'}`);
        
        const testPassed = !initialPaused && afterPause && !afterResume;
        
        if (testPassed) {
            console.log('\n   ✅ TESTE PASSOU: Controle de fluxo funcionando corretamente');
            console.log('   ✅ Backend fornece dados corretos');
            console.log('   ✅ Frontend deve conseguir atualizar botão corretamente');
        } else {
            console.log('\n   ❌ TESTE FALHOU: Problemas no controle de fluxo');
            console.log('   🔧 Verificar implementação de pause/resume');
        }

    } catch (error) {
        console.error('\n❌ Erro durante o teste:', error.message);
        console.log('\n🔧 Possíveis soluções:');
        console.log('   1. Verificar se o servidor está rodando');
        console.log('   2. Verificar implementação dos endpoints');
        console.log('   3. Verificar se o ConfigManager está funcionando');
    }
}

// Executar teste
testFlowControl();
