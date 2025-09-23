#!/usr/bin/env node

/**
 * Debug específico para o paciente Felipe (5519995068303)
 */

const fs = require('fs').promises;

class DebugPacienteFelipe {
  constructor() {
    this.telefoneFilipe = '5519995068303';
    this.nomeFilipe = 'Felipe';
  }

  async executarDebug() {
    console.log('🔍 ===========================================');
    console.log('   DEBUG PACIENTE FELIPE');
    console.log('===========================================');
    console.log(`📱 Telefone: ${this.telefoneFilipe}`);
    console.log(`👤 Nome: ${this.nomeFilipe}`);
    console.log(`⏰ Análise em: ${new Date().toLocaleString('pt-BR')}`);
    console.log('===========================================\n');

    try {
      // 1. Encontrar dados do Felipe
      const dadosFelipe = await this.encontrarDadosFelipe();
      
      // 2. Verificar configuração atual
      const config = await this.verificarConfiguracao();
      
      // 3. Analisar elegibilidade detalhada
      await this.analisarElegibilidade(dadosFelipe, config);
      
      // 4. Verificar se foi processado
      await this.verificarSeProcessado(dadosFelipe);
      
      // 5. Simular lógica do sistema
      await this.simularLogicaSistema(dadosFelipe, config);

    } catch (error) {
      console.error('❌ Erro no debug:', error.message);
    }
  }

  async encontrarDadosFelipe() {
    console.log('👤 Procurando dados do Felipe...');
    
    try {
      const pacientesData = await fs.readFile('data/patients_active.json', 'utf8');
      const pacientes = JSON.parse(pacientesData);
      
      const felipe = pacientes.find(p => 
        p.phone === this.telefoneFilipe || 
        p.name === this.nomeFilipe
      );
      
      if (!felipe) {
        console.log('❌ Felipe não encontrado no arquivo patients_active.json');
        return null;
      }
      
      console.log('✅ Felipe encontrado!');
      console.log('📋 Dados completos:');
      console.log(`   ID: ${felipe.id}`);
      console.log(`   Nome: ${felipe.name}`);
      console.log(`   Telefone: ${felipe.phone}`);
      console.log(`   Contact ID: ${felipe.contactId}`);
      console.log(`   Setor: ${felipe.sectorName} (${felipe.sectorId})`);
      console.log(`   Canal: ${felipe.channelType} (${felipe.channelId})`);
      console.log(`   Status: ${felipe.status}`);
      console.log(`   Início da espera: ${felipe.waitStartTime}`);
      console.log(`   Tempo de espera registrado: ${felipe.waitTimeMinutes} min`);
      console.log(`   Entrou em: ${felipe.enteredAt}`);
      
      // Calcular tempo de espera atual
      const agora = new Date();
      const inicioEspera = new Date(felipe.waitStartTime);
      const tempoEsperaAtual = Math.floor((agora - inicioEspera) / (1000 * 60));
      
      console.log(`   ⏰ Tempo de espera ATUAL: ${tempoEsperaAtual} min`);
      console.log(`   📊 Diferença: arquivo(${felipe.waitTimeMinutes}) vs atual(${tempoEsperaAtual})`);
      
      return { ...felipe, tempoEsperaAtual };
      
    } catch (error) {
      console.log('❌ Erro ao ler arquivo de pacientes:', error.message);
      return null;
    }
  }

  async verificarConfiguracao() {
    console.log('\n⚙️ Verificando configuração atual...');
    
    try {
      const configData = await fs.readFile('data/system_config.json', 'utf8');
      const config = JSON.parse(configData);
      
      const configuracao = {
        minWaitTime: parseInt(config.minWaitTime) || 30,
        maxWaitTime: parseInt(config.maxWaitTime) || 40,
        flowPaused: config.flowPaused === 'true',
        endOfDayPaused: config.endOfDayPaused === 'true',
        ignoreBusinessHours: config.ignoreBusinessHours === 'true',
        refreshInterval: parseInt(config.refreshInterval) || 120,
        selectedActionCard30Min: config.selectedActionCard30Min,
        selectedActionCardEndDay: config.selectedActionCardEndDay
      };
      
      console.log('📋 Configuração carregada:');
      console.log(`   ⏰ Janela de tempo: ${configuracao.minWaitTime} - ${configuracao.maxWaitTime} min`);
      console.log(`   ⏸️ Fluxo pausado: ${configuracao.flowPaused}`);
      console.log(`   🌅 Fim de dia pausado: ${configuracao.endOfDayPaused}`);
      console.log(`   🕐 Ignorar horário comercial: ${configuracao.ignoreBusinessHours}`);
      console.log(`   🔄 Intervalo de verificação: ${configuracao.refreshInterval}s`);
      console.log(`   📋 Action Card 30min: ${configuracao.selectedActionCard30Min}`);
      console.log(`   📋 Action Card fim de dia: ${configuracao.selectedActionCardEndDay}`);
      
      return configuracao;
      
    } catch (error) {
      console.log('❌ Erro ao ler configuração:', error.message);
      return null;
    }
  }

