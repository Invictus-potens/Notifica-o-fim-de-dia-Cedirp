/**
 * 🧪 TESTE COMPLETO DA RESTRIÇÃO 17h-18h
 * Sistema de automação de mensagens - Teste de bloqueio
 * 
 * Felipe-chan! Este é o teste mais importante do sistema! ✨
 */

const { TimeUtils } = require('./src/utils/TimeUtils');

// Mock do ConfigManager para testes
const mockConfigManager = {
  getSaturdayEndTime: () => '12:00',
  getEndOfDayTime: () => '18:00',
  getBusinessStartHour: () => 8,
  getBusinessEndHour: () => 18,
  shouldIgnoreBusinessHours: () => false
};

// Configurar o mock
TimeUtils.setConfigManager(mockConfigManager);

/**
 * 🎭 SIMULADOR DE HORÁRIO
 * Permite testar diferentes horários sem depender do horário real
 */
class TimeSimulator {
  static currentTime = null;
  
  static setTime(year, month, day, hour, minute = 0, second = 0) {
    this.currentTime = new Date(year, month - 1, day, hour, minute, second);
    console.log(`🕐 Horário simulado: ${this.currentTime.toLocaleString('pt-BR')}`);
  }
  
  static reset() {
    this.currentTime = null;
  }
}

/**
 * 🧪 CLASSE PRINCIPAL DE TESTES
 */
