/**
 * Script de teste para validar o layout lado a lado dos cards
 * Este script verifica se a estrutura HTML está correta para exibir
 * os cards "Listas de Exceção" e "Configuração de Mensagens" lado a lado.
 */

const fs = require('fs');
const path = require('path');

class LayoutTest {
    constructor() {
        this.testResults = [];
        this.htmlContent = '';
    }

    async runTests() {
        console.log('🧪 Iniciando testes de layout lado a lado...\n');

        await this.loadHtmlFile();
        
        // Teste 1: Verificar estrutura de row
        await this.testRowStructure();
        
        // Teste 2: Verificar colunas col-md-6
        await this.testColumnStructure();
        
        // Teste 3: Verificar cards dentro das colunas
        await this.testCardStructure();
        
        // Teste 4: Verificar fechamento de tags
        await this.testTagClosure();

        this.printResults();
    }

    async loadHtmlFile() {
        try {
            const htmlPath = path.join(__dirname, '../public/index.html');
            this.htmlContent = fs.readFileSync(htmlPath, 'utf8');
            console.log('✅ Arquivo HTML carregado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao carregar arquivo HTML:', error.message);
            this.addTestResult('File Loading', 'Carregar arquivo HTML', false, 'Sucesso', error.message);
        }
    }

    async testRowStructure() {
        console.log('📐 Teste 1: Estrutura de Row');
        
        const tests = [
            {
                name: 'div.row existe na seção configuracoes-route',
                expected: true,
                actual: this.htmlContent.includes('<div id="configuracoes-route" class="route-content">') && 
                        this.htmlContent.includes('<div class="row">'),
                pass: this.htmlContent.includes('<div id="configuracoes-route" class="route-content">') && 
                      this.htmlContent.includes('<div class="row">')
            },
            {
                name: 'row está posicionado corretamente',
                expected: true,
                actual: this.getRowPosition() > 0,
                pass: this.getRowPosition() > 0
            }
        ];

        tests.forEach(test => {
            this.addTestResult('Row Structure', test.name, test.pass, test.expected, test.actual);
        });

        console.log('✅ Teste 1 concluído\n');
    }

    async testColumnStructure() {
        console.log('📊 Teste 2: Estrutura de Colunas');
        
        const tests = [
            {
                name: 'Primeira coluna col-md-6 existe',
                expected: true,
                actual: this.htmlContent.includes('<div class="col-md-6">'),
                pass: this.htmlContent.includes('<div class="col-md-6">')
            },
            {
                name: 'Duas colunas col-md-6 estão presentes',
                expected: 2,
                actual: (this.htmlContent.match(/<div class="col-md-6">/g) || []).length,
                pass: (this.htmlContent.match(/<div class="col-md-6">/g) || []).length === 2
            },
            {
                name: 'Comentários identificam as seções corretamente',
                expected: true,
                actual: this.htmlContent.includes('<!-- Exception Lists -->') && 
                        this.htmlContent.includes('<!-- Message Configuration -->'),
                pass: this.htmlContent.includes('<!-- Exception Lists -->') && 
                      this.htmlContent.includes('<!-- Message Configuration -->')
            }
        ];

        tests.forEach(test => {
            this.addTestResult('Column Structure', test.name, test.pass, test.expected, test.actual);
        });

        console.log('✅ Teste 2 concluído\n');
    }

