/**
 * Gerenciador de Canais WhatsApp
 * Responsável por mapear tokens dos canais e gerenciar múltiplos canais
 */

class ChannelManager {
  constructor(errorHandler) {
    this.errorHandler = errorHandler;
    this.channels = this.initializeChannels();
  }

  /**
   * Inicializa os canais baseado nas variáveis de ambiente
   */
  initializeChannels() {
    const channels = [
      {
        id: 'anexo1_estoque',
        name: 'ANEXO 1 - ESTOQUE',
        number: '1',
        token: process.env.TOKEN_ANEXO1_ESTOQUE,
        description: 'Canal de Estoque - Anexo 1',
        department: 'estoque',
        active: true
      },
      {
        id: 'whatsapp_oficial',
        name: 'WHATSAPP OFICIAL',
        number: '2',
        token: process.env.TOKEN_WHATSAPP_OFICIAL,
        description: 'Canal Oficial do WhatsApp',
        department: 'oficial',
        active: true
      },
      {
        id: 'confirmacao1',
        name: 'CONFIRMAÇÃO 1',
        number: '3',
        token: process.env.TOKEN_CONFIRMACAO1,
        description: 'Canal de Confirmação 1',
        department: 'confirmacao',
        active: true
      },
      {
        id: 'confirmacao2_ti',
        name: 'CONFIRMAÇÃO 2 - TI',
        number: '4',
        token: process.env.TOKEN_CONFIRMACAO2_TI,
        description: 'Canal de Confirmação 2 - TI',
        department: 'ti',
        active: true
      },
      {
        id: 'confirmacao3_carla',
        name: 'CONFIRMAÇÃO 3 - CARLA',
        number: '5',
        token: process.env.TOKEN_CONFIRMACAO3_CARLA,
        description: 'Canal de Confirmação 3 - Carla',
        department: 'carla',
        active: true
      }
    ];

    // Validar se todos os tokens estão presentes
    const validChannels = channels.filter(channel => {
      if (!channel.token) {
        console.warn(`⚠️ Token não encontrado para canal ${channel.name}`);
        return false;
      }
      return true;
    });

    console.log(`📱 ${validChannels.length} canais inicializados com sucesso`);
    return validChannels;
  }

  /**
   * Retorna todos os canais
   */
  getAllChannels() {
    return this.channels;
  }

  /**
   * Retorna canal por ID
   */
  getChannelById(channelId) {
    return this.channels.find(channel => channel.id === channelId);
  }

  /**
   * Retorna canal por número
   */
  getChannelByNumber(number) {
    return this.channels.find(channel => channel.number === number);
  }

  /**
   * Retorna canal por token
   */
  getChannelByToken(token) {
    return this.channels.find(channel => channel.token === token);
  }

  /**
   * Retorna canais por departamento
   */
  getChannelsByDepartment(department) {
    return this.channels.filter(channel => channel.department === department);
  }

  /**
   * Retorna apenas canais ativos
   */
  getActiveChannels() {
    return this.channels.filter(channel => channel.active);
  }

  /**
   * Retorna token de um canal específico
   */
  getChannelToken(channelId) {
    const channel = this.getChannelById(channelId);
    return channel ? channel.token : null;
  }

  /**
   * Valida se um canal existe e está ativo
   */
  isChannelValid(channelId) {
    const channel = this.getChannelById(channelId);
    return channel && channel.active;
  }

  /**
   * Retorna estatísticas dos canais
   */
  getChannelStats() {
    const total = this.channels.length;
    const active = this.channels.filter(c => c.active).length;
    const departments = [...new Set(this.channels.map(c => c.department))];

    return {
      total,
      active,
      inactive: total - active,
      departments: departments.length,
      departmentList: departments
    };
  }

  /**
   * Retorna dados formatados para o frontend
   */
  getChannelsForFrontend() {
    return this.channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      number: channel.number,
      description: channel.description,
      department: channel.department,
      active: channel.active,
      // Não incluir token por segurança
    }));
  }

  /**
   * Retorna lista de canais para dropdowns
   */
  getChannelsForDropdown() {
    return this.channels.map(channel => ({
      value: channel.id,
      text: `${channel.number} - ${channel.name}`,
      number: channel.number,
      name: channel.name,
      department: channel.department
    }));
  }

  /**
   * Log de informações dos canais (para debug)
   */
  logChannelInfo() {
    console.log('\n📱 INFORMAÇÕES DOS CANAIS:');
    console.log('========================');
    
    this.channels.forEach(channel => {
      console.log(`📞 Canal ${channel.number}: ${channel.name}`);
      console.log(`   ID: ${channel.id}`);
      console.log(`   Departamento: ${channel.department}`);
      console.log(`   Token: ${channel.token ? '✅ Presente' : '❌ Ausente'}`);
      console.log(`   Ativo: ${channel.active ? '✅' : '❌'}`);
      console.log('');
    });

    const stats = this.getChannelStats();
    console.log('📊 ESTATÍSTICAS:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Ativos: ${stats.active}`);
    console.log(`   Departamentos: ${stats.departments}`);
    console.log('========================\n');
  }
}

module.exports = { ChannelManager };
