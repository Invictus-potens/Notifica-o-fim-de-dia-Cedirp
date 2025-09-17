import { WaitingPatient } from '../models/WaitingPatient';
import { KrolikApiClient } from './KrolikApiClient';
import { IConfigManager } from './ConfigManager';
import { TimeUtils } from '../utils/TimeUtils';
import { metricsService } from './MetricsService';
import { JsonPatientManager } from './JsonPatientManager';
import { IErrorHandler } from './ErrorHandler';

export interface IMonitoringService {
  initialize(): Promise<void>;
  checkWaitingPatients(): Promise<WaitingPatient[]>;
  getPatientWaitTime(patientId: string): Promise<number>;
  isEligibleFor30MinMessage(patient: WaitingPatient): boolean;
  isEligibleForEndOfDayMessage(patient: WaitingPatient): boolean;
  isBusinessHours(): boolean;
  isWorkingDay(date?: Date): boolean;
  getEligiblePatientsFor30MinMessage(): Promise<WaitingPatient[]>;
  getEligiblePatientsForEndOfDayMessage(): Promise<WaitingPatient[]>;
  getMonitoringStats(): Promise<{
    totalPatients: number;
    patientsOver30Min: number;
    averageWaitTime: number;
    lastUpdate: Date;
  }>;
  clearAllData(): Promise<void>;
}

export class MonitoringService implements IMonitoringService {
  private krolikClient: KrolikApiClient;
  private configManager: IConfigManager;
  private jsonPatientManager: JsonPatientManager;
  private errorHandler: IErrorHandler;
  private lastUpdate: Date = new Date(0);

  constructor(
    krolikClient: KrolikApiClient, 
    configManager: IConfigManager,
    errorHandler: IErrorHandler
  ) {
    this.krolikClient = krolikClient;
    this.configManager = configManager;
    this.errorHandler = errorHandler;
    this.jsonPatientManager = new JsonPatientManager(errorHandler);
  }

  async initialize(): Promise<void> {
    await this.jsonPatientManager.initialize();
  }

