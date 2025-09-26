#!/usr/bin/env node

/**
 * Script para analisar quais arquivos da pasta examples/ podem ser removidos
 * Automação de Mensagem de Espera - CAM Krolik Integration
 */

const fs = require('fs');
const path = require('path');

class ExamplesAnalyzer {
  constructor() {
    this.examplesDir = './examples';
    this.analysis = {
      essential: [],
      useful: [],
      removable: [],
      unknown: []
    };
  }

  /**
   * Analisa todos os arquivos na pasta examples/
   */
  analyzeExamples() {
    console.log('🔍 ANALISANDO ARQUIVOS DA PASTA EXAMPLES/\n');
    
    if (!fs.existsSync(this.examplesDir)) {
      console.log('❌ Pasta examples/ não encontrada');
      return;
    }

    const files = fs.readdirSync(this.examplesDir)
      .filter(file => file.endsWith('.js') || file.endsWith('.json'))
      .sort();

    console.log(`📁 Encontrados ${files.length} arquivos:\n`);

    files.forEach(file => {
      const category = this.categorizeFile(file);
      this.analysis[category].push(file);
      
      const icon = this.getCategoryIcon(category);
      console.log(`${icon} ${file}`);
    });

    this.printSummary();
    this.printRecommendations();
  }

  /**
   * Categoriza um arquivo baseado no nome e função
   */
  categorizeFile(fileName) {
    const name = fileName.toLowerCase();

    // Arquivos ESSENCIAIS - exemplos importantes para referência
    if (name.includes('action-cards-example')) return 'essential';
    if (name.includes('automatic-message-sending-example')) return 'essential';
    if (name.includes('channel-list-example')) return 'essential';
    if (name.includes('chat-list-example')) return 'essential';
    if (name.includes('krolik-api')) return 'essential';

    // Arquivos ÚTEIS - exemplos que podem ser úteis para desenvolvimento
    if (name.includes('monitoring-system')) return 'useful';
    if (name.includes('end-of-day-logic')) return 'useful';
    if (name.includes('flow-control')) return 'useful';
    if (name.includes('spam-prevention')) return 'useful';
    if (name.includes('saturday-hours')) return 'useful';
    if (name.includes('layout-side-by-side')) return 'useful';
    if (name.includes('config-layout')) return 'useful';

    // Arquivos REMOVÍVEIS - testes e debug que não são necessários em produção
    if (name.startsWith('test-')) return 'removable';
    if (name.includes('debug-')) return 'removable';
    if (name.includes('analyze-database-data')) return 'removable';
    if (name.includes('template-payload')) return 'removable';
    if (name.includes('flow-button')) return 'removable';
    if (name.includes('channels-removal')) return 'removable';
    if (name.includes('frontend-patients')) return 'removable';
    if (name.includes('send-action-card')) return 'removable';
    if (name.includes('status-response-analysis')) return 'removable';
    if (name.includes('api-response')) return 'removable';

    // Arquivos DESCONHECIDOS - requer análise manual
    return 'unknown';
  }

  /**
   * Retorna ícone para categoria
   */
  getCategoryIcon(category) {
    const icons = {
      essential: '🔒',
      useful: '⚙️',
      removable: '🗑️',
      unknown: '❓'
    };
    return icons[category] || '❓';
  }

  /**
   * Imprime resumo da análise
   */
  printSummary() {
    console.log('\n📊 RESUMO DA ANÁLISE:');
    console.log('='.repeat(50));
    
    Object.entries(this.analysis).forEach(([category, files]) => {
      if (files.length > 0) {
        const icon = this.getCategoryIcon(category);
        const categoryName = this.getCategoryName(category);
        console.log(`${icon} ${categoryName}: ${files.length} arquivos`);
        files.forEach(file => console.log(`   - ${file}`));
        console.log('');
      }
    });
  }

  /**
   * Retorna nome legível da categoria
   */
  getCategoryName(category) {
    const names = {
      essential: 'ESSENCIAIS (manter)',
      useful: 'ÚTEIS (considerar manter)',
      removable: 'REMOVÍVEIS (podem deletar)',
      unknown: 'DESCONHECIDOS (analisar)'
    };
    return names[category] || category;
  }

