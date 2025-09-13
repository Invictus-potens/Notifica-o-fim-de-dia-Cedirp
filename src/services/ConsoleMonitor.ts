import { Logger } from './Logger';
import { HealthCheckService } from './HealthCheckService';
import { MetricsService } from './MetricsService';
import { TimeUtils } from '../utils/TimeUtils';

export class ConsoleMonitor {
  private logger: Logger;
  private healthCheckService: HealthCheckService;
  private metricsService: MetricsService;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(logger: Logger, healthCheckService: HealthCheckService, metricsService: MetricsService) {
    this.logger = logger;
    this.healthCheckService = healthCheckService;
    this.metricsService = metricsService;
  }

  /**
   * Inicia o monitoramento no console
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.logger.info('Iniciando monitoramento do console', 'ConsoleMonitor');
    
    // Mostrar status inicial
    this.showInitialStatus();
    
    // Atualizar status a cada 30 segundos
    this.intervalId = setInterval(() => {
      this.updateStatus();
    }, 30000);

    // Mostrar status a cada 5 minutos
    setInterval(() => {
      this.showDetailedStatus();
    }, 300000);
  }

  /**
   * Para o monitoramento
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.logger.info('Monitoramento do console parado', 'ConsoleMonitor');
  }

  /**
   * Mostra status inicial
   */
  private async showInitialStatus(): Promise<void> {
    console.log('\n' + '='.repeat(80));
    console.log('🏥 SISTEMA DE AUTOMAÇÃO DE MENSAGENS DE ESPERA - CEDIRP');
    console.log('='.repeat(80));
    console.log(`📅 Data/Hora: ${TimeUtils.toBrasiliaTime(new Date()).toFormat('dd/MM/yyyy HH:mm:ss')} (Brasília)`);
    console.log(`🌍 Fuso Horário: America/Sao_Paulo`);
    console.log(`⚡ Status: Sistema Iniciado`);
    console.log('='.repeat(80));
    
    await this.updateStatus();
  }

  /**
   * Atualiza status básico
   */
  private async updateStatus(): Promise<void> {
    try {
      const now = TimeUtils.toBrasiliaTime(new Date());
      const isBusinessHours = TimeUtils.isBusinessHours();
      const isWorkingDay = TimeUtils.isWorkingDay();
      const isEndOfDay = TimeUtils.isEndOfDayTimeWithTolerance(5);

      // Status básico
      const status = isBusinessHours ? '🟢 ATIVO' : '🟡 AGUARDANDO';
      const nextAction = isEndOfDay ? '📤 FIM DO DIA' : isBusinessHours ? '⏰ MONITORANDO' : '😴 FORA DO EXPEDIENTE';

      console.log(`\n🔄 ${now.toFormat('HH:mm:ss')} | ${status} | ${nextAction}`);

      // Se for fim do dia, mostrar alerta
      if (isEndOfDay && isWorkingDay) {
        console.log('⚠️  ATENÇÃO: Horário de fim do expediente (18:00) - Verificando pacientes aguardando...');
      }

    } catch (error) {
      this.logger.error('Erro ao atualizar status', 'ConsoleMonitor', error as Error);
    }
  }

