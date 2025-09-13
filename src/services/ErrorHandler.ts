import { ErrorStatistics } from '../models';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: string;
  timestamp: Date;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface IErrorHandler {
  logError(error: Error, context: string): void;
  notifyAdministrator(criticalError: Error): void;
  getErrorStats(): ErrorStatistics;
  log(level: LogLevel, message: string, context: string, error?: Error, metadata?: Record<string, any>): void;
  debug(message: string, context: string, metadata?: Record<string, any>): void;
  info(message: string, context: string, metadata?: Record<string, any>): void;
  warn(message: string, context: string, metadata?: Record<string, any>): void;
  error(message: string, context: string, error?: Error, metadata?: Record<string, any>): void;
  critical(message: string, context: string, error?: Error, metadata?: Record<string, any>): void;
  getLogs(level?: LogLevel, limit?: number): LogEntry[];
  clearLogs(): void;
  setLogLevel(level: LogLevel): void;
}

export class ErrorHandler implements IErrorHandler {
  private logs: LogEntry[] = [];
  private currentLogLevel: LogLevel = LogLevel.INFO;
  private maxLogs: number = 10000;
  
  private errorsByType: Record<string, number> = {};
  private errorsByContext: Record<string, number> = {};

  constructor(logLevel: LogLevel = LogLevel.INFO, maxLogs: number = 10000) {
    this.currentLogLevel = logLevel;
    this.maxLogs = maxLogs;
  }

  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  log(level: LogLevel, message: string, context: string, error?: Error, metadata?: Record<string, any>): void {
    if (level < this.currentLogLevel) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      error,
      metadata
    };

    this.logs.push(logEntry);

    // Atualizar contadores para erros
    if (level >= LogLevel.ERROR && error) {
      const errorType = error.constructor.name;
      this.errorsByType[errorType] = (this.errorsByType[errorType] || 0) + 1;
      this.errorsByContext[context] = (this.errorsByContext[context] || 0) + 1;
    }

    // Log no console
    this.logToConsole(logEntry);

    // Manter apenas os últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelName}] [${entry.context}]`;
    
    const message = entry.metadata 
      ? `${entry.message} ${JSON.stringify(entry.metadata)}`
      : entry.message;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${message}`, entry.error);
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${message}`, entry.error);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${message}`, entry.error);
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${message}`, entry.error);
        break;
      case LogLevel.CRITICAL:
        console.error(`🚨 CRITICAL: ${prefix} ${message}`, entry.error);
        break;
    }
  }

  debug(message: string, context: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  info(message: string, context: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  warn(message: string, context: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, undefined, metadata);
  }

  error(message: string, context: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  critical(message: string, context: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.CRITICAL, message, context, error, metadata);
  }

  logError(error: Error, context: string): void {
    this.error(error.message, context, error);
  }

  notifyAdministrator(criticalError: Error): void {
    this.critical('Sistema requer atenção imediata', 'ADMIN_NOTIFICATION', criticalError);
  }

  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level !== undefined) {
      filteredLogs = this.logs.filter(log => log.level >= level);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return [...filteredLogs];
  }

  clearLogs(): void {
    this.logs = [];
    this.errorsByType = {};
    this.errorsByContext = {};
  }

  getErrorStats(): ErrorStatistics {
    const errorLogs = this.logs.filter(log => log.level >= LogLevel.ERROR);
    const lastError = errorLogs.length > 0 ? errorLogs[errorLogs.length - 1] : undefined;

    return {
      totalErrors: errorLogs.length,
      errorsByType: { ...this.errorsByType },
      errorsByContext: { ...this.errorsByContext },
      lastError: lastError ? {
        message: lastError.message,
        context: lastError.context,
        timestamp: lastError.timestamp
      } : undefined
    };
  }
}