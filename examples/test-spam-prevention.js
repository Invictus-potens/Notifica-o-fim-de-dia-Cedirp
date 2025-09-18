const { MonitoringService } = require('../src/services/MonitoringService');
const { ErrorHandler } = require('../src/services/ErrorHandler');
const { ConfigManager } = require('../src/services/ConfigManager');

/**
 * Script de teste para demonstrar a prevenção de spam
 * Mostra como funciona a janela de 30-40 minutos
 */

class SpamPreventionTester {
  constructor() {
    this.errorHandler = new ErrorHandler();
    this.configManager = new ConfigManager(this.errorHandler);
    this.monitoringService = new MonitoringService(this.errorHandler, this.configManager);
  }

  /**
   * Cria pacientes de teste com diferentes tempos de espera
   */
  createTestPatients() {
    return [
      {
        id: 'test_1',
        name: 'João Silva',
        phone: '5511999887766',
        sectorId: '64d4db384f04cb80ac059912',
        sectorName: 'Suporte Geral',
        contactId: 'test_contact_1',
        waitTimeMinutes: 25, // Muito cedo
        channelType: 'WhatsApp Business (Principal)'
      },
      {
        id: 'test_2',
        name: 'Maria Santos',
        phone: '5511888776655',
        sectorId: '64d4db384f04cb80ac059912',
        sectorName: 'Suporte Geral',
        contactId: 'test_contact_2',
        waitTimeMinutes: 32, // Dentro da janela ideal
        channelType: 'WhatsApp Business (Principal)'
      },
      {
        id: 'test_3',
        name: 'Pedro Costa',
        phone: '5511777665544',
        sectorId: '64d4db384f04cb80ac059912',
        sectorName: 'Suporte Geral',
        contactId: 'test_contact_3',
        waitTimeMinutes: 38, // Dentro da janela ideal
        channelType: 'WhatsApp Business (Principal)'
      },
      {
        id: 'test_4',
        name: 'Ana Oliveira',
        phone: '5511666554433',
        sectorId: '64d4db384f04cb80ac059912',
        sectorName: 'Suporte Geral',
        contactId: 'test_contact_4',
        waitTimeMinutes: 45, // Janela perdida
        channelType: 'WhatsApp Business (Principal)'
      },
      {
        id: 'test_5',
        name: 'Carlos Ferreira',
        phone: '5511555443322',
        sectorId: '64d4db384f04cb80ac059912',
        sectorName: 'Suporte Geral',
        contactId: 'test_contact_5',
        waitTimeMinutes: 60, // Muito tarde
        channelType: 'WhatsApp Business (Principal)'
      }
    ];
  }

  /**
   * Testa elegibilidade para mensagens de 30min
   */
  async test30MinuteEligibility() {
    console.log('🧪 TESTE DE PREVENÇÃO DE SPAM - MENSAGENS DE 30 MINUTOS\n');
    
    const testPatients = this.createTestPatients();
    
    console.log('📋 Pacientes de teste:');
    console.log('====================');
    
    for (const patient of testPatients) {
      console.log(`👤 ${patient.name}`);
      console.log(`   📱 Telefone: ${patient.phone}`);
      console.log(`   ⏰ Tempo de espera: ${patient.waitTimeMinutes} minutos`);
      
      // Simular verificação de elegibilidade
      const isEligible = await this.simulateEligibilityCheck(patient);
      
      if (isEligible) {
        console.log(`   ✅ ELEGÍVEL para mensagem de 30min`);
      } else {
        if (patient.waitTimeMinutes < 30) {
          console.log(`   ⏳ Muito cedo (< 30min)`);
        } else if (patient.waitTimeMinutes > 40) {
          console.log(`   ❌ Janela perdida (> 40min)`);
        } else {
          console.log(`   ❌ Não elegível por outros critérios`);
        }
      }
      
      console.log('');
    }
    
    // Resumo
    const eligiblePatients = testPatients.filter(p => 
      p.waitTimeMinutes >= 30 && p.waitTimeMinutes <= 40
    );
    
    console.log('📊 RESUMO:');
    console.log(`   Total de pacientes: ${testPatients.length}`);
    console.log(`   Elegíveis para 30min: ${eligiblePatients.length}`);
    console.log(`   Janela de elegibilidade: 30-40 minutos`);
    
    return eligiblePatients;
  }

  /**
   * Simula verificação de elegibilidade
   */
  async simulateEligibilityCheck(patient) {
    try {
      // Verificar tempo de espera (30-40 minutos para evitar spam)
      if (!patient.waitTimeMinutes || patient.waitTimeMinutes < 30 || patient.waitTimeMinutes > 40) {
        return false;
      }
      
      // Outros critérios seriam verificados aqui (horário comercial, etc.)
      // Para este teste, focamos apenas no tempo de espera
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro na verificação de elegibilidade:', error.message);
      return false;
    }
  }

  /**
   * Demonstra cenários de uso
   */
  demonstrateScenarios() {
    console.log('\n🎭 CENÁRIOS DE USO:\n');
    
    console.log('📅 Cenário 1: Paciente aguarda 25 minutos');
    console.log('   → Sistema: ⏳ Aguardar mais 5 minutos');
    console.log('   → Ação: Nenhuma mensagem enviada\n');
    
    console.log('📅 Cenário 2: Paciente aguarda 32 minutos');
    console.log('   → Sistema: ✅ Janela ideal atingida');
    console.log('   → Ação: Enviar mensagem de 30min\n');
    
    console.log('📅 Cenário 3: Paciente aguarda 38 minutos');
    console.log('   → Sistema: ✅ Ainda dentro da janela');
    console.log('   → Ação: Enviar mensagem de 30min\n');
    
    console.log('📅 Cenário 4: Paciente aguarda 45 minutos');
    console.log('   → Sistema: ❌ Janela perdida (evitar spam)');
    console.log('   → Ação: Aguardar mensagem de fim de dia (18h)\n');
    
    console.log('📅 Cenário 5: Paciente aguarda 60 minutos');
    console.log('   → Sistema: ❌ Muito tarde (evitar spam)');
    console.log('   → Ação: Aguardar mensagem de fim de dia (18h)\n');
  }

  /**
   * Mostra benefícios da prevenção de spam
   */
  showSpamPreventionBenefits() {
    console.log('\n🛡️ BENEFÍCIOS DA PREVENÇÃO DE SPAM:\n');
    
    console.log('✅ Evita múltiplas mensagens para o mesmo paciente');
    console.log('✅ Reduz ruído e melhora experiência do usuário');
    console.log('✅ Otimiza uso da API CAM Krolik');
    console.log('✅ Mantém profissionalismo da comunicação');
    console.log('✅ Janela de 10 minutos garante timing ideal');
    console.log('✅ Pacientes ainda recebem mensagem de fim de dia');
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    try {
      await this.test30MinuteEligibility();
      this.demonstrateScenarios();
      this.showSpamPreventionBenefits();
      
      console.log('\n🎉 Teste de prevenção de spam concluído!');
      
    } catch (error) {
      console.error('\n❌ Erro durante os testes:', error.message);
    }
  }
}

// Executar se chamado diretamente
async function main() {
  const tester = new SpamPreventionTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SpamPreventionTester };
