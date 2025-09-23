/**
 * Teste direto do endpoint /api/patients
 */

const http = require('http');

async function testApiPatientsEndpoint() {
  console.log('🧪 TESTE DIRETO DO ENDPOINT /api/patients\n');
  
  try {
    // Fazer requisição para a API
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/patients',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    console.log('📋 Fazendo requisição para http://localhost:3000/api/patients...');
    
    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: jsonData
            });
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
    
    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`✅ Content-Type: ${response.headers['content-type']}`);
    
    if (response.data.success) {
      console.log(`✅ Total de pacientes: ${response.data.total}`);
      console.log(`✅ Canais: ${response.data.channels}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('\n📊 Primeiros 5 pacientes:');
        response.data.data.slice(0, 5).forEach((patient, index) => {
          console.log(`\n   Paciente ${index + 1}:`);
          console.log(`   Nome: ${patient.name}`);
          console.log(`   Telefone: ${patient.phone}`);
          console.log(`   Setor: ${patient.sectorName}`);
          console.log(`   Tempo de espera: ${patient.waitTimeMinutes} minutos`);
          console.log(`   Tempo formatado: ${formatWaitTime(patient.waitTimeMinutes)}`);
          console.log(`   Canal: ${patient.channelName} (${patient.channelNumber})`);
        });
        
        // Verificar se há pacientes com tempo excedido
        const over30Min = response.data.data.filter(p => p.waitTimeMinutes >= 30);
        const over60Min = response.data.data.filter(p => p.waitTimeMinutes >= 60);
        const over4Hours = response.data.data.filter(p => p.waitTimeMinutes >= 240);
        
        console.log('\n📊 Estatísticas de tempo:');
        console.log(`   Pacientes com mais de 30 minutos: ${over30Min.length}`);
        console.log(`   Pacientes com mais de 60 minutos: ${over60Min.length}`);
        console.log(`   Pacientes com mais de 4 horas: ${over4Hours.length}`);
        
        if (over4Hours.length > 0) {
          console.log('\n🚨 Pacientes com tempo muito alto:');
          over4Hours.slice(0, 5).forEach(patient => {
            console.log(`   ${patient.name}: ${formatWaitTime(patient.waitTimeMinutes)} (${patient.waitTimeMinutes} minutos)`);
          });
        }
      } else {
        console.log('⚠️ Nenhum paciente encontrado');
      }
    } else {
      console.log('❌ Erro na API:', response.data.error || response.data.message);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Servidor não está rodando. Inicie o servidor primeiro com: npm start');
    } else {
      console.error('❌ Erro durante o teste:', error.message);
    }
  }
}

// Função para formatar tempo (copiada do frontend)
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

// Executar teste
testApiPatientsEndpoint();
