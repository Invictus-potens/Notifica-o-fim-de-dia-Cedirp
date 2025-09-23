#!/usr/bin/env node

/**
 * Script de teste para verificar se as mudanças na produção estão funcionando
 * Testa o envio sem contactId usando o sistema atualizado
 */

const axios = require('axios');

// Configuração
const TEST_PHONE = '5519995068303';
const API_BASE_URL = 'http://localhost:3000';

// Cartões configurados no sistema
const ACTION_CARDS = {
  THIRTY_MIN: '68d2f410506558bc378e840c',  // Cartão de 30 minutos
  END_DAY: '68d2f43502376b8f3df8a088'      // Cartão de fim de expediente
};

// Canais configurados
const CHANNELS = [
  {
    id: 'anexo1-estoque',
    name: 'ANEXO 1 - ESTOQUE'
  },
  {
    id: 'whatsapp-oficial',
    name: 'WHATSAPP OFICIAL'
  },
  {
    id: 'confirmacao1',
    name: 'CONFIRMAÇÃO 1'
  },
  {
    id: 'confirmacao2-ti',
    name: 'CONFIRMAÇÃO 2 - TI'
  },
  {
    id: 'confirmacao3-carla',
    name: 'CONFIRMAÇÃO 3 - CARLA'
  }
];

class ProductionChangesTester {
  constructor() {
    this.results = [];
  }

  /**
   * Testa envio via API interna (sem contactId)
   */
  async testInternalAPI(channel, actionCardId, cardType) {
    try {
      console.log(`\n📤 Testando ${cardType} via API interna (${channel.name})...`);
      
      // Payload SEM contactId
      const payload = {
        patients: [
          {
            number: TEST_PHONE,
            channelId: channel.id
          }
        ],
        action_card_id: actionCardId,
        channelId: channel.id
      };

      console.log(`📋 Payload:`, JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${API_BASE_URL}/api/messages/send-action-card`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      const result = {
        channel: channel.name,
        channelId: channel.id,
        cardType: cardType,
        actionCardId: actionCardId,
        payload: payload,
        success: true,
        response: response.data,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Sucesso! Resposta:`, response.data);
      return result;

    } catch (error) {
      const result = {
        channel: channel.name,
        channelId: channel.id,
        cardType: cardType,
        actionCardId: actionCardId,
        payload: payload,
        success: false,
        error: error.message,
        status: error.response?.status,
        response: error.response?.data,
        timestamp: new Date().toISOString()
      };

      console.log(`❌ Erro:`, error.message);
      if (error.response) {
        console.log(`📋 Status: ${error.response.status}`);
        console.log(`📋 Resposta:`, error.response.data);
      }
      return result;
    }
  }

  /**
   * Testa cartão de 30 minutos via API interna
   */
  async testThirtyMinInternalAPI() {
    console.log('\n🕐 ===========================================');
    console.log('   TESTE: CARTÃO DE 30 MINUTOS (API INTERNA)');
    console.log('===========================================');
    console.log(`📱 Telefone: ${TEST_PHONE}`);
    console.log(`📋 Cartão: ${ACTION_CARDS.THIRTY_MIN}`);
    console.log(`⚠️ ContactId: NÃO INCLUÍDO`);
    console.log('===========================================\n');

    const results = [];
    
    for (const channel of CHANNELS) {
      const result = await this.testInternalAPI(
        channel, 
        ACTION_CARDS.THIRTY_MIN, 
        '30min'
      );
      results.push(result);
      
      // Delay entre testes
      await this.delay(2000);
    }

    return results;
  }

  /**
   * Testa cartão de fim de expediente via API interna
   */
  async testEndDayInternalAPI() {
    console.log('\n🌅 ===========================================');
    console.log('   TESTE: CARTÃO DE FIM DE EXPEDIENTE (API INTERNA)');
    console.log('===========================================');
    console.log(`📱 Telefone: ${TEST_PHONE}`);
    console.log(`📋 Cartão: ${ACTION_CARDS.END_DAY}`);
    console.log(`⚠️ ContactId: NÃO INCLUÍDO`);
    console.log('===========================================\n');

    const results = [];
    
    for (const channel of CHANNELS) {
      const result = await this.testInternalAPI(
        channel, 
        ACTION_CARDS.END_DAY, 
        'end_of_day'
      );
      results.push(result);
      
      // Delay entre testes
      await this.delay(2000);
    }

    return results;
  }

