const fs = require('fs').promises;
const path = require('path');

/**
 * Gerenciador de logs de ações do usuário
 * Registra todas as ações realizadas pelo usuário na interface
 */
class UserActionLogger {
  constructor(errorHandler) {
    this.errorHandler = errorHandler;
    this.logFile = path.join(__dirname, '../../data/user_actions.json');
    this.maxLogEntries = 1000; // Máximo de entradas para evitar arquivo muito grande
  }

  /**
   * Adiciona uma entrada de log para ação do usuário
   * @param {string} level - Nível do log (info, warning, error)
   * @param {string} action - Ação realizada
   * @param {string} details - Detalhes da ação
   * @param {Object} metadata - Dados adicionais (opcional)
   */
  async logUserAction(level, action, details, metadata = {}) {
    try {
      const logEntry = {
        id: this.generateLogId(),
        timestamp: new Date().toISOString(),
        level: level.toLowerCase(),
        action,
        details,
        metadata,
        userAgent: metadata.userAgent || 'Sistema',
        ip: metadata.ip || 'local'
      };

      // Carregar logs existentes
      let logs = await this.loadLogs();
      
      // Adicionar nova entrada
      logs.unshift(logEntry); // Adicionar no início (mais recente primeiro)
      
      // Limitar número de entradas
      if (logs.length > this.maxLogEntries) {
        logs = logs.slice(0, this.maxLogEntries);
      }
      
      // Salvar logs atualizados
      await this.saveLogs(logs);
      
      console.log(`📝 [UserLog] ${level.toUpperCase()}: ${action} - ${details}`);
      
      return logEntry;
    } catch (error) {
      this.errorHandler.logError(error, 'UserActionLogger.logUserAction');
      throw error;
    }
  }

  /**
   * Carrega todos os logs do arquivo
   */
  async loadLogs() {
    try {
      const data = await fs.readFile(this.logFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Arquivo não existe, retornar array vazio
        return [];
      }
      throw error;
    }
  }

  /**
   * Salva logs no arquivo
   */
  async saveLogs(logs) {
    try {
      await fs.writeFile(this.logFile, JSON.stringify(logs, null, 2), 'utf8');
    } catch (error) {
      this.errorHandler.logError(error, 'UserActionLogger.saveLogs');
      throw error;
    }
  }

  /**
   * Obtém logs com filtros
   * @param {Object} filters - Filtros para aplicar
   * @param {string} filters.level - Filtrar por nível
   * @param {string} filters.action - Filtrar por tipo de ação
   * @param {string} filters.startDate - Data de início (ISO string)
   * @param {string} filters.endDate - Data de fim (ISO string)
   * @param {number} filters.limit - Limite de resultados
   */
  async getFilteredLogs(filters = {}) {
    try {
      let logs = await this.loadLogs();
      
      // Aplicar filtros
      if (filters.level) {
        logs = logs.filter(log => log.level === filters.level.toLowerCase());
      }
      
      if (filters.action) {
        logs = logs.filter(log => log.action.toLowerCase().includes(filters.action.toLowerCase()));
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        logs = logs.filter(log => new Date(log.timestamp) >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        logs = logs.filter(log => new Date(log.timestamp) <= endDate);
      }
      
      // Aplicar limite
      if (filters.limit && filters.limit > 0) {
        logs = logs.slice(0, filters.limit);
      }
      
      return logs;
    } catch (error) {
      this.errorHandler.logError(error, 'UserActionLogger.getFilteredLogs');
      throw error;
    }
  }

  /**
   * Limpa logs antigos (mantém apenas os últimos N dias)
   * @param {number} daysToKeep - Número de dias para manter
   */
  async cleanOldLogs(daysToKeep = 30) {
    try {
      const logs = await this.loadLogs();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const filteredLogs = logs.filter(log => 
        new Date(log.timestamp) >= cutoffDate
      );
      
      await this.saveLogs(filteredLogs);
      
      const removedCount = logs.length - filteredLogs.length;
      console.log(`🧹 Logs limpos: ${removedCount} entradas antigas removidas`);
      
      return {
        removed: removedCount,
        remaining: filteredLogs.length
      };
    } catch (error) {
      this.errorHandler.logError(error, 'UserActionLogger.cleanOldLogs');
      throw error;
    }
  }

  /**
   * Limpa todos os logs
   */
  async clearAllLogs() {
    try {
      await this.saveLogs([]);
      console.log('🗑️ Todos os logs de usuário foram limpos');
      return { success: true, message: 'Logs limpos com sucesso' };
    } catch (error) {
      this.errorHandler.logError(error, 'UserActionLogger.clearAllLogs');
      throw error;
    }
  }

  /**
   * Obtém estatísticas dos logs
   */
  async getLogStats() {
    try {
      const logs = await this.loadLogs();
      
      const stats = {
        total: logs.length,
        byLevel: {
          info: logs.filter(log => log.level === 'info').length,
          warning: logs.filter(log => log.level === 'warning').length,
          error: logs.filter(log => log.level === 'error').length
        },
        byAction: {},
        today: 0,
        thisWeek: 0
      };
      
      // Contar por tipo de ação
      logs.forEach(log => {
        const action = log.action;
        stats.byAction[action] = (stats.byAction[action] || 0) + 1;
      });
      
      // Contar logs de hoje e desta semana
      const today = new Date().toDateString();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      logs.forEach(log => {
        const logDate = new Date(log.timestamp);
        if (logDate.toDateString() === today) {
          stats.today++;
        }
        if (logDate >= weekAgo) {
          stats.thisWeek++;
        }
      });
      
      return stats;
    } catch (error) {
      this.errorHandler.logError(error, 'UserActionLogger.getLogStats');
      throw error;
    }
  }

  /**
   * Gera ID único para o log
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Métodos de conveniência para diferentes tipos de log
   */
  async logInfo(action, details, metadata = {}) {
    return this.logUserAction('info', action, details, metadata);
  }

  async logWarning(action, details, metadata = {}) {
    return this.logUserAction('warning', action, details, metadata);
  }

  async logError(action, details, metadata = {}) {
    return this.logUserAction('error', action, details, metadata);
  }

  /**
   * Logs específicos para ações do sistema
   */
  async logConfigChange(field, oldValue, newValue, metadata = {}) {
    const details = `Alterou ${field} de "${oldValue}" para "${newValue}"`;
    return this.logInfo('Configuração Alterada', details, metadata);
  }

  async logFlowControl(action, metadata = {}) {
    const level = action.includes('pausar') ? 'warning' : 'info';
    return this.logUserAction(level, 'Controle de Fluxo', action, metadata);
  }

  async logMessageSent(patientName, actionCard, messageType, success, metadata = {}) {
    const level = success ? 'info' : 'error';
    const action = success ? 'Mensagem Enviada' : 'Falha no Envio';
    const details = `${messageType} para ${patientName} usando ${actionCard}`;
    return this.logUserAction(level, action, details, metadata);
  }

  async logAutomaticMessage(patientName, actionCard, messageType, success, metadata = {}) {
    const level = success ? 'info' : 'error';
    const action = success ? 'Mensagem Automática Enviada' : 'Falha Automática';
    const details = `${messageType} para ${patientName} usando Action Card ${actionCard}`;
    return this.logUserAction(level, action, details, metadata);
  }

  async logExclusionChange(type, item, action, metadata = {}) {
    const details = `${action} ${type}: ${item}`;
    return this.logInfo('Lista de Exclusão', details, metadata);
  }
}

module.exports = { UserActionLogger };
