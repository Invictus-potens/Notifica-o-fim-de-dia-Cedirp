#!/usr/bin/env node

/**
 * Teste para verificar se o frontend está funcionando corretamente
 */

const axios = require('axios');

async function testFrontendDebug() {
  try {
    console.log('🧪 ===========================================');
    console.log('   TESTANDO FRONTEND DEBUG');
    console.log('===========================================');
    
    const baseUrl = 'http://localhost:3000';
    
    // 1. Verificar se servidor está rodando
    console.log('\n1️⃣ Verificando servidor...');
    try {
      await axios.get(`${baseUrl}/health?quick=true`, { timeout: 5000 });
      console.log('✅ Servidor está rodando');
    } catch (error) {
      console.log('❌ Servidor não está respondendo');
      return;
    }
    
    // 2. Testar endpoint de pacientes
    console.log('\n2️⃣ Testando endpoint de pacientes...');
    const patientsResponse = await axios.get(`${baseUrl}/api/patients`);
    console.log(`✅ Endpoint de pacientes funcionando: ${patientsResponse.data.data.length} pacientes`);
    
    // 3. Testar endpoint de histórico de mensagens
    console.log('\n3️⃣ Testando endpoint de histórico...');
    const historyResponse = await axios.get(`${baseUrl}/api/messages/history`);
    console.log(`✅ Endpoint de histórico funcionando: ${historyResponse.data.data.length} mensagens`);
    
    // 4. Testar se a página principal está acessível
    console.log('\n4️⃣ Testando página principal...');
    const pageResponse = await axios.get(`${baseUrl}/`, { timeout: 5000 });
    console.log(`✅ Página principal acessível: Status ${pageResponse.status}`);
    
    // 5. Verificar se há JavaScript na página
    if (pageResponse.data.includes('app.js')) {
      console.log('✅ app.js está sendo carregado na página');
    } else {
      console.log('❌ app.js NÃO está sendo carregado na página');
    }
    
    // 6. Verificar se há logs de debug na página
    if (pageResponse.data.includes('DEBUG')) {
      console.log('✅ Logs de DEBUG estão no código da página');
    } else {
      console.log('❌ Logs de DEBUG NÃO estão no código da página');
    }
    
    console.log('\n🎯 ===========================================');
    console.log('   TESTE CONCLUÍDO');
    console.log('===========================================');
    console.log('💡 Agora abra o navegador em http://localhost:3000');
    console.log('💡 Abra o Console (F12) e recarregue a página');
    console.log('💡 Procure pelos logs que começam com 🚨 DEBUG');
    
  } catch (error) {
    console.error('\n❌ ===========================================');
    console.error('   ERRO NO TESTE');
    console.error('===========================================');
    console.error(`💥 Erro: ${error.message}`);
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
    }
    console.error('===========================================\n');
  }
}

// Executar teste
testFrontendDebug();
