/**
 * Teste para mostrar como o sistema detecta data e horário atual
 */

const { TimeUtils } = require('./src/utils/TimeUtils');
const ConfigManager = require('./src/services/ConfigManager');

async function showCurrentTimeDetection() {
    console.log('🕐 Sistema de Detecção de Data e Horário Atual\n');
    console.log('=' .repeat(60));

    // Inicializar ConfigManager
    const configManager = new ConfigManager();
    await configManager.loadSystemConfig();
    
    // Configurar TimeUtils com o ConfigManager
    TimeUtils.setConfigManager(configManager);

    // 1. HORÁRIO ATUAL
    console.log('\n📍 1. HORÁRIO ATUAL:');
    const currentTime = TimeUtils.getBrasiliaTime();
    console.log(`   Horário de Brasília: ${TimeUtils.formatForDisplay(currentTime)}`);
    console.log(`   ISO String: ${currentTime.toISO()}`);
    console.log(`   Timestamp: ${currentTime.toMillis()}`);
    console.log(`   Fuso Horário: ${TimeUtils.TIMEZONE}`);

    // 2. DETALHES DO DIA
    console.log('\n📅 2. DETALHES DO DIA:');
    console.log(`   Dia da Semana: ${currentTime.weekday} (${getWeekdayName(currentTime.weekday)})`);
    console.log(`   Dia do Mês: ${currentTime.day}`);
    console.log(`   Mês: ${currentTime.month} (${getMonthName(currentTime.month)})`);
    console.log(`   Ano: ${currentTime.year}`);
    console.log(`   É Fim de Semana: ${currentTime.weekday === 6 || currentTime.weekday === 7}`);

    // 3. VERIFICAÇÕES DE HORÁRIO COMERCIAL
    console.log('\n🏢 3. VERIFICAÇÕES DE HORÁRIO COMERCIAL:');
    console.log(`   É Dia Útil: ${TimeUtils.isWorkingDay()}`);
    console.log(`   É Sábado: ${TimeUtils.isSaturday()}`);
    console.log(`   É Dia Útil (sem sábado): ${TimeUtils.isWeekday()}`);
    console.log(`   Está em Horário Comercial: ${TimeUtils.isBusinessHours()}`);
    console.log(`   É Horário de Trabalho: ${TimeUtils.isBusinessTime()}`);

    // 4. HORÁRIOS CONFIGURADOS
    console.log('\n⚙️ 4. HORÁRIOS CONFIGURADOS:');
    console.log(`   Início do Dia (dias úteis): ${configManager.getStartOfDayTime()}`);
    console.log(`   Fim do Dia (dias úteis): ${configManager.getEndOfDayTime()}`);
    console.log(`   Início do Dia (sábado): ${configManager.getSaturdayStartTime()}`);
    console.log(`   Fim do Dia (sábado): ${configManager.getSaturdayEndTime()}`);

    // 5. HORÁRIOS APLICADOS HOJE
    console.log('\n🎯 5. HORÁRIOS APLICADOS HOJE:');
    console.log(`   Horário de Início Aplicado: ${TimeUtils.getBusinessStartHour()}:00`);
    console.log(`   Horário de Fim Aplicado: ${TimeUtils.getBusinessEndHour()}:00`);
    
    // 6. STATUS ATUAL
    console.log('\n📊 6. STATUS ATUAL:');
    const hour = currentTime.hour;
    const minute = currentTime.minute;
    const isSaturday = TimeUtils.isSaturday();
    const startHour = TimeUtils.getBusinessStartHour();
    const endHour = TimeUtils.getBusinessEndHour();
    
    console.log(`   Hora Atual: ${hour}:${minute.toString().padStart(2, '0')}`);
    console.log(`   Está Dentro do Horário: ${hour >= startHour && hour < endHour}`);
    
    if (isSaturday) {
        console.log(`   📅 HOJE É SÁBADO - Usando horários específicos de sábado`);
    } else if (TimeUtils.isWeekday()) {
        console.log(`   📅 HOJE É DIA ÚTIL - Usando horários padrão`);
    } else {
        console.log(`   📅 HOJE É DOMINGO - Sem atendimento`);
    }

    // 7. PRÓXIMOS EVENTOS
    console.log('\n⏰ 7. PRÓXIMOS EVENTOS:');
    const nextEndOfDay = TimeUtils.getNextEndOfDayTime();
    const nextCleanup = TimeUtils.getNextDailyCleanupTime();
    
    console.log(`   Próximo Fim de Expediente: ${TimeUtils.formatForDisplay(nextEndOfDay)}`);
    console.log(`   Próxima Limpeza de Logs: ${TimeUtils.formatForDisplay(nextCleanup)}`);

    // 8. INFORMAÇÕES COMPLETAS
    console.log('\n📋 8. INFORMAÇÕES COMPLETAS:');
    const timeInfo = TimeUtils.getTimeInfo();
    console.log(`   Objeto Completo:`, JSON.stringify(timeInfo, null, 2));

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Sistema de detecção de tempo funcionando perfeitamente!');
}

// Funções auxiliares
function getWeekdayName(weekday) {
    const days = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    return days[weekday] || 'Desconhecido';
}

function getMonthName(month) {
    const months = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[month] || 'Desconhecido';
}

// Executar teste
showCurrentTimeDetection().catch(console.error);
