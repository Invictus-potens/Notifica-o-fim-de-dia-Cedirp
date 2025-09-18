const { MonitoringService } = require('../src/services/MonitoringService');
const { ErrorHandler } = require('../src/services/ErrorHandler');
const { ConfigManager } = require('../src/services/ConfigManager');

/**
 * Script de teste para demonstrar a nova lógica de fim de dia
 * TODOS os pacientes aguardando devem receber mensagem de fim de dia
 */

class EndOfDayLogicTester {
  constructor() {
    this.errorHandler = new ErrorHandler();
    this.configManager = new ConfigManager(this.errorHandler);
    this.monitoringService = new MonitoringService(this.errorHandler, this.configManager);
  }

  /**
   * Cria pacientes de teste com diferentes cenários
   */
  createTestPatients() {
    return [
      {
        id: 'patient_1',
        name: 'João Silva',
        phone: '5511999887766',
        sectorId: '64d4db384f04cb80ac059912',
        sectorName: 'Suporte Geral',
        contactId: 'contact_1',
        waitTimeMinutes: 25, // Recebeu mensagem de 30min
        channelType: 'WhatsApp Business (Principal)',
        received30MinMessage: true // Simula que já recebeu
      },
      {
        id: 'patient_2',
        name: 'Maria Santos',
        phone: '5511888776655',
        sectorId: '64d4db384f04cb80ac059912',
        sectorName: 'Suporte Geral',
        contactId: 'contact_2',
        waitTimeMinutes: 45, // Perdeu janela de 30min
        channelType: 'WhatsApp Business (Principal)',
        received30MinMessage: false
      },
      {
        id: 'patient_3',
        name: 'Pedro Costa',
        phone: '5511777665544',
        sectorId: '64d4db384f04cb80ac059912',
        sectorName: 'Suporte Geral',
        contactId: 'contact_3',
        waitTimeMinutes: 60, // Muito tempo aguardando
        channelType: 'WhatsApp Business (Principal)',
        received30MinMessage: false
      },
      {
        id: 'patient_4',
        name: 'Ana Oliveira',
        phone: '5511666554433',
        sectorId: '64d4db384f04cb80ac059912',
        sectorName: 'Suporte Geral',
        contactId: 'contact_4',
        waitTimeMinutes: 15, // Entrou recentemente
        channelType: 'WhatsApp Business (Principal)',
        received30MinMessage: false
      },
      {
        id: 'patient_5',
        name: 'Carlos Ferreira',
        phone: '5511555443322',
        sectorId: '64d4db384f04cb80ac059912',
        sectorName: 'Suporte Geral',
        contactId: 'contact_5',
        waitTimeMinutes: 90, // Muito tempo aguardando
        channelType: 'WhatsApp Business (Principal)',
        received30MinMessage: false
      }
    ];
  }

  /**
   * Simula verificação de elegibilidade para fim de dia
   */
  async simulateEndOfDayEligibility(patient) {
    try {
      // Simular verificação de elegibilidade (nova lógica)
      // 1. Verificar se é fim de dia (18h) - simulando que é 18h
      const isEndOfDay = true; // Simular fim de dia
      
      // 2. Verificar dia útil - simulando dia útil
      const isWorkingDay = true;
      
      // 3. Verificar se fluxo não está pausado - simulando fluxo ativo
      const isFlowActive = true;
      
      // 4. TODOS os pacientes aguardando são elegíveis para fim de dia
      // (removido: verificação de processamento e exclusões)
      
      return isEndOfDay && isWorkingDay && isFlowActive;
      
    } catch (error) {
      console.error('❌ Erro na verificação de elegibilidade:', error.message);
      return false;
    }
  }

