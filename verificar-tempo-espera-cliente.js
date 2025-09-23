#!/usr/bin/env node

/**
 * Script para verificar se o tempo de espera está seguindo a configuração do cliente
 */

const fs = require('fs').promises;
const path = require('path');

class VerificadorTempoEspera {
  constructor() {
    this.dataDir = 'data';
    this.configPath = path.join(this.dataDir, 'system_config.json');
    this.patientsPath = path.join(this.dataDir, 'patients_active.json');
  }

  /**
   * Executa verificação completa
   */
  async executarVerificacao() {
    try {
      console.log('⏰ ===========================================');
      console.log('   VERIFICAÇÃO DE TEMPO DE ESPERA');
      console.log('===========================================');
      console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
      console.log('===========================================\n');

      // 1. Verificar configuração atual
      const config = await this.verificarConfiguracao();
      
      // 2. Verificar pacientes ativos
      const pacientes = await this.verificarPacientes();
      
      // 3. Analisar elegibilidade
      await this.analisarElegibilidade(config, pacientes);
      
      // 4. Verificar conflitos de configuração
      await this.verificarConflitos(config);

    } catch (error) {
      console.error('❌ Erro na verificação:', error.message);
    }
  }

  /**
   * Verifica configuração atual
   */
  async verificarConfiguracao() {
    console.log('📋 Verificando configuração atual...');
    
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      const tempoConfig = {
        minWaitTime: parseInt(config.minWaitTime) || 30,
        maxWaitTime: parseInt(config.maxWaitTime) || 40,
        flowPaused: config.flowPaused === 'true',
        ignoreBusinessHours: config.ignoreBusinessHours === 'true',
        refreshInterval: parseInt(config.refreshInterval) || 60
      };

      console.log('✅ Configuração carregada:');
      console.log(`   📊 Tempo mínimo de espera: ${tempoConfig.minWaitTime} minutos`);
      console.log(`   📊 Tempo máximo de espera: ${tempoConfig.maxWaitTime} minutos`);
      console.log(`   📊 Fluxo pausado: ${tempoConfig.flowPaused}`);
      console.log(`   📊 Ignorar horário comercial: ${tempoConfig.ignoreBusinessHours}`);
      console.log(`   📊 Intervalo de verificação: ${tempoConfig.refreshInterval} segundos`);

      return tempoConfig;

    } catch (error) {
      console.log('❌ Erro ao carregar configuração:', error.message);
      throw error;
    }
  }

  /**
   * Verifica pacientes ativos
   */
  async verificarPacientes() {
    console.log('\n👥 Verificando pacientes ativos...');
    
    try {
      const pacientesData = await fs.readFile(this.patientsPath, 'utf8');
      const pacientes = JSON.parse(pacientesData);
      
      console.log(`📊 Total de pacientes ativos: ${pacientes.length}`);
      
      if (pacientes.length === 0) {
        console.log('⚠️ Nenhum paciente ativo encontrado');
        return [];
      }

      // Calcular tempo de espera atual para cada paciente
      const agora = new Date();
      const pacientesComTempo = pacientes.map(paciente => {
        if (!paciente.waitStartTime) {
          return { ...paciente, waitTimeMinutes: 0, waitTimeCalculated: false };
        }
        
        const waitStart = new Date(paciente.waitStartTime);
        const waitTimeMinutes = Math.floor((agora - waitStart) / (1000 * 60));
        
        return { 
          ...paciente, 
          waitTimeMinutes, 
          waitTimeCalculated: true,
          waitStartFormatted: waitStart.toLocaleString('pt-BR')
        };
      });

      // Estatísticas de tempo de espera
      const pacientesComTempo_valido = pacientesComTempo.filter(p => p.waitTimeCalculated);
      const temposEspera = pacientesComTempo_valido.map(p => p.waitTimeMinutes);
      
      if (temposEspera.length > 0) {
        const tempoMinimo = Math.min(...temposEspera);
        const tempoMaximo = Math.max(...temposEspera);
        const tempoMedio = Math.round(temposEspera.reduce((a, b) => a + b, 0) / temposEspera.length);
        
        console.log(`📊 Estatísticas de tempo de espera:`);
        console.log(`   ⏱️ Tempo mínimo: ${tempoMinimo} minutos`);
        console.log(`   ⏱️ Tempo máximo: ${tempoMaximo} minutos`);
        console.log(`   ⏱️ Tempo médio: ${tempoMedio} minutos`);
      }

      return pacientesComTempo;

    } catch (error) {
      console.log('❌ Erro ao carregar pacientes:', error.message);
      return [];
    }
  }

  /**
   * Analisa elegibilidade dos pacientes
   */
  async analisarElegibilidade(config, pacientes) {
    console.log('\n🎯 Analisando elegibilidade dos pacientes...');
    
    if (pacientes.length === 0) {
      console.log('⚠️ Nenhum paciente para analisar');
      return;
    }

    const agora = new Date();
    const horaAtual = agora.getHours();
    const isBusinessHours = horaAtual >= 8 && horaAtual < 18;
    const isWorkingDay = agora.getDay() >= 1 && agora.getDay() <= 5;

    let elegiveisParaMensagem = 0;
    let foraDaJanela = 0;
    let semTempoEspera = 0;
    let jaProcessados = 0;

    console.log(`📊 Critérios de elegibilidade:`);
    console.log(`   ⏰ Tempo mínimo: ${config.minWaitTime} min`);
    console.log(`   ⏰ Tempo máximo: ${config.maxWaitTime} min`);
    console.log(`   🕐 Horário comercial: ${isBusinessHours ? 'SIM' : 'NÃO'}`);
    console.log(`   📅 Dia útil: ${isWorkingDay ? 'SIM' : 'NÃO'}`);
    console.log(`   ⏸️ Fluxo pausado: ${config.flowPaused ? 'SIM' : 'NÃO'}`);
    console.log(`   🌐 Ignorar horário comercial: ${config.ignoreBusinessHours ? 'SIM' : 'NÃO'}`);

    console.log(`\n📋 Análise individual dos pacientes:`);
    
    pacientes.forEach((paciente, index) => {
      if (index < 10) { // Mostrar apenas os primeiros 10 para não poluir
        const status = this.analisarElegibilidadePaciente(paciente, config, isBusinessHours, isWorkingDay);
        console.log(`   ${index + 1}. ${paciente.name || 'N/A'} (${paciente.waitTimeMinutes || 0}min) - ${status.status}`);
        if (status.motivo) {
          console.log(`      💡 ${status.motivo}`);
        }
        
        // Contadores
        if (status.elegivel) elegiveisParaMensagem++;
        else if (status.foraDaJanela) foraDaJanela++;
        else if (status.semTempo) semTempoEspera++;
        else if (status.processado) jaProcessados++;
      }
    });

    if (pacientes.length > 10) {
      console.log(`   ... e mais ${pacientes.length - 10} pacientes`);
      
      // Analisar todos para estatísticas
      pacientes.forEach(paciente => {
        const status = this.analisarElegibilidadePaciente(paciente, config, isBusinessHours, isWorkingDay);
        if (status.elegivel) elegiveisParaMensagem++;
        else if (status.foraDaJanela) foraDaJanela++;
        else if (status.semTempo) semTempoEspera++;
        else if (status.processado) jaProcessados++;
      });
    }

    console.log(`\n📊 Resumo da elegibilidade:`);
    console.log(`   ✅ Elegíveis para mensagem: ${elegiveisParaMensagem}`);
    console.log(`   ⏰ Fora da janela de tempo: ${foraDaJanela}`);
    console.log(`   ❓ Sem tempo de espera calculado: ${semTempoEspera}`);
    console.log(`   ✅ Já processados: ${jaProcessados}`);

    if (elegiveisParaMensagem === 0) {
      console.log(`\n⚠️ ATENÇÃO: Nenhum paciente elegível para mensagem!`);
      console.log(`💡 Possíveis causas:`);
      if (config.flowPaused) {
        console.log(`   - Fluxo está pausado`);
      }
      if (!config.ignoreBusinessHours && !isBusinessHours) {
        console.log(`   - Fora do horário comercial (${horaAtual}h)`);
      }
      if (!config.ignoreBusinessHours && !isWorkingDay) {
        console.log(`   - Não é dia útil`);
      }
      if (foraDaJanela > 0) {
        console.log(`   - ${foraDaJanela} pacientes fora da janela de tempo (${config.minWaitTime}-${config.maxWaitTime} min)`);
      }
    }
  }

  /**
   * Analisa elegibilidade de um paciente específico
   */
  analisarElegibilidadePaciente(paciente, config, isBusinessHours, isWorkingDay) {
    // Verificar tempo de espera
    if (!paciente.waitTimeCalculated || paciente.waitTimeMinutes === undefined) {
      return { 
        status: '❓ Sem tempo calculado', 
        elegivel: false, 
        semTempo: true,
        motivo: 'Tempo de espera não foi calculado'
      };
    }

    // Verificar se está na janela de tempo
    if (paciente.waitTimeMinutes < config.minWaitTime) {
      return { 
        status: '⏰ Muito cedo', 
        elegivel: false, 
        foraDaJanela: true,
        motivo: `Aguardando ${config.minWaitTime - paciente.waitTimeMinutes} min para atingir tempo mínimo`
      };
    }

    if (paciente.waitTimeMinutes > config.maxWaitTime) {
      return { 
        status: '⏰ Muito tarde', 
        elegivel: false, 
        foraDaJanela: true,
        motivo: `Passou ${paciente.waitTimeMinutes - config.maxWaitTime} min do tempo máximo`
      };
    }

    // Verificar fluxo pausado
    if (config.flowPaused) {
      return { 
        status: '⏸️ Fluxo pausado', 
        elegivel: false,
        motivo: 'Fluxo de mensagens está pausado'
      };
    }

    // Verificar horário comercial (se não estiver configurado para ignorar)
    if (!config.ignoreBusinessHours) {
      if (!isBusinessHours) {
        return { 
          status: '🕐 Fora do horário', 
          elegivel: false,
          motivo: 'Fora do horário comercial (8h-18h)'
        };
      }
      
      if (!isWorkingDay) {
        return { 
          status: '📅 Não é dia útil', 
          elegivel: false,
          motivo: 'Não é dia útil (seg-sex)'
        };
      }
    }

    // Se chegou até aqui, é elegível
    return { 
      status: '✅ Elegível', 
      elegivel: true,
      motivo: `Na janela de tempo (${paciente.waitTimeMinutes} min)`
    };
  }

  /**
   * Verifica conflitos de configuração
   */
  async verificarConflitos(config) {
    console.log('\n🔍 Verificando conflitos de configuração...');
    
    const conflitos = [];

    // Verificar se janela de tempo é muito pequena
    const janelaMinutos = config.maxWaitTime - config.minWaitTime;
    if (janelaMinutos < 5) {
      conflitos.push({
        tipo: 'JANELA_PEQUENA',
        problema: `Janela de tempo muito pequena: ${janelaMinutos} minutos`,
        impacto: 'Poucos pacientes serão elegíveis',
        solucao: 'Aumentar a diferença entre tempo mínimo e máximo'
      });
    }

    // Verificar se tempo mínimo é muito alto
    if (config.minWaitTime > 60) {
      conflitos.push({
        tipo: 'TEMPO_MINIMO_ALTO',
        problema: `Tempo mínimo muito alto: ${config.minWaitTime} minutos`,
        impacto: 'Pacientes aguardarão muito tempo antes de receber mensagem',
        solucao: 'Considerar reduzir o tempo mínimo'
      });
    }

    // Verificar se tempo máximo é muito baixo
    if (config.maxWaitTime < 15) {
      conflitos.push({
        tipo: 'TEMPO_MAXIMO_BAIXO',
        problema: `Tempo máximo muito baixo: ${config.maxWaitTime} minutos`,
        impacto: 'Janela de elegibilidade muito pequena',
        solucao: 'Considerar aumentar o tempo máximo'
      });
    }

    // Verificar configuração de produção vs sistema
    try {
      const productionConfigPath = 'config/production.json';
      const productionData = await fs.readFile(productionConfigPath, 'utf8');
      const productionConfig = JSON.parse(productionData);
      
      const prodMinWait = productionConfig.monitoring?.messageWindow?.minWaitMinutes;
      const prodMaxWait = productionConfig.monitoring?.messageWindow?.maxWaitMinutes;
      
      if (prodMinWait && prodMaxWait) {
        if (config.minWaitTime !== prodMinWait || config.maxWaitTime !== prodMaxWait) {
          conflitos.push({
            tipo: 'CONFLITO_PRODUCAO',
            problema: `Configuração difere da produção: Sistema(${config.minWaitTime}-${config.maxWaitTime}) vs Produção(${prodMinWait}-${prodMaxWait})`,
            impacto: 'Comportamento inconsistente',
            solucao: 'Alinhar configurações do sistema com produção'
          });
        }
      }
    } catch (error) {
      // Arquivo de produção pode não existir
    }

    if (conflitos.length === 0) {
      console.log('✅ Nenhum conflito de configuração encontrado');
    } else {
      console.log(`⚠️ ${conflitos.length} conflito(s) encontrado(s):`);
      conflitos.forEach((conflito, index) => {
        console.log(`\n${index + 1}. ${conflito.tipo}:`);
        console.log(`   📋 Problema: ${conflito.problema}`);
        console.log(`   📊 Impacto: ${conflito.impacto}`);
        console.log(`   🔧 Solução: ${conflito.solucao}`);
      });
    }

    return conflitos;
  }
}

// Executar verificação
async function main() {
  const verificador = new VerificadorTempoEspera();
  await verificador.executarVerificacao();
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { VerificadorTempoEspera };
