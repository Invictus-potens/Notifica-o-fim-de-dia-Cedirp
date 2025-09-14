#!/usr/bin/env node

/**
 * Script de teste para verificar a funcionalidade de cartões de ação
 * Baseado no curl fornecido: curl -X 'GET' 'https://api.camkrolik.com.br/core/v2/api/action-cards' -H 'accept: application/json' -H 'access-token: 63e68f168a48875131856df8'
 */

const axios = require('axios');

// Configuração da API
const API_BASE_URL = 'https://api.camkrolik.com.br';
const API_TOKEN = '63e68f168a48875131856df8';

async function testActionCardsAPI() {
    console.log('🧪 ===========================================');
    console.log('   TESTE DE CARTÕES DE AÇÃO - API CAM KROLIK');
    console.log('===========================================');
    console.log(`📡 URL: ${API_BASE_URL}/core/v2/api/action-cards`);
    console.log(`🔑 Token: ${API_TOKEN.substring(0, 8)}...`);
    console.log('===========================================\n');

    try {
        // Teste direto na API CAM Krolik
        console.log('🔍 Testando API CAM Krolik diretamente...');
        const response = await axios.get(`${API_BASE_URL}/core/v2/api/action-cards`, {
            headers: {
                'accept': 'application/json',
                'access-token': API_TOKEN
            },
            timeout: 10000
        });

        console.log('✅ Resposta da API recebida com sucesso!');
        console.log(`📊 Status: ${response.status}`);
        console.log(`📋 Total de cartões: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
            console.log('\n📋 Primeiros cartões encontrados:');
            response.data.slice(0, 3).forEach((card, index) => {
                console.log(`   ${index + 1}. ID: ${card.id}`);
                console.log(`      Nome: ${card.name || card.title || 'N/A'}`);
                console.log(`      Ativo: ${card.active !== false ? 'Sim' : 'Não'}`);
                console.log(`      Tipo: ${card.type || 'N/A'}`);
                console.log('');
            });
        } else {
            console.log('⚠️  Nenhum cartão de ação encontrado na API');
        }

    } catch (error) {
        console.error('❌ Erro ao testar API CAM Krolik:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Dados: ${JSON.stringify(error.response.data, null, 2)}`);
        } else if (error.request) {
            console.error('   Erro de rede - API não respondeu');
        } else {
            console.error(`   Erro: ${error.message}`);
        }
    }
}

async function testLocalAPI() {
    console.log('\n🔍 ===========================================');
    console.log('   TESTE DA API LOCAL');
    console.log('===========================================');
    console.log('📡 URL: http://localhost:3000/api/action-cards');
    console.log('===========================================\n');

    try {
        const response = await axios.get('http://localhost:3000/api/action-cards', {
            timeout: 5000
        });

        console.log('✅ Resposta da API local recebida!');
        console.log(`📊 Status: ${response.status}`);
        console.log(`📋 Sucesso: ${response.data.success}`);
        console.log(`📋 Total: ${response.data.total || 0}`);
        console.log(`🔄 Fallback: ${response.data.fallback ? 'Sim' : 'Não'}`);
        
        if (response.data.data && response.data.data.length > 0) {
            console.log('\n📋 Cartões retornados pela API local:');
            response.data.data.forEach((card, index) => {
                console.log(`   ${index + 1}. ID: ${card.id}`);
                console.log(`      Nome: ${card.name || card.title || 'N/A'}`);
                console.log(`      Ativo: ${card.active !== false ? 'Sim' : 'Não'}`);
                console.log(`      Tipo: ${card.type || 'N/A'}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Erro ao testar API local:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Dados: ${JSON.stringify(error.response.data, null, 2)}`);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('   Servidor local não está rodando');
            console.error('   Execute: npm start ou node src/index.js');
        } else {
            console.error(`   Erro: ${error.message}`);
        }
    }
}

async function runTests() {
    console.log('🚀 Iniciando testes de cartões de ação...\n');
    
    // Teste 1: API CAM Krolik diretamente
    await testActionCardsAPI();
    
    // Aguardar um pouco entre os testes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 2: API local
    await testLocalAPI();
    
    console.log('\n🎯 ===========================================');
    console.log('   TESTES CONCLUÍDOS');
    console.log('===========================================');
    console.log('✅ Verifique os resultados acima');
    console.log('📋 Se a API CAM Krolik falhar, a API local deve usar fallback');
    console.log('🔧 Para testar a interface web, acesse: http://localhost:3000');
    console.log('===========================================\n');
}

// Executar testes
runTests().catch(console.error);
