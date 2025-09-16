import { LogEntry, LogFilter } from '../models/ApiTypes';

export class LogsService {
  private static instance: LogsService;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000; // Limite máximo de logs em memória

  private constructor() {}

  static getInstance(): LogsService {
    if (!LogsService.instance) {
      LogsService.instance = new LogsService();
    }
    return LogsService.instance;
  }

  /**
   * Adiciona um novo log
   */
  addLog(level: LogEntry['level'], message: string, context: string, metadata?: Record<string, any>, stack?: string): void {
    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      context,
      metadata,
      stack
    };

    this.logs.unshift(logEntry); // Adiciona no início do array

    // Remove logs antigos se exceder o limite
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log no console também para desenvolvimento
    this.logToConsole(logEntry);
  }

  /**
   * Obtém todos os logs com filtros opcionais
   */
  getLogs(filter?: LogFilter): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }

      if (filter.context) {
        filteredLogs = filteredLogs.filter(log => 
          log.context.toLowerCase().includes(filter.context!.toLowerCase())
        );
      }

      if (filter.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startDate!);
      }

      if (filter.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endDate!);
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(searchLower) ||
          log.context.toLowerCase().includes(searchLower)
        );
      }
    }

    return filteredLogs;
  }

  /**
   * Limpa todos os logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Obtém estatísticas dos logs
   */
  getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    byContext: Record<string, number>;
    oldestLog?: Date;
    newestLog?: Date;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      byContext: {} as Record<string, number>,
      oldestLog: undefined as Date | undefined,
      newestLog: undefined as Date | undefined
    };

    if (this.logs.length === 0) {
      return stats;
    }

    // Conta por nível
    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
    });

    // Encontra logs mais antigo e mais novo
    const sortedLogs = [...this.logs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    stats.oldestLog = sortedLogs[0].timestamp;
    stats.newestLog = sortedLogs[sortedLogs.length - 1].timestamp;

    return stats;
  }

  /**
   * Exporta logs para formato JSON
   */
  exportLogs(filter?: LogFilter): string {
    const logs = this.getLogs(filter);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Exporta logs para formato CSV
   */
  exportLogsCSV(filter?: LogFilter): string {
    const logs = this.getLogs(filter);
    
    const headers = ['Timestamp', 'Level', 'Context', 'Message', 'Metadata'];
    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const row = [
        log.timestamp.toISOString(),
        log.level,
        log.context,
        `"${log.message.replace(/"/g, '""')}"`, // Escapa aspas duplas
        log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Gera ID único para o log
   */
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log no console para desenvolvimento
   */
  private logToConsole(logEntry: LogEntry): void {
    const timestamp = logEntry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.context}]`;
    
    switch (logEntry.level) {
      case 'debug':
        console.debug(prefix, logEntry.message, logEntry.metadata);
        break;
      case 'info':
        console.info(prefix, logEntry.message, logEntry.metadata);
        break;
      case 'warn':
        console.warn(prefix, logEntry.message, logEntry.metadata);
        break;
      case 'error':
      case 'critical':
        console.error(prefix, logEntry.message, logEntry.metadata);
        if (logEntry.stack) {
          console.error(logEntry.stack);
        }
        break;
    }
  }
}

// Exportar instância singleton
export const logsService = LogsService.getInstance();
