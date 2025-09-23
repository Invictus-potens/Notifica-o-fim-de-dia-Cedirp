/**
 * Teste da API /api/channels
 */

const http = require('http');

async function testChannelsAPI() {
  console.log('🧪 TESTE DA API /api/channels\n');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/channels',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    console.log('📋 Fazendo requisição para http://localhost:3000/api/channels...');
    
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
      console.log(`✅ Total de canais: ${response.data.total}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('\n📊 Canais encontrados:');
        response.data.data.forEach((channel, index) => {
          console.log(`\n   Canal ${index + 1}:`);
          console.log(`   ID: ${channel.id}`);
          console.log(`   Descrição: ${channel.description || 'N/A'}`);
          console.log(`   Identificador: ${channel.identifier || 'N/A'}`);
          console.log(`   Tipo: ${channel.type || 'N/A'}`);
          console.log(`   Organization ID: ${channel.organizationId || 'N/A'}`);
        });
      } else {
        console.log('⚠️ Nenhum canal encontrado');
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

testChannelsAPI();
