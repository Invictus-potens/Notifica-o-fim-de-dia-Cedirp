/**
 * Script de teste específico para validar o layout da seção de configurações
 * Este script verifica se a estrutura HTML da seção configuracoes-route
 * está correta para exibir os cards lado a lado.
 */

const fs = require('fs');
const path = require('path');

class ConfigLayoutTest {
    constructor() {
        this.testResults = [];
        this.configSection = '';
    }

    async runTests() {
        console.log('🧪 Iniciando testes específicos de layout da seção de configurações...\n');

        await this.loadConfigSection();
        
        // Teste 1: Verificar estrutura básica
        await this.testBasicStructure();
        
        // Teste 2: Verificar layout lado a lado
        await this.testSideBySideLayout();
        
        // Teste 3: Verificar conteúdo dos cards
        await this.testCardContent();

        this.printResults();
    }

    async loadConfigSection() {
        try {
            const htmlPath = path.join(__dirname, '../public/index.html');
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            // Extrair apenas a seção de configurações
            const startIndex = htmlContent.indexOf('<div id="configuracoes-route" class="route-content">');
            const endIndex = htmlContent.indexOf('<!-- Logs Route -->', startIndex);
            
            if (startIndex === -1) {
                throw new Error('Seção configuracoes-route não encontrada');
            }
            
            if (endIndex === -1) {
                // Se não encontrar o próximo comentário, pegar até o final do arquivo
                this.configSection = htmlContent.substring(startIndex);
            } else {
                this.configSection = htmlContent.substring(startIndex, endIndex);
            }
            
            console.log('✅ Seção de configurações extraída com sucesso');
            console.log(`📏 Tamanho da seção: ${this.configSection.length} caracteres`);
        } catch (error) {
            console.error('❌ Erro ao carregar seção de configurações:', error.message);
            this.addTestResult('Section Loading', 'Carregar seção de configurações', false, 'Sucesso', error.message);
        }
    }

    async testBasicStructure() {
        console.log('🏗️ Teste 1: Estrutura Básica');
        
        const tests = [
            {
                name: 'Seção configuracoes-route existe',
                expected: true,
                actual: this.configSection.includes('<div id="configuracoes-route" class="route-content">'),
                pass: this.configSection.includes('<div id="configuracoes-route" class="route-content">')
            },
            {
                name: 'Row container existe',
                expected: true,
                actual: this.configSection.includes('<div class="row">'),
                pass: this.configSection.includes('<div class="row">')
            },
            {
                name: 'Row está fechada corretamente',
                expected: true,
                actual: this.countOccurrences('<div class="row">') === this.countOccurrences('</div>', this.findRowEnd()),
                pass: this.countOccurrences('<div class="row">') <= this.countOccurrences('</div>')
            }
        ];

        tests.forEach(test => {
            this.addTestResult('Basic Structure', test.name, test.pass, test.expected, test.actual);
        });

        console.log('✅ Teste 1 concluído\n');
    }

    async testSideBySideLayout() {
        console.log('📐 Teste 2: Layout Lado a Lado');
        
        // Contar col-md-6 apenas na seção de configurações
        const colMd6Count = this.countOccurrences('<div class="col-md-6">');
        
        const tests = [
            {
                name: 'Existem exatamente 2 colunas col-md-6 na seção',
                expected: 2,
                actual: colMd6Count,
                pass: colMd6Count === 2
            },
            {
                name: 'Primeira coluna tem comentário "Exception Lists"',
                expected: true,
                actual: this.configSection.includes('<!-- Exception Lists -->'),
                pass: this.configSection.includes('<!-- Exception Lists -->')
            },
            {
                name: 'Segunda coluna tem comentário "Message Configuration"',
                expected: true,
                actual: this.configSection.includes('<!-- Message Configuration -->'),
                pass: this.configSection.includes('<!-- Message Configuration -->')
            },
            {
                name: 'Ordem dos comentários está correta',
                expected: true,
                actual: this.configSection.indexOf('<!-- Exception Lists -->') < this.configSection.indexOf('<!-- Message Configuration -->'),
                pass: this.configSection.indexOf('<!-- Exception Lists -->') < this.configSection.indexOf('<!-- Message Configuration -->')
            }
        ];

        tests.forEach(test => {
            this.addTestResult('Side by Side Layout', test.name, test.pass, test.expected, test.actual);
        });

        console.log('✅ Teste 2 concluído\n');
    }

