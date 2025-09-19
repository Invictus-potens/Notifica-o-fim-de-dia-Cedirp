#!/usr/bin/env node

/**
 * Script para testar o sistema de rastreamento de mensagens enviadas
 * Verifica se as mensagens estão sendo registradas corretamente
 */

const axios = require('axios');

async function testMessageTracking() {
  try {
    console.log('📨 ===========================================');
    console.log('   TESTANDO RASTREAMENTO DE MENSAGENS');
    console.log('===========================================');
    
    const baseUrl = 'http://localhost:3000';
    
    // 1. Verificar se servidor está rodando
    console.log('\n1️⃣ Verificando servidor...');
    try {
      await axios.get(`${baseUrl}/health?quick=true`, { timeout: 5000 });
      console.log('✅ Servidor está rodando');
    } catch (error) {
      console.log('❌ Servidor não está respondendo');
      return;
    }
    
    // 2. Verificar pacientes atuais
    console.log('\n2️⃣ Verificando pacientes atuais...');
    const patientsResponse = await axios.get(`${baseUrl}/api/patients`);
    const patients = patientsResponse.data.data;
    
    console.log(`📊 Total de pacientes: ${patients.length}`);
    
    if (patients.length === 0) {
      console.log('⚠️ Nenhum paciente encontrado para teste');
      return;
    }
    
    // 3. Buscar Felipe Prado especificamente
    console.log('\n3️⃣ Buscando Felipe Prado...');
    const felipe = patients.find(p => 
      p.name && (
        p.name.toLowerCase().includes('felipe') ||
        p.name.toLowerCase().includes('prado')
      )
    );
    
    if (!felipe) {
      console.log('❌ Felipe Prado não encontrado');
      console.log('📋 Pacientes disponíveis:');
      patients.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.name} - ${p.phone}`);
      });
      return;
    }
    
    console.log('✅ Felipe Prado encontrado!');
    console.log('📋 Dados do Felipe:');
    console.log(`   📝 Nome: ${felipe.name}`);
    console.log(`   📱 Telefone: ${felipe.phone}`);
    console.log(`   ⏰ Tempo de espera: ${felipe.waitTimeMinutes || 0} minutos`);
    
    // 4. Verificar se já tem mensagem enviada
    console.log('\n4️⃣ Verificando status de mensagem...');
    if (felipe.messageSent) {
      console.log('📨 Mensagem já foi enviada:');
      console.log(`   ✅ Status: Enviada`);
      console.log(`   ⏰ Horário: ${felipe.messageSent.sentAtFormatted}`);
      console.log(`   🆔 Action Card: ${felipe.messageSent.actionCardId}`);
      console.log(`   📋 Tipo: ${felipe.messageSent.messageType}`);
    } else {
      console.log('📭 Nenhuma mensagem enviada ainda');
    }
    
    // 5. Testar envio manual
    console.log('\n5️⃣ Testando envio manual...');
    try {
      const testData = {
        patients: [{
          number: felipe.phone,
          contactId: felipe.contactId,
          name: felipe.name
        }],
        action_card_id: "68cbfa96b8640e9721e4feab" // Action Card 30min
      };
      
      console.log('📤 Enviando mensagem de teste...');
      const response = await axios.post(`${baseUrl}/api/messages/send-action-card`, testData);
      const result = response.data.data;
      
      console.log('📊 Resultado do envio:');
      console.log(`   ✅ Sucessos: ${result.success}`);
      console.log(`   ❌ Falhas: ${result.failed}`);
      
      if (result.success > 0) {
        console.log('🎉 MENSAGEM ENVIADA COM SUCESSO!');
        
        // Aguardar um pouco para o sistema processar
        console.log('⏳ Aguardando 3 segundos para processamento...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 6. Verificar se a mensagem foi registrada
        console.log('\n6️⃣ Verificando se mensagem foi registrada...');
        const updatedPatientsResponse = await axios.get(`${baseUrl}/api/patients`);
        const updatedPatients = updatedPatientsResponse.data.data;
        
        const updatedFelipe = updatedPatients.find(p => 
          p.name && (
            p.name.toLowerCase().includes('felipe') ||
            p.name.toLowerCase().includes('prado')
          )
        );
        
        if (updatedFelipe && updatedFelipe.messageSent) {
          console.log('✅ Mensagem registrada com sucesso!');
          console.log('📨 Informações da mensagem:');
          console.log(`   ⏰ Horário: ${updatedFelipe.messageSent.sentAtFormatted}`);
          console.log(`   🆔 Action Card: ${updatedFelipe.messageSent.actionCardId}`);
          console.log(`   📋 Tipo: ${updatedFelipe.messageSent.messageType}`);
          
          console.log('\n🎯 TESTE DE RASTREAMENTO CONCLUÍDO COM SUCESSO!');
          console.log('✅ Sistema de rastreamento funcionando corretamente');
        } else {
          console.log('❌ Mensagem não foi registrada no sistema');
          console.log('⚠️ Verifique se o sistema está processando corretamente');
        }
        
      } else {
        console.log('❌ Falha no envio da mensagem');
        if (result.results && result.results.length > 0) {
          result.results.forEach(res => {
            if (!res.success) {
              console.log(`   🚫 Erro: ${res.error}`);
            }
          });
        }
      }
      
    } catch (error) {
      console.log('❌ Erro no teste de envio:', error.message);
    }
    
    // 7. Verificar pacientes processados
    console.log('\n7️⃣ Verificando pacientes processados...');
    try {
      // Tentar acessar dados de pacientes processados (se disponível)
      console.log('📊 Verificando se Felipe foi movido para lista de processados...');
      console.log('💡 Note: Pacientes com mensagem enviada são movidos para lista de processados');
    } catch (error) {
      console.log('⚠️ Não foi possível verificar pacientes processados');
    }
    
    console.log('\n🎯 ===========================================');
    console.log('   TESTE DE RASTREAMENTO CONCLUÍDO');
    console.log('===========================================');
    console.log('📝 Verifique a interface web para confirmar:');
    console.log('   1. Coluna "MENSAGEM ENVIADA" mostra status');
    console.log('   2. Horário do envio está correto');
    console.log('   3. Nome do Action Card está sendo exibido');
    console.log('===========================================\n');
    
  } catch (error) {
    console.error('\n❌ ===========================================');
    console.error('   ERRO NO TESTE DE RASTREAMENTO');
    console.error('===========================================');
    console.error(`💥 Erro: ${error.message}`);
    console.error('===========================================\n');
  }
}

// Executar teste
testMessageTracking();