  /**
   * Verifica se o servidor está rodando
   */
  async checkServerStatus() {
    try {
      console.log('🔍 Verificando status do servidor...');
      const response = await axios.get(`${API_BASE_URL}/api/status`, { timeout: 5000 });
      console.log('✅ Servidor está rodando');
      console.log(`📊 Status:`, response.data);
      return true;
    } catch (error) {
      console.log('❌ Servidor não está rodando ou não acessível');
      console.log(`💡 Execute: npm start ou node src/index.js`);
      return false;
    }
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    try {
      console.log('🚀 ===========================================');
      console.log('   TESTE DE MUDANÇAS NA PRODUÇÃO');
      console.log('===========================================');
      console.log(`📱 Telefone de teste: ${TEST_PHONE}`);
      console.log(`🌐 API Base URL: ${API_BASE_URL}`);
      console.log(`⚠️ ContactId: NÃO SERÁ USADO`);
      console.log(`📊 Total de canais: ${CHANNELS.length}`);
      console.log(`📋 Total de cartões: 2 (30min + fim de dia)`);
      console.log('===========================================\n');

      // Verificar se servidor está rodando
      const serverRunning = await this.checkServerStatus();
      if (!serverRunning) {
        throw new Error('Servidor não está rodando');
      }

      // Delay antes dos testes
      await this.delay(2000);

      // Teste 1: Cartão de 30 minutos
      const thirtyMinResults = await this.testThirtyMinInternalAPI();
      
      // Delay entre tipos de teste
      await this.delay(3000);
      
      // Teste 2: Cartão de fim de expediente
      const endDayResults = await this.testEndDayInternalAPI();

      // Consolidar resultados
      this.results = [...thirtyMinResults, ...endDayResults];

      // Exibir resumo
      this.displaySummary();

    } catch (error) {
      console.error('\n❌ Erro geral no teste:', error.message);
    }
  }

  /**
   * Exibe resumo dos resultados
   */
  displaySummary() {
    console.log('\n📊 ===========================================');
    console.log('   RESUMO DOS TESTES (PRODUÇÃO ATUALIZADA)');
    console.log('===========================================');

    const successCount = this.results.filter(r => r.success).length;
    const errorCount = this.results.filter(r => !r.success).length;

    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total: ${this.results.length}`);

    // Detalhes por canal
    console.log('\n📋 Detalhes por canal:');
    CHANNELS.forEach(channel => {
      const channelResults = this.results.filter(r => r.channelId === channel.id);
      const channelSuccess = channelResults.filter(r => r.success).length;
      const channelErrors = channelResults.filter(r => !r.success).length;
      
      console.log(`\n📞 ${channel.name}:`);
      console.log(`   ✅ Sucessos: ${channelSuccess}`);
      console.log(`   ❌ Erros: ${channelErrors}`);
      
      channelResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${result.cardType}: ${result.actionCardId}`);
        if (!result.success) {
          console.log(`      Erro: ${result.error}`);
        }
      });
    });

    console.log('\n===========================================');
    
    if (successCount > 0) {
      console.log('🎉 Mudanças na produção funcionando!');
      console.log('✅ Sistema agora aceita envio sem contactId');
    } else {
      console.log('⚠️ Alguns testes falharam. Verifique os erros acima.');
    }
    
    console.log('===========================================\n');
  }

  /**
   * Salva resultados em arquivo JSON
   */
  async saveResults() {
    try {
      const fs = require('fs').promises;
      const filename = `test-production-changes-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      
      const data = {
        testInfo: {
          phone: TEST_PHONE,
          apiBaseUrl: API_BASE_URL,
          timestamp: new Date().toISOString(),
          totalTests: this.results.length,
          testType: 'production_changes'
        },
        actionCards: ACTION_CARDS,
        channels: CHANNELS.map(c => ({ id: c.id, name: c.name })),
        results: this.results
      };

      await fs.writeFile(filename, JSON.stringify(data, null, 2));
      console.log(`💾 Resultados salvos em: ${filename}`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar resultados:', error.message);
    }
  }

  /**
   * Delay entre operações
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Executar testes
async function main() {
  const tester = new ProductionChangesTester();
  
  try {
    await tester.runAllTests();
    await tester.saveResults();
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { ProductionChangesTester };
