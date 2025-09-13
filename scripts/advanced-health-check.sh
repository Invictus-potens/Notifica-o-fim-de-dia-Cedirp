#!/bin/bash

# Advanced Health Check Script
# Automação de Mensagem de Espera - CAM Krolik Integration

set -e

# Configurações
HEALTH_URL="http://localhost:3000/health"
API_URL="http://localhost:3000/api/status"
LOG_FILE="logs/health-check.log"
TIMEOUT=10
MAX_RETRIES=3

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função para verificar se serviço está rodando
check_service() {
    local service_name=$1
    local check_command=$2
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if eval "$check_command" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name: OK${NC}"
            log "$service_name: OK"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}⏳ $service_name: Tentativa $retry_count/$MAX_RETRIES...${NC}"
            sleep 2
        fi
    done
    
    echo -e "${RED}❌ $service_name: FALHOU${NC}"
    log "$service_name: FALHOU após $MAX_RETRIES tentativas"
    return 1
}

# Função para verificar conectividade HTTP
check_http() {
    local url=$1
    local expected_status=${2:-200}
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

# Função para verificar uso de recursos
check_resources() {
    echo "🔍 Verificando recursos do sistema..."
    
    # CPU
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        echo -e "${YELLOW}⚠️  CPU: ${cpu_usage}% (Alto)${NC}"
        log "CPU usage alto: ${cpu_usage}%"
    else
        echo -e "${GREEN}✅ CPU: ${cpu_usage}%${NC}"
    fi
    
    # Memória
    local mem_usage=$(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')
    if (( $(echo "$mem_usage > 85" | bc -l) )); then
        echo -e "${YELLOW}⚠️  Memória: ${mem_usage}% (Alto)${NC}"
        log "Uso de memória alto: ${mem_usage}%"
    else
        echo -e "${GREEN}✅ Memória: ${mem_usage}%${NC}"
    fi
    
    # Disco
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        echo -e "${YELLOW}⚠️  Disco: ${disk_usage}% (Alto)${NC}"
        log "Uso de disco alto: ${disk_usage}%"
    else
        echo -e "${GREEN}✅ Disco: ${disk_usage}%${NC}"
    fi
}

# Função para verificar logs de erro
check_error_logs() {
    echo "📋 Verificando logs de erro..."
    
    local error_count=0
    
    # Verificar erros nas últimas 24 horas
    if [ -f "$LOG_FILE" ]; then
        error_count=$(grep -c "ERROR\|FALHOU\|❌" "$LOG_FILE" 2>/dev/null || echo "0")
    fi
    
    if [ "$error_count" -gt 10 ]; then
        echo -e "${YELLOW}⚠️  Erros encontrados: $error_count (nas últimas 24h)${NC}"
        log "Alto número de erros detectado: $error_count"
    else
        echo -e "${GREEN}✅ Logs: $error_count erros (aceitável)${NC}"
    fi
}

# Função para verificar conectividade externa
check_external_services() {
    echo "🌐 Verificando conectividade externa..."
    
    # Verificar se variáveis estão definidas
    if [ -f ".env" ]; then
        source .env
    fi
    
    # Verificar API CAM Krolik
    if [ -n "$KROLIK_API_BASE_URL" ] && [ -n "$KROLIK_API_TOKEN" ]; then
        if curl -f -s --max-time $TIMEOUT \
           -H "Authorization: Bearer $KROLIK_API_TOKEN" \
           "$KROLIK_API_BASE_URL/sectors" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ API CAM Krolik: OK${NC}"
        else
            echo -e "${RED}❌ API CAM Krolik: FALHOU${NC}"
            log "Falha na conectividade com API CAM Krolik"
        fi
    else
        echo -e "${YELLOW}⚠️  API CAM Krolik: Não configurada${NC}"
    fi
    
    # Verificar Supabase
    if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ]; then
        if curl -f -s --max-time $TIMEOUT \
           -H "apikey: $SUPABASE_ANON_KEY" \
           "$SUPABASE_URL/rest/v1/" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Supabase: OK${NC}"
        else
            echo -e "${RED}❌ Supabase: FALHOU${NC}"
            log "Falha na conectividade com Supabase"
        fi
    else
        echo -e "${YELLOW}⚠️  Supabase: Não configurado${NC}"
    fi
}

# Função principal
main() {
    echo "🏥 Iniciando verificação avançada de saúde..."
    echo "$(date '+%Y-%m-%d %H:%M:%S')"
    echo "=================================="
    
    local overall_status=0
    
    # Verificar aplicação principal
    if ! check_service "Aplicação Principal" "check_http $HEALTH_URL"; then
        overall_status=1
    fi
    
    # Verificar API endpoints
    if ! check_service "API Status" "check_http $API_URL"; then
        overall_status=1
    fi
    
    # Verificar PM2 (se disponível)
    if command -v pm2 >/dev/null 2>&1; then
        if ! check_service "PM2 Process" "pm2 list | grep -q 'online'"; then
            overall_status=1
        fi
    fi
    
    # Verificar Docker (se disponível)
    if command -v docker >/dev/null 2>&1; then
        if ! check_service "Docker Container" "docker ps | grep -q 'automacao-mensagem-espera'"; then
            overall_status=1
        fi
    fi
    
    # Verificar recursos do sistema
    check_resources
    
    # Verificar logs de erro
    check_error_logs
    
    # Verificar conectividade externa
    check_external_services
    
    echo "=================================="
    
    if [ $overall_status -eq 0 ]; then
        echo -e "${GREEN}🎉 Sistema saudável!${NC}"
        log "Health check: SUCESSO"
        exit 0
    else
        echo -e "${RED}⚠️  Problemas detectados no sistema${NC}"
        log "Health check: FALHOU"
        exit 1
    fi
}

# Executar verificação
main "$@"