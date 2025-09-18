/**
 * Teste para verificar se o botão de fluxo está refletindo o estado correto
 */

const fetch = require('node-fetch');

async function testFlowButtonStatus() {
    console.log('🧪 TESTE DO STATUS DO BOTÃO DE FLUXO\n');
    
    try {
        // 1. Testar endpoint de status
        console.log('📡 Testando endpoint /api/status...');
        const response = await fetch('http://localhost:3000/api/status');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Resposta recebida:\n');
        
        // 2. Verificar campos essenciais
        console.log('📊 Campos do status:');
        console.log(`   isRunning: ${data.isRunning}`);
        console.log(`   isInitialized: ${data.isInitialized}`);
        console.log(`   flowPaused: ${data.flowPaused} (campo legado)`);
        console.log(`   isPaused: ${data.isPaused} (campo que o frontend espera)`);
        
        // 3. Verificar consistência
        console.log('\n🔍 Verificação de consistência:');
        
        const hasIsPaused = data.isPaused !== undefined;
        const hasFlowPaused = data.flowPaused !== undefined;
        const isConsistent = hasIsPaused && hasFlowPaused && (data.isPaused === data.flowPaused);
        
        console.log(`   ✅ Campo 'isPaused' presente: ${hasIsPaused ? 'Sim' : 'Não'}`);
        console.log(`   ✅ Campo 'flowPaused' presente: ${hasFlowPaused ? 'Sim' : 'Não'}`);
        console.log(`   ✅ Valores consistentes: ${isConsistent ? 'Sim' : 'Não'}`);
        
        // 4. Simular lógica do frontend
        console.log('\n🎭 Simulação da lógica do frontend:');
        
        if (data.isPaused !== undefined) {
            console.log(`   ✅ Frontend pode determinar estado: ${data.isPaused ? 'PAUSADO' : 'ATIVO'}`);
            
            // Simular atualização do botão
            if (data.isPaused) {
                console.log('   🔄 Botão seria atualizado para: "▶️ Retomar Fluxo" (verde)');
            } else {
                console.log('   🔄 Botão seria atualizado para: "⏸️ Pausar Fluxo" (azul)');
            }
        } else {
            console.log('   ❌ Frontend não consegue determinar estado');
            console.log('   🔄 Botão seria atualizado para: "❓ Estado Desconhecido" (cinza)');
        }
        
        // 5. Testar diferentes cenários
        console.log('\n🎯 Cenários de teste:');
        
        if (data.isPaused) {
            console.log('   📋 Cenário atual: Sistema PAUSADO');
            console.log('   👤 Usuário vê: Botão verde "Retomar Fluxo"');
            console.log('   🎬 Ação esperada: Clicar retoma o fluxo');
        } else {
            console.log('   📋 Cenário atual: Sistema ATIVO');
            console.log('   👤 Usuário vê: Botão azul "Pausar Fluxo"');
            console.log('   🎬 Ação esperada: Clicar pausa o fluxo');
        }
        
        // 6. Resumo do teste
        console.log('\n📊 RESUMO DO TESTE:');
        
        if (hasIsPaused && isConsistent) {
            console.log('   ✅ SUCESSO: Botão deve refletir estado correto');
            console.log('   ✅ Backend fornece dados consistentes');
            console.log('   ✅ Frontend pode processar corretamente');
        } else {
            console.log('   ❌ PROBLEMA: Botão pode não refletir estado correto');
            if (!hasIsPaused) {
                console.log('   ❌ Campo "isPaused" ausente');
            }
            if (!isConsistent) {
                console.log('   ❌ Valores inconsistentes entre campos');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        console.log('\n🔧 Possíveis soluções:');
        console.log('   1. Verificar se o servidor está rodando na porta 3000');
        console.log('   2. Verificar se o endpoint /api/status está funcionando');
        console.log('   3. Verificar se o MainController está inicializado');
    }
}

// Executar teste
testFlowButtonStatus();
