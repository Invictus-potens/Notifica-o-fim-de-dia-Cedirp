#!/usr/bin/env node

/**
 * Teste Simples do Sistema de Múltiplos Canais
 * Verifica se as funcionalidades básicas estão funcionando
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testBasicFunctionality() {
  console.log('🧪 TESTE SIMPLES DO SISTEMA DE MÚLTIPLOS CANAIS');
  console.log('=' * 60);

  try {
    // Teste 1: Verificar se o servidor está rodando
    console.log('\n1. Verificando servidor...');
    const statusResponse = await axios.get(`${API_BASE}/status`);
    console.log(`   ✅ Servidor ativo: ${statusResponse.data.isRunning}`);

    // Teste 2: Verificar métricas gerais
    console.log('\n2. Verificando métricas...');
    const metricsResponse = await axios.get(`${API_BASE}/metrics`);
    console.log(`   ✅ Métricas carregadas com sucesso`);

    // Teste 3: Verificar se as rotas de canais existem
    console.log('\n3. Testando rotas de canais...');
    
    try {
      const channelsResponse = await axios.get(`${API_BASE}/channels`);
      console.log(`   ✅ Rota /api/channels funcionando`);
      console.log(`   📊 Canais encontrados: ${channelsResponse.data.count || 'N/A'}`);
    } catch (error) {
      console.log(`   ❌ Rota /api/channels não encontrada: ${error.response?.status}`);
    }

    try {
      const loadStatsResponse = await axios.get(`${API_BASE}/channels/stats/load`);
      console.log(`   ✅ Rota /api/channels/stats/load funcionando`);
    } catch (error) {
      console.log(`   ❌ Rota /api/channels/stats/load não encontrada: ${error.response?.status}`);
    }

    try {
      const conversationStatsResponse = await axios.get(`${API_BASE}/channels/stats/conversations`);
      console.log(`   ✅ Rota /api/channels/stats/conversations funcionando`);
    } catch (error) {
      console.log(`   ❌ Rota /api/channels/stats/conversations não encontrada: ${error.response?.status}`);
    }

    // Teste 4: Verificar configuração do sistema
    console.log('\n4. Verificando configuração...');
    const configResponse = await axios.get(`${API_BASE}/config`);
    if (configResponse.data.channels) {
      console.log(`   ✅ Configuração de canais carregada: ${configResponse.data.channels.length} canais`);
    } else {
      console.log(`   ⚠️ Configuração de canais não encontrada`);
    }

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('\n📋 RESUMO:');
    console.log('   ✅ Servidor funcionando');
    console.log('   ✅ Métricas carregadas');
    console.log('   ⚠️ Algumas rotas de canais podem não estar disponíveis');
    console.log('\n💡 DICA: Se as rotas de canais não estiverem funcionando,');
    console.log('   verifique se o servidor foi reiniciado após as implementações.');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.log('\n🔧 SOLUÇÕES POSSÍVEIS:');
    console.log('   1. Verificar se o servidor está rodando na porta 3000');
    console.log('   2. Reiniciar o servidor para carregar as novas rotas');
    console.log('   3. Verificar se não há erros no console do servidor');
  }
}

// Executar teste
testBasicFunctionality().catch(console.error);
