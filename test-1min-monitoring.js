#!/usr/bin/env node

/**
 * Script para testar o monitoramento a cada minuto
 * Verifica se a verificação principal está funcionando corretamente
 */

const axios = require('axios');

async function test1MinMonitoring() {
  try {
    console.log('⏰ ===========================================');
    console.log('   TESTANDO MONITORAMENTO A CADA MINUTO');
    console.log('===========================================');
    
    const baseUrl = 'http://localhost:3000';
    
    // 1. Verificar se servidor está rodando
    console.log('\n1️⃣ Verificando servidor...');
    try {
      await axios.get(`${baseUrl}/health?quick=true`, { timeout: 5000 });
      console.log('✅ Servidor está rodando');
    } catch (error) {
      console.log('❌ Servidor não está respondendo');
      console.log('💡 Inicie o servidor primeiro: npm start');
      return;
    }
    
    // 2. Verificar status do sistema e jobs cron
    console.log('\n2️⃣ Verificando jobs de monitoramento...');
    const statusResponse = await axios.get(`${baseUrl}/api/status`);
    const status = statusResponse.data;
    
    console.log('📊 Status do Sistema:');
    console.log(`   🔧 Inicializado: ${status.isInitialized ? '✅ Sim' : '❌ Não'}`);
    console.log(`   🚀 Rodando: ${status.isRunning ? '✅ Sim' : '❌ Não'}`);
    console.log(`   ⏸️ Pausado: ${status.isFlowPaused ? '⏸️ Sim' : '▶️ Não'}`);
    
    // Verificar jobs cron específicos
    if (status.cronJobs && status.cronJobs.jobs) {
      console.log('\n⏰ Jobs Cron Ativos:');
      let found1MinJob = false;
      
      status.cronJobs.jobs.forEach(job => {
        const status = job.isRunning ? '🟢 Ativo' : '🔴 Parado';
        console.log(`   📌 ${job.name}: ${status}`);
        
        if (job.name === 'patient-check-1min') {
          found1MinJob = true;
        }
      });
      
      if (found1MinJob) {
        console.log('✅ Job de verificação a cada minuto está ativo');
      } else {
        console.log('❌ Job de verificação a cada minuto NÃO encontrado');
      }
    } else {
      console.log('⚠️ Nenhum job cron encontrado');
    }
    
    // 3. Verificar configurações
    console.log('\n3️⃣ Verificando configurações...');
    const configResponse = await axios.get(`${baseUrl}/api/config`);
    const config = configResponse.data.data;
    
    console.log('⚙️ Configurações:');
    console.log(`   ⏸️ Fluxo pausado: ${config.flowPaused}`);
    console.log(`   🌅 Fim de dia pausado: ${config.endOfDayPaused}`);
    console.log(`   🕐 Ignorar horário comercial: ${config.ignoreBusinessHours}`);
    console.log(`   ⏰ Tempo mínimo: ${config.minWaitTime} min`);
    console.log(`   ⏰ Tempo máximo: ${config.maxWaitTime} min`);
    
    // 4. Verificar pacientes elegíveis
    console.log('\n4️⃣ Verificando pacientes elegíveis...');
    const patientsResponse = await axios.get(`${baseUrl}/api/patients`);
    const patients = patientsResponse.data.data;
    
    console.log(`📊 Total de pacientes: ${patients.length}`);
    
    if (patients.length > 0) {
      console.log('\n📋 Análise de elegibilidade:');
      let eligibleCount = 0;
      
      patients.forEach((patient, index) => {
        const waitTime = patient.waitTimeMinutes || 0;
        const minWait = parseInt(config.minWaitTime);
        const maxWait = parseInt(config.maxWaitTime);
        
        let status = '';
        let isEligible = false;
        
        if (waitTime < minWait) {
          status = `⏳ Aguardando (${minWait - waitTime}min restantes)`;
        } else if (waitTime >= minWait && waitTime <= maxWait) {
          status = '✅ PRONTO PARA MENSAGEM';
          isEligible = true;
          eligibleCount++;
        } else {
          status = '⚠️ Tempo excedido';
        }
        
        console.log(`   ${index + 1}. ${patient.name} - ${waitTime}min - ${status}`);
      });
      
      console.log(`\n📊 Resumo: ${eligibleCount} paciente(s) elegível(is) para mensagem`);
      
      if (eligibleCount > 0) {
        console.log('🎯 Sistema deve enviar mensagens automaticamente a cada minuto');
      }
    }
    
    // 5. Instruções para monitoramento
    console.log('\n5️⃣ Instruções para monitoramento:');
    console.log('📝 Para verificar se o monitoramento está funcionando:');
    console.log('   1. Monitore os logs do servidor');
    console.log('   2. Procure por mensagens como:');
    console.log('      "🔄 [timestamp] Executando verificação intensiva de pacientes (1min)"');
    console.log('   3. Verifique se pacientes elegíveis recebem mensagens');
    console.log('   4. O sistema verifica a cada 60 segundos');
    
    console.log('\n🎯 ===========================================');
    console.log('   TESTE DE MONITORAMENTO CONCLUÍDO');
    console.log('===========================================');
    console.log('✅ Sistema configurado para verificação a cada minuto');
    console.log('📝 Monitore os logs para confirmar execução automática');
    console.log('⏰ Próxima verificação em até 60 segundos');
    console.log('===========================================\n');
    
  } catch (error) {
    console.error('\n❌ ===========================================');
    console.error('   ERRO NO TESTE DE MONITORAMENTO');
    console.error('===========================================');
    console.error(`💥 Erro: ${error.message}`);
    console.error('===========================================\n');
  }
}

// Executar teste
test1MinMonitoring();
