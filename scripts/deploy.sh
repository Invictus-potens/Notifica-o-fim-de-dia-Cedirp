#!/bin/bash

# Script de deployment para produção
# Automação de Mensagem de Espera - CAM Krolik Integration

set -e

# Configurações
DEPLOY_ENV=${1:-production}
BACKUP_BEFORE_DEPLOY=${BACKUP_BEFORE_DEPLOY:-true}
LOG_FILE="logs/deploy.log"
APP_NAME="automacao-mensagem-espera"
DEPLOY_START=$(date +%s)

# Função de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função de rollback
rollback() {
    log "🔄 Iniciando rollback..."
    
    if [ -f "data/backup/pre-deploy-backup.tar.gz" ]; then
        log "📦 Restaurando backup anterior..."
        tar -xzf data/backup/pre-deploy-backup.tar.gz
        
        if command -v pm2 &> /dev/null; then
            pm2 restart "$APP_NAME" || true
        fi
        
        log "✅ Rollback concluído"
    else
        log "❌ Backup não encontrado para rollback"
    fi
}

# Trap para capturar erros
trap 'log "❌ Erro durante deployment. Iniciando rollback..."; rollback; exit 1' ERR

log "🚀 Iniciando deployment para ambiente: $DEPLOY_ENV"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    log "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Criar diretórios necessários
mkdir -p logs data/backup

# Fazer backup antes do deploy se solicitado
if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
    log "🗄️  Criando backup antes do deployment..."
    
    # Backup completo do estado atual
    if [ -d "dist" ]; then
        tar -czf data/backup/pre-deploy-backup.tar.gz dist .env || true
    fi
    
    node scripts/backup.js create || log "⚠️  Falha no backup, mas continuando deployment"
fi

# Parar aplicação se estiver rodando
echo "⏹️  Parando aplicação atual..."
if command -v pm2 &> /dev/null; then
    pm2 stop automacao-mensagem-espera || true
elif command -v docker-compose &> /dev/null; then
    docker-compose down || true
fi

# Atualizar código
echo "📥 Atualizando código..."
git fetch origin
git reset --hard origin/main

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --production

# Compilar aplicação
echo "🔨 Compilando aplicação..."
npm run build

# Validar configurações
echo "🔍 Validando configurações..."
node scripts/validate-env.js

# Executar testes críticos
echo "🧪 Executando testes críticos..."
npm run test:ci

# Reiniciar aplicação
echo "🔄 Reiniciando aplicação..."
if command -v pm2 &> /dev/null; then
    pm2 start ecosystem.config.js --env $DEPLOY_ENV
    pm2 save
elif command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    echo "⚠️  PM2 ou Docker não encontrados. Iniciando com npm..."
    npm run start:prod &
fi

# Aguardar aplicação inicializar
echo "⏳ Aguardando aplicação inicializar..."
sleep 10

# Verificar saúde da aplicação
echo "🏥 Verificando saúde da aplicação..."
if ./scripts/health-check.sh; then
    echo "✅ Deployment concluído com sucesso!"
    echo "🌐 Aplicação disponível em: http://localhost:${PORT:-3000}"
else
    echo "❌ Falha no health check após deployment"
    echo "📋 Verificar logs para mais detalhes"
    exit 1
fi

# Limpar arquivos temporários
echo "🧹 Limpando arquivos temporários..."
npm run clean || true

# Estatísticas do deployment
DEPLOY_END=$(date +%s)
DEPLOY_DURATION=$((DEPLOY_END - DEPLOY_START))
log "⏱️  Deployment concluído em ${DEPLOY_DURATION}s"

# Remover backup temporário se deployment foi bem-sucedido
if [ -f "data/backup/pre-deploy-backup.tar.gz" ]; then
    rm -f data/backup/pre-deploy-backup.tar.gz
    log "🗑️  Backup temporário removido"
fi

log "🎉 Deployment finalizado com sucesso!"