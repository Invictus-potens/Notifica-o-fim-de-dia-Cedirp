import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

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

// Servir arquivos estáticos da interface web
app.use(express.static(path.join(__dirname, '../public')));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Importar MainController e Logger
import { MainController } from './controllers/MainController';
import { logger } from './services/Logger';

// Inicializar MainController
const mainController = new MainController();

// Inicializar sistema na inicialização do servidor
mainController.initialize().then(() => {
  console.log('\n✅ ===========================================');
  console.log('   SISTEMA INICIALIZADO COM SUCESSO!');
  console.log('===========================================');
  console.log('🎯 Todos os componentes estão funcionando');
  console.log('🚀 Sistema pronto para processar mensagens');
  console.log('===========================================\n');
}).catch((error) => {
  console.log('\n❌ ===========================================');
  console.log('   ERRO AO INICIALIZAR SISTEMA');
  console.log('===========================================');
  console.error(`💥 Erro: ${error.message}`);
  console.log('===========================================\n');
});

// API Routes
app.get('/api/status', (req, res) => {
  try {
    const status = mainController.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Erro ao obter status do sistema:', error);
    res.status(500).json({ error: 'Erro ao obter status do sistema' });
  }
});

app.get('/api/patients', async (req, res) => {
  try {
    // Obter pacientes em espera através do monitoramento
    const detailedStats = mainController.getDetailedStats();
    res.json({ patients: [], stats: detailedStats.monitoring });
  } catch (error) {
    console.error('Erro ao obter lista de pacientes:', error);
    res.status(500).json({ error: 'Erro ao obter lista de pacientes' });
  }
});

app.post('/api/flow/pause', (req, res) => {
  try {
    mainController.pauseFlow();
    res.json({ success: true, message: 'Fluxo pausado com sucesso' });
  } catch (error) {
    console.error('Erro ao pausar fluxo:', error);
    res.status(500).json({ error: 'Erro ao pausar fluxo' });
  }
});

app.post('/api/flow/resume', (req, res) => {
  try {
    mainController.resumeFlow();
    res.json({ success: true, message: 'Fluxo retomado com sucesso' });
  } catch (error) {
    console.error('Erro ao retomar fluxo:', error);
    res.status(500).json({ error: 'Erro ao retomar fluxo' });
  }
});

app.get('/api/config', (req, res) => {
  try {
    const config = mainController.getSystemConfig();
    res.json(config);
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

app.get('/api/sectors', (req, res) => {
  // Mock data for now - will be implemented when KrolikApiClient is fully integrated
  res.json([
    { id: '1', name: 'Recepção' },
    { id: '2', name: 'Consultório 1' },
    { id: '3', name: 'Consultório 2' },
    { id: '4', name: 'Exames' }
  ]);
});

app.get('/api/action-cards', (req, res) => {
  // Mock data for now - will be implemented when KrolikApiClient is fully integrated
  res.json([
    { id: '1', name: 'Mensagem de Espera 30min' },
    { id: '2', name: 'Mensagem Fim de Expediente' }
  ]);
});

app.get('/api/templates', (req, res) => {
  // Mock data for now - will be implemented when KrolikApiClient is fully integrated
  res.json([
    { id: '1', name: 'Template Espera 30min' },
    { id: '2', name: 'Template Fim Expediente' }
  ]);
});

app.get('/api/logs', (req, res) => {
  try {
    const level = req.query.level as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    // Converter string level para LogLevel enum se fornecido
    let logLevel;
    if (level) {
      switch (level.toLowerCase()) {
        case 'debug': logLevel = 0; break;
        case 'info': logLevel = 1; break;
        case 'warn': logLevel = 2; break;
        case 'error': logLevel = 3; break;
        case 'critical': logLevel = 4; break;
      }
    }
    
    const logs = mainController.getLogs(logLevel, limit);
    
    // Converter LogEntry para formato esperado pela interface
    const formattedLogs = logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      level: ['debug', 'info', 'warn', 'error', 'critical'][log.level],
      message: log.message,
      context: log.context,
      error: log.error ? {
        name: log.error.name,
        message: log.error.message,
        stack: log.error.stack
      } : undefined,
      metadata: log.metadata
    }));
    
    res.json(formattedLogs);
  } catch (error) {
    console.error('Erro ao obter logs:', error);
    res.status(500).json({ error: 'Erro ao obter logs' });
  }
});

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

app.post('/api/logs/clear', (req, res) => {
  try {
    mainController.clearLogs();
    res.json({ success: true, message: 'Logs limpos com sucesso' });
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    res.status(500).json({ error: 'Erro ao limpar logs' });
  }
});

