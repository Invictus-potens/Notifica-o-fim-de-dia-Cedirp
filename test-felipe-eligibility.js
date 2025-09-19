#!/usr/bin/env node

/**
 * Script para testar especificamente a elegibilidade do Felipe Prado
 * Verifica se ele está sendo considerado elegível para mensagem
 */

const axios = require('axios');

async function testFelipeEligibility() {
  try {
    console.log('👤 ===========================================');
    console.log('   TESTANDO ELEGIBILIDADE DO FELIPE PRADO');
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
    
    // 2. Verificar configurações
    console.log('\n2️⃣ Verificando configurações...');
    const configResponse = await axios.get(`${baseUrl}/api/config`);
    const config = configResponse.data.data;
    
    console.log('⚙️ Configurações relevantes:');
    console.log(`   ⏸️ Fluxo pausado: ${config.flowPaused}`);
    console.log(`   🌅 Fim de dia pausado: ${config.endOfDayPaused}`);
    console.log(`   🕐 Ignorar horário comercial: ${config.ignoreBusinessHours}`);
    console.log(`   ⏰ Tempo mínimo: ${config.minWaitTime} min`);
    console.log(`   ⏰ Tempo máximo: ${config.maxWaitTime} min`);
    
    // 3. Buscar Felipe Prado especificamente
    console.log('\n3️⃣ Buscando Felipe Prado...');
    const patientsResponse = await axios.get(`${baseUrl}/api/patients`);
    const patients = patientsResponse.data.data;
    
    const felipe = patients.find(p => 
      p.name && (
        p.name.toLowerCase().includes('felipe') ||
        p.name.toLowerCase().includes('prado')
      )
    );
    
    if (!felipe) {
      console.log('❌ Felipe Prado não encontrado na lista de pacientes');
      console.log('📋 Pacientes disponíveis:');
      patients.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.name} - ${p.phone}`);
      });
      return;
    }
    
    console.log('✅ Felipe Prado encontrado!');
    console.log('📋 Dados do Felipe:');
    console.log(`   📝 Nome: ${felipe.name}`);
    console.log(`   📱 Telefone: ${felipe.phone}`);
    console.log(`   ⏰ Tempo de espera: ${felipe.waitTimeMinutes || 0} minutos`);
    console.log(`   🆔 Contact ID: ${felipe.contactId}`);
    console.log(`   🆔 Attendance ID: ${felipe.id}`);
    
    // 4. Analisar elegibilidade
    console.log('\n4️⃣ Analisando elegibilidade...');
    const waitTime = felipe.waitTimeMinutes || 0;
    const minWait = parseInt(config.minWaitTime);
    const maxWait = parseInt(config.maxWaitTime);
    
    console.log('📊 Análise de elegibilidade:');
    console.log(`   ⏰ Tempo de espera atual: ${waitTime} min`);
    console.log(`   📏 Intervalo elegível: ${minWait} - ${maxWait} min`);
    
    let isEligible = false;
    let reason = '';
    
    if (waitTime < minWait) {
      reason = `⏳ Ainda não atingiu tempo mínimo (faltam ${minWait - waitTime} min)`;
    } else if (waitTime >= minWait && waitTime <= maxWait) {
      isEligible = true;
      reason = '✅ ELEGÍVEL - dentro do intervalo de tempo';
    } else {
      reason = '⚠️ Tempo excedido (acima do máximo)';
    }
    
    console.log(`   🎯 Status: ${reason}`);
    
    // 5. Verificar outras condições
    console.log('\n5️⃣ Verificando outras condições...');
    
    // Verificar horário atual
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = domingo, 6 = sábado
    
    console.log('🕐 Informações de horário:');
    console.log(`   ⏰ Hora atual: ${hour}:${now.getMinutes().toString().padStart(2, '0')}`);
    console.log(`   📅 Dia da semana: ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][day]}`);
    console.log(`   🕐 Horário comercial (8h-18h): ${hour >= 8 && hour < 18 ? 'Sim' : 'Não'}`);
    console.log(`   📅 Dia útil: ${day >= 1 && day <= 5 ? 'Sim' : 'Não'}`);
    
    // Verificar se ignoreBusinessHours está funcionando
    const shouldIgnoreBusinessHours = config.ignoreBusinessHours === 'true' || config.ignoreBusinessHours === true;
    console.log(`   🚫 Ignorar horário comercial: ${shouldIgnoreBusinessHours ? 'Sim' : 'Não'}`);
    
    if (shouldIgnoreBusinessHours) {
      console.log('   ✅ Sistema deve funcionar 24h (ignoreBusinessHours = true)');
    } else {
      console.log('   ⚠️ Sistema só funciona em horário comercial');
    }
    
    // 6. Teste de envio manual para Felipe
    if (isEligible) {
      console.log('\n6️⃣ Testando envio manual para Felipe...');
      try {
        const testData = {
          patients: [{
            number: felipe.phone,
            contactId: felipe.contactId,
            name: felipe.name
          }],
          action_card_id: config.selectedActionCard30Min || "631f2b4f307d23f46ac80a2b"
        };
        
        const response = await axios.post(`${baseUrl}/api/messages/send-action-card`, testData);
        const result = response.data.data;
        
        console.log('📤 Resultado do teste:');
        console.log(`   ✅ Sucessos: ${result.success}`);
        console.log(`   ❌ Falhas: ${result.failed}`);
        
        if (result.success > 0) {
          console.log('🎉 ENVIO MANUAL FUNCIONOU PARA FELIPE!');
        } else if (result.failed > 0 && result.results) {
          console.log('❌ Erro no envio:');
          result.results.forEach(res => {
            if (!res.success) {
              console.log(`   🚫 ${res.error}`);
            }
          });
        }
        
      } catch (error) {
        console.log('❌ Erro no teste manual:', error.message);
      }
    }
    
    // 7. Resumo final
    console.log('\n7️⃣ Resumo Final:');
    console.log('===========================================');
    console.log(`👤 Felipe Prado: ${felipe.name}`);
    console.log(`⏰ Tempo de espera: ${waitTime} minutos`);
    console.log(`📏 Elegível: ${isEligible ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`🚫 Ignorar horário: ${shouldIgnoreBusinessHours ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`⏸️ Fluxo pausado: ${config.flowPaused === 'true' ? '⏸️ SIM' : '▶️ NÃO'}`);
    console.log(`🌅 Fim de dia pausado: ${config.endOfDayPaused === 'true' ? '⏸️ SIM' : '▶️ NÃO'}`);
    
    if (isEligible && !config.flowPaused && shouldIgnoreBusinessHours) {
      console.log('\n🎯 CONCLUSÃO: Felipe Prado DEVE receber mensagem automaticamente!');
      console.log('📝 Monitore os logs do servidor para confirmar envio automático');
    } else {
      console.log('\n⚠️ CONCLUSÃO: Felipe Prado NÃO está elegível ou há impedimentos');
      if (!isEligible) console.log('   - Tempo de espera fora do intervalo');
      if (config.flowPaused === 'true') console.log('   - Fluxo está pausado');
      if (!shouldIgnoreBusinessHours) console.log('   - Horário comercial não está sendo ignorado');
    }
    
    console.log('===========================================\n');
    
  } catch (error) {
    console.error('\n❌ ===========================================');
    console.error('   ERRO NO TESTE DE ELEGIBILIDADE');
    console.error('===========================================');
    console.error(`💥 Erro: ${error.message}`);
    console.error('===========================================\n');
  }
}

// Executar teste
testFelipeEligibility();
