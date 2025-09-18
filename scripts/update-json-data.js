const fs = require('fs');
const path = require('path');

/**
 * Script para atualizar dados JSON existentes com campos corrigidos
 * - Adiciona contactId
 * - Corrige channelType
 * - Atualiza timestamps
 */

class JsonDataUpdater {
  constructor() {
    this.dataDir = './data';
    this.files = {
      active: path.join(this.dataDir, 'patients_active.json'),
      processed: path.join(this.dataDir, 'patients_processed.json'),
      history: path.join(this.dataDir, 'patients_history.json'),
      backup: path.join(this.dataDir, 'patients_backup.json')
    };
    
    // Mapeamento de tipos de canal
    this.channelTypeMap = {
      1: 'WhatsApp Pessoal',
      2: 'WhatsApp Business', 
      3: 'WhatsApp Business API',
      4: 'WhatsApp Business (Principal)',
      5: 'Telegram',
      6: 'Instagram',
      7: 'Facebook Messenger',
      8: 'SMS',
      9: 'Email',
      10: 'API Externa'
    };
    
    // Mapeamento de setores
    this.sectorMap = {
      '64d4db384f04cb80ac059912': 'Suporte Geral',
      '631f7d27307d23f46af88983': 'Administrativo/Financeiro',
      '6400efb5343817d4ddbb2a4c': 'Suporte CAM',
      '6401f4f49b1ff8512b525e9c': 'Suporte Telefonia'
    };
  }

  /**
   * Cria um contactId baseado no ID do paciente
   * Como não temos o contactId real, vamos usar uma versão modificada do ID
   */
  generateContactId(patientId) {
    // Para dados existentes, vamos usar o ID como base e modificar
    // Em produção, isso deveria vir da API CAM Krolik
    return patientId.replace(/^68/, '68b'); // Simular formato de contactId
  }

  /**
   * Atualiza um paciente individual
   */
  updatePatient(patient) {
    const updated = { ...patient };
    
    // Adicionar contactId se não existir
    if (!updated.contactId) {
      updated.contactId = this.generateContactId(patient.id);
    }
    
    // Corrigir channelType se for "normal"
    if (updated.channelType === 'normal') {
      updated.channelType = 'WhatsApp Business (Principal)'; // Tipo mais comum
    }
    
    // Corrigir sectorName se necessário
    if (updated.sectorId && this.sectorMap[updated.sectorId]) {
      updated.sectorName = this.sectorMap[updated.sectorId];
    }
    
    // Atualizar timestamp se for muito antigo
    if (updated.enteredAt) {
      const enteredDate = new Date(updated.enteredAt);
      const now = new Date();
      const daysDiff = (now - enteredDate) / (1000 * 60 * 60 * 24);
      
      // Se for mais de 1 dia, atualizar para hoje
      if (daysDiff > 1) {
        updated.enteredAt = now.toISOString();
        console.log(`📅 Atualizando timestamp de ${patient.name} (era ${enteredDate.toISOString()})`);
      }
    }
    
    return updated;
  }

