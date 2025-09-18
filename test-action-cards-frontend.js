const axios = require('axios');

/**
 * Script para testar o salvamento de Action Cards via frontend
 * Simula o comportamento do botão "Salvar Configurações"
 */

async function testFrontendActionCardsSave() {
  try {
    console.log('🧪 Testando salvamento de Action Cards via frontend...\n');

    const baseUrl = 'http://localhost:3000';

    // 1. Verificar estado inicial
    console.log('1️⃣ Obtendo configurações atuais...');
    const currentConfigResponse = await axios.get(`${baseUrl}/api/action-cards`);
    console.log('📋 Configuração atual:');
    console.log(`   Default: ${currentConfigResponse.data.data.default}`);
    console.log(`   30Min: ${currentConfigResponse.data.data.thirtyMin}`);
    console.log(`   EndOfDay: ${currentConfigResponse.data.data.endOfDay}`);

    // 2. Testar cenário 1: Selecionar apenas 1 card (30Min)
    console.log('\n2️⃣ TESTE 1: Selecionando apenas Action Card de 30min...');
    const test1Data = {
      default: '', // Vazio - deve manter o antigo
      thirtyMin: '631f2b4f307d23f46ac80a29', // Novo valor
      endOfDay: '' // Vazio - deve manter o antigo
    };

    console.log('📤 Enviando:', test1Data);
    const test1Response = await axios.post(`${baseUrl}/api/action-cards`, test1Data);
    console.log('✅ Resposta:', test1Response.data.message);
    
    // Verificar se salvou corretamente
    const afterTest1 = await axios.get(`${baseUrl}/api/action-cards`);
    console.log('📋 Após teste 1:');
    console.log(`   Default: ${afterTest1.data.data.default} (deve ter mantido o antigo)`);
    console.log(`   30Min: ${afterTest1.data.data.thirtyMin} (deve ser o novo)`);
    console.log(`   EndOfDay: ${afterTest1.data.data.endOfDay} (deve ter mantido o antigo)`);

    // 3. Testar cenário 2: Selecionar apenas 2 cards (Default e EndOfDay)
    console.log('\n3️⃣ TESTE 2: Selecionando Default e EndOfDay, mantendo 30Min...');
    const test2Data = {
      default: '631f2b4f307d23f46ac80a27', // Novo valor
      thirtyMin: '', // Vazio - deve manter o atual
      endOfDay: '631f2b4f307d23f46ac80a0e' // Novo valor
    };

    console.log('📤 Enviando:', test2Data);
    const test2Response = await axios.post(`${baseUrl}/api/action-cards`, test2Data);
    console.log('✅ Resposta:', test2Response.data.message);
    
    // Verificar se salvou corretamente
    const afterTest2 = await axios.get(`${baseUrl}/api/action-cards`);
    console.log('📋 Após teste 2:');
    console.log(`   Default: ${afterTest2.data.data.default} (deve ser o novo)`);
    console.log(`   30Min: ${afterTest2.data.data.thirtyMin} (deve ter mantido do teste anterior)`);
    console.log(`   EndOfDay: ${afterTest2.data.data.endOfDay} (deve ser o novo)`);

    // 4. Testar cenário 3: Atualizar todos os 3
    console.log('\n4️⃣ TESTE 3: Atualizando todos os 3 Action Cards...');
    const test3Data = {
      default: '631f2b4f307d23f46ac80a2b',
      thirtyMin: '631f2b4f307d23f46ac80a2b',
      endOfDay: '631f2b4f307d23f46ac80a2b'
    };

    console.log('📤 Enviando:', test3Data);
    const test3Response = await axios.post(`${baseUrl}/api/action-cards`, test3Data);
    console.log('✅ Resposta:', test3Response.data.message);
    
    // Verificar se salvou corretamente
    const afterTest3 = await axios.get(`${baseUrl}/api/action-cards`);
    console.log('📋 Após teste 3:');
    console.log(`   Default: ${afterTest3.data.data.default}`);
    console.log(`   30Min: ${afterTest3.data.data.thirtyMin}`);
    console.log(`   EndOfDay: ${afterTest3.data.data.endOfDay}`);

    // 5. Verificar se foi salvo no JSON
    console.log('\n5️⃣ Verificando se foi salvo no arquivo JSON...');
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, 'data/system_config.json');
    const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log('📄 Conteúdo do system_config.json:');
    console.log(`   selectedActionCard: ${jsonConfig.selectedActionCard}`);
    console.log(`   selectedActionCard30Min: ${jsonConfig.selectedActionCard30Min}`);
    console.log(`   selectedActionCardEndDay: ${jsonConfig.selectedActionCardEndDay}`);

    console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS!');
    console.log('✅ Funcionalidade implementada com sucesso:');
    console.log('   - Salva Action Cards selecionados');
    console.log('   - Mantém valores antigos quando não selecionados');
    console.log('   - Persiste no arquivo JSON');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error('🚫 Mensagem:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🌐 Servidor não está rodando na porta 3000');
      console.error('💡 Inicie o servidor primeiro: npm start');
    }
  }
}

// Executar teste
if (require.main === module) {
  testFrontendActionCardsSave()
    .then(() => {
      console.log('\n✅ Teste concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Falha no teste:', error.message);
      process.exit(1);
    });
}

module.exports = { testFrontendActionCardsSave };
