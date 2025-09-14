# 🏥 Health Check API

Este documento descreve as rotas de health check implementadas no sistema de automação de mensagens.

## 📋 Rotas Disponíveis

### 1. `/health` - Health Check Básico
- **Método**: GET
- **Descrição**: Verificação completa de saúde do sistema
- **Resposta**: Status detalhado de todos os componentes

### 2. `/api/health` - Health Check da API
- **Método**: GET
- **Descrição**: Verificação completa de saúde com informações adicionais
- **Parâmetros**:
  - `quick=true` - Executa apenas verificações críticas (mais rápido)

## 🔍 Componentes Verificados

O health check verifica os seguintes componentes:

1. **Database** - Conexão com banco de dados
2. **API Connectivity** - Conectividade com API externa
3. **Configuration** - Configurações do sistema
4. **Monitoring Service** - Serviço de monitoramento
5. **Message Service** - Serviço de mensagens
6. **System Resources** - Recursos do sistema (memória, CPU)
7. **Time Sync** - Sincronização de tempo
8. **Cron Jobs** - Jobs agendados

## 📊 Status Possíveis

- **`healthy`** - Todos os componentes funcionando corretamente
- **`degraded`** - Alguns componentes com problemas menores
- **`unhealthy`** - Componentes críticos com falhas

## 🚀 Como Usar

### Via cURL
```bash
# Health check básico
curl http://localhost:3000/health

# Health check da API
curl http://localhost:3000/api/health

# Health check rápido
curl http://localhost:3000/api/health?quick=true
```

### Via Script de Teste
```bash
# Testar todas as rotas
node scripts/test-health-check.js

# Testar em URL específica
node scripts/test-health-check.js http://localhost:3000
```

## 📝 Exemplo de Resposta

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "responseTime": 150,
  "checks": {
    "database": {
      "status": "pass",
      "message": "Database connection healthy",
      "duration": 25
    },
    "api_connectivity": {
      "status": "pass",
      "message": "API connectivity healthy",
      "duration": 45
    }
  },
  "overall": {
    "totalChecks": 8,
    "passedChecks": 8,
    "failedChecks": 0,
    "warningChecks": 0,
    "responseTime": 150
  }
}
```

## 🔧 Logs

O sistema gera logs detalhados e organizados no terminal para cada verificação:

```
🏥 ===========================================
   INICIANDO VERIFICAÇÃO DE SAÚDE
===========================================
🔍 Executando verificação completa do sistema...

📊 ===========================================
   RESULTADO DA VERIFICAÇÃO
===========================================
🎯 Status Geral: HEALTHY
⏱️  Tempo de Resposta: 150ms
📈 Total de Checks: 8
✅ Checks Aprovados: 8
❌ Checks Falharam: 0
⚠️  Checks com Aviso: 0

🔍 ===========================================
   DETALHES DOS COMPONENTES
===========================================
✅ DATABASE: APROVADO
   📝 Database connection healthy
   ⏱️  Tempo: 25ms

✅ API_CONNECTIVITY: APROVADO
   📝 API connectivity healthy
   ⏱️  Tempo: 45ms

🎯 ===========================================
   ✅ SISTEMA SAUDÁVEL
   ⏱️  Tempo Total: 150ms
===========================================
```

## 📈 Monitoramento

As rotas de health check são ideais para:
- **Load Balancers** - Verificar se o serviço está disponível
- **Monitoring Tools** - Integração com ferramentas de monitoramento
- **CI/CD Pipelines** - Verificação de saúde em deployments
- **Alerting Systems** - Detecção de problemas em tempo real

## ⚡ Performance

- **Health Check Completo**: ~100-500ms (dependendo dos serviços externos)
- **Health Check Rápido**: ~50-200ms (apenas verificações críticas)
- **Timeout**: 10 segundos por verificação
- **Cache**: Resultados são cacheados por 30 segundos

## 🛠️ Configuração

O health check pode ser configurado através do `HealthCheckService`:

```typescript
const healthCheckConfig = {
  timeout: 5000,
  retries: 3,
  criticalChecks: ['database', 'api_connectivity'],
  warningThresholds: {
    responseTime: 1000,
    errorRate: 0.1,
    memoryUsage: 0.8
  }
};
```
