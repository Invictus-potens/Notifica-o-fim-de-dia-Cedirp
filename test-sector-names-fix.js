/**
 * Teste da correção dos nomes dos setores
 */

// Carregar variáveis de ambiente primeiro
require('dotenv').config();

const { MainController } = require('./src/controllers/MainController');

async function testSectorNamesFix() {
  console.log('🧪 TESTE DA CORREÇÃO DOS NOMES DOS SETORES\n');
  
  try {
    // Inicializar MainController
    console.log('📋 Inicializando MainController...');
    const mainController = new MainController();
    await mainController.initialize();
    console.log('✅ MainController inicializado');
    
    // Teste 1: Verificar setores da API
    console.log('\n📋 Teste 1: Verificar setores da API');
    const { KrolikApiClient } = require('./src/services/KrolikApiClient');
    const apiClient = new KrolikApiClient(
      process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com.br',
      process.env.TOKEN_WHATSAPP_OFICIAL || '65f06d5b867543e1d094fa0f'
    );
    
    const sectors = await apiClient.listSectors();
    console.log(`✅ ${sectors.length} setores encontrados na API:`);
    
    // Mostrar alguns setores como exemplo
    sectors.slice(0, 5).forEach(sector => {
      console.log(`   📍 ID: ${sector.id}`);
      console.log(`   📍 Nome: ${sector.name}`);
      console.log('   ---');
    });
    
    // Teste 2: Verificar pacientes com nomes de setores corrigidos
    console.log('\n📋 Teste 2: Verificar pacientes com nomes de setores corrigidos');
    const patients = await apiClient.listWaitingAttendances();
    console.log(`✅ ${patients.length} pacientes encontrados:`);
    
    // Mostrar alguns pacientes como exemplo
    patients.slice(0, 5).forEach(patient => {
      console.log(`   👤 Nome: ${patient.name}`);
      console.log(`   📍 Setor ID: ${patient.sectorId}`);
      console.log(`   📍 Setor Nome: ${patient.sectorName}`);
      console.log('   ---');
    });
    
    // Teste 3: Verificar se nomes correspondem
    console.log('\n📋 Teste 3: Verificar se nomes correspondem entre API e pacientes');
    
    // Criar mapa de setores
    const sectorMap = new Map();
    sectors.forEach(sector => {
      sectorMap.set(sector.id, sector.name);
    });
    
    let correctNames = 0;
    let incorrectNames = 0;
    
    patients.forEach(patient => {
      const expectedName = sectorMap.get(patient.sectorId);
      if (expectedName && patient.sectorName === expectedName) {
        correctNames++;
      } else {
        incorrectNames++;
        console.log(`   ❌ Paciente ${patient.name}:`);
        console.log(`      Setor ID: ${patient.sectorId}`);
        console.log(`      Nome esperado: ${expectedName || 'N/A'}`);
        console.log(`      Nome atual: ${patient.sectorName}`);
      }
    });
    
    console.log(`\n✅ Resultado da verificação:`);
    console.log(`   Nomes corretos: ${correctNames}`);
    console.log(`   Nomes incorretos: ${incorrectNames}`);
    console.log(`   Taxa de acerto: ${((correctNames / patients.length) * 100).toFixed(1)}%`);
    
    // Teste 4: Verificar se nomes são consistentes com lista de exclusão
    console.log('\n📋 Teste 4: Verificar consistência com lista de exclusão');
    
    // Simular setores que apareceriam na lista de exclusão
    const exclusionSectors = patients.map(p => ({
      id: p.sectorId,
      name: p.sectorName
    }));
    
    // Remover duplicatas
    const uniqueExclusionSectors = exclusionSectors.filter((sector, index, self) => 
      index === self.findIndex(s => s.id === sector.id)
    );
    
    console.log(`✅ Setores únicos que apareceriam na lista de exclusão:`);
    uniqueExclusionSectors.slice(0, 5).forEach(sector => {
      console.log(`   📍 ${sector.name} (ID: ${sector.id})`);
    });
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    
    if (incorrectNames === 0) {
      console.log('✅ Todos os nomes dos setores estão corretos!');
      console.log('✅ Os nomes na lista de atendimentos correspondem aos da lista de exclusão!');
    } else {
      console.log('⚠️ Alguns nomes ainda precisam ser corrigidos.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error.stack);
  }
}

// Executar teste
testSectorNamesFix();
