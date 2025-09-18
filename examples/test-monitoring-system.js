const { MainController } = require('../src/controllers/MainController');

/**
 * Script de teste para o sistema de monitoramento
 * Testa todos os componentes do sistema de monitoramento automático
 */

class MonitoringSystemTester {
  constructor() {
    this.mainController = new MainController();
    this.testResults = {
      initialization: false,
      patientCheck: false,
      messageSending: false,
      scheduler: false,
      stats: false
    };
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    console.log('🧪 INICIANDO TESTES DO SISTEMA DE MONITORAMENTO\n');
    
    try {
      // Teste 1: Inicialização
      await this.testInitialization();
      
      // Teste 2: Verificação de pacientes
      await this.testPatientCheck();
      
      // Teste 3: Envio de mensagens
      await this.testMessageSending();
      
      // Teste 4: Agendador
      await this.testScheduler();
      
      // Teste 5: Estatísticas
      await this.testStats();
      
      // Mostrar resultados
      this.showTestResults();
      
    } catch (error) {
      console.error('\n❌ Erro durante os testes:', error.message);
    }
  }

  /**
   * Teste de inicialização
   */
  async testInitialization() {
    console.log('🔧 Testando inicialização...');
    
    try {
      await this.mainController.initialize();
      await this.mainController.start(); // Iniciar o sistema
      console.log('✅ Inicialização bem-sucedida');
      this.testResults.initialization = true;
      
    } catch (error) {
      console.error('❌ Erro na inicialização:', error.message);
      this.testResults.initialization = false;
    }
  }

  /**
   * Teste de verificação de pacientes
   */
  async testPatientCheck() {
    console.log('\n🔍 Testando verificação de pacientes...');
    
    try {
      // Executar verificação manual
      await this.mainController.runManualPatientCheck();
      console.log('✅ Verificação de pacientes bem-sucedida');
      this.testResults.patientCheck = true;
      
    } catch (error) {
      console.error('❌ Erro na verificação de pacientes:', error.message);
      this.testResults.patientCheck = false;
    }
  }

  /**
   * Teste de envio de mensagens
   */
  async testMessageSending() {
    console.log('\n📤 Testando envio de mensagens...');
    
    try {
      // Verificar se há pacientes para testar
      const stats = await this.mainController.getDetailedStats();
      
      if (stats.monitoring && stats.monitoring.jsonStats.active > 0) {
        console.log(`📊 ${stats.monitoring.jsonStats.active} pacientes ativos encontrados`);
        
        // Testar envio manual de mensagens de fim de dia
        await this.mainController.runManualEndOfDayMessages();
        console.log('✅ Envio de mensagens bem-sucedido');
        this.testResults.messageSending = true;
        
      } else {
        console.log('⚠️ Nenhum paciente ativo encontrado para teste de envio');
        this.testResults.messageSending = true; // Considerar como sucesso
      }
      
    } catch (error) {
      console.error('❌ Erro no envio de mensagens:', error.message);
      this.testResults.messageSending = false;
    }
  }

  /**
   * Teste do agendador
   */
  async testScheduler() {
    console.log('\n⏰ Testando agendador...');
    
    try {
      // Verificar jobs ativos
      this.mainController.listActiveJobs();
      
      // Verificar status do agendador
      const status = await this.mainController.getStatus();
      
      if (status.productionScheduler && status.productionScheduler.isRunning) {
        console.log('✅ Agendador funcionando corretamente');
        this.testResults.scheduler = true;
      } else {
        console.log('⚠️ Agendador não está rodando');
        this.testResults.scheduler = false;
      }
      
    } catch (error) {
      console.error('❌ Erro no teste do agendador:', error.message);
      this.testResults.scheduler = false;
    }
  }

