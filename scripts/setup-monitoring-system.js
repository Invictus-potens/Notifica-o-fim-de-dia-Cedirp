const fs = require('fs');
const path = require('path');

/**
 * Script de configuração do sistema de monitoramento
 * Instala dependências, configura arquivos e executa testes
 */

class MonitoringSystemSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.dataDir = path.join(this.projectRoot, 'data');
    this.logsDir = path.join(this.projectRoot, 'logs');
  }

  /**
   * Executa configuração completa
   */
  async setup() {
    console.log('🔧 CONFIGURANDO SISTEMA DE MONITORAMENTO\n');
    
    try {
      // 1. Verificar dependências
      await this.checkDependencies();
      
      // 2. Criar diretórios necessários
      await this.createDirectories();
      
      // 3. Configurar arquivos de dados
      await this.setupDataFiles();
      
      // 4. Configurar variáveis de ambiente
      await this.setupEnvironment();
      
      // 5. Executar testes básicos
      await this.runBasicTests();
      
      console.log('\n🎉 Configuração do sistema de monitoramento concluída com sucesso!');
      
    } catch (error) {
      console.error('\n❌ Erro durante a configuração:', error.message);
      process.exit(1);
    }
  }

  /**
   * Verifica dependências necessárias
   */
  async checkDependencies() {
    console.log('📦 Verificando dependências...');
    
    const requiredPackages = [
      'node-cron',
      'axios',
      'express'
    ];
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json não encontrado');
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const missingPackages = requiredPackages.filter(pkg => !dependencies[pkg]);
    
    if (missingPackages.length > 0) {
      console.log('⚠️ Pacotes faltando:', missingPackages.join(', '));
      console.log('Execute: npm install ' + missingPackages.join(' '));
    } else {
      console.log('✅ Todas as dependências estão instaladas');
    }
  }

  /**
   * Cria diretórios necessários
   */
  async createDirectories() {
    console.log('\n📁 Criando diretórios...');
    
    const directories = [
      this.dataDir,
      this.logsDir,
      path.join(this.dataDir, 'backup_current'),
      path.join(this.dataDir, 'backup_before_update'),
      path.join(this.dataDir, 'backup_cleanup')
    ];
    
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Diretório criado: ${path.relative(this.projectRoot, dir)}`);
      } else {
        console.log(`📁 Diretório já existe: ${path.relative(this.projectRoot, dir)}`);
      }
    }
  }

  /**
   * Configura arquivos de dados iniciais
   */
  async setupDataFiles() {
    console.log('\n📄 Configurando arquivos de dados...');
    
    const dataFiles = [
      'patients_active.json',
      'patients_processed.json',
      'patients_history.json',
      'patients_backup.json'
    ];
    
    for (const file of dataFiles) {
      const filePath = path.join(this.dataDir, file);
      
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        console.log(`✅ Arquivo criado: ${file}`);
      } else {
        console.log(`📄 Arquivo já existe: ${file}`);
      }
    }
    
    // Verificar se há dados existentes
    const activeFile = path.join(this.dataDir, 'patients_active.json');
    if (fs.existsSync(activeFile)) {
      const content = fs.readFileSync(activeFile, 'utf8');
      const patients = JSON.parse(content);
      console.log(`📊 Pacientes ativos encontrados: ${patients.length}`);
    }
  }

  /**
   * Configura variáveis de ambiente
   */
  async setupEnvironment() {
    console.log('\n⚙️ Configurando variáveis de ambiente...');
    
    const envExample = `# Configurações da API CAM Krolik
KROLIK_BASE_URL=https://api.camkrolik.com.br
KROLIK_TOKEN=63e68f168a48875131856df8

# Configurações do Sistema
NODE_ENV=development
TZ=America/Sao_Paulo
PORT=48026

# Configurações de Monitoramento
MONITORING_INTERVAL=3min
ENABLE_30MIN_MESSAGES=true
ENABLE_END_OF_DAY_MESSAGES=true
ENABLE_DAILY_CLEANUP=true
ENABLE_DAILY_BACKUP=true

# Configurações de Log
LOG_LEVEL=info
LOG_FILE=logs/app.log
`;

    const envExamplePath = path.join(this.projectRoot, '.env.example');
    
    if (!fs.existsSync(envExamplePath)) {
      fs.writeFileSync(envExamplePath, envExample);
      console.log('✅ Arquivo .env.example criado');
    } else {
      console.log('📄 Arquivo .env.example já existe');
    }
    
    const envPath = path.join(this.projectRoot, '.env');
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, envExample);
      console.log('✅ Arquivo .env criado');
    } else {
      console.log('📄 Arquivo .env já existe');
    }
  }

  /**
   * Executa testes básicos
   */
  async runBasicTests() {
    console.log('\n🧪 Executando testes básicos...');
    
    try {
      // Testar importação dos serviços
      const { MonitoringService } = require('../src/services/MonitoringService');
      const { MessageService } = require('../src/services/MessageService');
      const { CronService } = require('../src/services/CronService');
      const { ProductionScheduler } = require('../src/services/ProductionScheduler');
      
      console.log('✅ Todos os serviços importados com sucesso');
      
      // Testar validação de cron
      const cron = require('node-cron');
      const validCron = cron.validate('*/3 * * * *');
      
      if (validCron) {
        console.log('✅ Validação de cron funcionando');
      } else {
        throw new Error('Validação de cron falhou');
      }
      
      // Testar criação de instâncias
      const errorHandler = require('../src/services/ErrorHandler').ErrorHandler;
      const configManager = require('../src/services/ConfigManager').ConfigManager;
      
      const eh = new errorHandler();
      const cm = new configManager(eh);
      
      console.log('✅ Instâncias de serviços criadas com sucesso');
      
    } catch (error) {
      console.error('❌ Erro nos testes básicos:', error.message);
      throw error;
    }
  }

  /**
   * Verifica status do sistema
   */
  async checkStatus() {
    console.log('\n📊 Verificando status do sistema...');
    
    // Verificar arquivos de dados
    const dataFiles = [
      'patients_active.json',
      'patients_processed.json',
      'patients_history.json',
      'patients_backup.json'
    ];
    
    for (const file of dataFiles) {
      const filePath = path.join(this.dataDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const patients = JSON.parse(content);
        console.log(`📄 ${file}: ${patients.length} pacientes`);
      } else {
        console.log(`❌ ${file}: não encontrado`);
      }
    }
    
    // Verificar diretórios
    const directories = [this.dataDir, this.logsDir];
    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        console.log(`📁 ${path.relative(this.projectRoot, dir)}: OK`);
      } else {
        console.log(`❌ ${path.relative(this.projectRoot, dir)}: não encontrado`);
      }
    }
  }

  /**
   * Executa teste completo do sistema
   */
  async runFullTest() {
    console.log('\n🧪 Executando teste completo do sistema...');
    
    try {
      // Executar script de teste
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const testProcess = spawn('node', ['examples/test-monitoring-system.js', 'all'], {
          stdio: 'inherit',
          cwd: this.projectRoot
        });
        
        testProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Teste completo executado com sucesso');
            resolve();
          } else {
            reject(new Error(`Teste falhou com código ${code}`));
          }
        });
        
        testProcess.on('error', (error) => {
          reject(error);
        });
      });
      
    } catch (error) {
      console.error('❌ Erro no teste completo:', error.message);
      throw error;
    }
  }
}

// Executar se chamado diretamente
async function main() {
  const setup = new MonitoringSystemSetup();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'setup':
        await setup.setup();
        break;
        
      case 'status':
        await setup.checkStatus();
        break;
        
      case 'test':
        await setup.runFullTest();
        break;
        
      default:
        console.log('🔧 Configurador do Sistema de Monitoramento\n');
        console.log('Uso: node scripts/setup-monitoring-system.js [comando]\n');
        console.log('Comandos disponíveis:');
        console.log('  setup  - Configuração completa do sistema');
        console.log('  status - Verifica status dos arquivos e diretórios');
        console.log('  test   - Executa teste completo do sistema');
        console.log('\nExemplos:');
        console.log('  node scripts/setup-monitoring-system.js setup');
        console.log('  node scripts/setup-monitoring-system.js status');
        console.log('  node scripts/setup-monitoring-system.js test');
        break;
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante a operação:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MonitoringSystemSetup };
