const fs = require('fs');
const path = require('path');

/**
 * Script para atualizar o JsonPatientManager com métodos necessários
 * para o monitoramento automático
 */

class JsonPatientManagerUpdater {
  constructor() {
    this.managerFile = './src/services/JsonPatientManager.js';
    this.backupFile = './src/services/JsonPatientManager.js.backup';
  }

  /**
   * Cria backup do arquivo original
   */
  createBackup() {
    if (fs.existsSync(this.managerFile)) {
      fs.copyFileSync(this.managerFile, this.backupFile);
      console.log(`💾 Backup criado: ${this.backupFile}`);
    }
  }

  /**
   * Adiciona métodos necessários ao JsonPatientManager
   */
  updateJsonPatientManager() {
    try {
      console.log('🔧 Atualizando JsonPatientManager...');
      
      // Ler arquivo atual
      const content = fs.readFileSync(this.managerFile, 'utf8');
      
      // Verificar se já foi atualizado
      if (content.includes('updateActivePatients')) {
        console.log('✅ JsonPatientManager já está atualizado');
        return;
      }
      
      // Adicionar métodos antes do método initialize()
      const newMethods = `
  /**
   * Atualiza lista de pacientes ativos com novos dados da API
   * @param {Array} newPatients - Novos pacientes da API CAM Krolik
   * @returns {Object} Estatísticas da atualização
   */
  async updateActivePatients(newPatients) {
    try {
      const currentPatients = await this.loadPatientsFromFile(this.files.active);
      const stats = {
        total: newPatients.length,
        new: 0,
        updated: 0,
        removed: 0,
        unchanged: 0
      };

      // Criar mapa de pacientes atuais por chave única
      const currentMap = new Map();
      currentPatients.forEach(patient => {
        const key = this.getPatientKey(patient);
        currentMap.set(key, patient);
      });

      // Processar novos pacientes
      const updatedPatients = [];
      const processedKeys = new Set();

      for (const newPatient of newPatients) {
        const key = this.getPatientKey(newPatient);
        processedKeys.add(key);

        if (currentMap.has(key)) {
          // Paciente existente - verificar se houve mudanças
          const currentPatient = currentMap.get(key);
          if (JSON.stringify(newPatient) !== JSON.stringify(currentPatient)) {
            stats.updated++;
            updatedPatients.push({
              ...newPatient,
              enteredAt: currentPatient.enteredAt || new Date().toISOString()
            });
          } else {
            stats.unchanged++;
            updatedPatients.push(currentPatient);
          }
        } else {
          // Paciente novo
          stats.new++;
          updatedPatients.push({
            ...newPatient,
            enteredAt: new Date().toISOString()
          });
        }
      }

      // Identificar pacientes removidos
      for (const [key, patient] of currentMap.entries()) {
        if (!processedKeys.has(key)) {
          stats.removed++;
          // Mover para processed se não estiver lá
          await this.movePatientToProcessed(patient);
        }
      }

      // Salvar pacientes atualizados
      await this.savePatientsToFile(this.files.active, updatedPatients);

      // Log das mudanças
      if (stats.new > 0 || stats.updated > 0 || stats.removed > 0) {
        console.log(\`📊 Pacientes atualizados: +\${stats.new} ~\${stats.updated} -\${stats.removed} =\${stats.unchanged}\`);
      }

      return stats;

    } catch (error) {
      this.errorHandler.logError(error, 'JsonPatientManager.updateActivePatients');
      throw error;
    }
  }

  /**
   * Move paciente para lista de processados
   * @param {Object} patient - Paciente a ser movido
   */
  async movePatientToProcessed(patient) {
    try {
      const processedPatients = await this.loadPatientsFromFile(this.files.processed);
      const historyPatients = await this.loadPatientsFromFile(this.files.history);

      // Adicionar timestamp de processamento
      const processedPatient = {
        ...patient,
        processedAt: new Date().toISOString()
      };

      // Adicionar às listas
      processedPatients.push(processedPatient);
      historyPatients.push(processedPatient);

      // Salvar arquivos
      await this.savePatientsToFile(this.files.processed, processedPatients);
      await this.savePatientsToFile(this.files.history, historyPatients);

    } catch (error) {
      this.errorHandler.logError(error, 'JsonPatientManager.movePatientToProcessed');
    }
  }

  /**
   * Marca paciente como processado (recebeu mensagem)
   * @param {string} patientId - ID do paciente
   */
  async markPatientAsProcessed(patientId) {
    try {
      const activePatients = await this.loadPatientsFromFile(this.files.active);
      const patient = activePatients.find(p => p.id === patientId);

      if (patient) {
        // Remover da lista ativa
        const updatedActive = activePatients.filter(p => p.id !== patientId);
        await this.savePatientsToFile(this.files.active, updatedActive);

        // Adicionar à lista de processados
        await this.movePatientToProcessed(patient);

        console.log(\`✅ Paciente \${patient.name} marcado como processado\`);
      }

    } catch (error) {
      this.errorHandler.logError(error, 'JsonPatientManager.markPatientAsProcessed');
    }
  }

  /**
   * Verifica se paciente foi processado
   * @param {string} patientId - ID do paciente
   * @returns {boolean} True se foi processado
   */
  async isPatientProcessed(patientId) {
    try {
      const processedPatients = await this.loadPatientsFromFile(this.files.processed);
      return processedPatients.some(p => p.id === patientId);
    } catch (error) {
      this.errorHandler.logError(error, 'JsonPatientManager.isPatientProcessed');
      return false;
    }
  }

  /**
   * Obtém chave única do paciente
   * @param {Object} patient - Paciente
   * @returns {string} Chave única
   */
  getPatientKey(patient) {
    return \`\${patient.name}_\${patient.phone}_\${patient.sectorId}\`;
  }

  /**
   * Obtém estatísticas dos dados
   * @returns {Object} Estatísticas
   */
  async getStats() {
    try {
      const activePatients = await this.loadPatientsFromFile(this.files.active);
      const processedPatients = await this.loadPatientsFromFile(this.files.processed);
      const historyPatients = await this.loadPatientsFromFile(this.files.history);

      return {
        active: activePatients.length,
        processed: processedPatients.length,
        history: historyPatients.length,
        total: activePatients.length + processedPatients.length + historyPatients.length,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      this.errorHandler.logError(error, 'JsonPatientManager.getStats');
      return { active: 0, processed: 0, history: 0, total: 0, lastUpdate: null };
    }
  }

  /**
   * Limpa todos os arquivos (fim de dia)
   */
  async clearAllFiles() {
    try {
      console.log('🧹 Limpando todos os arquivos JSON...');
      
      const files = Object.values(this.files);
      let totalCleared = 0;

      for (const filePath of files) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const patients = JSON.parse(content);
          totalCleared += Array.isArray(patients) ? patients.length : 0;
          
          await this.savePatientsToFile(filePath, []);
        }
      }

      console.log(\`✅ \${totalCleared} pacientes removidos de todos os arquivos\`);
      return totalCleared;

    } catch (error) {
      this.errorHandler.logError(error, 'JsonPatientManager.clearAllFiles');
      throw error;
    }
  }

`;

      // Encontrar posição para inserir os métodos (antes do método initialize)
      const initializeIndex = content.indexOf('async initialize()');
      if (initializeIndex === -1) {
        throw new Error('Método initialize() não encontrado');
      }

      // Inserir novos métodos
      const updatedContent = 
        content.slice(0, initializeIndex) + 
        newMethods + 
        content.slice(initializeIndex);

      // Salvar arquivo atualizado
      fs.writeFileSync(this.managerFile, updatedContent);
      console.log('✅ JsonPatientManager atualizado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao atualizar JsonPatientManager:', error.message);
      throw error;
    }
  }

