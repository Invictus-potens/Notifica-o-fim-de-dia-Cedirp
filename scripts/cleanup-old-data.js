const fs = require('fs');
const path = require('path');

/**
 * Script para limpeza de dados antigos
 * - Remove pacientes com mais de 1 dia
 * - Limpa dados de fim de dia (18h)
 * - Mantém backup antes da limpeza
 */

class DataCleanup {
  constructor() {
    this.dataDir = './data';
    this.files = {
      active: path.join(this.dataDir, 'patients_active.json'),
      processed: path.join(this.dataDir, 'patients_processed.json'),
      history: path.join(this.dataDir, 'patients_history.json'),
      backup: path.join(this.dataDir, 'patients_backup.json')
    };
  }

  /**
   * Verifica se um paciente é antigo (mais de 1 dia)
   */
  isOldPatient(patient) {
    if (!patient.enteredAt) return false;
    
    const enteredDate = new Date(patient.enteredAt);
    const now = new Date();
    const daysDiff = (now - enteredDate) / (1000 * 60 * 60 * 24);
    
    return daysDiff > 1; // Mais de 1 dia
  }

  /**
   * Limpa pacientes antigos de um arquivo
   */
  async cleanOldPatients(filePath, fileName) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Arquivo não encontrado: ${fileName}`);
        return { removed: 0, kept: 0 };
      }

      console.log(`\n🧹 Limpando ${fileName}...`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      let patients = [];
      
      try {
        patients = JSON.parse(content);
      } catch (error) {
        console.log(`❌ Erro ao fazer parse do ${fileName}: ${error.message}`);
        return { removed: 0, kept: 0 };
      }

      if (!Array.isArray(patients)) {
        console.log(`⚠️ ${fileName} não é um array válido`);
        return { removed: 0, kept: 0 };
      }

      const oldPatients = patients.filter(patient => this.isOldPatient(patient));
      const recentPatients = patients.filter(patient => !this.isOldPatient(patient));

      // Salvar apenas pacientes recentes
      fs.writeFileSync(filePath, JSON.stringify(recentPatients, null, 2));
      
      console.log(`✅ ${fileName}: ${oldPatients.length} removidos, ${recentPatients.length} mantidos`);
      
      // Log dos pacientes removidos
      if (oldPatients.length > 0) {
        console.log(`   📋 Pacientes removidos (antigos):`);
        oldPatients.forEach(patient => {
          const daysOld = Math.floor((new Date() - new Date(patient.enteredAt)) / (1000 * 60 * 60 * 24));
          console.log(`   - ${patient.name} (${patient.phone}) - ${daysOld} dias`);
        });
      }
      
      return { removed: oldPatients.length, kept: recentPatients.length };
      
    } catch (error) {
      console.error(`❌ Erro ao limpar ${fileName}:`, error.message);
      return { removed: 0, kept: 0 };
    }
  }

  /**
   * Limpa todos os dados (para fim de dia)
   */
  async clearAllData() {
    console.log('\n🌅 LIMPEZA DE FIM DE DIA - Removendo todos os dados...\n');
    
    let totalRemoved = 0;
    
    for (const [type, filePath] of Object.entries(this.files)) {
      try {
        if (!fs.existsSync(filePath)) continue;
        
        const content = fs.readFileSync(filePath, 'utf8');
        const patients = JSON.parse(content);
        
        if (Array.isArray(patients)) {
          totalRemoved += patients.length;
        }
        
        // Limpar arquivo
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        console.log(`🧹 ${type}: limpo (${patients.length} pacientes removidos)`);
        
      } catch (error) {
        console.error(`❌ Erro ao limpar ${type}:`, error.message);
      }
    }
    
    console.log(`\n✅ Limpeza de fim de dia concluída: ${totalRemoved} pacientes removidos`);
    return totalRemoved;
  }

  /**
   * Cria backup antes da limpeza
   */
  async createCleanupBackup() {
    try {
      const backupDir = path.join(this.dataDir, 'backup_cleanup');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `cleanup_backup_${timestamp}.json`);
      
      // Criar backup consolidado
      const backup = {
        timestamp: new Date().toISOString(),
        type: 'cleanup_backup',
        files: {}
      };

      for (const [type, filePath] of Object.entries(this.files)) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          backup.files[type] = JSON.parse(content);
        }
      }

      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
      console.log(`💾 Backup de limpeza criado: ${backupFile}`);
      
    } catch (error) {
      console.error('❌ Erro ao criar backup de limpeza:', error.message);
    }
  }

  /**
   * Executa limpeza de dados antigos
   */
  async runOldDataCleanup() {
    console.log('🧹 INICIANDO LIMPEZA DE DADOS ANTIGOS...\n');
    
    // Criar backup primeiro
    await this.createCleanupBackup();
    
    let totalRemoved = 0;
    let totalKept = 0;
    
    // Limpar cada arquivo
    const results = await Promise.all([
      this.cleanOldPatients(this.files.active, 'patients_active.json'),
      this.cleanOldPatients(this.files.processed, 'patients_processed.json'),
      this.cleanOldPatients(this.files.history, 'patients_history.json'),
      this.cleanOldPatients(this.files.backup, 'patients_backup.json')
    ]);
    
    // Calcular totais
    results.forEach(result => {
      totalRemoved += result.removed;
      totalKept += result.kept;
    });
    
    console.log(`\n🎯 RESUMO DA LIMPEZA:`);
    console.log(`   🗑️ Total de pacientes removidos (antigos): ${totalRemoved}`);
    console.log(`   📁 Total de pacientes mantidos (recentes): ${totalKept}`);
    console.log(`   📁 Arquivos processados: ${results.length}`);
    
    if (totalRemoved > 0) {
      console.log(`\n✨ Limpeza concluída com sucesso!`);
    } else {
      console.log(`\n✨ Nenhum dado antigo encontrado - dados já estão limpos!`);
    }
  }

  /**
   * Verifica estatísticas dos dados
   */
  async getDataStats() {
    console.log('\n📊 ESTATÍSTICAS DOS DADOS:\n');
    
    for (const [type, filePath] of Object.entries(this.files)) {
      if (!fs.existsSync(filePath)) {
        console.log(`📄 ${type}: arquivo não existe`);
        continue;
      }
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const patients = JSON.parse(content);
        
        if (!Array.isArray(patients)) {
          console.log(`📄 ${type}: formato inválido`);
          continue;
        }
        
        if (patients.length === 0) {
          console.log(`📄 ${type}: vazio`);
          continue;
        }
        
        // Calcular estatísticas
        const oldPatients = patients.filter(p => this.isOldPatient(p));
        const recentPatients = patients.filter(p => !this.isOldPatient(p));
        
        // Calcular idade média
        const ages = patients.map(p => {
          if (!p.enteredAt) return 0;
          return (new Date() - new Date(p.enteredAt)) / (1000 * 60 * 60 * 24);
        }).filter(age => age > 0);
        
        const avgAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : 0;
        
        console.log(`📄 ${type}:`);
        console.log(`   👥 Total: ${patients.length}`);
        console.log(`   🆕 Recentes: ${recentPatients.length}`);
        console.log(`   🗑️ Antigos: ${oldPatients.length}`);
        console.log(`   📅 Idade média: ${avgAge} dias`);
        
      } catch (error) {
        console.log(`❌ ${type}: erro ao verificar - ${error.message}`);
      }
    }
  }
}

// Executar se chamado diretamente
async function main() {
  const cleanup = new DataCleanup();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'stats':
        await cleanup.getDataStats();
        break;
        
      case 'cleanup':
        await cleanup.runOldDataCleanup();
        break;
        
      case 'clear-all':
        await cleanup.createCleanupBackup();
        await cleanup.clearAllData();
        break;
        
      default:
        console.log('🔧 Script de Limpeza de Dados JSON\n');
        console.log('Uso: node scripts/cleanup-old-data.js [comando]\n');
        console.log('Comandos disponíveis:');
        console.log('  stats     - Mostra estatísticas dos dados');
        console.log('  cleanup   - Remove dados antigos (> 1 dia)');
        console.log('  clear-all - Remove todos os dados (fim de dia)');
        console.log('\nExemplos:');
        console.log('  node scripts/cleanup-old-data.js stats');
        console.log('  node scripts/cleanup-old-data.js cleanup');
        console.log('  node scripts/cleanup-old-data.js clear-all');
        break;
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante a operação:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DataCleanup };
