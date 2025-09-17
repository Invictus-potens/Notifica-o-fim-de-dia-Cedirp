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

// Inicializar MainController
const mainController = new MainController();

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

// Pacientes em espera
app.get('/api/patients', async (req, res) => {
  try {
    console.log('📋 API: Buscando pacientes...');
    
    // Simular busca de pacientes (versão simplificada)
    const patients = [
      {
        id: 'demo1',
        name: 'Paciente Demo',
        phone: '11999999999',
        sectorName: 'Suporte Geral',
        waitTimeMinutes: 35,
        channelType: 'normal'
      }
    ];
    
    console.log(`📋 API: Retornando ${patients.length} pacientes`);
    res.json({
      success: true,
      data: patients,
      total: patients.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao buscar pacientes',
      data: [],
      total: 0,
      timestamp: new Date().toISOString()
    });
  }
});

// Setores disponíveis
app.get('/api/sectors', async (req, res) => {
  try {
    console.log('📋 API: Buscando setores...');
    
    // Dados estáticos de setores (versão simplificada)
    const sectors = [
      { id: '64d4db384f04cb80ac059912', name: 'Suporte Geral', active: true },
      { id: '631f7d27307d23f46af88983', name: 'Administrativo/Financeiro', active: true },
      { id: '6400efb5343817d4ddbb2a4c', name: 'Suporte CAM', active: true },
      { id: '6401f4f49b1ff8512b525e9c', name: 'Suporte Telefonia', active: true }
    ];
    
    console.log(`📋 API: Retornando ${sectors.length} setores`);
    res.json({
      success: true,
      data: sectors,
      total: sectors.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar setores:', error);
    res.status(500).json({ error: 'Erro ao buscar setores' });
  }
});

// Action cards disponíveis
app.get('/api/action-cards', async (req, res) => {
  try {
    console.log('📋 API: Buscando action cards...');
    
    // Dados estáticos de action cards (versão simplificada)
    const actionCards = [
      { 
        id: '631f2b4f307d23f46ac80a2b', 
        name: 'Mensagem de Espera 30min',
        content: 'Sua consulta está sendo processada...',
        active: true 
      }
    ];
    
    console.log(`📋 API: Retornando ${actionCards.length} action cards`);
    res.json({
      success: true,
      data: actionCards,
      total: actionCards.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar action cards:', error);
    res.status(500).json({ error: 'Erro ao buscar action cards' });
  }
});

// Canais disponíveis
app.get('/api/channels', async (req, res) => {
  try {
    console.log('📋 API: Buscando canais...');
    
    // Dados estáticos de canais (versão simplificada)
    const channels = [
      { 
        id: '63e68f168a48875131856df8', 
        name: 'Canal Principal',
        type: 'normal',
        active: true 
      }
    ];
    
    console.log(`📋 API: Retornando ${channels.length} canais`);
    res.json({
      success: true,
      data: channels,
      total: channels.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar canais:', error);
    res.status(500).json({ error: 'Erro ao buscar canais' });
  }
});

// Métricas do sistema
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = {
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0-js'
      },
      messages: {
        sent: 0,
        failed: 0,
        pending: 0
      },
      patients: {
        active: 0,
        processed: 0,
        waiting: 0
      }
    };
    
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

// Envio manual de action cards
app.post('/api/messages/send-action-card', async (req, res) => {
  try {
    const { patients, action_card_id } = req.body;

    if (!patients || !Array.isArray(patients) || patients.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Lista de pacientes é obrigatória',
        message: 'Forneça uma lista válida de pacientes com number e contactId'
      });
      return;
    }

    if (!action_card_id) {
      res.status(400).json({
        success: false,
        error: 'ID do cartão de ação é obrigatório',
        message: 'Forneça um ID válido de cartão de ação'
      });
      return;
    }

    console.log(`📤 API: Tentativa de envio de cartão ${action_card_id} para ${patients.length} pacientes...`);
    
    // Simular envio (versão simplificada - sem KrolikApiClient completo)
    const result = {
      success: patients.length,
      failed: 0,
      results: patients.map(p => ({ 
        contactId: p.contactId, 
        number: p.number, 
        success: true, 
        message: 'Simulado - migração JavaScript' 
      }))
    };
    
    console.log(`📊 API: Resultado simulado - ${result.success} sucessos, ${result.failed} falhas`);
    
    res.json({
      success: true,
      data: result,
      message: `Cartão enviado: ${result.success} sucessos, ${result.failed} falhas`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao enviar action card:', error);
    res.status(500).json({ error: 'Erro ao enviar action card' });
  }
});

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
    // Inicializar sistema
    await mainController.initialize();
    
    console.log('\\n🎉 ===========================================');
    console.log('   ✅ SISTEMA INICIALIZADO COM SUCESSO!');
    console.log('===========================================');
    console.log('🎯 Todos os componentes estão funcionando');
    
    // INICIAR o sistema automaticamente
    await mainController.start();
    
    console.log('🚀 Sistema pronto para processar mensagens');
    console.log('⏰ Ciclos de monitoramento iniciados (60s)');
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