  /**
   * Verifica se o arquivo foi atualizado corretamente
   */
  verifyUpdate() {
    try {
      const content = fs.readFileSync(this.managerFile, 'utf8');
      
      const requiredMethods = [
        'updateActivePatients',
        'movePatientToProcessed',
        'markPatientAsProcessed',
        'isPatientProcessed',
        'getPatientKey',
        'getStats',
        'clearAllFiles'
      ];

      const missingMethods = requiredMethods.filter(method => 
        !content.includes(method)
      );

      if (missingMethods.length === 0) {
        console.log('✅ Todos os métodos necessários foram adicionados');
        return true;
      } else {
        console.log('❌ Métodos faltando:', missingMethods);
        return false;
      }

    } catch (error) {
      console.error('❌ Erro ao verificar atualização:', error.message);
      return false;
    }
  }

  /**
   * Restaura backup se necessário
   */
  restoreBackup() {
    if (fs.existsSync(this.backupFile)) {
      fs.copyFileSync(this.backupFile, this.managerFile);
      console.log('🔄 Backup restaurado');
    } else {
      console.log('⚠️ Nenhum backup encontrado');
    }
  }
}

// Executar se chamado diretamente
async function main() {
  const updater = new JsonPatientManagerUpdater();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'update':
        updater.createBackup();
        updater.updateJsonPatientManager();
        updater.verifyUpdate();
        break;
        
      case 'verify':
        updater.verifyUpdate();
        break;
        
      case 'restore':
        updater.restoreBackup();
        break;
        
      default:
        console.log('🔧 Atualizador do JsonPatientManager\n');
        console.log('Uso: node scripts/update-json-patient-manager.js [comando]\n');
        console.log('Comandos disponíveis:');
        console.log('  update  - Atualiza o JsonPatientManager com novos métodos');
        console.log('  verify  - Verifica se a atualização foi aplicada');
        console.log('  restore - Restaura o backup original');
        console.log('\nExemplos:');
        console.log('  node scripts/update-json-patient-manager.js update');
        console.log('  node scripts/update-json-patient-manager.js verify');
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

module.exports = { JsonPatientManagerUpdater };