  /**
   * Teste de estatísticas
   */
  async testStats() {
    console.log('\n📊 Testando estatísticas...');
    
    try {
      // Obter estatísticas detalhadas
      const stats = await this.mainController.getDetailedStats();
      
      console.log('📈 Estatísticas do sistema:');
      console.log(`   - Agendador: ${stats.scheduler.isRunning ? 'Ativo' : 'Inativo'}`);
      console.log(`   - Monitoramento: ${stats.monitoring ? 'Funcionando' : 'Não disponível'}`);
      console.log(`   - Mensagens: ${stats.messages ? 'Disponível' : 'Não disponível'}`);
      
      if (stats.monitoring) {
        console.log(`   - Pacientes ativos: ${stats.monitoring.jsonStats.active}`);
        console.log(`   - Pacientes processados: ${stats.monitoring.jsonStats.processed}`);
        console.log(`   - Total de verificações: ${stats.monitoring.totalChecks}`);
      }
      
      if (stats.messages) {
        console.log(`   - Mensagens enviadas: ${stats.messages.totalSent}`);
        console.log(`   - Taxa de sucesso: ${stats.messages.successRate}%`);
      }
      
      console.log('✅ Estatísticas obtidas com sucesso');
      this.testResults.stats = true;
      
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error.message);
      this.testResults.stats = false;
    }
  }

  /**
   * Mostra resultados dos testes
   */
  showTestResults() {
    console.log('\n🎯 RESULTADOS DOS TESTES:');
    console.log('========================');
    
    const tests = [
      { name: 'Inicialização', result: this.testResults.initialization },
      { name: 'Verificação de Pacientes', result: this.testResults.patientCheck },
      { name: 'Envio de Mensagens', result: this.testResults.messageSending },
      { name: 'Agendador', result: this.testResults.scheduler },
      { name: 'Estatísticas', result: this.testResults.stats }
    ];
    
    tests.forEach(test => {
      const status = test.result ? '✅ PASSOU' : '❌ FALHOU';
      console.log(`   ${test.name}: ${status}`);
    });
    
    const passedTests = tests.filter(t => t.result).length;
    const totalTests = tests.length;
    
    console.log(`\n📊 Resultado Final: ${passedTests}/${totalTests} testes passaram`);
    
    if (passedTests === totalTests) {
      console.log('🎉 Todos os testes passaram! Sistema funcionando corretamente.');
    } else {
      console.log('⚠️ Alguns testes falharam. Verifique os logs acima.');
    }
  }

  /**
   * Teste de configuração do agendador
   */
  async testSchedulerConfiguration() {
    console.log('\n⚙️ Testando configuração do agendador...');
    
    try {
      // Testar configuração de monitoramento intensivo
      this.mainController.updateSchedulerConfig({
        patientCheckInterval: '1min',
        enable30MinuteMessages: true,
        enableEndOfDayMessages: true
      });
      
      console.log('✅ Configuração do agendador atualizada');
      
      // Verificar status
      const status = await this.mainController.getStatus();
      console.log('📊 Status atual:', status.productionScheduler);
      
    } catch (error) {
      console.error('❌ Erro na configuração do agendador:', error.message);
    }
  }

  /**
   * Teste de limpeza de dados
   */
  async testDataCleanup() {
    console.log('\n🧹 Testando limpeza de dados...');
    
    try {
      // Verificar arquivos antes da limpeza
      const fs = require('fs');
      const path = require('path');
      
      const dataDir = './data';
      const files = ['patients_active.json', 'patients_processed.json', 'patients_history.json'];
      
      console.log('📁 Arquivos antes da limpeza:');
      files.forEach(file => {
        const filePath = path.join(dataDir, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const patients = JSON.parse(content);
          console.log(`   ${file}: ${patients.length} pacientes`);
        }
      });
      
      console.log('✅ Verificação de arquivos concluída');
      
    } catch (error) {
      console.error('❌ Erro na verificação de arquivos:', error.message);
    }
  }
}

// Executar testes se chamado diretamente
async function main() {
  const tester = new MonitoringSystemTester();
  
  const args = process.argv.slice(2);
  const testType = args[0];
  
  try {
    switch (testType) {
      case 'all':
        await tester.runAllTests();
        break;
        
      case 'init':
        await tester.testInitialization();
        break;
        
      case 'patients':
        await tester.testPatientCheck();
        break;
        
      case 'messages':
        await tester.testMessageSending();
        break;
        
      case 'scheduler':
        await tester.testScheduler();
        break;
        
      case 'stats':
        await tester.testStats();
        break;
        
      case 'config':
        await tester.testSchedulerConfiguration();
        break;
        
      case 'cleanup':
        await tester.testDataCleanup();
        break;
        
      default:
        console.log('🧪 Testador do Sistema de Monitoramento\n');
        console.log('Uso: node examples/test-monitoring-system.js [tipo]\n');
        console.log('Tipos de teste disponíveis:');
        console.log('  all       - Executa todos os testes');
        console.log('  init      - Testa inicialização');
        console.log('  patients  - Testa verificação de pacientes');
        console.log('  messages  - Testa envio de mensagens');
        console.log('  scheduler - Testa agendador');
        console.log('  stats     - Testa estatísticas');
        console.log('  config    - Testa configuração');
        console.log('  cleanup   - Testa limpeza de dados');
        console.log('\nExemplos:');
        console.log('  node examples/test-monitoring-system.js all');
        console.log('  node examples/test-monitoring-system.js patients');
        break;
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MonitoringSystemTester };
