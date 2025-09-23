/**
 * Teste do carregamento de canais no frontend
 */

// Simular ambiente do navegador
const { JSDOM } = require('jsdom');

// Carregar variáveis de ambiente primeiro
require('dotenv').config();

async function testChannelsLoading() {
  console.log('🧪 TESTE DO CARREGAMENTO DE CANAIS NO FRONTEND\n');
  
  try {
    // Criar DOM simulado
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test</title>
      </head>
      <body>
        <select id="channel-select" class="form-select form-select-sm">
          <option value="">Selecione um canal...</option>
        </select>
        <div id="excluded-channels-list">
          <small class="text-muted">Nenhum canal excluído</small>
        </div>
      </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    
    // Simular função fetch
    global.fetch = async (url) => {
      if (url === '/api/channels') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: 'anexo1_estoque',
                description: 'Canal de Estoque - Anexo 1',
                identifier: 'anexo1',
                type: 2,
                organizationId: 'org123'
              },
              {
                id: 'whatsapp_oficial',
                description: 'Canal Oficial do WhatsApp',
                identifier: 'oficial',
                type: 2,
                organizationId: 'org123'
              },
              {
                id: 'confirmacao1',
                description: 'Canal de Confirmação 1',
                identifier: 'conf1',
                type: 2,
                organizationId: 'org123'
              }
            ]
          })
        };
      }
      throw new Error('URL não suportada');
    };
    
    // Simular função loadChannels
    async function loadChannels() {
      try {
        console.log('📋 Carregando canais...');
        
        const response = await fetch('/api/channels');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao carregar canais');
        }

        if (result.success && result.data) {
          console.log(`✅ ${result.data.length} canais carregados da API`);
          displayChannels(result.data);
        } else {
          console.log('⚠️ Nenhum canal encontrado na API');
        }

      } catch (error) {
        console.error('❌ Erro ao carregar canais:', error.message);
      }
    }
    
    // Simular função displayChannels
    function displayChannels(channels) {
      console.log('📱 displayChannels chamada com:', channels?.length || 0, 'canais');
      
      // Update channel select in configuracoes page (Listas de Exceção)
      const channelSelect = document.getElementById('channel-select');
      if (channelSelect) {
        console.log('✅ channel-select encontrado, populando...');
        channelSelect.innerHTML = '<option value="">Selecione um canal...</option>';
        
        if (channels && channels.length > 0) {
          channels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.id;
            
            // Usar description, identifier ou id para exibição
            const displayName = channel.description || channel.identifier || `Canal ${channel.id}`;
            
            // Montar texto da opção
            let optionText = displayName;
            if (channel.identifier) {
              optionText += ` (${channel.identifier})`;
            }
            
            option.textContent = optionText;
            option.title = channel.description || channel.identifier || displayName;
            
            channelSelect.appendChild(option);
          });
          console.log(`✅ ${channels.length} canais adicionados ao channel-select`);
        }
      } else {
        console.log('❌ channel-select não encontrado');
      }
    }
    
    // Teste 1: Verificar se elemento existe
    console.log('📋 Teste 1: Verificar se elemento channel-select existe');
    const channelSelect = document.getElementById('channel-select');
    if (channelSelect) {
      console.log('✅ Elemento channel-select encontrado');
      console.log(`   Classes: ${channelSelect.className}`);
      console.log(`   Opções iniciais: ${channelSelect.children.length}`);
    } else {
      console.log('❌ Elemento channel-select NÃO encontrado');
    }
    
    // Teste 2: Carregar canais
    console.log('\n📋 Teste 2: Carregar canais via API simulada');
    await loadChannels();
    
    // Teste 3: Verificar se canais foram adicionados
    console.log('\n📋 Teste 3: Verificar se canais foram adicionados ao select');
    if (channelSelect) {
      console.log(`✅ Total de opções: ${channelSelect.children.length}`);
      
      // Listar todas as opções
      for (let i = 0; i < channelSelect.children.length; i++) {
        const option = channelSelect.children[i];
        console.log(`   ${i + 1}. ${option.value} - ${option.textContent}`);
      }
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    
    if (channelSelect && channelSelect.children.length > 1) {
      console.log('✅ Canais foram carregados com sucesso no select!');
      console.log('✅ O problema pode estar na chamada real da função ou no timing.');
    } else {
      console.log('⚠️ Canais não foram carregados no select.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error.stack);
  }
}

// Executar teste
testChannelsLoading();
