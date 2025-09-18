const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Script de teste para verificar se os Action Cards são salvos corretamente no JSON
 */

async function testActionCardsSave() {
  try {
    console.log('🧪 Testando salvamento de Action Cards no JSON...\n');

    // 1. Verificar estado inicial
    console.log('1️⃣ Estado inicial do arquivo JSON:');
    const configPath = path.join(__dirname, 'data/system_config.json');
    const initialConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('📋 Configuração atual:');
    console.log(`   selectedActionCard: ${initialConfig.selectedActionCard}`);
    console.log(`   selectedActionCard30Min: ${initialConfig.selectedActionCard30Min}`);
    console.log(`   selectedActionCardEndDay: ${initialConfig.selectedActionCardEndDay}`);

    // 2. Testar obtenção via API
    console.log('\n2️⃣ Obtendo Action Cards via API...');
    try {
      const getResponse = await axios.get('http://localhost:3000/api/action-cards');
      console.log('✅ Resposta da API GET:');
      console.log(`   default: ${getResponse.data.data.default}`);
      console.log(`   thirtyMin: ${getResponse.data.data.thirtyMin}`);
      console.log(`   endOfDay: ${getResponse.data.data.endOfDay}`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('⚠️  Servidor não está rodando. Iniciando teste offline...');
        return testOffline();
      }
      throw error;
    }

    // 3. Testar atualização via API
    console.log('\n3️⃣ Testando atualização via API...');
    const newActionCards = {
      default: 'test_default_' + Date.now(),
      thirtyMin: 'test_30min_' + Date.now(),
      endOfDay: 'test_endday_' + Date.now()
    };

    console.log('📤 Enviando novos Action Cards:');
    console.log(`   default: ${newActionCards.default}`);
    console.log(`   thirtyMin: ${newActionCards.thirtyMin}`);
    console.log(`   endOfDay: ${newActionCards.endOfDay}`);

    const updateResponse = await axios.post('http://localhost:3000/api/action-cards', newActionCards);
    console.log('✅ Resposta da atualização:');
    console.log(`   Status: ${updateResponse.status}`);
    console.log(`   Sucesso: ${updateResponse.data.success}`);
    console.log(`   Mensagem: ${updateResponse.data.message}`);

    // 4. Verificar se foi salvo no arquivo
    console.log('\n4️⃣ Verificando se foi salvo no arquivo JSON...');
    
    // Aguardar um pouco para garantir que foi salvo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('📋 Configuração após atualização:');
    console.log(`   selectedActionCard: ${updatedConfig.selectedActionCard}`);
    console.log(`   selectedActionCard30Min: ${updatedConfig.selectedActionCard30Min}`);
    console.log(`   selectedActionCardEndDay: ${updatedConfig.selectedActionCardEndDay}`);

    // 5. Verificar se as mudanças foram aplicadas
    console.log('\n5️⃣ Verificando se as mudanças foram aplicadas...');
    const changes = {
      default: updatedConfig.selectedActionCard === newActionCards.default,
      thirtyMin: updatedConfig.selectedActionCard30Min === newActionCards.thirtyMin,
      endOfDay: updatedConfig.selectedActionCardEndDay === newActionCards.endOfDay
    };

    console.log(`   ✅ Default atualizado: ${changes.default ? 'SIM' : 'NÃO'}`);
    console.log(`   ✅ 30Min atualizado: ${changes.thirtyMin ? 'SIM' : 'NÃO'}`);
    console.log(`   ✅ EndOfDay atualizado: ${changes.endOfDay ? 'SIM' : 'NÃO'}`);

    if (changes.default && changes.thirtyMin && changes.endOfDay) {
      console.log('\n🎉 TESTE BEM-SUCEDIDO!');
      console.log('✅ Todos os Action Cards foram salvos corretamente no JSON');
    } else {
      console.log('\n❌ TESTE FALHOU!');
      console.log('🚫 Nem todos os Action Cards foram salvos corretamente');
    }

    // 6. Restaurar configuração original
    console.log('\n6️⃣ Restaurando configuração original...');
    const restoreCards = {
      default: initialConfig.selectedActionCard,
      thirtyMin: initialConfig.selectedActionCard30Min,
      endOfDay: initialConfig.selectedActionCardEndDay
    };

    await axios.post('http://localhost:3000/api/action-cards', restoreCards);
    console.log('✅ Configuração original restaurada');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error('🚫 Mensagem:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Data:', error.response.data);
    }
  }
}

/**
 * Teste offline usando diretamente os módulos
 */
async function testOffline() {
  console.log('\n🔧 EXECUTANDO TESTE OFFLINE...');
  
  try {
    const { ConfigManager } = require('./src/services/ConfigManager');
    const { ErrorHandler } = require('./src/services/ErrorHandler');
    
    const errorHandler = new ErrorHandler();
    const configManager = new ConfigManager(errorHandler);
    
    await configManager.initialize();
    
    console.log('✅ ConfigManager inicializado');
    
    // Testar métodos individuais
    console.log('\n📋 Action Cards atuais:');
    console.log(`   Default: ${configManager.getActionCardId()}`);
    console.log(`   30Min: ${configManager.get30MinActionCardId()}`);
    console.log(`   EndOfDay: ${configManager.getEndOfDayActionCardId()}`);
    
    // Testar atualização
    console.log('\n🔄 Testando atualização...');
    const testCards = {
      default: 'offline_test_default_' + Date.now(),
      thirtyMin: 'offline_test_30min_' + Date.now(),
      endOfDay: 'offline_test_endday_' + Date.now()
    };
    
    await configManager.setAllActionCards(testCards);
    console.log('✅ Action Cards atualizados via método direto');
    
    console.log('\n📋 Action Cards após atualização:');
    console.log(`   Default: ${configManager.getActionCardId()}`);
    console.log(`   30Min: ${configManager.get30MinActionCardId()}`);
    console.log(`   EndOfDay: ${configManager.getEndOfDayActionCardId()}`);
    
  } catch (error) {
    console.error('❌ Erro no teste offline:', error.message);
  }
}

// Executar teste
testActionCardsSave();
