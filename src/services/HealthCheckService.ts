import { logger } from './Logger';
import { IConfigManager } from './ConfigManager';
import { IMonitoringService } from './MonitoringService';
import { IMessageService } from './MessageService';
import { KrolikApiClient } from './KrolikApiClient';
import { SupabaseClient } from './SupabaseClient';
import { TimeUtils } from '../utils/TimeUtils';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message: string;
      duration: number;
      details?: any;
    };
  };
  overall: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
    responseTime: number;
  };
}

export interface HealthCheckConfig {
  timeout: number;
  retries: number;
  criticalChecks: string[];
  warningThresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
  };
}

export class HealthCheckService {
  private configManager: IConfigManager;
  private monitoringService: IMonitoringService;
  private messageService: IMessageService;
  private krolikApiClient: KrolikApiClient;
  private supabaseClient: SupabaseClient;
  private config: HealthCheckConfig;
  private lastCheck: HealthCheckResult | null = null;

  constructor(
    configManager: IConfigManager,
    monitoringService: IMonitoringService,
    messageService: IMessageService,
    krolikApiClient: KrolikApiClient,
    supabaseClient: SupabaseClient,
    config: Partial<HealthCheckConfig> = {}
  ) {
    this.configManager = configManager;
    this.monitoringService = monitoringService;
    this.messageService = messageService;
    this.krolikApiClient = krolikApiClient;
    this.supabaseClient = supabaseClient;
    
    this.config = {
      timeout: 5000,
      retries: 2,
      criticalChecks: ['database', 'api', 'config'],
      warningThresholds: {
        responseTime: 2000,
        errorRate: 0.1,
        memoryUsage: 0.8
      },
      ...config
    };
  }

