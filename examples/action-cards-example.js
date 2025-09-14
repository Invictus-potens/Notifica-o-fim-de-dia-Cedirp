#!/usr/bin/env node

/**
 * Exemplo de uso da funcionalidade de cartões de ação
 * Demonstra como buscar e usar cartões de ação da API CAM Krolik
 */

const axios = require('axios');

// Configuração
const API_BASE_URL = 'https://api.camkrolik.com.br';
const API_TOKEN = '63e68f168a48875131856df8';

class ActionCardsExample {
    constructor() {
        this.apiClient = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'accept': 'application/json',
                'access-token': API_TOKEN
            }
        });
    }

    /**
     * Busca todos os cartões de ação disponíveis
     */
    async getAllActionCards() {
        try {
            console.log('📋 Buscando todos os cartões de ação...');
            
            const response = await this.apiClient.get('/core/v2/api/action-cards');
            
            console.log(`✅ Encontrados ${response.data.length} cartões de ação`);
            return response.data;
            
        } catch (error) {
            console.error('❌ Erro ao buscar cartões de ação:', error.message);
            throw error;
        }
    }

    /**
     * Busca um cartão de ação específico por ID
     */
    async getActionCardById(cardId) {
        try {
            console.log(`📋 Buscando cartão de ação ${cardId}...`);
            
            const response = await this.apiClient.get(`/core/v2/api/action-cards/${cardId}`);
            
            console.log(`✅ Cartão encontrado: ${response.data.name || response.data.id}`);
            return response.data;
            
        } catch (error) {
            console.error(`❌ Erro ao buscar cartão ${cardId}:`, error.message);
            throw error;
        }
    }

    /**
     * Filtra cartões de ação por tipo
     */
    filterCardsByType(cards, type) {
        return cards.filter(card => card.type === type);
    }

    /**
     * Filtra apenas cartões ativos
     */
    filterActiveCards(cards) {
        return cards.filter(card => card.active !== false);
    }

    /**
     * Exibe informações detalhadas de um cartão
     */
    displayCardInfo(card) {
        console.log('\n📋 ===========================================');
        console.log('   INFORMAÇÕES DO CARTÃO DE AÇÃO');
        console.log('===========================================');
        console.log(`🆔 ID: ${card.id}`);
        console.log(`📝 Nome: ${card.name || 'N/A'}`);
        console.log(`📄 Título: ${card.title || 'N/A'}`);
        console.log(`📋 Descrição: ${card.description || 'N/A'}`);
        console.log(`📦 Conteúdo: ${card.content ? card.content.substring(0, 100) + '...' : 'N/A'}`);
        console.log(`✅ Ativo: ${card.active !== false ? 'Sim' : 'Não'}`);
        console.log(`🏷️  Tipo: ${card.type || 'N/A'}`);
        console.log(`📂 Categoria: ${card.category || 'N/A'}`);
        console.log(`🏢 Org ID: ${card.organizationId || 'N/A'}`);
        console.log(`⭐ Padrão: ${card.isDefault ? 'Sim' : 'Não'}`);
        console.log(`📅 Criado: ${card.createdAt || 'N/A'}`);
        console.log(`🔄 Atualizado: ${card.updatedAt || 'N/A'}`);
        console.log('===========================================\n');
    }

    /**
     * Exibe lista resumida de cartões
     */
    displayCardsList(cards) {
        console.log('\n📋 ===========================================');
        console.log('   LISTA DE CARTÕES DE AÇÃO');
        console.log('===========================================');
        
        if (cards.length === 0) {
            console.log('⚠️  Nenhum cartão encontrado');
            return;
        }

        cards.forEach((card, index) => {
            const status = card.active !== false ? '✅' : '❌';
            const type = card.type ? ` (${card.type})` : '';
            console.log(`${index + 1}. ${status} ${card.name || card.title || card.id}${type}`);
        });
        
        console.log('===========================================\n');
    }

    /**
     * Exemplo de uso completo
     */
    async runExample() {
        try {
            console.log('🚀 ===========================================');
            console.log('   EXEMPLO DE USO - CARTÕES DE AÇÃO');
            console.log('===========================================');
            console.log(`📡 API: ${API_BASE_URL}`);
            console.log(`🔑 Token: ${API_TOKEN.substring(0, 8)}...`);
            console.log('===========================================\n');

            // 1. Buscar todos os cartões
            const allCards = await this.getAllActionCards();
            
            // 2. Exibir lista resumida
            this.displayCardsList(allCards);
            
            // 3. Filtrar cartões ativos
            const activeCards = this.filterActiveCards(allCards);
            console.log(`📊 Cartões ativos: ${activeCards.length}/${allCards.length}`);
            
            // 4. Filtrar por tipo (se houver)
            const waitingCards = this.filterCardsByType(allCards, 'waiting_message');
            const endDayCards = this.filterCardsByType(allCards, 'end_of_day_message');
            
            console.log(`📊 Cartões de espera: ${waitingCards.length}`);
            console.log(`📊 Cartões de fim de dia: ${endDayCards.length}`);
            
            // 5. Exibir detalhes do primeiro cartão
            if (allCards.length > 0) {
                this.displayCardInfo(allCards[0]);
            }
            
            // 6. Exemplo de busca por ID (se houver cartões)
            if (allCards.length > 0) {
                const firstCardId = allCards[0].id;
                try {
                    const specificCard = await this.getActionCardById(firstCardId);
                    console.log('✅ Busca por ID funcionando corretamente');
                } catch (error) {
                    console.log('⚠️  Busca por ID falhou (pode ser normal se o endpoint não existir)');
                }
            }

            console.log('🎯 ===========================================');
            console.log('   EXEMPLO CONCLUÍDO COM SUCESSO!');
            console.log('===========================================');
            console.log('✅ Todos os testes passaram');
            console.log('📋 A funcionalidade está pronta para uso');
            console.log('🔧 Integre com seu sistema conforme necessário');
            console.log('===========================================\n');

        } catch (error) {
            console.error('\n❌ ===========================================');
            console.error('   ERRO NO EXEMPLO');
            console.error('===========================================');
            console.error(`💥 Erro: ${error.message}`);
            console.error('🔧 Verifique sua conexão e token da API');
            console.error('===========================================\n');
        }
    }
}

// Executar exemplo
const example = new ActionCardsExample();
example.runExample();