  async analisarElegibilidade(felipe, config) {
    if (!felipe || !config) {
      console.log('\n❌ Não é possível analisar elegibilidade - dados faltando');
      return;
    }
    
    console.log('\n🎯 Analisando elegibilidade do Felipe...');
    
    const agora = new Date();
    const horaAtual = agora.getHours();
    const diaAtual = agora.getDay(); // 0=domingo, 1=segunda, etc.
    
    console.log(`📅 Contexto atual:`);
    console.log(`   ⏰ Hora atual: ${horaAtual}h`);
    console.log(`   📅 Dia da semana: ${diaAtual} (${this.getDayName(diaAtual)})`);
    console.log(`   🕐 É horário comercial: ${horaAtual >= 8 && horaAtual < 18 ? 'SIM' : 'NÃO'}`);
    console.log(`   📅 É dia útil: ${diaAtual >= 1 && diaAtual <= 5 ? 'SIM' : 'NÃO'}`);
    
    console.log(`\n📊 Critérios de elegibilidade:`);
    
    // 1. Tempo de espera
    const tempoEspera = felipe.tempoEsperaAtual;
    const dentroJanela = tempoEspera >= config.minWaitTime && tempoEspera <= config.maxWaitTime;
    console.log(`   1. ⏰ Tempo de espera: ${tempoEspera} min`);
    console.log(`      Janela permitida: ${config.minWaitTime} - ${config.maxWaitTime} min`);
    console.log(`      Status: ${dentroJanela ? '✅ DENTRO' : '❌ FORA'} da janela`);
    
    if (!dentroJanela) {
      if (tempoEspera < config.minWaitTime) {
        console.log(`      💡 Muito cedo: faltam ${config.minWaitTime - tempoEspera} min`);
      } else {
        console.log(`      💡 Muito tarde: passou ${tempoEspera - config.maxWaitTime} min do limite`);
      }
    }
    
    // 2. Fluxo pausado
    console.log(`   2. ⏸️ Fluxo pausado: ${config.flowPaused ? '❌ SIM' : '✅ NÃO'}`);
    
    // 3. Horário comercial (se não ignorar)
    const isBusinessHours = horaAtual >= 8 && horaAtual < 18;
    const isWorkingDay = diaAtual >= 1 && diaAtual <= 5;
    
    if (config.ignoreBusinessHours) {
      console.log(`   3. 🕐 Horário comercial: ✅ IGNORADO (configurado para 24h)`);
    } else {
      console.log(`   3. 🕐 Horário comercial: ${isBusinessHours ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`   4. 📅 Dia útil: ${isWorkingDay ? '✅ SIM' : '❌ NÃO'}`);
    }
    
    // Resultado final
    let elegivel = dentroJanela && !config.flowPaused;
    
    if (!config.ignoreBusinessHours) {
      elegivel = elegivel && isBusinessHours && isWorkingDay;
    }
    
    console.log(`\n🎯 RESULTADO FINAL:`);
    console.log(`   Felipe está ${elegivel ? '✅ ELEGÍVEL' : '❌ NÃO ELEGÍVEL'} para receber mensagem`);
    
    if (!elegivel) {
      console.log(`\n💡 Motivos da não elegibilidade:`);
      if (!dentroJanela) {
        console.log(`   - ⏰ Fora da janela de tempo (${tempoEspera} min não está entre ${config.minWaitTime}-${config.maxWaitTime})`);
      }
      if (config.flowPaused) {
        console.log(`   - ⏸️ Fluxo está pausado`);
      }
      if (!config.ignoreBusinessHours && !isBusinessHours) {
        console.log(`   - 🕐 Fora do horário comercial (${horaAtual}h)`);
      }
      if (!config.ignoreBusinessHours && !isWorkingDay) {
        console.log(`   - 📅 Não é dia útil (${this.getDayName(diaAtual)})`);
      }
    }
    
    return elegivel;
  }

  async verificarSeProcessado(felipe) {
    if (!felipe) return;
    
    console.log('\n📋 Verificando se Felipe já foi processado...');
    
    try {
      // Verificar arquivo de processados
      const processedData = await fs.readFile('data/patients_processed.json', 'utf8');
      const processados = JSON.parse(processedData);
      
      const felipeProcessado = processados.find(p => 
        p.id === felipe.id || 
        p.phone === felipe.phone
      );
      
      if (felipeProcessado) {
        console.log('❌ Felipe JÁ foi processado!');
        console.log(`   📅 Processado em: ${felipeProcessado.processedAt}`);
        console.log(`   📋 Tipo de mensagem: ${felipeProcessado.messageType || 'N/A'}`);
        console.log(`   📤 Action Card: ${felipeProcessado.actionCardId || 'N/A'}`);
      } else {
        console.log('✅ Felipe NÃO foi processado ainda');
      }
      
      return !!felipeProcessado;
      
    } catch (error) {
      console.log('⚠️ Erro ao verificar processados (arquivo pode não existir):', error.message);
      return false;
    }
  }

  async simularLogicaSistema(felipe, config) {
    if (!felipe || !config) return;
    
    console.log('\n🔄 Simulando lógica do sistema...');
    
    try {
      // Simular a lógica do MonitoringService.isPatientEligibleFor30MinMessage
      console.log('📋 Executando lógica do MonitoringService:');
      
      const tempoEspera = felipe.tempoEsperaAtual;
      
      // 1. Verificar tempo de espera
      if (!tempoEspera || tempoEspera < config.minWaitTime || tempoEspera > config.maxWaitTime) {
        console.log(`   ❌ Falhou no critério 1: Tempo de espera (${tempoEspera} min)`);
        return false;
      }
      console.log(`   ✅ Passou no critério 1: Tempo de espera (${tempoEspera} min)`);
      
      // 2. Verificar se já foi processado (simulado)
      const jaProcessado = await this.verificarSeProcessado(felipe);
      if (jaProcessado) {
        console.log(`   ❌ Falhou no critério 2: Já foi processado`);
        return false;
      }
      console.log(`   ✅ Passou no critério 2: Não foi processado`);
      
      // 3. Verificar lista de exclusões (simulado - assumindo que não está)
      console.log(`   ✅ Passou no critério 3: Não está na lista de exclusões (assumido)`);
      
      // 4. Verificar horário comercial
      const agora = new Date();
      const horaAtual = agora.getHours();
      const diaAtual = agora.getDay();
      
      if (!config.ignoreBusinessHours) {
        const isBusinessHours = horaAtual >= 8 && horaAtual < 18;
        if (!isBusinessHours) {
          console.log(`   ❌ Falhou no critério 4: Fora do horário comercial (${horaAtual}h)`);
          return false;
        }
        console.log(`   ✅ Passou no critério 4: Dentro do horário comercial (${horaAtual}h)`);
        
        // 5. Verificar dia útil
        const isWorkingDay = diaAtual >= 1 && diaAtual <= 5;
        if (!isWorkingDay) {
          console.log(`   ❌ Falhou no critério 5: Não é dia útil (${this.getDayName(diaAtual)})`);
          return false;
        }
        console.log(`   ✅ Passou no critério 5: É dia útil (${this.getDayName(diaAtual)})`);
      } else {
        console.log(`   ✅ Passou nos critérios 4-5: Horário comercial ignorado`);
      }
      
      // 6. Verificar se fluxo não está pausado
      if (config.flowPaused) {
        console.log(`   ❌ Falhou no critério 6: Fluxo está pausado`);
        return false;
      }
      console.log(`   ✅ Passou no critério 6: Fluxo não está pausado`);
      
      console.log(`\n🎉 RESULTADO: Felipe deveria ser ELEGÍVEL segundo a lógica do sistema!`);
      return true;
      
    } catch (error) {
      console.log('❌ Erro na simulação:', error.message);
      return false;
    }
  }

  getDayName(dayNumber) {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayNumber] || 'Desconhecido';
  }
}

// Executar debug
async function main() {
  const debug = new DebugPacienteFelipe();
  await debug.executarDebug();
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { DebugPacienteFelipe };