  /**
   * Testa a nova lógica de fim de dia
   */
  async testEndOfDayLogic() {
    console.log('🧪 TESTE DA NOVA LÓGICA DE FIM DE DIA\n');
    console.log('📋 Regra: TODOS os pacientes aguardando devem receber mensagem de fim de dia\n');
    
    const testPatients = this.createTestPatients();
    
    console.log('📊 Pacientes de teste:');
    console.log('=====================');
    
    let eligibleCount = 0;
    
    for (const patient of testPatients) {
      console.log(`👤 ${patient.name}`);
      console.log(`   📱 Telefone: ${patient.phone}`);
      console.log(`   ⏰ Tempo de espera: ${patient.waitTimeMinutes} minutos`);
      console.log(`   📨 Recebeu 30min: ${patient.received30MinMessage ? 'Sim' : 'Não'}`);
      
      // Simular verificação de elegibilidade
      const isEligible = await this.simulateEndOfDayEligibility(patient);
      
      if (isEligible) {
        console.log(`   ✅ ELEGÍVEL para mensagem de fim de dia`);
        eligibleCount++;
      } else {
        console.log(`   ❌ Não elegível`);
      }
      
      console.log('');
    }
    
    // Resumo
    console.log('📊 RESUMO:');
    console.log(`   Total de pacientes: ${testPatients.length}`);
    console.log(`   Elegíveis para fim de dia: ${eligibleCount}`);
    console.log(`   Taxa de elegibilidade: ${((eligibleCount / testPatients.length) * 100).toFixed(1)}%`);
    
    return eligibleCount;
  }

  /**
   * Demonstra cenários de uso
   */
  demonstrateScenarios() {
    console.log('\n🎭 CENÁRIOS DE USO:\n');
    
    console.log('📅 Cenário 1: Paciente recebeu mensagem de 30min');
    console.log('   → João aguarda 25min, recebeu mensagem de 30min');
    console.log('   → Sistema: ✅ Ainda elegível para fim de dia');
    console.log('   → Ação: Enviar mensagem de fim de dia\n');
    
    console.log('📅 Cenário 2: Paciente perdeu janela de 30min');
    console.log('   → Maria aguarda 45min, não recebeu mensagem de 30min');
    console.log('   → Sistema: ✅ Elegível para fim de dia');
    console.log('   → Ação: Enviar mensagem de fim de dia\n');
    
    console.log('📅 Cenário 3: Paciente aguarda muito tempo');
    console.log('   → Pedro aguarda 60min, não recebeu mensagem de 30min');
    console.log('   → Sistema: ✅ Elegível para fim de dia');
    console.log('   → Ação: Enviar mensagem de fim de dia\n');
    
    console.log('📅 Cenário 4: Paciente entrou recentemente');
    console.log('   → Ana aguarda 15min, não recebeu mensagem de 30min');
    console.log('   → Sistema: ✅ Elegível para fim de dia');
    console.log('   → Ação: Enviar mensagem de fim de dia\n');
    
    console.log('📅 Cenário 5: Paciente aguarda muito tempo');
    console.log('   → Carlos aguarda 90min, não recebeu mensagem de 30min');
    console.log('   → Sistema: ✅ Elegível para fim de dia');
    console.log('   → Ação: Enviar mensagem de fim de dia\n');
  }

  /**
   * Mostra benefícios da nova lógica
   */
  showNewLogicBenefits() {
    console.log('\n🎯 BENEFÍCIOS DA NOVA LÓGICA:\n');
    
    console.log('✅ Garante que TODOS os pacientes recebam comunicação');
    console.log('✅ Não deixa ninguém sem informação sobre o fechamento');
    console.log('✅ Pacientes que receberam 30min ainda recebem fim de dia');
    console.log('✅ Pacientes que perderam janela de 30min não ficam sem mensagem');
    console.log('✅ Comunicação completa e abrangente');
    console.log('✅ Melhora experiência do usuário');
  }

  /**
   * Compara lógica antiga vs nova
   */
  compareLogic() {
    console.log('\n📊 COMPARAÇÃO: LÓGICA ANTIGA vs NOVA\n');
    
    console.log('🔴 LÓGICA ANTIGA:');
    console.log('   - Paciente recebe 30min → ❌ NÃO recebe fim de dia');
    console.log('   - Paciente perde 30min → ✅ Recebe fim de dia');
    console.log('   - Resultado: Alguns pacientes ficam sem comunicação\n');
    
    console.log('🟢 LÓGICA NOVA:');
    console.log('   - Paciente recebe 30min → ✅ Recebe fim de dia também');
    console.log('   - Paciente perde 30min → ✅ Recebe fim de dia');
    console.log('   - Resultado: TODOS os pacientes recebem comunicação');
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    try {
      await this.testEndOfDayLogic();
      this.demonstrateScenarios();
      this.showNewLogicBenefits();
      this.compareLogic();
      
      console.log('\n🎉 Teste da nova lógica de fim de dia concluído!');
      
    } catch (error) {
      console.error('\n❌ Erro durante os testes:', error.message);
    }
  }
}

// Executar se chamado diretamente
async function main() {
  const tester = new EndOfDayLogicTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { EndOfDayLogicTester };
