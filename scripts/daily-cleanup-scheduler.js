const cron = require('node-cron');
const { DataCleanup } = require('./cleanup-old-data');

/**
 * Agendador de limpeza diária
 * Executa limpeza automática dos dados às 18h todos os dias
 */

class DailyCleanupScheduler {
  constructor() {
    this.cleanup = new DataCleanup();
    this.isRunning = false;
    this.scheduledTask = null;
  }

  /**
   * Inicia o agendador de limpeza diária
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Agendador de limpeza já está rodando');
      return;
    }

    // Agendar limpeza diária às 18:00
    // Formato: segundo minuto hora dia mês dia-da-semana
    // '0 0 18 * * *' = às 18:00:00 todos os dias
    this.scheduledTask = cron.schedule('0 0 18 * * *', async () => {
      console.log('\n🌅 EXECUTANDO LIMPEZA DIÁRIA AUTOMÁTICA (18:00)...');
      
      try {
        await this.cleanup.clearAllData();
        console.log('✅ Limpeza diária automática concluída com sucesso');
        
        // Log para sistema
        console.log(`📝 [${new Date().toISOString()}] Limpeza diária executada`);
        
      } catch (error) {
        console.error('❌ Erro na limpeza diária automática:', error.message);
      }
    }, {
      scheduled: false, // Não iniciar automaticamente
      timezone: "America/Sao_Paulo" // Timezone de Brasília
    });

    this.isRunning = true;
    console.log('⏰ Agendador de limpeza diária iniciado (18:00 BRT)');
  }

  /**
   * Para o agendador
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Agendador de limpeza não está rodando');
      return;
    }

    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask = null;
    }

    this.isRunning = false;
    console.log('⏹️ Agendador de limpeza parado');
  }

  /**
   * Verifica status do agendador
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextExecution: this.scheduledTask ? this.scheduledTask.nextDate() : null,
      timezone: 'America/Sao_Paulo'
    };
  }

  /**
   * Executa limpeza manual (para testes)
   */
  async runManualCleanup() {
    console.log('🧹 EXECUTANDO LIMPEZA MANUAL...');
    
    try {
      await this.cleanup.clearAllData();
      console.log('✅ Limpeza manual concluída com sucesso');
    } catch (error) {
      console.error('❌ Erro na limpeza manual:', error.message);
    }
  }

  /**
   * Testa o agendador (executa em 10 segundos)
   */
  testScheduler() {
    console.log('🧪 TESTANDO AGENDADOR (execução em 10 segundos)...');
    
    // Criar tarefa de teste
    const testTask = cron.schedule('*/10 * * * * *', async () => {
      console.log('🧪 EXECUTANDO TESTE DO AGENDADOR...');
      
      try {
        await this.cleanup.createCleanupBackup();
        console.log('✅ Teste do agendador concluído (apenas backup)');
        
        // Parar a tarefa de teste
        testTask.stop();
        console.log('⏹️ Tarefa de teste finalizada');
        
      } catch (error) {
        console.error('❌ Erro no teste do agendador:', error.message);
        testTask.stop();
      }
    }, {
      scheduled: false
    });

    // Iniciar tarefa de teste
    testTask.start();
    console.log('⏰ Tarefa de teste iniciada (execução em 10 segundos)');
    
    return testTask;
  }
}

// Executar se chamado diretamente
async function main() {
  const scheduler = new DailyCleanupScheduler();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'start':
        scheduler.start();
        console.log('✅ Agendador iniciado');
        break;
        
      case 'stop':
        scheduler.stop();
        console.log('✅ Agendador parado');
        break;
        
      case 'status':
        const status = scheduler.getStatus();
        console.log('📊 Status do Agendador:');
        console.log(`   🟢 Rodando: ${status.isRunning ? 'Sim' : 'Não'}`);
        console.log(`   ⏰ Próxima execução: ${status.nextExecution || 'N/A'}`);
        console.log(`   🌍 Timezone: ${status.timezone}`);
        break;
        
      case 'test':
        scheduler.testScheduler();
        break;
        
      case 'cleanup':
        await scheduler.runManualCleanup();
        break;
        
      default:
        console.log('⏰ Agendador de Limpeza Diária\n');
        console.log('Uso: node scripts/daily-cleanup-scheduler.js [comando]\n');
        console.log('Comandos disponíveis:');
        console.log('  start    - Inicia o agendador (limpeza às 18h)');
        console.log('  stop     - Para o agendador');
        console.log('  status   - Mostra status do agendador');
        console.log('  test     - Testa o agendador (execução em 10s)');
        console.log('  cleanup  - Executa limpeza manual');
        console.log('\nExemplos:');
        console.log('  node scripts/daily-cleanup-scheduler.js start');
        console.log('  node scripts/daily-cleanup-scheduler.js status');
        console.log('  node scripts/daily-cleanup-scheduler.js test');
        break;
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante a operação:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DailyCleanupScheduler };
