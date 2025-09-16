import { TimeUtils } from '../utils/TimeUtils';

export class SimpleConsoleLogger {
  private static instance: SimpleConsoleLogger;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SimpleConsoleLogger {
    if (!SimpleConsoleLogger.instance) {
      SimpleConsoleLogger.instance = new SimpleConsoleLogger();
    }
    return SimpleConsoleLogger.instance;
  }

  /**
   * Inicia o logging de status
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.showInitialStatus();
    
    // Atualizar status a cada 30 segundos
    this.intervalId = setInterval(() => {
      this.showStatus();
    }, 30000);
  }

  /**
   * Para o logging
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Mostra status inicial
   */
  private showInitialStatus(): void {
    const now = TimeUtils.toBrasiliaTime(new Date());
    console.log('\n' + '='.repeat(60));
    console.log('🏥 SISTEMA DE AUTOMAÇÃO DE MENSAGENS - CEDIRP');
    console.log('='.repeat(60));
    console.log(`📅 ${now.toFormat('dd/MM/yyyy HH:mm:ss')} (Brasília)`);
    console.log(`🌍 Fuso: America/Sao_Paulo`);
    console.log(`⚡ Status: Sistema Iniciado`);
    console.log('='.repeat(60));
  }

  /**
   * Mostra status atual
   */
  private showStatus(): void {
    try {
      const now = TimeUtils.toBrasiliaTime(new Date());
      const isBusinessHours = TimeUtils.isBusinessHours();
      const isWorkingDay = TimeUtils.isWorkingDay();
      const isEndOfDay = TimeUtils.isEndOfDayTimeWithTolerance(5);

      const status = isBusinessHours ? '🟢 ATIVO' : '🟡 AGUARDANDO';
      const nextAction = isEndOfDay ? '📤 FIM DO DIA' : 
                        isBusinessHours ? '⏰ MONITORANDO' : '😴 FORA DO EXPEDIENTE';

      console.log(`\n🔄 ${now.toFormat('HH:mm:ss')} | ${status} | ${nextAction}`);

      if (isEndOfDay && isWorkingDay) {
        console.log('⚠️  ATENÇÃO: Horário de fim do expediente (18:00)');
      }

    } catch (error) {
      console.error('❌ Erro no monitoramento:', error);
    }
  }

  /**
   * Log de mensagem enviada
   */
  logMessageSent(type: '30min' | 'end_of_day', count: number): void {
    const timestamp = new Date().toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const icon = type === '30min' ? '⏰' : '🌅';
    const typeText = type === '30min' ? '30min' : 'fim do dia';
    console.log(`${timestamp} INFO  [SimpleConsoleLogger] ${icon} ${count} mensagens ${typeText} enviadas`);
  }

  /**
   * Log de erro
   */
  logError(message: string, error?: Error): void {
    const timestamp = new Date().toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    console.log(`${timestamp} ERROR [SimpleConsoleLogger] ❌ ${message}`);
    if (error) {
      console.log(`${timestamp} ERROR [SimpleConsoleLogger]    Erro: ${error.message}`);
    }
  }

  /**
   * Log de info
   */
  logInfo(message: string): void {
    const timestamp = new Date().toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    console.log(`${timestamp} INFO  [SimpleConsoleLogger] ${message}`);
  }

  /**
   * Log de warning
   */
  logWarning(message: string): void {
    const timestamp = new Date().toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    console.log(`${timestamp} WARN  [SimpleConsoleLogger] ${message}`);
  }

  /**
   * Log de health check
   */
  logHealthCheck(status: 'healthy' | 'degraded' | 'unhealthy', details?: string): void {
    const timestamp = new Date().toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const icon = status === 'healthy' ? '✅' : status === 'degraded' ? '⚠️' : '❌';
    const statusText = status === 'healthy' ? 'SAUDÁVEL' : 
                      status === 'degraded' ? 'DEGRADADO' : 'PROBLEMA';
    
    console.log(`${timestamp} INFO  [SimpleConsoleLogger] ${icon} Health: ${statusText}`);
    if (details) {
      console.log(`${timestamp} INFO  [SimpleConsoleLogger]    Detalhes: ${details}`);
    }
  }
}
