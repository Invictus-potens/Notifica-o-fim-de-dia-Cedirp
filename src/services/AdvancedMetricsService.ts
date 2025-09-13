import { logger } from './Logger';
import { TimeUtils } from '../utils/TimeUtils';

export interface MetricData {
  value: number;
  timestamp: Date;
  tags?: { [key: string]: string };
  metadata?: { [key: string]: any };
}

export interface PerformanceMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  value: number;
  timestamp: Date;
  tags?: { [key: string]: string };
  metadata?: { [key: string]: any };
}

export interface SystemMetrics {
  memory: {
    heapUsed: number;
    heapTotal: number;
    heapFree: number;
    external: number;
    rss: number;
    usagePercent: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  uptime: number;
  timestamp: Date;
}

export interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  lastRequestTime: Date | null;
}

export interface BusinessMetrics {
  totalPatients: number;
  eligiblePatients: number;
  messagesSent: number;
  messagesFailed: number;
  averageWaitTime: number;
  maxWaitTime: number;
  minWaitTime: number;
  exclusionRate: number;
  successRate: number;
}

export interface MetricsConfig {
  enableSystemMetrics: boolean;
  enableApiMetrics: boolean;
  enableBusinessMetrics: boolean;
  enablePerformanceMetrics: boolean;
  retentionPeriod: number; // em dias
  aggregationInterval: number; // em minutos
  enableRealTime: boolean;
  enableAlerts: boolean;
  alertThresholds: {
    memoryUsage: number;
    cpuUsage: number;
    errorRate: number;
    responseTime: number;
  };
}

export class AdvancedMetricsService {
  private config: MetricsConfig;
  private metrics: Map<string, MetricData[]> = new Map();
  private performanceMetrics: Map<string, PerformanceMetric[]> = new Map();
  private systemMetrics: SystemMetrics[] = [];
  private apiMetrics: Map<string, ApiMetrics> = new Map();
  private businessMetrics: BusinessMetrics[] = [];
  private isCollecting: boolean = false;
  private collectionInterval: NodeJS.Timeout | null = null;
  private startTime: Date = new Date();

  constructor(config: Partial<MetricsConfig> = {}) {
    this.config = {
      enableSystemMetrics: true,
      enableApiMetrics: true,
      enableBusinessMetrics: true,
      enablePerformanceMetrics: true,
      retentionPeriod: 7,
      aggregationInterval: 5,
      enableRealTime: true,
      enableAlerts: true,
      alertThresholds: {
        memoryUsage: 0.8,
        cpuUsage: 0.8,
        errorRate: 0.1,
        responseTime: 5000
      },
      ...config
    };
  }

  /**
   * Inicia coleta de métricas
   */
  startCollection(): void {
    if (this.isCollecting) {
      return;
    }

    this.isCollecting = true;
    this.startTime = new Date();

    // Coletar métricas do sistema a cada minuto
    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 60000);

