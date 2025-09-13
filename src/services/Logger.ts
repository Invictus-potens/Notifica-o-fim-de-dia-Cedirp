import { ErrorHandler, LogLevel, LogEntry } from './ErrorHandler';

export class Logger {
  private static instance: Logger;
  private errorHandler: ErrorHandler;

  private constructor() {
    // Configurar nível de log baseado no ambiente
    const logLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    this.errorHandler = new ErrorHandler(logLevel);
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  debug(message: string, context: string, metadata?: Record<string, any>): void {
    this.errorHandler.debug(message, context, metadata);
  }

  info(message: string, context: string, metadata?: Record<string, any>): void {
    this.errorHandler.info(message, context, metadata);
  }

  warn(message: string, context: string, metadata?: Record<string, any>): void {
    this.errorHandler.warn(message, context, metadata);
  }

  error(message: string, context: string, error?: Error, metadata?: Record<string, any>): void {
    this.errorHandler.error(message, context, error, metadata);
  }

  critical(message: string, context: string, error?: Error, metadata?: Record<string, any>): void {
    this.errorHandler.critical(message, context, error, metadata);
  }

  // Métodos de conveniência para operações críticas
  logApiCall(endpoint: string, method: string, success: boolean, duration?: number): void {
    const metadata = { endpoint, method, duration };
    if (success) {
      this.info(`API call successful`, 'API_CLIENT', metadata);
    } else {
      this.error(`API call failed`, 'API_CLIENT', undefined, metadata);
    }
  }

  logMessageSent(patientId: string, messageType: string, success: boolean, error?: Error): void {
    const metadata = { patientId, messageType };
    if (success) {
      this.info(`Message sent successfully`, 'MESSAGE_SERVICE', metadata);
    } else {
      this.error(`Failed to send message`, 'MESSAGE_SERVICE', error, metadata);
    }
  }

  logMonitoringCycle(patientsFound: number, messagesEligible: number, duration: number): void {
    const metadata = { patientsFound, messagesEligible, duration };
    this.info(`Monitoring cycle completed`, 'MONITORING_SERVICE', metadata);
  }

  logConfigChange(setting: string, oldValue: any, newValue: any, userId?: string): void {
    const metadata = { setting, oldValue, newValue, userId };
    this.info(`Configuration changed`, 'CONFIG_MANAGER', metadata);
  }

  logDatabaseOperation(operation: string, table: string, success: boolean, error?: Error): void {
    const metadata = { operation, table };
    if (success) {
      this.debug(`Database operation successful`, 'DATABASE', metadata);
    } else {
      this.error(`Database operation failed`, 'DATABASE', error, metadata);
    }
  }

  // Métodos específicos para operações críticas do sistema
  logApiFailure(endpoint: string, method: string, error: Error, retryCount?: number): void {
    const metadata = { endpoint, method, retryCount };
    this.error(`API request failed - system will continue operation`, 'API_CLIENT', error, metadata);
  }

  logChannelTokenError(channelId: string, error: Error): void {
    const metadata = { channelId };
    this.error(`Invalid channel token - skipping channel`, 'MESSAGE_SERVICE', error, metadata);
  }

  logSystemStartup(version: string, environment: string): void {
    const metadata = { version, environment, timestamp: new Date().toISOString() };
    this.info(`System startup completed`, 'SYSTEM', metadata);
  }

  logSystemShutdown(reason: string, uptime: number): void {
    const metadata = { reason, uptime };
    this.info(`System shutdown initiated`, 'SYSTEM', metadata);
  }

  logFlowStateChange(newState: 'paused' | 'active', userId?: string): void {
    const metadata = { newState, userId };
    this.info(`Flow state changed`, 'FLOW_CONTROL', metadata);
  }

  logSupabaseConnection(success: boolean, error?: Error): void {
    if (success) {
      this.info(`Supabase connection established`, 'DATABASE');
    } else {
      this.warn(`Supabase connection failed - falling back to local storage`, 'DATABASE', error);
    }
  }

  logDailyCleanup(recordsDeleted: number, duration: number): void {
    const metadata = { recordsDeleted, duration };
    this.info(`Daily cleanup completed`, 'MAINTENANCE', metadata);
  }

  // Métodos para acesso aos logs
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    return this.errorHandler.getLogs(level, limit);
  }

  getErrorStats() {
    return this.errorHandler.getErrorStats();
  }

  clearLogs(): void {
    this.errorHandler.clearLogs();
  }

  setLogLevel(level: LogLevel): void {
    this.errorHandler.setLogLevel(level);
  }

  // Método para exportar logs para análise
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getLogs();
    
    if (format === 'csv') {
      const headers = 'Timestamp,Level,Context,Message,Error,Metadata\n';
      const rows = logs.map(log => {
        const timestamp = log.timestamp.toISOString();
        const level = LogLevel[log.level];
        const context = log.context;
        const message = `"${log.message.replace(/"/g, '""')}"`;
        const error = log.error ? `"${log.error.message.replace(/"/g, '""')}"` : '';
        const metadata = log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : '';
        return `${timestamp},${level},${context},${message},${error},${metadata}`;
      }).join('\n');
      
      return headers + rows;
    }
    
    return JSON.stringify(logs, null, 2);
  }

  // Método para obter resumo de atividade
  getActivitySummary(hours: number = 24): {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    criticalCount: number;
    topContexts: Array<{ context: string; count: number }>;
    recentErrors: LogEntry[];
  } {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const recentLogs = this.getLogs().filter(log => log.timestamp >= cutoffTime);
    
    const errorLogs = recentLogs.filter(log => log.level >= LogLevel.ERROR);
    const warningLogs = recentLogs.filter(log => log.level === LogLevel.WARN);
    const criticalLogs = recentLogs.filter(log => log.level === LogLevel.CRITICAL);
    
    // Contar por contexto
    const contextCounts: Record<string, number> = {};
    recentLogs.forEach(log => {
      contextCounts[log.context] = (contextCounts[log.context] || 0) + 1;
    });
    
    const topContexts = Object.entries(contextCounts)
      .map(([context, count]) => ({ context, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalLogs: recentLogs.length,
      errorCount: errorLogs.length,
      warningCount: warningLogs.length,
      criticalCount: criticalLogs.length,
      topContexts,
      recentErrors: errorLogs.slice(-10) // Últimos 10 erros
    };
  }
}

// Export singleton instance
export const logger = Logger.getInstance();