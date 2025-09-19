#!/usr/bin/env node

/**
 * Teste para verificar se a correção do payload funcionou
 */

const axios = require('axios');

async function testPayloadFix() {
  try {
    console.log('🧪 ===========================================');
    console.log('   TESTANDO CORREÇÃO DO PAYLOAD');
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
    
    // 2. Buscar Felipe Prado
    console.log('\n2️⃣ Buscando Felipe Prado...');
    const patientsResponse = await axios.get(`${baseUrl}/api/patients`);
    const patients = patientsResponse.data.data;
    
    const felipe = patients.find(p => p.name === 'Felipe Prado');
    if (!felipe) {
      console.log('❌ Felipe Prado não encontrado');
      return;
    }
    
    console.log('✅ Felipe Prado encontrado!');
    console.log(`📱 Telefone: ${felipe.phone}`);
    console.log(`🆔 Contact ID: ${felipe.contactId}`);
    
    // 3. Testar envio com payload corrigido
    console.log('\n3️⃣ Testando envio com payload corrigido...');
    const testData = {
      patients: [{
        number: felipe.phone,
        contactId: felipe.contactId,
        name: felipe.name
      }],
      action_card_id: "68cbfa96b8640e9721e4feab"
    };
    
    console.log('📤 Enviando mensagem de teste...');
    console.log('📋 Payload:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(`${baseUrl}/api/messages/send-action-card`, testData);
    const result = response.data.data;
    
    console.log('📊 Resultado:');
    console.log(`   ✅ Sucessos: ${result.success}`);
    console.log(`   ❌ Falhas: ${result.failed}`);
    
    if (result.success > 0) {
      console.log('🎉 MENSAGEM ENVIADA COM SUCESSO!');
      console.log('✅ Payload corrigido funcionou!');
      
      // 4. Verificar se foi registrada no histórico
      console.log('\n4️⃣ Verificando se foi registrada no histórico...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const historyResponse = await axios.get(`${baseUrl}/api/messages/history`);
      const historyData = historyResponse.data.data;
      
      if (historyData && historyData.length > 0) {
        console.log('✅ Mensagem registrada no histórico!');
        console.log(`📨 Total de mensagens: ${historyData.length}`);
        
        const felipeMessage = historyData.find(msg => msg.patientId === felipe.id);
        if (felipeMessage) {
          console.log('✅ Mensagem do Felipe encontrada no histórico!');
          console.log(`📋 Tipo: ${felipeMessage.messageType}`);
          console.log(`⏰ Horário: ${felipeMessage.sentAtFormatted}`);
        }
      } else {
        console.log('❌ Mensagem não foi registrada no histórico');
      }
      
    } else {
      console.log('❌ MENSAGEM NÃO FOI ENVIADA');
      console.log('🔍 Verifique os logs do servidor para mais detalhes');
    }
    
    console.log('\n🎯 ===========================================');
    console.log('   TESTE CONCLUÍDO');
    console.log('===========================================');
    
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
testPayloadFix();
