/**
 * Gerenciador de métricas do sistema
 * Métricas baseadas no uptime (zeram ao reiniciar o servidor)
 */
class SystemMetricsManager {
  constructor() {
    this.startTime = new Date();
    this.totalRequests = 0;
    this.apiSuccess = 0;
    this.apiFailures = 0;
    this.requestTimes = [];
  }

  /**
   * Incrementa contador de requisições
   */
  incrementRequests() {
    this.totalRequests++;
  }

  /**
   * Incrementa contador de API sucesso
   */
  incrementApiSuccess() {
    this.apiSuccess++;
  }

  /**
   * Incrementa contador de API falhas
   */
  incrementApiFailures() {
    this.apiFailures++;
  }

  /**
   * Adiciona tempo de resposta de uma requisição
   */
  addResponseTime(responseTime) {
    this.requestTimes.push(responseTime);
    
    // Manter apenas últimos 1000 tempos para cálculo de média
    if (this.requestTimes.length > 1000) {
      this.requestTimes.shift();
    }
  }

  /**
   * Obtém métricas atuais do sistema
   */
  getMetrics() {
    const uptime = Date.now() - this.startTime.getTime();
    const averageResponseTime = this.requestTimes.length > 0 
      ? this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length 
      : 0;

    return {
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      totalRequests: this.totalRequests,
      apiSuccess: this.apiSuccess,
      apiFailures: this.apiFailures,
      averageResponseTime: Math.round(averageResponseTime),
      startTime: this.startTime,
      successRate: this.totalRequests > 0 ? ((this.apiSuccess / this.totalRequests) * 100).toFixed(2) : 0
    };
  }

  /**
   * Formata tempo de uptime em formato legível
   */
  formatUptime(uptimeMs) {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Reseta todas as métricas (útil para testes)
   */
  reset() {
    this.startTime = new Date();
    this.totalRequests = 0;
    this.apiSuccess = 0;
    this.apiFailures = 0;
    this.requestTimes = [];
    console.log('🔄 Métricas do sistema resetadas');
  }
}

module.exports = { SystemMetricsManager };