  /**
   * Mostra status detalhado
   */
  private async showDetailedStatus(): Promise<void> {
    try {
      console.log('\n' + '─'.repeat(80));
      console.log('📊 STATUS DETALHADO DO SISTEMA');
      console.log('─'.repeat(80));

      // Health check
      const health = await this.healthCheckService.performHealthCheck();
      const healthStatus = health.status === 'healthy' ? '✅ SAUDÁVEL' : 
                          health.status === 'degraded' ? '⚠️ DEGRADADO' : '❌ PROBLEMA';

      console.log(`🏥 Health Check: ${healthStatus}`);
      
      if (health.checks) {
        Object.entries(health.checks).forEach(([check, result]) => {
          const resultTyped = result as any;
          const status = resultTyped.status === 'pass' ? '✅' : resultTyped.status === 'warn' ? '⚠️' : '❌';
          console.log(`   ${status} ${check}: ${resultTyped.message}`);
        });
      }

      // Métricas
      const metrics = this.metricsService.getAllMetrics();
      console.log(`\n📈 MÉTRICAS:`);
      console.log(`   📤 Mensagens enviadas hoje: ${metrics.messages.totalSent}`);
      console.log(`   ⏰ Mensagens 30min: ${metrics.messages.by30Min}`);
      console.log(`   🌅 Mensagens fim do dia: ${metrics.messages.byEndOfDay}`);
      console.log(`   📞 Chamadas API sucesso: ${metrics.system.apiCallsSuccessful}`);
      console.log(`   ❌ Chamadas API falha: ${metrics.system.apiCallsFailed}`);
      
      const successRate = metrics.system.apiCallsSuccessful + metrics.system.apiCallsFailed > 0 
        ? ((metrics.system.apiCallsSuccessful / (metrics.system.apiCallsSuccessful + metrics.system.apiCallsFailed)) * 100).toFixed(1)
        : '0';
      console.log(`   📊 Taxa de sucesso: ${successRate}%`);

      // Status do sistema
      const now = TimeUtils.toBrasiliaTime(new Date());
      const isBusinessHours = TimeUtils.isBusinessHours();
      const isWorkingDay = TimeUtils.isWorkingDay();
      
      console.log(`\n⏰ HORÁRIO:`);
      console.log(`   🕐 Agora: ${now.toFormat('dd/MM/yyyy HH:mm:ss')} (Brasília)`);
      console.log(`   🏢 Expediente: ${isBusinessHours ? 'SIM' : 'NÃO'}`);
      console.log(`   📅 Dia útil: ${isWorkingDay ? 'SIM' : 'NÃO'}`);
      
      if (isBusinessHours && isWorkingDay) {
        console.log(`   ⏳ Próximo fim do dia: 18:00 (${TimeUtils.toBrasiliaTime(new Date()).set({ hour: 18, minute: 0 }).diff(now, 'minutes').minutes} min)`);
      }

      console.log('─'.repeat(80));

    } catch (error) {
      this.logger.error('Erro ao mostrar status detalhado', 'ConsoleMonitor', error as Error);
    }
  }

  /**
   * Mostra alerta de fim do dia
   */
  showEndOfDayAlert(): void {
    console.log('\n' + '🚨'.repeat(20));
    console.log('🚨 ATENÇÃO: HORÁRIO DE FIM DO EXPEDIENTE (18:00) 🚨');
    console.log('📤 Enviando mensagens de encerramento para pacientes aguardando...');
    console.log('🚨'.repeat(20));
  }

  /**
   * Mostra resultado do envio de mensagens
   */
  showMessageResult(success: boolean, count: number, type: string): void {
    const status = success ? '✅' : '❌';
    const message = success ? 'Enviadas' : 'Falharam';
    console.log(`${status} ${message} ${count} mensagens ${type}`);
  }

  /**
   * Mostra erro crítico
   */
  showCriticalError(error: Error, context: string): void {
    console.log('\n' + '💥'.repeat(20));
    console.log('💥 ERRO CRÍTICO DETECTADO 💥');
    console.log(`📍 Contexto: ${context}`);
    console.log(`❌ Erro: ${error.message}`);
    console.log('💥'.repeat(20));
  }

  /**
   * Mostra informações de inicialização
   */
  showStartupInfo(): void {
    console.log('\n🚀 INICIANDO SISTEMA...');
    console.log('📋 Verificando componentes...');
  }

  /**
   * Mostra componente inicializado
   */
  showComponentInitialized(component: string): void {
    console.log(`   ✅ ${component} inicializado`);
  }

  /**
   * Mostra sistema pronto
   */
  showSystemReady(): void {
    console.log('\n🎉 SISTEMA PRONTO!');
    console.log('🌐 Interface web: http://localhost:3000');
    console.log('📊 Health check: http://localhost:3000/health');
    console.log('📈 Métricas: http://localhost:3000/metrics');
    console.log('─'.repeat(80));
  }
}
