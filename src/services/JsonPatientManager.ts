import * as fs from 'fs';
import * as path from 'path';
import { WaitingPatient } from '../models/WaitingPatient';
import { IErrorHandler } from './ErrorHandler';

interface PatientRecord extends WaitingPatient {
  enteredAt: string; // ISO string
}

interface PatientFiles {
  active: string;
  processed: string;
  history: string;
  backup: string;
}

export class JsonPatientManager {
  private dataDir: string;
  private files: PatientFiles;
  private errorHandler: IErrorHandler;

  constructor(errorHandler: IErrorHandler, dataDir: string = './data') {
    this.errorHandler = errorHandler;
    this.dataDir = dataDir;
    this.files = {
      active: path.join(dataDir, 'patients_active.json'),
      processed: path.join(dataDir, 'patients_processed.json'),
      history: path.join(dataDir, 'patients_history.json'),
      backup: path.join(dataDir, 'patients_backup.json')
    };
    
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (error) {
      this.errorHandler.logError(error as Error, 'JsonPatientManager.ensureDataDirectory');
    }
  }

  /**
   * Gera chave única para paciente baseada em nome + telefone + setor
   */
  private generatePatientKey(patient: WaitingPatient): string {
    const normalizedName = (patient.name || '').trim().toLowerCase();
    const normalizedPhone = (patient.phone || '').trim();
    const normalizedSector = (patient.sectorId || '').trim();
    
    return `${normalizedName}_${normalizedPhone}_${normalizedSector}`;
  }

