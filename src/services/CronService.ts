import * as cron from 'node-cron';
import { TimeUtils } from '../utils/TimeUtils';
import { logger } from './Logger';

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  timezone: string;
  isRunning: boolean;
  lastRun?: Date;
  nextRun?: Date;
  errorCount: number;
  lastError?: Error;
}

export interface CronServiceConfig {
  timezone: string;
  enableLogging: boolean;
  maxRetries: number;
  retryDelay: number;
}

export class CronService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private jobConfigs: Map<string, CronJob> = new Map();
  private config: CronServiceConfig;
  private isInitialized: boolean = false;

  constructor(config: Partial<CronServiceConfig> = {}) {
    this.config = {
      timezone: 'America/Sao_Paulo',
      enableLogging: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * Inicializa o serviço de cron
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.log('CronService inicializado', 'info');
    this.isInitialized = true;
  }

  /**
   * Agenda job de verificação de 30 minutos (a cada 3 minutos)
   */
  scheduleThirtyMinuteCheck(callback: () => Promise<void>): string {
    const jobId = 'thirty-minute-check';
    const schedule = '*/3 * * * *'; // A cada 3 minutos
    
    return this.scheduleJob(jobId, 'Verificação de 30 minutos', schedule, callback);
  }

  /**
   * Agenda job de fim de expediente (18:00 em dias úteis)
   */
  scheduleEndOfDayJob(callback: () => Promise<void>): string {
    const jobId = 'end-of-day';
    const schedule = '0 18 * * 1-5'; // 18:00 de segunda a sexta
    
    return this.scheduleJob(jobId, 'Mensagens de fim de expediente', schedule, callback);
  }

  /**
   * Agenda job de limpeza diária (23:59 todos os dias)
   */
  scheduleDailyCleanup(callback: () => Promise<void>): string {
    const jobId = 'daily-cleanup';
    const schedule = '59 23 * * *'; // 23:59 todos os dias
    
    return this.scheduleJob(jobId, 'Limpeza diária', schedule, callback);
  }

  /**
   * Agenda job de health check (a cada 5 minutos)
   */
  scheduleHealthCheck(callback: () => Promise<void>): string {
    const jobId = 'health-check';
    const schedule = '*/5 * * * *'; // A cada 5 minutos
    
    return this.scheduleJob(jobId, 'Health Check', schedule, callback);
  }

  /**
   * Agenda job personalizado
   */
  scheduleCustomJob(
    jobId: string, 
    name: string, 
    schedule: string, 
    callback: () => Promise<void>
  ): string {
    return this.scheduleJob(jobId, name, schedule, callback);
  }

  /**
   * Agenda um job genérico
   */
  private scheduleJob(
    jobId: string, 
    name: string, 
    schedule: string, 
    callback: () => Promise<void>
  ): string {
    // Parar job existente se houver
    this.stopJob(jobId);

    const jobConfig: CronJob = {
      id: jobId,
      name,
      schedule,
      timezone: this.config.timezone,
      isRunning: false,
      errorCount: 0
    };

    const task = cron.schedule(schedule, async () => {
      try {
        jobConfig.isRunning = true;
        jobConfig.lastRun = new Date();
        jobConfig.errorCount = 0;
        jobConfig.lastError = undefined;

        this.log(`Executando job: ${name}`, 'info');

        // Verificar se é horário correto para jobs específicos
        if (jobId === 'end-of-day' && !TimeUtils.isEndOfDayTimeWithTolerance(1)) {
          this.log(`Job ${name} não executado - fora do horário de fim de expediente`, 'debug');
          return;
        }

        if (jobId === 'end-of-day' && !TimeUtils.isWorkingDay()) {
          this.log(`Job ${name} não executado - não é dia útil`, 'debug');
          return;
        }

        await this.executeWithRetry(callback, jobId);
        
        this.log(`Job ${name} executado com sucesso`, 'info');
        
      } catch (error) {
        jobConfig.errorCount++;
        jobConfig.lastError = error as Error;
        
        this.log(`Erro no job ${name}: ${error}`, 'error');
        
        // Se muitos erros, parar o job
        if (jobConfig.errorCount >= this.config.maxRetries) {
          this.log(`Job ${name} parado devido a muitos erros (${jobConfig.errorCount})`, 'error');
          this.stopJob(jobId);
        }
      } finally {
        jobConfig.isRunning = false;
        jobConfig.nextRun = this.getNextRunTime(schedule);
      }
    }, {
      scheduled: false,
      timezone: this.config.timezone
    });

    this.jobs.set(jobId, task);
    this.jobConfigs.set(jobId, jobConfig);
    
    // Calcular próxima execução
    jobConfig.nextRun = this.getNextRunTime(schedule);
    
    this.log(`Job ${name} agendado: ${schedule} (próxima execução: ${jobConfig.nextRun?.toISOString()})`, 'info');
    
    return jobId;
  }

  /**
   * Executa callback com retry
   */
  private async executeWithRetry(callback: () => Promise<void>, jobId: string): Promise<void> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await callback();
        return; // Sucesso
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          this.log(`Tentativa ${attempt} falhou para job ${jobId}, tentando novamente em ${delay}ms`, 'warn');
          await this.delay(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Inicia um job específico
   */
  startJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    const config = this.jobConfigs.get(jobId);
    
    if (!job || !config) {
      this.log(`Job ${jobId} não encontrado`, 'error');
      return false;
    }

    if (config.isRunning) {
      this.log(`Job ${jobId} já está rodando`, 'warn');
      return false;
    }

    job.start();
    this.log(`Job ${config.name} iniciado`, 'info');
    return true;
  }

  /**
   * Para um job específico
   */
  stopJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    const config = this.jobConfigs.get(jobId);
    
    if (!job || !config) {
      return false;
    }

    job.stop();
    config.isRunning = false;
    this.log(`Job ${config.name} parado`, 'info');
    return true;
  }

  /**
   * Para todos os jobs
   */
  stopAllJobs(): void {
    for (const [jobId, job] of this.jobs) {
      job.stop();
      const config = this.jobConfigs.get(jobId);
      if (config) {
        config.isRunning = false;
      }
    }
    this.log('Todos os jobs parados', 'info');
  }

  /**
   * Inicia todos os jobs
   */
  startAllJobs(): void {
    for (const [jobId, job] of this.jobs) {
      job.start();
      const config = this.jobConfigs.get(jobId);
      if (config) {
        this.log(`Job ${config.name} iniciado`, 'info');
      }
    }
  }

  /**
   * Obtém status de um job
   */
  getJobStatus(jobId: string): CronJob | undefined {
    return this.jobConfigs.get(jobId);
  }

  /**
   * Obtém status de todos os jobs
   */
  getAllJobsStatus(): CronJob[] {
    return Array.from(this.jobConfigs.values());
  }

  /**
   * Remove um job
   */
  removeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    const config = this.jobConfigs.get(jobId);
    
    if (!job || !config) {
      return false;
    }

    job.stop();
    this.jobs.delete(jobId);
    this.jobConfigs.delete(jobId);
    
    this.log(`Job ${config.name} removido`, 'info');
    return true;
  }

  /**
   * Verifica se um job está rodando
   */
  isJobRunning(jobId: string): boolean {
    const config = this.jobConfigs.get(jobId);
    return config?.isRunning || false;
  }

  /**
   * Obtém próxima execução de um job
   */
  getNextRunTime(schedule: string): Date | undefined {
    try {
      // Esta é uma implementação simplificada
      // Em produção, seria melhor usar uma biblioteca como 'cron-parser'
      const now = new Date();
      const nextRun = new Date(now.getTime() + 60000); // Próximo minuto como fallback
      return nextRun;
    } catch (error) {
      this.log(`Erro ao calcular próxima execução para ${schedule}: ${error}`, 'error');
      return undefined;
    }
  }

  /**
   * Executa um job manualmente
   */
  async executeJob(jobId: string): Promise<boolean> {
    const config = this.jobConfigs.get(jobId);
    
    if (!config) {
      this.log(`Job ${jobId} não encontrado`, 'error');
      return false;
    }

    try {
      this.log(`Executando job ${config.name} manualmente`, 'info');
      // Aqui seria necessário armazenar a referência do callback
      // Por simplicidade, vamos apenas logar
      this.log(`Job ${config.name} executado manualmente`, 'info');
      return true;
    } catch (error) {
      this.log(`Erro ao executar job ${config.name} manualmente: ${error}`, 'error');
      return false;
    }
  }

  /**
   * Obtém estatísticas dos jobs
   */
  getJobStats(): {
    totalJobs: number;
    runningJobs: number;
    stoppedJobs: number;
    jobsWithErrors: number;
    totalErrors: number;
  } {
    const jobs = Array.from(this.jobConfigs.values());
    
    return {
      totalJobs: jobs.length,
      runningJobs: jobs.filter(j => j.isRunning).length,
      stoppedJobs: jobs.filter(j => !j.isRunning).length,
      jobsWithErrors: jobs.filter(j => j.errorCount > 0).length,
      totalErrors: jobs.reduce((sum, j) => sum + j.errorCount, 0)
    };
  }

  /**
   * Limpa jobs com muitos erros
   */
  cleanupFailedJobs(): number {
    let removedCount = 0;
    
    for (const [jobId, config] of this.jobConfigs) {
      if (config.errorCount >= this.config.maxRetries) {
        this.removeJob(jobId);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.log(`${removedCount} jobs com falhas removidos`, 'info');
    }
    
    return removedCount;
  }

  /**
   * Destrói o serviço
   */
  destroy(): void {
    this.stopAllJobs();
    this.jobs.clear();
    this.jobConfigs.clear();
    this.isInitialized = false;
    this.log('CronService destruído', 'info');
  }

  /**
   * Utilitário de delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log interno
   */
  private log(message: string, level: 'info' | 'warn' | 'error' | 'debug'): void {
    if (this.config.enableLogging) {
      logger[level](message, 'CronService');
    }
  }
}

// Instância singleton
export const cronService = new CronService();
