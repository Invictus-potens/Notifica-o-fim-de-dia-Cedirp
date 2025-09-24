const fs = require('fs');
const path = require('path');

async function resetPatients() {
  try {
    console.log('🔄 ===============================================');
    console.log('   RESET DE PACIENTES PROCESSADOS');
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
    
    // 3. Verificar arquivo de pacientes ativos
    const activeFile = path.join(__dirname, 'data', 'patients_active.json');
    if (fs.existsSync(activeFile)) {
      const activeData = JSON.parse(fs.readFileSync(activeFile, 'utf8'));
      console.log(`📋 Pacientes ativos encontrados: ${activeData.length}`);
      
      // Atualizar status dos pacientes para não processados
      const updatedPatients = activeData.map(patient => ({
        ...patient,
        status: 'waiting',
        processed: false
      }));
      
      fs.writeFileSync(activeFile, JSON.stringify(updatedPatients, null, 2));
      console.log('✅ Status dos pacientes ativos resetado');
    }
    
    console.log('\n🎯 RESET CONCLUÍDO!');
    console.log('📋 Agora os pacientes podem receber mensagens novamente');
    console.log('🚀 Execute: node test-eligibility.js para verificar');
    
  } catch (error) {
    console.error('❌ Erro no reset:', error.message);
    console.error(error.stack);
  }
}

resetPatients();