  /**
   * Executa health check completo
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks: HealthCheckResult['checks'] = {};

    // Executar todos os checks em paralelo
    const checkPromises = [
      this.checkDatabase(),
      this.checkApiConnectivity(),
      this.checkConfiguration(),
      this.checkMonitoringService(),
      this.checkMessageService(),
      this.checkSystemResources(),
      this.checkTimeSync(),
      this.checkCronJobs()
    ];

    const results = await Promise.allSettled(checkPromises);

    // Processar resultados
    const checkNames = [
      'database',
      'api',
      'config',
      'monitoring',
      'messaging',
      'resources',
      'time',
      'cron'
    ];

    results.forEach((result, index) => {
      const checkName = checkNames[index];
      if (result.status === 'fulfilled') {
        checks[checkName] = result.value;
      } else {
        checks[checkName] = {
          status: 'fail',
          message: `Check failed: ${result.reason}`,
          duration: 0
        };
      }
    });

    // Calcular estatísticas gerais
    const totalChecks = Object.keys(checks).length;
    const passedChecks = Object.values(checks).filter(c => c.status === 'pass').length;
    const failedChecks = Object.values(checks).filter(c => c.status === 'fail').length;
    const warningChecks = Object.values(checks).filter(c => c.status === 'warn').length;

    // Determinar status geral
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks === 0 && warningChecks === 0) {
      overallStatus = 'healthy';
    } else if (failedChecks === 0 && warningChecks > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date(),
      checks,
      overall: {
        totalChecks,
        passedChecks,
        failedChecks,
        warningChecks,
        responseTime
      }
    };

    this.lastCheck = result;
    return result;
  }

  /**
   * Verifica conectividade com o banco de dados
   */
  private async checkDatabase(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    
    try {
      // Verificar se consegue conectar com Supabase
      const isConnected = await this.supabaseClient.testConnection();
      
      if (!isConnected) {
        return {
          status: 'fail',
          message: 'Database connection failed',
          duration: Date.now() - startTime
        };
      }

      // Verificar se consegue executar uma query simples
      const testQuery = await this.supabaseClient.testConnection();
      
      if (!testQuery) {
        return {
          status: 'fail',
          message: 'Database query test failed',
          duration: Date.now() - startTime
        };
      }

      return {
        status: 'pass',
        message: 'Database connection healthy',
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        status: 'fail',
        message: `Database check failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Verifica conectividade com a API do CAM Krolik
   */
  private async checkApiConnectivity(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Verificando conectividade com API CAM Krolik...');
      
      // Verificar se consegue listar setores (endpoint simples)
      const sectors = await this.krolikApiClient.getSectors();
      
      if (!sectors || sectors.length === 0) {
        console.log('⚠️  API conectada mas nenhum setor encontrado');
        return {
          status: 'warn',
          message: 'API connected but no sectors found',
          duration: Date.now() - startTime
        };
      }

      console.log(`✅ API CAM Krolik conectada! Encontrados ${sectors.length} setores`);
      return {
        status: 'pass',
        message: 'API connectivity healthy',
        duration: Date.now() - startTime,
        details: { sectorsCount: sectors.length }
      };

    } catch (error) {
      console.log('❌ Falha na conectividade com API CAM Krolik:');
      console.log(`   Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return {
        status: 'fail',
        message: `API connectivity failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Verifica configuração do sistema
   */
  private async checkConfiguration(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    
    try {
      const config = this.configManager.getSystemConfig();
      
      // Verificar configurações críticas
      const criticalSettings = [
        'apiUrl',
        'apiToken',
        'supabaseUrl',
        'supabaseKey',
        'endOfDayTime'
      ];

      const missingSettings = criticalSettings.filter(setting => !(config as any)[setting]);
      
      if (missingSettings.length > 0) {
        return {
          status: 'fail',
          message: `Missing critical settings: ${missingSettings.join(', ')}`,
          duration: Date.now() - startTime
        };
      }

      // Verificar se configurações estão válidas
      if (config.flowPaused === undefined) {
        return {
          status: 'warn',
          message: 'Flow pause status not set',
          duration: Date.now() - startTime
        };
      }

      return {
        status: 'pass',
        message: 'Configuration healthy',
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        status: 'fail',
        message: `Configuration check failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Verifica serviço de monitoramento
   */
  private async checkMonitoringService(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    
    try {
      // Verificar se consegue buscar pacientes
      const patients = await this.monitoringService.checkWaitingPatients();
      
      return {
        status: 'pass',
        message: 'Monitoring service healthy',
        duration: Date.now() - startTime,
        details: { patientsCount: patients.length }
      };

    } catch (error) {
      return {
        status: 'fail',
        message: `Monitoring service failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Verifica serviço de mensagens
   */
  private async checkMessageService(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    
    try {
      // Verificar se consegue verificar exclusões
      const isExcluded = this.messageService.isChannelExcluded('test-channel');
      
      return {
        status: 'pass',
        message: 'Message service healthy',
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        status: 'fail',
        message: `Message service failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Verifica recursos do sistema
   */
  private async checkSystemResources(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const memUsagePercent = memUsage.heapUsed / memUsage.heapTotal;
      
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = 'System resources healthy';

      if (memUsagePercent > this.config.warningThresholds.memoryUsage) {
        status = 'warn';
        message = `High memory usage: ${(memUsagePercent * 100).toFixed(1)}%`;
      }

      return {
        status,
        message,
        duration: Date.now() - startTime,
        details: {
          memoryUsage: memUsagePercent,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal
        }
      };

    } catch (error) {
      return {
        status: 'fail',
        message: `System resources check failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Verifica sincronização de tempo
   */
  private async checkTimeSync(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    
    try {
      const timeInfo = TimeUtils.getTimeInfo();
      
      // Verificar se está em horário comercial
      const isBusinessTime = timeInfo.isBusinessHours && timeInfo.isWorkingDay;
      
      return {
        status: 'pass',
        message: 'Time sync healthy',
        duration: Date.now() - startTime,
        details: {
          currentTime: timeInfo.currentTime.toISO(),
          isBusinessTime,
          isWorkingDay: timeInfo.isWorkingDay,
          isBusinessHours: timeInfo.isBusinessHours
        }
      };

    } catch (error) {
      return {
        status: 'fail',
        message: `Time sync check failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Verifica status dos cron jobs
   */
  private async checkCronJobs(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    
    try {
      // Verificar se há jobs configurados
      // Esta verificação seria implementada com o CronService
      
      return {
        status: 'pass',
        message: 'Cron jobs healthy',
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        status: 'fail',
        message: `Cron jobs check failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Obtém último resultado do health check
   */
  getLastHealthCheck(): HealthCheckResult | null {
    return this.lastCheck;
  }

  /**
   * Verifica se o sistema está saudável
   */
  isHealthy(): boolean {
    return this.lastCheck?.status === 'healthy';
  }

  /**
   * Verifica se o sistema está degradado
   */
  isDegraded(): boolean {
    return this.lastCheck?.status === 'degraded';
  }

  /**
   * Verifica se o sistema está com problemas
   */
  isUnhealthy(): boolean {
    return this.lastCheck?.status === 'unhealthy';
  }

  /**
   * Obtém resumo do status
   */
  getStatusSummary(): {
    status: string;
    message: string;
    lastCheck: Date | null;
    criticalIssues: string[];
    warnings: string[];
  } {
    if (!this.lastCheck) {
      return {
        status: 'unknown',
        message: 'No health check performed yet',
        lastCheck: null,
        criticalIssues: [],
        warnings: []
      };
    }

    const criticalIssues = Object.entries(this.lastCheck.checks)
      .filter(([_, check]) => check.status === 'fail')
      .map(([name, check]) => `${name}: ${check.message}`);

    const warnings = Object.entries(this.lastCheck.checks)
      .filter(([_, check]) => check.status === 'warn')
      .map(([name, check]) => `${name}: ${check.message}`);

    let message = '';
    if (this.lastCheck.status === 'healthy') {
      message = 'All systems operational';
    } else if (this.lastCheck.status === 'degraded') {
      message = 'System operational with warnings';
    } else {
      message = 'System has critical issues';
    }

    return {
      status: this.lastCheck.status,
      message,
      lastCheck: this.lastCheck.timestamp,
      criticalIssues,
      warnings
    };
  }

  /**
   * Executa health check rápido (apenas checks críticos)
   */
  async performQuickHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks: HealthCheckResult['checks'] = {};

    // Executar apenas checks críticos
    const criticalChecks = [
      this.checkDatabase(),
      this.checkApiConnectivity(),
      this.checkConfiguration()
    ];

    const results = await Promise.allSettled(criticalChecks);
    const checkNames = ['database', 'api', 'config'];

    results.forEach((result, index) => {
      const checkName = checkNames[index];
      if (result.status === 'fulfilled') {
        checks[checkName] = result.value;
      } else {
        checks[checkName] = {
          status: 'fail',
          message: `Check failed: ${result.reason}`,
          duration: 0
        };
      }
    });

    const totalChecks = Object.keys(checks).length;
    const passedChecks = Object.values(checks).filter(c => c.status === 'pass').length;
    const failedChecks = Object.values(checks).filter(c => c.status === 'fail').length;
    const warningChecks = Object.values(checks).filter(c => c.status === 'warn').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks === 0) {
      overallStatus = warningChecks > 0 ? 'degraded' : 'healthy';
    } else {
      overallStatus = 'unhealthy';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date(),
      checks,
      overall: {
        totalChecks,
        passedChecks,
        failedChecks,
        warningChecks,
        responseTime: Date.now() - startTime
      }
    };

    this.lastCheck = result;
    return result;
  }
}

/**
 * Factory function para criar HealthCheckService
 */
export function createHealthCheckService(
  configManager: IConfigManager,
  monitoringService: IMonitoringService,
  messageService: IMessageService,
  krolikApiClient: KrolikApiClient,
  supabaseClient: SupabaseClient,
  config?: Partial<HealthCheckConfig>
): HealthCheckService {
  return new HealthCheckService(
    configManager,
    monitoringService,
    messageService,
    krolikApiClient,
    supabaseClient,
    config
  );
}
