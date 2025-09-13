import { WaitingPatient } from '../models/WaitingPatient';
import { KrolikApiClient } from './KrolikApiClient';
import { IConfigManager } from './ConfigManager';
import { TimeUtils } from '../utils/TimeUtils';

export interface IMonitoringService {
  checkWaitingPatients(): Promise<WaitingPatient[]>;
  getPatientWaitTime(patientId: string): number;
  isEligibleFor30MinMessage(patient: WaitingPatient): boolean;
  isBusinessHours(): boolean;
  isWorkingDay(date?: Date): boolean;
  getEligiblePatientsFor30MinMessage(): Promise<WaitingPatient[]>;
  getEligiblePatientsForEndOfDayMessage(): Promise<WaitingPatient[]>;
  getMonitoringStats(): {
    totalPatients: number;
    patientsOver30Min: number;
    averageWaitTime: number;
    lastUpdate: Date;
  };
}

export class MonitoringService implements IMonitoringService {
  private krolikClient: KrolikApiClient;
  private configManager: IConfigManager;
  private cachedPatients: Map<string, WaitingPatient> = new Map();
  private lastUpdate: Date = new Date(0);
  private cacheValidityMs: number = 30000; // 30 segundos

  constructor(krolikClient: KrolikApiClient, configManager: IConfigManager) {
    this.krolikClient = krolikClient;
    this.configManager = configManager;
  }

  /**
   * Verifica atendimentos em espera através da API
   * Implementa cache para evitar requisições excessivas
   */
  async checkWaitingPatients(): Promise<WaitingPatient[]> {
    const now = new Date();
    
    // Usar cache se ainda válido
    if (now.getTime() - this.lastUpdate.getTime() < this.cacheValidityMs) {
      return Array.from(this.cachedPatients.values());
    }

    try {
      const patients = await this.krolikClient.listWaitingAttendances();
      
      // Atualizar cache
      this.cachedPatients.clear();
      patients.forEach(patient => {
        // Recalcular tempo de espera atual
        const updatedPatient = this.updateWaitTime(patient);
        this.cachedPatients.set(patient.id, updatedPatient);
      });
      
      this.lastUpdate = now;
      return Array.from(this.cachedPatients.values());
    } catch (error) {
      console.error('Erro ao verificar atendimentos em espera:', error);
      
      // Retornar cache existente em caso de erro, mas atualizar tempos
      const cachedPatients = Array.from(this.cachedPatients.values());
      return cachedPatients.map(patient => this.updateWaitTime(patient));
    }
  }

  /**
   * Obtém tempo de espera atual de um paciente específico
   */
  getPatientWaitTime(patientId: string): number {
    const patient = this.cachedPatients.get(patientId);
    if (!patient) {
      return 0;
    }

    return this.calculateWaitTimeMinutes(patient.waitStartTime);
  }

  /**
   * Verifica se paciente é elegível para mensagem de 30 minutos
   * Requisitos: 1.1, 1.3 - Mensagem após 30 minutos, sem duplicação
   */
  isEligibleFor30MinMessage(patient: WaitingPatient): boolean {
    // Verificar se já passou 30 minutos
    const waitTime = this.calculateWaitTimeMinutes(patient.waitStartTime);
    if (waitTime < 30) {
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
   * Limpa cache forçando nova consulta na próxima verificação
   */
  clearCache(): void {
    this.cachedPatients.clear();
    this.lastUpdate = new Date(0);
  }

  /**
   * Obtém estatísticas do monitoramento
   */
  getMonitoringStats(): {
    totalPatients: number;
    patientsOver30Min: number;
    averageWaitTime: number;
    lastUpdate: Date;
  } {
    const patients = Array.from(this.cachedPatients.values());
    const patientsOver30Min = patients.filter(p => p.waitTimeMinutes >= 30).length;
    const averageWaitTime = patients.length > 0 
      ? patients.reduce((sum, p) => sum + p.waitTimeMinutes, 0) / patients.length 
      : 0;

    return {
      totalPatients: patients.length,
      patientsOver30Min,
      averageWaitTime: Math.round(averageWaitTime),
      lastUpdate: this.lastUpdate
    };
  }

  /**
   * Filtra pacientes elegíveis para mensagem de 30 minutos
   * Considera todas as regras de negócio
   */
  async getEligiblePatientsFor30MinMessage(): Promise<WaitingPatient[]> {
    const allPatients = await this.checkWaitingPatients();
    const eligiblePatients: WaitingPatient[] = [];

    for (const patient of allPatients) {
      // Verificar elegibilidade básica
      if (!this.isEligibleFor30MinMessage(patient)) {
        continue;
      }

      // Verificar se já recebeu mensagem (Requisito 1.2)
      const alreadyReceived = await this.configManager.isAttendanceExcluded(
        patient.id, 
        '30min'
      );

      if (!alreadyReceived) {
        eligiblePatients.push(patient);
      }
    }

    return eligiblePatients;
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

      eligiblePatients.push(patient);
    }

    return eligiblePatients;
  }
}