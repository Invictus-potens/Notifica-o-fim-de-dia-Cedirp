#!/bin/bash

# Script de configuração completa para ambiente de produção
# Automação de Mensagem de Espera - CAM Krolik Integration
# Versão: 1.0.0

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/production-setup.log"

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para verificar versão do Node.js
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | sed 's/v//')
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            log "✅ Node.js $NODE_VERSION encontrado (compatível)"
            return 0
        else
            error "❌ Node.js $NODE_VERSION encontrado, mas versão 18+ é necessária"
            return 1
        fi
    else
        error "❌ Node.js não encontrado"
        return 1
    fi
}

# Função para instalar Node.js
install_nodejs() {
    log "📦 Instalando Node.js 18.x..."
    
    if command_exists apt-get; then
        # Ubuntu/Debian
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command_exists yum; then
        # CentOS/RHEL
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs npm
    elif command_exists dnf; then
        # Fedora
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo dnf install -y nodejs npm
    else
        error "Sistema operacional não suportado para instalação automática do Node.js"
        info "Por favor, instale Node.js 18.x manualmente: https://nodejs.org/"
        exit 1
    fi
}

# Função para configurar sistema
setup_system() {
    log "🔧 Configurando sistema..."
    
    # Criar diretórios necessários
    mkdir -p "$PROJECT_DIR/logs"
    mkdir -p "$PROJECT_DIR/data/backup"
    mkdir -p "$PROJECT_DIR/data/temp"
    mkdir -p "$PROJECT_DIR/config"
    
    # Configurar permissões
    chmod 755 "$PROJECT_DIR/logs"
    chmod 755 "$PROJECT_DIR/data"
    chmod 755 "$PROJECT_DIR/data/backup"
    chmod 755 "$PROJECT_DIR/data/temp"
    
    # Tornar scripts executáveis
    chmod +x "$PROJECT_DIR/scripts"/*.sh
    
    log "✅ Sistema configurado"
}

# Função para instalar dependências
install_dependencies() {
    log "📦 Instalando dependências do projeto..."
    
    cd "$PROJECT_DIR"
    
    # Instalar PM2 globalmente se não existir
    if ! command_exists pm2; then
        log "📦 Instalando PM2 globalmente..."
        sudo npm install -g pm2
    else
        log "✅ PM2 já instalado: $(pm2 --version)"
    fi
    
    # Instalar dependências do projeto
    npm ci --production
    
    log "✅ Dependências instaladas"
}

# Função para compilar aplicação
build_application() {
    log "🔨 Compilando aplicação TypeScript..."
    
    cd "$PROJECT_DIR"
    
    # Instalar dependências de desenvolvimento temporariamente
    npm install --include=dev
    
    # Compilar
    npm run build
    
    # Remover dependências de desenvolvimento
    npm prune --production
    
    if [ ! -d "dist" ]; then
        error "❌ Falha na compilação. Diretório 'dist' não foi criado."
        exit 1
    fi
    
    log "✅ Aplicação compilada com sucesso"
}

# Função para configurar ambiente
setup_environment() {
    log "📋 Configurando ambiente..."
    
    cd "$PROJECT_DIR"
    
    # Criar arquivo .env se não existir
    if [ ! -f .env ]; then
        log "📋 Criando arquivo .env a partir do template..."
        cp .env.example .env
        warning "⚠️  IMPORTANTE: Configure as variáveis no arquivo .env antes de iniciar!"
        warning "   Edite o arquivo .env com suas configurações específicas."
    else
        log "✅ Arquivo .env já existe"
    fi
    
    # Validar configurações
    if node scripts/validate-env.js 2>/dev/null; then
        log "✅ Configurações válidas"
    else
        warning "⚠️  Algumas configurações precisam ser ajustadas no arquivo .env"
    fi
}

# Função para configurar logs
setup_logging() {
    log "📝 Configurando sistema de logs..."
    
    # Configurar logrotate
    if command_exists logrotate; then
        sudo tee /etc/logrotate.d/automacao-mensagem-espera > /dev/null <<EOF
$PROJECT_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $(whoami) $(whoami)
    postrotate
        if command -v pm2 >/dev/null 2>&1; then
            pm2 reloadLogs
        fi
    endscript
}
EOF
        log "✅ Logrotate configurado"
    else
        warning "⚠️  Logrotate não encontrado. Logs não serão rotacionados automaticamente."
    fi
}

# Função para configurar serviço systemd
setup_systemd_service() {
    if command_exists systemctl; then
        log "⚙️  Configurando serviço systemd..."
        
        sudo tee /etc/systemd/system/automacao-mensagem-espera.service > /dev/null <<EOF
[Unit]
Description=Automação de Mensagem de Espera - CAM Krolik Integration
After=network.target

[Service]
Type=forking
User=$(whoami)
WorkingDirectory=$PROJECT_DIR
ExecStart=$(which pm2) start ecosystem.config.js --env production
ExecReload=$(which pm2) reload ecosystem.config.js --env production
ExecStop=$(which pm2) stop ecosystem.config.js
Restart=always
RestartSec=10
Environment=PATH=/usr/bin:/usr/local/bin
Environment=PM2_HOME=$HOME/.pm2

[Install]
WantedBy=multi-user.target
EOF

        sudo systemctl daemon-reload
        log "✅ Serviço systemd configurado"
        info "   Para habilitar inicialização automática: sudo systemctl enable automacao-mensagem-espera"
    else
        warning "⚠️  systemd não disponível. Serviço não será configurado."
    fi
}

# Função para configurar firewall
setup_firewall() {
    if command_exists ufw; then
        log "🔒 Configurando firewall básico..."
        
        # Permitir SSH
        sudo ufw allow 22/tcp
        
        # Permitir porta da aplicação
        PORT=${PORT:-3000}
        sudo ufw allow $PORT/tcp
        
        # Permitir HTTP/HTTPS se nginx estiver configurado
        if [ -f "$PROJECT_DIR/nginx.conf" ]; then
            sudo ufw allow 80/tcp
            sudo ufw allow 443/tcp
        fi
        
        log "✅ Regras de firewall configuradas"
        info "   Para ativar o firewall: sudo ufw enable"
    else
        warning "⚠️  UFW não encontrado. Firewall não será configurado."
    fi
}

# Função para configurar backup automático
setup_backup() {
    log "💾 Configurando backup automático..."
    
    # Criar script de backup
    cat > "$PROJECT_DIR/scripts/auto-backup.sh" << 'EOF'
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
    --exclude='.git' \
    .

# Manter apenas os últimos 7 backups
find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -mtime +7 -delete

echo "✅ Backup criado: $BACKUP_DIR/$BACKUP_FILE"
EOF

    chmod +x "$PROJECT_DIR/scripts/auto-backup.sh"
    
    # Configurar cron para backup diário
    if command_exists crontab; then
        (crontab -l 2>/dev/null | grep -v "auto-backup.sh"; echo "0 2 * * * $PROJECT_DIR/scripts/auto-backup.sh >> $PROJECT_DIR/logs/backup.log 2>&1") | crontab -
        log "✅ Backup automático configurado para 02:00 diariamente"
    else
        warning "⚠️  Cron não encontrado. Backup automático não será configurado."
    fi
}

# Função para configurar monitoramento
setup_monitoring() {
    log "🔍 Configurando monitoramento de saúde..."
    
    # Criar script de monitoramento
    cat > "$PROJECT_DIR/scripts/health-monitor.sh" << 'EOF'
#!/bin/bash
# Monitor de saúde da aplicação

HEALTH_URL="http://localhost:${PORT:-3000}/health"
LOG_FILE="logs/health-monitor.log"

check_health() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
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

    chmod +x "$PROJECT_DIR/scripts/health-monitor.sh"
    
    # Configurar monitoramento a cada 5 minutos
    if command_exists crontab; then
        (crontab -l 2>/dev/null | grep -v "health-monitor.sh"; echo "*/5 * * * * $PROJECT_DIR/scripts/health-monitor.sh") | crontab -
        log "✅ Monitoramento de saúde configurado"
    else
        warning "⚠️  Cron não encontrado. Monitoramento automático não será configurado."
    fi
}

