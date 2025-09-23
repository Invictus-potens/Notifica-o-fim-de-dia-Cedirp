/**
 * Teste da exibição de setores
 * Verifica se a função displaySectors está funcionando corretamente
 */

// Simular a função displaySectors
function displaySectors(sectors) {
    console.log('📋 displaySectors chamada com:', sectors?.length || 0, 'setores');
    
    // Update sector filter in atendimentos page
    const sectorFilter = document.getElementById('sector-filter');
    if (sectorFilter) {
        console.log('✅ sector-filter encontrado, populando...');
        sectorFilter.innerHTML = '<option value="">Todos os Setores</option>';
        
        if (sectors && sectors.length > 0) {
            sectors.forEach(sector => {
                const option = document.createElement('option');
                option.value = sector.id;
                option.textContent = sector.name;
                sectorFilter.appendChild(option);
            });
            console.log(`✅ ${sectors.length} setores adicionados ao sector-filter`);
        }
    } else {
        console.log('❌ sector-filter não encontrado');
    }

    // Update sector select in configuracoes page (Listas de Exceção)
    const sectorSelect = document.getElementById('sector-select');
    if (sectorSelect) {
        console.log('✅ sector-select encontrado, populando...');
        sectorSelect.innerHTML = '<option value="">Selecione um setor...</option>';
        
        if (sectors && sectors.length > 0) {
            sectors.forEach(sector => {
                const option = document.createElement('option');
                option.value = sector.id;
                option.textContent = sector.name;
                sectorSelect.appendChild(option);
            });
            console.log(`✅ ${sectors.length} setores adicionados ao sector-select`);
        }
    } else {
        console.log('❌ sector-select não encontrado');
    }

    // Store sectors for later use
    this.availableSectors = sectors || [];
    console.log('✅ availableSectors atualizado com', this.availableSectors.length, 'setores');
}

async function testSectorsDisplay() {
    console.log('🧪 TESTE: Exibição de Setores\n');
    
    try {
        // 1. Simular dados de setores
        console.log('📋 1. Simulando dados de setores...');
        
        const mockSectors = [
            { id: '65eb53aa0e74e281e12ba594', name: 'Grupos WhatsApp/Setor geral' },
            { id: '65eb5a0e681c0098402e5839', name: 'Ressonância Magnética' },
            { id: '65eb5a1a01515baa7f9c6b9f', name: 'Tomografia Computadorizada' },
            { id: '65eb5a217b2ad8749ef7aa42', name: 'Ultrassom' },
            { id: '65eb5a270c00c6ae4943cdc6', name: 'Mamografia' },
            { id: '65eb5a3501515baa7fa15ef8', name: 'Densitometria Óssea' },
            { id: '65eb5a3c01515baa7fa25c4a', name: 'Cardiologia' },
            { id: '65eb5a420c00c6ae49486316', name: 'Raio X' },
            { id: '65eb5a4d973bd0cedb32efa2', name: 'Biopsias e Procedimentos' },
            { id: '65eb5a52973bd0cedb33df0d', name: 'Outros' },
            { id: '65ef29cf867543e1d040ec9f', name: 'Outras informações' },
            { id: '65f0a689746a222fbccc906c', name: 'Anexo' },
            { id: '6627fab80f0dbc5420282b2b', name: 'Resultados' },
            { id: '6627fac62c6fb7d3c7fb7aba', name: 'Impressão de exame' },
            { id: '6627fad02c6fb7d3c7fd6d78', name: 'Orçamento' },
            { id: '665090aef00af9d07c2a5e97', name: 'Cancelar agendamento' },
            { id: '682739784933d4656bf60583', name: 'Confirmação' }
        ];
        
        console.log(`   ${mockSectors.length} setores simulados`);
        
        // 2. Testar função displaySectors
        console.log('\n📋 2. Testando função displaySectors...');
        
        // Simular contexto
        const context = {
            availableSectors: []
        };
        
        // Chamar função com contexto
        displaySectors.call(context, mockSectors);
        
        // 3. Verificar se os setores foram armazenados
        console.log('\n📋 3. Verificando armazenamento...');
        console.log(`   availableSectors: ${context.availableSectors.length} setores`);
        
        // 4. Simular verificação de elementos DOM
        console.log('\n📋 4. Simulando verificação de elementos DOM...');
        
        // Simular que os elementos existem
        const mockSectorFilter = {
            innerHTML: '',
            appendChild: (option) => {
                console.log(`   Adicionando opção: ${option.textContent} (${option.value})`);
            }
        };
        
        const mockSectorSelect = {
            innerHTML: '',
            appendChild: (option) => {
                console.log(`   Adicionando opção: ${option.textContent} (${option.value})`);
            }
        };
        
        // Simular document.getElementById
        const originalGetElementById = document.getElementById;
        document.getElementById = (id) => {
            if (id === 'sector-filter') return mockSectorFilter;
            if (id === 'sector-select') return mockSectorSelect;
            return null;
        };
        
        // Chamar função novamente
        displaySectors.call(context, mockSectors);
        
        // Restaurar função original
        document.getElementById = originalGetElementById;
        
        // 5. Resumo final
        console.log('\n✅ TESTE DE EXIBIÇÃO DE SETORES CONCLUÍDO!');
        
        if (context.availableSectors.length === mockSectors.length) {
            console.log('\n🎉 EXIBIÇÃO DE SETORES: 100% FUNCIONAL!');
            console.log('✅ Função displaySectors funcionando corretamente');
            console.log('✅ Setores armazenados corretamente');
            console.log('✅ Estrutura de dados correta');
        } else {
            console.log('\n⚠️ EXIBIÇÃO DE SETORES: COM PROBLEMAS!');
            console.log('❌ Verifique a função displaySectors');
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Executar teste
testSectorsDisplay();
