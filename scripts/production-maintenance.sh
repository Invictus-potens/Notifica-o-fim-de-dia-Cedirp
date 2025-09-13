#!/bin/bash

# Script de manutenção para produção
# Automação de Mensagem de Espera - CAM Krolik Integration

set -e

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/maintenance.log"

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

# Limpeza de logs antigos
cleanup_logs() {
    log "🧹 Limpando logs antigos..."
    
    local logs_dir="$PROJECT_DIR/logs"
    local retention_days=30
    
    if [ -d "$logs_dir" ]; then
        # Remover logs mais antigos que 30 dias
        find "$logs_dir" -name "*.log" -type f -mtime +$retention_days -delete
        
        # Comprimir logs mais antigos que 7 dias
        find "$logs_dir" -name "*.log" -type f -mtime +7 ! -name "*.gz" -exec gzip {} \;
        
        # Remover logs comprimidos mais antigos que 60 dias
        find "$logs_dir" -name "*.log.gz" -type f -mtime +60 -delete
        
        log "✅ Limpeza de logs concluída"
    else
        warning "⚠️  Diretório de logs não encontrado: $logs_dir"
    fi
}

# Limpeza de backups antigos
cleanup_backups() {
    log "🧹 Limpando backups antigos..."
    
    local backup_dir="$PROJECT_DIR/data/backup"
    local retention_days=7
    
    if [ -d "$backup_dir" ]; then
        # Manter apenas os últimos 7 backups
        find "$backup_dir" -name "backup_*.tar.gz" -type f -mtime +$retention_days -delete
        
        # Listar backups restantes
        local backup_count=$(find "$backup_dir" -name "backup_*.tar.gz" -type f | wc -l)
        log "✅ Limpeza de backups concluída. Backups restantes: $backup_count"
    else
        warning "⚠️  Diretório de backup não encontrado: $backup_dir"
    fi
}

# Limpeza de dados temporários
cleanup_temp_data() {
    log "🧹 Limpando dados temporários..."
    
    local temp_dir="$PROJECT_DIR/data/temp"
    
    if [ -d "$temp_dir" ]; then
        # Remover arquivos temporários mais antigos que 1 dia
        find "$temp_dir" -type f -mtime +1 -delete
        
        # Remover diretórios vazios
        find "$temp_dir" -type d -empty -delete
        
        log "✅ Limpeza de dados temporários concluída"
    else
        warning "⚠️  Diretório temporário não encontrado: $temp_dir"
    fi
}

# Otimização de banco de dados local (se aplicável)
optimize_local_database() {
    log "🔧 Otimizando banco de dados local..."
    
    local db_path="$PROJECT_DIR/data/local.db"
    
    if [ -f "$db_path" ]; then
        # Fazer backup antes da otimização
        cp "$db_path" "$db_path.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Executar VACUUM se for SQLite
        if command_exists sqlite3; then
            sqlite3 "$db_path" "VACUUM;"
            log "✅ Otimização do banco de dados concluída"
        else
            warning "⚠️  SQLite3 não encontrado, otimização não realizada"
        fi
    else
        info "ℹ️  Banco de dados local não encontrado, otimização não necessária"
    fi
}

