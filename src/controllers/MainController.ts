import { SystemStatus } from '../models';
import { ConfigManager, IConfigManager } from '../services/ConfigManager';
import { MonitoringService, IMonitoringService } from '../services/MonitoringService';
import { MessageService, IMessageService } from '../services/MessageService';
import { KrolikApiClient } from '../services/KrolikApiClient';
import { ErrorHandler, IErrorHandler } from '../services/ErrorHandler';
import { MonitoringScheduler, createMonitoringScheduler } from '../services/Scheduler';
import { WaitingPatient } from '../models';
import { logger, Logger } from '../services/Logger';
import { LogLevel, LogEntry } from '../services/ErrorHandler';
import { metricsService } from '../services/MetricsService';

export interface IMainController {
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): SystemStatus;
  pauseFlow(): void;
  resumeFlow(): void;
  initialize(): Promise<void>;
  isInitialized(): boolean;
  getLogs(level?: LogLevel, limit?: number): LogEntry[];
  clearLogs(): void;
  getErrorStats(): any;
  getMetrics(): any;
  getAlerts(): any;
}

export class MainController implements IMainController {
  private configManager: IConfigManager;
  private monitoringService: IMonitoringService;
  private messageService: IMessageService;
  private krolikApiClient: KrolikApiClient;
  private errorHandler: IErrorHandler;
  private monitoringScheduler: MonitoringScheduler;
  
  private isRunning: boolean = false;
  private initialized: boolean = false;
  private startTime: Date = new Date();

  constructor() {
    // Inicializar ErrorHandler primeiro
    this.errorHandler = new ErrorHandler();
    
    // Inicializar ConfigManager
    this.configManager = new ConfigManager(this.errorHandler);
    
    // Inicializar KrolikApiClient com configuração padrão
    const defaultApiConfig = {
      baseUrl: process.env.KROLIK_API_URL || 'https://api.camkrolik.com',
      apiToken: process.env.KROLIK_API_TOKEN || '',
      timeout: 10000,
      maxRetries: 3,
      retryDelay: 1000
    };
    this.krolikApiClient = new KrolikApiClient(defaultApiConfig);
    
    // Inicializar MonitoringService
    this.monitoringService = new MonitoringService(
      this.krolikApiClient,
      this.configManager
    );
    
    // Inicializar MessageService
    this.messageService = new MessageService(
      this.configManager,
      this.krolikApiClient,
      this.errorHandler
    );
    
    // Inicializar MonitoringScheduler
    this.monitoringScheduler = createMonitoringScheduler(
      this.monitoringService,
      this.configManager,
      { intervalMs: 60000, autoStart: false }
    );
    
    // Configurar callback para processar pacientes elegíveis
    if (this.monitoringScheduler && this.monitoringScheduler.onEligiblePatientsFound) {
      this.monitoringScheduler.onEligiblePatientsFound(
        (patients) => this.processEligiblePatients(patients)
      );
    }
  }

