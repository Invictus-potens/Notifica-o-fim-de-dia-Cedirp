import { IMonitoringService } from './MonitoringService';
import { IConfigManager } from './ConfigManager';
import { metricsService } from './MetricsService';

export interface IScheduler {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  pause(): void;
  resume(): void;
  isPaused(): boolean;
  setInterval(intervalMs: number): void;
  getInterval(): number;
}

export interface SchedulerConfig {
  intervalMs: number;
  autoStart: boolean;
}

export type SchedulerCallback = () => Promise<void> | void;

export class Scheduler implements IScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private intervalMs: number;
  private paused: boolean = false;
  private running: boolean = false;
  private callback: SchedulerCallback;

  constructor(callback: SchedulerCallback, config: SchedulerConfig = { intervalMs: 60000, autoStart: false }) {
    this.callback = callback;
    this.intervalMs = config.intervalMs;
    
    if (config.autoStart) {
      this.start();
    }
  }

  /**
   * Inicia o scheduler
   */
  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.scheduleNext();
  }

  /**
   * Para o scheduler completamente
   */
  stop(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
    this.paused = false;
  }

  /**
   * Verifica se o scheduler está rodando
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Pausa o scheduler (mantém rodando mas não executa callback)
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Retoma o scheduler
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * Verifica se o scheduler está pausado
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Define novo intervalo de execução
   */
  setInterval(intervalMs: number): void {
    if (intervalMs < 1000) {
      throw new Error('Intervalo mínimo é de 1000ms (1 segundo)');
    }
    
    this.intervalMs = intervalMs;
    
    // Reiniciar se estiver rodando
    if (this.running) {
      this.stop();
      this.start();
    }
  }

  /**
   * Obtém intervalo atual
   */
  getInterval(): number {
    return this.intervalMs;
  }

  /**
   * Agenda próxima execução
   */
  private scheduleNext(): void {
    if (!this.running) {
      return;
    }

    this.intervalId = setTimeout(async () => {
      if (!this.running) {
        return;
      }

      // Executar callback apenas se não estiver pausado
      if (!this.paused) {
        try {
          await this.callback();
        } catch (error) {
          console.error('Erro na execução do scheduler:', error);
        }
      }

      // Agendar próxima execução
      this.scheduleNext();
    }, this.intervalMs);
  }
}

/**
 * Scheduler específico para monitoramento de atendimentos
 * Implementa lógica de negócio para verificação periódica
 */
export class MonitoringScheduler {
  private scheduler: Scheduler;
  private monitoringService: IMonitoringService;
  private configManager: IConfigManager;
  private onPatientCheck?: (eligiblePatients: any[]) => Promise<void>;

  constructor(
    monitoringService: IMonitoringService,
    configManager: IConfigManager,
    config: SchedulerConfig = { intervalMs: 60000, autoStart: false }
  ) {
    this.monitoringService = monitoringService;
    this.configManager = configManager;
    
    this.scheduler = new Scheduler(
      () => this.executeMonitoringCycle(),
      config
    );
  }

  /**
   * Inicia monitoramento periódico
   */
  start(): void {
    this.scheduler.start();
  }

  /**
   * Para monitoramento
   */
  stop(): void {
    this.scheduler.stop();
  }

  /**
   * Pausa monitoramento (continua verificando mas não processa)
   * Requisito 1.4, 3.2, 3.3 - Pausar/retomar fluxo
   */
  pause(): void {
    this.scheduler.pause();
  }

  /**
   * Retoma monitoramento
   */
  resume(): void {
    this.scheduler.resume();
  }

  /**
   * Verifica se está rodando
   */
  isRunning(): boolean {
    return this.scheduler.isRunning();
  }

  /**
   * Verifica se está pausado
   */
  isPaused(): boolean {
    return this.scheduler.isPaused();
  }

  /**
   * Define callback para quando pacientes elegíveis são encontrados
   */
  onEligiblePatientsFound(callback: (eligiblePatients: any[]) => Promise<void>): void {
    this.onPatientCheck = callback;
  }

  /**
   * Define intervalo de verificação
   */
  setCheckInterval(intervalMs: number): void {
    this.scheduler.setInterval(intervalMs);
  }

  /**
   * Obtém intervalo atual
   */
  getCheckInterval(): number {
    return this.scheduler.getInterval();
  }

