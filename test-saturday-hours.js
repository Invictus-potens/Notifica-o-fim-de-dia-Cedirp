/**
 * Teste para verificar funcionalidade de horários de sábado
 */

const { TimeUtils } = require('./src/utils/TimeUtils');
const ConfigManager = require('./src/services/ConfigManager');

async function testSaturdayHours() {
    console.log('🧪 Testando funcionalidade de horários de sábado...\n');

    // Inicializar ConfigManager
    const configManager = new ConfigManager();
    await configManager.loadSystemConfig();
    
    // Configurar TimeUtils com o ConfigManager
    TimeUtils.setConfigManager(configManager);

    // Testar configurações padrão
    console.log('📋 Configurações padrão:');
    console.log(`   Dias úteis: ${configManager.getStartOfDayTime()} - ${configManager.getEndOfDayTime()}`);
    console.log(`   Sábado: ${configManager.getSaturdayStartTime()} - ${configManager.getSaturdayEndTime()}\n`);

    // Simular diferentes dias da semana
    const testDates = [
        { name: 'Segunda-feira', day: 1 },
        { name: 'Sexta-feira', day: 5 },
        { name: 'Sábado', day: 6 },
        { name: 'Domingo', day: 0 }
    ];

    console.log('📅 Testando diferentes dias da semana:');
    
    for (const testDate of testDates) {
        // Mock do getBrasiliaTime para simular diferentes dias
        const originalGetBrasiliaTime = TimeUtils.getBrasiliaTime;
        TimeUtils.getBrasiliaTime = () => ({
            weekday: testDate.day,
            hour: 10, // 10:00
            minute: 0
        });

        console.log(`\n   ${testDate.name} (dia ${testDate.day}):`);
        console.log(`     isWorkingDay(): ${TimeUtils.isWorkingDay()}`);
        console.log(`     isSaturday(): ${TimeUtils.isSaturday()}`);
        console.log(`     isWeekday(): ${TimeUtils.isWeekday()}`);
        console.log(`     getBusinessStartHour(): ${TimeUtils.getBusinessStartHour()}`);
        console.log(`     getBusinessEndHour(): ${TimeUtils.getBusinessEndHour()}`);
        console.log(`     isBusinessHours(): ${TimeUtils.isBusinessHours()}`);
        console.log(`     isBusinessTime(): ${TimeUtils.isBusinessTime()}`);

        // Restaurar função original
        TimeUtils.getBrasiliaTime = originalGetBrasiliaTime;
    }

    // Testar horários específicos no sábado
    console.log('\n🕐 Testando horários específicos no sábado:');
    
    const originalGetBrasiliaTime = TimeUtils.getBrasiliaTime;
    TimeUtils.getBrasiliaTime = () => ({
        weekday: 6, // Sábado
        hour: 11, // 11:00
        minute: 30
    });

    console.log(`   Sábado 11:30:`);
    console.log(`     getBusinessStartHour(): ${TimeUtils.getBusinessStartHour()}`);
    console.log(`     getBusinessEndHour(): ${TimeUtils.getBusinessEndHour()}`);
    console.log(`     isBusinessHours(): ${TimeUtils.isBusinessHours()}`);

    // Testar fora do horário de sábado
    TimeUtils.getBrasiliaTime = () => ({
        weekday: 6, // Sábado
        hour: 14, // 14:00 (fora do horário de sábado)
        minute: 0
    });

    console.log(`   Sábado 14:00 (fora do horário):`);
    console.log(`     isBusinessHours(): ${TimeUtils.isBusinessHours()}`);

    // Restaurar função original
    TimeUtils.getBrasiliaTime = originalGetBrasiliaTime;

    console.log('\n✅ Teste concluído!');
}

// Executar teste
testSaturdayHours().catch(console.error);