# Função para executar testes
run_tests() {
    log "🧪 Executando testes de validação..."
    
    cd "$PROJECT_DIR"
    
    # Instalar dependências de teste temporariamente
    npm install --include=dev
    
    if npm test; then
        log "✅ Todos os testes passaram"
    else
        warning "⚠️  Alguns testes falharam. Verifique a configuração."
    fi
    
    # Remover dependências de desenvolvimento
    npm prune --production
}

# Função para configurar SSL (se certificados estiverem disponíveis)
setup_ssl() {
    if [ -f "$PROJECT_DIR/ssl/cert.pem" ] && [ -f "$PROJECT_DIR/ssl/key.pem" ]; then
        log "🔒 Configurando SSL..."
        
        # Criar diretório SSL se não existir
        mkdir -p "$PROJECT_DIR/ssl"
        
        # Configurar permissões dos certificados
        chmod 600 "$PROJECT_DIR/ssl/key.pem"
        chmod 644 "$PROJECT_DIR/ssl/cert.pem"
        
        log "✅ SSL configurado"
    else
        info "ℹ️  Certificados SSL não encontrados. HTTPS não será configurado."
        info "   Para configurar SSL, coloque os certificados em:"
        info "   - $PROJECT_DIR/ssl/cert.pem"
        info "   - $PROJECT_DIR/ssl/key.pem"
    fi
}

# Função principal
main() {
    log "🚀 Iniciando configuração de produção..."
    log "📁 Diretório do projeto: $PROJECT_DIR"
    
    # Verificar pré-requisitos
    log "🔍 Verificando pré-requisitos..."
    
    if ! check_node_version; then
        log "📦 Instalando Node.js..."
        install_nodejs
        
        if ! check_node_version; then
            error "❌ Falha na instalação do Node.js"
            exit 1
        fi
    fi
    
    # Executar configurações
    setup_system
    install_dependencies
    build_application
    setup_environment
    setup_logging
    setup_systemd_service
    setup_firewall
    setup_backup
    setup_monitoring
    setup_ssl
    run_tests
    
    log "🎉 Configuração de produção concluída com sucesso!"
    
    # Exibir próximos passos
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
    echo "🔗 Acesse a interface web em: http://localhost:${PORT:-3000}"
    echo ""
    
    log "✅ Setup completo registrado em: $LOG_FILE"
}

# Executar função principal
main "$@"