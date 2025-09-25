/**
 * Script de teste para validar a remoção da funcionalidade de canais excluídos
 * Este script testa se a remoção não quebrou outras funcionalidades do sistema.
 */

const { ConfigManager } = require('../src/services/ConfigManager');
const { ErrorHandler } = require('../src/services/ErrorHandler');

class ChannelsRemovalTest {
    constructor() {
        this.errorHandler = new ErrorHandler();
        this.configManager = new ConfigManager(this.errorHandler);
        this.testResults = [];
    }

    async runTests() {
        console.log('🧪 Iniciando testes de remoção de canais excluídos...\n');

        await this.configManager.initialize();

        // Teste 1: Verificar se ConfigManager ainda funciona sem canais excluídos
        await this.testConfigManagerFunctionality();

        // Teste 2: Verificar se setores excluídos ainda funcionam
        await this.testExcludedSectorsStillWork();

        // Teste 3: Verificar se outras configurações não foram afetadas
        await this.testOtherConfigurations();

        // Teste 4: Verificar se não há referências a canais excluídos
        await this.testNoChannelsReferences();

        this.printResults();
    }

    async testConfigManagerFunctionality() {
        console.log('🔧 Teste 1: Funcionalidade do ConfigManager');
        
        const config = this.configManager.getSystemConfig();
        
        const tests = [
            {
                name: 'ConfigManager inicializa sem erros',
                expected: true,
                actual: !!config,
                pass: !!config
            },
            {
                name: 'Configuração tem estrutura correta',
                expected: true,
                actual: typeof config === 'object',
                pass: typeof config === 'object'
            },
            {
                name: 'Setores excluídos ainda existem',
                expected: true,
                actual: Array.isArray(config.excludedSectors),
                pass: Array.isArray(config.excludedSectors)
            },
            {
                name: 'Canais excluídos foram removidos',
                expected: false,
                actual: config.hasOwnProperty('excludedChannels'),
                pass: !config.hasOwnProperty('excludedChannels')
            }
        ];

        tests.forEach(test => {
            this.addTestResult('ConfigManager Functionality', test.name, test.pass, test.expected, test.actual);
        });

        console.log('✅ Teste 1 concluído\n');
    }

    async testExcludedSectorsStillWork() {
        console.log('📋 Teste 2: Setores Excluídos');
        
        const tests = [
            {
                name: 'getExcludedSectors() funciona',
                expected: true,
                actual: Array.isArray(this.configManager.getExcludedSectors()),
                pass: Array.isArray(this.configManager.getExcludedSectors())
            },
            {
                name: 'Lista de setores excluídos não está vazia',
                expected: true,
                actual: this.configManager.getExcludedSectors().length > 0,
                pass: this.configManager.getExcludedSectors().length > 0
            }
        ];

        tests.forEach(test => {
            this.addTestResult('Excluded Sectors', test.name, test.pass, test.expected, test.actual);
        });

        console.log('✅ Teste 2 concluído\n');
    }

    async testOtherConfigurations() {
        console.log('⚙️ Teste 3: Outras Configurações');
        
        const config = this.configManager.getSystemConfig();
        
        const tests = [
            {
                name: 'Horários de sábado funcionam',
                expected: true,
                actual: config.hasOwnProperty('saturdayStartTime') && config.hasOwnProperty('saturdayEndTime'),
                pass: config.hasOwnProperty('saturdayStartTime') && config.hasOwnProperty('saturdayEndTime')
            },
            {
                name: 'Horários normais funcionam',
                expected: true,
                actual: config.hasOwnProperty('startOfDayTime') && config.hasOwnProperty('endOfDayTime'),
                pass: config.hasOwnProperty('startOfDayTime') && config.hasOwnProperty('endOfDayTime')
            },
            {
                name: 'Action Cards funcionam',
                expected: true,
                actual: config.hasOwnProperty('selectedActionCard30Min') && config.hasOwnProperty('selectedActionCardEndDay'),
                pass: config.hasOwnProperty('selectedActionCard30Min') && config.hasOwnProperty('selectedActionCardEndDay')
            },
            {
                name: 'Tempos de espera funcionam',
                expected: true,
                actual: config.hasOwnProperty('minWaitTime') && config.hasOwnProperty('maxWaitTime'),
                pass: config.hasOwnProperty('minWaitTime') && config.hasOwnProperty('maxWaitTime')
            }
        ];

        tests.forEach(test => {
            this.addTestResult('Other Configurations', test.name, test.pass, test.expected, test.actual);
        });

        console.log('✅ Teste 3 concluído\n');
    }

    async testNoChannelsReferences() {
        console.log('🔍 Teste 4: Verificação de Referências Removidas');
        
        const config = this.configManager.getSystemConfig();
        
        const tests = [
            {
                name: 'Configuração não tem excludedChannels',
                expected: false,
                actual: config.hasOwnProperty('excludedChannels'),
                pass: !config.hasOwnProperty('excludedChannels')
            },
            {
                name: 'getExcludedChannels() não existe',
                expected: false,
                actual: typeof this.configManager.getExcludedChannels === 'function',
                pass: typeof this.configManager.getExcludedChannels !== 'function'
            }
        ];

        tests.forEach(test => {
            this.addTestResult('No Channels References', test.name, test.pass, test.expected, test.actual);
        });

        console.log('✅ Teste 4 concluído\n');
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
        console.log('📊 RESULTADOS DOS TESTES DE REMOÇÃO\n');
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
            console.log('⚠️ A remoção pode ter causado problemas no sistema!');
        } else {
            console.log('🎉 Todos os testes passaram! A funcionalidade de canais excluídos foi removida com sucesso!');
            console.log('✨ O sistema continua funcionando normalmente sem canais excluídos!');
        }
    }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
    const tester = new ChannelsRemovalTest();
    tester.runTests().catch(console.error);
}

module.exports = { ChannelsRemovalTest };