  /**
   * Imprime recomendações
   */
  printRecommendations() {
    console.log('💡 RECOMENDAÇÕES:');
    console.log('='.repeat(50));
    
    if (this.analysis.essential.length > 0) {
      console.log('🔒 MANTENHA estes exemplos essenciais:');
      this.analysis.essential.forEach(file => console.log(`   ✅ ${file}`));
      console.log('');
    }

    if (this.analysis.useful.length > 0) {
      console.log('⚙️ CONSIDERE manter estes exemplos úteis:');
      this.analysis.useful.forEach(file => console.log(`   ⚠️ ${file}`));
      console.log('');
    }

    if (this.analysis.removable.length > 0) {
      console.log('🗑️ PODE DELETAR estes arquivos:');
      this.analysis.removable.forEach(file => console.log(`   ❌ ${file}`));
      console.log('');
    }

    if (this.analysis.unknown.length > 0) {
      console.log('❓ ANALISE MANUALMENTE estes arquivos:');
      this.analysis.unknown.forEach(file => console.log(`   ❓ ${file}`));
      console.log('');
    }

    console.log('🚀 COMANDO PARA REMOVER ARQUIVOS DESNECESSÁRIOS:');
    if (this.analysis.removable.length > 0) {
      console.log('node scripts/cleanup-examples.js remove');
    } else {
      console.log('Nenhum arquivo identificado para remoção automática');
    }
  }

  /**
   * Cria script de limpeza automática
   */
  createCleanupScript() {
    const cleanupScript = `#!/usr/bin/env node

/**
 * Script para remover arquivos desnecessários da pasta examples/
 * Gerado automaticamente pelo ExamplesAnalyzer
 */

const fs = require('fs');
const path = require('path');

const filesToRemove = ${JSON.stringify(this.analysis.removable, null, 2)};

function removeFiles() {
  console.log('🗑️ REMOVENDO ARQUIVOS DESNECESSÁRIOS DA PASTA EXAMPLES/...\\n');
  
  let removed = 0;
  let errors = 0;
  
  filesToRemove.forEach(file => {
    const filePath = path.join('./examples', file);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(\`✅ Removido: \${file}\`);
        removed++;
      } else {
        console.log(\`⚠️ Não encontrado: \${file}\`);
      }
    } catch (error) {
      console.log(\`❌ Erro ao remover \${file}: \${error.message}\`);
      errors++;
    }
  });
  
  console.log(\`\\n📊 RESUMO:\`);
  console.log(\`   ✅ Removidos: \${removed}\`);
  console.log(\`   ❌ Erros: \${errors}\`);
  console.log(\`   📁 Total processados: \${filesToRemove.length}\`);
  
  if (removed > 0) {
    console.log(\`\\n🎉 Limpeza concluída! \${removed} arquivos removidos da pasta examples/.\`);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'remove') {
    removeFiles();
  } else {
    console.log('Uso: node scripts/cleanup-examples.js remove');
    console.log('\\nArquivos que serão removidos:');
    filesToRemove.forEach(file => console.log(\`   - \${file}\`));
  }
}

module.exports = { removeFiles };
`;

    fs.writeFileSync('./scripts/cleanup-examples.js', cleanupScript);
    console.log('✅ Script de limpeza criado: scripts/cleanup-examples.js');
  }

  /**
   * Calcula tamanho total dos arquivos removíveis
   */
  calculateSizeSavings() {
    let totalSize = 0;
    
    this.analysis.removable.forEach(file => {
      const filePath = path.join(this.examplesDir, file);
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        }
      } catch (error) {
        // Ignorar erros de arquivo
      }
    });
    
    return this.formatBytes(totalSize);
  }

  /**
   * Formata bytes em formato legível
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Executar análise
async function main() {
  const analyzer = new ExamplesAnalyzer();
  
  try {
    analyzer.analyzeExamples();
    
    // Mostrar economia de espaço
    const sizeSavings = analyzer.calculateSizeSavings();
    if (analyzer.analysis.removable.length > 0) {
      console.log(`💾 ECONOMIA DE ESPAÇO: ${sizeSavings}\n`);
    }
    
    // Criar script de limpeza se houver arquivos removíveis
    if (analyzer.analysis.removable.length > 0) {
      analyzer.createCleanupScript();
    }
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ExamplesAnalyzer };
