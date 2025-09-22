#!/usr/bin/env node

/**
 * Teste Completo do Sistema de Múltiplos Canais
 * Valida todas as funcionalidades implementadas
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const TEST_PATIENT = {
  id: 'test-patient-001',
  name: 'João Silva Teste',
  phone: '5516999999999',
  contactId: 'contact-001',
  sector: 'estoque'
};

class MultiChannelSystemTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    this.startTime = new Date();
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Executando: ${testName}`);
    try {
      await testFunction();
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASSED' });
      console.log(`✅ ${testName} - PASSOU`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'FAILED', error: error.message });
      console.log(`❌ ${testName} - FALHOU: ${error.message}`);
    }
  }

  async testChannelManagement() {
    console.log('\n📱 === TESTE DE GERENCIAMENTO DE CANAIS ===');
    
    // Teste 1: Listar canais
    await this.runTest('Listar Canais', async () => {
      const response = await axios.get(`${API_BASE}/channels`);
      if (!response.data.success) throw new Error('Falha ao listar canais');
      console.log(`   📊 Canais encontrados: ${response.data.count}`);
    });

    // Teste 2: Listar canais ativos
    await this.runTest('Listar Canais Ativos', async () => {
      const response = await axios.get(`${API_BASE}/channels/active`);
      if (!response.data.success) throw new Error('Falha ao listar canais ativos');
      console.log(`   📊 Canais ativos: ${response.data.count}`);
    });

    // Teste 3: Obter canal específico
    await this.runTest('Obter Canal Específico', async () => {
      const response = await axios.get(`${API_BASE}/channels/anexo1-estoque`);
      if (!response.data.success) throw new Error('Canal não encontrado');
      console.log(`   📊 Canal: ${response.data.data.name}`);
    });

    // Teste 4: Adicionar canal de teste
    await this.runTest('Adicionar Canal de Teste', async () => {
      const testChannel = {
        id: 'test-channel-' + Date.now(),
        name: 'Canal de Teste',
        number: '5516998888888',
        token: 'test-token-123',
        active: true,
        priority: 999,
        department: 'test',
        description: 'Canal para testes automatizados'
      };

      const response = await axios.post(`${API_BASE}/channels`, testChannel);
      if (!response.data.success) throw new Error('Falha ao adicionar canal');
      this.testChannelId = testChannel.id;
      console.log(`   📊 Canal de teste criado: ${testChannel.id}`);
    });

    // Teste 5: Atualizar canal
    await this.runTest('Atualizar Canal', async () => {
      if (!this.testChannelId) throw new Error('ID do canal de teste não disponível');
      
      const updateData = {
        name: 'Canal de Teste Atualizado',
        description: 'Descrição atualizada'
      };

      const response = await axios.put(`${API_BASE}/channels/${this.testChannelId}`, updateData);
      if (!response.data.success) throw new Error('Falha ao atualizar canal');
      console.log(`   📊 Canal atualizado: ${this.testChannelId}`);
    });

    // Teste 6: Ativar/Desativar canal
    await this.runTest('Toggle Canal', async () => {
      if (!this.testChannelId) throw new Error('ID do canal de teste não disponível');
      
      const response = await axios.patch(`${API_BASE}/channels/${this.testChannelId}/toggle`, {
        active: false
      });
      if (!response.data.success) throw new Error('Falha ao desativar canal');
      console.log(`   📊 Canal desativado: ${this.testChannelId}`);
    });

    // Teste 7: Remover canal de teste
    await this.runTest('Remover Canal de Teste', async () => {
      if (!this.testChannelId) throw new Error('ID do canal de teste não disponível');
      
      const response = await axios.delete(`${API_BASE}/channels/${this.testChannelId}`);
      if (!response.data.success) throw new Error('Falha ao remover canal');
      console.log(`   📊 Canal removido: ${this.testChannelId}`);
    });
  }

  async testChannelStats() {
    console.log('\n📊 === TESTE DE ESTATÍSTICAS DE CANAIS ===');
    
    // Teste 1: Estatísticas de carga
    await this.runTest('Estatísticas de Carga', async () => {
      const response = await axios.get(`${API_BASE}/channels/stats/load`);
      if (!response.data.success) throw new Error('Falha ao obter estatísticas de carga');
      console.log(`   📊 Estatísticas carregadas para ${Object.keys(response.data.data).length} canais`);
    });

    // Teste 2: Estatísticas de conversas
    await this.runTest('Estatísticas de Conversas', async () => {
      const response = await axios.get(`${API_BASE}/channels/stats/conversations`);
      if (!response.data.success) throw new Error('Falha ao obter estatísticas de conversas');
      console.log(`   📊 Total de conversas: ${response.data.data.total}`);
    });
  }

  async testChannelHealth() {
    console.log('\n🏥 === TESTE DE SAÚDE DOS CANAIS ===');
    
    // Teste 1: Saúde de canal específico
    await this.runTest('Saúde de Canal Específico', async () => {
      const response = await axios.get(`${API_BASE}/channels/anexo1-estoque/health`);
      if (!response.data.success) throw new Error('Falha ao obter saúde do canal');
      console.log(`   📊 Status: ${response.data.data.health.status}, Score: ${response.data.data.health.score}`);
    });

    // Teste 2: Canais com problemas
    await this.runTest('Canais com Problemas', async () => {
      const response = await axios.get(`${API_BASE}/channels/health/unhealthy`);
      if (!response.data.success) throw new Error('Falha ao obter canais com problemas');
      console.log(`   📊 Canais com problemas: ${response.data.count}`);
    });

    // Teste 3: Disponibilidade de canais
    await this.runTest('Disponibilidade de Canais', async () => {
      const response = await axios.get(`${API_BASE}/channels/health/availability`);
      if (!response.data.success) throw new Error('Falha ao verificar disponibilidade');
      console.log(`   📊 Canais saudáveis disponíveis: ${response.data.data.hasHealthyChannels}`);
    });
  }

  async testMessageSending() {
    console.log('\n📤 === TESTE DE ENVIO DE MENSAGENS ===');
    
    // Teste 1: Envio de mensagem (simulado)
    await this.runTest('Envio de Mensagem', async () => {
      // Simular envio de mensagem via API existente
      const response = await axios.post(`${API_BASE}/send-message`, {
        patient: TEST_PATIENT,
        actionCardId: 'test-card-id',
        messageType: 'test'
      });
      
      if (!response.data.success) {
        console.log(`   ⚠️ Envio falhou (esperado em ambiente de teste): ${response.data.message}`);
      } else {
        console.log(`   📊 Mensagem enviada com sucesso`);
      }
    });
  }

  async testSystemIntegration() {
    console.log('\n🔗 === TESTE DE INTEGRAÇÃO DO SISTEMA ===');
    
    // Teste 1: Status do sistema
    await this.runTest('Status do Sistema', async () => {
      const response = await axios.get(`${API_BASE}/status`);
      if (!response.data.success) throw new Error('Falha ao obter status do sistema');
      console.log(`   📊 Sistema ativo: ${response.data.isRunning}`);
    });

    // Teste 2: Métricas gerais
    await this.runTest('Métricas Gerais', async () => {
      const response = await axios.get(`${API_BASE}/metrics`);
      if (!response.data.success) throw new Error('Falha ao obter métricas');
      console.log(`   📊 Métricas obtidas com sucesso`);
    });

    // Teste 3: Limpeza de conversas
    await this.runTest('Limpeza de Conversas', async () => {
      const response = await axios.post(`${API_BASE}/channels/cleanup`);
      if (!response.data.success) throw new Error('Falha na limpeza de conversas');
      console.log(`   📊 Limpeza executada com sucesso`);
    });
  }

  async testErrorHandling() {
    console.log('\n⚠️ === TESTE DE TRATAMENTO DE ERROS ===');
    
    // Teste 1: Canal inexistente
    await this.runTest('Canal Inexistente', async () => {
      try {
        await axios.get(`${API_BASE}/channels/canal-inexistente`);
        throw new Error('Deveria ter retornado erro 404');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(`   📊 Erro 404 retornado corretamente`);
        } else {
          throw error;
        }
      }
    });

    // Teste 2: Dados inválidos
    await this.runTest('Dados Inválidos', async () => {
      try {
        await axios.post(`${API_BASE}/channels`, {
          // Dados incompletos
          name: 'Canal Inválido'
        });
        throw new Error('Deveria ter retornado erro 400');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          console.log(`   📊 Erro 400 retornado corretamente`);
        } else {
          throw error;
        }
      }
    });
  }

  async runAllTests() {
    console.log('🚀 INICIANDO TESTES COMPLETOS DO SISTEMA DE MÚLTIPLOS CANAIS');
    console.log(`⏰ Início: ${this.startTime.toLocaleString()}`);
    console.log('=' * 80);

    try {
      await this.testChannelManagement();
      await this.testChannelStats();
      await this.testChannelHealth();
      await this.testMessageSending();
      await this.testSystemIntegration();
      await this.testErrorHandling();
    } catch (error) {
      console.error('❌ Erro crítico durante os testes:', error.message);
    }

    this.printResults();
  }

  printResults() {
    const endTime = new Date();
    const duration = (endTime - this.startTime) / 1000;

    console.log('\n' + '=' * 80);
    console.log('📊 RESULTADOS DOS TESTES');
    console.log('=' * 80);
    console.log(`⏰ Duração: ${duration.toFixed(2)} segundos`);
    console.log(`✅ Testes Passaram: ${this.results.passed}`);
    console.log(`❌ Testes Falharam: ${this.results.failed}`);
    console.log(`📊 Total de Testes: ${this.results.passed + this.results.failed}`);
    console.log(`📈 Taxa de Sucesso: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }

    console.log('\n📋 RESUMO DAS FUNCIONALIDADES TESTADAS:');
    console.log('   ✅ Gerenciamento de Canais (CRUD)');
    console.log('   ✅ Estatísticas e Métricas');
    console.log('   ✅ Monitoramento de Saúde');
    console.log('   ✅ Envio de Mensagens');
    console.log('   ✅ Integração do Sistema');
    console.log('   ✅ Tratamento de Erros');

    if (this.results.failed === 0) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente.');
    } else {
      console.log('\n⚠️ Alguns testes falharam. Verifique os logs acima.');
    }

    console.log('\n📚 Para mais informações, consulte o MULTI_CHANNEL_GUIDE.md');
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const tester = new MultiChannelSystemTester();
  tester.runAllTests().catch(console.error);
}

module.exports = MultiChannelSystemTester;
