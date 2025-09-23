#!/usr/bin/env node

/**
 * Teste de envio de mensagem para o Felipe
 */

const dotenv = require('dotenv');
const axios = require('axios');

// Carregar variáveis de ambiente
dotenv.config();

class TestEnvioFelipe {
  constructor() {
    this.felipe = {
      id: "68d31f434d52e1608c4f30e2",
      name: "Felipe",
      phone: "5519995068303",
      sectorId: "65eb5a52973bd0cedb33df0d",
      sectorName: "Outros",
      channelId: "65f06d5b867543e1d094fa0f",
      channelType: "WhatsApp Business (Principal)"
    };
    
    this.token = process.env.TOKEN_ANEXO1_ESTOQUE;
    this.actionCard30Min = "68d2f410506558bc378e840c";
  }

  async executarTeste() {
    console.log('🔍 ===========================================');
    console.log('   TESTE DE ENVIO PARA FELIPE');
    console.log('===========================================');
    console.log(`👤 Paciente: ${this.felipe.name} (${this.felipe.phone})`);
    console.log(`📱 Canal: ${this.felipe.channelType}`);
    console.log(`🔑 Token: ${this.token ? this.token.substring(0, 10) + '...' : 'NÃO DEFINIDO'}`);
    console.log(`📋 Action Card: ${this.actionCard30Min}`);
    console.log(`⏰ Teste em: ${new Date().toLocaleString('pt-BR')}`);
    console.log('===========================================\n');

    try {
      // 1. Verificar configuração
      if (!this.token) {
        throw new Error('Token não encontrado no ambiente');
      }

      // 2. Preparar payload
      const payload = await this.prepararPayload();
      
      // 3. Enviar mensagem
      await this.enviarMensagem(payload);
      
      // 4. Verificar resultado
      console.log('\n✅ Teste concluído com sucesso!');

    } catch (error) {
      console.error('❌ Erro no teste:', error.message);
      if (error.response) {
        console.error('📋 Resposta da API:', error.response.data);
        console.error('📊 Status:', error.response.status);
      }
    }
  }

  async prepararPayload() {
    console.log('📋 Preparando payload...');
    
    const payload = {
      number: this.felipe.phone,
      action_card_id: this.actionCard30Min,
      forceSend: true
    };
    
    console.log('✅ Payload preparado:');
    console.log(`   📱 Número: ${payload.number}`);
    console.log(`   📋 Action Card: ${payload.action_card_id}`);
    console.log(`   🚀 Force Send: ${payload.forceSend}`);
    
    return payload;
  }

  async enviarMensagem(payload) {
    console.log('\n📤 Enviando mensagem...');
    
    const url = 'https://api.camkrolik.com.br/core/v2/api/chats/send-action-card';
    
    const headers = {
      'Content-Type': 'application/json',
      'access-token': this.token
    };
    
    console.log(`🌐 URL: ${url}`);
    console.log(`🔑 Token: ${this.token.substring(0, 10)}...`);
    
    try {
      const response = await axios.post(url, payload, { headers });
      
      console.log('✅ Mensagem enviada com sucesso!');
      console.log('📋 Resposta da API:');
      console.log(JSON.stringify(response.data, null, 2));
      
      return response.data;
      
    } catch (error) {
      console.log('❌ Erro ao enviar mensagem:');
      
      if (error.response) {
        console.log(`📊 Status: ${error.response.status}`);
        console.log(`📋 Dados: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.log(`💥 Erro: ${error.message}`);
      }
      
      throw error;
    }
  }
}

// Executar teste
async function main() {
  const teste = new TestEnvioFelipe();
  await teste.executarTeste();
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { TestEnvioFelipe };
