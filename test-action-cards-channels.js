#!/usr/bin/env node

/**
 * Script de teste para envio de cartões de ações através de todos os canais
 * Testa os cartões configurados para 30 minutos e fim de expediente
 */

const axios = require('axios');

// Configuração
const TEST_PHONE = '5519995068303';
const TEST_CONTACT_ID = 'test_contact_' + Date.now(); // ID temporário para teste

// Cartões configurados no sistema
const ACTION_CARDS = {
  THIRTY_MIN: '68d2f410506558bc378e840c',  // Cartão de 30 minutos
  END_DAY: '68d2f43502376b8f3df8a088'      // Cartão de fim de expediente
};

// Canais configurados
const CHANNELS = [
  {
    id: 'anexo1-estoque',
    name: 'ANEXO 1 - ESTOQUE',
    token: '66180b4e5852dcf886a0ffd0'
  },
  {
    id: 'whatsapp-oficial',
    name: 'WHATSAPP OFICIAL',
    token: '65f06d5b867543e1d094fa0f'
  },
  {
    id: 'confirmacao1',
    name: 'CONFIRMAÇÃO 1',
    token: '6848611846467bfb329de619'
  },
  {
    id: 'confirmacao2-ti',
    name: 'CONFIRMAÇÃO 2 - TI',
    token: '68486231df08d48001f8951d'
  },
  {
    id: 'confirmacao3-carla',
    name: 'CONFIRMAÇÃO 3 - CARLA',
    token: '6878f61667716e87a4ca2fbd'
  }
];

class ActionCardChannelTester {
  constructor() {
    this.results = [];
    this.apiBaseUrl = 'https://api.camkrolik.com.br';
  }

  /**
   * Testa envio de cartão de ação através de um canal específico
   */
  async testActionCardOnChannel(channel, actionCardId, cardType) {
    try {
      console.log(`\n📤 Testando ${cardType} no canal ${channel.name}...`);
      
      const payload = {
        number: TEST_PHONE,
        contactId: TEST_CONTACT_ID,
        action_card_id: actionCardId,
        forceSend: true
      };

      console.log(`📋 Payload:`, JSON.stringify(payload, null, 2));
      console.log(`🔑 Token: ${channel.token.substring(0, 8)}...`);

      const response = await axios.post(
        `${this.apiBaseUrl}/core/v2/api/chats/send-action-card`,
        payload,
        {
          headers: {
            'accept': 'application/json',
            'access-token': channel.token,
            'Content-Type': 'application/json-patch+json'
          },
          timeout: 10000
        }
      );

      const result = {
        channel: channel.name,
        channelId: channel.id,
        cardType: cardType,
        actionCardId: actionCardId,
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
   * Testa cartão de 30 minutos em todos os canais
   */
  async testThirtyMinCard() {
    console.log('\n🕐 ===========================================');
    console.log('   TESTE: CARTÃO DE 30 MINUTOS');
    console.log('===========================================');
    console.log(`📱 Telefone: ${TEST_PHONE}`);
    console.log(`📋 Cartão: ${ACTION_CARDS.THIRTY_MIN}`);
    console.log('===========================================\n');

    const results = [];
    
    for (const channel of CHANNELS) {
      const result = await this.testActionCardOnChannel(
        channel, 
        ACTION_CARDS.THIRTY_MIN, 
        '30min'
      );
      results.push(result);
      
      // Delay entre testes para evitar rate limiting
      await this.delay(2000);
    }

    return results;
  }

  /**
   * Testa cartão de fim de expediente em todos os canais
   */
  async testEndDayCard() {
    console.log('\n🌅 ===========================================');
    console.log('   TESTE: CARTÃO DE FIM DE EXPEDIENTE');
    console.log('===========================================');
    console.log(`📱 Telefone: ${TEST_PHONE}`);
    console.log(`📋 Cartão: ${ACTION_CARDS.END_DAY}`);
    console.log('===========================================\n');

    const results = [];
    
    for (const channel of CHANNELS) {
      const result = await this.testActionCardOnChannel(
        channel, 
        ACTION_CARDS.END_DAY, 
        'end_of_day'
      );
      results.push(result);
      
      // Delay entre testes para evitar rate limiting
      await this.delay(2000);
    }

    return results;
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    try {
      console.log('🚀 ===========================================');
      console.log('   TESTE DE CARTÕES DE AÇÃO POR CANAL');
      console.log('===========================================');
      console.log(`📱 Telefone de teste: ${TEST_PHONE}`);
      console.log(`📋 Contact ID temporário: ${TEST_CONTACT_ID}`);
      console.log(`📊 Total de canais: ${CHANNELS.length}`);
      console.log(`📋 Total de cartões: 2 (30min + fim de dia)`);
      console.log('===========================================\n');

      // Teste 1: Cartão de 30 minutos
      const thirtyMinResults = await this.testThirtyMinCard();
      
      // Delay entre tipos de teste
      await this.delay(3000);
      
      // Teste 2: Cartão de fim de expediente
      const endDayResults = await this.testEndDayCard();

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
    console.log('   RESUMO DOS TESTES');
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

    // Detalhes por tipo de cartão
    console.log('\n📋 Detalhes por tipo de cartão:');
    const thirtyMinResults = this.results.filter(r => r.cardType === '30min');
    const endDayResults = this.results.filter(r => r.cardType === 'end_of_day');

    console.log(`\n🕐 Cartão de 30 minutos:`);
    console.log(`   ✅ Sucessos: ${thirtyMinResults.filter(r => r.success).length}`);
    console.log(`   ❌ Erros: ${thirtyMinResults.filter(r => !r.success).length}`);

    console.log(`\n🌅 Cartão de fim de expediente:`);
    console.log(`   ✅ Sucessos: ${endDayResults.filter(r => r.success).length}`);
    console.log(`   ❌ Erros: ${endDayResults.filter(r => !r.success).length}`);

    console.log('\n===========================================');
    
    if (errorCount === 0) {
      console.log('🎉 Todos os testes passaram com sucesso!');
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
      const filename = `test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      
      const data = {
        testInfo: {
          phone: TEST_PHONE,
          contactId: TEST_CONTACT_ID,
          timestamp: new Date().toISOString(),
          totalTests: this.results.length
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
  const tester = new ActionCardChannelTester();
  
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

module.exports = { ActionCardChannelTester };
