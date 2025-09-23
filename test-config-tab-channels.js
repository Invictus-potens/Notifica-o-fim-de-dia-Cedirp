/**
 * Teste específico do carregamento de canais na aba configurações
 */

// Simular ambiente do navegador
const { JSDOM } = require('jsdom');

// Carregar variáveis de ambiente primeiro
require('dotenv').config();

async function testConfigTabChannels() {
  console.log('🧪 TESTE ESPECÍFICO DO CARREGAMENTO DE CANAIS NA ABA CONFIGURAÇÕES\n');
  
  try {
    // Criar DOM simulado com a estrutura completa da aba configurações
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test</title>
      </head>
      <body>
        <div id="configuracoes-route" class="route-content">
          <div class="row">
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-header">
                  <h6 class="mb-0">
                    <i class="bi bi-shield-x me-2"></i>Listas de Exceção
                  </h6>
                </div>
                <div class="card-body">
                  <!-- Excluded Sectors -->
                  <div class="mb-4">
                    <label class="form-label fw-bold">Setores Excluídos</label>
                    <div class="d-flex gap-2 mb-2">
                      <select id="sector-select" class="form-select form-select-sm">
                        <option value="">Selecione um setor...</option>
                      </select>
                      <button id="add-sector-btn" class="btn btn-outline-primary btn-sm">
                        <i class="bi bi-plus"></i>
                      </button>
                    </div>
                    <div id="excluded-sectors-list" class="border rounded p-3" style="min-height: 60px; background-color: #f8fafc; border-color: #e2e8f0;">
                      <small class="text-muted">Nenhum setor excluído</small>
                    </div>
                  </div>

                  <!-- Excluded Channels -->
                  <div>
                    <label class="form-label fw-bold">Canais Excluídos</label>
                    <div class="d-flex gap-2 mb-2">
                      <select id="channel-select" class="form-select form-select-sm">
                        <option value="">Selecione um canal...</option>
                      </select>
                      <button id="add-channel-btn" class="btn btn-outline-primary btn-sm">
                        <i class="bi bi-plus"></i>
                      </button>
                    </div>
                    <div id="excluded-channels-list" class="border rounded p-3" style="min-height: 60px; background-color: #f8fafc; border-color: #e2e8f0;">
                      <small class="text-muted">Nenhum canal excluído</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
              },
              {
                id: 'confirmacao2_ti',
                description: 'Canal de Confirmação 2 - TI',
                identifier: 'conf2',
                type: 2,
                organizationId: 'org123'
              },
              {
                id: 'confirmacao3_carla',
                description: 'Canal de Confirmação 3 - Carla',
                identifier: 'conf3',
                type: 2,
                organizationId: 'org123'
              }
            ]
          })
        };
      }
      throw new Error('URL não suportada');
    };
    
    // Simular classe AutomationInterface simplificada
    class TestAutomationInterface {
      constructor() {
        this.availableChannels = [];
        this.excludedChannels = [];
      }
      
      async loadChannels() {
        try {
          console.log('📋 Carregando canais...');
          
          const response = await fetch('/api/channels');
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Erro ao carregar canais');
          }

          if (result.success && result.data) {
            console.log(`✅ ${result.data.length} canais carregados da API`);
            this.displayChannels(result.data);
          } else {
            console.log('⚠️ Nenhum canal encontrado na API');
          }

        } catch (error) {
          console.error('❌ Erro ao carregar canais:', error.message);
        }
      }
      
      displayChannels(channels) {
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

        // Store channels for later use
        this.availableChannels = channels || [];
        console.log('✅ availableChannels atualizado com', this.availableChannels.length, 'canais');
      }
      
      async loadRouteData(route) {
        console.log(`📋 loadRouteData chamada para rota: ${route}`);
        
        if (route === 'configuracoes') {
          console.log('⚙️ Carregando dados das configurações...');
          console.log('📱 Chamando loadChannels...');
          await this.loadChannels();
          console.log('✅ Carregamento de configurações concluído');
        }
      }
    }
    
    // Teste 1: Verificar se elementos existem
    console.log('📋 Teste 1: Verificar se elementos existem');
    const channelSelect = document.getElementById('channel-select');
    const addChannelBtn = document.getElementById('add-channel-btn');
    
    if (channelSelect) {
      console.log('✅ Elemento channel-select encontrado');
      console.log(`   Classes: ${channelSelect.className}`);
      console.log(`   Opções iniciais: ${channelSelect.children.length}`);
    } else {
      console.log('❌ Elemento channel-select NÃO encontrado');
    }
    
    if (addChannelBtn) {
      console.log('✅ Elemento add-channel-btn encontrado');
    } else {
      console.log('❌ Elemento add-channel-btn NÃO encontrado');
    }
    
    // Teste 2: Simular carregamento da aba configurações
    console.log('\n📋 Teste 2: Simular carregamento da aba configurações');
    const automationInterface = new TestAutomationInterface();
    await automationInterface.loadRouteData('configuracoes');
    
    // Teste 3: Verificar se canais foram carregados
    console.log('\n📋 Teste 3: Verificar se canais foram carregados no select');
    if (channelSelect) {
      console.log(`✅ Total de opções: ${channelSelect.children.length}`);
      
      // Listar todas as opções
      for (let i = 0; i < channelSelect.children.length; i++) {
        const option = channelSelect.children[i];
        console.log(`   ${i + 1}. ${option.value} - ${option.textContent}`);
      }
      
      // Verificar se há canais disponíveis
      const availableChannelsCount = automationInterface.availableChannels.length;
      console.log(`\n📊 Canais disponíveis na memória: ${availableChannelsCount}`);
      
      if (availableChannelsCount > 0) {
        console.log('📋 Lista de canais disponíveis:');
        automationInterface.availableChannels.forEach((channel, index) => {
          console.log(`   ${index + 1}. ${channel.id} - ${channel.description}`);
        });
      }
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    
    if (channelSelect && channelSelect.children.length > 1) {
      console.log('✅ Canais foram carregados com sucesso na aba configurações!');
      console.log('✅ O problema pode estar na implementação real ou no timing.');
    } else {
      console.log('⚠️ Canais não foram carregados na aba configurações.');
      console.log('⚠️ Verificar se loadChannels() está sendo chamada corretamente.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error.stack);
  }
}

// Executar teste
testConfigTabChannels();