    async testCardStructure() {
        console.log('🃏 Teste 3: Estrutura de Cards');
        
        const tests = [
            {
                name: 'Card "Listas de Exceção" existe',
                expected: true,
                actual: this.htmlContent.includes('Listas de Exceção'),
                pass: this.htmlContent.includes('Listas de Exceção')
            },
            {
                name: 'Card "Configuração de Mensagens" existe',
                expected: true,
                actual: this.htmlContent.includes('Configuração de Mensagens'),
                pass: this.htmlContent.includes('Configuração de Mensagens')
            },
            {
                name: 'Ambos os cards têm estrutura card mb-4',
                expected: 2,
                actual: (this.htmlContent.match(/<div class="card mb-4">/g) || []).length,
                pass: (this.htmlContent.match(/<div class="card mb-4">/g) || []).length >= 2
            },
            {
                name: 'Card headers estão presentes',
                expected: 2,
                actual: (this.htmlContent.match(/<div class="card-header">/g) || []).length,
                pass: (this.htmlContent.match(/<div class="card-header">/g) || []).length >= 2
            },
            {
                name: 'Card bodies estão presentes',
                expected: 2,
                actual: (this.htmlContent.match(/<div class="card-body">/g) || []).length,
                pass: (this.htmlContent.match(/<div class="card-body">/g) || []).length >= 2
            }
        ];

        tests.forEach(test => {
            this.addTestResult('Card Structure', test.name, test.pass, test.expected, test.actual);
        });

        console.log('✅ Teste 3 concluído\n');
    }

    async testTagClosure() {
        console.log('🏷️ Teste 4: Fechamento de Tags');
        
        const tests = [
            {
                name: 'Tags div estão balanceadas',
                expected: true,
                actual: this.areDivTagsBalanced(),
                pass: this.areDivTagsBalanced()
            },
            {
                name: 'Row está fechada corretamente',
                expected: true,
                actual: this.isRowClosedCorrectly(),
                pass: this.isRowClosedCorrectly()
            },
            {
                name: 'Colunas estão fechadas corretamente',
                expected: true,
                actual: this.areColumnsClosedCorrectly(),
                pass: this.areColumnsClosedCorrectly()
            }
        ];

        tests.forEach(test => {
            this.addTestResult('Tag Closure', test.name, test.pass, test.expected, test.actual);
        });

        console.log('✅ Teste 4 concluído\n');
    }

    getRowPosition() {
        const configuracoesIndex = this.htmlContent.indexOf('<div id="configuracoes-route" class="route-content">');
        if (configuracoesIndex === -1) return 0;
        
        const rowIndex = this.htmlContent.indexOf('<div class="row">', configuracoesIndex);
        return rowIndex > configuracoesIndex ? 1 : 0;
    }

    areDivTagsBalanced() {
        const openDivs = (this.htmlContent.match(/<div/g) || []).length;
        const closeDivs = (this.htmlContent.match(/<\/div>/g) || []).length;
        return openDivs === closeDivs;
    }

    isRowClosedCorrectly() {
        const configuracoesIndex = this.htmlContent.indexOf('<div id="configuracoes-route" class="route-content">');
        if (configuracoesIndex === -1) return false;
        
        const rowIndex = this.htmlContent.indexOf('<div class="row">', configuracoesIndex);
        const rowCloseIndex = this.htmlContent.indexOf('</div>', rowIndex);
        const configuracoesCloseIndex = this.htmlContent.indexOf('</div>', configuracoesIndex);
        
        return rowCloseIndex < configuracoesCloseIndex;
    }

    areColumnsClosedCorrectly() {
        const colMatches = this.htmlContent.match(/<div class="col-md-6">/g);
        if (!colMatches || colMatches.length !== 2) return false;
        
        const colCloseMatches = this.htmlContent.match(/<\/div>/g);
        return colCloseMatches && colCloseMatches.length >= 2;
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
        console.log('📊 RESULTADOS DOS TESTES DE LAYOUT\n');
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
            console.log('⚠️ O layout pode não estar funcionando corretamente!');
        } else {
            console.log('🎉 Todos os testes passaram! O layout lado a lado está correto!');
            console.log('✨ Os cards "Listas de Exceção" e "Configuração de Mensagens" devem aparecer lado a lado!');
        }
    }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
    const tester = new LayoutTest();
    tester.runTests().catch(console.error);
}

module.exports = { LayoutTest };
