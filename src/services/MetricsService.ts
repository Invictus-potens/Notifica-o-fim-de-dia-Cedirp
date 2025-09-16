import { logger } from './Logger';
import { advancedMetricsService } from './AdvancedMetricsService';

export interface MessageMetrics {
  totalSent: number;
  successful: number;
  failed: number;
  by30Min: number;
  byEndOfDay: number;
  bySector: Record<string, number>;
  byChannel: Record<string, number>;
  averageResponseTime: number;
  lastSentAt?: Date;
}

export interface SystemMetrics {
  uptime: number;
  startTime: Date;
  totalRequests: number;
  apiCallsSuccessful: number;
  apiCallsFailed: number;
  averageApiResponseTime: number;
  memoryUsage?: NodeJS.MemoryUsage;
  activeConnections: number;
}

export interface PerformanceMetrics {
  monitoringCycles: number;
  averageCycleTime: number;
  patientsProcessed: number;
  messagesQueued: number;
  processingErrors: number;
  lastCycleTime?: number;
  lastCycleAt?: Date;
}

export interface AlertThresholds {
  maxApiFailureRate: number; // percentage
  maxResponseTime: number; // milliseconds
  maxErrorsPerHour: number;
}

export class MetricsService {
  private messageMetrics: MessageMetrics;
  private systemMetrics: SystemMetrics;
  private performanceMetrics: PerformanceMetrics;
  private alertThresholds: AlertThresholds;
  
  private apiResponseTimes: number[] = [];
  private cycleResponseTimes: number[] = [];
  private recentErrors: Array<{ timestamp: Date; context: string; message: string }> = [];

  constructor() {
    this.messageMetrics = {
      totalSent: 0,
      successful: 0,
      failed: 0,
      by30Min: 0,
      byEndOfDay: 0,
      bySector: {},
      byChannel: {},
      averageResponseTime: 0
    };

    this.systemMetrics = {
      uptime: 0,
      startTime: new Date(),
      totalRequests: 0,
      apiCallsSuccessful: 0,
      apiCallsFailed: 0,
      averageApiResponseTime: 0,
      activeConnections: 0
    };

    this.performanceMetrics = {
      monitoringCycles: 0,
      averageCycleTime: 0,
      patientsProcessed: 0,
      messagesQueued: 0,
      processingErrors: 0
    };

    this.alertThresholds = {
      maxApiFailureRate: 10, // 10%
      maxResponseTime: 5000, // 5 seconds
      maxErrorsPerHour: 50
    };
  }

  // Message Metrics
  recordMessageSent(
    success: boolean, 
    messageType: '30min' | 'end_of_day',
    sectorId: string,
    channelId: string,
    responseTime?: number
  ): void {
    this.messageMetrics.totalSent++;
    
    if (success) {
      this.messageMetrics.successful++;
    } else {
      this.messageMetrics.failed++;
    }

    if (messageType === '30min') {
      this.messageMetrics.by30Min++;
    } else {
      this.messageMetrics.byEndOfDay++;
    }

    // Track by sector
    this.messageMetrics.bySector[sectorId] = (this.messageMetrics.bySector[sectorId] || 0) + 1;
    
    // Track by channel
    this.messageMetrics.byChannel[channelId] = (this.messageMetrics.byChannel[channelId] || 0) + 1;

    // Update response time
    if (responseTime) {
      this.updateAverageResponseTime(responseTime);
    }

    this.messageMetrics.lastSentAt = new Date();

    // Registrar no AdvancedMetricsService
    advancedMetricsService.recordBusinessMetric({
      messagesSent: success ? 1 : 0,
      messagesFailed: success ? 0 : 1
    });

    if (responseTime) {
      advancedMetricsService.recordPerformanceMetric(
        'message_response_time',
        responseTime,
        'histogram',
        { messageType, sectorId, channelId, success: success.toString() }
      );
    }

    logger.debug('Message metrics updated', 'METRICS_SERVICE', {
      success,
      messageType,
      sectorId,
      channelId,
      totalSent: this.messageMetrics.totalSent
    });
  }

  private updateAverageResponseTime(responseTime: number): void {
    const currentAvg = this.messageMetrics.averageResponseTime;
    const totalMessages = this.messageMetrics.totalSent;
    
    if (totalMessages === 1) {
      this.messageMetrics.averageResponseTime = responseTime;
    } else {
      this.messageMetrics.averageResponseTime = 
        ((currentAvg * (totalMessages - 1)) + responseTime) / totalMessages;
    }
  }

  // API Metrics
  recordApiCall(success: boolean, responseTime: number, endpoint?: string): void {
    this.systemMetrics.totalRequests++;
    
    if (success) {
      this.systemMetrics.apiCallsSuccessful++;
    } else {
      this.systemMetrics.apiCallsFailed++;
    }

    // Track response times (keep last 100)
    this.apiResponseTimes.push(responseTime);
    if (this.apiResponseTimes.length > 100) {
      this.apiResponseTimes.shift();
    }

    // Update average API response time
    this.systemMetrics.averageApiResponseTime = 
      this.apiResponseTimes.reduce((sum, time) => sum + time, 0) / this.apiResponseTimes.length;

    logger.debug('API call metrics updated', 'METRICS_SERVICE', {
      success,
      responseTime,
      endpoint,
      totalRequests: this.systemMetrics.totalRequests
    });
  }

