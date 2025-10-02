/**
 * 🔍 ANÁLISE DE PADRÕES DE DUPLICAÇÃO 🔍
 * 
 * Este script analisa o arquivo de mensagens enviadas para identificar
 * padrões específicos de duplicação e entender por que apenas alguns
 * clientes recebem mensagens duplicadas.
 */

const fs = require('fs');
const path = require('path');

// ===============================================
// FUNÇÕES AUXILIARES
// ===============================================

function formatDateTime(dateString) {
    try {
        return new Date(dateString).toLocaleString('pt-BR');
    } catch (error) {
        return dateString;
    }
}

function getTimeDifferenceInMinutes(time1, time2) {
    try {
        const date1 = new Date(time1);
        const date2 = new Date(time2);
        return Math.abs(date2 - date1) / (1000 * 60); // Diferença em minutos
    } catch (error) {
        return null;
    }
}

function analyzePhonePattern(phone, messages) {
    const phoneMessages = messages.filter(msg => msg.patientPhone === phone);
    
    if (phoneMessages.length <= 1) {
        return null; // Não há duplicação
    }
    
    // Agrupar por data
    const messagesByDate = {};
    phoneMessages.forEach(msg => {
        const date = msg.sentAt.split('T')[0]; // YYYY-MM-DD
        if (!messagesByDate[date]) {
            messagesByDate[date] = [];
        }
        messagesByDate[date].push(msg);
    });
    
    const analysis = {
        phone,
        totalMessages: phoneMessages.length,
        dates: Object.keys(messagesByDate),
        duplicationsByDate: {},
        patterns: []
    };
    
    // Analisar duplicações por data
    Object.keys(messagesByDate).forEach(date => {
        const dayMessages = messagesByDate[date].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
        
        if (dayMessages.length > 1) {
            analysis.duplicationsByDate[date] = dayMessages;
            
            // Analisar padrões
            const timeDifferences = [];
            for (let i = 1; i < dayMessages.length; i++) {
                const diff = getTimeDifferenceInMinutes(dayMessages[i-1].sentAt, dayMessages[i].sentAt);
                if (diff !== null) {
                    timeDifferences.push(diff);
                }
            }
            
            analysis.patterns.push({
                date,
                messageCount: dayMessages.length,
                timeDifferences,
                patientIds: dayMessages.map(m => m.patientId),
                messageTypes: dayMessages.map(m => m.messageType)
            });
        }
    });
    
    return analysis;
}

// ===============================================
// ANÁLISE PRINCIPAL
// ===============================================

