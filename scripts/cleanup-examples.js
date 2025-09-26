#!/usr/bin/env node

/**
 * Script para remover arquivos desnecessários da pasta examples/
 * Gerado automaticamente pelo ExamplesAnalyzer
 */

const fs = require('fs');
const path = require('path');

const filesToRemove = [
  "analyze-database-data.js",
  "debug-api-response.js",
  "debug-template-payload.js",
  "status-response-analysis.json",
  "test-channels-removal.js",
  "test-flow-button-integration.js",
  "test-flow-button-status.js",
  "test-frontend-patients.js",
  "test-send-action-card.js"
];

function removeFiles() {
  console.log('🗑️ REMOVENDO ARQUIVOS DESNECESSÁRIOS DA PASTA EXAMPLES/...\n');
  
  let removed = 0;
  let errors = 0;
  
  filesToRemove.forEach(file => {
    const filePath = path.join('./examples', file);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Removido: ${file}`);
        removed++;
      } else {
        console.log(`⚠️ Não encontrado: ${file}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao remover ${file}: ${error.message}`);
      errors++;
    }
  });
  
  console.log(`\n📊 RESUMO:`);
  console.log(`   ✅ Removidos: ${removed}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`   📁 Total processados: ${filesToRemove.length}`);
  
  if (removed > 0) {
    console.log(`\n🎉 Limpeza concluída! ${removed} arquivos removidos da pasta examples/.`);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'remove') {
    removeFiles();
  } else {
    console.log('Uso: node scripts/cleanup-examples.js remove');
    console.log('\nArquivos que serão removidos:');
    filesToRemove.forEach(file => console.log(`   - ${file}`));
  }
}

module.exports = { removeFiles };