  /**
   * Inicializa todos os serviços
   * Requisito: Todos os requisitos dependem da coordenação
   */
  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        logger.info('Sistema já foi inicializado', 'MainController.initialize');
        return;
      }

      logger.info('Inicializando sistema...', 'MainController.initialize');

      // Inicializar ConfigManager (carrega configurações e dados)
      await this.configManager.initialize();
      logger.info('ConfigManager inicializado', 'MainController.initialize');
      
      // Inicializar KrolikApiClient se necessário
      // (configurações de API são carregadas do ConfigManager)
      
      this.initialized = true;
      this.startTime = new Date();
      
      logger.info('MainController inicializado com sucesso', 'MainController.initialize');
    } catch (error) {
      logger.error('Erro ao inicializar sistema', 'MainController.initialize', error as Error);
      this.errorHandler.logError(
        error as Error,
        'MainController.initialize'
      );
      throw new Error('Falha na inicialização do sistema');
    }
  }

  /**
   * Verifica se o sistema foi inicializado
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Inicia o sistema de automação
   * Requisito: Coordenação entre todos os serviços
   */
  async start(): Promise<void> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.isRunning) {
        logger.info('Sistema já está rodando', 'MainController.start');
        return;
      }

      logger.info('Iniciando sistema de automação...', 'MainController.start');

      // Iniciar scheduler de monitoramento
      this.monitoringScheduler.start();
      logger.info('Scheduler de monitoramento iniciado', 'MainController.start');
      
      this.isRunning = true;
      
      logger.info('Sistema de automação iniciado com sucesso', 'MainController.start');
      
    } catch (error) {
      logger.error('Falha ao iniciar o sistema', 'MainController.start', error as Error);
      this.errorHandler.logError(
        error as Error,
        'MainController.start'
      );
      throw new Error('Falha ao iniciar o sistema');
    }
  }

  /**
   * Para o sistema de automação
   * Requisito: Gerenciamento de ciclo de vida da aplicação
   */
  async stop(): Promise<void> {
    try {
      if (!this.isRunning) {
        logger.info('Sistema já está parado', 'MainController.stop');
        return;
      }

      logger.info('Parando sistema de automação...', 'MainController.stop');

      // Parar scheduler de monitoramento
      this.monitoringScheduler.stop();
      logger.info('Scheduler de monitoramento parado', 'MainController.stop');
      
      // Executar limpeza diária se necessário
      await this.configManager.cleanupDailyData();
      logger.info('Limpeza diária executada', 'MainController.stop');
      
      this.isRunning = false;
      
      logger.info('Sistema de automação parado com sucesso', 'MainController.stop');
      
    } catch (error) {
      logger.error('Falha ao parar o sistema', 'MainController.stop', error as Error);
      this.errorHandler.logError(
        error as Error,
        'MainController.stop'
      );
      throw new Error('Falha ao parar o sistema');
    }
  }

  /**
   * Obtém status completo do sistema
   * Requisito: Coordenação e monitoramento de todos os componentes
   */
  getStatus(): SystemStatus {
    try {
      const monitoringStats = this.monitoringService.getMonitoringStats();
      const schedulerStats = this.monitoringScheduler.getStats();
      const errorStats = this.errorHandler.getErrorStats();
      const uptime = Date.now() - this.startTime.getTime();

      return {
        isRunning: this.isRunning,
        isPaused: this.configManager.isFlowPaused(),
        flowActive: this.isRunning && !this.configManager.isFlowPaused(),
        lastUpdate: new Date(),
        monitoringStats,
        schedulerStats: {
          isRunning: schedulerStats.isRunning,
          isPaused: schedulerStats.isPaused,
          interval: schedulerStats.interval
        },
        errorStats,
        uptime
      };
    } catch (error) {
      this.errorHandler.logError(
        error as Error,
        'MainController.getStatus'
      );
      
      // Retornar status de erro
      return {
        isRunning: false,
        isPaused: true,
        flowActive: false,
        lastUpdate: new Date(),
        monitoringStats: {
          totalPatients: 0,
          patientsOver30Min: 0,
          averageWaitTime: 0,
          lastUpdate: new Date(0)
        },
        schedulerStats: {
          isRunning: false,
          isPaused: true,
          interval: 60000
        },
        errorStats: {
          totalErrors: 1,
          errorsByType: { 'status_error': 1 },
          errorsByContext: { 'MainController.getStatus': 1 },
          lastError: {
            message: error instanceof Error ? error.message : 'Erro desconhecido',
            context: 'MainController.getStatus',
            timestamp: new Date()
          }
        },
        uptime: 0
      };
    }
  }

  /**
   * Pausa o fluxo de automação
   * Requisitos: 1.4, 3.2, 3.3 - Pausar fluxo mas continuar monitorando
   */
  pauseFlow(): void {
    try {
      logger.info('Pausando fluxo de automação...', 'MainController.pauseFlow');
      
      // Pausar através do ConfigManager (persiste a configuração)
      this.configManager.updateSystemConfig({ flowPaused: true });
      
      // Pausar scheduler (continua rodando mas não processa)
      if (this.monitoringScheduler && this.monitoringScheduler.pause) {
        this.monitoringScheduler.pause();
      }
      
      logger.info('Fluxo de automação pausado com sucesso', 'MainController.pauseFlow');
      
    } catch (error) {
      logger.error('Falha ao pausar o fluxo', 'MainController.pauseFlow', error as Error);
      this.errorHandler.logError(
        error as Error,
        'MainController.pauseFlow'
      );
      throw new Error('Falha ao pausar o fluxo');
    }
  }

  /**
   * Retoma o fluxo de automação
   * Requisitos: 3.2, 3.3 - Reativar fluxo
   */
  resumeFlow(): void {
    try {
      logger.info('Retomando fluxo de automação...', 'MainController.resumeFlow');
      
      // Retomar através do ConfigManager (persiste a configuração)
      this.configManager.updateSystemConfig({ flowPaused: false });
      
      // Retomar scheduler
      if (this.monitoringScheduler && this.monitoringScheduler.resume) {
        this.monitoringScheduler.resume();
      }
      
      logger.info('Fluxo de automação retomado com sucesso', 'MainController.resumeFlow');
      
    } catch (error) {
      logger.error('Falha ao retomar o fluxo', 'MainController.resumeFlow', error as Error);
      this.errorHandler.logError(
        error as Error,
        'MainController.resumeFlow'
      );
      throw new Error('Falha ao retomar o fluxo');
    }
  }

  /**
   * Verifica se o fluxo está pausado
   * Requisito: 3.2, 3.3 - Status do fluxo
   */
  isFlowPaused(): boolean {
    return this.configManager.isFlowPaused();
  }

  /**
   * Verifica se o sistema está ativo (rodando e não pausado)
   * Requisito: Coordenação geral do sistema
   */
  isSystemActive(): boolean {
    return this.isRunning && !this.isFlowPaused();
  }

  /**
   * Processa pacientes elegíveis encontrados pelo monitoramento
   * Requisitos: 1.1, 1.2, 2.1 - Coordenação entre monitoramento e envio
   */
  private async processEligiblePatients(patients: WaitingPatient[]): Promise<void> {
    try {
      if (patients.length === 0) {
        return;
      }

      // Processar mensagens de 30 minutos
      await this.process30MinuteMessages(patients);
      
      // Processar mensagens de fim de expediente (apenas no horário correto)
      await this.processEndOfDayMessages();

    } catch (error) {
      this.errorHandler.logError(
        error as Error,
        'MainController.processEligiblePatients'
      );
    }
  }

  /**
   * Processa mensagens de 30 minutos
   * Requisitos: 1.1, 1.2 - Mensagem após 30 minutos sem duplicação
   */
  private async process30MinuteMessages(patients: WaitingPatient[]): Promise<void> {
    try {
      const eligiblePatients = await this.monitoringService.getEligiblePatientsFor30MinMessage();
      
      if (eligiblePatients.length === 0) {
        return;
      }

      console.log(`Processando ${eligiblePatients.length} pacientes para mensagem de 30 minutos`);
      
      let successCount = 0;
      let errorCount = 0;

      for (const patient of eligiblePatients) {
        try {
          const sent = await this.messageService.send30MinuteMessage(patient);
          if (sent) {
            successCount++;
            console.log(`Mensagem de 30 min enviada para paciente ${patient.name} (${patient.id})`);
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          this.errorHandler.logError(
            error as Error,
            `MainController.process30MinuteMessages - Patient: ${patient.id}`
          );
        }
      }

      console.log(`Mensagens de 30 min: ${successCount} enviadas, ${errorCount} falharam`);
      
    } catch (error) {
      this.errorHandler.logError(
        error as Error,
        'MainController.process30MinuteMessages'
      );
    }
  }

  /**
   * Processa mensagens de fim de expediente
   * Requisitos: 2.1, 2.4 - Mensagem às 18h em dias úteis
   */
  private async processEndOfDayMessages(): Promise<void> {
    try {
      // Verificar se é horário de fim de expediente
      if (!this.isEndOfDayTime()) {
        return;
      }

      const eligiblePatients = await this.monitoringService.getEligiblePatientsForEndOfDayMessage();
      
      if (eligiblePatients.length === 0) {
        return;
      }

      console.log(`Processando ${eligiblePatients.length} pacientes para mensagem de fim de expediente`);
      
      try {
        await this.messageService.sendEndOfDayMessages(eligiblePatients);
        console.log('Mensagens de fim de expediente enviadas com sucesso');
      } catch (error) {
        this.errorHandler.logError(
          error as Error,
          'MainController.processEndOfDayMessages'
        );
      }
      
    } catch (error) {
      this.errorHandler.logError(
        error as Error,
        'MainController.processEndOfDayMessages'
      );
    }
  }

  /**
   * Verifica se é horário de fim de expediente
   * Requisito: 2.4 - Mensagem às 18h em dias úteis
   */
  private isEndOfDayTime(): boolean {
    const now = new Date();
    
    // Verificar se é dia útil
    if (!this.monitoringService.isWorkingDay()) {
      return false;
    }

    // Verificar se é o horário configurado (padrão 18:00)
    const config = this.configManager.getSystemConfig();
    const [endHour, endMinute] = config.endOfDayTime.split(':').map(Number);
    
    // Converter para horário de Brasília (UTC-3)
    const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const currentHour = brasiliaTime.getHours();
    const currentMinute = brasiliaTime.getMinutes();
    
    // Verificar se é exatamente o horário de fim de expediente (com tolerância de 1 minuto)
    return currentHour === endHour && Math.abs(currentMinute - endMinute) <= 1;
  }

  /**
   * Força verificação imediata (útil para testes e debug)
   */
  async forceCheck(): Promise<void> {
    try {
      if (!this.isRunning) {
        throw new Error('Sistema não está rodando');
      }

      await this.monitoringScheduler.forceCheck();
      console.log('Verificação forçada executada');
      
    } catch (error) {
      this.errorHandler.logError(
        error as Error,
        'MainController.forceCheck'
      );
      throw error;
    }
  }

  /**
   * Obtém configuração atual do sistema
   */
  getSystemConfig() {
    return this.configManager.getSystemConfig();
  }

  /**
   * Atualiza configuração do sistema
   */
  async updateSystemConfig(updates: any) {
    await this.configManager.updateSystemConfig(updates);
  }

  /**
   * Obtém estatísticas detalhadas
   */
  getDetailedStats() {
    return {
      system: this.getStatus(),
      monitoring: this.monitoringService.getMonitoringStats(),
      scheduler: this.monitoringScheduler.getStats(),
      config: this.configManager.getSystemConfig()
    };
  }

  /**
   * Obtém logs do sistema
   */
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    return logger.getLogs(level, limit);
  }

  /**
   * Limpa todos os logs
   */
  clearLogs(): void {
    logger.clearLogs();
    logger.info('Logs limpos pelo usuário', 'MainController.clearLogs');
  }

  /**
   * Obtém estatísticas de erros
   */
  getErrorStats() {
    return logger.getErrorStats();
  }

  /**
   * Obtém todas as métricas do sistema
   */
  getMetrics() {
    return metricsService.getAllMetrics();
  }

  /**
   * Obtém alertas ativos do sistema
   */
  getAlerts() {
    return metricsService.checkAlerts();
  }

  /**
   * Tratamento global de erros não capturados
   */
  private setupGlobalErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      this.errorHandler.logError(error, 'MainController.uncaughtException');
      logger.critical('Erro não capturado no processo', 'MainController.uncaughtException', error);
      console.error('Erro não capturado:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.errorHandler.logError(error, 'MainController.unhandledRejection');
      logger.critical('Promise rejeitada não tratada', 'MainController.unhandledRejection', error);
      console.error('Promise rejeitada não tratada:', reason);
    });
  }
}