/**
 * Teste com dados reais da API
 */

// Simular ambiente do navegador
const { JSDOM } = require('jsdom');

async function testRealApiData() {
  console.log('🧪 TESTE COM DADOS REAIS DA API\n');
  
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
    
    // Dados reais da API (baseados no teste anterior)
    const realApiData = [
      {
        id: 'anexo1_estoque',
        description: 'Canal de Estoque - Anexo 1',
        identifier: undefined, // Como vem da API real
        type: undefined, // Como vem da API real
        organizationId: undefined // Como vem da API real
      },
      {
        id: 'whatsapp_oficial',
        description: 'Canal Oficial do WhatsApp',
        identifier: undefined,
        type: undefined,
        organizationId: undefined
      },
      {
        id: 'confirmacao1',
        description: 'Canal de Confirmação 1',
        identifier: undefined,
        type: undefined,
        organizationId: undefined
      },
      {
        id: 'confirmacao2_ti',
        description: 'Canal de Confirmação 2 - TI',
        identifier: undefined,
        type: undefined,
        organizationId: undefined
      },
      {
        id: 'confirmacao3_carla',
        description: 'Canal de Confirmação 3 - Carla',
        identifier: undefined,
        type: undefined,
        organizationId: undefined
      }
    ];
    
    // Função getChannelTypeName (copiada do código real)
    function getChannelTypeName(type) {
      const typeMap = {
        1: 'WhatsApp Pessoal',
        2: 'WhatsApp Business',
        3: 'WhatsApp Business API',
        4: 'WhatsApp Business (Principal)',
        5: 'Telegram',
        6: 'Instagram',
        7: 'Facebook Messenger',
        8: 'SMS',
        9: 'Email',
        10: 'API Externa'
      };
      return typeMap[type] || 'Desconhecido';
    }
    
    // Função displayChannels (copiada do código real)
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
            
            // Adicionar informações adicionais se disponíveis
            let optionText = displayName;
            if (channel.type) {
              const typeName = getChannelTypeName(channel.type);
              optionText += ` (${typeName})`;
            }
            if (channel.active === false) {
              optionText += ' [Inativo]';
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
    
    // Teste 1: Verificar dados da API
    console.log('📋 Teste 1: Verificar dados da API');
    console.log(`✅ Total de canais: ${realApiData.length}`);
    
    realApiData.forEach((channel, index) => {
      console.log(`\n   Canal ${index + 1}:`);
      console.log(`   ID: ${channel.id}`);
      console.log(`   Description: ${channel.description}`);
      console.log(`   Identifier: ${channel.identifier || 'undefined'}`);
      console.log(`   Type: ${channel.type || 'undefined'}`);
      console.log(`   Organization ID: ${channel.organizationId || 'undefined'}`);
    });
    
    // Teste 2: Simular displayChannels com dados reais
    console.log('\n📋 Teste 2: Simular displayChannels com dados reais');
    displayChannels(realApiData);
    
    // Teste 3: Verificar resultado
    console.log('\n📋 Teste 3: Verificar resultado');
    const channelSelect = document.getElementById('channel-select');
    if (channelSelect) {
      console.log(`✅ Total de opções: ${channelSelect.children.length}`);
      
      // Listar todas as opções
      for (let i = 0; i < channelSelect.children.length; i++) {
        const option = channelSelect.children[i];
        console.log(`   ${i + 1}. ${option.value} - ${option.textContent}`);
      }
    }
    
    // Teste 4: Verificar se há erros
    console.log('\n📋 Teste 4: Verificar se há erros');
    try {
      // Testar getChannelTypeName com undefined
      const typeName = getChannelTypeName(undefined);
      console.log(`✅ getChannelTypeName(undefined): "${typeName}"`);
      
      // Testar getChannelTypeName com tipo válido
      const typeName2 = getChannelTypeName(2);
      console.log(`✅ getChannelTypeName(2): "${typeName2}"`);
      
    } catch (error) {
      console.log(`❌ Erro em getChannelTypeName: ${error.message}`);
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    
    if (channelSelect && channelSelect.children.length > 1) {
      console.log('✅ Canais foram carregados com sucesso usando dados reais!');
      console.log('✅ O problema pode estar na chamada da função ou no timing.');
    } else {
      console.log('⚠️ Canais não foram carregados com dados reais.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error.stack);
  }
}

// Executar teste
testRealApiData();
