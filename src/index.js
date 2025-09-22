const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging básico para requisições
app.use((req, res, next) => {
  // Log para requisições de API e health check
  if (req.url.startsWith('/api/') || req.url === '/health') {
    const timestamp = new Date().toLocaleString('pt-BR');
    const method = req.method;
    const url = req.url;
    const ip = req.ip || 'desconhecido';
    
    // Emoji baseado no método HTTP
    const methodIcon = method === 'GET' ? '📥' : 
                     method === 'POST' ? '📤' : 
                     method === 'PUT' ? '🔄' : 
                     method === 'DELETE' ? '🗑️' : '📡';
    
    // Emoji baseado na rota
    const routeIcon = url.includes('health') ? '🏥' :
                     url.includes('status') ? '📊' :
                     url.includes('logs') ? '📝' :
                     url.includes('metrics') ? '📈' :
                     url.includes('config') ? '⚙️' : '🔗';
    
    console.log(`${methodIcon} ${routeIcon} [${timestamp}] ${method} ${url} - IP: ${ip}`);
  }
  next();
});

// Importar MainController (versão JavaScript)
const { MainController } = require('./controllers/MainController');
const { KrolikApiClient } = require('./services/KrolikApiClient');

// Inicializar MainController
const mainController = new MainController();

// Função para obter um token válido para operações gerais
function getValidToken() {
  // Tentar usar tokens específicos do .env
  const tokens = [
    process.env.TOKEN_ANEXO1_ESTOQUE,
    process.env.TOKEN_WHATSAPP_OFICIAL,
    process.env.TOKEN_CONFIRMACAO1,
    process.env.TOKEN_CONFIRMACAO2_TI,
    process.env.TOKEN_CONFIRMACAO3_CARLA,
    process.env.KROLIK_API_TOKEN // Fallback para token geral
  ].filter(token => token); // Remove valores undefined/null

  return tokens[0] || null;
}

// Inicializar KrolikApiClient
const validToken = getValidToken();
if (validToken) {
  console.log(`🔑 Token configurado para KrolikApiClient: ${validToken.substring(0, 8)}...`);
} else {
  console.warn('⚠️ Nenhum token válido encontrado para KrolikApiClient');
}

const krolikApiClient = new KrolikApiClient({
  baseURL: process.env.KROLIK_API_BASE_URL || 'https://api.camkrolik.com.br',
  token: validToken,
  timeout: 10000
});

// Conectar métricas do sistema ao KrolikApiClient após inicialização
mainController.initialize().then(() => {
  // Acessar diretamente o SystemMetricsManager do MainController
  const systemMetricsManager = mainController.systemMetricsManager;
  if (systemMetricsManager && typeof systemMetricsManager.incrementRequests === 'function') {
    krolikApiClient.setSystemMetrics(systemMetricsManager);
    console.log('🔗 Métricas do sistema conectadas ao KrolikApiClient');
  } else {
    console.error('❌ SystemMetricsManager não disponível ou métodos não encontrados');
  }
}).catch(error => {
  console.error('❌ Erro ao conectar métricas:', error);
});

// Servir arquivos estáticos da interface web
app.use(express.static(path.join(__dirname, '../public')));

// Rota principal - Interface Web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// API Routes

// Status do sistema
app.get('/api/status', async (req, res) => {
  try {
    const status = await mainController.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({ error: 'Erro ao obter status do sistema' });
  }
});

