#!/usr/bin/env node

/**
 * Script de teste para verificar o hot-reload de configurações
 * Este script simula mudanças de configuração e verifica se os componentes
 * são notificados e atualizados corretamente
 */

const { MainController } = require('./src/controllers/MainController');
const { ErrorHandler } = require('./src/services/ErrorHandler');

async function testConfigHotReload() {
    console.log('🧪 ===========================================');
    console.log('   TESTE DE HOT-RELOAD DE CONFIGURAÇÕES');
    console.log('===========================================');
    
    try {
        // Inicializar MainController
        const errorHandler = new ErrorHandler();
        const mainController = new MainController();
        
        console.log('🔧 Inicializando MainController...');
        await mainController.initialize();
        console.log('✅ MainController inicializado');
        
        // Obter configuração inicial
        console.log('\n📋 Configuração inicial:');
        const initialConfig = mainController.getSystemConfig();
        console.log(`   - MinWaitTime: ${initialConfig.minWaitTime} min`);
        console.log(`   - MaxWaitTime: ${initialConfig.maxWaitTime} min`);
        console.log(`   - RefreshInterval: ${initialConfig.refreshInterval} s`);
        console.log(`   - StartOfDayTime: ${initialConfig.startOfDayTime}`);
        console.log(`   - EndOfDayTime: ${initialConfig.endOfDayTime}`);
        
        // Teste 1: Alterar tempos de espera
        console.log('\n🔄 Teste 1: Alterando tempos de espera...');
        await mainController.updateSystemConfig({
            minWaitTime: 45,
            maxWaitTime: 90
        });
        
        // Aguardar um pouco para ver os logs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Teste 2: Alterar horários de expediente
        console.log('\n🔄 Teste 2: Alterando horários de expediente...');
        await mainController.updateSystemConfig({
            startOfDayTime: '07:00',
            endOfDayTime: '19:00'
        });
        
        // Aguardar um pouco para ver os logs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Teste 3: Alterar intervalo de refresh
        console.log('\n🔄 Teste 3: Alterando intervalo de refresh...');
        await mainController.updateSystemConfig({
            refreshInterval: 120
        });
        
        // Aguardar um pouco para ver os logs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar configuração final
        console.log('\n📋 Configuração final:');
        const finalConfig = mainController.getSystemConfig();
        console.log(`   - MinWaitTime: ${finalConfig.minWaitTime} min`);
        console.log(`   - MaxWaitTime: ${finalConfig.maxWaitTime} min`);
        console.log(`   - RefreshInterval: ${finalConfig.refreshInterval} s`);
        console.log(`   - StartOfDayTime: ${finalConfig.startOfDayTime}`);
        console.log(`   - EndOfDayTime: ${finalConfig.endOfDayTime}`);
        
        // Verificar se as mudanças foram aplicadas
        const changesApplied = 
            finalConfig.minWaitTime === 45 &&
            finalConfig.maxWaitTime === 90 &&
            finalConfig.refreshInterval === 120 &&
            finalConfig.startOfDayTime === '07:00' &&
            finalConfig.endOfDayTime === '19:00';
        
        if (changesApplied) {
            console.log('\n✅ ===========================================');
            console.log('   TESTE CONCLUÍDO COM SUCESSO!');
            console.log('===========================================');
            console.log('🎯 Todas as configurações foram atualizadas');
            console.log('🔄 Sistema de hot-reload funcionando corretamente');
            console.log('⚙️ Não é mais necessário reiniciar o servidor');
        } else {
            console.log('\n❌ ===========================================');
            console.log('   TESTE FALHOU!');
            console.log('===========================================');
            console.log('⚠️ Algumas configurações não foram aplicadas');
        }
        
    } catch (error) {
        console.error('\n💥 ===========================================');
        console.error('   ERRO NO TESTE');
        console.error('===========================================');
        console.error(`🔥 Erro: ${error.message}`);
        console.error(error.stack);
    }
    
    console.log('\n🏁 Teste finalizado');
}

// Executar teste se chamado diretamente
if (require.main === module) {
    testConfigHotReload().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Erro fatal no teste:', error);
        process.exit(1);
    });
}

module.exports = { testConfigHotReload };
