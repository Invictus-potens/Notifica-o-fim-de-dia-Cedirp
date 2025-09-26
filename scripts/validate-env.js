#!/usr/bin/env node

/**
 * Script de validação de ambiente para Automação de Mensagem de Espera
 * CAM Krolik Integration
 */

require('dotenv').config();

const requiredVars = [
    'KROLIK_API_BASE_URL',
    'KROLIK_API_TOKEN',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
];

const optionalVars = [
    'PORT',
    'TIMEZONE',
    'END_OF_DAY_TIME',
    'CHECK_INTERVAL_MINUTES',
    'WAIT_TIME_THRESHOLD_MINUTES',
    'LOG_LEVEL'
];

function validateEnvironment() {
    console.log('🔍 Validando configurações de ambiente...\n');
    
    let hasErrors = false;
    
    // Verificar variáveis obrigatórias
    console.log('📋 Variáveis obrigatórias:');
    requiredVars.forEach(varName => {
        const value = process.env[varName];
        if (!value) {
            console.log(`   ❌ ${varName}: NÃO CONFIGURADA`);
            hasErrors = true;
        } else {
            // Mascarar valores sensíveis
            const displayValue = varName.includes('TOKEN') || varName.includes('KEY') 
                ? value.substring(0, 8) + '...' 
                : value;
            console.log(`   ✅ ${varName}: ${displayValue}`);
        }
    });
    
    console.log('\n📋 Variáveis opcionais:');
    optionalVars.forEach(varName => {
        const value = process.env[varName];
        if (value) {
            console.log(`   ✅ ${varName}: ${value}`);
        } else {
            console.log(`   ⚪ ${varName}: usando padrão`);
        }
    });
    
    // Validações específicas
    console.log('\n🔧 Validações específicas:');
    
    // Validar URL da API
    const apiUrl = process.env.KROLIK_API_BASE_URL;
    if (apiUrl && !apiUrl.startsWith('http')) {
        console.log('   ❌ KROLIK_API_BASE_URL deve começar com http:// ou https://');
        hasErrors = true;
    } else if (apiUrl) {
        console.log('   ✅ URL da API válida');
    }
    
    // Validar porta
    const port = process.env.PORT;
    if (port && (isNaN(port) || port < 1 || port > 65535)) {
        console.log('   ❌ PORT deve ser um número entre 1 e 65535');
        hasErrors = true;
    } else {
        console.log(`   ✅ Porta válida: ${port || '48026 (padrão)'}`);
    }
    
    // Validar timezone
    const timezone = process.env.TIMEZONE || 'America/Sao_Paulo';
    try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        console.log(`   ✅ Timezone válido: ${timezone}`);
    } catch (error) {
        console.log(`   ❌ Timezone inválido: ${timezone}`);
        hasErrors = true;
    }
    
    // Validar horário de fim de expediente
    const endTime = process.env.END_OF_DAY_TIME || '18:00';
    if (!/^\d{2}:\d{2}$/.test(endTime)) {
        console.log(`   ❌ END_OF_DAY_TIME deve estar no formato HH:MM: ${endTime}`);
        hasErrors = true;
    } else {
        console.log(`   ✅ Horário de fim de expediente válido: ${endTime}`);
    }
    
    // Validar intervalos numéricos
    const checkInterval = process.env.CHECK_INTERVAL_MINUTES;
    if (checkInterval && (isNaN(checkInterval) || checkInterval < 1)) {
        console.log('   ❌ CHECK_INTERVAL_MINUTES deve ser um número maior que 0');
        hasErrors = true;
    } else {
        console.log(`   ✅ Intervalo de verificação válido: ${checkInterval || '1 (padrão)'} minutos`);
    }
    
    const waitThreshold = process.env.WAIT_TIME_THRESHOLD_MINUTES;
    if (waitThreshold && (isNaN(waitThreshold) || waitThreshold < 1)) {
        console.log('   ❌ WAIT_TIME_THRESHOLD_MINUTES deve ser um número maior que 0');
        hasErrors = true;
    } else {
        console.log(`   ✅ Limite de tempo de espera válido: ${waitThreshold || '30 (padrão)'} minutos`);
    }
    
    // Verificar conectividade (opcional)
    if (process.argv.includes('--check-connectivity')) {
        console.log('\n🌐 Verificando conectividade...');
        checkConnectivity();
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (hasErrors) {
        console.log('❌ Configuração inválida! Corrija os erros acima antes de continuar.');
        process.exit(1);
    } else {
        console.log('✅ Todas as configurações estão válidas!');
        console.log('🚀 Sistema pronto para inicialização.');
    }
}

async function checkConnectivity() {
    const axios = require('axios');
    
    // Verificar API do CAM Krolik
    const apiUrl = process.env.KROLIK_API_BASE_URL;
    const apiToken = process.env.KROLIK_API_TOKEN;
    
    if (apiUrl && apiToken) {
        try {
            const response = await axios.get(`${apiUrl}/sectors`, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            if (response.status === 200) {
                console.log('   ✅ Conexão com API CAM Krolik: OK');
            } else {
                console.log(`   ⚠️  API CAM Krolik respondeu com status: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Erro ao conectar com API CAM Krolik: ${error.message}`);
        }
    }
    
    // Verificar Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
        try {
            const response = await axios.get(`${supabaseUrl}/rest/v1/`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                },
                timeout: 5000
            });
            
            console.log('   ✅ Conexão com Supabase: OK');
        } catch (error) {
            console.log(`   ❌ Erro ao conectar com Supabase: ${error.message}`);
        }
    }
}

// Executar validação
validateEnvironment();