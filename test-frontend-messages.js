#!/usr/bin/env node

/**
 * Teste para verificar se o frontend está carregando as mensagens corretamente
 */

const axios = require('axios');

async function testFrontendMessages() {
  try {
    console.log('🧪 ===========================================');
    console.log('   TESTANDO CARREGAMENTO DE MENSAGENS NO FRONTEND');
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
    
    // 2. Buscar pacientes
    console.log('\n2️⃣ Buscando pacientes...');
    const patientsResponse = await axios.get(`${baseUrl}/api/patients`);
    const patients = patientsResponse.data.data;
    
    console.log(`📊 Total de pacientes: ${patients.length}`);
    
    // 3. Buscar Felipe Prado
    const felipe = patients.find(p => p.name === 'Felipe Prado');
    if (!felipe) {
      console.log('❌ Felipe Prado não encontrado');
      return;
    }
    
    console.log('✅ Felipe Prado encontrado!');
    console.log(`🆔 ID: ${felipe.id}`);
    console.log(`📱 Telefone: ${felipe.phone}`);
    
    // 4. Buscar histórico de mensagens
    console.log('\n3️⃣ Buscando histórico de mensagens...');
    const historyResponse = await axios.get(`${baseUrl}/api/messages/history`);
    const historyData = historyResponse.data.data;
    
    console.log(`📨 Total de mensagens no histórico: ${historyData.length}`);
    
    if (historyData.length > 0) {
      console.log('📋 Mensagens encontradas:');
      historyData.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg.patientName} - ${msg.messageType} - ${msg.sentAtFormatted}`);
        console.log(`      Patient ID: ${msg.patientId}`);
        console.log(`      Action Card: ${msg.actionCardId}`);
      });
    }
    
    // 5. Verificar se há mensagem para o Felipe
    console.log('\n4️⃣ Verificando mensagens do Felipe...');
    const felipeMessages = historyData.filter(msg => msg.patientId === felipe.id);
    
    if (felipeMessages.length > 0) {
      console.log(`✅ ${felipeMessages.length} mensagem(ns) encontrada(s) para o Felipe!`);
      felipeMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. Tipo: ${msg.messageType}`);
        console.log(`      Horário: ${msg.sentAtFormatted}`);
        console.log(`      Action Card: ${msg.actionCardId}`);
        console.log(`      Sucesso: ${msg.success}`);
      });
    } else {
      console.log('❌ Nenhuma mensagem encontrada para o Felipe');
      console.log('🔍 Verificando IDs...');
      console.log(`   Felipe ID: ${felipe.id}`);
      console.log(`   IDs nas mensagens: ${historyData.map(m => m.patientId).join(', ')}`);
    }
    
    // 6. Simular o que o frontend deveria fazer
    console.log('\n5️⃣ Simulando lógica do frontend...');
    
    // Associar mensagens aos pacientes (como o frontend faz)
    for (const patient of patients) {
      const patientMessages = historyData.filter(msg => msg.patientId === patient.id);
      if (patientMessages.length > 0) {
        const lastMessage = patientMessages.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0];
        patient.lastMessageSent = lastMessage;
        console.log(`📨 ${patient.name}: última mensagem ${lastMessage.messageType} em ${lastMessage.sentAtFormatted}`);
      }
    }
    
    // 7. Verificar se Felipe tem lastMessageSent
    console.log('\n6️⃣ Verificando se Felipe tem lastMessageSent...');
    if (felipe.lastMessageSent) {
      console.log('✅ Felipe tem lastMessageSent!');
      console.log(`📋 Dados: ${JSON.stringify(felipe.lastMessageSent, null, 2)}`);
    } else {
      console.log('❌ Felipe NÃO tem lastMessageSent');
    }
    
    console.log('\n🎯 ===========================================');
    console.log('   TESTE CONCLUÍDO');
    console.log('===========================================');
    
    if (felipe.lastMessageSent) {
      console.log('✅ Tudo funcionando! O frontend deveria exibir a mensagem.');
    } else {
      console.log('❌ Problema identificado! O frontend não está associando as mensagens.');
    }
    
  } catch (error) {
    console.error('\n❌ ===========================================');
    console.error('   ERRO NO TESTE');
    console.error('===========================================');
    console.error(`💥 Erro: ${error.message}`);
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    console.error('===========================================\n');
  }
}

// Executar teste
testFrontendMessages();
