#!/usr/bin/env node

/**
 * Script de diagnóstico para investigar falhas no envio de mensagens
 * quando atendimentos atingem tempo limite
 */

const fs = require('fs').promises;
const path = require('path');

class DiagnosticoFalhasEnvio {
  constructor() {
    this.logsDir = 'logs';
    this.dataDir = 'data';
    this.results = {
      problemasEncontrados: [],
      canaisStatus: {},
      configuracao: {},
      recomendacoes: []
    };
  }

  /**
   * Executa diagnóstico completo
   */
  async executarDiagnostico() {
    try {
      console.log('🔍 ===========================================');
      console.log('   DIAGNÓSTICO DE FALHAS NO ENVIO');
      console.log('===========================================');
      console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
      console.log('===========================================\n');

      // 1. Verificar configuração do sistema
      await this.verificarConfiguracao();
      
      // 2. Verificar status dos canais
      await this.verificarStatusCanais();
      
      // 3. Analisar logs de erro
      await this.analisarLogsErro();
      
      // 4. Verificar dados dos pacientes
      await this.verificarDadosPacientes();
      
      // 5. Verificar seleção de canais
      await this.verificarSelecaoCanais();
      
      // 6. Gerar relatório
      this.gerarRelatorio();

    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error.message);
    }
  }

  /**
   * Verifica configuração do sistema
   */
  async verificarConfiguracao() {
    console.log('📋 Verificando configuração do sistema...');
    
    try {
      // Verificar system_config.json
      const configPath = path.join(this.dataDir, 'system_config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      this.results.configuracao = {
        flowPaused: config.flowPaused === 'false' ? false : true,
        endOfDayPaused: config.endOfDayPaused === 'false' ? false : true,
        ignoreBusinessHours: config.ignoreBusinessHours === 'true' ? true : false,
        minWaitTime: config.minWaitTime,
        maxWaitTime: config.maxWaitTime,
        selectedActionCard30Min: config.selectedActionCard30Min,
        selectedActionCardEndDay: config.selectedActionCardEndDay,
        refreshInterval: config.refreshInterval
      };

      console.log('✅ Configuração carregada:');
      console.log(`   Fluxo pausado: ${this.results.configuracao.flowPaused}`);
      console.log(`   Fim de dia pausado: ${this.results.configuracao.endOfDayPaused}`);
      console.log(`   Ignorar horário comercial: ${this.results.configuracao.ignoreBusinessHours}`);
      console.log(`   Tempo mínimo de espera: ${this.results.configuracao.minWaitTime} min`);
      console.log(`   Tempo máximo de espera: ${this.results.configuracao.maxWaitTime} min`);
      console.log(`   Action Card 30min: ${this.results.configuracao.selectedActionCard30Min}`);
      console.log(`   Action Card fim de dia: ${this.results.configuracao.selectedActionCardEndDay}`);

      // Verificar problemas de configuração
      if (this.results.configuracao.flowPaused) {
        this.results.problemasEncontrados.push({
          tipo: 'CONFIGURACAO',
          problema: 'Fluxo está pausado',
          impacto: 'Nenhuma mensagem será enviada',
          solucao: 'Despausar o fluxo via interface web'
        });
      }

      if (this.results.configuracao.endOfDayPaused) {
        this.results.problemasEncontrados.push({
          tipo: 'CONFIGURACAO',
          problema: 'Mensagens de fim de dia estão pausadas',
          impacto: 'Mensagens de 18h não serão enviadas',
          solucao: 'Ativar mensagens de fim de dia via interface web'
        });
      }

      if (!this.results.configuracao.selectedActionCard30Min) {
        this.results.problemasEncontrados.push({
          tipo: 'CONFIGURACAO',
          problema: 'Action Card para 30min não configurado',
          impacto: 'Mensagens de 30min não podem ser enviadas',
          solucao: 'Configurar Action Card para mensagens de 30min'
        });
      }

    } catch (error) {
      console.log('❌ Erro ao verificar configuração:', error.message);
      this.results.problemasEncontrados.push({
        tipo: 'CONFIGURACAO',
        problema: 'Erro ao carregar configuração',
        impacto: 'Sistema pode não funcionar corretamente',
        solucao: 'Verificar arquivo system_config.json'
      });
    }
  }

  /**
   * Verifica status dos canais
   */
  async verificarStatusCanais() {
    console.log('\n📞 Verificando status dos canais...');
    
    const canais = [
      { id: 'anexo1-estoque', name: 'ANEXO 1 - ESTOQUE', token: '66180b4e5852dcf886a0ffd0' },
      { id: 'whatsapp-oficial', name: 'WHATSAPP OFICIAL', token: '65f06d5b867543e1d094fa0f' },
      { id: 'confirmacao1', name: 'CONFIRMAÇÃO 1', token: '6848611846467bfb329de619' },
      { id: 'confirmacao2-ti', name: 'CONFIRMAÇÃO 2 - TI', token: '68486231df08d48001f8951d' },
      { id: 'confirmacao3-carla', name: 'CONFIRMAÇÃO 3 - CARLA', token: '6878f61667716e87a4ca2fbd' }
    ];

    for (const canal of canais) {
      try {
        // Verificar se token está presente
        if (!canal.token) {
          this.results.canaisStatus[canal.id] = {
            status: 'ERRO',
            problema: 'Token não configurado',
            solucao: 'Configurar token do canal'
          };
          continue;
        }

        // Verificar conectividade básica
        const axios = require('axios');
        const response = await axios.get('https://api.camkrolik.com.br/core/v2/api/channel/list', {
          headers: {
            'accept': 'application/json',
            'access-token': canal.token
          },
          timeout: 5000
        });

        this.results.canaisStatus[canal.id] = {
          status: 'OK',
          conectividade: 'OK',
          canaisDisponiveis: response.data?.length || 0
        };

        console.log(`✅ ${canal.name}: OK (${response.data?.length || 0} canais)`);

      } catch (error) {
        this.results.canaisStatus[canal.id] = {
          status: 'ERRO',
          problema: error.message,
          solucao: 'Verificar token e conectividade'
        };

        console.log(`❌ ${canal.name}: ${error.message}`);

        this.results.problemasEncontrados.push({
          tipo: 'CANAL',
          canal: canal.name,
          problema: `Canal ${canal.name} com problema`,
          impacto: 'Mensagens podem falhar para este canal',
          solucao: 'Verificar token e conectividade do canal'
        });
      }
    }
  }

  /**
   * Analisa logs de erro
   */
  async analisarLogsErro() {
    console.log('\n📝 Analisando logs de erro...');
    
    try {
      // Verificar se diretório de logs existe
      try {
        await fs.access(this.logsDir);
      } catch {
        console.log('⚠️ Diretório de logs não encontrado');
        return;
      }

      // Listar arquivos de log
      const logFiles = await fs.readdir(this.logsDir);
      const errorLogs = logFiles.filter(file => file.includes('error') || file.includes('Error'));
      
      if (errorLogs.length === 0) {
        console.log('✅ Nenhum arquivo de log de erro encontrado');
        return;
      }

      console.log(`📋 Encontrados ${errorLogs.length} arquivos de log de erro`);

      // Analisar logs recentes
      for (const logFile of errorLogs.slice(0, 3)) { // Analisar apenas os 3 mais recentes
        try {
          const logPath = path.join(this.logsDir, logFile);
          const logContent = await fs.readFile(logPath, 'utf8');
          const lines = logContent.split('\n').slice(-50); // Últimas 50 linhas
          
          const errorLines = lines.filter(line => 
            line.includes('❌') || 
            line.includes('Error') || 
            line.includes('ERRO') ||
            line.includes('falha') ||
            line.includes('failed')
          );

          if (errorLines.length > 0) {
            console.log(`\n📋 Erros encontrados em ${logFile}:`);
            errorLines.slice(0, 5).forEach(line => {
              console.log(`   ${line.trim()}`);
            });

            // Analisar padrões de erro
            this.analisarPadroesErro(errorLines);
          }

        } catch (error) {
          console.log(`❌ Erro ao ler ${logFile}: ${error.message}`);
        }
      }

    } catch (error) {
      console.log('❌ Erro ao analisar logs:', error.message);
    }
  }

  /**
   * Analisa padrões de erro nos logs
   */
  analisarPadroesErro(errorLines) {
    const padroes = {
      'contactId': errorLines.filter(line => line.includes('contactId')).length,
      'timeout': errorLines.filter(line => line.includes('timeout') || line.includes('Timeout')).length,
      'token': errorLines.filter(line => line.includes('token') || line.includes('Token')).length,
      'canal': errorLines.filter(line => line.includes('canal') || line.includes('channel')).length,
      'api': errorLines.filter(line => line.includes('api') || line.includes('API')).length
    };

    Object.entries(padroes).forEach(([padrao, count]) => {
      if (count > 0) {
        this.results.problemasEncontrados.push({
          tipo: 'LOG',
          problema: `Múltiplos erros relacionados a ${padrao}`,
          impacto: `${count} ocorrências encontradas`,
          solucao: `Investigar problemas com ${padrao}`
        });
      }
    });
  }

  /**
   * Verifica dados dos pacientes
   */
  async verificarDadosPacientes() {
    console.log('\n👥 Verificando dados dos pacientes...');
    
    try {
      const pacientesPath = path.join(this.dataDir, 'patients_active.json');
      const pacientesData = await fs.readFile(pacientesPath, 'utf8');
      const pacientes = JSON.parse(pacientesData);
      
      console.log(`📊 Total de pacientes ativos: ${pacientes.length}`);
      
      if (pacientes.length === 0) {
        this.results.problemasEncontrados.push({
          tipo: 'DADOS',
          problema: 'Nenhum paciente ativo encontrado',
          impacto: 'Nenhuma mensagem será enviada',
          solucao: 'Verificar se há pacientes em espera na API'
        });
        return;
      }

      // Verificar pacientes elegíveis
      const agora = new Date();
      const pacientesElegiveis = pacientes.filter(paciente => {
        if (!paciente.waitStartTime) return false;
        
        const waitStart = new Date(paciente.waitStartTime);
        const waitTimeMinutes = (agora - waitStart) / (1000 * 60);
        
        return waitTimeMinutes >= 30 && waitTimeMinutes <= 45;
      });

      console.log(`📊 Pacientes elegíveis para mensagem de 30min: ${pacientesElegiveis.length}`);

      if (pacientesElegiveis.length === 0) {
        this.results.problemasEncontrados.push({
          tipo: 'DADOS',
          problema: 'Nenhum paciente elegível para mensagem de 30min',
          impacto: 'Mensagens de 30min não serão enviadas',
          solucao: 'Verificar se há pacientes com tempo de espera entre 30-45 minutos'
        });
      }

      // Verificar dados obrigatórios
      const pacientesSemPhone = pacientes.filter(p => !p.phone);
      const pacientesSemContactId = pacientes.filter(p => !p.contactId);
      
      if (pacientesSemPhone.length > 0) {
        this.results.problemasEncontrados.push({
          tipo: 'DADOS',
          problema: `${pacientesSemPhone.length} pacientes sem número de telefone`,
          impacto: 'Mensagens não podem ser enviadas para estes pacientes',
          solucao: 'Verificar dados dos pacientes na API'
        });
      }

      if (pacientesSemContactId.length > 0) {
        console.log(`⚠️ ${pacientesSemContactId.length} pacientes sem contactId (isso é normal após nossa atualização)`);
      }

    } catch (error) {
      console.log('❌ Erro ao verificar dados dos pacientes:', error.message);
      this.results.problemasEncontrados.push({
        tipo: 'DADOS',
        problema: 'Erro ao carregar dados dos pacientes',
        impacto: 'Não é possível verificar elegibilidade',
        solucao: 'Verificar arquivo patients_active.json'
      });
    }
  }

  /**
   * Verifica seleção de canais
   */
  async verificarSelecaoCanais() {
    console.log('\n🎯 Verificando seleção de canais...');
    
    try {
      // Verificar se MultiChannelManager está funcionando
      const { MultiChannelManager } = require('./src/services/MultiChannelManager');
      const { ConfigManager } = require('./src/services/ConfigManager');
      const { ErrorHandler } = require('./src/services/ErrorHandler');
      
      const errorHandler = new ErrorHandler();
      const configManager = new ConfigManager(errorHandler);
      await configManager.initialize();
      
      const multiChannelManager = new MultiChannelManager(configManager, errorHandler);
      
      // Verificar canais ativos
      const canaisAtivos = multiChannelManager.getActiveChannels();
      console.log(`📊 Canais ativos: ${canaisAtivos.length}`);
      
      if (canaisAtivos.length === 0) {
        this.results.problemasEncontrados.push({
          tipo: 'CANAL',
          problema: 'Nenhum canal ativo disponível',
          impacto: 'Mensagens não podem ser enviadas',
          solucao: 'Verificar configuração dos canais'
        });
      }

      // Testar seleção de canal
      const pacienteTeste = {
        phone: '5519999999999',
        name: 'Teste',
        sector: 'estoque'
      };

      const canalSelecionado = multiChannelManager.getBestChannelForPatient(pacienteTeste);
      
      if (canalSelecionado) {
        console.log(`✅ Seleção de canal funcionando: ${canalSelecionado.name}`);
      } else {
        this.results.problemasEncontrados.push({
          tipo: 'CANAL',
          problema: 'Falha na seleção de canal',
          impacto: 'Mensagens não podem ser enviadas',
          solucao: 'Verificar configuração do MultiChannelManager'
        });
      }

    } catch (error) {
      console.log('❌ Erro ao verificar seleção de canais:', error.message);
      this.results.problemasEncontrados.push({
        tipo: 'CANAL',
        problema: 'Erro no MultiChannelManager',
        impacto: 'Seleção de canais pode não funcionar',
        solucao: 'Verificar inicialização dos serviços'
      });
    }
  }

  /**
   * Gera relatório final
   */
  gerarRelatorio() {
    console.log('\n📊 ===========================================');
    console.log('   RELATÓRIO DE DIAGNÓSTICO');
    console.log('===========================================');

    const totalProblemas = this.results.problemasEncontrados.length;
    console.log(`🔍 Total de problemas encontrados: ${totalProblemas}`);

    if (totalProblemas === 0) {
      console.log('✅ Nenhum problema crítico encontrado!');
      console.log('💡 Sistema deve estar funcionando normalmente.');
    } else {
      console.log('\n📋 Problemas encontrados:');
      
      this.results.problemasEncontrados.forEach((problema, index) => {
        console.log(`\n${index + 1}. ${problema.tipo}: ${problema.problema}`);
        console.log(`   📊 Impacto: ${problema.impacto}`);
        console.log(`   🔧 Solução: ${problema.solucao}`);
      });

      // Gerar recomendações
      this.gerarRecomendacoes();
    }

    console.log('\n===========================================');
  }

  /**
   * Gera recomendações baseadas nos problemas encontrados
   */
  gerarRecomendacoes() {
    console.log('\n💡 RECOMENDAÇÕES:');
    
    const tiposProblemas = [...new Set(this.results.problemasEncontrados.map(p => p.tipo))];
    
    tiposProblemas.forEach(tipo => {
      const problemas = this.results.problemasEncontrados.filter(p => p.tipo === tipo);
      
      switch (tipo) {
        case 'CONFIGURACAO':
          console.log('\n🔧 Configuração:');
          console.log('   - Verificar interface web para configurações');
          console.log('   - Despausar fluxo se necessário');
          console.log('   - Configurar Action Cards');
          break;
          
        case 'CANAL':
          console.log('\n📞 Canais:');
          console.log('   - Verificar tokens dos canais');
          console.log('   - Testar conectividade com API CAM Krolik');
          console.log('   - Verificar se canais estão ativos');
          break;
          
        case 'DADOS':
          console.log('\n👥 Dados:');
          console.log('   - Verificar se há pacientes em espera');
          console.log('   - Validar dados dos pacientes');
          console.log('   - Verificar tempo de espera');
          break;
          
        case 'LOG':
          console.log('\n📝 Logs:');
          console.log('   - Investigar erros específicos nos logs');
          console.log('   - Verificar padrões de falha');
          console.log('   - Monitorar logs em tempo real');
          break;
      }
    });
  }
}

// Executar diagnóstico
async function main() {
  const diagnostico = new DiagnosticoFalhasEnvio();
  await diagnostico.executarDiagnostico();
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { DiagnosticoFalhasEnvio };
