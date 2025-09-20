const fs = require('fs').promises;
const path = require('path');

/**
 * Gerenciador de métricas de mensagens
 * Salva métricas em JSON para persistência
 */
class MessageMetricsManager {
  constructor(errorHandler) {
    this.errorHandler = errorHandler;
    this.metricsFile = path.join(__dirname, '../../data/message_metrics.json');
    this.metrics = {
      totalSent: 0,
      totalFailed: 0,
      messages30Min: 0,
      messagesEndDay: 0,
      lastUpdated: null,
      dailyStats: {}
    };
  }

  /**
   * Inicializa o gerenciador carregando métricas existentes
   */
  async initialize() {
    try {
      await this.loadMetrics();
      console.log('✅ MessageMetricsManager inicializado');
    } catch (error) {
      console.log('⚠️ Criando arquivo de métricas...');
      await this.saveMetrics();
    }
  }

  /**
   * Carrega métricas do arquivo JSON
   */
  async loadMetrics() {
    try {
      const data = await fs.readFile(this.metricsFile, 'utf8');
      this.metrics = JSON.parse(data);
      console.log('📊 Métricas de mensagens carregadas:', this.metrics);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Arquivo não existe, usar métricas padrão
        this.metrics = {
          totalSent: 0,
          totalFailed: 0,
          messages30Min: 0,
          messagesEndDay: 0,
          lastUpdated: null,
          dailyStats: {}
        };
      } else {
        throw error;
      }
    }
  }

  /**
   * Salva métricas no arquivo JSON
   */
  async saveMetrics() {
    try {
      this.metrics.lastUpdated = new Date().toISOString();
      await fs.writeFile(this.metricsFile, JSON.stringify(this.metrics, null, 2));
      console.log('💾 Métricas de mensagens salvas');
    } catch (error) {
      this.errorHandler?.logError(error, 'MessageMetricsManager.saveMetrics');
      throw error;
    }
  }

  /**
   * Incrementa contador de mensagens enviadas
   */
  async incrementSent(messageType = null) {
    this.metrics.totalSent++;
    
    if (messageType === '30min') {
      this.metrics.messages30Min++;
    } else if (messageType === 'end_of_day') {
      this.metrics.messagesEndDay++;
    }
    
    // Atualizar estatísticas diárias
    const today = new Date().toISOString().split('T')[0];
    if (!this.metrics.dailyStats[today]) {
      this.metrics.dailyStats[today] = {
        sent: 0,
        failed: 0,
        messages30Min: 0,
        messagesEndDay: 0
      };
    }
    this.metrics.dailyStats[today].sent++;
    
    if (messageType === '30min') {
      this.metrics.dailyStats[today].messages30Min++;
    } else if (messageType === 'end_of_day') {
      this.metrics.dailyStats[today].messagesEndDay++;
    }
    
    await this.saveMetrics();
    console.log(`📈 Mensagem enviada incrementada. Total: ${this.metrics.totalSent}`);
  }

  /**
   * Incrementa contador de mensagens falhadas
   */
  async incrementFailed() {
    this.metrics.totalFailed++;
    
    // Atualizar estatísticas diárias
    const today = new Date().toISOString().split('T')[0];
    if (!this.metrics.dailyStats[today]) {
      this.metrics.dailyStats[today] = {
        sent: 0,
        failed: 0,
        messages30Min: 0,
        messagesEndDay: 0
      };
    }
    this.metrics.dailyStats[today].failed++;
    
    await this.saveMetrics();
    console.log(`📉 Mensagem falhada incrementada. Total: ${this.metrics.totalFailed}`);
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Obtém métricas do dia atual
   */
  getTodayMetrics() {
    const today = new Date().toISOString().split('T')[0];
    return this.metrics.dailyStats[today] || {
      sent: 0,
      failed: 0,
      messages30Min: 0,
      messagesEndDay: 0
    };
  }

  /**
   * Limpa métricas antigas (manter apenas últimos 30 dias)
   */
  async cleanupOldMetrics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    Object.keys(this.metrics.dailyStats).forEach(date => {
      if (date < cutoffDate) {
        delete this.metrics.dailyStats[date];
      }
    });
    
    await this.saveMetrics();
    console.log('🧹 Métricas antigas limpas');
  }
}

module.exports = { MessageMetricsManager };