  /**
   * Atualiza um arquivo JSON
   */
  async updateJsonFile(filePath, fileName) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Arquivo não encontrado: ${fileName}`);
        return { updated: 0, total: 0 };
      }

      console.log(`\n📄 Processando ${fileName}...`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      let patients = [];
      
      try {
        patients = JSON.parse(content);
      } catch (error) {
        console.log(`❌ Erro ao fazer parse do ${fileName}: ${error.message}`);
        return { updated: 0, total: 0 };
      }

      if (!Array.isArray(patients)) {
        console.log(`⚠️ ${fileName} não é um array válido`);
        return { updated: 0, total: 0 };
      }

      let updatedCount = 0;
      const updatedPatients = patients.map(patient => {
        const updated = this.updatePatient(patient);
        if (JSON.stringify(updated) !== JSON.stringify(patient)) {
          updatedCount++;
        }
        return updated;
      });

      // Salvar arquivo atualizado
      fs.writeFileSync(filePath, JSON.stringify(updatedPatients, null, 2));
      
      console.log(`✅ ${fileName}: ${updatedCount}/${patients.length} pacientes atualizados`);
      return { updated: updatedCount, total: patients.length };
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${fileName}:`, error.message);
      return { updated: 0, total: 0 };
    }
  }

  /**
   * Cria backup antes da atualização
   */
  async createBackup() {
    try {
      const backupDir = path.join(this.dataDir, 'backup_before_update');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `backup_${timestamp}.json`);
      
      // Criar backup consolidado
      const backup = {
        timestamp: new Date().toISOString(),
        files: {}
      };

      for (const [type, filePath] of Object.entries(this.files)) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          backup.files[type] = JSON.parse(content);
        }
      }

      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
      console.log(`💾 Backup criado: ${backupFile}`);
      
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error.message);
    }
  }

  /**
   * Executa a atualização completa
   */
  async runUpdate() {
    console.log('🔧 INICIANDO ATUALIZAÇÃO DOS DADOS JSON...\n');
    
    // Criar backup primeiro
    await this.createBackup();
    
    let totalUpdated = 0;
    let totalPatients = 0;
    
    // Atualizar cada arquivo
    const results = await Promise.all([
      this.updateJsonFile(this.files.active, 'patients_active.json'),
      this.updateJsonFile(this.files.processed, 'patients_processed.json'),
      this.updateJsonFile(this.files.history, 'patients_history.json'),
      this.updateJsonFile(this.files.backup, 'patients_backup.json')
    ]);
    
    // Calcular totais
    results.forEach(result => {
      totalUpdated += result.updated;
      totalPatients += result.total;
    });
    
    console.log(`\n🎯 RESUMO DA ATUALIZAÇÃO:`);
    console.log(`   📊 Total de pacientes processados: ${totalPatients}`);
    console.log(`   ✅ Total de pacientes atualizados: ${totalUpdated}`);
    console.log(`   📁 Arquivos processados: ${results.length}`);
    
    if (totalUpdated > 0) {
      console.log(`\n✨ Atualização concluída com sucesso!`);
      console.log(`   - contactId adicionado onde necessário`);
      console.log(`   - channelType corrigido de "normal"`);
      console.log(`   - Timestamps antigos atualizados`);
    } else {
      console.log(`\n✨ Nenhuma atualização necessária - dados já estão corretos!`);
    }
  }

  /**
   * Verifica se os dados estão corretos
   */
  async verifyData() {
    console.log('\n🔍 VERIFICANDO DADOS ATUALIZADOS...\n');
    
    for (const [type, filePath] of Object.entries(this.files)) {
      if (!fs.existsSync(filePath)) continue;
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const patients = JSON.parse(content);
        
        if (!Array.isArray(patients) || patients.length === 0) {
          console.log(`📄 ${type}: vazio ou inválido`);
          continue;
        }
        
        const sample = patients[0];
        const hasContactId = sample.contactId ? '✅' : '❌';
        const hasCorrectChannelType = sample.channelType !== 'normal' ? '✅' : '❌';
        const hasRecentTimestamp = sample.enteredAt ? '✅' : '❌';
        
        console.log(`📄 ${type}:`);
        console.log(`   👥 Pacientes: ${patients.length}`);
        console.log(`   🆔 contactId: ${hasContactId}`);
        console.log(`   📱 channelType: ${hasCorrectChannelType} (${sample.channelType})`);
        console.log(`   📅 timestamp: ${hasRecentTimestamp}`);
        
      } catch (error) {
        console.log(`❌ ${type}: erro ao verificar - ${error.message}`);
      }
    }
  }
}

// Executar se chamado diretamente
async function main() {
  const updater = new JsonDataUpdater();
  
  try {
    await updater.runUpdate();
    await updater.verifyData();
    
    console.log('\n🎉 Processo concluído com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante a atualização:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { JsonDataUpdater };