function analyzeDuplicationPatterns() {
    console.log('🔍 ============================================');
    console.log('   ANÁLISE DE PADRÕES DE DUPLICAÇÃO');
    console.log('   Data: ' + new Date().toLocaleString('pt-BR'));
    console.log('============================================\n');
    
    try {
        // Ler arquivo de mensagens
        const messagesFilePath = path.join(__dirname, '../data/messages_sent.json');
        
        if (!fs.existsSync(messagesFilePath)) {
            console.log('❌ Arquivo de mensagens não encontrado:', messagesFilePath);
            return;
        }
        
        const messagesData = JSON.parse(fs.readFileSync(messagesFilePath, 'utf8'));
        const messages = messagesData.messages || [];
        
        console.log(`📊 Total de mensagens analisadas: ${messages.length}\n`);
        
        // Agrupar mensagens por telefone
        const messagesByPhone = {};
        messages.forEach(msg => {
            const phone = msg.patientPhone;
            if (!messagesByPhone[phone]) {
                messagesByPhone[phone] = [];
            }
            messagesByPhone[phone].push(msg);
        });
        
        // Identificar telefones com múltiplas mensagens
        const phonesWithMultipleMessages = Object.keys(messagesByPhone)
            .filter(phone => messagesByPhone[phone].length > 1);
        
        console.log(`📱 Telefones com múltiplas mensagens: ${phonesWithMultipleMessages.length}`);
        console.log(`📱 Telefones únicos: ${Object.keys(messagesByPhone).length}\n`);
        
        // Analisar cada telefone com duplicação
        const duplicationAnalyses = [];
        
        phonesWithMultipleMessages.forEach(phone => {
            const analysis = analyzePhonePattern(phone, messages);
            if (analysis) {
                duplicationAnalyses.push(analysis);
            }
        });
        
        // Mostrar resultados
        console.log('🚨 DUPLICAÇÕES IDENTIFICADAS:\n');
        
        duplicationAnalyses.forEach((analysis, index) => {
            console.log(`${index + 1}. 📞 ${analysis.phone}`);
            console.log(`   📊 Total de mensagens: ${analysis.totalMessages}`);
            console.log(`   📅 Datas com mensagens: ${analysis.dates.join(', ')}`);
            
            analysis.patterns.forEach(pattern => {
                console.log(`\n   📅 ${pattern.date}:`);
                console.log(`      📨 Mensagens: ${pattern.messageCount}`);
                console.log(`      🆔 IDs diferentes: ${new Set(pattern.patientIds).size}`);
                console.log(`      📝 Tipos: ${pattern.messageTypes.join(', ')}`);
                
                if (pattern.timeDifferences.length > 0) {
                    console.log(`      ⏱️ Intervalos entre mensagens:`);
                    pattern.timeDifferences.forEach((diff, i) => {
                        console.log(`         ${i + 1}ª duplicação: ${diff.toFixed(1)} minutos`);
                    });
                }
                
                // Identificar padrões específicos
                const uniqueIds = new Set(pattern.patientIds);
                if (uniqueIds.size > 1) {
                    console.log(`      🔍 PADRÃO: Mesmo telefone com IDs diferentes!`);
                    console.log(`         IDs: ${Array.from(uniqueIds).join(', ')}`);
                }
                
                const timeDiff = pattern.timeDifferences[0];
                if (timeDiff && timeDiff < 5) {
                    console.log(`      ⚡ PADRÃO: Duplicação rápida (< 5 minutos)`);
                } else if (timeDiff && timeDiff > 60) {
                    console.log(`      🔄 PADRÃO: Duplicação após mais de 1 hora`);
                }
            });
            
            console.log(''); // Linha em branco
        });
        
        // Estatísticas gerais
        console.log('\n📈 ESTATÍSTICAS GERAIS:\n');
        
        const totalDuplications = duplicationAnalyses.reduce((sum, analysis) => {
            return sum + analysis.patterns.reduce((patternSum, pattern) => {
                return patternSum + (pattern.messageCount - 1); // -1 porque primeira não é duplicação
            }, 0);
        }, 0);
        
        const totalMessages = messages.length;
        const duplicationRate = ((totalDuplications / totalMessages) * 100).toFixed(2);
        
        console.log(`📊 Total de mensagens: ${totalMessages}`);
        console.log(`🚫 Total de duplicações: ${totalDuplications}`);
        console.log(`📈 Taxa de duplicação: ${duplicationRate}%`);
        console.log(`📱 Telefones afetados: ${duplicationAnalyses.length}`);
        console.log(`📱 Telefones únicos: ${Object.keys(messagesByPhone).length}`);
        
        // Análise de padrões mais comuns
        console.log('\n🔍 PADRÕES MAIS COMUNS:\n');
        
        let sameIdPattern = 0;
        let differentIdPattern = 0;
        let quickDuplication = 0;
        let slowDuplication = 0;
        
        duplicationAnalyses.forEach(analysis => {
            analysis.patterns.forEach(pattern => {
                const uniqueIds = new Set(pattern.patientIds);
                if (uniqueIds.size === 1) {
                    sameIdPattern++;
                } else {
                    differentIdPattern++;
                }
                
                const timeDiff = pattern.timeDifferences[0];
                if (timeDiff && timeDiff < 5) {
                    quickDuplication++;
                } else if (timeDiff && timeDiff > 60) {
                    slowDuplication++;
                }
            });
        });
        
        console.log(`🆔 Mesmo ID de paciente: ${sameIdPattern} casos`);
        console.log(`🔄 IDs diferentes: ${differentIdPattern} casos`);
        console.log(`⚡ Duplicação rápida (< 5min): ${quickDuplication} casos`);
        console.log(`🕐 Duplicação lenta (> 1h): ${slowDuplication} casos`);
        
        // Recomendações
        console.log('\n💡 RECOMENDAÇÕES:\n');
        
        if (differentIdPattern > sameIdPattern) {
            console.log('🎯 PROBLEMA PRINCIPAL: Pacientes entrando com IDs diferentes');
            console.log('   Solução: Verificação por telefone + setor (implementada)');
        }
        
        if (quickDuplication > 0) {
            console.log('⚡ PROBLEMA: Duplicações rápidas (< 5 minutos)');
            console.log('   Possível causa: Race condition ou processamento paralelo');
            console.log('   Solução: Lock de processamento ou verificação mais rigorosa');
        }
        
        if (slowDuplication > 0) {
            console.log('🕐 PROBLEMA: Duplicações após longos intervalos (> 1 hora)');
            console.log('   Possível causa: Paciente saindo e entrando novamente na fila');
            console.log('   Solução: Sistema de proteção por telefone (implementada)');
        }
        
        console.log('\n✅ Análise concluída!');
        
    } catch (error) {
        console.error('\n❌ Erro durante análise:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Executar análise
analyzeDuplicationPatterns();
