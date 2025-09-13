import { CronService } from './CronService';
import { IMonitoringService } from './MonitoringService';
import { IMessageService } from './MessageService';
import { IConfigManager } from './ConfigManager';
import { logger } from './Logger';
import { TimeUtils } from '../utils/TimeUtils';

export interface ProductionSchedulerConfig {
  enable30MinuteCheck: boolean;
  enableEndOfDayJob: boolean;
  enableDailyCleanup: boolean;
  enableHealthCheck: boolean;
  timezone: string;
}

export class ProductionScheduler {
  private cronService: CronService;
  private monitoringService: IMonitoringService;
  private messageService: IMessageService;
  private configManager: IConfigManager;
  private config: ProductionSchedulerConfig;
  private isInitialized: boolean = false;

  constructor(
    monitoringService: IMonitoringService,
    messageService: IMessageService,
    configManager: IConfigManager,
    config: Partial<ProductionSchedulerConfig> = {}
  ) {
    this.monitoringService = monitoringService;
    this.messageService = messageService;
    this.configManager = configManager;
    this.cronService = new CronService({
      timezone: 'America/Sao_Paulo',
      enableLogging: true,
      maxRetries: 3,
      retryDelay: 1000
    });

    this.config = {
      enable30MinuteCheck: true,
      enableEndOfDayJob: true,
      enableDailyCleanup: true,
      enableHealthCheck: true,
      timezone: 'America/Sao_Paulo',
      ...config
    };
  }

  /**
   * Inicializa o scheduler de produção
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.cronService.initialize();
    this.setupJobs();
    this.isInitialized = true;

    logger.info('ProductionScheduler inicializado com sucesso', 'ProductionScheduler');
  }

  /**
   * Configura todos os jobs necessários
   */
  private setupJobs(): void {
    // Job de verificação de 30 minutos (a cada minuto)
    if (this.config.enable30MinuteCheck) {
      this.cronService.scheduleThirtyMinuteCheck(async () => {
        await this.handle30MinuteCheck();
      });
    }

    // Job de fim de expediente (18:00 em dias úteis)
    if (this.config.enableEndOfDayJob) {
      this.cronService.scheduleEndOfDayJob(async () => {
        await this.handleEndOfDayMessages();
      });
    }

    // Job de limpeza diária (23:59 todos os dias)
    if (this.config.enableDailyCleanup) {
      this.cronService.scheduleDailyCleanup(async () => {
        await this.handleDailyCleanup();
      });
    }

    // Job de health check (a cada 5 minutos)
    if (this.config.enableHealthCheck) {
      this.cronService.scheduleHealthCheck(async () => {
        await this.handleHealthCheck();
      });
    }
  }

  /**
   * Inicia todos os jobs
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.cronService.startAllJobs();
    logger.info('Todos os jobs de produção iniciados', 'ProductionScheduler');
  }

  /**
   * Para todos os jobs
   */
  async stop(): Promise<void> {
    this.cronService.stopAllJobs();
    logger.info('Todos os jobs de produção parados', 'ProductionScheduler');
  }

  /**
   * Pausa jobs específicos (mantém health check)
   */
  async pause(): Promise<void> {
    this.cronService.stopJob('thirty-minute-check');
    this.cronService.stopJob('end-of-day');
    logger.info('Jobs de mensagens pausados', 'ProductionScheduler');
  }

  /**
   * Retoma jobs pausados
   */
  async resume(): Promise<void> {
    this.cronService.startJob('thirty-minute-check');
    this.cronService.startJob('end-of-day');
    logger.info('Jobs de mensagens retomados', 'ProductionScheduler');
  }

  /**
   * Verifica se está rodando
   */
  isRunning(): boolean {
    const stats = this.cronService.getJobStats();
    return stats.runningJobs > 0;
  }

  /**
   * Verifica se está pausado
   */
  isPaused(): boolean {
    const thirtyMinJob = this.cronService.getJobStatus('thirty-minute-check');
    const endOfDayJob = this.cronService.getJobStatus('end-of-day');
    
    return (!thirtyMinJob?.isRunning && !endOfDayJob?.isRunning);
  }

