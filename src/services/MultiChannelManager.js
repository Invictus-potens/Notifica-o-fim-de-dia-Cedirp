const { KrolikApiClient } = require('./KrolikApiClient');

/**
 * Gerenciador de múltiplos canais WhatsApp
 * Gerencia canais, contexto de conversas e distribuição de mensagens
 */
class MultiChannelManager {
  constructor(configManager, errorHandler) {
    this.configManager = configManager;
    this.errorHandler = errorHandler;
    this.channels = new Map();
    this.conversationContext = new Map(); // phone -> { channelId, startedAt, lastMessageAt }
    this.channelLoad = new Map(); // channelId -> { activeConversations, lastUsed }
    this.loadChannels();
  }

  /**
   * Carrega canais da configuração
   */
  loadChannels() {
    try {
      console.log('🔄 Carregando canais da configuração...');
      
      // Limpar canais existentes
      this.channels.clear();
      this.channelLoad.clear();

      const channels = this.configManager.getChannels();
      
      channels.forEach(channel => {
        // Criar cliente API específico para cada canal
        const apiClient = new KrolikApiClient({
          baseURL: process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com.br',
          token: channel.token,
          timeout: 10000
        });

        // Armazenar canal com cliente API
        this.channels.set(channel.id, {
          ...channel,
          apiClient: apiClient
        });

        // Inicializar carga do canal
        this.channelLoad.set(channel.id, {
          activeConversations: 0,
          lastUsed: null,
          totalMessages: 0,
          failedMessages: 0
        });

        console.log(`✅ Canal carregado: ${channel.name} (${channel.number})`);
      });

      console.log(`📱 Total de canais carregados: ${this.channels.size}`);
    } catch (error) {
      this.errorHandler.logError(error, 'MultiChannelManager.loadChannels');
    }
  }

  /**
   * Obtém canal por ID
   * @param {string} channelId - ID do canal
   * @returns {Object|null} Canal encontrado ou null
   */
  getChannelById(channelId) {
    return this.channels.get(channelId) || null;
  }

  /**
   * Obtém canal por número
   * @param {string} number - Número do canal
   * @returns {Object|null} Canal encontrado ou null
   */
  getChannelByNumber(number) {
    for (const channel of this.channels.values()) {
      if (channel.number === number) {
        return channel;
      }
    }
    return null;
  }

  /**
   * Obtém todos os canais
   * @returns {Array} Lista de canais
   */
  getAllChannels() {
    return Array.from(this.channels.values());
  }

  /**
   * Obtém canais ativos
   * @returns {Array} Lista de canais ativos
   */
  getActiveChannels() {
    return this.getAllChannels().filter(channel => channel.active === true);
  }

  /**
   * Obtém canais por departamento
   * @param {string} department - Departamento
   * @returns {Array} Lista de canais do departamento
   */
  getChannelsByDepartment(department) {
    return this.getActiveChannels().filter(channel => channel.department === department);
  }

  /**
   * Escolhe o melhor canal para um paciente
   * @param {Object} patient - Dados do paciente
   * @returns {Object|null} Melhor canal ou null
   */
  getBestChannelForPatient(patient) {
    try {
      const patientSector = patient.sector || 'default';
      const patientDepartment = this.mapSectorToDepartment(patientSector);
      
      // 1. Tentar encontrar canal específico para o departamento
      const departmentChannels = this.getChannelsByDepartment(patientDepartment);
      if (departmentChannels.length > 0) {
        const bestChannel = this.selectChannelByLoad(departmentChannels);
        if (bestChannel) {
          console.log(`🎯 Canal escolhido por departamento: ${bestChannel.name} (${patientDepartment})`);
          return bestChannel;
        }
      }

      // 2. Se não encontrar por departamento, usar todos os canais ativos
      const activeChannels = this.getActiveChannels();
      if (activeChannels.length === 0) {
        console.error('❌ Nenhum canal ativo disponível');
        return null;
      }

      const bestChannel = this.selectChannelByLoad(activeChannels);
      console.log(`🎯 Canal escolhido por carga: ${bestChannel.name}`);
      return bestChannel;
    } catch (error) {
      this.errorHandler.logError(error, 'MultiChannelManager.getBestChannelForPatient');
      return null;
    }
  }

