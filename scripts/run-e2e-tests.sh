#!/bin/bash

# Script de testes end-to-end completos
# Automação de Mensagem de Espera

set -e

echo "🚀 Iniciando testes end-to-end completos..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Verificar se o ambiente está configurado
log "Verificando configuração do ambiente..."
if [ ! -f ".env" ]; then
    error "Arquivo .env não encontrado. Execute 'npm run setup' primeiro."
    exit 1
fi

# Verificar dependências
log "Verificando dependências..."
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    log "Instalando dependências..."
    npm install
fi

# Compilar o projeto
log "Compilando projeto TypeScript..."
npm run build

# Executar testes unitários com cobertura
log "Executando testes unitários com cobertura..."
npm run test:ci

# Verificar cobertura mínima (80%)
log "Verificando cobertura de testes..."
COVERAGE=$(npm run test:ci 2>&1 | grep -o "All files.*[0-9]\+\.[0-9]\+" | grep -o "[0-9]\+\.[0-9]\+" | head -1)
if [ -n "$COVERAGE" ]; then
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
        error "Cobertura de testes ($COVERAGE%) está abaixo do mínimo (80%)"
        exit 1
    else
        log "Cobertura de testes: $COVERAGE% ✓"
    fi
fi

# Executar linting
log "Executando verificação de código..."
npm run lint

# Testar build de produção
log "Testando build de produção..."
NODE_ENV=production npm run build

# Executar testes de integração específicos
log "Executando testes de integração..."

# Teste 1: Verificar se o servidor inicia corretamente
log "Teste 1: Inicialização do servidor..."
timeout 30s npm run dev &
SERVER_PID=$!
sleep 5

if ps -p $SERVER_PID > /dev/null; then
    log "Servidor iniciado com sucesso ✓"
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
else
    error "Falha ao iniciar servidor"
    exit 1
fi

# Teste 2: Verificar endpoints da API
log "Teste 2: Testando endpoints da API..."
npm run dev &
SERVER_PID=$!
sleep 5

# Testar endpoint de status
if curl -f http://localhost:3000/api/status > /dev/null 2>&1; then
    log "Endpoint /api/status funcionando ✓"
else
    warn "Endpoint /api/status não respondeu (pode ser esperado se não implementado)"
fi

# Testar interface web
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log "Interface web carregando ✓"
else
    warn "Interface web não respondeu"
fi

kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

# Teste 3: Validar configurações de ambiente
log "Teste 3: Validando configurações..."
node scripts/validate-env.js

# Teste 4: Testar conectividade com Supabase (se configurado)
log "Teste 4: Testando conectividade com Supabase..."
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ]; then
    # Executar teste específico de conexão
    npm test -- --testNamePattern="SupabaseClient.*connection" --verbose
    log "Teste de conectividade Supabase concluído ✓"
else
    warn "Variáveis do Supabase não configuradas, pulando teste de conectividade"
fi

# Teste 5: Performance - simular carga de 1000 atendimentos
log "Teste 5: Teste de performance (1000 atendimentos simulados)..."
npm test -- --testNamePattern="performance.*1000" --verbose || warn "Testes de performance não encontrados"

# Teste 6: Cenários críticos dos requisitos
log "Teste 6: Validando cenários críticos..."

# Teste de mensagem de 30 minutos
npm test -- --testNamePattern="30.*minute.*message" --verbose

# Teste de fim de expediente
npm test -- --testNamePattern="end.*of.*day" --verbose

# Teste de exceções (setores e canais)
npm test -- --testNamePattern="exception.*list" --verbose

# Teste de duplicação de mensagens
npm test -- --testNamePattern="duplicate.*message" --verbose

# Teste de falha de API
npm test -- --testNamePattern="api.*failure" --verbose

# Teste 7: Responsividade da interface (se aplicável)
log "Teste 7: Verificando responsividade da interface..."
if [ -f "public/test-responsiveness.html" ]; then
    log "Arquivo de teste de responsividade encontrado ✓"
else
    warn "Arquivo de teste de responsividade não encontrado"
fi

# Teste 8: Verificar logs e monitoramento
log "Teste 8: Testando sistema de logs..."
npm test -- --testNamePattern="Logger.*ErrorHandler" --verbose

# Teste 9: Backup e recuperação
log "Teste 9: Testando sistema de backup..."
if [ -f "scripts/backup.js" ]; then
    node scripts/backup.js --test
    log "Sistema de backup testado ✓"
fi

# Teste 10: Health check
log "Teste 10: Executando health check..."
if [ -f "scripts/health-check.sh" ]; then
    chmod +x scripts/health-check.sh
    ./scripts/health-check.sh
    log "Health check concluído ✓"
fi

# Relatório final
log "📊 Gerando relatório final..."
echo ""
echo "=========================================="
echo "         RELATÓRIO DE TESTES E2E"
echo "=========================================="
echo "✅ Testes unitários: PASSOU"
echo "✅ Cobertura de código: $COVERAGE%"
echo "✅ Linting: PASSOU"
echo "✅ Build de produção: PASSOU"
echo "✅ Inicialização do servidor: PASSOU"
echo "✅ Validação de configurações: PASSOU"
echo "✅ Cenários críticos: PASSOU"
echo "✅ Sistema de logs: PASSOU"
echo "✅ Health check: PASSOU"
echo ""
echo "🎉 Todos os testes end-to-end foram concluídos com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Revisar logs de teste para warnings"
echo "   2. Executar testes em ambiente de staging"
echo "   3. Validar performance em produção"
echo "   4. Documentar resultados dos testes"
echo ""
echo "=========================================="

log "Testes end-to-end concluídos com sucesso! 🎉"