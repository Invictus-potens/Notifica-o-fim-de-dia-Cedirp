#!/usr/bin/env node

/**
 * Script para debugar por que a coluna "MENSAGEM ENVIADA" está vazia
 * Verifica se é erro de código ou se realmente não há mensagens enviadas
 */

const axios = require('axios');

async function debugMessageSent() {
  try {
    console.log('🔍 ===========================================');
    console.log('   DEBUGANDO COLUNA "MENSAGEM ENVIADA"');
    console.log('===========================================');
    
    const baseUrl = 'http://localhost:48026';
    
    // 1. Verificar se servidor está rodando
    console.log('\n1️⃣ Verificando servidor...');
    try {
      await axios.get(`${baseUrl}/health?quick=true`, { timeout: 5000 });
      console.log('✅ Servidor está rodando');
    } catch (error) {
      console.log('❌ Servidor não está respondendo');
      return;
    }
    
    // 2. Buscar pacientes e verificar estrutura de dados
    console.log('\n2️⃣ Analisando estrutura de dados dos pacientes...');
    const patientsResponse = await axios.get(`${baseUrl}/api/patients`);
    const patients = patientsResponse.data.data;
    
    console.log(`📊 Total de pacientes: ${patients.length}`);
    
    if (patients.length === 0) {
      console.log('⚠️ Nenhum paciente encontrado');
      return;
    }
    
    // 3. Verificar estrutura de dados do primeiro paciente
    console.log('\n3️⃣ Estrutura de dados do primeiro paciente:');
    const firstPatient = patients[0];
    console.log('📋 Propriedades disponíveis:');
    Object.keys(firstPatient).forEach(key => {
      console.log(`   - ${key}: ${typeof firstPatient[key]} = ${JSON.stringify(firstPatient[key])}`);
    });
    
    // 4. Verificar especificamente se há messageSent
    console.log('\n4️⃣ Verificando propriedade messageSent:');
    let patientsWithMessageSent = 0;
    let patientsWithoutMessageSent = 0;
    
    patients.forEach((patient, index) => {
      if (patient.messageSent) {
        patientsWithMessageSent++;
        console.log(`✅ Paciente ${index + 1} (${patient.name}): TEM messageSent`);
        console.log(`   📨 Dados: ${JSON.stringify(patient.messageSent, null, 2)}`);
      } else {
        patientsWithoutMessageSent++;
        console.log(`❌ Paciente ${index + 1} (${patient.name}): NÃO TEM messageSent`);
      }
    });
    
    console.log('\n📊 Resumo:');
    console.log(`   ✅ Com messageSent: ${patientsWithMessageSent}`);
    console.log(`   ❌ Sem messageSent: ${patientsWithoutMessageSent}`);
    
    // 5. Verificar se há pacientes processados
    console.log('\n5️⃣ Verificando se há pacientes processados...');
    try {
      // Tentar acessar dados de pacientes processados
      console.log('💡 Pacientes com mensagens enviadas são movidos para lista de processados');
      console.log('💡 Verifique se há dados em data/patients_processed.json');
    } catch (error) {
      console.log('⚠️ Não foi possível verificar pacientes processados');
    }
    
    // 6. Teste de envio manual para verificar se funciona
    console.log('\n6️⃣ Testando envio manual para verificar funcionamento...');
    if (patients.length > 0) {
      const testPatient = patients[0];
      console.log(`🧪 Testando com: ${testPatient.name}`);
      
      try {
        const testData = {
          patients: [{
            number: testPatient.phone,
            contactId: testPatient.contactId,
            name: testPatient.name
          }],
          action_card_id: "68cbfa96b8640e9721e4feab"
        };
        
        console.log('📤 Enviando mensagem de teste...');
        const response = await axios.post(`${baseUrl}/api/messages/send-action-card`, testData);
        const result = response.data.data;
        
        console.log('📊 Resultado:');
        console.log(`   ✅ Sucessos: ${result.success}`);
        console.log(`   ❌ Falhas: ${result.failed}`);
        
        if (result.success > 0) {
          console.log('🎉 Mensagem enviada com sucesso!');
          console.log('⏳ Aguardando 5 segundos para verificar se foi registrada...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Verificar se foi registrada
          const updatedResponse = await axios.get(`${baseUrl}/api/patients`);
          const updatedPatients = updatedResponse.data.data;
          
          const updatedPatient = updatedPatients.find(p => p.name === testPatient.name);
          if (updatedPatient && updatedPatient.messageSent) {
            console.log('✅ Mensagem foi registrada!');
            console.log(`📨 Dados: ${JSON.stringify(updatedPatient.messageSent, null, 2)}`);
          } else {
            console.log('❌ Mensagem NÃO foi registrada no sistema');
            console.log('🔍 Possível problema no backend');
          }
        }
        
      } catch (error) {
        console.log('❌ Erro no teste:', error.message);
      }
    }
    
    // 7. Verificar arquivos JSON
    console.log('\n7️⃣ Verificando arquivos JSON...');
    try {
      const fs = require('fs');
      const path = require('path');
      
      const dataDir = './data';
      const files = [
        'patients_active.json',
        'patients_processed.json',
        'patients_history.json'
      ];
      
      files.forEach(file => {
        const filePath = path.join(dataDir, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(content);
          console.log(`📄 ${file}: ${Array.isArray(data) ? data.length : 'N/A'} registros`);
          
          // Verificar se algum registro tem messageSent
          if (Array.isArray(data) && data.length > 0) {
            const withMessageSent = data.filter(item => item.messageSent);
            if (withMessageSent.length > 0) {
              console.log(`   ✅ ${withMessageSent.length} registros com messageSent`);
              console.log(`   📨 Exemplo: ${JSON.stringify(withMessageSent[0].messageSent, null, 2)}`);
            } else {
              console.log(`   ❌ Nenhum registro com messageSent`);
            }
          }
        } else {
          console.log(`📄 ${file}: Arquivo não existe`);
        }
      });
      
    } catch (error) {
      console.log('⚠️ Erro ao verificar arquivos:', error.message);
    }
    
    console.log('\n🎯 ===========================================');
    console.log('   DIAGNÓSTICO CONCLUÍDO');
    console.log('===========================================');
    
    if (patientsWithMessageSent === 0) {
      console.log('🔍 CONCLUSÃO: Nenhuma mensagem foi enviada ainda');
      console.log('💡 Isso explica por que a coluna está vazia');
      console.log('📝 Execute um teste de envio para verificar se funciona');
    } else {
      console.log('🔍 CONCLUSÃO: Há mensagens enviadas, mas não estão sendo exibidas');
      console.log('💡 Possível problema no frontend ou na API');
    }
    
    console.log('===========================================\n');
    
  } catch (error) {
    console.error('\n❌ ===========================================');
    console.error('   ERRO NO DEBUG');
    console.error('===========================================');
    console.error(`💥 Erro: ${error.message}`);
    console.error('===========================================\n');
  }
}

// Executar debug
debugMessageSent();