  /**
   * Mapeia setor do paciente para departamento
   * @param {string} sector - Setor do paciente
   * @returns {string} Departamento correspondente
   */
  mapSectorToDepartment(sector) {
    const sectorMap = {
      'estoque': 'estoque',
      'ti': 'ti',
      'oficial': 'oficial',
      'confirmacao': 'confirmacao',
      'carla': 'carla',
      'default': 'oficial'
    };
    
    return sectorMap[sector.toLowerCase()] || 'oficial';
  }

  /**
   * Seleciona canal com algoritmo de balanceamento avançado
   * @param {Array} channels - Lista de canais
   * @returns {Object|null} Canal selecionado
   */
  selectChannelByLoad(channels) {
    if (channels.length === 0) return null;
    if (channels.length === 1) return channels[0];

    // Aplicar algoritmo de balanceamento baseado em múltiplos fatores
    const scoredChannels = channels.map(channel => {
      const load = this.channelLoad.get(channel.id);
      const score = this.calculateChannelScore(channel, load);
      return { channel, score };
    });

    // Ordenar por score (menor score = melhor canal)
    scoredChannels.sort((a, b) => a.score - b.score);

    const selectedChannel = scoredChannels[0].channel;
    console.log(`🎯 Canal selecionado: ${selectedChannel.name} (score: ${scoredChannels[0].score})`);
    
    return selectedChannel;
  }

  /**
   * Calcula score de um canal baseado em múltiplos fatores
   * @param {Object} channel - Canal
   * @param {Object} load - Dados de carga do canal
   * @returns {number} Score do canal (menor = melhor)
   */
  calculateChannelScore(channel, load) {
    const factors = {
      // Fator 1: Conversas ativas (peso 40%)
      activeConversations: (load.activeConversations || 0) * 0.4,
      
      // Fator 2: Prioridade do canal (peso 30%)
      priority: channel.priority * 0.3,
      
      // Fator 3: Taxa de sucesso (peso 20%)
      successRate: this.calculateSuccessRate(load) * 0.2,
      
      // Fator 4: Tempo desde último uso (peso 10%)
      lastUsed: this.calculateLastUsedScore(load.lastUsed) * 0.1
    };

    const totalScore = Object.values(factors).reduce((sum, value) => sum + value, 0);
    
    console.log(`📊 Score do canal ${channel.name}:`, {
      conversas: factors.activeConversations,
      prioridade: factors.priority,
      sucesso: factors.successRate,
      ultimoUso: factors.lastUsed,
      total: totalScore
    });

    return totalScore;
  }

  /**
   * Calcula taxa de sucesso do canal
   * @param {Object} load - Dados de carga do canal
   * @returns {number} Taxa de sucesso (0-100, menor = melhor)
   */
  calculateSuccessRate(load) {
    const totalMessages = load.totalMessages || 0;
    const failedMessages = load.failedMessages || 0;
    
    if (totalMessages === 0) return 0; // Canal sem histórico
    
    const successRate = ((totalMessages - failedMessages) / totalMessages) * 100;
    return 100 - successRate; // Inverter para que menor seja melhor
  }

  /**
   * Calcula score baseado no tempo desde último uso
   * @param {Date|null} lastUsed - Data do último uso
   * @returns {number} Score do último uso (menor = melhor)
   */
  calculateLastUsedScore(lastUsed) {
    if (!lastUsed) return 0; // Canal nunca usado
    
    const now = new Date();
    const timeDiff = now - new Date(lastUsed);
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    // Canal usado recentemente tem score menor (melhor)
    return Math.max(0, 24 - hoursDiff);
  }

