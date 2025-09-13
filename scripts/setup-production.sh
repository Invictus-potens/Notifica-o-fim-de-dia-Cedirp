#!/bin/bash

# Script de configuração completa para ambiente de produção
# Automação de Mensagem de Espera - CAM Krolik Integration

set -e

echo "🚀 Configurando ambiente de produção completo..."

# Verificar se está executando como root (para algumas operações)
if [[ $EUID -eq 0 ]]; then
   echo "⚠️  Executando como root. Algumas operações serão realizadas com privilégios elevados."
fi

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar pré-requisitos
echo "🔍 Verificando pré-requisitos..."

# Node.js
if ! command_exists node; then
    echo "❌ Node.js não encontrado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js encontrado: $NODE_VERSION"
fi

# npm
if ! command_exists npm; then
    echo "❌ npm não encontrado. Instalando..."
    sudo apt-get install -y npm
else
    NPM_VERSION=$(npm --version)
    echo "✅ npm encontrado: $NPM_VERSION"
fi

# PM2 (opcional)
if ! command_exists pm2; then
    echo "📦 Instalando PM2 globalmente..."
    sudo npm install -g pm2
else
    PM2_VERSION=$(pm2 --version)
    echo "✅ PM2 encontrado: $PM2_VERSION"
fi

# Instalar dependências do projeto
echo "📦 Instalando dependências do projeto..."
npm ci --production

# Compilar aplicação
echo "🔨 Compilando aplicação TypeScript..."
npm run build

# Verificar se build foi criado
if [ ! -d "dist" ]; then
    echo "❌ Falha na compilação. Diretório 'dist' não foi criado."
    exit 1
fi

# Criar estrutura de diretórios
echo "📁 Criando estrutura de diretórios..."
mkdir -p logs
mkdir -p data/backup
mkdir -p data/temp
mkdir -p config

# Configurar permissões
chmod 755 logs
chmod 755 data
chmod 755 data/backup
chmod 755 data/temp

# Tornar scripts executáveis
echo "🔧 Configurando permissões de scripts..."
chmod +x scripts/*.sh

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📋 Criando arquivo .env a partir do template..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Configure as variáveis no arquivo .env antes de iniciar!"
    echo "   Edite o arquivo .env com suas configurações específicas."
else
    echo "✅ Arquivo .env já existe"
fi

# Validar configurações se .env estiver configurado
echo "🔍 Validando configurações..."
if node scripts/validate-env.js 2>/dev/null; then
    echo "✅ Configurações válidas"
else
    echo "⚠️  Algumas configurações precisam ser ajustadas no arquivo .env"
fi

# Configurar logrotate para gerenciar logs
echo "📝 Configurando rotação de logs..."
sudo tee /etc/logrotate.d/automacao-mensagem-espera > /dev/null <<EOF
$(pwd)/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $(whoami) $(whoami)
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Configurar systemd service (opcional)
if command_exists systemctl; then
    echo "⚙️  Configurando serviço systemd..."
    sudo tee /etc/systemd/system/automacao-mensagem-espera.service > /dev/null <<EOF
[Unit]
Description=Automação de Mensagem de Espera - CAM Krolik Integration
After=network.target

[Service]
Type=forking
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=$(which pm2) start ecosystem.config.js --env production
ExecReload=$(which pm2) reload ecosystem.config.js --env production
ExecStop=$(which pm2) stop ecosystem.config.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    echo "✅ Serviço systemd configurado"
    echo "   Para habilitar inicialização automática: sudo systemctl enable automacao-mensagem-espera"
fi

# Configurar firewall básico (se ufw estiver disponível)
if command_exists ufw; then
    echo "🔒 Configurando firewall básico..."
    sudo ufw allow 22/tcp  # SSH
    sudo ufw allow 3000/tcp  # Aplicação
    echo "   Firewall configurado. Para ativar: sudo ufw enable"
fi

# Executar testes de validação
echo "🧪 Executando testes de validação..."
if npm test; then
    echo "✅ Todos os testes passaram"
else
    echo "⚠️  Alguns testes falharam. Verifique a configuração."
fi

# Criar script de backup automático
echo "💾 Configurando backup automático..."
cat > scripts/auto-backup.sh << 'EOF'
#!/bin/bash
# Backup automático diário

BACKUP_DIR="data/backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.tar.gz"

echo "📦 Criando backup: $BACKUP_FILE"

tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='logs' \
    --exclude='data/backup' \
    .

# Manter apenas os últimos 7 backups
find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -mtime +7 -delete

echo "✅ Backup criado: $BACKUP_DIR/$BACKUP_FILE"
EOF

chmod +x scripts/auto-backup.sh

# Configurar cron para backup diário (opcional)
if command_exists crontab; then
    echo "⏰ Configurando backup automático diário..."
    (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/scripts/auto-backup.sh >> $(pwd)/logs/backup.log 2>&1") | crontab -
    echo "✅ Backup automático configurado para 02:00 diariamente"
fi

# Criar script de monitoramento de saúde
cat > scripts/health-monitor.sh << 'EOF'
#!/bin/bash
# Monitor de saúde da aplicação

HEALTH_URL="http://localhost:3000/health"
LOG_FILE="logs/health-monitor.log"

check_health() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        echo "[$timestamp] ✅ Aplicação saudável" >> "$LOG_FILE"
        return 0
    else
        echo "[$timestamp] ❌ Aplicação não responde" >> "$LOG_FILE"
        
        # Tentar reiniciar se PM2 estiver disponível
        if command -v pm2 >/dev/null 2>&1; then
            echo "[$timestamp] 🔄 Tentando reiniciar aplicação..." >> "$LOG_FILE"
            pm2 restart automacao-mensagem-espera
        fi
        
        return 1
    fi
}

check_health
EOF

chmod +x scripts/health-monitor.sh

# Configurar monitoramento de saúde a cada 5 minutos
if command_exists crontab; then
    (crontab -l 2>/dev/null; echo "*/5 * * * * $(pwd)/scripts/health-monitor.sh") | crontab -
    echo "✅ Monitoramento de saúde configurado"
fi

echo ""
echo "🎉 Configuração de produção concluída com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure as variáveis no arquivo .env:"
echo "   - KROLIK_API_BASE_URL"
echo "   - KROLIK_API_TOKEN"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo ""
echo "2. Valide as configurações:"
echo "   node scripts/validate-env.js --check-connectivity"
echo ""
echo "3. Inicie a aplicação:"
echo "   pm2 start ecosystem.config.js --env production"
echo ""
echo "4. (Opcional) Habilite inicialização automática:"
echo "   sudo systemctl enable automacao-mensagem-espera"
echo ""
echo "5. Monitore a aplicação:"
echo "   pm2 monit"
echo "   pm2 logs automacao-mensagem-espera"
echo ""
echo "🔗 Acesse a interface web em: http://localhost:3000"
echo ""