  /**
   * Manipula verificação de 30 minutos
   */
  private async handle30MinuteCheck(): Promise<void> {
    try {
      // Verificar se fluxo está pausado
      if (this.configManager.isFlowPaused()) {
        logger.debug('Verificação de 30 minutos pausada', 'ProductionScheduler');
        return;
      }

      // Verificar se é horário comercial e dia útil
      if (!TimeUtils.isBusinessTime()) {
        logger.debug('Fora do horário comercial para verificação de 30 minutos', 'ProductionScheduler');
        return;
      }

      // Buscar pacientes elegíveis
      const eligiblePatients = await this.monitoringService.getEligiblePatientsFor30MinMessage();
      
      if (eligiblePatients.length === 0) {
        logger.debug('Nenhum paciente elegível para mensagem de 30 minutos', 'ProductionScheduler');
        return;
      }

      logger.info(`${eligiblePatients.length} pacientes elegíveis para mensagem de 30 minutos`, 'ProductionScheduler');

      // Processar cada paciente
      for (const patient of eligiblePatients) {
        try {
          const success = await this.messageService.send30MinuteMessage(patient);
          if (success) {
            logger.info(`Mensagem de 30 minutos enviada para paciente ${patient.id}`, 'ProductionScheduler');
          } else {
            logger.warn(`Falha ao enviar mensagem de 30 minutos para paciente ${patient.id}`, 'ProductionScheduler');
          }
        } catch (error) {
          logger.error(`Erro ao processar paciente ${patient.id}: ${error}`, 'ProductionScheduler');
        }
      }

    } catch (error) {
      logger.error(`Erro na verificação de 30 minutos: ${error}`, 'ProductionScheduler');
    }
  }

  /**
   * Manipula mensagens de fim de expediente
   */
  private async handleEndOfDayMessages(): Promise<void> {
    try {
      // Verificar se fluxo está pausado
      if (this.configManager.isFlowPaused()) {
        logger.debug('Mensagens de fim de expediente pausadas', 'ProductionScheduler');
        return;
      }

      // Verificar se é horário de fim de expediente
      if (!TimeUtils.isEndOfDayTimeWithTolerance(1)) {
        logger.debug('Fora do horário de fim de expediente', 'ProductionScheduler');
        return;
      }

      // Verificar se é dia útil
      if (!TimeUtils.isWorkingDay()) {
        logger.debug('Não é dia útil para mensagens de fim de expediente', 'ProductionScheduler');
        return;
      }

      // Buscar pacientes elegíveis
      const eligiblePatients = await this.monitoringService.getEligiblePatientsForEndOfDayMessage();
      
      if (eligiblePatients.length === 0) {
        logger.info('Nenhum paciente elegível para mensagem de fim de expediente', 'ProductionScheduler');
        return;
      }

      logger.info(`${eligiblePatients.length} pacientes elegíveis para mensagem de fim de expediente`, 'ProductionScheduler');

      // Enviar mensagens de fim de expediente
      await this.messageService.sendEndOfDayMessages(eligiblePatients);

    } catch (error) {
      logger.error(`Erro nas mensagens de fim de expediente: ${error}`, 'ProductionScheduler');
    }
  }

  /**
   * Manipula limpeza diária
   */
  private async handleDailyCleanup(): Promise<void> {
    try {
      logger.info('Iniciando limpeza diária', 'ProductionScheduler');

      // Limpar dados temporários do Supabase
      // Aqui seria implementada a lógica de limpeza específica
      // Por exemplo, remover registros de exclusão antigos, limpar logs, etc.

      logger.info('Limpeza diária concluída', 'ProductionScheduler');

    } catch (error) {
      logger.error(`Erro na limpeza diária: ${error}`, 'ProductionScheduler');
    }
  }

  /**
   * Manipula health check
   */
  private async handleHealthCheck(): Promise<void> {
    try {
      // Verificar status dos serviços
      const monitoringStats = this.monitoringService.getMonitoringStats();
      const configStats = this.configManager.getSystemConfig();
      
      // Log de status (sem dados sensíveis)
      logger.debug('Health check executado', 'ProductionScheduler', {
        monitoringStats: {
          totalPatients: monitoringStats.totalPatients,
          eligiblePatients: 0,
          lastCheck: new Date()
        },
        systemConfig: {
          flowPaused: configStats.flowPaused,
          endOfDayTime: configStats.endOfDayTime
        }
      });

    } catch (error) {
      logger.error(`Erro no health check: ${error}`, 'ProductionScheduler');
    }
  }

  /**
   * Obtém status de todos os jobs
   */
  getJobsStatus(): any[] {
    return this.cronService.getAllJobsStatus();
  }

  /**
   * Obtém estatísticas dos jobs
   */
  getJobsStats(): any {
    return this.cronService.getJobStats();
  }

  /**
   * Executa job específico manualmente
   */
  async executeJob(jobId: string): Promise<boolean> {
    return await this.cronService.executeJob(jobId);
  }

  /**
   * Obtém informações de tempo
   */
  getTimeInfo(): any {
    return TimeUtils.getTimeInfo();
  }

  /**
   * Destrói o scheduler
   */
  async destroy(): Promise<void> {
    await this.stop();
    this.cronService.destroy();
    this.isInitialized = false;
    logger.info('ProductionScheduler destruído', 'ProductionScheduler');
  }
}

/**
 * Factory function para criar ProductionScheduler
 */
export function createProductionScheduler(
  monitoringService: IMonitoringService,
  messageService: IMessageService,
  configManager: IConfigManager,
  config?: Partial<ProductionSchedulerConfig>
): ProductionScheduler {
  return new ProductionScheduler(monitoringService, messageService, configManager, config);
}
