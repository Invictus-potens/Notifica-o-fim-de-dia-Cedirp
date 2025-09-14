#!/usr/bin/env node

/**
 * Script de Validação do Supabase
 * Verifica se as tabelas e configurações estão corretas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateSupabase() {
    console.log('🔍 Validando configuração do Supabase...\n');
    
    let hasErrors = false;
    
    // 1. Testar conexão
    console.log('1. Testando conexão...');
    try {
        const { data, error } = await supabase
            .from('system_config')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('   ❌ Erro de conexão:', error.message);
            hasErrors = true;
        } else {
            console.log('   ✅ Conexão estabelecida com sucesso');
        }
    } catch (err) {
        console.error('   ❌ Erro de conexão:', err.message);
        hasErrors = true;
    }
    
    // 2. Verificar tabelas
    console.log('\n2. Verificando tabelas...');
    
    const tables = ['exclusion_entries', 'system_config'];
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
                
            if (error) {
                console.error(`   ❌ Tabela ${table}: ${error.message}`);
                hasErrors = true;
            } else {
                console.log(`   ✅ Tabela ${table}: OK`);
            }
        } catch (err) {
            console.error(`   ❌ Tabela ${table}: ${err.message}`);
            hasErrors = true;
        }
    }
    
    // 3. Verificar configurações padrão
    console.log('\n3. Verificando configurações padrão...');
    
    const requiredConfigs = [
        'flow_paused',
        'excluded_sectors',
        'excluded_channels',
        'end_of_day_time',
        'check_interval_minutes',
        'wait_time_threshold_minutes'
    ];
    
    try {
        const { data, error } = await supabase
            .from('system_config')
            .select('key, value');
            
        if (error) {
            console.error('   ❌ Erro ao buscar configurações:', error.message);
            hasErrors = true;
        } else {
            const configs = data || [];
            const configKeys = configs.map(c => c.key);
            
            for (const requiredKey of requiredConfigs) {
                if (configKeys.includes(requiredKey)) {
                    const config = configs.find(c => c.key === requiredKey);
                    console.log(`   ✅ ${requiredKey}: ${config.value}`);
                } else {
                    console.error(`   ❌ Configuração ${requiredKey} não encontrada`);
                    hasErrors = true;
                }
            }
        }
    } catch (err) {
        console.error('   ❌ Erro ao verificar configurações:', err.message);
        hasErrors = true;
    }
    
    // 4. Testar operações básicas
    console.log('\n4. Testando operações básicas...');
    
    // Teste de inserção em exclusion_entries
    try {
        const testEntry = {
            attendance_id: 'test-' + Date.now(),
            message_type: '30min',
            sent_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        
        const { data, error } = await supabase
            .from('exclusion_entries')
            .insert(testEntry)
            .select();
            
        if (error) {
            console.error('   ❌ Erro ao inserir em exclusion_entries:', error.message);
            console.error('   💡 Dica: Execute o script supabase-fix.sql para corrigir as políticas RLS');
            hasErrors = true;
        } else {
            console.log('   ✅ Inserção em exclusion_entries: OK');
            
            // Limpar dados de teste
            if (data && data[0]) {
                await supabase
                    .from('exclusion_entries')
                    .delete()
                    .eq('id', data[0].id);
            }
        }
    } catch (err) {
        console.error('   ❌ Erro ao testar inserção:', err.message);
        hasErrors = true;
    }
    
    // Teste de atualização em system_config
    try {
        const { error } = await supabase
            .from('system_config')
            .update({ value: 'test' })
            .eq('key', 'flow_paused');
            
        if (error) {
            console.error('   ❌ Erro ao atualizar system_config:', error.message);
            hasErrors = true;
        } else {
            console.log('   ✅ Atualização em system_config: OK');
            
            // Restaurar valor original
            await supabase
                .from('system_config')
                .update({ value: 'false' })
                .eq('key', 'flow_paused');
        }
    } catch (err) {
        console.error('   ❌ Erro ao testar atualização:', err.message);
        hasErrors = true;
    }
    
    // 5. Verificar índices
    console.log('\n5. Verificando índices...');
    
    try {
        // Teste de performance com consulta que usa índices
        const startTime = Date.now();
        
        const { data, error } = await supabase
            .from('exclusion_entries')
            .select('*')
            .eq('message_type', '30min')
            .limit(10);
            
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        if (error) {
            console.error('   ❌ Erro ao testar consulta:', error.message);
            hasErrors = true;
        } else {
            console.log(`   ✅ Consulta executada em ${queryTime}ms`);
            if (queryTime > 1000) {
                console.log('   ⚠️  Consulta lenta - verifique os índices');
            }
        }
    } catch (err) {
        console.error('   ❌ Erro ao testar performance:', err.message);
        hasErrors = true;
    }
    
    // Resultado final
    console.log('\n' + '='.repeat(50));
    
    if (hasErrors) {
        console.log('❌ VALIDAÇÃO FALHOU');
        console.log('\n📋 Próximos passos:');
        console.log('1. Execute o script de correção: supabase-fix.sql');
        console.log('2. Execute novamente: npm run validate:supabase');
        console.log('3. Se ainda houver problemas, verifique as credenciais no .env');
        console.log('4. Consulte o arquivo supabase-setup.md para mais detalhes');
        process.exit(1);
    } else {
        console.log('✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO');
        console.log('\n🎉 O Supabase está configurado corretamente!');
        console.log('📝 Você pode agora iniciar a aplicação com: npm start');
    }
}

// Executar validação
validateSupabase().catch(error => {
    console.error('❌ Erro durante a validação:', error);
    process.exit(1);
});