app.get('/api/logs/stats', (req, res) => {
  try {
    const stats = mainController.getErrorStats();
    res.json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas de logs:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas de logs' });
  }
});

app.get('/api/logs/export', (req, res) => {
  try {
    const format = (req.query.format as string) || 'json';
    const exportData = logger.exportLogs(format as 'json' | 'csv');
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=logs.json');
    }
    
    res.send(exportData);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar logs' });
  }
});

app.get('/api/logs/activity', (req, res) => {
  try {
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
    const activity = logger.getActivitySummary(hours);
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter resumo de atividade' });
  }
});

app.get('/api/metrics', (req, res) => {
  try {
    const metrics = mainController.getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({ error: 'Erro ao obter métricas' });
  }
});

app.get('/api/metrics/alerts', (req, res) => {
  try {
    const alerts = mainController.getAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Erro ao obter alertas:', error);
    res.status(500).json({ error: 'Erro ao obter alertas' });
  }
});

// Health Check Routes
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  console.log('\n🏥 ===========================================');
  console.log('   INICIANDO VERIFICAÇÃO DE SAÚDE');
  console.log('===========================================');
  console.log('🔍 Executando verificação completa do sistema...\n');
  
  try {
    // Executar health check completo
    const healthResult = await mainController.performHealthCheck();
    const responseTime = Date.now() - startTime;
    
    // Log resumido
    console.log('📊 ===========================================');
    console.log('   RESULTADO DA VERIFICAÇÃO');
    console.log('===========================================');
    console.log(`🎯 Status Geral: ${healthResult.status.toUpperCase()}`);
    console.log(`⏱️  Tempo de Resposta: ${responseTime}ms`);
    console.log(`📈 Total de Checks: ${healthResult.overall.totalChecks}`);
    console.log(`✅ Checks Aprovados: ${healthResult.overall.passedChecks}`);
    console.log(`❌ Checks Falharam: ${healthResult.overall.failedChecks}`);
    console.log(`⚠️  Checks com Aviso: ${healthResult.overall.warningChecks}\n`);
    
    // Log individual de cada check
    console.log('🔍 ===========================================');
    console.log('   DETALHES DOS COMPONENTES');
    console.log('===========================================');
    Object.entries(healthResult.checks).forEach(([checkName, checkResult]) => {
      const icon = checkResult.status === 'pass' ? '✅' : checkResult.status === 'warn' ? '⚠️' : '❌';
      const statusText = checkResult.status === 'pass' ? 'APROVADO' : 
                        checkResult.status === 'warn' ? 'AVISO' : 'FALHOU';
      console.log(`${icon} ${checkName.toUpperCase()}: ${statusText}`);
      console.log(`   📝 ${checkResult.message}`);
      console.log(`   ⏱️  Tempo: ${checkResult.duration}ms\n`);
    });
    
    // Determinar status HTTP baseado no resultado
    const httpStatus = healthResult.status === 'healthy' ? 200 : 
                      healthResult.status === 'degraded' ? 200 : 503;
    
    // Adicionar response time ao resultado
    const response = {
      ...healthResult,
      responseTime: responseTime,
      timestamp: new Date().toISOString()
    };
    
    res.status(httpStatus).json(response);
    
    // Log final do status
    const statusIcon = healthResult.status === 'healthy' ? '✅' : 
                      healthResult.status === 'degraded' ? '⚠️' : '❌';
    const statusText = healthResult.status === 'healthy' ? 'SISTEMA SAUDÁVEL' : 
                      healthResult.status === 'degraded' ? 'SISTEMA DEGRADADO' : 'SISTEMA COM PROBLEMAS';
    
    console.log('🎯 ===========================================');
    console.log(`   ${statusIcon} ${statusText}`);
    console.log(`   ⏱️  Tempo Total: ${responseTime}ms`);
    console.log('===========================================\n');
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.log('\n❌ ===========================================');
    console.log('   ERRO CRÍTICO NA VERIFICAÇÃO');
    console.log('===========================================');
    console.error(`💥 Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    console.log(`⏱️  Tempo até falha: ${responseTime}ms\n`);
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: responseTime,
      error: {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        type: 'health_check_failure'
      },
      checks: {},
      overall: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 1,
        warningChecks: 0,
        responseTime: responseTime
      }
    };
    
    res.status(503).json(errorResponse);
  }
});

app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  const quickCheck = req.query.quick === 'true';
  
  console.log('\n🏥 ===========================================');
  console.log('   INICIANDO VERIFICAÇÃO DA API');
  console.log('===========================================');
  console.log(`🔍 Tipo: ${quickCheck ? 'VERIFICAÇÃO RÁPIDA' : 'VERIFICAÇÃO COMPLETA'}`);
  console.log(`⏱️  Iniciado em: ${new Date().toLocaleString('pt-BR')}\n`);
  
  try {
    let healthResult;
    
    if (quickCheck) {
      // Health check rápido (apenas checks críticos)
      healthResult = await mainController.performQuickHealthCheck();
      console.log('⚡ Executando verificação rápida (apenas componentes críticos)...\n');
    } else {
      // Health check completo
      healthResult = await mainController.performHealthCheck();
      console.log('🔍 Executando verificação completa (todos os componentes)...\n');
    }
    
    const responseTime = Date.now() - startTime;
    
    // Log resumido
    console.log('📊 ===========================================');
    console.log('   RESULTADO DA VERIFICAÇÃO DA API');
    console.log('===========================================');
    console.log(`🎯 Status Geral: ${healthResult.status.toUpperCase()}`);
    console.log(`⚡ Tipo de Verificação: ${quickCheck ? 'RÁPIDA' : 'COMPLETA'}`);
    console.log(`⏱️  Tempo de Resposta: ${responseTime}ms`);
    console.log(`📈 Total de Checks: ${healthResult.overall.totalChecks}`);
    console.log(`✅ Checks Aprovados: ${healthResult.overall.passedChecks}`);
    console.log(`❌ Checks Falharam: ${healthResult.overall.failedChecks}`);
    console.log(`⚠️  Checks com Aviso: ${healthResult.overall.warningChecks}\n`);
    
    // Log individual de cada check
    console.log('🔍 ===========================================');
    console.log('   DETALHES DOS COMPONENTES');
    console.log('===========================================');
    Object.entries(healthResult.checks).forEach(([checkName, checkResult]) => {
      const icon = checkResult.status === 'pass' ? '✅' : checkResult.status === 'warn' ? '⚠️' : '❌';
      const statusText = checkResult.status === 'pass' ? 'APROVADO' : 
                        checkResult.status === 'warn' ? 'AVISO' : 'FALHOU';
      console.log(`${icon} ${checkName.toUpperCase()}: ${statusText}`);
      console.log(`   📝 ${checkResult.message}`);
      console.log(`   ⏱️  Tempo: ${checkResult.duration}ms\n`);
    });
    
    // Determinar status HTTP baseado no resultado
    const httpStatus = healthResult.status === 'healthy' ? 200 : 
                      healthResult.status === 'degraded' ? 200 : 503;
    
    // Adicionar informações adicionais ao resultado
    const response = {
      ...healthResult,
      responseTime: responseTime,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
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
    console.log(`   🔧 Versão: 1.0.0`);
    console.log(`   🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   ⏰ Uptime: ${Math.floor(process.uptime() / 60)} minutos`);
    console.log('===========================================\n');
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.log('\n❌ ===========================================');
    console.log('   ERRO CRÍTICO NA VERIFICAÇÃO DA API');
    console.log('===========================================');
    console.error(`💥 Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    console.log(`⏱️  Tempo até falha: ${responseTime}ms`);
    console.log(`🔧 Tipo de Verificação: ${quickCheck ? 'RÁPIDA' : 'COMPLETA'}\n`);
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: responseTime,
      quickCheck: quickCheck,
      error: {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        type: 'health_check_failure'
      },
      checks: {},
      overall: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 1,
        warningChecks: 0,
        responseTime: responseTime
      }
    };
    
    res.status(503).json(errorResponse);
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 ===========================================');
  console.log('   SERVIDOR INICIADO COM SUCESSO!');
  console.log('===========================================\n');
  
  console.log(`🌐 Servidor rodando na porta: ${PORT}`);
  console.log(`📱 Interface web: http://localhost:${PORT}\n`);
  
  console.log('🏥 ===========================================');
  console.log('   ROTAS DE HEALTH CHECK DISPONÍVEIS');
  console.log('===========================================');
  console.log(`🔍 Health Check Básico: http://localhost:${PORT}/health`);
  console.log(`🔍 Health Check da API: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Health Check Rápido: http://localhost:${PORT}/api/health?quick=true\n`);
  
  console.log('📊 ===========================================');
  console.log('   OUTRAS ROTAS DA API');
  console.log('===========================================');
  console.log(`📈 Status do Sistema: http://localhost:${PORT}/api/status`);
  console.log(`👥 Pacientes: http://localhost:${PORT}/api/patients`);
  console.log(`⚙️  Configuração: http://localhost:${PORT}/api/config`);
  console.log(`📝 Logs: http://localhost:${PORT}/api/logs`);
  console.log(`📊 Métricas: http://localhost:${PORT}/api/metrics\n`);
  
  console.log('✅ Sistema pronto para uso!\n');
});

export default app;