class RestrictionTester {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  /**
   * 📝 Registra resultado do teste
   */
  recordTest(testName, passed, expected, actual, details = '') {
    const result = {
      testName,
      passed,
      expected,
      actual,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    if (passed) {
      this.passedTests++;
      console.log(`✅ ${testName}: PASSOU`);
    } else {
      this.failedTests++;
      console.log(`❌ ${testName}: FALHOU`);
      console.log(`   Esperado: ${expected}`);
      console.log(`   Atual: ${actual}`);
      if (details) console.log(`   Detalhes: ${details}`);
    }
  }

  /**
   * 🎯 TESTE 1: Horário Normal (8h-17h) - Deve permitir mensagens
   */
  testNormalBusinessHours() {
    console.log('\n🎯 TESTE 1: Horário Normal (8h-17h)');
    
    const testCases = [
      { hour: 9, expected: false, desc: '9h da manhã' },
      { hour: 12, expected: false, desc: '12h (meio-dia)' },
      { hour: 15, expected: false, desc: '15h (tarde)' },
      { hour: 16, expected: false, desc: '16h (tarde)' },
      { hour: 16, minute: 59, expected: false, desc: '16h59 (último minuto)' }
    ];

    testCases.forEach(testCase => {
      TimeSimulator.setTime(2025, 10, 6, testCase.hour, testCase.minute || 0);
      
      // Mock do horário atual
      const originalGetBrasiliaTime = TimeUtils.getBrasiliaTime;
      TimeUtils.getBrasiliaTime = () => {
        const { DateTime } = require('luxon');
        return DateTime.fromJSDate(TimeSimulator.currentTime).setZone('America/Sao_Paulo');
      };
      
      const isBlocked = TimeUtils.isWaitingMessageBlocked();
      const passed = isBlocked === testCase.expected;
      
      this.recordTest(
        `Horário Normal - ${testCase.desc}`,
        passed,
        testCase.expected ? 'Bloqueado' : 'Permitido',
        isBlocked ? 'Bloqueado' : 'Permitido',
        `Horário: ${testCase.hour}:${testCase.minute || '00'}`
      );
      
      // Restaurar função original
      TimeUtils.getBrasiliaTime = originalGetBrasiliaTime;
    });
  }

  /**
   * 🎯 TESTE 2: Período de Bloqueio (17h-18h) - Deve bloquear mensagens
   */
  testBlockedPeriod() {
    console.log('\n🎯 TESTE 2: Período de Bloqueio (17h-18h)');
    
    const testCases = [
      { hour: 17, minute: 0, expected: true, desc: '17h00 (início do bloqueio)' },
      { hour: 17, minute: 30, expected: true, desc: '17h30 (meio do bloqueio)' },
      { hour: 17, minute: 59, expected: true, desc: '17h59 (último minuto bloqueado)' }
    ];

    testCases.forEach(testCase => {
      TimeSimulator.setTime(2025, 10, 6, testCase.hour, testCase.minute);
      
      // Mock do horário atual
      const originalGetBrasiliaTime = TimeUtils.getBrasiliaTime;
      TimeUtils.getBrasiliaTime = () => {
        const { DateTime } = require('luxon');
        return DateTime.fromJSDate(TimeSimulator.currentTime).setZone('America/Sao_Paulo');
      };
      
      const isBlocked = TimeUtils.isWaitingMessageBlocked();
      const passed = isBlocked === testCase.expected;
      
      this.recordTest(
        `Período de Bloqueio - ${testCase.desc}`,
        passed,
        testCase.expected ? 'Bloqueado' : 'Permitido',
        isBlocked ? 'Bloqueado' : 'Permitido',
        `Horário: ${testCase.hour}:${testCase.minute.toString().padStart(2, '0')}`
      );
      
      // Restaurar função original
      TimeUtils.getBrasiliaTime = originalGetBrasiliaTime;
    });
  }

  /**
   * 🎯 TESTE 3: Horário de Fim de Expediente (18h) - Deve permitir mensagem de fim
   */
  testEndOfDayMessage() {
    console.log('\n🎯 TESTE 3: Mensagem de Fim de Expediente (18h)');
    
    const testCases = [
      { hour: 17, minute: 59, expected: false, desc: '17h59 (antes do fim)' },
      { hour: 18, minute: 0, expected: true, desc: '18h00 (hora exata)' },
      { hour: 18, minute: 5, expected: true, desc: '18h05 (dentro da tolerância)' },
      { hour: 18, minute: 6, expected: false, desc: '18h06 (fora da tolerância)' }
    ];

    testCases.forEach(testCase => {
      TimeSimulator.setTime(2025, 10, 6, testCase.hour, testCase.minute);
      
      // Mock do horário atual
      const originalGetBrasiliaTime = TimeUtils.getBrasiliaTime;
      TimeUtils.getBrasiliaTime = () => {
        const { DateTime } = require('luxon');
        return DateTime.fromJSDate(TimeSimulator.currentTime).setZone('America/Sao_Paulo');
      };
      
      const canSend = TimeUtils.canSendEndOfDayMessage();
      const passed = canSend === testCase.expected;
      
      this.recordTest(
        `Mensagem Fim Expediente - ${testCase.desc}`,
        passed,
        testCase.expected ? 'Permitido' : 'Bloqueado',
        canSend ? 'Permitido' : 'Bloqueado',
        `Horário: ${testCase.hour}:${testCase.minute.toString().padStart(2, '0')}`
      );
      
      // Restaurar função original
      TimeUtils.getBrasiliaTime = originalGetBrasiliaTime;
    });
  }

  /**
   * 🎯 TESTE 4: Após o Expediente (18h+) - Deve permitir mensagens novamente
   */
  testAfterBusinessHours() {
    console.log('\n🎯 TESTE 4: Após o Expediente (18h+)');
    
    const testCases = [
      { hour: 18, minute: 1, expected: false, desc: '18h01 (após fim)' },
      { hour: 19, expected: false, desc: '19h (noite)' },
      { hour: 22, expected: false, desc: '22h (noite)' },
      { hour: 2, expected: false, desc: '2h (madrugada)' },
      { hour: 7, expected: false, desc: '7h (antes do expediente)' }
    ];

    testCases.forEach(testCase => {
      TimeSimulator.setTime(2025, 10, 6, testCase.hour, testCase.minute || 0);
      
      // Mock do horário atual
      const originalGetBrasiliaTime = TimeUtils.getBrasiliaTime;
      TimeUtils.getBrasiliaTime = () => {
        const { DateTime } = require('luxon');
        return DateTime.fromJSDate(TimeSimulator.currentTime).setZone('America/Sao_Paulo');
      };
      
      const isBlocked = TimeUtils.isWaitingMessageBlocked();
      const passed = isBlocked === testCase.expected;
      
      this.recordTest(
        `Após Expediente - ${testCase.desc}`,
        passed,
        testCase.expected ? 'Bloqueado' : 'Permitido',
        isBlocked ? 'Bloqueado' : 'Permitido',
        `Horário: ${testCase.hour}:${testCase.minute || '00'}`
      );
      
      // Restaurar função original
      TimeUtils.getBrasiliaTime = originalGetBrasiliaTime;
    });
  }

  /**
   * 🎯 TESTE 5: Sábados - Horário especial (11h-12h bloqueio)
   */
  testSaturdaySpecialHours() {
    console.log('\n🎯 TESTE 5: Sábados - Horário Especial');
    
    const testCases = [
      { hour: 10, expected: false, desc: '10h (antes do bloqueio)' },
      { hour: 11, minute: 0, expected: true, desc: '11h00 (início bloqueio sábado)' },
      { hour: 11, minute: 30, expected: true, desc: '11h30 (meio bloqueio sábado)' },
      { hour: 11, minute: 59, expected: true, desc: '11h59 (fim bloqueio sábado)' },
      { hour: 12, minute: 0, expected: false, desc: '12h00 (fim expediente sábado)' }
    ];

    testCases.forEach(testCase => {
      // Sábado = dia 6
      TimeSimulator.setTime(2025, 10, 11, testCase.hour, testCase.minute || 0);
      
      // Mock do horário atual
      const originalGetBrasiliaTime = TimeUtils.getBrasiliaTime;
      TimeUtils.getBrasiliaTime = () => {
        const { DateTime } = require('luxon');
        return DateTime.fromJSDate(TimeSimulator.currentTime).setZone('America/Sao_Paulo');
      };
      
      const isBlocked = TimeUtils.isWaitingMessageBlocked();
      const passed = isBlocked === testCase.expected;
      
      this.recordTest(
        `Sábado - ${testCase.desc}`,
        passed,
        testCase.expected ? 'Bloqueado' : 'Permitido',
        isBlocked ? 'Bloqueado' : 'Permitido',
        `Horário: ${testCase.hour}:${testCase.minute || '00'} (Sábado)`
      );
      
      // Restaurar função original
      TimeUtils.getBrasiliaTime = originalGetBrasiliaTime;
    });
  }

  /**
   * 🎯 TESTE 6: Domingo - Sem bloqueio
   */
  testSundayNoRestrictions() {
    console.log('\n🎯 TESTE 6: Domingo - Sem Restrições');
    
    const testCases = [
      { hour: 10, expected: false, desc: '10h (domingo)' },
      { hour: 17, expected: false, desc: '17h (domingo - normalmente bloqueado)' },
      { hour: 18, expected: false, desc: '18h (domingo)' }
    ];

    testCases.forEach(testCase => {
      // Domingo = dia 0
      TimeSimulator.setTime(2025, 10, 12, testCase.hour, 0);
      
      // Mock do horário atual
      const originalGetBrasiliaTime = TimeUtils.getBrasiliaTime;
      TimeUtils.getBrasiliaTime = () => {
        const { DateTime } = require('luxon');
        return DateTime.fromJSDate(TimeSimulator.currentTime).setZone('America/Sao_Paulo');
      };
      
      const isBlocked = TimeUtils.isWaitingMessageBlocked();
      const passed = isBlocked === testCase.expected;
      
      this.recordTest(
        `Domingo - ${testCase.desc}`,
        passed,
        testCase.expected ? 'Bloqueado' : 'Permitido',
        isBlocked ? 'Bloqueado' : 'Permitido',
        `Horário: ${testCase.hour}:00 (Domingo)`
      );
      
      // Restaurar função original
      TimeUtils.getBrasiliaTime = originalGetBrasiliaTime;
    });
  }

  /**
   * 🎯 TESTE 7: Cenários de Borda (transições)
   */
  testEdgeCases() {
    console.log('\n🎯 TESTE 7: Cenários de Borda');
    
    const testCases = [
      { hour: 16, minute: 59, second: 59, expected: false, desc: '16h59:59 (último segundo permitido)' },
      { hour: 17, minute: 0, second: 0, expected: true, desc: '17h00:00 (primeiro segundo bloqueado)' },
      { hour: 17, minute: 59, second: 59, expected: true, desc: '17h59:59 (último segundo bloqueado)' },
      { hour: 18, minute: 0, second: 0, expected: false, desc: '18h00:00 (primeiro segundo após bloqueio)' }
    ];

    testCases.forEach(testCase => {
      TimeSimulator.setTime(2025, 10, 6, testCase.hour, testCase.minute, testCase.second || 0);
      
      // Mock do horário atual
      const originalGetBrasiliaTime = TimeUtils.getBrasiliaTime;
      TimeUtils.getBrasiliaTime = () => {
        const { DateTime } = require('luxon');
        return DateTime.fromJSDate(TimeSimulator.currentTime).setZone('America/Sao_Paulo');
      };
      
      const isBlocked = TimeUtils.isWaitingMessageBlocked();
      const passed = isBlocked === testCase.expected;
      
      this.recordTest(
        `Borda - ${testCase.desc}`,
        passed,
        testCase.expected ? 'Bloqueado' : 'Permitido',
        isBlocked ? 'Bloqueado' : 'Permitido',
        `Horário: ${testCase.hour}:${testCase.minute}:${testCase.second || '00'}`
      );
      
      // Restaurar função original
      TimeUtils.getBrasiliaTime = originalGetBrasiliaTime;
    });
  }

  /**
   * 📊 EXECUTAR TODOS OS TESTES
   */
  async runAllTests() {
    console.log('🚀 INICIANDO TESTES DE RESTRIÇÃO 17h-18h');
    console.log('==========================================\n');
    
    try {
      this.testNormalBusinessHours();
      this.testBlockedPeriod();
      this.testEndOfDayMessage();
      this.testAfterBusinessHours();
      this.testSaturdaySpecialHours();
      this.testSundayNoRestrictions();
      this.testEdgeCases();
      
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Erro durante os testes:', error);
    } finally {
      TimeSimulator.reset();
    }
  }

  /**
   * 📊 IMPRIMIR RESUMO DOS TESTES
   */
  printSummary() {
    console.log('\n📊 RESUMO DOS TESTES');
    console.log('====================');
    console.log(`✅ Testes Passaram: ${this.passedTests}`);
    console.log(`❌ Testes Falharam: ${this.failedTests}`);
    console.log(`📈 Taxa de Sucesso: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
    
    if (this.failedTests > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      this.testResults
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`   • ${test.testName}`);
          console.log(`     Esperado: ${test.expected}, Atual: ${test.actual}`);
        });
    }
    
    console.log('\n🎯 CONCLUSÃO:');
    if (this.failedTests === 0) {
      console.log('🎉 TODOS OS TESTES PASSARAM! A restrição está funcionando perfeitamente!');
    } else {
      console.log('⚠️  Alguns testes falharam. Verifique a implementação.');
    }
  }
}

// 🚀 EXECUTAR TESTES
if (require.main === module) {
  const tester = new RestrictionTester();
  tester.runAllTests().catch(console.error);
}

module.exports = RestrictionTester;
