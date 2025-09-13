#!/bin/bash

# Script de monitoramento avançado para produção
# Automação de Mensagem de Espera - CAM Krolik Integration

set -e

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/monitoring.log"
ALERT_LOG="$PROJECT_DIR/logs/alerts.log"

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
RESPONSE_TIME_THRESHOLD=5000

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE" | tee -a "$ALERT_LOG"
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

# Função para enviar alerta
send_alert() {
    local message="$1"
    local severity="$2"
    
    # Log do alerta
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$severity] $message" >> "$ALERT_LOG"
    
    # Enviar para Slack se configurado
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 *Automação Mensagem Espera* - $severity\\n$message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # Enviar email se configurado
    if [ -n "$ADMIN_EMAIL" ] && command_exists mail; then
        echo "$message" | mail -s "[$severity] Automação Mensagem Espera" "$ADMIN_EMAIL" || true
    fi
}

# Verificar saúde da aplicação
check_application_health() {
    info "🔍 Verificando saúde da aplicação..."
    
    local health_url="http://localhost:${PORT:-3000}/health"
    local start_time=$(date +%s%3N)
    
    if response=$(curl -f -s -w "%{http_code}" "$health_url" 2>/dev/null); then
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        if [ "$response_time" -gt "$RESPONSE_TIME_THRESHOLD" ]; then
            warning "⚠️  Tempo de resposta alto: ${response_time}ms"
            send_alert "Tempo de resposta da aplicação está alto: ${response_time}ms (threshold: ${RESPONSE_TIME_THRESHOLD}ms)" "WARNING"
        else
            log "✅ Aplicação saudável (${response_time}ms)"
        fi
    else
        error "❌ Aplicação não está respondendo"
        send_alert "Aplicação não está respondendo no endpoint /health" "CRITICAL"
        
        # Tentar reiniciar se PM2 estiver disponível
        if command_exists pm2; then
            warning "🔄 Tentando reiniciar aplicação..."
            pm2 restart automacao-mensagem-espera
            sleep 10
            
            # Verificar novamente
            if curl -f -s "$health_url" >/dev/null 2>&1; then
                log "✅ Aplicação reiniciada com sucesso"
                send_alert "Aplicação foi reiniciada automaticamente e está funcionando" "INFO"
            else
                error "❌ Falha ao reiniciar aplicação"
                send_alert "Falha crítica: não foi possível reiniciar a aplicação" "CRITICAL"
            fi
        fi
    fi
}

# Verificar uso de CPU
check_cpu_usage() {
    info "🔍 Verificando uso de CPU..."
    
    if command_exists top; then
        local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
        cpu_usage=${cpu_usage%.*} # Remover decimais
        
        if [ "$cpu_usage" -gt "$CPU_THRESHOLD" ]; then
            warning "⚠️  Alto uso de CPU: ${cpu_usage}%"
            send_alert "Alto uso de CPU detectado: ${cpu_usage}% (threshold: ${CPU_THRESHOLD}%)" "WARNING"
        else
            log "✅ Uso de CPU normal: ${cpu_usage}%"
        fi
    else
        warning "⚠️  Comando 'top' não encontrado, não foi possível verificar CPU"
    fi
}

# Verificar uso de memória
check_memory_usage() {
    info "🔍 Verificando uso de memória..."
    
    if command_exists free; then
        local memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        
        if [ "$memory_usage" -gt "$MEMORY_THRESHOLD" ]; then
            warning "⚠️  Alto uso de memória: ${memory_usage}%"
            send_alert "Alto uso de memória detectado: ${memory_usage}% (threshold: ${MEMORY_THRESHOLD}%)" "WARNING"
        else
            log "✅ Uso de memória normal: ${memory_usage}%"
        fi
    else
        warning "⚠️  Comando 'free' não encontrado, não foi possível verificar memória"
    fi
}

# Verificar uso de disco
check_disk_usage() {
    info "🔍 Verificando uso de disco..."
    
    if command_exists df; then
        local disk_usage=$(df -h "$PROJECT_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
        
        if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
            warning "⚠️  Alto uso de disco: ${disk_usage}%"
            send_alert "Alto uso de disco detectado: ${disk_usage}% (threshold: ${DISK_THRESHOLD}%)" "WARNING"
        else
            log "✅ Uso de disco normal: ${disk_usage}%"
        fi
    else
        warning "⚠️  Comando 'df' não encontrado, não foi possível verificar disco"
    fi
}

# Verificar conectividade externa
check_external_connectivity() {
    info "🔍 Verificando conectividade externa..."
    
    # Verificar API CAM Krolik
    if [ -n "$KROLIK_API_BASE_URL" ] && [ -n "$KROLIK_API_TOKEN" ]; then
        if curl -f -s -H "Authorization: Bearer $KROLIK_API_TOKEN" \
               "$KROLIK_API_BASE_URL/sectors" >/dev/null 2>&1; then
            log "✅ Conectividade com API CAM Krolik: OK"
        else
            error "❌ Falha na conectividade com API CAM Krolik"
            send_alert "Falha na conectividade com API CAM Krolik" "CRITICAL"
        fi
    fi
    
    # Verificar Supabase
    if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ]; then
        if curl -f -s -H "apikey: $SUPABASE_ANON_KEY" \
               "$SUPABASE_URL/rest/v1/" >/dev/null 2>&1; then
            log "✅ Conectividade com Supabase: OK"
        else
            error "❌ Falha na conectividade com Supabase"
            send_alert "Falha na conectividade com Supabase" "CRITICAL"
        fi
    fi
}

