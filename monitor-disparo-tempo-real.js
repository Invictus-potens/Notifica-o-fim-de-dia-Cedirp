#!/usr/bin/env node

/**
 * Monitor em tempo real para acompanhar disparos de mensagens
 */

const axios = require('axios');
const fs = require('fs').promises;

class MonitorDisparoTempoReal {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3000';
    this.intervaloMonitoramento = 10000; // 10 segundos
    this.iniciado = new Date();
    this.ultimoStatus = null;
    this.ultimasMetricas = null;
    this.disparosDetectados = [];
    this.pacientesElegiveisAnterior = 0;
  }

  /**
   * Inicia monitoramento
   */
  async iniciarMonitoramento() {
    console.log('🔍 ===========================================');
    console.log('   MONITOR DE DISPARO EM TEMPO REAL');
    console.log('===========================================');
    console.log(`⏰ Iniciado em: ${this.iniciado.toLocaleString('pt-BR')}`);
    console.log(`📊 Intervalo de verificação: ${this.intervaloMonitoramento/1000}s`);
    console.log(`🎯 Aguardando disparo em aproximadamente 4 minutos...`);
    console.log('===========================================\n');

    // Verificação inicial
    await this.verificarStatus();
    
    // Iniciar monitoramento contínuo
    const intervalo = setInterval(async () => {
      try {
        await this.verificarStatus();
      } catch (error) {
        console.error(`❌ Erro no monitoramento: ${error.message}`);
      }
    }, this.intervaloMonitoramento);

    // Parar após 10 minutos
    setTimeout(() => {
      clearInterval(intervalo);
      this.finalizarMonitoramento();
    }, 10 * 60 * 1000);
  }

  /**
   * Verifica status do sistema
   */
  async verificarStatus() {
    const agora = new Date();
    const tempoDecorrido = Math.floor((agora - this.iniciado) / 1000);
    
    console.log(`\n⏰ [${agora.toLocaleTimeString('pt-BR')}] Verificação ${Math.floor(tempoDecorrido/10) + 1} (${tempoDecorrido}s)`);
    console.log('─'.repeat(50));

    try {
      // 1. Verificar status geral
      const status = await this.obterStatus();
      
      // 2. Verificar métricas
      const metricas = await this.obterMetricas();
      
      // 3. Verificar pacientes elegíveis
      const pacientes = await this.obterPacientesElegiveis();
      
      // 4. Detectar mudanças/disparos
      await this.detectarMudancas(status, metricas, pacientes);
      
      // 5. Salvar estado atual
      this.ultimoStatus = status;
      this.ultimasMetricas = metricas;

    } catch (error) {
      console.log(`❌ Erro na verificação: ${error.message}`);
    }
  }

  /**
   * Obtém status do sistema
   */
  async obterStatus() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/status`, { timeout: 5000 });
      const status = response.data;
      
      console.log(`📊 Sistema: ${status.isRunning ? '✅ Rodando' : '❌ Parado'}`);
      console.log(`📊 Fluxo: ${status.isPaused ? '⏸️ Pausado' : '▶️ Ativo'}`);
      console.log(`📊 Horário comercial: ${status.isBusinessHours ? '✅ SIM' : '❌ NÃO'}`);
      
      return status;
    } catch (error) {
      console.log(`❌ Erro ao obter status: ${error.message}`);
      return null;
    }
  }

  /**
   * Obtém métricas do sistema
   */
  async obterMetricas() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/metrics`, { timeout: 5000 });
      const metricas = response.data;
      
      console.log(`📈 Mensagens enviadas: ${metricas.messages?.sent || 0}`);
      console.log(`📈 Mensagens falharam: ${metricas.messages?.failed || 0}`);
      console.log(`📈 Pacientes ativos: ${metricas.patients?.active || 0}`);
      
      return metricas;
    } catch (error) {
      console.log(`❌ Erro ao obter métricas: ${error.message}`);
      return null;
    }
  }

  /**
   * Obtém pacientes elegíveis
   */
  async obterPacientesElegiveis() {
    try {
      // Ler arquivo de pacientes ativos
      const pacientesData = await fs.readFile('data/patients_active.json', 'utf8');
      const pacientes = JSON.parse(pacientesData);
      
      // Calcular elegibilidade baseada na configuração atual
      const configData = await fs.readFile('data/system_config.json', 'utf8');
      const config = JSON.parse(configData);
      
      const minWaitTime = parseInt(config.minWaitTime) || 12;
      const maxWaitTime = parseInt(config.maxWaitTime) || 15;
      
      const agora = new Date();
      let elegiveisCount = 0;
      let detalhesElegiveis = [];
      
      pacientes.forEach(paciente => {
        if (paciente.waitStartTime) {
          const waitStart = new Date(paciente.waitStartTime);
          const waitTimeMinutes = Math.floor((agora - waitStart) / (1000 * 60));
          
          const elegivel = waitTimeMinutes >= minWaitTime && waitTimeMinutes <= maxWaitTime;
          
          if (elegivel) {
            elegiveisCount++;
            detalhesElegiveis.push({
              nome: paciente.name || 'N/A',
              telefone: paciente.phone || 'N/A',
              tempoEspera: waitTimeMinutes,
              setor: paciente.sectorName || 'N/A'
            });
          }
        }
      });
      
      console.log(`🎯 Pacientes elegíveis: ${elegiveisCount} (janela: ${minWaitTime}-${maxWaitTime}min)`);
      
      if (elegiveisCount > 0) {
        console.log(`📋 Detalhes dos elegíveis:`);
        detalhesElegiveis.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i+1}. ${p.nome} (${p.tempoEspera}min) - ${p.setor}`);
        });
        if (detalhesElegiveis.length > 3) {
          console.log(`   ... e mais ${detalhesElegiveis.length - 3} pacientes`);
        }
      }
      
      return { total: pacientes.length, elegiveis: elegiveisCount, detalhes: detalhesElegiveis };
      
    } catch (error) {
      console.log(`❌ Erro ao obter pacientes: ${error.message}`);
      return { total: 0, elegiveis: 0, detalhes: [] };
    }
  }

  /**
   * Detecta mudanças e possíveis disparos
   */
  async detectarMudancas(status, metricas, pacientes) {
    const agora = new Date();
    
    // Detectar mudança no número de mensagens enviadas
    if (this.ultimasMetricas && metricas) {
      const mensagensAnterior = this.ultimasMetricas.messages?.sent || 0;
      const mensagensAtual = metricas.messages?.sent || 0;
      
      if (mensagensAtual > mensagensAnterior) {
        const novasMensagens = mensagensAtual - mensagensAnterior;
        console.log(`\n🚀 DISPARO DETECTADO!`);
        console.log(`📤 ${novasMensagens} nova(s) mensagem(ns) enviada(s)`);
        console.log(`📊 Total de mensagens: ${mensagensAnterior} → ${mensagensAtual}`);
        
        this.disparosDetectados.push({
          timestamp: agora,
          novasMensagens: novasMensagens,
          totalAnterior: mensagensAnterior,
          totalAtual: mensagensAtual,
          pacientesElegiveis: pacientes.elegiveis
        });
      }
    }
    
    // Detectar mudança no número de pacientes elegíveis
    if (pacientes.elegiveis !== this.pacientesElegiveisAnterior) {
      const diferenca = pacientes.elegiveis - this.pacientesElegiveisAnterior;
      if (diferenca !== 0) {
        console.log(`\n📊 MUDANÇA NA ELEGIBILIDADE:`);
        console.log(`🎯 Pacientes elegíveis: ${this.pacientesElegiveisAnterior} → ${pacientes.elegiveis} (${diferenca > 0 ? '+' : ''}${diferenca})`);
      }
      this.pacientesElegiveisAnterior = pacientes.elegiveis;
    }
    
    // Detectar mudanças no status do sistema
    if (this.ultimoStatus && status) {
      if (this.ultimoStatus.isPaused !== status.isPaused) {
        console.log(`\n⚡ MUDANÇA DE STATUS:`);
        console.log(`⏸️ Fluxo: ${this.ultimoStatus.isPaused ? 'Pausado' : 'Ativo'} → ${status.isPaused ? 'Pausado' : 'Ativo'}`);
      }
    }
    
    // Verificar próximo ciclo esperado
    const proximoCiclo = this.calcularProximoCiclo();
    if (proximoCiclo) {
      console.log(`⏰ Próximo ciclo esperado em: ${proximoCiclo}`);
    }
  }

  /**
   * Calcula quando deve ser o próximo ciclo
   */
  calcularProximoCiclo() {
    try {
      // Sistema verifica a cada 120 segundos (2 minutos)
      const agora = new Date();
      const segundosAtual = agora.getSeconds();
      const minutosAtual = agora.getMinutes();
      
      // Próximo ciclo será no próximo minuto par
      let proximoMinuto = minutosAtual;
      if (minutosAtual % 2 === 1) {
        proximoMinuto = minutosAtual + 1;
      } else {
        proximoMinuto = minutosAtual + 2;
      }
      
      const proximoCiclo = new Date(agora);
      proximoCiclo.setMinutes(proximoMinuto, 0, 0);
      
      const segundosRestantes = Math.floor((proximoCiclo - agora) / 1000);
      
      if (segundosRestantes > 0 && segundosRestantes < 300) { // Próximos 5 minutos
        return `${Math.floor(segundosRestantes / 60)}min ${segundosRestantes % 60}s`;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Finaliza monitoramento
   */
  finalizarMonitoramento() {
    const agora = new Date();
    const tempoTotal = Math.floor((agora - this.iniciado) / 1000);
    
    console.log('\n🏁 ===========================================');
    console.log('   MONITORAMENTO FINALIZADO');
    console.log('===========================================');
    console.log(`⏰ Duração total: ${Math.floor(tempoTotal/60)}min ${tempoTotal%60}s`);
    console.log(`📊 Disparos detectados: ${this.disparosDetectados.length}`);
    
    if (this.disparosDetectados.length > 0) {
      console.log('\n📤 Resumo dos disparos:');
      this.disparosDetectados.forEach((disparo, index) => {
        console.log(`   ${index + 1}. ${disparo.timestamp.toLocaleTimeString('pt-BR')} - ${disparo.novasMensagens} mensagem(ns)`);
      });
    } else {
      console.log('\n⚠️ Nenhum disparo foi detectado durante o monitoramento');
      console.log('💡 Possíveis causas:');
      console.log('   - Nenhum paciente elegível na janela de tempo');
      console.log('   - Fluxo pausado');
      console.log('   - Sistema não está rodando');
      console.log('   - Configuração de tempo inadequada');
    }
    
    console.log('===========================================\n');
    
    process.exit(0);
  }
}

// Executar monitoramento
async function main() {
  const monitor = new MonitorDisparoTempoReal();
  
  try {
    await monitor.iniciarMonitoramento();
  } catch (error) {
    console.error('❌ Erro fatal no monitoramento:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { MonitorDisparoTempoReal };