// Configuração do sistema
app.get('/api/config', async (req, res) => {
  try {
    const config = mainController.getSystemConfig();
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao obter configuração:', error);
    res.status(500).json({ error: 'Erro ao obter configuração' });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    await mainController.updateSystemConfig(req.body);
    res.json({ success: true, message: 'Configuração atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ error: 'Erro ao atualizar configuração' });
  }
});

// Rota específica para Action Cards
app.get('/api/action-cards', async (req, res) => {
  try {
    const actionCards = mainController.getActionCards();
    res.json({
      success: true,
      data: actionCards,
      message: 'Action Cards obtidos com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao obter Action Cards:', error);
    res.status(500).json({ error: 'Erro ao obter Action Cards' });
  }
});

app.post('/api/action-cards', async (req, res) => {
  try {
    const { default: defaultCard, thirtyMin, endOfDay } = req.body;
    
    if (!defaultCard && !thirtyMin && !endOfDay) {
      return res.status(400).json({ 
        error: 'Pelo menos um Action Card deve ser fornecido',
        message: 'Forneça default, thirtyMin ou endOfDay'
      });
    }

    const actionCards = {};
    if (defaultCard) actionCards.default = defaultCard;
    if (thirtyMin) actionCards.thirtyMin = thirtyMin;
    if (endOfDay) actionCards.endOfDay = endOfDay;

    await mainController.updateActionCards(actionCards);
    
    // Retornar configuração atualizada
    const updatedCards = mainController.getActionCards();
    
    res.json({ 
      success: true, 
      message: 'Action Cards atualizados com sucesso',
      data: updatedCards,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao atualizar Action Cards:', error);
    res.status(500).json({ error: 'Erro ao atualizar Action Cards' });
  }
});

// Informações da próxima mensagem
app.get('/api/next-message-info', (req, res) => {
  try {
    const nextMessageInfo = mainController.getNextMessageInfo();
    res.json(nextMessageInfo);
  } catch (error) {
    console.error('Erro ao obter informações da próxima mensagem:', error);
    res.status(500).json({ error: 'Erro ao obter informações da próxima mensagem' });
  }
});

// Logs do sistema
app.get('/api/logs', (req, res) => {
  try {
    const level = req.query.level ? parseInt(req.query.level) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    
    const logs = mainController.getLogs(level, limit);
    
    const formattedLogs = logs.map(log => ({
      level: log.level,
      message: log.message,
      context: log.context,
      timestamp: log.timestamp,
      error: log.error ? log.error.message : undefined,
      metadata: log.metadata
    }));
    
    res.json(formattedLogs);
  } catch (error) {
    console.error('Erro ao obter logs:', error);
    res.status(500).json({ error: 'Erro ao obter logs' });
  }
});

// Adicionar log de ação do usuário
app.post('/api/logs', (req, res) => {
  try {
    const { action, details, timestamp } = req.body;
    
    console.log(`📝 Log de ação do usuário: ${action}`, details);
    
    res.json({
      success: true,
      message: 'Log de ação registrado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao registrar log de ação:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao registrar log de ação' 
    });
  }
});

// Controle do sistema
app.post('/api/system/start', async (req, res) => {
  try {
    await mainController.start();
    res.json({ success: true, message: 'Sistema iniciado com sucesso' });
  } catch (error) {
    console.error('Erro ao iniciar sistema:', error);
    res.status(500).json({ error: 'Erro ao iniciar sistema' });
  }
});

app.post('/api/system/stop', async (req, res) => {
  try {
    await mainController.stop();
    res.json({ success: true, message: 'Sistema parado com sucesso' });
  } catch (error) {
    console.error('Erro ao parar sistema:', error);
    res.status(500).json({ error: 'Erro ao parar sistema' });
  }
});

app.post('/api/system/pause', (req, res) => {
  try {
    mainController.pauseFlow();
    res.json({ success: true, message: 'Fluxo pausado com sucesso' });
  } catch (error) {
    console.error('Erro ao pausar fluxo:', error);
    res.status(500).json({ error: 'Erro ao pausar fluxo' });
  }
});

app.post('/api/system/resume', (req, res) => {
  try {
    mainController.resumeFlow();
    res.json({ success: true, message: 'Fluxo resumido com sucesso' });
  } catch (error) {
    console.error('Erro ao resumir fluxo:', error);
    res.status(500).json({ error: 'Erro ao resumir fluxo' });
  }
});

app.post('/api/logs/clear', (req, res) => {
  try {
    mainController.clearLogs();
    res.json({ success: true, message: 'Logs limpos com sucesso' });
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    res.status(500).json({ error: 'Erro ao limpar logs' });
  }
});

// Pacientes em espera (busca da API CAM Krolik e sincroniza com arquivo local)
app.get('/api/patients', async (req, res) => {
  try {
    console.log('📋 API: Buscando pacientes da API CAM Krolik...');
    
    // Buscar pacientes reais da API CAM Krolik
    const livePatients = await krolikApiClient.listWaitingAttendances();
    console.log(`📋 API: Encontrados ${livePatients.length} pacientes na API CAM Krolik`);
    
    // Atualizar arquivo local com dados da API
    if (livePatients.length > 0) {
      await mainController.jsonPatientManager.updateActivePatients(livePatients);
      console.log(`📋 API: Arquivo local atualizado com ${livePatients.length} pacientes`);
    }
    
    // Retornar dados atualizados
    res.json({
      success: true,
      data: livePatients,
      total: livePatients.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    
    // Fallback: tentar dados locais se API falhar
    try {
      console.log('📋 API: Tentando fallback para dados locais...');
      const localPatients = await mainController.jsonPatientManager.loadPatientsFromFile(
        mainController.jsonPatientManager.files.active
      );
      
      res.json({
        success: true,
        data: localPatients,
        total: localPatients.length,
        timestamp: new Date().toISOString(),
        fallback: true
      });
    } catch (fallbackError) {
      res.status(500).json({ 
        success: false,
        error: 'Erro ao buscar pacientes da API CAM Krolik e dados locais',
        message: error.message,
        data: [],
        total: 0,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Pacientes em espera (dados diretos da API CAM Krolik)
app.get('/api/patients/live', async (req, res) => {
  try {
    console.log('📋 API: Buscando pacientes na API CAM Krolik...');
    
    // Buscar pacientes reais da API CAM Krolik
    const patients = await krolikApiClient.listWaitingAttendances();
    
    console.log(`📋 API: Retornando ${patients.length} pacientes da API CAM Krolik`);
    res.json({
      success: true,
      data: patients,
      total: patients.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar pacientes da API CAM Krolik:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao buscar pacientes da API CAM Krolik',
      message: error.message,
      data: [],
      total: 0,
      timestamp: new Date().toISOString()
    });
  }
});

// Histórico de mensagens enviadas
app.get('/api/messages/history', async (req, res) => {
  try {
    console.log('📨 API: Carregando histórico de mensagens...');
    
    const fs = require('fs').promises;
    const path = require('path');
    const messagesFilePath = path.join(__dirname, '../data/messages_sent.json');
    
    // Verificar se arquivo existe
    try {
      await fs.access(messagesFilePath);
    } catch (error) {
      console.log('📨 API: Arquivo messages_sent.json não encontrado, retornando histórico vazio');
      return res.json({
        messages: [],
        lastCleanup: null,
        totalSent: 0,
        createdAt: new Date().toISOString()
      });
    }
    
    // Ler arquivo de mensagens
    const messagesData = await fs.readFile(messagesFilePath, 'utf8');
    const messageHistory = JSON.parse(messagesData);
    
    console.log(`📨 API: Histórico carregado com ${messageHistory.messages?.length || 0} mensagens`);
    
    res.json(messageHistory);
    
  } catch (error) {
    console.error('❌ Erro ao carregar histórico de mensagens:', error);
    res.status(500).json({
      error: 'Erro ao carregar histórico de mensagens',
      message: error.message,
      messages: [],
      lastCleanup: null,
      totalSent: 0
    });
  }
});

// Action Cards disponíveis da API CAM Krolik
app.get('/api/action-cards/available', async (req, res) => {
  try {
    console.log('🃏 API: Buscando Action Cards da API CAM Krolik...');
    
    const actionCards = await krolikApiClient.listActionCards();
    console.log(`🃏 API: Encontrados ${actionCards.length} Action Cards`);
    
    res.json({
      success: true,
      data: actionCards,
      total: actionCards.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao buscar Action Cards:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao buscar Action Cards da API CAM Krolik',
      message: error.message,
      data: [],
      total: 0,
      timestamp: new Date().toISOString()
    });
  }
});

// Setores disponíveis
app.get('/api/sectors', async (req, res) => {
  try {
    console.log('📋 API: Buscando setores na API CAM Krolik...');
    
    // Buscar setores reais da API CAM Krolik
    const sectors = await krolikApiClient.listSectors();
    
    console.log(`📋 API: Retornando ${sectors.length} setores`);
    res.json({
      success: true,
      data: sectors,
      total: sectors.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar setores:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao buscar setores da API CAM Krolik',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rotas para logs de ações do usuário
app.get('/api/logs/user', async (req, res) => {
  try {
    const filters = {
      level: req.query.level,
      action: req.query.action,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const logs = await mainController.getUserLogs(filters);
    
    res.json({
      success: true,
      data: logs,
      total: logs.length,
      filters: filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao obter logs do usuário:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao obter logs do usuário',
      message: error.message 
    });
  }
});

app.post('/api/logs/user', async (req, res) => {
  try {
    const { level, action, details, metadata } = req.body;
    
    if (!level || !action || !details) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: level, action, details'
      });
    }

    // Adicionar informações da requisição aos metadados
    const enrichedMetadata = {
      ...metadata,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };

    const logEntry = await mainController.addUserLog(level, action, details, enrichedMetadata);
    
    res.json({
      success: true,
      data: logEntry,
      message: 'Log adicionado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao adicionar log do usuário:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao adicionar log do usuário',
      message: error.message 
    });
  }
});

app.delete('/api/logs/user', async (req, res) => {
  try {
    const result = await mainController.clearUserLogs();
    
    res.json({
      success: true,
      data: result,
      message: 'Logs limpos com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao limpar logs do usuário:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao limpar logs do usuário',
      message: error.message 
    });
  }
});

app.get('/api/logs/user/stats', async (req, res) => {
  try {
    const stats = await mainController.getUserLogStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Estatísticas obtidas com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas dos logs:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao obter estatísticas dos logs',
      message: error.message 
    });
  }
});


// ========================================
// ROTAS DE GERENCIAMENTO DE CANAIS
// ========================================

// Obter todos os canais
app.get('/api/channels', async (req, res) => {
  try {
    console.log('📱 API: Listando canais...');
    const channels = mainController.getChannels();
    res.json({
      success: true,
      data: channels,
      count: channels.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao listar canais:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao listar canais',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Obter canais ativos
app.get('/api/channels/active', async (req, res) => {
  try {
    console.log('📱 API: Listando canais ativos...');
    const activeChannels = mainController.getActiveChannels();
    res.json({
      success: true,
      data: activeChannels,
      count: activeChannels.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao listar canais ativos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao listar canais ativos',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Obter canal por ID
app.get('/api/channels/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    console.log(`📱 API: Buscando canal ${channelId}...`);
    
    const channel = mainController.getChannelById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Canal não encontrado',
        message: `Canal com ID '${channelId}' não foi encontrado`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: channel,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar canal:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao buscar canal',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Obter estatísticas de carga dos canais
app.get('/api/channels/stats/load', async (req, res) => {
  try {
    console.log('📊 API: Obtendo estatísticas de carga dos canais...');
    const loadStats = mainController.getChannelLoadStats();
    res.json({
      success: true,
      data: loadStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de carga:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao obter estatísticas de carga',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Obter estatísticas de conversas
app.get('/api/channels/stats/conversations', async (req, res) => {
  try {
    console.log('💬 API: Obtendo estatísticas de conversas...');
    const conversationStats = mainController.getConversationStats();
    res.json({
      success: true,
      data: conversationStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de conversas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao obter estatísticas de conversas',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Adicionar novo canal
app.post('/api/channels', async (req, res) => {
  try {
    const channelData = req.body;
    console.log('📱 API: Adicionando novo canal...', channelData);
    
    const success = mainController.addChannel(channelData);
    if (success) {
      res.json({
        success: true,
        message: 'Canal adicionado com sucesso',
        data: channelData,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Falha ao adicionar canal',
        message: 'Verifique os dados fornecidos',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro ao adicionar canal:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao adicionar canal',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Atualizar canal existente
app.put('/api/channels/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const updateData = req.body;
    console.log(`📱 API: Atualizando canal ${channelId}...`, updateData);
    
    const success = mainController.updateChannel(channelId, updateData);
    if (success) {
      res.json({
        success: true,
        message: 'Canal atualizado com sucesso',
        data: { channelId, ...updateData },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Falha ao atualizar canal',
        message: 'Canal não encontrado ou dados inválidos',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar canal:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao atualizar canal',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ativar/desativar canal
app.patch('/api/channels/:channelId/toggle', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { active } = req.body;
    console.log(`📱 API: ${active ? 'Ativando' : 'Desativando'} canal ${channelId}...`);
    
    const success = mainController.toggleChannel(channelId, active);
    if (success) {
      res.json({
        success: true,
        message: `Canal ${active ? 'ativado' : 'desativado'} com sucesso`,
        data: { channelId, active },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Falha ao alterar status do canal',
        message: 'Canal não encontrado',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro ao alterar status do canal:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao alterar status do canal',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Remover canal
app.delete('/api/channels/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    console.log(`📱 API: Removendo canal ${channelId}...`);
    
    const success = mainController.removeChannel(channelId);
    if (success) {
      res.json({
        success: true,
        message: 'Canal removido com sucesso',
        data: { channelId },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Falha ao remover canal',
        message: 'Canal não encontrado',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro ao remover canal:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao remover canal',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Limpar conversas inativas
app.post('/api/channels/cleanup', async (req, res) => {
  try {
    console.log('🧹 API: Limpando conversas inativas...');
    mainController.cleanupInactiveConversations();
    
    res.json({
      success: true,
      message: 'Limpeza de conversas inativas executada',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao limpar conversas inativas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao limpar conversas inativas',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Obter saúde de um canal específico
app.get('/api/channels/:channelId/health', async (req, res) => {
  try {
    const { channelId } = req.params;
    console.log(`🏥 API: Verificando saúde do canal ${channelId}...`);
    
    const channel = mainController.getChannelById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Canal não encontrado',
        message: `Canal com ID '${channelId}' não foi encontrado`,
        timestamp: new Date().toISOString()
      });
    }

    const health = mainController.multiChannelManager.getChannelHealth(channelId);
    
    res.json({
      success: true,
      data: {
        channelId: channelId,
        channelName: channel.name,
        health: health
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar saúde do canal:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao verificar saúde do canal',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Obter canais com problemas de saúde
app.get('/api/channels/health/unhealthy', async (req, res) => {
  try {
    console.log('🏥 API: Verificando canais com problemas de saúde...');
    const unhealthyChannels = mainController.multiChannelManager.getUnhealthyChannels();
    
    res.json({
      success: true,
      data: unhealthyChannels,
      count: unhealthyChannels.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar canais com problemas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao verificar canais com problemas',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Verificar disponibilidade de canais saudáveis
app.get('/api/channels/health/availability', async (req, res) => {
  try {
    console.log('🔍 API: Verificando disponibilidade de canais saudáveis...');
    const hasHealthyChannels = mainController.multiChannelManager.hasHealthyChannelsAvailable();
    const activeChannels = mainController.getActiveChannels();
    const unhealthyChannels = mainController.multiChannelManager.getUnhealthyChannels();
    
    res.json({
      success: true,
      data: {
        hasHealthyChannels: hasHealthyChannels,
        totalActiveChannels: activeChannels.length,
        unhealthyChannelsCount: unhealthyChannels.length,
        healthyChannelsCount: activeChannels.length - unhealthyChannels.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar disponibilidade de canais:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao verificar disponibilidade de canais',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Métricas do sistema
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = await mainController.getMetrics();
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({ error: 'Erro ao obter métricas' });
  }
});

// Endpoint para debug de logs do frontend
app.post('/api/debug-log', (req, res) => {
  try {
    const { message, hasMessageSent, hasLastMessageSent } = req.body;
    console.log(`🔍 [DEBUG] ${message}`);
    console.log(`   - hasMessageSent: ${hasMessageSent}`);
    console.log(`   - hasLastMessageSent: ${hasLastMessageSent}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter histórico de mensagens enviadas
app.get('/api/messages/history', async (req, res) => {
  try {
    const patientId = req.query.patientId;
    console.log(`\n\n\n\n\n\n🌐 [TERMINAL] API /api/messages/history chamada - patientId: ${patientId || 'todos'}`);
    
    if (patientId) {
      // Buscar mensagens para um paciente específico
      const messageHistory = mainController.getMessageHistoryForPatient(patientId);
      console.log(`📤 [TERMINAL] Retornando ${messageHistory.length} mensagens para paciente ${patientId}`);
      res.json({
        success: true,
        data: messageHistory,
        timestamp: new Date().toISOString()
      });
    } else {
      // Buscar todas as mensagens do dia
      const todaysMessages = mainController.getTodaysMessages();
      console.log(`📤 [TERMINAL] Retornando ${todaysMessages.length} mensagens do dia`);
      res.json({
        success: true,
        data: todaysMessages,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ [TERMINAL] Erro ao obter histórico de mensagens:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao obter histórico de mensagens',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota de envio manual removida - sistema agora envia mensagens SOMENTE por automação

// Health Check
app.get('/health', async (req, res) => {
  try {
    const quickCheck = req.query.quick === 'true';
    const startTime = Date.now();
    
    console.log('\\n🏥 ===========================================');
    console.log('   🔍 EXECUTANDO HEALTH CHECK');
    console.log('===========================================');
    console.log(`🕐 Tipo: ${quickCheck ? 'Rápido' : 'Completo'}`);
    console.log(`⏰ Iniciado: ${new Date().toLocaleString('pt-BR')}`);
    
    let healthResult;
    if (quickCheck) {
      healthResult = await mainController.performQuickHealthCheck();
    } else {
      healthResult = await mainController.performHealthCheck();
    }
    
    const responseTime = Date.now() - startTime;
    
    // Determinar status HTTP baseado no resultado
    const httpStatus = healthResult.status === 'healthy' ? 200 : 
                      healthResult.status === 'degraded' ? 200 : 503;
    
    // Adicionar informações adicionais ao resultado
    const response = {
      ...healthResult,
      responseTime: responseTime,
      timestamp: new Date().toISOString(),
      version: '1.0.0-js',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      quickCheck: quickCheck
    };
    
    res.status(httpStatus).json(response);
    
    // Log final do status
    const statusIcon = healthResult.status === 'healthy' ? '✅' : 
                      healthResult.status === 'degraded' ? '⚠️' : '❌';
    const statusText = healthResult.status === 'healthy' ? 'API SAUDÁVEL' : 
                      healthResult.status === 'degraded' ? 'API DEGRADADA' : 'API COM PROBLEMAS';
    
    console.log('🎯 ===========================================');
    console.log(`   ${statusIcon} ${statusText}`);
    console.log(`   ⏱️  Tempo Total: ${responseTime}ms`);
    console.log(`   🔧 Versão: 1.0.0-js`);
    console.log(`   🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   ⏰ Uptime: ${Math.floor(process.uptime() / 60)} minutos`);
    console.log('===========================================\\n');
    
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Inicializar sistema e iniciar servidor
async function startServer() {
  try {
    // Testar conexão com API CAM Krolik
    console.log('\\n🔍 TESTANDO CONECTIVIDADE COM API CAM KROLIK...');
    const apiConnected = await krolikApiClient.testConnection();
    if (apiConnected) {
      console.log('✅ API CAM Krolik conectada com sucesso!');
    } else {
      console.log('⚠️  API CAM Krolik não conectada - verifique as configurações');
    }
    
    // Inicializar sistema
    await mainController.initialize();
    
    console.log('\\n🎉 ===========================================');
    console.log('   ✅ SISTEMA INICIALIZADO COM SUCESSO!');
    console.log('===========================================');
    console.log('🎯 Todos os componentes estão funcionando');
    console.log(`🌐 API CAM Krolik: ${apiConnected ? '✅ Conectada' : '❌ Desconectada'}`);
    
    // INICIAR o sistema automaticamente
    await mainController.start();
    
    console.log('🚀 Sistema pronto para processar mensagens');
    console.log('⏰ Ciclos de monitoramento iniciados (60s - verificação principal)');
    console.log('📝 Logs de ciclo serão exibidos no console');
    console.log('===========================================\\n');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('🚀 INICIANDO SISTEMA...');
      console.log('📋 Verificando componentes...');
      
      // Arte ASCII do logo
      console.log('⣇⣿⠘⣿⣿⣿⡿⡿⣟⣟⢟⢟⢝⠵⡝⣿⡿⢂⣼⣿⣷⣌⠩⡫⡻⣝⠹⢿⣿⣷');
      console.log('⡆⣿⣆⠱⣝⡵⣝⢅⠙⣿⢕⢕⢕⢕⢝⣥⢒⠅⣿⣿⣿⡿⣳⣌⠪⡪⣡⢑⢝⣇');
      console.log('⡆⣿⣿⣦⠹⣳⣳⣕⢅⠈⢗⢕⢕⢕⢕⢕⢈⢆⠟⠋⠉⠁⠉⠉⠁⠈⠼⢐⢕⢽');
      console.log('⡗⢰⣶⣶⣦⣝⢝⢕⢕⠅⡆⢕⢕⢕⢕⢕⣴⠏⣠⡶⠛⡉⡉⡛⢶⣦⡀⠐⣕⢕');
      console.log('⡝⡄⢻⢟⣿⣿⣷⣕⣕⣅⣿⣔⣕⣵⣵⣿⣿⢠⣿⢠⣮⡈⣌⠨⠅⠹⣷⡀⢱⢕');
      console.log('⡝⡵⠟⠈⢀⣀⣀⡀⠉⢿⣿⣿⣿⣿⣿⣿⣿⣼⣿⢈⡋⠴⢿⡟⣡⡇⣿⡇⡀⢕');
      console.log('⡝⠁⣠⣾⠟⡉⡉⡉⠻⣦⣻⣿⣿⣿⣿⣿⣿⣿⣿⣧⠸⣿⣦⣥⣿⡇⡿⣰⢗⢄');
      console.log('⠁⢰⣿⡏⣴⣌⠈⣌⠡⠈⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣬⣉⣉⣁⣄⢖⢕⢕⢕');
      console.log('⡀⢻⣿⡇⢙⠁⠴⢿⡟⣡⡆⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣵⣵⣿');
      console.log('⡻⣄⣻⣿⣌⠘⢿⣷⣥⣿⠇⣿⣿⣿⣿⣿⣿⠛⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿');
      console.log('⣷⢄⠻⣿⣟⠿⠦⠍⠉⣡⣾⣿⣿⣿⣿⣿⣿⢸⣿⣦⠙⣿⣿⣿⣿⣿⣿⣿⣿⠟');
      console.log('⡕⡑⣑⣈⣻⢗⢟⢞⢝⣻⣿⣿⣿⣿⣿⣿⣿⠸⣿⠿⠃⣿⣿⣿⣿⣿⣿⡿⠁⣠');
      console.log('⡝⡵⡈⢟⢕⢕⢕⢕⣵⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣶⣿⣿⣿⣿⣿⠿⠋⣀⣈⠙');
      console.log('⡝⡵⡕⡀⠑⠳⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⢉⡠⡲⡫⡪⡪⡣');
      
      console.log('\\n🚀 ===========================================');
      console.log('   🎯 SERVIDOR JAVASCRIPT INICIADO!');
      console.log('===========================================');
      
      console.log(`\\n🌐 Servidor rodando na porta: ${PORT}`);
      console.log(`📱 Interface web: http://localhost:${PORT}`);
      
      console.log('\\n🏥 ===========================================');
      console.log('   ROTAS DE HEALTH CHECK DISPONÍVEIS');
      console.log('===========================================');
      console.log(`🔍 Health Check Básico: http://localhost:${PORT}/health`);
      console.log(`🔍 Health Check da API: http://localhost:${PORT}/api/health`);
      console.log(`⚡ Health Check Rápido: http://localhost:${PORT}/api/health?quick=true`);
      
      console.log('\\n📊 ===========================================');
      console.log('   OUTRAS ROTAS DA API');
      console.log('===========================================');
      console.log(`📈 Status do Sistema: http://localhost:${PORT}/api/status`);
      console.log(`⚙️  Configuração: http://localhost:${PORT}/api/config`);
      console.log(`📝 Logs: http://localhost:${PORT}/api/logs`);
      
      console.log('\\n✅ Sistema JavaScript pronto para uso!\\n');
    });
    
  } catch (error) {
    console.log('\\n💥 ===========================================');
    console.log('   ❌ ERRO AO INICIALIZAR SISTEMA');
    console.log('===========================================');
    console.error(`🔥 Erro: ${error.message}`);
    console.log('===========================================\\n');
    process.exit(1);
  }
}

// Health Check
app.get('/health', async (req, res) => {
  try {
    const quickCheck = req.query.quick === 'true';
    const startTime = Date.now();
    
    console.log('\\n🏥 ===========================================');
    console.log('   🔍 EXECUTANDO HEALTH CHECK');
    console.log('===========================================');
    console.log(`🕐 Tipo: ${quickCheck ? 'Rápido' : 'Completo'}`);
    console.log(`⏰ Iniciado: ${new Date().toLocaleString('pt-BR')}`);
    
    let healthResult;
    if (quickCheck) {
      healthResult = await mainController.performQuickHealthCheck();
    } else {
      healthResult = await mainController.performHealthCheck();
    }
    
    const responseTime = Date.now() - startTime;
    
    // Determinar status HTTP baseado no resultado
    const httpStatus = healthResult.status === 'healthy' ? 200 : 503;
    
    // Adicionar informações adicionais ao resultado
    const response = {
      ...healthResult,
      responseTime: responseTime,
      timestamp: new Date().toISOString(),
      version: '1.0.0-js',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      quickCheck: quickCheck
    };
    
    res.status(httpStatus).json(response);
    
    // Log final do status
    const statusIcon = healthResult.status === 'healthy' ? '✅' : '❌';
    const statusText = healthResult.status === 'healthy' ? 'SISTEMA SAUDÁVEL' : 'SISTEMA COM PROBLEMAS';
    
    console.log('🎯 ===========================================');
    console.log(`   ${statusIcon} ${statusText}`);
    console.log(`   ⏱️  Tempo Total: ${responseTime}ms`);
    console.log(`   🔧 Versão: 1.0.0-js`);
    console.log(`   🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   ⏰ Uptime: ${Math.floor(process.uptime() / 60)} minutos`);
    console.log('===========================================\\n');
    
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Iniciar servidor
startServer();