  /**
   * Verifica atendimentos em espera através da API
   * Atualiza arquivos JSON com dados da API
   */
  async checkWaitingPatients(): Promise<WaitingPatient[]> {
    const startTime = Date.now();
    
    try {
      // Buscar pacientes da API CAM Krolik
      const apiPatients = await this.krolikClient.listWaitingAttendances();
      
      // Atualizar arquivos JSON com dados da API
      const result = await this.jsonPatientManager.updateActivePatients(apiPatients);
      
      this.lastUpdate = new Date();
      
      // Log das mudanças detectadas
      if (result.newPatients.length > 0) {
        console.log(`📥 ${result.newPatients.length} novos pacientes adicionados`);
      }
      if (result.removedPatients.length > 0) {
        console.log(`📤 ${result.removedPatients.length} pacientes removidos (atendidos)`);
      }
      
      // Registrar métrica de ciclo de monitoramento
      const duration = Date.now() - startTime;
      metricsService.recordMonitoringCycle(
        duration,
        result.activePatients.length,
        0, // messagesEligible será calculado pelos filtros
        0  // errors
      );
      
      return result.activePatients;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Registrar métrica de erro
      metricsService.recordMonitoringCycle(
        duration,
        0,
        0,
        1 // error count
      );
      
      console.error('Erro ao verificar atendimentos em espera:', error);
      
      // Retornar pacientes do arquivo em caso de erro
      try {
        return await this.jsonPatientManager.getActivePatients();
      } catch (fallbackError) {
        console.error('Erro ao carregar pacientes do arquivo:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Obtém tempo de espera atual de um paciente específico
   */
  async getPatientWaitTime(patientId: string): Promise<number> {
    try {
      const activePatients = await this.jsonPatientManager.getActivePatients();
      const patient = activePatients.find(p => p.id === patientId);
      
      if (!patient) {
        return 0;
      }

      return this.calculateWaitTimeMinutes(patient.waitStartTime);
    } catch (error) {
      this.errorHandler.logError(error as Error, 'MonitoringService.getPatientWaitTime');
      return 0;
    }
  }

  /**
   * Verifica se paciente é elegível para mensagem de 30 minutos
   * Requisitos: 1.1, 1.3 - Mensagem após 30 minutos, sem duplicação
   */
  isEligibleFor30MinMessage(patient: WaitingPatient): boolean {
    // Verificar se já passou 30 minutos
    const waitTime = this.calculateWaitTimeMinutes(patient.waitStartTime);
    if (waitTime < 30) {
      console.log(`⚙️ ${patient.name} não elegível (${waitTime}min < 30min)`);
      return false;
    }

    // Verificar se fluxo está pausado (Requisito 1.4)
    if (this.configManager.isFlowPaused()) {
      return false;
    }

    // Verificar se é horário comercial
    if (!this.isBusinessHours()) {
      return false;
    }

    // Verificar se é dia útil
    if (!this.isWorkingDay()) {
      return false;
    }

    // Verificar se setor está excluído (Requisito 1.1)
    const excludedSectors = this.configManager.getExcludedSectors();
    if (excludedSectors.includes(patient.sectorId)) {
      return false;
    }

    // Verificar se canal está excluído (Requisito 1.1)
    const excludedChannels = this.configManager.getExcludedChannels();
    if (excludedChannels.includes(patient.channelId)) {
      return false;
    }

    return true;
  }

  /**
   * Verifica se está em horário comercial
   * Requisito 2.4 - Considerar horário de Brasília
   */
  isBusinessHours(): boolean {
    return TimeUtils.isBusinessHours();
  }

  /**
   * Verifica se é dia útil (segunda a sexta)
   * Requisito 2.4 - Não executar em fins de semana
   */
  isWorkingDay(date?: Date): boolean {
    if (date) {
      return TimeUtils.toBrasiliaTime(date).weekday >= 1 && TimeUtils.toBrasiliaTime(date).weekday <= 5;
    }
    return TimeUtils.isWorkingDay();
  }

  /**
   * Calcula tempo de espera em minutos
   */
  private calculateWaitTimeMinutes(waitStartTime: Date): number {
    return TimeUtils.calculateWaitTimeMinutes(waitStartTime);
  }

  /**
   * Atualiza tempo de espera de um paciente
   */
  private updateWaitTime(patient: WaitingPatient): WaitingPatient {
    return {
      ...patient,
      waitTimeMinutes: this.calculateWaitTimeMinutes(patient.waitStartTime)
    };
  }

  /**
   * Limpa todos os dados (chamado após mensagens de 18h)
   */
  async clearAllData(): Promise<void> {
    try {
      await this.jsonPatientManager.clearAllFiles();
      this.lastUpdate = new Date(0);
      console.log('🧹 Todos os dados de pacientes foram limpos após mensagens de fim de expediente');
    } catch (error) {
      this.errorHandler.logError(error as Error, 'MonitoringService.clearAllData');
      throw error;
    }
  }

  /**
   * Obtém estatísticas do monitoramento
   */
  async getMonitoringStats(): Promise<{
    totalPatients: number;
    patientsOver30Min: number;
    averageWaitTime: number;
    lastUpdate: Date;
  }> {
    try {
      const stats = await this.jsonPatientManager.getStats();
      
      return {
        totalPatients: stats.activeCount,
        patientsOver30Min: stats.patientsOver30Min,
        averageWaitTime: stats.averageWaitTime,
        lastUpdate: this.lastUpdate
      };
    } catch (error) {
      this.errorHandler.logError(error as Error, 'MonitoringService.getMonitoringStats');
      return {
        totalPatients: 0,
        patientsOver30Min: 0,
        averageWaitTime: 0,
        lastUpdate: this.lastUpdate
      };
    }
  }

  /**
   * Filtra pacientes elegíveis para mensagem de 30 minutos
   * Considera todas as regras de negócio
   */
  async getEligiblePatientsFor30MinMessage(): Promise<WaitingPatient[]> {
    const allPatients = await this.checkWaitingPatients();
    const eligiblePatients: WaitingPatient[] = [];
    const excludedSectors = this.configManager.getExcludedSectors();
    const excludedChannels = this.configManager.getExcludedChannels();

    for (const patient of allPatients) {
      // Verificar elegibilidade básica
      if (!this.isEligibleFor30MinMessage(patient)) {
        continue;
      }

      // Verificar se setor está excluído
      if (excludedSectors.includes(patient.sectorId)) {
        continue;
      }

      // Verificar se canal está excluído
      if (excludedChannels.includes(patient.channelId)) {
        continue;
      }

      // Verificar se já recebeu mensagem (usando nova chave nome+telefone+setor)
      const patientKey = `${patient.name}_${patient.phone}_${patient.sectorId}`;
      const alreadyReceived = await this.configManager.isAttendanceExcluded(
        patientKey, 
        '30min'
      );

      // Verificar se já foi processado (está na lista de processados)
      const isProcessed = await this.jsonPatientManager.isPatientProcessed(patient);

      if (!alreadyReceived && !isProcessed) {
        eligiblePatients.push(patient);
      }
    }

    return eligiblePatients;
  }

  /**
   * Verifica se um paciente específico é elegível para mensagem de fim de dia
   * Requisito 2.1, 2.2, 2.3 - Mensagem às 18h com exceções
   */
  isEligibleForEndOfDayMessage(patient: WaitingPatient): boolean {
    // Verificar se é horário de fim de expediente (18h)
    if (!TimeUtils.isEndOfDayTimeWithTolerance(1)) {
      return false;
    }

    // Verificar se é dia útil
    if (!this.isWorkingDay()) {
      return false;
    }

    const excludedSectors = this.configManager.getExcludedSectors();
    const excludedChannels = this.configManager.getExcludedChannels();

    // Verificar se setor está excluído (Requisito 2.2)
    if (excludedSectors.includes(patient.sectorId)) {
      return false;
    }

    // Verificar se canal está excluído (Requisito 2.3)
    if (excludedChannels.includes(patient.channelId)) {
      return false;
    }

    return true;
  }

  /**
   * Filtra pacientes para mensagem de fim de expediente
   * Requisito 2.1, 2.2, 2.3 - Mensagem às 18h com exceções
   */
  async getEligiblePatientsForEndOfDayMessage(): Promise<WaitingPatient[]> {
    // Verificar se é horário de fim de expediente (18h)
    if (!TimeUtils.isEndOfDayTimeWithTolerance(1)) {
      return [];
    }

    // Verificar se é dia útil
    if (!this.isWorkingDay()) {
      return [];
    }

    const allPatients = await this.checkWaitingPatients();
    const eligiblePatients: WaitingPatient[] = [];
    const excludedSectors = this.configManager.getExcludedSectors();
    const excludedChannels = this.configManager.getExcludedChannels();

    for (const patient of allPatients) {
      // Verificar se setor está excluído (Requisito 2.2)
      if (excludedSectors.includes(patient.sectorId)) {
        continue;
      }

      // Verificar se canal está excluído (Requisito 2.3)
      if (excludedChannels.includes(patient.channelId)) {
        continue;
      }

      // Verificar se já recebeu mensagem de fim de dia (usando nova chave)
      const patientKey = `${patient.name}_${patient.phone}_${patient.sectorId}`;
      const alreadyReceived = await this.configManager.isAttendanceExcluded(
        patientKey, 
        'end_of_day'
      );

      if (!alreadyReceived) {
        eligiblePatients.push(patient);
      }
    }

    return eligiblePatients;
  }
}