# Verificar logs de erro
check_error_logs() {
    info "🔍 Verificando logs de erro..."
    
    local error_count=0
    local app_log="$PROJECT_DIR/logs/app.log"
    
    if [ -f "$app_log" ]; then
        # Contar erros nas últimas 5 minutos
        error_count=$(grep -c "ERROR" "$app_log" | tail -n 100 | grep "$(date -d '5 minutes ago' '+%Y-%m-%d %H:%M')" | wc -l || echo 0)
        
        if [ "$error_count" -gt 10 ]; then
            warning "⚠️  Muitos erros detectados: $error_count nos últimos 5 minutos"
            send_alert "Alto número de erros detectado: $error_count erros nos últimos 5 minutos" "WARNING"
        elif [ "$error_count" -gt 0 ]; then
            info "ℹ️  Erros detectados: $error_count nos últimos 5 minutos"
        else
            log "✅ Nenhum erro recente detectado"
        fi
    else
        warning "⚠️  Arquivo de log não encontrado: $app_log"
    fi
}

# Verificar processos PM2
check_pm2_processes() {
    info "🔍 Verificando processos PM2..."
    
    if command_exists pm2; then
        local pm2_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="automacao-mensagem-espera") | .pm2_env.status' 2>/dev/null || echo "unknown")
        
        case "$pm2_status" in
            "online")
                log "✅ Processo PM2 online"
                ;;
            "stopped")
                error "❌ Processo PM2 parado"
                send_alert "Processo PM2 está parado" "CRITICAL"
                ;;
            "errored")
                error "❌ Processo PM2 com erro"
                send_alert "Processo PM2 está com erro" "CRITICAL"
                ;;
            *)
                warning "⚠️  Status do processo PM2 desconhecido: $pm2_status"
                ;;
        esac
    else
        warning "⚠️  PM2 não encontrado"
    fi
}

# Verificar tamanho dos logs
check_log_sizes() {
    info "🔍 Verificando tamanho dos logs..."
    
    local logs_dir="$PROJECT_DIR/logs"
    local max_size_mb=100
    
    if [ -d "$logs_dir" ]; then
        find "$logs_dir" -name "*.log" -type f | while read -r log_file; do
            local size_mb=$(du -m "$log_file" | cut -f1)
            
            if [ "$size_mb" -gt "$max_size_mb" ]; then
                warning "⚠️  Log muito grande: $(basename "$log_file") (${size_mb}MB)"
                send_alert "Log file muito grande detectado: $(basename "$log_file") (${size_mb}MB)" "WARNING"
            fi
        done
        
        log "✅ Verificação de logs concluída"
    else
        warning "⚠️  Diretório de logs não encontrado: $logs_dir"
    fi
}

# Verificar backup recente
check_recent_backup() {
    info "🔍 Verificando backup recente..."
    
    local backup_dir="$PROJECT_DIR/data/backup"
    local max_age_hours=25 # Mais de 24h
    
    if [ -d "$backup_dir" ]; then
        local latest_backup=$(find "$backup_dir" -name "backup_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        
        if [ -n "$latest_backup" ]; then
            local backup_age=$(find "$latest_backup" -mtime +1 | wc -l)
            
            if [ "$backup_age" -gt 0 ]; then
                warning "⚠️  Backup mais antigo que 24 horas"
                send_alert "Backup mais antigo que 24 horas detectado" "WARNING"
            else
                log "✅ Backup recente encontrado"
            fi
        else
            warning "⚠️  Nenhum backup encontrado"
            send_alert "Nenhum backup encontrado no diretório" "WARNING"
        fi
    else
        warning "⚠️  Diretório de backup não encontrado: $backup_dir"
    fi
}

# Gerar relatório de status
generate_status_report() {
    info "📊 Gerando relatório de status..."
    
    local report_file="$PROJECT_DIR/logs/status-report-$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "server": {
    "hostname": "$(hostname)",
    "uptime": "$(uptime -p 2>/dev/null || echo 'unknown')",
    "load_average": "$(uptime | awk -F'load average:' '{print $2}' | xargs)"
  },
  "application": {
    "status": "$(curl -f -s http://localhost:${PORT:-3000}/health >/dev/null 2>&1 && echo 'healthy' || echo 'unhealthy')",
    "pm2_status": "$(command_exists pm2 && pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="automacao-mensagem-espera") | .pm2_env.status' 2>/dev/null || echo 'unknown')"
  },
  "resources": {
    "cpu_usage": "$(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | awk -F'%' '{print $1}' || echo 'unknown')",
    "memory_usage": "$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}' || echo 'unknown')",
    "disk_usage": "$(df -h "$PROJECT_DIR" | awk 'NR==2 {print $5}' || echo 'unknown')"
  },
  "connectivity": {
    "krolik_api": "$(curl -f -s -H "Authorization: Bearer $KROLIK_API_TOKEN" "$KROLIK_API_BASE_URL/sectors" >/dev/null 2>&1 && echo 'ok' || echo 'failed')",
    "supabase": "$(curl -f -s -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/" >/dev/null 2>&1 && echo 'ok' || echo 'failed')"
  }
}
EOF
    
    log "✅ Relatório de status gerado: $report_file"
}

# Função principal
main() {
    log "🚀 Iniciando monitoramento de produção..."
    
    # Carregar variáveis de ambiente
    if [ -f "$PROJECT_DIR/.env" ]; then
        set -a
        source "$PROJECT_DIR/.env"
        set +a
    fi
    
    # Executar verificações
    check_application_health
    check_cpu_usage
    check_memory_usage
    check_disk_usage
    check_external_connectivity
    check_error_logs
    check_pm2_processes
    check_log_sizes
    check_recent_backup
    
    # Gerar relatório se solicitado
    if [ "$1" = "--report" ]; then
        generate_status_report
    fi
    
    log "✅ Monitoramento concluído"
}

# Executar função principal
main "$@"