  /**
   * Carrega pacientes de um arquivo JSON
   */
  private async loadPatientsFromFile(filePath: string): Promise<PatientRecord[]> {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const data = fs.readFileSync(filePath, 'utf8');
      const patients = JSON.parse(data) as PatientRecord[];
      
      return Array.isArray(patients) ? patients : [];
    } catch (error) {
      this.errorHandler.logError(error as Error, `JsonPatientManager.loadPatientsFromFile.${path.basename(filePath)}`);
      
      // Se arquivo corrompido, deletar e criar novo
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        this.savePatientsToFile(filePath, []);
        return [];
      } catch (cleanupError) {
        this.errorHandler.logError(cleanupError as Error, 'JsonPatientManager.cleanupCorruptedFile');
        return [];
      }
    }
  }

  /**
   * Salva pacientes em um arquivo JSON
   */
  private async savePatientsToFile(filePath: string, patients: PatientRecord[]): Promise<void> {
    try {
      const data = JSON.stringify(patients, null, 2);
      fs.writeFileSync(filePath, data, 'utf8');
    } catch (error) {
      this.errorHandler.logError(error as Error, `JsonPatientManager.savePatientsToFile.${path.basename(filePath)}`);
      throw error;
    }
  }

  /**
   * Cria backup dos arquivos antes de operações críticas
   */
  private async createBackup(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.dataDir, `backup_${timestamp}`);
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Fazer backup de todos os arquivos
      for (const [type, filePath] of Object.entries(this.files)) {
        if (fs.existsSync(filePath)) {
          const backupPath = path.join(backupDir, `patients_${type}.json`);
          fs.copyFileSync(filePath, backupPath);
        }
      }
    } catch (error) {
      this.errorHandler.logError(error as Error, 'JsonPatientManager.createBackup');
    }
  }

  /**
   * Atualiza lista de pacientes ativos comparando com dados da API
   */
  async updateActivePatients(apiPatients: WaitingPatient[]): Promise<{
    activePatients: WaitingPatient[];
    newPatients: WaitingPatient[];
    removedPatients: WaitingPatient[];
    updatedPatients: WaitingPatient[];
  }> {
    try {
      // Carregar pacientes atuais
      const currentPatients = await this.loadPatientsFromFile(this.files.active);
      const currentMap = new Map<string, PatientRecord>();
      
      currentPatients.forEach(patient => {
        const key = this.generatePatientKey(patient);
        currentMap.set(key, patient);
      });

      // Processar pacientes da API
      const apiMap = new Map<string, WaitingPatient>();
      const newPatients: WaitingPatient[] = [];
      const updatedPatients: WaitingPatient[] = [];

      apiPatients.forEach(patient => {
        const key = this.generatePatientKey(patient);
        const existingPatient = currentMap.get(key);
        
        if (!existingPatient) {
          // Paciente novo
          newPatients.push(patient);
        } else {
          // Paciente existente - verificar se houve mudanças
          const updatedPatient: PatientRecord = {
            ...patient,
            enteredAt: existingPatient.enteredAt // Manter timestamp de entrada
          };
          updatedPatients.push(updatedPatient);
        }
        
        apiMap.set(key, patient);
      });

      // Identificar pacientes removidos
      const removedPatients: WaitingPatient[] = [];
      currentMap.forEach((patient, key) => {
        if (!apiMap.has(key)) {
          removedPatients.push(patient);
        }
      });

      // Criar nova lista de pacientes ativos
      const activePatients: PatientRecord[] = [
        ...newPatients.map(patient => ({
          ...patient,
          enteredAt: new Date().toISOString()
        })),
        ...updatedPatients
      ];

      // Salvar backup antes de atualizar
      await this.createBackup();

      // Salvar pacientes ativos
      await this.savePatientsToFile(this.files.active, activePatients);

      // Mover pacientes removidos para processed
      if (removedPatients.length > 0) {
        await this.movePatientsToProcessed(removedPatients);
      }

      // Adicionar novos e atualizados ao histórico
      if (newPatients.length > 0 || updatedPatients.length > 0) {
        await this.addToHistory([...newPatients, ...updatedPatients]);
      }

      return {
        activePatients,
        newPatients,
        removedPatients,
        updatedPatients
      };

    } catch (error) {
      this.errorHandler.logError(error as Error, 'JsonPatientManager.updateActivePatients');
      throw error;
    }
  }

  /**
   * Move pacientes para lista de processados
   */
  async movePatientsToProcessed(patients: WaitingPatient[]): Promise<void> {
    try {
      const processedPatients = await this.loadPatientsFromFile(this.files.processed);
      
      const patientsToAdd: PatientRecord[] = patients.map(patient => ({
        ...patient,
        enteredAt: new Date().toISOString()
      }));

      const updatedProcessed = [...processedPatients, ...patientsToAdd];
      await this.savePatientsToFile(this.files.processed, updatedProcessed);
    } catch (error) {
      this.errorHandler.logError(error as Error, 'JsonPatientManager.movePatientsToProcessed');
      throw error;
    }
  }

  /**
   * Adiciona pacientes ao histórico
   */
  async addToHistory(patients: WaitingPatient[]): Promise<void> {
    try {
      const historyPatients = await this.loadPatientsFromFile(this.files.history);
      
      const patientsToAdd: PatientRecord[] = patients.map(patient => ({
        ...patient,
        enteredAt: new Date().toISOString()
      }));

      const updatedHistory = [...historyPatients, ...patientsToAdd];
      await this.savePatientsToFile(this.files.history, updatedHistory);
    } catch (error) {
      this.errorHandler.logError(error as Error, 'JsonPatientManager.addToHistory');
      throw error;
    }
  }

  /**
   * Obtém pacientes ativos
   */
  async getActivePatients(): Promise<WaitingPatient[]> {
    try {
      const patients = await this.loadPatientsFromFile(this.files.active);
      return patients.map(patient => {
        const { enteredAt, ...waitingPatient } = patient;
        return waitingPatient;
      });
    } catch (error) {
      this.errorHandler.logError(error as Error, 'JsonPatientManager.getActivePatients');
      return [];
    }
  }

  /**
   * Obtém pacientes processados
   */
  async getProcessedPatients(): Promise<PatientRecord[]> {
    try {
      return await this.loadPatientsFromFile(this.files.processed);
    } catch (error) {
      this.errorHandler.logError(error as Error, 'JsonPatientManager.getProcessedPatients');
      return [];
    }
  }

  /**
   * Obtém histórico de pacientes
   */
  async getHistoryPatients(): Promise<PatientRecord[]> {
    try {
      return await this.loadPatientsFromFile(this.files.history);
    } catch (error) {
      this.errorHandler.logError(error as Error, 'JsonPatientManager.getHistoryPatients');
      return [];
    }
  }

  /**
   * Limpa todos os arquivos (chamado após mensagens de 18h)
   */
  async clearAllFiles(): Promise<void> {
    try {
      await this.createBackup();
      
      // Limpar todos os arquivos
      await Promise.all([
        this.savePatientsToFile(this.files.active, []),
        this.savePatientsToFile(this.files.processed, []),
        this.savePatientsToFile(this.files.history, [])
      ]);

      console.log('🧹 Todos os arquivos de pacientes foram limpos após mensagens de fim de expediente');
    } catch (error) {
      this.errorHandler.logError(error as Error, 'JsonPatientManager.clearAllFiles');
      throw error;
    }
  }

  /**
   * Obtém estatísticas dos pacientes
   */
  async getStats(): Promise<{
    activeCount: number;
    processedCount: number;
    historyCount: number;
    patientsOver30Min: number;
    averageWaitTime: number;
  }> {
    try {
      const activePatients = await this.loadPatientsFromFile(this.files.active);
      const processedPatients = await this.loadPatientsFromFile(this.files.processed);
      const historyPatients = await this.loadPatientsFromFile(this.files.history);

      const patientsOver30Min = activePatients.filter(p => p.waitTimeMinutes >= 30).length;
      const averageWaitTime = activePatients.length > 0 
        ? activePatients.reduce((sum, p) => sum + p.waitTimeMinutes, 0) / activePatients.length 
        : 0;

      return {
        activeCount: activePatients.length,
        processedCount: processedPatients.length,
        historyCount: historyPatients.length,
        patientsOver30Min,
        averageWaitTime: Math.round(averageWaitTime)
      };
    } catch (error) {
      this.errorHandler.logError(error as Error, 'JsonPatientManager.getStats');
      return {
        activeCount: 0,
        processedCount: 0,
        historyCount: 0,
        patientsOver30Min: 0,
        averageWaitTime: 0
      };
    }
  }

  /**
   * Verifica se um paciente está na lista de processados
   */
  async isPatientProcessed(patient: WaitingPatient): Promise<boolean> {
    try {
      const processedPatients = await this.loadPatientsFromFile(this.files.processed);
      const patientKey = this.generatePatientKey(patient);
      
      return processedPatients.some(p => this.generatePatientKey(p) === patientKey);
    } catch (error) {
      this.errorHandler.logError(error as Error, 'JsonPatientManager.isPatientProcessed');
      return false;
    }
  }

  /**
   * Inicializa os arquivos se não existirem
   */
  async initialize(): Promise<void> {
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
      this.errorHandler.logError(error as Error, 'JsonPatientManager.initialize');
      throw error;
    }
  }
}
