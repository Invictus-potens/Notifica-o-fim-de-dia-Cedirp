#!/usr/bin/env node

/**
 * Script para testar as rotas de health check
 * Uso: node scripts/test-health-check.js [url]
 */

const http = require('http');
const https = require('https');

const DEFAULT_URL = 'http://localhost:3000';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
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
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testHealthCheck(baseUrl) {
  console.log('\n🏥 ===========================================');
  console.log('   TESTANDO ROTAS DE HEALTH CHECK');
  console.log('===========================================');
  console.log(`🌐 URL Base: ${baseUrl}`);
  console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}\n`);

  const routes = [
    { name: 'Health Check Completo', url: `${baseUrl}/health`, icon: '🔍' },
    { name: 'API Health Check Completo', url: `${baseUrl}/api/health`, icon: '📊' },
    { name: 'API Health Check Rápido', url: `${baseUrl}/api/health?quick=true`, icon: '⚡' }
  ];

  for (const route of routes) {
    console.log(`\n${route.icon} ===========================================`);
    console.log(`   TESTANDO: ${route.name}`);
    console.log('===========================================');
    console.log(`🔗 URL: ${route.url}\n`);
    
    try {
      const startTime = Date.now();
      const response = await makeRequest(route.url);
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ Status HTTP: ${response.statusCode}`);
      console.log(`⏱️  Tempo de Resposta: ${responseTime}ms\n`);
      
      if (response.data && typeof response.data === 'object') {
        console.log('📊 ===========================================');
        console.log('   RESULTADO DA VERIFICAÇÃO');
        console.log('===========================================');
        console.log(`🎯 Status do Sistema: ${response.data.status || 'N/A'}`);
        
        if (response.data.overall) {
          console.log(`📈 Total de Checks: ${response.data.overall.totalChecks}`);
          console.log(`✅ Checks Aprovados: ${response.data.overall.passedChecks}`);
          console.log(`❌ Checks Falharam: ${response.data.overall.failedChecks}`);
          console.log(`⚠️  Checks com Aviso: ${response.data.overall.warningChecks}`);
        }
        
        if (response.data.responseTime) {
          console.log(`⚡ Tempo de Resposta: ${response.data.responseTime}ms`);
        }
        
        if (response.data.checks) {
          console.log('\n🔍 ===========================================');
          console.log('   DETALHES DOS COMPONENTES');
          console.log('===========================================');
          Object.entries(response.data.checks).forEach(([checkName, checkResult]) => {
            const icon = checkResult.status === 'pass' ? '✅' : 
                        checkResult.status === 'warn' ? '⚠️' : '❌';
            const statusText = checkResult.status === 'pass' ? 'APROVADO' : 
                              checkResult.status === 'warn' ? 'AVISO' : 'FALHOU';
            console.log(`${icon} ${checkName.toUpperCase()}: ${statusText}`);
            console.log(`   📝 ${checkResult.message}`);
            console.log(`   ⏱️  Tempo: ${checkResult.duration}ms\n`);
          });
        }
      }
      
    } catch (error) {
      console.log('\n❌ ===========================================');
      console.log('   ERRO NO TESTE');
      console.log('===========================================');
      console.log(`💥 Erro: ${error.message}`);
      console.log('===========================================\n');
    }
  }
  
  console.log('\n🏁 ===========================================');
  console.log('   TESTE CONCLUÍDO!');
  console.log('===========================================\n');
}

// Executar teste
const baseUrl = process.argv[2] || DEFAULT_URL;
testHealthCheck(baseUrl).catch(console.error);
