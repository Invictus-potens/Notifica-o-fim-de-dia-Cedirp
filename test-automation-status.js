#!/usr/bin/env node

/**
 * Script para testar o status da automação
 * Verifica se todos os jobs estão ativos e funcionando
 */

const axios = require('axios');

async function testAutomationStatus() {
  try {
    console.log('🧪 ===========================================');
    console.log('   TESTANDO STATUS DA AUTOMAÇÃO');
    console.log('===========================================');
    
    const baseUrl = 'http://localhost:3000';
    
    // 1. Testar conexão básica
    console.log('\n1️⃣ Testando conexão com o servidor...');
    try {
      const response = await axios.get(`${baseUrl}/health?quick=true`, { timeout: 5000 });
      console.log(`✅ Servidor respondendo: ${response.status}`);
    } catch (error) {
      console.log('❌ Servidor não está respondendo');
      console.log('💡 Inicie o servidor primeiro: npm start');
      return;
    }
    
    // 2. Verificar status do sistema
    console.log('\n2️⃣ Verificando status do sistema...');
    try {
      const response = await axios.get(`${baseUrl}/api/status`);
      const status = response.data;
      
      console.log('📊 Status do Sistema:');
      console.log(`   🔧 Inicializado: ${status.isInitialized ? '✅ Sim' : '❌ Não'}`);
      console.log(`   🚀 Rodando: ${status.isRunning ? '✅ Sim' : '❌ Não'}`);
      console.log(`   ⏸️ Pausado: ${status.isFlowPaused ? '⏸️ Sim' : '▶️ Não'}`);
      
      // Verificar jobs cron
      if (status.cronJobs && status.cronJobs.jobs) {
        console.log('\n⏰ Jobs Cron:');
        status.cronJobs.jobs.forEach(job => {
          const status = job.isRunning ? '🟢 Ativo' : '🔴 Parado';
          console.log(`   📌 ${job.name}: ${status}`);
        });
      } else {
        console.log('⚠️ Nenhum job cron encontrado');
      }
      
    } catch (error) {
      console.log('❌ Erro ao obter status:', error.message);
    }
    
    // 3. Verificar configuração
    console.log('\n3️⃣ Verificando configuração...');
    try {
      const response = await axios.get(`${baseUrl}/api/config`);
      const config = response.data.data;
      
      console.log('⚙️ Configurações:');
      console.log(`   ⏰ Tempo mínimo de espera: ${config.minWaitTime} min`);
      console.log(`   ⏰ Tempo máximo de espera: ${config.maxWaitTime} min`);
      console.log(`   🕐 Ignorar horário comercial: ${config.ignoreBusinessHours ? 'Sim' : 'Não'}`);
      console.log(`   🌅 Fim de dia pausado: ${config.endOfDayPaused ? 'Sim' : 'Não'}`);
      console.log(`   🕐 Horário fim de dia: ${config.endOfDayTime}`);
      console.log(`   📋 Action Card 30min: ${config.selectedActionCard30Min || 'Não configurado'}`);
      console.log(`   📋 Action Card Fim de Dia: ${config.selectedActionCardEndDay || 'Não configurado'}`);
      
    } catch (error) {
      console.log('❌ Erro ao obter configuração:', error.message);
    }
    
    // 4. Verificar pacientes
    console.log('\n4️⃣ Verificando pacientes...');
    try {
      const response = await axios.get(`${baseUrl}/api/patients`);
      const patients = response.data.data;
      
      console.log(`📊 Pacientes encontrados: ${patients.length}`);
      
      if (patients.length > 0) {
        console.log('\n📋 Primeiros 3 pacientes:');
        patients.slice(0, 3).forEach((patient, index) => {
          console.log(`   ${index + 1}. ${patient.name} - ${patient.phone} (${patient.waitTimeMinutes || 0}min)`);
        });
      }
      
    } catch (error) {
      console.log('❌ Erro ao obter pacientes:', error.message);
    }
    
    // 5. Testar envio manual
    console.log('\n5️⃣ Testando envio manual...');
    try {
      const testData = {
        patients: [{
          number: "16981892476",
          contactId: "test_contact_" + Date.now(),
          name: "TESTE AUTOMAÇÃO"
        }],
        action_card_id: "631f2b4f307d23f46ac80a2b"
      };
      
      const response = await axios.post(`${baseUrl}/api/messages/send-action-card`, testData);
      const result = response.data.data;
      
      console.log('📤 Resultado do teste manual:');
      console.log(`   ✅ Sucessos: ${result.success}`);
      console.log(`   ❌ Falhas: ${result.failed}`);
      
      if (result.results && result.results.length > 0) {
        result.results.forEach((res, index) => {
          const status = res.success ? '✅' : '❌';
          console.log(`   ${index + 1}. ${status} ${res.number}: ${res.success ? res.message : res.error}`);
        });
      }
      
    } catch (error) {
      console.log('❌ Erro no teste manual:', error.message);
      if (error.response) {
        console.log('📋 Resposta:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log('\n🎯 ===========================================');
    console.log('   TESTE DE AUTOMAÇÃO CONCLUÍDO');
    console.log('===========================================');
    
  } catch (error) {
    console.error('\n❌ ===========================================');
    console.error('   ERRO NO TESTE DE AUTOMAÇÃO');
    console.error('===========================================');
    console.error(`💥 Erro: ${error.message}`);
    console.error('===========================================\n');
  }
}

// Executar teste
testAutomationStatus();
