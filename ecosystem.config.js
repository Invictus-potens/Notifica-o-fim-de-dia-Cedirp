// Configuração PM2 para ambiente de produção
// Automação de Mensagem de Espera - CAM Krolik Integration

module.exports = {
  apps: [{
    name: 'automacao-mensagem-espera',
    script: 'dist/index.js',
    instances: 1, // Single instance para evitar conflitos de scheduler
    exec_mode: 'fork',
    
    // Configurações de ambiente
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Configurações de logging
    log_file: 'logs/combined.log',
    out_file: 'logs/out.log',
    error_file: 'logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Configurações de restart
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'data'],
    max_restarts: 10,
    min_uptime: '10s',
    
    // Configurações de recursos
    max_memory_restart: '500M',
    
    // Configurações de monitoramento
    monitoring: false,
    
    // Configurações de cluster (desabilitado para evitar conflitos)
    instance_var: 'INSTANCE_ID',
    
    // Scripts de lifecycle
    post_update: ['npm install', 'npm run build'],
    
    // Configurações de saúde
    health_check_url: 'http://localhost:3000/health',
    health_check_grace_period: 3000
  }],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/automacao-mensagem-espera.git',
      path: '/var/www/automacao-mensagem-espera',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install nodejs npm -y'
    }
  }
};