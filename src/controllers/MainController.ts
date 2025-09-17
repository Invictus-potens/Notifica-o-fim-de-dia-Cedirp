import { SystemStatus } from '../models';
import { ConfigManager, IConfigManager } from '../services/ConfigManager';
import { MonitoringService, IMonitoringService } from '../services/MonitoringService';
import { MessageService, IMessageService } from '../services/MessageService';
import { KrolikApiClient } from '../services/KrolikApiClient';
import { ErrorHandler, IErrorHandler } from '../services/ErrorHandler';
import { MonitoringScheduler, createMonitoringScheduler } from '../services/Scheduler';
import { ProductionScheduler, createProductionScheduler } from '../services/ProductionScheduler';
import { WaitingPatient } from '../models';
import { logger, Logger } from '../services/Logger';
import { LogLevel, LogEntry } from '../services/ErrorHandler';
import { metricsService } from '../services/MetricsService';
import { TimeUtils } from '../utils/TimeUtils';
import { ConsoleMonitor } from '../services/ConsoleMonitor';
import { HealthCheckService } from '../services/HealthCheckService';
import { SupabaseClient } from '../services/SupabaseClient';
import { SimpleConsoleLogger } from '../services/SimpleConsoleLogger';
import { Sector, ActionCard, Channel } from '../models/ApiTypes';
import { logsService } from '../services/LogsService';

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
  getSectors(): Promise<Sector[]>;
  getActionCards(): Promise<ActionCard[]>;
  getChannels(): Promise<Channel[]>;
  sendActionCardToPatients(patients: Array<{number: string, contactId: string}>, actionCardId: string): Promise<{success: number, failed: number, results: any[]}>;
}

