/**
 * Script de teste para validar a funcionalidade de horários de sábado
 * Este script testa se a lógica de horários comerciais está funcionando corretamente
 * para diferentes cenários de sábados e dias úteis.
 */

const { ConfigManager } = require('../src/services/ConfigManager');
const { ErrorHandler } = require('../src/services/ErrorHandler');

class SaturdayHoursTest {
    constructor() {
        this.errorHandler = new ErrorHandler();
        this.configManager = new ConfigManager(this.errorHandler);
        this.testResults = [];
    }

    async runTests() {
        console.log('🧪 Iniciando testes de horários de sábado...\n');

        await this.configManager.initialize();

        // Teste 1: Verificar se as configurações padrão estão corretas
        await this.testDefaultConfigurations();

        // Teste 2: Verificar se as funções getter funcionam
        await this.testGetterFunctions();

        // Teste 3: Verificar se a persistência funciona
        await this.testPersistence();

        // Teste 4: Verificar se a lógica de horários comerciais funciona
        await this.testBusinessHoursLogic();

        this.printResults();
    }

    async testDefaultConfigurations() {
        console.log('📋 Teste 1: Configurações Padrão');
        
        const config = this.configManager.getSystemConfig();
        
        const tests = [
            {
                name: 'saturdayStartTime padrão',
                expected: '08:00',
                actual: config.saturdayStartTime,
                pass: config.saturdayStartTime === '08:00'
            },
            {
                name: 'saturdayEndTime padrão',
                expected: '12:00',
                actual: config.saturdayEndTime,
                pass: config.saturdayEndTime === '12:00'
            }
        ];

        tests.forEach(test => {
            this.addTestResult('Default Configurations', test.name, test.pass, test.expected, test.actual);
        });

        console.log('✅ Teste 1 concluído\n');
    }

    async testGetterFunctions() {
        console.log('🔧 Teste 2: Funções Getter');
        
        const tests = [
            {
                name: 'getSaturdayStartTime()',
                expected: '08:00',
                actual: this.configManager.getSaturdayStartTime(),
                pass: this.configManager.getSaturdayStartTime() === '08:00'
            },
            {
                name: 'getSaturdayEndTime()',
                expected: '12:00',
                actual: this.configManager.getSaturdayEndTime(),
                pass: this.configManager.getSaturdayEndTime() === '12:00'
            }
        ];

        tests.forEach(test => {
            this.addTestResult('Getter Functions', test.name, test.pass, test.expected, test.actual);
        });

        console.log('✅ Teste 2 concluído\n');
    }

    async testPersistence() {
        console.log('💾 Teste 3: Persistência de Dados');
        
        try {
            // Atualizar configurações
            await this.configManager.updateSystemConfig({
                saturdayStartTime: '09:00',
                saturdayEndTime: '13:00'
            });

            // Verificar se foram salvas
            const config = this.configManager.getSystemConfig();
            
            const tests = [
                {
                    name: 'saturdayStartTime persistido',
                    expected: '09:00',
                    actual: config.saturdayStartTime,
                    pass: config.saturdayStartTime === '09:00'
                },
                {
                    name: 'saturdayEndTime persistido',
                    expected: '13:00',
                    actual: config.saturdayEndTime,
                    pass: config.saturdayEndTime === '13:00'
                }
            ];

            tests.forEach(test => {
                this.addTestResult('Persistence', test.name, test.pass, test.expected, test.actual);
            });

            // Restaurar valores padrão
            await this.configManager.updateSystemConfig({
                saturdayStartTime: '08:00',
                saturdayEndTime: '12:00'
            });

            console.log('✅ Teste 3 concluído\n');
        } catch (error) {
            this.addTestResult('Persistence', 'Erro na persistência', false, 'Sucesso', error.message);
            console.log('❌ Teste 3 falhou:', error.message, '\n');
        }
    }

    async testBusinessHoursLogic() {
        console.log('🕐 Teste 4: Lógica de Horários Comerciais');
        
        // Simular diferentes horários e dias
        const testCases = [
            {
                dayOfWeek: 6, // Sábado
                hour: 9,
                expected: false, // Dentro do horário comercial de sábado
                description: 'Sábado 09:00 (dentro do horário)'
            },
            {
                dayOfWeek: 6, // Sábado
                hour: 14,
                expected: true, // Fora do horário comercial de sábado
                description: 'Sábado 14:00 (fora do horário)'
            },
            {
                dayOfWeek: 1, // Segunda-feira
                hour: 9,
                expected: false, // Dentro do horário comercial normal
                description: 'Segunda-feira 09:00 (dentro do horário)'
            },
            {
                dayOfWeek: 1, // Segunda-feira
                hour: 19,
                expected: true, // Fora do horário comercial normal
                description: 'Segunda-feira 19:00 (fora do horário)'
            }
        ];

        testCases.forEach(testCase => {
            // Simular a lógica de horários comerciais
            let startHour, endHour;
            let isOutsideBusinessHours = false;

            if (testCase.dayOfWeek === 6) { // Sábado
                startHour = parseInt(this.configManager.getSaturdayStartTime().split(':')[0]);
                endHour = parseInt(this.configManager.getSaturdayEndTime().split(':')[0]);
            } else {
                startHour = parseInt(this.configManager.getStartOfDayTime().split(':')[0]);
                endHour = parseInt(this.configManager.getEndOfDayTime().split(':')[0]);
            }

            isOutsideBusinessHours = testCase.hour < startHour || testCase.hour >= endHour;
            
            const pass = isOutsideBusinessHours === testCase.expected;
            
            this.addTestResult(
                'Business Hours Logic', 
                testCase.description, 
                pass, 
                testCase.expected ? 'Fora do horário' : 'Dentro do horário',
                isOutsideBusinessHours ? 'Fora do horário' : 'Dentro do horário'
            );
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
        console.log('📊 RESULTADOS DOS TESTES\n');
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
        } else {
            console.log('🎉 Todos os testes passaram! A funcionalidade de horários de sábado está funcionando corretamente!');
        }
    }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
    const tester = new SaturdayHoursTest();
    tester.runTests().catch(console.error);
}

module.exports = { SaturdayHoursTest };
