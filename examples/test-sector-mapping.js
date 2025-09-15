/**
 * Exemplo de teste para verificar o mapeamento de setores
 * 
 * Este exemplo testa se os setores estão sendo mapeados corretamente
 * na conversão de pacientes e compara com os dados estáticos.
 */

const axios = require('axios');

// Configuração da API local
const LOCAL_API_CONFIG = {
  baseUrl: 'http://localhost:3000'
};

/**
 * Testa o mapeamento de setores nos pacientes
 */
async function testSectorMapping() {
  try {
    console.log('🧪 Testando mapeamento de setores...');
    
    // Buscar pacientes
    const patientsResponse = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/patients`);
    const patients = patientsResponse.data.patients;
    
    console.log(`📋 Total de pacientes: ${patients.length}`);
    
    if (patients.length === 0) {
      console.log('⚠️ Nenhum paciente encontrado para teste');
      return;
    }
    
    console.log('\n📋 Análise de setores por paciente:');
    
    const sectorIds = new Set();
    const sectorNames = new Set();
    
    patients.forEach((patient, index) => {
      console.log(`\n👤 Paciente ${index + 1}: ${patient.name}`);
      console.log(`   ID: ${patient.id}`);
      console.log(`   SectorId: ${patient.sectorId}`);
      console.log(`   SectorName: ${patient.sectorName}`);
      
      sectorIds.add(patient.sectorId);
      sectorNames.add(patient.sectorName);
    });
    
    console.log('\n📊 Resumo de setores únicos:');
    console.log(`   Total de sectorIds únicos: ${sectorIds.size}`);
    console.log(`   Total de sectorNames únicos: ${sectorNames.size}`);
    
    console.log('\n🔍 SectorIds encontrados:');
    Array.from(sectorIds).forEach(id => {
      console.log(`   - ${id}`);
    });
    
    console.log('\n🔍 SectorNames encontrados:');
    Array.from(sectorNames).forEach(name => {
      console.log(`   - "${name}"`);
    });
    
    // Verificar se há setores não identificados
    const unidentifiedSectors = Array.from(sectorNames).filter(name => 
      name === 'Setor não identificado'
    );
    
    if (unidentifiedSectors.length > 0) {
      console.log('\n❌ PROBLEMA DETECTADO:');
      console.log(`   ${unidentifiedSectors.length} setores aparecem como "Setor não identificado"`);
      console.log('   Isso indica que os sectorIds não estão sendo encontrados nos dados estáticos');
    } else {
      console.log('\n✅ Todos os setores foram identificados corretamente');
    }

  } catch (error) {
    console.error('❌ Erro ao testar mapeamento de setores:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Testa a busca de setores na API
 */
async function testSectorsApi() {
  try {
    console.log('🧪 Testando API de setores...');
    
    const response = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/sectors`);
    const sectors = response.data.sectors;
    
    console.log(`📋 Total de setores na API: ${sectors.length}`);
    
    if (sectors.length > 0) {
      console.log('\n📋 Primeiros 5 setores:');
      sectors.slice(0, 5).forEach((sector, index) => {
        console.log(`   ${index + 1}. ${sector.name} (ID: ${sector.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao testar API de setores:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Compara setores dos pacientes com setores da API
 */
async function compareSectorsWithApi() {
  try {
    console.log('🧪 Comparando setores dos pacientes com API...');
    
    // Buscar pacientes
    const patientsResponse = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/patients`);
    const patients = patientsResponse.data.patients;
    
    // Buscar setores da API
    const sectorsResponse = await axios.get(`${LOCAL_API_CONFIG.baseUrl}/api/sectors`);
    const apiSectors = sectorsResponse.data.sectors;
    
    // Criar mapa de setores da API
    const apiSectorsMap = new Map();
    apiSectors.forEach(sector => {
      apiSectorsMap.set(sector.id, sector.name);
    });
    
    console.log(`📋 Pacientes: ${patients.length}`);
    console.log(`📋 Setores na API: ${apiSectors.length}`);
    
    // Verificar cada paciente
    const unmatchedSectors = [];
    
    patients.forEach(patient => {
      const apiSectorName = apiSectorsMap.get(patient.sectorId);
      
      if (!apiSectorName) {
        unmatchedSectors.push({
          patientName: patient.name,
          sectorId: patient.sectorId,
          currentSectorName: patient.sectorName
        });
      }
    });
    
    if (unmatchedSectors.length > 0) {
      console.log('\n❌ Setores não encontrados na API:');
      unmatchedSectors.forEach(item => {
        console.log(`   Paciente: ${item.patientName}`);
        console.log(`   SectorId: ${item.sectorId}`);
        console.log(`   Nome atual: ${item.currentSectorName}`);
        console.log('   ---');
      });
      
      console.log('\n💡 SOLUÇÃO:');
      console.log('   Os sectorIds dos pacientes não estão presentes nos dados estáticos');
      console.log('   É necessário atualizar o arquivo src/data/sectors.ts com os novos setores');
    } else {
      console.log('\n✅ Todos os setores dos pacientes foram encontrados na API');
    }

  } catch (error) {
    console.error('❌ Erro ao comparar setores:');
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📋 Dados:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`📋 Erro: ${error.message}`);
    }
  }
}

/**
 * Executa todos os testes de setores
 */
async function runSectorTests() {
  console.log('🧪 ===========================================');
  console.log('   TESTE DE MAPEAMENTO DE SETORES');
  console.log('===========================================\n');

  await testSectorMapping();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testSectorsApi();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await compareSectorsWithApi();
  
  console.log('\n🎉 Testes de setores concluídos!');
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  runSectorTests().catch(console.error);
}

module.exports = {
  testSectorMapping,
  testSectorsApi,
  compareSectorsWithApi,
  runSectorTests
};