# Verificação e reparo de permissões
fix_permissions() {
    log "🔧 Verificando e corrigindo permissões..."
    
    cd "$PROJECT_DIR"
    
    # Corrigir permissões de diretórios
    find . -type d -exec chmod 755 {} \;
    
    # Corrigir permissões de arquivos
    find . -type f -exec chmod 644 {} \;
    
    # Tornar scripts executáveis
    chmod +x scripts/*.sh
    
    # Permissões especiais para logs e dados
    chmod 755 logs data data/backup data/temp 2>/dev/null || true
    
    log "✅ Permissões corrigidas"
}

# Atualização de dependências de segurança
update_security_dependencies() {
    log "🔒 Verificando atualizações de segurança..."
    
    cd "$PROJECT_DIR"
    
    if command_exists npm; then
        # Verificar vulnerabilidades
        if npm audit --audit-level=high --json > /tmp/audit.json 2>/dev/null; then
            local vulnerabilities=$(cat /tmp/audit.json | jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical' 2>/dev/null || echo 0)
            
            if [ "$vulnerabilities" -gt 0 ]; then
                warning "⚠️  $vulnerabilities vulnerabilidades de alta/crítica severidade encontradas"
                
                # Tentar corrigir automaticamente
                if npm audit fix --only=prod --dry-run >/dev/null 2>&1; then
                    log "🔧 Aplicando correções de segurança..."
                    npm audit fix --only=prod
                    
                    # Recompilar se necessário
                    if [ -f "package-lock.json" ]; then
                        npm run build
                    fi
                    
                    log "✅ Correções de segurança aplicadas"
                else
                    warning "⚠️  Correções automáticas não disponíveis, revisão manual necessária"
                fi
            else
                log "✅ Nenhuma vulnerabilidade crítica encontrada"
            fi
        else
            warning "⚠️  Falha ao executar auditoria de segurança"
        fi
        
        rm -f /tmp/audit.json
    else
        warning "⚠️  npm não encontrado, auditoria de segurança não realizada"
    fi
}

# Verificação de integridade dos arquivos
verify_file_integrity() {
    log "🔍 Verificando integridade dos arquivos..."
    
    cd "$PROJECT_DIR"
    
    # Verificar se arquivos críticos existem
    local critical_files=(
        "dist/index.js"
        "package.json"
        "ecosystem.config.js"
        ".env"
    )
    
    local missing_files=0
    
    for file in "${critical_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "❌ Arquivo crítico não encontrado: $file"
            missing_files=$((missing_files + 1))
        fi
    done
    
    if [ "$missing_files" -eq 0 ]; then
        log "✅ Todos os arquivos críticos estão presentes"
    else
        error "❌ $missing_files arquivos críticos não encontrados"
        return 1
    fi
    
    # Verificar se dist está atualizado
    if [ -f "src/index.ts" ] && [ -f "dist/index.js" ]; then
        if [ "src/index.ts" -nt "dist/index.js" ]; then
            warning "⚠️  Código fonte mais recente que build, recompilação necessária"
            
            if command_exists npm; then
                log "🔧 Recompilando aplicação..."
                npm run build
                log "✅ Recompilação concluída"
            fi
        fi
    fi
}

# Otimização de performance
optimize_performance() {
    log "⚡ Otimizando performance..."
    
    # Limpar cache do npm
    if command_exists npm; then
        npm cache clean --force >/dev/null 2>&1 || true
    fi
    
    # Limpar cache do sistema (se possível)
    if command_exists sync && [ -w /proc/sys/vm/drop_caches ]; then
        sync
        echo 3 | sudo tee /proc/sys/vm/drop_caches >/dev/null 2>&1 || true
    fi
    
    # Otimizar logs do PM2
    if command_exists pm2; then
        pm2 flush >/dev/null 2>&1 || true
    fi
    
    log "✅ Otimização de performance concluída"
}

# Verificação de configuração
verify_configuration() {
    log "🔧 Verificando configuração..."
    
    cd "$PROJECT_DIR"
    
    # Verificar variáveis de ambiente
    if [ -f ".env" ]; then
        if node scripts/validate-env.js >/dev/null 2>&1; then
            log "✅ Configuração válida"
        else
            warning "⚠️  Problemas na configuração detectados"
            node scripts/validate-env.js
        fi
    else
        error "❌ Arquivo .env não encontrado"
        return 1
    fi
}

# Teste de conectividade
test_connectivity() {
    log "🌐 Testando conectividade..."
    
    # Carregar variáveis de ambiente
    if [ -f "$PROJECT_DIR/.env" ]; then
        set -a
        source "$PROJECT_DIR/.env"
        set +a
    fi
    
    local connectivity_ok=true
    
    # Testar API CAM Krolik
    if [ -n "$KROLIK_API_BASE_URL" ] && [ -n "$KROLIK_API_TOKEN" ]; then
        if curl -f -s -H "Authorization: Bearer $KROLIK_API_TOKEN" \
               "$KROLIK_API_BASE_URL/sectors" >/dev/null 2>&1; then
            log "✅ Conectividade com API CAM Krolik: OK"
        else
            error "❌ Falha na conectividade com API CAM Krolik"
            connectivity_ok=false
        fi
    fi
    
    # Testar Supabase
    if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ]; then
        if curl -f -s -H "apikey: $SUPABASE_ANON_KEY" \
               "$SUPABASE_URL/rest/v1/" >/dev/null 2>&1; then
            log "✅ Conectividade com Supabase: OK"
        else
            error "❌ Falha na conectividade com Supabase"
            connectivity_ok=false
        fi
    fi
    
    if [ "$connectivity_ok" = true ]; then
        log "✅ Todos os testes de conectividade passaram"
    else
        error "❌ Falhas de conectividade detectadas"
        return 1
    fi
}

# Reinicialização segura da aplicação
safe_restart() {
    log "🔄 Reinicializando aplicação de forma segura..."
    
    if command_exists pm2; then
        # Verificar se aplicação está rodando
        if pm2 list | grep -q "automacao-mensagem-espera"; then
            # Reload sem downtime
            pm2 reload automacao-mensagem-espera
            
            # Aguardar estabilização
            sleep 10
            
            # Verificar se reinicialização foi bem-sucedida
            if curl -f -s "http://localhost:${PORT:-3000}/health" >/dev/null 2>&1; then
                log "✅ Reinicialização bem-sucedida"
            else
                error "❌ Falha na reinicialização"
                return 1
            fi
        else
            warning "⚠️  Aplicação não está rodando, iniciando..."
            pm2 start ecosystem.config.js --env production
        fi
    else
        warning "⚠️  PM2 não encontrado, reinicialização manual necessária"
    fi
}

# Gerar relatório de manutenção
generate_maintenance_report() {
    log "📊 Gerando relatório de manutenção..."
    
    local report_file="$PROJECT_DIR/logs/maintenance-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
RELATÓRIO DE MANUTENÇÃO
=======================
Data: $(date)
Servidor: $(hostname)

RESUMO DAS ATIVIDADES:
- Limpeza de logs antigos
- Limpeza de backups antigos
- Limpeza de dados temporários
- Otimização de banco de dados local
- Correção de permissões
- Verificação de vulnerabilidades de segurança
- Verificação de integridade dos arquivos
- Otimização de performance
- Verificação de configuração
- Teste de conectividade

STATUS FINAL:
$(curl -f -s "http://localhost:${PORT:-3000}/health" >/dev/null 2>&1 && echo "✅ Aplicação funcionando normalmente" || echo "❌ Aplicação com problemas")

RECURSOS DO SISTEMA:
CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}' || echo 'N/A')%
Memória: $(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}' || echo 'N/A')%
Disco: $(df -h "$PROJECT_DIR" | awk 'NR==2 {print $5}' || echo 'N/A')

LOGS DETALHADOS:
Ver arquivo: $LOG_FILE
EOF
    
    log "✅ Relatório de manutenção gerado: $report_file"
}

# Função de ajuda
show_help() {
    echo "Script de Manutenção - Automação de Mensagem de Espera"
    echo ""
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  --full          Executar manutenção completa (padrão)"
    echo "  --cleanup       Apenas limpeza (logs, backups, temp)"
    echo "  --security      Apenas verificações de segurança"
    echo "  --performance   Apenas otimizações de performance"
    echo "  --verify        Apenas verificações (config, conectividade)"
    echo "  --restart       Reinicialização segura da aplicação"
    echo "  --report        Gerar relatório de manutenção"
    echo "  --help          Mostrar esta ajuda"
    echo ""
}

# Função principal
main() {
    local mode="${1:-full}"
    
    log "🚀 Iniciando manutenção de produção (modo: $mode)..."
    
    case "$mode" in
        "--cleanup")
            cleanup_logs
            cleanup_backups
            cleanup_temp_data
            ;;
        "--security")
            update_security_dependencies
            verify_file_integrity
            fix_permissions
            ;;
        "--performance")
            optimize_performance
            optimize_local_database
            ;;
        "--verify")
            verify_configuration
            test_connectivity
            verify_file_integrity
            ;;
        "--restart")
            safe_restart
            ;;
        "--report")
            generate_maintenance_report
            ;;
        "--help")
            show_help
            exit 0
            ;;
        "--full"|*)
            # Manutenção completa
            cleanup_logs
            cleanup_backups
            cleanup_temp_data
            optimize_local_database
            fix_permissions
            update_security_dependencies
            verify_file_integrity
            optimize_performance
            verify_configuration
            test_connectivity
            generate_maintenance_report
            ;;
    esac
    
    log "✅ Manutenção concluída"
}

# Executar função principal
main "$@"