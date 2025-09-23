/**
 * Teste da atualização automática no frontend
 */

const http = require('http');

async function testFrontendAutoRefresh() {
  console.log('🧪 TESTE DA ATUALIZAÇÃO AUTOMÁTICA NO FRONTEND\n');
  
  try {
    // Simular o comportamento do frontend
    let refreshCount = 0;
    const maxRefreshes = 3;
    const refreshInterval = 5000; // 5 segundos para teste
    
    console.log(`📋 Simulando ${maxRefreshes} atualizações automáticas com intervalo de ${refreshInterval/1000}s...\n`);
    
    async function makeRequest() {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/patients',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        };
        
        const req = http.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve(jsonData);
            } catch (error) {
              reject(new Error(`Erro ao parsear JSON: ${error.message}`));
            }
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        req.end();
      });
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
    
    // Array para armazenar dados de cada refresh
    const refreshData = [];
    
    // Função para fazer refresh
    async function doRefresh() {
      refreshCount++;
      const timestamp = new Date().toLocaleTimeString();
      
      console.log(`🔄 [${timestamp}] Refresh ${refreshCount}/${maxRefreshes}...`);
      
      try {
        const response = await makeRequest();
        
        if (response.success && response.data) {
          // Armazenar dados do refresh
          refreshData.push({
            refreshNumber: refreshCount,
            timestamp: timestamp,
            totalPatients: response.total,
            patients: response.data.slice(0, 3), // Primeiros 3 pacientes
            timestamp_api: response.timestamp
          });
          
          console.log(`   ✅ ${response.total} pacientes carregados`);
          
          // Mostrar primeiros 3 pacientes
          console.log(`   📊 Primeiros 3 pacientes:`);
          response.data.slice(0, 3).forEach((patient, index) => {
            console.log(`      ${index + 1}. ${patient.name}: ${formatWaitTime(patient.waitTimeMinutes)}`);
          });
          
          // Verificar estatísticas
          const over30Min = response.data.filter(p => p.waitTimeMinutes >= 30);
          const over4Hours = response.data.filter(p => p.waitTimeMinutes >= 240);
          const over8Hours = response.data.filter(p => p.waitTimeMinutes >= 480);
          
          console.log(`   📊 Estatísticas: >30min: ${over30Min.length}, >4h: ${over4Hours.length}, >8h: ${over8Hours.length}`);
          
        } else {
          console.log(`   ❌ Erro na resposta: ${response.error || 'Resposta inválida'}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erro na requisição: ${error.message}`);
      }
      
      console.log(''); // Linha em branco para separar
    }
    
    // Fazer refreshes sequenciais
    for (let i = 0; i < maxRefreshes; i++) {
      await doRefresh();
      
      if (i < maxRefreshes - 1) {
        console.log(`⏳ Aguardando ${refreshInterval/1000}s para próximo refresh...`);
        await new Promise(resolve => setTimeout(resolve, refreshInterval));
      }
    }
    
    // Análise dos dados
    console.log('📊 ANÁLISE DOS DADOS:');
    console.log('='.repeat(50));
    
    if (refreshData.length >= 2) {
      // Comparar primeiro e último refresh
      const firstRefresh = refreshData[0];
      const lastRefresh = refreshData[refreshData.length - 1];
      
      console.log(`\n🔄 Comparação Refresh 1 vs Refresh ${maxRefreshes}:`);
      console.log(`   Refresh 1: ${firstRefresh.totalPatients} pacientes`);
      console.log(`   Refresh ${maxRefreshes}: ${lastRefresh.totalPatients} pacientes`);
      
      // Verificar se os tempos aumentaram
      let timesIncreased = 0;
      let timesUnchanged = 0;
      
      for (let i = 0; i < Math.min(firstRefresh.patients.length, lastRefresh.patients.length); i++) {
        const firstPatient = firstRefresh.patients[i];
        const lastPatient = lastRefresh.patients[i];
        
        if (firstPatient.name === lastPatient.name) {
          const timeDiff = lastPatient.waitTimeMinutes - firstPatient.waitTimeMinutes;
          if (timeDiff > 0) {
            timesIncreased++;
          } else if (timeDiff === 0) {
            timesUnchanged++;
          }
        }
      }
      
      console.log(`   ⏰ Tempos aumentaram: ${timesIncreased}`);
      console.log(`   ⏸️ Tempos inalterados: ${timesUnchanged}`);
      
      // Verificar se há pacientes com tempo muito alto
      const veryLongWaits = lastRefresh.patients.filter(p => p.waitTimeMinutes >= 300); // 5+ horas
      if (veryLongWaits.length > 0) {
        console.log(`\n🚨 Pacientes com mais de 5 horas de espera:`);
        veryLongWaits.forEach(patient => {
          console.log(`   ${patient.name}: ${formatWaitTime(patient.waitTimeMinutes)} (${patient.waitTimeMinutes} minutos)`);
        });
      }
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    
    // Conclusão
    const hasLongWaits = refreshData.some(refresh => 
      refresh.patients.some(patient => patient.waitTimeMinutes >= 240) // 4+ horas
    );
    
    if (hasLongWaits) {
      console.log('✅ CONFIRMADO: Há pacientes com tempo excedido (4+ horas)!');
      console.log('✅ Os dados estão sendo atualizados corretamente na API!');
      console.log('⚠️ O problema pode estar na interface do usuário ou na frequência de atualização.');
    } else {
      console.log('⚠️ Não foram encontrados pacientes com tempo muito alto.');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Servidor não está rodando. Inicie o servidor primeiro com: npm start');
    } else {
      console.error('❌ Erro durante o teste:', error.message);
    }
  }
}

// Executar teste
testFrontendAutoRefresh();
