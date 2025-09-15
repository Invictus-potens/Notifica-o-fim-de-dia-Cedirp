/**
 * Teste específico para verificar se há um bug na função sanitizeData
 */

const { sanitizeData } = require('../dist/utils/ValidationUtils');

/**
 * Testa se há um bug específico na sanitização
 */
function testSanitizeBug() {
  console.log('🧪 Testando bug específico na sanitização...');
  
  // Payload exato que está sendo enviado
  const originalPayload = {
    number: '16981892476',
    contactId: '68c8490b633da7451787ba9d',
    templateId: '6878d983011d14f8e3ed6771',
    templateComponents: [],
    forceSend: true,
    verifyContact: true
  };
  
  console.log('📤 Payload original:');
  console.log(JSON.stringify(originalPayload, null, 2));
  
  const sanitizedPayload = sanitizeData(originalPayload);
  
  console.log('\n🧹 Payload sanitizado:');
  console.log(JSON.stringify(sanitizedPayload, null, 2));
  
  // Verificar se há algum problema específico
  console.log('\n🔍 Verificações críticas:');
  console.log(`   originalPayload.number = "${originalPayload.number}"`);
  console.log(`   sanitizedPayload.number = "${sanitizedPayload.number}"`);
  console.log(`   originalPayload.contactId = "${originalPayload.contactId}"`);
  console.log(`   sanitizedPayload.contactId = "${sanitizedPayload.contactId}"`);
  
  // Verificar se os valores foram trocados
  if (sanitizedPayload.number === originalPayload.contactId) {
    console.log('❌ BUG ENCONTRADO: O campo number foi substituído pelo contactId!');
    console.log('   Isso explicaria o erro "INVALID_WA_NUMBER"');
  } else if (sanitizedPayload.contactId === originalPayload.number) {
    console.log('❌ BUG ENCONTRADO: O campo contactId foi substituído pelo number!');
  } else {
    console.log('✅ Os campos estão corretos após sanitização');
  }
  
  // Verificar se há algum problema com a ordem dos campos
  const originalKeys = Object.keys(originalPayload);
  const sanitizedKeys = Object.keys(sanitizedPayload);
  
  console.log('\n🔍 Verificação de chaves:');
  console.log(`   Chaves originais: ${originalKeys.join(', ')}`);
  console.log(`   Chaves sanitizadas: ${sanitizedKeys.join(', ')}`);
  
  if (originalKeys.length !== sanitizedKeys.length) {
    console.log('❌ PROBLEMA: Número de chaves diferente após sanitização');
  }
  
  // Verificar se há algum problema com valores específicos
  console.log('\n🔍 Verificação de valores específicos:');
  console.log(`   number é string? ${typeof sanitizedPayload.number === 'string'}`);
  console.log(`   number tem conteúdo? ${sanitizedPayload.number && sanitizedPayload.number.length > 0}`);
  console.log(`   contactId é string? ${typeof sanitizedPayload.contactId === 'string'}`);
  console.log(`   contactId tem conteúdo? ${sanitizedPayload.contactId && sanitizedPayload.contactId.length > 0}`);
  
  // Verificar se o number contém um ID MongoDB
  if (sanitizedPayload.number && sanitizedPayload.number.match(/^[a-f0-9]{24}$/)) {
    console.log('❌ PROBLEMA CRÍTICO: O campo number contém um ID MongoDB!');
    console.log('   Isso explicaria o erro "INVALID_WA_NUMBER"');
  }
  
  // Verificar se o contactId contém um número de telefone
  if (sanitizedPayload.contactId && sanitizedPayload.contactId.match(/^\d+$/)) {
    console.log('❌ PROBLEMA CRÍTICO: O campo contactId contém um número de telefone!');
  }
}

/**
 * Testa com diferentes implementações de sanitização
 */
function testDifferentSanitizationApproaches() {
  console.log('\n🧪 Testando diferentes abordagens de sanitização...');
  
  const testPayload = {
    number: '16981892476',
    contactId: '68c8490b633da7451787ba9d',
    templateId: '6878d983011d14f8e3ed6771',
    templateComponents: [],
    forceSend: true,
    verifyContact: true
  };
  
  // Abordagem 1: Sanitização normal
  console.log('\n📋 Abordagem 1: Sanitização normal');
  const sanitized1 = sanitizeData(testPayload);
  console.log(`   number: "${sanitized1.number}"`);
  console.log(`   contactId: "${sanitized1.contactId}"`);
  
  // Abordagem 2: Sem sanitização
  console.log('\n📋 Abordagem 2: Sem sanitização');
  const sanitized2 = testPayload; // Sem sanitização
  console.log(`   number: "${sanitized2.number}"`);
  console.log(`   contactId: "${sanitized2.contactId}"`);
  
  // Abordagem 3: Sanitização manual
  console.log('\n📋 Abordagem 3: Sanitização manual');
  const sanitized3 = {
    number: testPayload.number.toString().trim(),
    contactId: testPayload.contactId.toString().trim(),
    templateId: testPayload.templateId.toString().trim(),
    templateComponents: testPayload.templateComponents,
    forceSend: testPayload.forceSend,
    verifyContact: testPayload.verifyContact
  };
  console.log(`   number: "${sanitized3.number}"`);
  console.log(`   contactId: "${sanitized3.contactId}"`);
}

// Executar testes se este arquivo for executado diretamente
if (require.main === module) {
  testSanitizeBug();
  testDifferentSanitizationApproaches();
}

module.exports = {
  testSanitizeBug,
  testDifferentSanitizationApproaches
};
