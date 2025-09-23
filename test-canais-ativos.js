#!/usr/bin/env node

/**
 * Teste para verificar se os canais estão sendo detectados corretamente
 */

const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

class TestCanaisAtivos {
  constructor() {
    this.configPath = 'data/system_config.json';
  }

  async executarTeste() {
    console.log('🔍 ===========================================');
    console.log('   TESTE DE CANAIS ATIVOS');
    console.log('===========================================');
    console.log(`⏰ Teste em: ${new Date().toLocaleString('pt-BR')}`);
    console.log('===========================================\n');

    try {
      // 1. Verificar configuração
      await this.verificarConfiguracao();
      
      // 2. Simular carregamento de canais
      await this.simularCarregamentoCanais();
      
      // 3. Verificar tokens de ambiente
      await this.verificarTokensAmbiente();
      
      // 4. Testar seleção de canal
      await this.testarSelecaoCanal();

    } catch (error) {
      console.error('❌ Erro no teste:', error.message);
    }
  }

  async verificarConfiguracao() {
    console.log('📋 Verificando configuração de canais...');
    
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (!config.channels) {
        console.log('❌ Configuração de canais não encontrada');
        return false;
      }
      
      console.log(`✅ Configuração de canais encontrada: ${config.channels.length} canal(is)`);
      
      config.channels.forEach((channel, index) => {
        console.log(`\n📱 Canal ${index + 1}:`);
        console.log(`   ID: ${channel.id}`);
        console.log(`   Nome: ${channel.name}`);
        console.log(`   Tipo: ${channel.type}`);
        console.log(`   Token: ${channel.token}`);
        console.log(`   Habilitado: ${channel.enabled}`);
        console.log(`   Carga máxima: ${channel.maxLoad}`);
        console.log(`   Departamentos: ${channel.departments ? channel.departments.length : 0}`);
      });
      
      return true;
      
    } catch (error) {
      console.log('❌ Erro ao ler configuração:', error.message);
      return false;
    }
  }

  async simularCarregamentoCanais() {
    console.log('\n🔄 Simulando carregamento de canais...');
    
    try {
      // Simular a lógica do ChannelManager
      const configData = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (!config.channels) {
        console.log('❌ Nenhum canal configurado');
        return [];
      }
      
      const canaisAtivos = [];
      
      for (const channelConfig of config.channels) {
        if (!channelConfig.enabled) {
          console.log(`⏸️ Canal ${channelConfig.name} está desabilitado`);
          continue;
        }
        
        // Verificar se o token existe no ambiente
        const tokenValue = process.env[channelConfig.token];
        
        if (!tokenValue) {
          console.log(`❌ Token ${channelConfig.token} não encontrado no ambiente`);
          continue;
        }
        
        console.log(`✅ Canal ${channelConfig.name} ativo (token: ${tokenValue.substring(0, 10)}...)`);
        
        canaisAtivos.push({
          ...channelConfig,
          tokenValue: tokenValue
        });
      }
      
      console.log(`\n📊 Resultado: ${canaisAtivos.length} canal(is) ativo(s)`);
      
      if (canaisAtivos.length === 0) {
        console.log('❌ NENHUM CANAL ATIVO DISPONÍVEL');
      } else {
        console.log('✅ Canais ativos detectados com sucesso!');
      }
      
      return canaisAtivos;
      
    } catch (error) {
      console.log('❌ Erro na simulação:', error.message);
      return [];
    }
  }

  async verificarTokensAmbiente() {
    console.log('\n🔑 Verificando tokens de ambiente...');
    
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (!config.channels) {
        console.log('❌ Nenhum canal configurado para verificar tokens');
        return;
      }
      
      for (const channel of config.channels) {
        const tokenValue = process.env[channel.token];
        
        console.log(`📱 ${channel.name}:`);
        console.log(`   Token configurado: ${channel.token}`);
        console.log(`   Valor no ambiente: ${tokenValue ? '✅ DEFINIDO' : '❌ NÃO DEFINIDO'}`);
        
        if (tokenValue) {
          console.log(`   Valor: ${tokenValue.substring(0, 10)}...${tokenValue.substring(tokenValue.length - 4)}`);
        }
      }
      
    } catch (error) {
      console.log('❌ Erro ao verificar tokens:', error.message);
    }
  }

  async testarSelecaoCanal() {
    console.log('\n🎯 Testando seleção de canal...');
    
    try {
      // Simular dados do Felipe
      const felipe = {
        id: "68d31f434d52e1608c4f30e2",
        name: "Felipe",
        phone: "5519995068303",
        sectorId: "65eb5a52973bd0cedb33df0d",
        sectorName: "Outros",
        channelId: "65f06d5b867543e1d094fa0f",
        channelType: "WhatsApp Business (Principal)"
      };
      
      console.log(`👤 Testando com paciente: ${felipe.name} (${felipe.phone})`);
      console.log(`🏥 Setor: ${felipe.sectorName} (${felipe.sectorId})`);
      console.log(`📱 Canal atual: ${felipe.channelType} (${felipe.channelId})`);
      
      // Simular a lógica do MultiChannelManager
      const configData = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (!config.channels) {
        console.log('❌ Nenhum canal configurado para seleção');
        return null;
      }
      
      // Encontrar canal compatível
      const canalCompativel = config.channels.find(channel => 
        channel.enabled && 
        channel.departments && 
        channel.departments.includes(felipe.sectorId)
      );
      
      if (!canalCompativel) {
        console.log('❌ Nenhum canal compatível encontrado para o setor do Felipe');
        return null;
      }
      
      console.log(`✅ Canal compatível encontrado: ${canalCompativel.name}`);
      
      // Verificar token
      const tokenValue = process.env[canalCompativel.token];
      if (!tokenValue) {
        console.log(`❌ Token ${canalCompativel.token} não disponível`);
        return null;
      }
      
      console.log(`✅ Token disponível: ${tokenValue.substring(0, 10)}...`);
      console.log(`🎯 Canal selecionado com sucesso para Felipe!`);
      
      return canalCompativel;
      
    } catch (error) {
      console.log('❌ Erro no teste de seleção:', error.message);
      return null;
    }
  }
}

// Executar teste
async function main() {
  const teste = new TestCanaisAtivos();
  await teste.executarTeste();
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { TestCanaisAtivos };
