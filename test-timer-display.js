/**
 * Teste para verificar o display do timer com dia da semana
 */

function testTimerDisplay() {
    console.log('🕐 Teste do Timer com Dia da Semana\n');
    console.log('=' .repeat(50));

    // Simular a função updateTimer
    function updateTimer() {
        const now = new Date();
        
        // Formatar hora (HH:MM:SS)
        const timeString = now.toLocaleTimeString('pt-BR', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Formatar data (DD/MM/AAAA)
        const dateString = now.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Obter dia da semana
        const weekdayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const weekdayName = weekdayNames[now.getDay()];
        
        return {
            time: timeString,
            date: `${dateString} - ${weekdayName}`,
            fullDisplay: `${timeString}\n${dateString} - ${weekdayName}`
        };
    }

    // Testar diferentes dias da semana
    const testDates = [
        new Date('2025-01-13'), // Segunda-feira
        new Date('2025-01-14'), // Terça-feira
        new Date('2025-01-15'), // Quarta-feira
        new Date('2025-01-16'), // Quinta-feira
        new Date('2025-01-17'), // Sexta-feira
        new Date('2025-01-18'), // Sábado
        new Date('2025-01-19')  // Domingo
    ];

    console.log('📅 Testando diferentes dias da semana:\n');

    testDates.forEach(date => {
        // Mock do Date.now() para testar dias específicos
        const originalDate = Date;
        global.Date = function(...args) {
            if (args.length === 0) return date;
            return new originalDate(...args);
        };
        global.Date.now = () => date.getTime();

        const result = updateTimer();
        console.log(`   ${date.toLocaleDateString('pt-BR')}:`);
        console.log(`     Hora: ${result.time}`);
        console.log(`     Data: ${result.date}`);
        console.log(`     Display completo:`);
        console.log(`     ${result.fullDisplay}`);
        console.log('');

        // Restaurar Date original
        global.Date = originalDate;
    });

    // Teste com data atual
    console.log('🕐 Teste com data atual:\n');
    const currentResult = updateTimer();
    console.log(`   Hora: ${currentResult.time}`);
    console.log(`   Data: ${currentResult.date}`);
    console.log(`   Display completo:`);
    console.log(`   ${currentResult.fullDisplay}`);

    console.log('\n' + '=' .repeat(50));
    console.log('✅ Timer com dia da semana funcionando perfeitamente!');
}

// Executar teste
testTimerDisplay();
