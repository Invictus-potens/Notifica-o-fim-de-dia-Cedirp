/**
 * Teste do cálculo de tempo excedido após fim do expediente
 */

// Simular ambiente do navegador
const { JSDOM } = require('jsdom');

async function testOvertimeCalculation() {
  console.log('🧪 TESTE DO CÁLCULO DE TEMPO EXCEDIDO APÓS FIM DO EXPEDIENTE\n');
  
  try {
    // Criar DOM simulado
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test</title>
      </head>
      <body>
        <div id="patients-tbody"></div>
      </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    
    // Simular função calculateOvertimeAfterEndOfDay
    function calculateOvertimeAfterEndOfDay(patient) {
      try {
        // Verificar se é após o fim do expediente (18h)
        const now = new Date();
        const currentHour = now.getHours();
        
        // Se não é após 18h, retornar "--"
        if (currentHour < 18) {
          return '--';
        }
        
        // Calcular tempo desde o início do atendimento
        const waitStartTime = patient.waitStartTime ? new Date(patient.waitStartTime) : null;
        if (!waitStartTime) {
          return '--';
        }
        
        // Calcular fim do expediente do dia do atendimento
        const endOfDayTime = new Date(waitStartTime);
        endOfDayTime.setHours(18, 0, 0, 0);
        
        // Se o atendimento começou após 18h, todo o tempo é excedido
        if (waitStartTime >= endOfDayTime) {
          const overtimeMs = now - waitStartTime;
          const overtimeMinutes = Math.floor(overtimeMs / (1000 * 60));
          return formatWaitTime(overtimeMinutes);
        }
        
        // Se o atendimento começou antes de 18h, calcular apenas o tempo após 18h
        if (now > endOfDayTime) {
          const overtimeMs = now - endOfDayTime;
          const overtimeMinutes = Math.floor(overtimeMs / (1000 * 60));
          return formatWaitTime(overtimeMinutes);
        }
        
        return '--';
        
      } catch (error) {
        console.error('Erro ao calcular tempo excedido:', error);
        return '--';
      }
    }
    
    function formatWaitTime(minutes) {
      if (!minutes || minutes < 0) return '--';
      
      if (minutes < 60) {
        return `${minutes} min`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}min`;
      }
    }
    
    // Simular pacientes com diferentes cenários
    const now = new Date();
    const currentHour = now.getHours();
    
    console.log(`🕐 Hora atual: ${currentHour}:${now.getMinutes().toString().padStart(2, '0')}`);
    
    const testPatients = [
      // Paciente que começou às 14h (antes do fim do expediente)
      {
        name: 'Paciente 1 - Início 14h',
        waitStartTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0),
        waitTimeMinutes: 300 // 5 horas total
      },
      // Paciente que começou às 19h (após o fim do expediente)
      {
        name: 'Paciente 2 - Início 19h',
        waitStartTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0),
        waitTimeMinutes: 180 // 3 horas total
      },
      // Paciente que começou às 17h (próximo ao fim do expediente)
      {
        name: 'Paciente 3 - Início 17h',
        waitStartTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0),
        waitTimeMinutes: 240 // 4 horas total
      }
    ];
    
    console.log('\n📊 Testando diferentes cenários:');
    
    testPatients.forEach((patient, index) => {
      const overtime = calculateOvertimeAfterEndOfDay(patient);
      const startTimeStr = patient.waitStartTime.toLocaleTimeString('pt-BR');
      
      console.log(`\n   Paciente ${index + 1}: ${patient.name}`);
      console.log(`   Início: ${startTimeStr}`);
      console.log(`   Tempo total: ${formatWaitTime(patient.waitTimeMinutes)}`);
      console.log(`   Tempo excedido: ${overtime}`);
      
      // Explicar o cálculo
      if (currentHour >= 18) {
        if (patient.waitStartTime.getHours() >= 18) {
          console.log(`   📝 Todo o tempo é excedido (iniciou após 18h)`);
        } else {
          const endOfDayTime = new Date(patient.waitStartTime);
          endOfDayTime.setHours(18, 0, 0, 0);
          const overtimeMs = now - endOfDayTime;
          const overtimeMinutes = Math.floor(overtimeMs / (1000 * 60));
          console.log(`   📝 Tempo após 18h: ${formatWaitTime(overtimeMinutes)}`);
        }
      } else {
        console.log(`   📝 Não é após 18h ainda`);
      }
    });
    
    // Teste com hora atual simulada (22h)
    console.log('\n🕐 Testando com hora simulada (22h):');
    const originalNow = Date.now;
    const simulatedTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0, 0);
    
    // Temporariamente sobrescrever Date.now para simular 22h
    Date.now = () => simulatedTime.getTime();
    
    testPatients.forEach((patient, index) => {
      const overtime = calculateOvertimeAfterEndOfDay(patient);
      console.log(`   ${patient.name}: ${overtime}`);
    });
    
    // Restaurar Date.now
    Date.now = originalNow;
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    
    if (currentHour >= 18) {
      console.log('✅ Sistema está após 18h - tempo excedido deve estar sendo calculado!');
    } else {
      console.log('⚠️ Sistema ainda não chegou às 18h - tempo excedido aparecerá como "--"');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error.stack);
  }
}

// Executar teste
testOvertimeCalculation();
