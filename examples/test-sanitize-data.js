/**
 * Teste para verificar se a função sanitizeData está causando problemas
 */

const { sanitizeData } = require('../dist/utils/ValidationUtils');

/**
 * Testa se a função sanitizeData está trocando os valores
 */
function testSanitizeData() {
  console.log('🧪 Testando função sanitizeData...');
  
  const originalPayload = {
    number: "16981892476",
    contactId: "68c8490b633da7451787ba9d",
    templateId: "6878d983011d14f8e3ed6771",
    templateComponents: [],
    forceSend: true,
    verifyContact: true
  };
  
  console.log('📤 Payload original:');
  console.log(JSON.stringify(originalPayload, null, 2));
  
  const sanitizedPayload = sanitizeData(originalPayload);
  
  console.log('\n🧹 Payload sanitizado:');
  console.log(JSON.stringify(sanitizedPayload, null, 2));
  
  console.log('\n🔍 Comparação:');
  console.log(`   number original: "${originalPayload.number}"`);
  console.log(`   number sanitizado: "${sanitizedPayload.number}"`);
  console.log(`   contactId original: "${originalPayload.contactId}"`);
  console.log(`   contactId sanitizado: "${sanitizedPayload.contactId}"`);
  
  // Verificar se os valores foram trocados
  if (originalPayload.number === sanitizedPayload.number && 
      originalPayload.contactId === sanitizedPayload.contactId) {
    console.log('✅ A função sanitizeData não está trocando os valores');
  } else {
    console.log('❌ PROBLEMA: A função sanitizeData está alterando os valores!');
  }
  
  // Verificar se há algum problema específico
  if (sanitizedPayload.number === originalPayload.contactId) {
    console.log('❌ PROBLEMA CRÍTICO: O campo number foi substituído pelo contactId!');
  }
  
  if (sanitizedPayload.contactId === originalPayload.number) {
    console.log('❌ PROBLEMA CRÍTICO: O campo contactId foi substituído pelo number!');
  }
}

/**
 * Testa com diferentes tipos de dados
 */
function testSanitizeDataWithDifferentTypes() {
  console.log('\n🧪 Testando sanitizeData com diferentes tipos...');
  
  const testCases = [
    {
      name: 'Payload normal',
      data: {
        number: "16981892476",
        contactId: "68c8490b633da7451787ba9d"
      }
    },
    {
      name: 'Payload com strings vazias',
      data: {
        number: "",
        contactId: ""
      }
    },
    {
      name: 'Payload com null',
      data: {
        number: null,
        contactId: null
      }
    },
    {
      name: 'Payload com undefined',
      data: {
        number: undefined,
        contactId: undefined
      }
    },
    {
      name: 'Payload com números',
      data: {
        number: 16981892476,
        contactId: "68c8490b633da7451787ba9d"
      }
    }
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n📋 Testando: ${testCase.name}`);
    console.log(`   Original:`, testCase.data);
    
    const sanitized = sanitizeData(testCase.data);
    console.log(`   Sanitizado:`, sanitized);
    
    // Verificar se os valores foram preservados
    if (testCase.data.number === sanitized.number && 
        testCase.data.contactId === sanitized.contactId) {
      console.log('   ✅ Valores preservados');
    } else {
      console.log('   ❌ Valores alterados');
    }
  });
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  testSanitizeData();
  testSanitizeDataWithDifferentTypes();
}

module.exports = {
  testSanitizeData,
  testSanitizeDataWithDifferentTypes
};
