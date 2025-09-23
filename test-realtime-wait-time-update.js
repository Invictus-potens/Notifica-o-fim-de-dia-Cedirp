/**
 * Teste de atualização em tempo real dos tempos de espera
 */

const http = require('http');

async function testRealtimeWaitTimeUpdate() {
  console.log('🧪 TESTE DE ATUALIZAÇÃO EM TEMPO REAL DOS TEMPOS DE ESPERA\n');
  
  try {
    // Função para fazer requisição à API
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
    
    // Função para formatar tempo
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
    
    console.log('📋 Fazendo primeira requisição...');
    const firstResponse = await makeRequest();
    
    if (!firstResponse.success) {
      console.log('❌ Erro na primeira requisição:', firstResponse.error);
      return;
    }
    
    console.log(`✅ Primeira requisição: ${firstResponse.total} pacientes`);
    
    // Mostrar alguns pacientes da primeira requisição
    if (firstResponse.data && firstResponse.data.length > 0) {
      console.log('\n📊 Primeiros 3 pacientes (primeira requisição):');
      firstResponse.data.slice(0, 3).forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name}: ${formatWaitTime(patient.waitTimeMinutes)}`);
      });
    }
    
    // Aguardar 10 segundos
    console.log('\n⏳ Aguardando 10 segundos para segunda requisição...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('\n📋 Fazendo segunda requisição...');
    const secondResponse = await makeRequest();
    
    if (!secondResponse.success) {
      console.log('❌ Erro na segunda requisição:', secondResponse.error);
      return;
    }
    
    console.log(`✅ Segunda requisição: ${secondResponse.total} pacientes`);
    
    // Mostrar alguns pacientes da segunda requisição
    if (secondResponse.data && secondResponse.data.length > 0) {
      console.log('\n📊 Primeiros 3 pacientes (segunda requisição):');
      secondResponse.data.slice(0, 3).forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name}: ${formatWaitTime(patient.waitTimeMinutes)}`);
      });
    }
    
    // Comparar tempos
    console.log('\n📊 Comparação de tempos:');
    if (firstResponse.data && secondResponse.data) {
      const minLength = Math.min(firstResponse.data.length, secondResponse.data.length);
      
      for (let i = 0; i < Math.min(3, minLength); i++) {
        const firstPatient = firstResponse.data[i];
        const secondPatient = secondResponse.data[i];
        
        if (firstPatient.name === secondPatient.name) {
          const timeDiff = secondPatient.waitTimeMinutes - firstPatient.waitTimeMinutes;
          console.log(`   ${firstPatient.name}:`);
          console.log(`     1ª requisição: ${formatWaitTime(firstPatient.waitTimeMinutes)}`);
          console.log(`     2ª requisição: ${formatWaitTime(secondPatient.waitTimeMinutes)}`);
          console.log(`     Diferença: ${timeDiff} minutos ${timeDiff > 0 ? '⏰' : timeDiff < 0 ? '⏪' : '⏸️'}`);
        }
      }
    }
    
    // Verificar estatísticas
    console.log('\n📊 Estatísticas finais:');
    
    if (secondResponse.data) {
      const over30Min = secondResponse.data.filter(p => p.waitTimeMinutes >= 30);
      const over60Min = secondResponse.data.filter(p => p.waitTimeMinutes >= 60);
      const over4Hours = secondResponse.data.filter(p => p.waitTimeMinutes >= 240);
      const over8Hours = secondResponse.data.filter(p => p.waitTimeMinutes >= 480);
      
      console.log(`   Pacientes com mais de 30 minutos: ${over30Min.length}`);
      console.log(`   Pacientes com mais de 60 minutos: ${over60Min.length}`);
      console.log(`   Pacientes com mais de 4 horas: ${over4Hours.length}`);
      console.log(`   Pacientes com mais de 8 horas: ${over8Hours.length}`);
      
      if (over8Hours.length > 0) {
        console.log('\n🚨 Pacientes com mais de 8 horas de espera:');
        over8Hours.forEach(patient => {
          console.log(`   ${patient.name}: ${formatWaitTime(patient.waitTimeMinutes)} (${patient.waitTimeMinutes} minutos)`);
        });
      }
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    
    // Verificar se os tempos estão sendo atualizados
    const timesUpdated = firstResponse.data && secondResponse.data && 
                        firstResponse.data.length === secondResponse.data.length &&
                        firstResponse.data.some((p1, index) => {
                          const p2 = secondResponse.data[index];
                          return p1.name === p2.name && p2.waitTimeMinutes > p1.waitTimeMinutes;
                        });
    
    if (timesUpdated) {
      console.log('✅ Os tempos estão sendo atualizados corretamente!');
      console.log('✅ O problema pode estar na interface do usuário ou na atualização em tempo real.');
    } else {
      console.log('⚠️ Os tempos podem não estar sendo atualizados entre requisições.');
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
testRealtimeWaitTimeUpdate();
