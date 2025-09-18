const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} PatientRecord
 * @property {string} id
 * @property {string} name
 * @property {string} phone
 * @property {string} sectorId
 * @property {string} sectorName
 * @property {string} channelId
 * @property {'normal'|'api_oficial'} channelType
 * @property {Date} waitStartTime
 * @property {number} waitTimeMinutes
 * @property {string} enteredAt - ISO string
 */

/**
 * Gerenciador de pacientes usando arquivos JSON
 */
class JsonPatientManager {
  constructor(errorHandler, dataDir = './data') {
    this.errorHandler = errorHandler;
    this.dataDir = dataDir;
    this.files = {
      active: path.join(dataDir, 'patients_active.json'),
      processed: path.join(dataDir, 'patients_processed.json'),
      history: path.join(dataDir, 'patients_history.json'),
      backup: path.join(dataDir, 'patients_backup.json')
    };
    
    this.lastBackupTime = 0;
    this.minBackupIntervalMs = 5 * 60 * 1000; // 5 minutos por padrão
    this.useSingleBackupFolder = true; // Usar apenas uma pasta de backup
    this.singleBackupPath = path.join(dataDir, 'backup_current');
    
    this.ensureDataDirectory();
  }

  /**
   * Garante que o diretório de dados existe
   */
  ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (error) {
      this.errorHandler.logError(error, 'JsonPatientManager.ensureDataDirectory');
    }
  }

  /**
   * Gera chave única para paciente baseada em nome + telefone + setor
   * @param {Object} patient - Dados do paciente
   * @returns {string} Chave única
   */
  generatePatientKey(patient) {
    const normalizedName = (patient.name || '').trim().toLowerCase();
    const normalizedPhone = (patient.phone || '').trim();
    const normalizedSector = (patient.sectorId || '').trim();
    
    return `${normalizedName}_${normalizedPhone}_${normalizedSector}`;
  }

  /**
   * Carrega pacientes de um arquivo JSON
   * @param {string} filePath - Caminho do arquivo
   * @returns {Promise<PatientRecord[]>} Lista de pacientes
   */
  async loadPatientsFromFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const data = fs.readFileSync(filePath, 'utf8');
      const patients = JSON.parse(data);
      
      return Array.isArray(patients) ? patients : [];
    } catch (error) {
      this.errorHandler.logError(error, `JsonPatientManager.loadPatientsFromFile.${path.basename(filePath)}`);
      
      // Se arquivo corrompido, deletar e criar novo
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await this.savePatientsToFile(filePath, []);
        return [];
      } catch (cleanupError) {
        this.errorHandler.logError(cleanupError, 'JsonPatientManager.cleanupCorruptedFile');
        return [];
      }
    }
  }

  /**
   * Salva pacientes em um arquivo JSON
   * @param {string} filePath - Caminho do arquivo
   * @param {PatientRecord[]} patients - Lista de pacientes
   */
  async savePatientsToFile(filePath, patients) {
    try {
      const data = JSON.stringify(patients, null, 2);
      fs.writeFileSync(filePath, data, 'utf8');
    } catch (error) {
      this.errorHandler.logError(error, `JsonPatientManager.savePatientsToFile.${path.basename(filePath)}`);
      throw error;
    }
  }

  /**
   * Cria backup dos arquivos apenas quando necessário
   * @param {boolean} forceBackup - Forçar backup independente do tempo
   */
  async createBackup(forceBackup = false) {
    try {
      const now = Date.now();
      
      // Verificar se deve criar backup baseado no tempo
      if (!forceBackup && (now - this.lastBackupTime) < this.minBackupIntervalMs) {
        return;
      }

      if (this.useSingleBackupFolder) {
        // Usar apenas uma pasta de backup que é sobrescrita
        if (!fs.existsSync(this.singleBackupPath)) {
          fs.mkdirSync(this.singleBackupPath, { recursive: true });
        }

        // Fazer backup de todos os arquivos na pasta única
        for (const [type, filePath] of Object.entries(this.files)) {
          if (fs.existsSync(filePath)) {
            const backupPath = path.join(this.singleBackupPath, `patients_${type}.json`);
            fs.copyFileSync(filePath, backupPath);
          }
        }

        // Criar arquivo de timestamp para saber quando foi o último backup
        const timestampFile = path.join(this.singleBackupPath, 'last_backup.json');
        const backupInfo = {
          timestamp: new Date().toISOString(),
          lastBackupTime: now,
          filesBackedUp: Object.keys(this.files).length
        };
        fs.writeFileSync(timestampFile, JSON.stringify(backupInfo, null, 2));

      } else {
        // Método antigo com múltiplas pastas (mantido para compatibilidade)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(this.dataDir, `backup_${timestamp}`);
        
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        for (const [type, filePath] of Object.entries(this.files)) {
          if (fs.existsSync(filePath)) {
            const backupPath = path.join(backupDir, `patients_${type}.json`);
            fs.copyFileSync(filePath, backupPath);
          }
        }

        // Limpar backups antigos após criar um novo
        await this.cleanOldBackups();
      }

      this.lastBackupTime = now;
      
    } catch (error) {
      this.errorHandler.logError(error, 'JsonPatientManager.createBackup');
    }
  }

  /**
   * Configura o intervalo mínimo entre backups
   * @param {number} intervalMs - Intervalo em milissegundos
   */
  setBackupInterval(intervalMs) {
    this.minBackupIntervalMs = intervalMs;
  }

  /**
   * Configura se deve usar pasta única de backup ou múltiplas pastas
   * @param {boolean} useSingle - True para pasta única
   */
  setSingleBackupFolder(useSingle) {
    this.useSingleBackupFolder = useSingle;
  }

  /**
   * Obtém estatísticas dos backups
   * @returns {Object} Estatísticas dos backups
   */
  getBackupStats() {
    try {
      if (this.useSingleBackupFolder) {
        // Modo pasta única
        if (fs.existsSync(this.singleBackupPath)) {
          const size = this.getDirectorySize(this.singleBackupPath);
          const timestampFile = path.join(this.singleBackupPath, 'last_backup.json');
          let lastBackup = null;
          
          if (fs.existsSync(timestampFile)) {
            try {
              const backupInfo = JSON.parse(fs.readFileSync(timestampFile, 'utf8'));
              lastBackup = backupInfo.timestamp;
            } catch (error) {
              // Ignorar erro ao ler timestamp
            }
          }
          
          return {
            count: 1,
            lastBackup,
            totalSizeMB: Math.round(size / (1024 * 1024) * 100) / 100,
            backupMode: 'single_folder'
          };
        } else {
          return { count: 0, lastBackup: null, totalSizeMB: 0, backupMode: 'single_folder' };
        }
      } else {
        // Modo múltiplas pastas
        const backupDirs = fs.readdirSync(this.dataDir)
          .filter(name => name.startsWith('backup_'))
          .map(name => {
            const fullPath = path.join(this.dataDir, name);
            const stats = fs.statSync(fullPath);
            return {
              name,
              path: fullPath,
              mtime: stats.mtime,
              size: this.getDirectorySize(fullPath)
            };
          })
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

        const totalSize = backupDirs.reduce((sum, backup) => sum + backup.size, 0);
        
        return {
          count: backupDirs.length,
          lastBackup: backupDirs.length > 0 ? backupDirs[0].name : null,
          totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
          backupMode: 'multiple_folders'
        };
      }
    } catch (error) {
      this.errorHandler.logError(error, 'JsonPatientManager.getBackupStats');
      return { count: 0, lastBackup: null, totalSizeMB: 0, backupMode: 'unknown' };
    }
  }

  /**
   * Calcula o tamanho de um diretório recursivamente
   * @param {string} dirPath - Caminho do diretório
   * @returns {number} Tamanho em bytes
   */
  getDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isFile()) {
          totalSize += stats.size;
        } else if (stats.isDirectory()) {
          totalSize += this.getDirectorySize(itemPath);
        }
      }
    } catch (error) {
      // Ignorar erros de acesso a arquivos
    }
    
    return totalSize;
  }

  /**
   * Inicializa os arquivos se não existirem
   */
  async initialize() {
    try {
      // Criar arquivos vazios se não existirem
      const files = Object.values(this.files);
      for (const file of files) {
        if (!fs.existsSync(file)) {
          await this.savePatientsToFile(file, []);
        }
      }
      
      console.log('📁 JsonPatientManager inicializado com sucesso');
    } catch (error) {
      this.errorHandler.logError(error, 'JsonPatientManager.initialize');
      throw error;
    }
  }
}

module.exports = { JsonPatientManager };
