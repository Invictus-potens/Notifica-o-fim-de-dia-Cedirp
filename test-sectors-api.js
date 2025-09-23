/**
 * Teste da API de setores
 * Verifica se a API está retornando os setores corretamente
 */

async function testSectorsApi() {
    console.log('🧪 TESTE: API de Setores\n');
    
    try {
        // 1. Testar API de setores
        console.log('📋 1. Testando API /api/sectors...');
        
        const response = await fetch('http://localhost:3000/api/sectors');
        const result = await response.json();
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${result.success}`);
        console.log(`   Total: ${result.total || 0}`);
        console.log(`   Data length: ${result.data?.length || 0}`);
        
        if (response.ok && result.success) {
            console.log('✅ API de setores funcionando!');
            
            // Mostrar alguns setores como exemplo
            if (result.data && result.data.length > 0) {
                console.log('\n📋 2. Primeiros 5 setores encontrados:');
                result.data.slice(0, 5).forEach((sector, index) => {
                    console.log(`   ${index + 1}. ${sector.name} (ID: ${sector.id})`);
                });
                
                if (result.data.length > 5) {
                    console.log(`   ... e mais ${result.data.length - 5} setores`);
                }
            } else {
                console.log('⚠️ Nenhum setor encontrado na API');
            }
            
            // Verificar estrutura dos dados
            console.log('\n📋 3. Verificando estrutura dos dados...');
            if (result.data && result.data.length > 0) {
                const firstSector = result.data[0];
                console.log(`   Estrutura do primeiro setor:`);
                console.log(`   - id: ${firstSector.id}`);
                console.log(`   - name: ${firstSector.name}`);
                console.log(`   - description: ${firstSector.description || 'N/A'}`);
                console.log(`   - active: ${firstSector.active || 'N/A'}`);
            }
            
        } else {
            console.log('❌ Erro na API de setores:');
            console.log(`   Erro: ${result.error || 'Erro desconhecido'}`);
            console.log(`   Mensagem: ${result.message || 'N/A'}`);
        }
        
        // 2. Testar se o servidor está rodando
        console.log('\n📋 4. Verificando se o servidor está rodando...');
        
        try {
            const healthResponse = await fetch('http://localhost:3000/health');
            if (healthResponse.ok) {
                console.log('✅ Servidor está rodando');
            } else {
                console.log('⚠️ Servidor respondeu com erro');
            }
        } catch (healthError) {
            console.log('❌ Servidor não está rodando ou não acessível');
            console.log(`   Erro: ${healthError.message}`);
        }
        
        // 3. Resumo final
        console.log('\n✅ TESTE DE API DE SETORES CONCLUÍDO!');
        
        if (response.ok && result.success && result.data && result.data.length > 0) {
            console.log('\n🎉 API DE SETORES: 100% FUNCIONAL!');
            console.log(`✅ ${result.data.length} setores encontrados`);
            console.log('✅ Estrutura de dados correta');
            console.log('✅ Pronto para usar no filtro de setores');
        } else {
            console.log('\n⚠️ API DE SETORES: COM PROBLEMAS!');
            console.log('❌ Verifique se o servidor está rodando');
            console.log('❌ Verifique se a API CAM Krolik está configurada');
            console.log('❌ Verifique os tokens no arquivo .env');
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Executar teste
testSectorsApi();