    logger.info('AdvancedMetricsService iniciado', 'AdvancedMetricsService');
  }

  /**
   * Para coleta de métricas
   */
  stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    this.isCollecting = false;
    logger.info('AdvancedMetricsService parado', 'AdvancedMetricsService');
  }

  /**
   * Coleta métricas do sistema
   */
  private collectSystemMetrics(): void {
    if (!this.config.enableSystemMetrics) {
      return;
    }

    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const loadAvg = require('os').loadavg();

      const systemMetric: SystemMetrics = {
        memory: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          heapFree: memUsage.heapTotal - memUsage.heapUsed,
          external: memUsage.external,
          rss: memUsage.rss,
          usagePercent: memUsage.heapUsed / memUsage.heapTotal
        },
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
          loadAverage: loadAvg
        },
        uptime: process.uptime(),
        timestamp: new Date()
      };

      this.systemMetrics.push(systemMetric);

      // Limitar retenção
      this.cleanupOldMetrics();

      // Verificar alertas
      if (this.config.enableAlerts) {
        this.checkAlerts(systemMetric);
      }

    } catch (error) {
      logger.error('Erro ao coletar métricas do sistema', 'AdvancedMetricsService', error as Error);
    }
  }

  /**
   * Registra métrica de performance
   */
  recordPerformanceMetric(
    name: string,
    value: number,
    type: 'counter' | 'gauge' | 'histogram' | 'timer',
    tags?: { [key: string]: string },
    metadata?: { [key: string]: any }
  ): void {
    if (!this.config.enablePerformanceMetrics) {
      return;
    }

    const metric: PerformanceMetric = {
      name,
      type,
      value,
      timestamp: new Date(),
      tags,
      metadata
    };

    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, []);
    }

    this.performanceMetrics.get(name)!.push(metric);

    // Limitar retenção
    this.cleanupOldMetrics();
  }

  /**
   * Registra métrica de API
   */
  recordApiMetric(
    endpoint: string,
    method: string,
    success: boolean,
    responseTime: number,
    error?: Error
  ): void {
    if (!this.config.enableApiMetrics) {
      return;
    }

    const key = `${method}:${endpoint}`;
    
    if (!this.apiMetrics.has(key)) {
      this.apiMetrics.set(key, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0,
        lastRequestTime: null
      });
    }

    const metric = this.apiMetrics.get(key)!;
    metric.totalRequests++;
    metric.lastRequestTime = new Date();

    if (success) {
      metric.successfulRequests++;
    } else {
      metric.failedRequests++;
    }

    // Atualizar tempos de resposta
    metric.averageResponseTime = (metric.averageResponseTime * (metric.totalRequests - 1) + responseTime) / metric.totalRequests;
    metric.minResponseTime = Math.min(metric.minResponseTime, responseTime);
    metric.maxResponseTime = Math.max(metric.maxResponseTime, responseTime);

    // Calcular taxa de erro
    metric.errorRate = metric.failedRequests / metric.totalRequests;

    // Calcular requests por segundo (últimos 60 segundos)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const recentRequests = metric.totalRequests; // Simplificado
    metric.requestsPerSecond = recentRequests / 60;

    // Registrar métrica de performance
    this.recordPerformanceMetric(
      'api_response_time',
      responseTime,
      'histogram',
      { endpoint, method, success: success.toString() }
    );

    this.recordPerformanceMetric(
      'api_requests_total',
      1,
      'counter',
      { endpoint, method, success: success.toString() }
    );
  }

  /**
   * Registra métrica de negócio
   */
  recordBusinessMetric(metric: Partial<BusinessMetrics>): void {
    if (!this.config.enableBusinessMetrics) {
      return;
    }

    const businessMetric: BusinessMetrics = {
      totalPatients: metric.totalPatients || 0,
      eligiblePatients: metric.eligiblePatients || 0,
      messagesSent: metric.messagesSent || 0,
      messagesFailed: metric.messagesFailed || 0,
      averageWaitTime: metric.averageWaitTime || 0,
      maxWaitTime: metric.maxWaitTime || 0,
      minWaitTime: metric.minWaitTime || 0,
      exclusionRate: metric.exclusionRate || 0,
      successRate: metric.successRate || 0
    };

    this.businessMetrics.push(businessMetric);

    // Limitar retenção
    this.cleanupOldMetrics();
  }

  /**
   * Registra métrica customizada
   */
  recordCustomMetric(
    name: string,
    value: number,
    tags?: { [key: string]: string },
    metadata?: { [key: string]: any }
  ): void {
    const metric: MetricData = {
      value,
      timestamp: new Date(),
      tags,
      metadata
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);

    // Limitar retenção
    this.cleanupOldMetrics();
  }

  /**
   * Obtém métricas do sistema
   */
  getSystemMetrics(): SystemMetrics[] {
    return [...this.systemMetrics];
  }

  /**
   * Obtém métricas de API
   */
  getApiMetrics(): Map<string, ApiMetrics> {
    return new Map(this.apiMetrics);
  }

  /**
   * Obtém métricas de negócio
   */
  getBusinessMetrics(): BusinessMetrics[] {
    return [...this.businessMetrics];
  }

  /**
   * Obtém métricas de performance
   */
  getPerformanceMetrics(): Map<string, PerformanceMetric[]> {
    return new Map(this.performanceMetrics);
  }

  /**
   * Obtém métricas customizadas
   */
  getCustomMetrics(): Map<string, MetricData[]> {
    return new Map(this.metrics);
  }

  /**
   * Obtém resumo de métricas
   */
  getMetricsSummary(): {
    system: {
      currentMemoryUsage: number;
      averageMemoryUsage: number;
      currentCpuUsage: number;
      uptime: number;
      totalMetrics: number;
    };
    api: {
      totalEndpoints: number;
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
    };
    business: {
      totalPatients: number;
      messagesSent: number;
      successRate: number;
      averageWaitTime: number;
    };
    performance: {
      totalMetrics: number;
      metricTypes: { [type: string]: number };
    };
  } {
    const currentSystem = this.systemMetrics[this.systemMetrics.length - 1];
    const averageMemoryUsage = this.systemMetrics.length > 0 
      ? this.systemMetrics.reduce((sum, m) => sum + m.memory.usagePercent, 0) / this.systemMetrics.length 
      : 0;

    const apiMetricsArray = Array.from(this.apiMetrics.values());
    const totalApiRequests = apiMetricsArray.reduce((sum, m) => sum + m.totalRequests, 0);
    const averageApiResponseTime = apiMetricsArray.length > 0
      ? apiMetricsArray.reduce((sum, m) => sum + m.averageResponseTime, 0) / apiMetricsArray.length
      : 0;
    const totalApiErrors = apiMetricsArray.reduce((sum, m) => sum + m.failedRequests, 0);
    const apiErrorRate = totalApiRequests > 0 ? totalApiErrors / totalApiRequests : 0;

    const currentBusiness = this.businessMetrics[this.businessMetrics.length - 1];
    const totalBusinessPatients = this.businessMetrics.reduce((sum, m) => sum + m.totalPatients, 0);
    const totalBusinessMessages = this.businessMetrics.reduce((sum, m) => sum + m.messagesSent, 0);
    const totalBusinessFailures = this.businessMetrics.reduce((sum, m) => sum + m.messagesFailed, 0);
    const businessSuccessRate = totalBusinessMessages > 0 ? (totalBusinessMessages - totalBusinessFailures) / totalBusinessMessages : 0;
    const averageBusinessWaitTime = this.businessMetrics.length > 0
      ? this.businessMetrics.reduce((sum, m) => sum + m.averageWaitTime, 0) / this.businessMetrics.length
      : 0;

    const performanceMetricsArray = Array.from(this.performanceMetrics.values());
    const totalPerformanceMetrics = performanceMetricsArray.reduce((sum, m) => sum + m.length, 0);
    const metricTypes: { [type: string]: number } = {};
    performanceMetricsArray.forEach(metrics => {
      metrics.forEach(metric => {
        metricTypes[metric.type] = (metricTypes[metric.type] || 0) + 1;
      });
    });

    return {
      system: {
        currentMemoryUsage: currentSystem?.memory.usagePercent || 0,
        averageMemoryUsage,
        currentCpuUsage: currentSystem?.cpu.usage || 0,
        uptime: process.uptime(),
        totalMetrics: this.systemMetrics.length
      },
      api: {
        totalEndpoints: this.apiMetrics.size,
        totalRequests: totalApiRequests,
        averageResponseTime: averageApiResponseTime,
        errorRate: apiErrorRate
      },
      business: {
        totalPatients: currentBusiness?.totalPatients || 0,
        messagesSent: totalBusinessMessages,
        successRate: businessSuccessRate,
        averageWaitTime: averageBusinessWaitTime
      },
      performance: {
        totalMetrics: totalPerformanceMetrics,
        metricTypes
      }
    };
  }

  /**
   * Obtém métricas em tempo real
   */
  getRealTimeMetrics(): {
    timestamp: Date;
    system: SystemMetrics | null;
    api: { [endpoint: string]: ApiMetrics };
    business: BusinessMetrics | null;
  } {
    return {
      timestamp: new Date(),
      system: this.systemMetrics[this.systemMetrics.length - 1] || null,
      api: Object.fromEntries(this.apiMetrics),
      business: this.businessMetrics[this.businessMetrics.length - 1] || null
    };
  }

  /**
   * Limpa métricas antigas
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000);

    // Limpar métricas do sistema
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoffTime);

    // Limpar métricas de negócio
    this.businessMetrics = this.businessMetrics.filter(m => (m as any).timestamp && (m as any).timestamp > cutoffTime);

    // Limpar métricas de performance
    for (const [name, metrics] of this.performanceMetrics) {
      const filtered = metrics.filter(m => m.timestamp > cutoffTime);
      if (filtered.length === 0) {
        this.performanceMetrics.delete(name);
      } else {
        this.performanceMetrics.set(name, filtered);
      }
    }

    // Limpar métricas customizadas
    for (const [name, metrics] of this.metrics) {
      const filtered = metrics.filter(m => m.timestamp > cutoffTime);
      if (filtered.length === 0) {
        this.metrics.delete(name);
      } else {
        this.metrics.set(name, filtered);
      }
    }
  }

  /**
   * Verifica alertas
   */
  private checkAlerts(systemMetric: SystemMetrics): void {
    if (!this.config.enableAlerts) {
      return;
    }

    const thresholds = this.config.alertThresholds;

    // Alerta de uso de memória
    if (systemMetric.memory.usagePercent > thresholds.memoryUsage) {
      logger.warn(
        `Alto uso de memória: ${(systemMetric.memory.usagePercent * 100).toFixed(1)}%`,
        'AdvancedMetricsService'
      );
    }

    // Alerta de uso de CPU
    if (systemMetric.cpu.usage > thresholds.cpuUsage) {
      logger.warn(
        `Alto uso de CPU: ${systemMetric.cpu.usage.toFixed(2)}s`,
        'AdvancedMetricsService'
      );
    }

    // Alerta de tempo de resposta
    const apiMetricsArray = Array.from(this.apiMetrics.values());
    const averageResponseTime = apiMetricsArray.length > 0
      ? apiMetricsArray.reduce((sum, m) => sum + m.averageResponseTime, 0) / apiMetricsArray.length
      : 0;

    if (averageResponseTime > thresholds.responseTime) {
      logger.warn(
        `Tempo de resposta alto: ${averageResponseTime.toFixed(2)}ms`,
        'AdvancedMetricsService'
      );
    }

    // Alerta de taxa de erro
    const totalRequests = apiMetricsArray.reduce((sum, m) => sum + m.totalRequests, 0);
    const totalErrors = apiMetricsArray.reduce((sum, m) => sum + m.failedRequests, 0);
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    if (errorRate > thresholds.errorRate) {
      logger.warn(
        `Taxa de erro alta: ${(errorRate * 100).toFixed(1)}%`,
        'AdvancedMetricsService'
      );
    }
  }

  /**
   * Exporta métricas para formato JSON
   */
  exportMetrics(): any {
    return {
      config: this.config,
      system: this.systemMetrics,
      api: Object.fromEntries(this.apiMetrics),
      business: this.businessMetrics,
      performance: Object.fromEntries(this.performanceMetrics),
      custom: Object.fromEntries(this.metrics),
      summary: this.getMetricsSummary(),
      timestamp: new Date()
    };
  }

  /**
   * Limpa todas as métricas
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.performanceMetrics.clear();
    this.systemMetrics = [];
    this.apiMetrics.clear();
    this.businessMetrics = [];
    logger.info('Todas as métricas foram limpas', 'AdvancedMetricsService');
  }
}

// Instância singleton
export const advancedMetricsService = new AdvancedMetricsService();