export class MainController implements IMainController {
  private configManager: IConfigManager;
  private monitoringService: IMonitoringService;
  private messageService: IMessageService;
  private krolikApiClient: KrolikApiClient;
  private errorHandler: IErrorHandler;
  private monitoringScheduler: MonitoringScheduler;
  private productionScheduler: ProductionScheduler;
  private consoleMonitor: ConsoleMonitor;
  private healthCheckService: HealthCheckService;
  private supabaseClient: SupabaseClient;
  private simpleLogger: SimpleConsoleLogger;
  
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
      baseUrl: process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com.br',
      apiToken: process.env.KROLIK_API_TOKEN || '',
      timeout: 10000,
      maxRetries: 3,
      retryDelay: 1000
    };
    this.krolikApiClient = new KrolikApiClient(defaultApiConfig);

    // Inicializar SupabaseClient
    this.supabaseClient = new SupabaseClient(this.errorHandler);
    
    // Inicializar MonitoringService
    this.monitoringService = new MonitoringService(
      this.krolikApiClient,
      this.configManager,
      this.errorHandler
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
    
    // Inicializar ProductionScheduler
    this.productionScheduler = createProductionScheduler(
      this.monitoringService,
      this.messageService,
      this.configManager
    );

    // Inicializar HealthCheckService
    this.healthCheckService = new HealthCheckService(
      this.configManager,
      this.monitoringService,
      this.messageService,
      this.krolikApiClient,
      this.supabaseClient
    );

    // Inicializar ConsoleMonitor
    this.consoleMonitor = new ConsoleMonitor(
      logger,
      this.healthCheckService,
      metricsService
    );

    // Inicializar SimpleConsoleLogger
    this.simpleLogger = SimpleConsoleLogger.getInstance();
    
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

      this.consoleMonitor.showStartupInfo();

      // Inicializar ConfigManager (carrega configurações e dados)
      await this.configManager.initialize();
      this.consoleMonitor.showComponentInitialized('ConfigManager');
      
      // Inicializar MonitoringService (inicializa JsonPatientManager)
      await this.monitoringService.initialize();
      this.consoleMonitor.showComponentInitialized('MonitoringService');
      
      // Testar conectividade com API CAM Krolik
      console.log('\n🔍 TESTANDO CONECTIVIDADE COM API CAM KROLIK...');
      const apiConnected = await this.krolikApiClient.testConnection();
      if (apiConnected) {
        this.simpleLogger.logInfo('API CAM Krolik conectada com sucesso!');
      } else {
        this.simpleLogger.logError('Falha na conexão com API CAM Krolik');
      }
      
      this.consoleMonitor.showComponentInitialized('KrolikApiClient');
      
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
      // Iniciar ProductionScheduler (cron jobs reais)
      await this.productionScheduler.start();
      logger.info('ProductionScheduler iniciado', 'MainController.start');
      
      // Manter MonitoringScheduler para compatibilidade (pode ser removido depois)
      this.monitoringScheduler.start();
      logger.info('Scheduler de monitoramento iniciado', 'MainController.start');
      
      // Iniciar ConsoleMonitor
      this.consoleMonitor.start();
      
      // Iniciar SimpleConsoleLogger
      this.simpleLogger.start();
      
      this.isRunning = true;
      
      this.consoleMonitor.showSystemReady();
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

      // Parar ProductionScheduler
      await this.productionScheduler.stop();
      logger.info('ProductionScheduler parado', 'MainController.stop');
      
      // Parar scheduler de monitoramento
      this.monitoringScheduler.stop();
      logger.info('Scheduler de monitoramento parado', 'MainController.stop');
      
      // Parar ConsoleMonitor
      this.consoleMonitor.stop();
      
      // Parar SimpleConsoleLogger
      this.simpleLogger.stop();
      
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
        apiConnected: this.krolikApiClient ? true : false, // Simplified for now
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
        apiConnected: false,
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

      this.simpleLogger.logInfo(`Processando ${eligiblePatients.length} pacientes para mensagem de 30 min`);
      
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

      this.simpleLogger.logMessageSent('30min', successCount);
      if (errorCount > 0) {
        this.simpleLogger.logError(`${errorCount} mensagens de 30min falharam`);
      }
      
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

      this.simpleLogger.logInfo(`Processando ${eligiblePatients.length} pacientes para mensagem de fim de expediente`);
      
      try {
        await this.messageService.sendEndOfDayMessages(eligiblePatients);
        this.simpleLogger.logMessageSent('end_of_day', eligiblePatients.length);
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
    return TimeUtils.isEndOfDayTimeWithTolerance(1) && TimeUtils.isWorkingDay();
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
   * Obtém o MonitoringService para testes
   */
  getMonitoringService(): IMonitoringService {
    return this.monitoringService;
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
   * Obtém lista de pacientes em espera
   */
  async getWaitingPatients() {
    try {
      if (!this.krolikApiClient) {
        throw new Error('Cliente da API não inicializado');
      }
      
      const patients = await this.krolikApiClient.listWaitingAttendances();
      return patients;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'MainController.getWaitingPatients');
      throw error;
    }
  }

  /**
   * Obtém lista de setores
   */
  async getSectors() {
    try {
      if (!this.krolikApiClient) {
        throw new Error('Cliente da API não inicializado');
      }
      
      console.log('📋 Buscando setores...');
      const sectors = await this.krolikApiClient.getSectors();
      
      console.log(`📋 Retornando ${sectors.length} setores`);
      return sectors;
    } catch (error) {
      console.error('❌ Erro ao buscar setores:', error);
      this.errorHandler.logError(error as Error, 'MainController.getSectors');
      throw error;
    }
  }

  /**
   * Obtém lista de cartões de ação
   */
  async getActionCards() {
    try {
      if (!this.krolikApiClient) {
        throw new Error('Cliente da API não inicializado');
      }
      
      console.log('📋 Buscando cartões de ação...');
      const actionCards = await this.krolikApiClient.getActionCards();
      
      // Filtrar apenas cartões ativos se necessário
      const activeCards = actionCards.filter(card => card.active !== false);
      
      console.log(`📋 Retornando ${activeCards.length} cartões de ação ativos`);
      return activeCards;
    } catch (error) {
      console.error('❌ Erro ao buscar cartões de ação:', error);
      this.errorHandler.logError(error as Error, 'MainController.getActionCards');
      throw error;
    }
  }


  /**
   * Obtém lista de canais
   */
  async getChannels() {
    try {
      if (!this.krolikApiClient) {
        throw new Error('Cliente da API não inicializado');
      }
      
      console.log('📋 Buscando canais...');
      const channels = await this.krolikApiClient.getChannels();
      
      console.log(`📋 Retornando ${channels.length} canais`);
      return channels;
    } catch (error) {
      console.error('❌ Erro ao buscar canais:', error);
      this.errorHandler.logError(error as Error, 'MainController.getChannels');
      throw error;
    }
  }

  /**
   * Envia cartão de ação para pacientes selecionados
   */
  async sendActionCardToPatients(patients: Array<{number: string, contactId: string}>, actionCardId: string) {
    try {
      if (!this.krolikApiClient) {
        throw new Error('Cliente da API não inicializado');
      }

      console.log(`📤 Enviando cartão de ação ${actionCardId} para ${patients.length} pacientes...`);
      
      const results = [];
      let successCount = 0;
      let failedCount = 0;

      for (const patient of patients) {
        try {
          console.log(`🔍 Processando paciente: ${patient.number} (${patient.contactId})`);
          console.log(`🔍 Action Card ID: ${actionCardId}`);
          
          const payload = {
            number: patient.number,
            contactId: patient.contactId,
            action_card_id: actionCardId
          };

          console.log(`📤 Payload para envio:`, payload);

          const success = await this.krolikApiClient.sendActionCardByPhone(patient.number, actionCardId);
          
          console.log(`📊 Resultado do envio para ${patient.number}: ${success ? 'SUCESSO' : 'FALHA'}`);
          
          results.push({
            contactId: patient.contactId,
            number: patient.number,
            success,
            message: success ? 'Cartão enviado com sucesso' : 'Falha ao enviar cartão'
          });
          
          if (success) {
            successCount++;
            console.log(`✅ Cartão enviado para ${patient.number} (${patient.contactId})`);
          } else {
            failedCount++;
            console.log(`❌ Falha ao enviar cartão para ${patient.number} (${patient.contactId}) - Verifique se o Action Card ID existe na API`);
          }
        } catch (error) {
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          console.error(`❌ ERRO DETALHADO ao enviar cartão para ${patient.number} (${patient.contactId}):`);
          console.error(`   - Tipo do erro: ${error instanceof Error ? error.constructor.name : 'Unknown'}`);
          console.error(`   - Mensagem: ${errorMessage}`);
          console.error(`   - Stack trace:`, error instanceof Error ? error.stack : 'N/A');
          
          results.push({
            contactId: patient.contactId,
            number: patient.number,
            success: false,
            message: `Erro: ${errorMessage}`
          });
        }
      }

      console.log(`📊 Resultado: ${successCount} sucessos, ${failedCount} falhas`);
      
      return {
        success: successCount,
        failed: failedCount,
        results
      };
    } catch (error) {
      console.error('❌ Erro ao enviar cartões de ação:', error);
      this.errorHandler.logError(error as Error, 'MainController.sendActionCardToPatients');
      throw error;
    }
  }


  /**
   * Executa health check completo
   */
  async performHealthCheck() {
    return await this.healthCheckService.performHealthCheck();
  }

  /**
   * Executa health check rápido
   */
  async performQuickHealthCheck() {
    return await this.healthCheckService.performQuickHealthCheck();
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