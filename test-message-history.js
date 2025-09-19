#!/usr/bin/env node

/**
 * Teste simples para verificar se o MessageHistoryManager está funcionando
 */

const { MessageHistoryManager } = require('./src/services/MessageHistoryManager');

// Mock do errorHandler
const mockErrorHandler = {
  logError: (error, context) => {
    console.error(`❌ Erro em ${context}:`, error.message);
  }
};

async function testMessageHistory() {
  try {
    console.log('🧪 ===========================================');
    console.log('   TESTANDO MESSAGEHISTORYMANAGER');
    console.log('===========================================');
    
    // 1. Criar instância
    console.log('\n1️⃣ Criando instância do MessageHistoryManager...');
    const messageHistory = new MessageHistoryManager(mockErrorHandler);
    console.log('✅ Instância criada com sucesso');
    
    // 2. Verificar se arquivo foi criado
    console.log('\n2️⃣ Verificando se arquivo foi criado...');
    const fs = require('fs');
    const path = require('path');
    const messagesFile = path.join('./data', 'messages_sent.json');
    
    if (fs.existsSync(messagesFile)) {
      console.log('✅ Arquivo messages_sent.json foi criado');
      const content = fs.readFileSync(messagesFile, 'utf8');
      const data = JSON.parse(content);
      console.log('📄 Conteúdo inicial:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Arquivo messages_sent.json NÃO foi criado');
      return;
    }
    
    // 3. Testar registro de mensagem
    console.log('\n3️⃣ Testando registro de mensagem...');
    const testMessage = {
      patientId: 'test_patient_123',
      patientName: 'Teste Paciente',
      patientPhone: '5511999999999',
      actionCardId: 'test_card_123',
      messageType: 'test',
      sentAt: new Date(),
      success: true
    };
    
    const recordedMessage = await messageHistory.recordMessageSent(testMessage);
    console.log('✅ Mensagem registrada:', JSON.stringify(recordedMessage, null, 2));
    
    // 4. Verificar se foi salvo no arquivo
    console.log('\n4️⃣ Verificando se foi salvo no arquivo...');
    const updatedContent = fs.readFileSync(messagesFile, 'utf8');
    const updatedData = JSON.parse(updatedContent);
    console.log('📄 Conteúdo atualizado:', JSON.stringify(updatedData, null, 2));
    
    // 5. Testar busca de mensagens
    console.log('\n5️⃣ Testando busca de mensagens...');
    const patientMessages = messageHistory.getMessagesForPatient('test_patient_123');
    console.log('📨 Mensagens encontradas:', patientMessages.length);
    
    // 6. Testar estatísticas
    console.log('\n6️⃣ Testando estatísticas...');
    const stats = messageHistory.getStats();
    console.log('📊 Estatísticas:', JSON.stringify(stats, null, 2));
    
    console.log('\n🎉 ===========================================');
    console.log('   TESTE CONCLUÍDO COM SUCESSO!');
    console.log('===========================================');
    
  } catch (error) {
    console.error('\n❌ ===========================================');
    console.error('   ERRO NO TESTE');
    console.error('===========================================');
    console.error(`💥 Erro: ${error.message}`);
    console.error('Stack:', error.stack);
    console.error('===========================================\n');
  }
}

// Executar teste
testMessageHistory();