  // Performance Metrics
  recordMonitoringCycle(
    duration: number,
    patientsFound: number,
    messagesEligible: number,
    errors: number = 0
  ): void {
    this.performanceMetrics.monitoringCycles++;
    this.performanceMetrics.patientsProcessed += patientsFound;
    this.performanceMetrics.messagesQueued += messagesEligible;
    this.performanceMetrics.processingErrors += errors;
    this.performanceMetrics.lastCycleTime = duration;
    this.performanceMetrics.lastCycleAt = new Date();

    // Track cycle times (keep last 50)
    this.cycleResponseTimes.push(duration);
    if (this.cycleResponseTimes.length > 50) {
      this.cycleResponseTimes.shift();
    }

    // Update average cycle time
    this.performanceMetrics.averageCycleTime = 
      this.cycleResponseTimes.reduce((sum, time) => sum + time, 0) / this.cycleResponseTimes.length;

    logger.debug('Monitoring cycle metrics updated', 'METRICS_SERVICE', {
      duration,
      patientsFound,
      messagesEligible,
      errors,
      totalCycles: this.performanceMetrics.monitoringCycles
    });
  }

  // Error Tracking
  recordError(context: string, message: string): void {
    const error = {
      timestamp: new Date(),
      context,
      message
    };

    this.recentErrors.push(error);
    
    // Keep only last 100 errors
    if (this.recentErrors.length > 100) {
      this.recentErrors.shift();
    }

    logger.debug('Error recorded in metrics', 'METRICS_SERVICE', { context, message });
  }

  // System Metrics
  updateSystemMetrics(): void {
    this.systemMetrics.uptime = Date.now() - this.systemMetrics.startTime.getTime();
    
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.systemMetrics.memoryUsage = process.memoryUsage();
    }
  }

  // Alert System
  checkAlerts(): Array<{ type: string; message: string; severity: 'warning' | 'critical' }> {
    const alerts: Array<{ type: string; message: string; severity: 'warning' | 'critical' }> = [];

    // Check API failure rate
    const totalApiCalls = this.systemMetrics.totalRequests;
    if (totalApiCalls > 0) {
      const failureRate = (this.systemMetrics.apiCallsFailed / totalApiCalls) * 100;
      if (failureRate > this.alertThresholds.maxApiFailureRate) {
        alerts.push({
          type: 'api_failure_rate',
          message: `Taxa de falha da API está em ${failureRate.toFixed(1)}% (limite: ${this.alertThresholds.maxApiFailureRate}%)`,
          severity: failureRate > this.alertThresholds.maxApiFailureRate * 2 ? 'critical' : 'warning'
        });
      }
    }

    // Check response time
    if (this.systemMetrics.averageApiResponseTime > this.alertThresholds.maxResponseTime) {
      alerts.push({
        type: 'slow_response',
        message: `Tempo de resposta médio da API está em ${this.systemMetrics.averageApiResponseTime.toFixed(0)}ms (limite: ${this.alertThresholds.maxResponseTime}ms)`,
        severity: this.systemMetrics.averageApiResponseTime > this.alertThresholds.maxResponseTime * 2 ? 'critical' : 'warning'
      });
    }

    // Check errors per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrorsCount = this.recentErrors.filter(error => error.timestamp > oneHourAgo).length;
    if (recentErrorsCount > this.alertThresholds.maxErrorsPerHour) {
      alerts.push({
        type: 'high_error_rate',
        message: `${recentErrorsCount} erros na última hora (limite: ${this.alertThresholds.maxErrorsPerHour})`,
        severity: recentErrorsCount > this.alertThresholds.maxErrorsPerHour * 2 ? 'critical' : 'warning'
      });
    }

    // Memory usage check removed to prevent spam logs

    // Log alerts if any
    if (alerts.length > 0) {
      alerts.forEach(alert => {
        if (alert.severity === 'critical') {
          logger.critical(`ALERT: ${alert.message}`, 'METRICS_SERVICE');
        } else {
          logger.warn(`ALERT: ${alert.message}`, 'METRICS_SERVICE');
        }
      });
    }

    return alerts;
  }

  // Getters
  getMessageMetrics(): MessageMetrics {
    return { ...this.messageMetrics };
  }

  getSystemMetrics(): SystemMetrics {
    this.updateSystemMetrics();
    return { ...this.systemMetrics };
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  getAllMetrics() {
    return {
      messages: this.getMessageMetrics(),
      system: this.getSystemMetrics(),
      performance: this.getPerformanceMetrics(),
      alerts: this.checkAlerts()
    };
  }

  // Reset methods
  resetDailyMetrics(): void {
    this.messageMetrics = {
      totalSent: 0,
      successful: 0,
      failed: 0,
      by30Min: 0,
      byEndOfDay: 0,
      bySector: {},
      byChannel: {},
      averageResponseTime: 0
    };

    this.performanceMetrics.patientsProcessed = 0;
    this.performanceMetrics.messagesQueued = 0;
    this.performanceMetrics.processingErrors = 0;

    logger.info('Daily metrics reset', 'METRICS_SERVICE');
  }

  // Configuration
  updateAlertThresholds(thresholds: Partial<AlertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    logger.info('Alert thresholds updated', 'METRICS_SERVICE', thresholds);
  }
}

// Export singleton instance
export const metricsService = new MetricsService();