  /**
   * Registra nova conversa
   * @param {string} phone - Número do telefone
   * @param {string} channelId - ID do canal
   */
  registerConversation(phone, channelId) {
    try {
      const channel = this.getChannelById(channelId);
      if (!channel) {
        throw new Error(`Canal ${channelId} não encontrado`);
      }

      this.conversationContext.set(phone, {
        channelId: channelId,
        startedAt: new Date(),
        lastMessageAt: new Date(),
        messageCount: 0
      });

      // Atualizar carga do canal
      const load = this.channelLoad.get(channelId);
      if (load) {
        load.activeConversations++;
        load.lastUsed = new Date();
      }

      console.log(`💬 Nova conversa registrada: ${phone} -> ${channel.name} (${channel.number})`);
    } catch (error) {
      this.errorHandler.logError(error, 'MultiChannelManager.registerConversation');
    }
  }

  /**
   * Obtém canal para conversa existente
   * @param {string} phone - Número do telefone
   * @returns {Object|null} Canal da conversa ou null
   */
  getChannelForConversation(phone) {
    const context = this.conversationContext.get(phone);
    if (!context) return null;

    const channel = this.getChannelById(context.channelId);
    if (!channel || !channel.active) {
      // Canal não existe mais ou está inativo, remover contexto
      this.conversationContext.delete(phone);
      return null;
    }

    return channel;
  }

  /**
   * Atualiza última mensagem da conversa
   * @param {string} phone - Número do telefone
   */
  updateLastMessage(phone) {
    const context = this.conversationContext.get(phone);
    if (context) {
      context.lastMessageAt = new Date();
      context.messageCount++;
    }
  }

  /**
   * Finaliza conversa
   * @param {string} phone - Número do telefone
   */
  endConversation(phone) {
    const context = this.conversationContext.get(phone);
    if (context) {
      // Atualizar carga do canal
      const load = this.channelLoad.get(context.channelId);
      if (load && load.activeConversations > 0) {
        load.activeConversations--;
      }

      this.conversationContext.delete(phone);
      console.log(`🔚 Conversa finalizada: ${phone}`);
    }
  }

  /**
   * Obtém estatísticas de carga dos canais
   * @returns {Object} Estatísticas de carga
   */
  getChannelLoadStats() {
    const stats = {};
    
    for (const [channelId, load] of this.channelLoad) {
      const channel = this.getChannelById(channelId);
      if (channel) {
        const health = this.getChannelHealth(channelId);
        stats[channelId] = {
          name: channel.name,
          number: channel.number,
          department: channel.department,
          activeConversations: load.activeConversations,
          totalMessages: load.totalMessages,
          failedMessages: load.failedMessages,
          lastUsed: load.lastUsed,
          successRate: load.totalMessages > 0 ? 
            ((load.totalMessages - load.failedMessages) / load.totalMessages * 100).toFixed(2) : 100,
          health: health
        };
      }
    }

    return stats;
  }

  /**
   * Obtém estatísticas de conversas ativas
   * @returns {Object} Estatísticas de conversas
   */
  getConversationStats() {
    const totalConversations = this.conversationContext.size;
    const conversationsByChannel = {};

    for (const [phone, context] of this.conversationContext) {
      const channelId = context.channelId;
      if (!conversationsByChannel[channelId]) {
        conversationsByChannel[channelId] = 0;
      }
      conversationsByChannel[channelId]++;
    }

    return {
      total: totalConversations,
      byChannel: conversationsByChannel
    };
  }

