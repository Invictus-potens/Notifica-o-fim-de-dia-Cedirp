/**
 * @readonly
 * @enum {number}
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

/**
 * @typedef {Object} LogEntry
 * @property {number} level - Nível do log (LogLevel)
 * @property {string} message - Mensagem do log
 * @property {string} context - Contexto onde ocorreu
 * @property {Date} timestamp - Timestamp do log
 * @property {Error} [error] - Erro associado (opcional)
 * @property {Object} [metadata] - Metadados adicionais (opcional)
 */

/**
 * @typedef {Object} ErrorStatistics
 * @property {number} totalErrors - Total de erros
 * @property {Object} errorsByType - Erros por tipo
 * @property {Object} errorsByContext - Erros por contexto
 * @property {Error} [lastError] - Último erro registrado
 */

/**
 * Classe para gerenciamento de erros e logs do sistema
 */
class ErrorHandler {
  constructor(logLevel = LogLevel.INFO, maxLogs = 10000) {
    this.logs = [];
    this.currentLogLevel = logLevel;
    this.maxLogs = maxLogs;
    this.errorsByType = {};
    this.errorsByContext = {};
  }

  /**
   * Define o nível de log
   * @param {number} level - Nível do log (LogLevel)
   */
  setLogLevel(level) {
    this.currentLogLevel = level;
  }

  /**
   * Registra um erro no sistema
   * @param {Error} error - Erro a ser registrado
   * @param {string} context - Contexto onde ocorreu o erro
   */
  logError(error, context) {
    this.log(LogLevel.ERROR, error.message, context, error);
    
    // Contabilizar erro por tipo
    const errorType = error.constructor.name;
    this.errorsByType[errorType] = (this.errorsByType[errorType] || 0) + 1;
    
    // Contabilizar erro por contexto
    this.errorsByContext[context] = (this.errorsByContext[context] || 0) + 1;
  }

  /**
   * Notifica administrador sobre erro crítico
   * @param {Error} criticalError - Erro crítico
   */
  notifyAdministrator(criticalError) {
    console.error('🚨 ERRO CRÍTICO DETECTADO:', criticalError.message);
    this.log(LogLevel.CRITICAL, criticalError.message, 'CRITICAL_ERROR', criticalError);
  }

  /**
   * Obtém estatísticas de erros
   * @returns {ErrorStatistics} Estatísticas dos erros
   */
  getErrorStats() {
    const errorLogs = this.logs.filter(log => log.level >= LogLevel.ERROR);
    const lastError = errorLogs.length > 0 ? errorLogs[errorLogs.length - 1].error : undefined;
    
    return {
      totalErrors: errorLogs.length,
      errorsByType: { ...this.errorsByType },
      errorsByContext: { ...this.errorsByContext },
      lastError
    };
  }

  /**
   * Registra um log genérico
   * @param {number} level - Nível do log
   * @param {string} message - Mensagem
   * @param {string} context - Contexto
   * @param {Error} [error] - Erro opcional
   * @param {Object} [metadata] - Metadados opcionais
   */
  log(level, message, context, error = undefined, metadata = undefined) {
    if (level < this.currentLogLevel) {
      return;
    }

    const logEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      error,
      metadata
    };

    this.logs.push(logEntry);

    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log no console baseado no nível
    const levelName = Object.keys(LogLevel)[level] || 'UNKNOWN';
    const timestamp = logEntry.timestamp.toLocaleString('pt-BR');
    
    switch (level) {
      case LogLevel.DEBUG:
        console.log(`🔍 [${timestamp}] [DEBUG] [${context}] ${message}`);
        break;
      case LogLevel.INFO:
        console.log(`ℹ️ [${timestamp}] [INFO] [${context}] ${message}`);
        break;
      case LogLevel.WARN:
        console.warn(`⚠️ [${timestamp}] [WARN] [${context}] ${message}`);
        break;
      case LogLevel.ERROR:
        console.error(`❌ [${timestamp}] [ERROR] [${context}] ${message}`);
        if (error) {
          console.error(`   Stack: ${error.stack}`);
        }
        break;
      case LogLevel.CRITICAL:
        console.error(`🚨 [${timestamp}] [CRITICAL] [${context}] ${message}`);
        if (error) {
          console.error(`   Stack: ${error.stack}`);
        }
        break;
    }

    if (metadata) {
      console.log(`   Metadata:`, metadata);
    }
  }

  /**
   * Log de debug
   * @param {string} message - Mensagem
   * @param {string} context - Contexto
   * @param {Object} [metadata] - Metadados opcionais
   */
  debug(message, context, metadata = undefined) {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  /**
   * Log de informação
   * @param {string} message - Mensagem
   * @param {string} context - Contexto
   * @param {Object} [metadata] - Metadados opcionais
   */
  info(message, context, metadata = undefined) {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  /**
   * Log de aviso
   * @param {string} message - Mensagem
   * @param {string} context - Contexto
   * @param {Object} [metadata] - Metadados opcionais
   */
  warn(message, context, metadata = undefined) {
    this.log(LogLevel.WARN, message, context, undefined, metadata);
  }

  /**
   * Log de erro
   * @param {string} message - Mensagem
   * @param {string} context - Contexto
   * @param {Error} [error] - Erro opcional
   * @param {Object} [metadata] - Metadados opcionais
   */
  error(message, context, error = undefined, metadata = undefined) {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  /**
   * Log crítico
   * @param {string} message - Mensagem
   * @param {string} context - Contexto
   * @param {Error} [error] - Erro opcional
   * @param {Object} [metadata] - Metadados opcionais
   */
  critical(message, context, error = undefined, metadata = undefined) {
    this.log(LogLevel.CRITICAL, message, context, error, metadata);
  }

  /**
   * Obtém logs filtrados por nível e limite
   * @param {number} [level] - Nível mínimo (opcional)
   * @param {number} [limit] - Limite de logs (opcional)
   * @returns {LogEntry[]} Lista de logs
   */
  getLogs(level = undefined, limit = undefined) {
    let filteredLogs = this.logs;

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }

    if (limit !== undefined) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  /**
   * Limpa todos os logs
   */
  clearLogs() {
    this.logs = [];
    this.errorsByType = {};
    this.errorsByContext = {};
  }
}

module.exports = {
  LogLevel,
  ErrorHandler
};