  /**
   * Executa ciclo completo de monitoramento
   */
  private async executeMonitoringCycle(): Promise<void> {
    const startTime = Date.now();
    let patientsFound = 0;
    let messagesEligible = 0;
    let errors = 0;
    
    // Log do início do ciclo
    console.log(`🔄 [${new Date().toLocaleString('pt-BR')}] Iniciando ciclo de monitoramento...`);
    console.log(`🔍 [${new Date().toLocaleString('pt-BR')}] Console funcionando - logs de ciclo ativos!`);
    
    try {
      // SEMPRE atualizar cache de pacientes (independente do horário)
      // Isso garante que o "Total Aguardando" seja sempre atualizado
      const patients = await this.monitoringService.checkWaitingPatients();
      patientsFound = patients.length;
      
      console.log(`📊 [${new Date().toLocaleString('pt-BR')}] Pacientes encontrados: ${patientsFound}`);

      // Verificar se fluxo está pausado no ConfigManager
      if (this.configManager.isFlowPaused()) {
        // Continuar monitorando mas não processar (Requisito 1.4)
        console.log(`⏸️ [${new Date().toLocaleString('pt-BR')}] Fluxo pausado - apenas monitorando (${patientsFound} pacientes)`);
        return;
      }

      // Verificar se é horário comercial e dia útil
      if (!this.monitoringService.isBusinessHours() || !this.monitoringService.isWorkingDay()) {
        console.log(`🕐 [${new Date().toLocaleString('pt-BR')}] Fora do horário comercial - apenas monitorando (${patientsFound} pacientes)`);
        return;
      }

      // Buscar pacientes elegíveis para mensagem de 30 minutos
      const eligiblePatients = await this.monitoringService.getEligiblePatientsFor30MinMessage();
      messagesEligible += eligiblePatients.length;
      
      if (eligiblePatients.length > 0) {
        console.log(`📤 [${new Date().toLocaleString('pt-BR')}] ${eligiblePatients.length} pacientes elegíveis para mensagem de 30min`);
        if (this.onPatientCheck) {
          await this.onPatientCheck(eligiblePatients);
        }
      }

      // Verificar se é horário de fim de expediente (18h)
      const endOfDayPatients = await this.monitoringService.getEligiblePatientsForEndOfDayMessage();
      messagesEligible += endOfDayPatients.length;
      
      if (endOfDayPatients.length > 0) {
        console.log(`🌅 [${new Date().toLocaleString('pt-BR')}] ${endOfDayPatients.length} pacientes elegíveis para mensagem de fim de dia`);
        if (this.onPatientCheck) {
          await this.onPatientCheck(endOfDayPatients);
        }
      }

    } catch (error) {
      errors = 1;
      console.error(`❌ [${new Date().toLocaleString('pt-BR')}] Erro no ciclo de monitoramento:`, error);
    } finally {
      // Registrar métrica do ciclo de execução
      const duration = Date.now() - startTime;
      metricsService.recordMonitoringCycle(
        duration,
        patientsFound,
        messagesEligible,
        errors
      );
      
      // Log de resumo do ciclo
      console.log(`✅ [${new Date().toLocaleString('pt-BR')}] Ciclo concluído - ${patientsFound} pacientes, ${messagesEligible} mensagens elegíveis, ${duration}ms, ${errors} erro(s)`);
    }
  }

  /**
   * Obtém estatísticas do monitoramento
   */
  getStats(): {
    isRunning: boolean;
    isPaused: boolean;
    interval: number;
    monitoringStats: any;
  } {
    return {
      isRunning: this.isRunning(),
      isPaused: this.isPaused(),
      interval: this.getCheckInterval(),
      monitoringStats: this.monitoringService.getMonitoringStats()
    };
  }

  /**
   * Força execução imediata do ciclo de monitoramento
   */
  async forceCheck(): Promise<void> {
    await this.executeMonitoringCycle();
  }
}

/**
 * Factory function para criar MonitoringScheduler
 */
export function createMonitoringScheduler(
  monitoringService: IMonitoringService,
  configManager: IConfigManager,
  config?: Partial<SchedulerConfig>
): MonitoringScheduler {
  const defaultConfig: SchedulerConfig = {
    intervalMs: 60000, // 1 minuto
    autoStart: false
  };

  const finalConfig = { ...defaultConfig, ...config };
  
  return new MonitoringScheduler(monitoringService, configManager, finalConfig);
}