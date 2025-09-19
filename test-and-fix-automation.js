#!/usr/bin/env node

/**
 * Script para testar e corrigir problemas de automação
 * Verifica configurações e ativa a automação se necessário
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

async function testAndFixAutomation() {
  try {
    console.log('🔧 ===========================================');
    console.log('   TESTANDO E CORRIGINDO AUTOMAÇÃO');
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
    
    // 2. Verificar configurações atuais
    console.log('\n2️⃣ Verificando configurações atuais...');
    const configResponse = await axios.get(`${baseUrl}/api/config`);
    const config = configResponse.data.data;
    
    console.log('📋 Configurações atuais:');
    console.log(`   ⏸️ Fluxo pausado: ${config.flowPaused}`);
    console.log(`   🌅 Fim de dia pausado: ${config.endOfDayPaused}`);
    console.log(`   🕐 Ignorar horário comercial: ${config.ignoreBusinessHours}`);
    console.log(`   ⏰ Tempo mínimo: ${config.minWaitTime} min`);
    console.log(`   ⏰ Tempo máximo: ${config.maxWaitTime} min`);
    
    // 3. Corrigir configurações se necessário
    console.log('\n3️⃣ Corrigindo configurações...');
    const updates = {};
    
    if (config.flowPaused === 'true' || config.flowPaused === true) {
      updates.flowPaused = 'false';
      console.log('   ✅ Despausando fluxo...');
    }
    
    if (config.endOfDayPaused === 'true' || config.endOfDayPaused === true) {
      updates.endOfDayPaused = 'false';
      console.log('   ✅ Ativando mensagens de fim de dia...');
    }
    
    if (Object.keys(updates).length > 0) {
      await axios.post(`${baseUrl}/api/config`, updates);
      console.log('✅ Configurações atualizadas com sucesso');
    } else {
      console.log('✅ Configurações já estão corretas');
    }
    
    // 4. Verificar status do sistema
    console.log('\n4️⃣ Verificando status do sistema...');
    const statusResponse = await axios.get(`${baseUrl}/api/status`);
    const status = statusResponse.data;
    
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
    }
    
    // 5. Testar envio manual
    console.log('\n5️⃣ Testando envio manual...');
    try {
      const testData = {
        patients: [{
          number: "16981892476",
          contactId: "test_contact_" + Date.now(),
          name: "TESTE AUTOMAÇÃO CORRIGIDA"
        }],
        action_card_id: config.selectedActionCard30Min || "631f2b4f307d23f46ac80a2b"
      };
      
      const response = await axios.post(`${baseUrl}/api/messages/send-action-card`, testData);
      const result = response.data.data;
      
      console.log('📤 Resultado do teste manual:');
      console.log(`   ✅ Sucessos: ${result.success}`);
      console.log(`   ❌ Falhas: ${result.failed}`);
      
      if (result.success > 0) {
        console.log('🎉 ENVIO MANUAL FUNCIONANDO!');
      }
      
    } catch (error) {
      console.log('❌ Erro no teste manual:', error.message);
    }
    
    // 6. Verificar pacientes
    console.log('\n6️⃣ Verificando pacientes...');
    try {
      const patientsResponse = await axios.get(`${baseUrl}/api/patients`);
      const patients = patientsResponse.data.data;
      
      console.log(`📊 Pacientes encontrados: ${patients.length}`);
      
      if (patients.length > 0) {
        console.log('\n📋 Pacientes elegíveis:');
        patients.slice(0, 5).forEach((patient, index) => {
          const waitTime = patient.waitTimeMinutes || 0;
          const minWait = parseInt(config.minWaitTime);
          const maxWait = parseInt(config.maxWaitTime);
          
          let status = '';
          if (waitTime < minWait) {
            status = `⏳ Aguardando (${minWait - waitTime}min restantes)`;
          } else if (waitTime >= minWait && waitTime <= maxWait) {
            status = '✅ PRONTO PARA MENSAGEM';
          } else {
            status = '⚠️ Tempo excedido';
          }
          
          console.log(`   ${index + 1}. ${patient.name} - ${waitTime}min - ${status}`);
        });
      }
      
    } catch (error) {
      console.log('❌ Erro ao obter pacientes:', error.message);
    }
    
    console.log('\n🎯 ===========================================');
    console.log('   DIAGNÓSTICO E CORREÇÃO CONCLUÍDOS');
    console.log('===========================================');
    console.log('✅ Configurações verificadas e corrigidas');
    console.log('✅ Sistema de automação deve estar funcionando');
    console.log('📝 Monitore os logs para verificar execução automática');
    console.log('===========================================\n');
    
  } catch (error) {
    console.error('\n❌ ===========================================');
    console.error('   ERRO NO TESTE E CORREÇÃO');
    console.error('===========================================');
    console.error(`💥 Erro: ${error.message}`);
    console.error('===========================================\n');
  }
}

// Executar teste e correção
testAndFixAutomation();