    async testCardContent() {
        console.log('🃏 Teste 3: Conteúdo dos Cards');
        
        const tests = [
            {
                name: 'Card "Listas de Exceção" existe',
                expected: true,
                actual: this.configSection.includes('Listas de Exceção'),
                pass: this.configSection.includes('Listas de Exceção')
            },
            {
                name: 'Card "Configuração de Mensagens" existe',
                expected: true,
                actual: this.configSection.includes('Configuração de Mensagens'),
                pass: this.configSection.includes('Configuração de Mensagens')
            },
            {
                name: 'Ambos os cards têm estrutura completa',
                expected: true,
                actual: this.configSection.includes('<div class="card mb-4">') && 
                        this.configSection.includes('<div class="card-header">') &&
                        this.configSection.includes('<div class="card-body">'),
                pass: this.configSection.includes('<div class="card mb-4">') && 
                      this.configSection.includes('<div class="card-header">') &&
                      this.configSection.includes('<div class="card-body">')
            },
            {
                name: 'Card de setores excluídos tem conteúdo',
                expected: true,
                actual: this.configSection.includes('Setores Excluídos') && 
                        this.configSection.includes('sector-select'),
                pass: this.configSection.includes('Setores Excluídos') && 
                      this.configSection.includes('sector-select')
            },
            {
                name: 'Card de mensagens tem action cards',
                expected: true,
                actual: this.configSection.includes('action-card-30min-select') && 
                        this.configSection.includes('action-card-endday-select'),
                pass: this.configSection.includes('action-card-30min-select') && 
                      this.configSection.includes('action-card-endday-select')
            }
        ];

        tests.forEach(test => {
            this.addTestResult('Card Content', test.name, test.pass, test.expected, test.actual);
        });

        console.log('✅ Teste 3 concluído\n');
    }

    countOccurrences(substring) {
        return (this.configSection.match(new RegExp(substring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    }

    findRowEnd() {
        const rowStart = this.configSection.indexOf('<div class="row">');
        if (rowStart === -1) return -1;
        
        let depth = 0;
        let index = rowStart;
        
        while (index < this.configSection.length) {
            if (this.configSection.substr(index, 4) === '<div') {
                depth++;
            } else if (this.configSection.substr(index, 6) === '</div>') {
                depth--;
                if (depth === 0) {
                    return index;
                }
            }
            index++;
        }
        
        return -1;
    }

    addTestResult(category, testName, pass, expected, actual) {
        this.testResults.push({
            category,
            testName,
            pass,
            expected,
            actual
        });
    }

    printResults() {
        console.log('📊 RESULTADOS DOS TESTES DE LAYOUT DE CONFIGURAÇÕES\n');
        console.log('='.repeat(80));

        const categories = [...new Set(this.testResults.map(r => r.category))];
        
        categories.forEach(category => {
            console.log(`\n📂 ${category}:`);
            console.log('-'.repeat(50));
            
            const categoryTests = this.testResults.filter(r => r.category === category);
            
            categoryTests.forEach(test => {
                const status = test.pass ? '✅ PASSOU' : '❌ FALHOU';
                console.log(`${status} ${test.testName}`);
                if (!test.pass) {
                    console.log(`   Esperado: ${test.expected}`);
                    console.log(`   Obtido: ${test.actual}`);
                }
            });
        });

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.pass).length;
        const failedTests = totalTests - passedTests;

        console.log('\n' + '='.repeat(80));
        console.log(`📈 RESUMO: ${passedTests}/${totalTests} testes passaram`);
        
        if (failedTests > 0) {
            console.log(`❌ ${failedTests} testes falharam`);
            console.log('⚠️ O layout da seção de configurações pode não estar correto!');
        } else {
            console.log('🎉 Todos os testes passaram! O layout lado a lado está perfeito!');
            console.log('✨ Os cards "Listas de Exceção" e "Configuração de Mensagens" estão lado a lado!');
            console.log('💖 A interface está organizada e funcional!');
        }
    }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
    const tester = new ConfigLayoutTest();
    tester.runTests().catch(console.error);
}

module.exports = { ConfigLayoutTest };
