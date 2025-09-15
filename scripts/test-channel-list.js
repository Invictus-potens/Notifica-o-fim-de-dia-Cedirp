#!/usr/bin/env node

/**
 * Script de teste para a funcionalidade de listagem de canais
 * 
 * Este script testa a nova funcionalidade implementada para listar canais
 * da API CAM Krolik na página de configurações.
 */

const path = require('path');
const { listChannels, testApiConnection } = require('../examples/channel-list-example');

async function runTests() {
  console.log('🧪 ===========================================');
  console.log('   TESTE DA FUNCIONALIDADE DE CANAIS');
  console.log('===========================================\n');

  const tests = [
    {
      name: 'Teste de Conectividade',
      fn: testApiConnection,
      description: 'Verifica se a API está acessível'
    },
    {
      name: 'Teste de Listagem de Canais',
      fn: listChannels,
      description: 'Lista todos os canais disponíveis'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(`🔍 Executando: ${test.name}`);
    console.log(`📝 Descrição: ${test.description}\n`);

    try {
      const result = await test.fn();
      
      console.log(`✅ ${test.name}: PASSOU`);
      if (typeof result === 'object' && result.channels) {
        console.log(`📊 Canais encontrados: ${result.channels.length}`);
      }
      passedTests++;
      
    } catch (error) {
      console.log(`❌ ${test.name}: FALHOU`);
      console.log(`💥 Erro: ${error.message}`);
    }

    console.log('\n' + '─'.repeat(50) + '\n');
  }

  // Resumo dos testes
  console.log('📊 ===========================================');
  console.log('   RESUMO DOS TESTES');
  console.log('===========================================');
  console.log(`✅ Testes aprovados: ${passedTests}/${totalTests}`);
  console.log(`❌ Testes falharam: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ A funcionalidade de canais está funcionando corretamente.');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM');
    console.log('❌ Verifique os erros acima e corrija os problemas.');
  }

  return passedTests === totalTests;
}

// Executar testes
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erro fatal nos testes:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