  /**
   * Avalia a saúde de um canal
   * @param {string} channelId - ID do canal
   * @returns {Object} Status de saúde do canal
   */
  getChannelHealth(channelId) {
    const channel = this.channels.get(channelId);
    const load = this.channelLoad.get(channelId);
    
    if (!channel || !load) {
      return { status: 'unknown', score: 0, issues: ['Canal não encontrado'] };
    }

    const issues = [];
    let score = 100;

    // Verificar se canal está ativo
    if (!channel.active) {
      issues.push('Canal inativo');
      score -= 50;
    }

    // Verificar taxa de falhas
    const totalMessages = load.totalMessages || 0;
    const failedMessages = load.failedMessages || 0;
    if (totalMessages > 0) {
      const failureRate = (failedMessages / totalMessages) * 100;
      if (failureRate > 20) {
        issues.push(`Taxa de falhas alta: ${failureRate.toFixed(1)}%`);
        score -= Math.min(30, failureRate);
      }
    }

    // Verificar tempo desde último uso
    if (load.lastUsed) {
      const hoursSinceLastUse = (new Date() - new Date(load.lastUsed)) / (1000 * 60 * 60);
      if (hoursSinceLastUse > 24) {
        issues.push(`Inativo há ${Math.round(hoursSinceLastUse)} horas`);
        score -= Math.min(20, hoursSinceLastUse / 24 * 10);
      }
    }

    // Verificar sobrecarga
    if (load.activeConversations > 50) {
      issues.push(`Sobrecarga: ${load.activeConversations} conversas ativas`);
      score -= Math.min(25, load.activeConversations / 2);
    }

    // Determinar status
    let status = 'healthy';
    if (score < 30) status = 'critical';
    else if (score < 60) status = 'warning';
    else if (score < 80) status = 'degraded';

    return {
      status,
      score: Math.max(0, Math.round(score)),
      issues,
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Obtém canais com problemas de saúde
   * @returns {Array} Lista de canais com problemas
   */
  getUnhealthyChannels() {
    const unhealthyChannels = [];
    
    this.channels.forEach((channel, channelId) => {
      const health = this.getChannelHealth(channelId);
      if (health.status !== 'healthy') {
        unhealthyChannels.push({
          channel,
          health
        });
      }
    });

    return unhealthyChannels;
  }

  /**
   * Verifica se há canais disponíveis para fallback
   * @returns {boolean} True se há canais saudáveis disponíveis
   */
  hasHealthyChannelsAvailable() {
    const healthyChannels = Array.from(this.channels.values()).filter(channel => {
      if (!channel.active) return false;
      const health = this.getChannelHealth(channel.id);
      return health.status === 'healthy' || health.status === 'degraded';
    });

    return healthyChannels.length > 0;
  }

  /**
   * Limpa conversas inativas (mais de 24h sem mensagem)
   */
  cleanupInactiveConversations() {
    try {
      const now = new Date();
      const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 horas
      const inactivePhones = [];

      for (const [phone, context] of this.conversationContext) {
        const timeSinceLastMessage = now - context.lastMessageAt;
        if (timeSinceLastMessage > inactiveThreshold) {
          inactivePhones.push(phone);
        }
      }

      inactivePhones.forEach(phone => {
        this.endConversation(phone);
      });

      if (inactivePhones.length > 0) {
        console.log(`🧹 Limpeza de conversas: ${inactivePhones.length} conversas inativas removidas`);
      }
    } catch (error) {
      this.errorHandler.logError(error, 'MultiChannelManager.cleanupInactiveConversations');
    }
  }

  /**
   * Atualiza métricas de canal após envio de mensagem
   * @param {string} channelId - ID do canal
   * @param {boolean} success - Se a mensagem foi enviada com sucesso
   */
  updateChannelMetrics(channelId, success) {
    const load = this.channelLoad.get(channelId);
    if (load) {
      load.totalMessages++;
      if (!success) {
        load.failedMessages++;
      }
    }

    // Atualizar métricas no ConfigManager
    if (success) {
      this.configManager.incrementChannelMessagesSent(channelId);
    } else {
      this.configManager.incrementChannelMessagesFailed(channelId);
    }
  }

  /**
   * Obtém informações completas de um canal
   * @param {string} channelId - ID do canal
   * @returns {Object|null} Informações completas do canal
   */
  getChannelInfo(channelId) {
    const channel = this.getChannelById(channelId);
    if (!channel) return null;

    const load = this.channelLoad.get(channelId);
    const metrics = this.configManager.getChannelMetrics(channelId);

    return {
      ...channel,
      load: load || { activeConversations: 0, lastUsed: null, totalMessages: 0, failedMessages: 0 },
      metrics: metrics
    };
  }

  /**
   * Reinicializa canais (útil após mudanças na configuração)
   */
  reloadChannels() {
    console.log('🔄 Reinicializando canais...');
    this.loadChannels();
  }
}

module.exports = { MultiChannelManager };
