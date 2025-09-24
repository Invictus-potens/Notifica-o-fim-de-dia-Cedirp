const fs = require('fs');
const path = require('path');

async function resetCompleto() {
  try {
    console.log('🔄 ===============================================');
    console.log('   RESET COMPLETO DO SISTEMA');
    console.log('===============================================\n');
    
    // 1. Limpar arquivo de pacientes processados
    const processedFile = path.join(__dirname, 'data', 'patients_processed.json');
    const emptyProcessed = { patients: [], lastCleanup: null, totalProcessed: 0, createdAt: new Date().toISOString() };
    fs.writeFileSync(processedFile, JSON.stringify(emptyProcessed, null, 2));
    console.log('✅ Arquivo patients_processed.json limpo');
    
    // 2. Limpar arquivo de mensagens enviadas
    const messagesFile = path.join(__dirname, 'data', 'messages_sent.json');
    const emptyMessages = { messages: [], lastCleanup: null, totalSent: 0, createdAt: new Date().toISOString() };
    fs.writeFileSync(messagesFile, JSON.stringify(emptyMessages, null, 2));
    console.log('✅ Arquivo messages_sent.json limpo');
    
    // 3. Limpar arquivo de pacientes ativos
    const activeFile = path.join(__dirname, 'data', 'patients_active.json');
    if (fs.existsSync(activeFile)) {
      fs.writeFileSync(activeFile, JSON.stringify([], null, 2));
      console.log('✅ Arquivo patients_active.json limpo');
    }
    
    // 4. Limpar arquivo de backup
    const backupFile = path.join(__dirname, 'data', 'patients_backup.json');
    if (fs.existsSync(backupFile)) {
      fs.writeFileSync(backupFile, JSON.stringify([], null, 2));
      console.log('✅ Arquivo patients_backup.json limpo');
    }
    
    console.log('\n🎯 RESET COMPLETO CONCLUÍDO!');
    console.log('📋 Todos os arquivos foram limpos');
    console.log('🚀 Execute: node test-eligibility.js para verificar');
    console.log('💡 O sistema irá buscar novos pacientes da API');
    
  } catch (error) {
    console.error('❌ Erro no reset:', error.message);
    console.error(error.stack);
  }
}

resetCompleto();
