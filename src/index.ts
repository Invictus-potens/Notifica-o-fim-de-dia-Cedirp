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
  // Log apenas para requisições de API
  if (req.url.startsWith('/api/')) {
    console.log(`${req.method} ${req.url}`);
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
  console.log('Sistema inicializado com sucesso');
}).catch((error) => {
  console.error('Erro ao inicializar sistema:', error);
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Interface web disponível em http://localhost:${PORT}`);
});

export default app;