# 📱 Guia Completo - Sistema de Múltiplos Canais WhatsApp

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Configuração Inicial](#configuração-inicial)
3. [Gerenciamento de Canais](#gerenciamento-de-canais)
4. [Funcionalidades Avançadas](#funcionalidades-avançadas)
5. [APIs Disponíveis](#apis-disponíveis)
6. [Monitoramento e Saúde](#monitoramento-e-saúde)
7. [Troubleshooting](#troubleshooting)
8. [Exemplos de Uso](#exemplos-de-uso)

## 🎯 Visão Geral

O Sistema de Múltiplos Canais WhatsApp permite gerenciar vários números de WhatsApp simultaneamente, com balanceamento automático de carga, monitoramento de saúde e recuperação automática em caso de falhas.

### ✨ Principais Funcionalidades
- **Múltiplos Canais**: Gerencie até 10+ canais WhatsApp simultaneamente
- **Balanceamento Inteligente**: Distribuição automática baseada em carga e performance
- **Contexto de Conversas**: Respostas sempre vêm do mesmo canal da mensagem original
- **Monitoramento de Saúde**: Detecção automática de problemas nos canais
- **Fallback Automático**: Recuperação transparente quando canais falham
- **Interface Completa**: Gerenciamento visual de todos os canais

## ⚙️ Configuração Inicial

### 1. Estrutura de Canais no system_config.json

```json
{
  "channels": [
    {
      "id": "anexo1-estoque",
      "name": "ANEXO1-CLAROpré cel Estoque",
      "number": "5516991003715",
      "token": "66180b4e5852dcf886a0ffd0",
      "active": true,
      "priority": 1,
      "department": "estoque",
      "description": "Canal principal para setor de estoque"
    }
  ],
  "channelMetrics": {
    "anexo1-estoque": {
      "messagesSent": 0,
      "messagesFailed": 0,
      "activeConversations": 0,
      "lastActivity": null
    }
  }
}
```

### 2. Parâmetros de Configuração

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | ✅ | Identificador único do canal |
| `name` | string | ✅ | Nome descritivo do canal |
| `number` | string | ✅ | Número completo com DDD (ex: 5516991003715) |
| `token` | string | ✅ | Token da API CAM Krolik |
| `active` | boolean | ❌ | Status ativo/inativo (padrão: true) |
| `priority` | number | ❌ | Prioridade (1-999, menor = maior prioridade) |
| `department` | string | ❌ | Departamento (estoque, oficial, ti, etc.) |
| `description` | string | ❌ | Descrição opcional do canal |

## 🎛️ Gerenciamento de Canais

### Interface Web

#### 1. Acessando a Tela de Canais
- Navegue para **Canais** no menu lateral
- Visualize todos os canais configurados
- Gerencie canais através de ações contextuais

#### 2. Adicionando Novo Canal
1. Clique em **"Adicionar Canal"**
2. Preencha os dados obrigatórios:
   - ID único do canal
   - Nome descritivo
   - Número WhatsApp (com DDD)
   - Token da API
3. Configure opções avançadas:
   - Departamento
   - Prioridade
   - Status ativo/inativo
4. Clique em **"Salvar Canal"**

#### 3. Editando Canal Existente
1. Clique no menu **"⋮"** do canal
2. Selecione **"Editar"**
3. Modifique os campos desejados
4. Clique em **"Salvar Canal"**

#### 4. Ativando/Desativando Canais
- Use o menu **"⋮"** → **"Ativar/Desativar"**
- Ou altere o status no formulário de edição

### Filtros e Busca

#### Filtros Disponíveis
- **Status**: Todos / Ativos / Inativos
- **Departamento**: Todos / Estoque / Oficial / TI / etc.
- **Busca**: Por nome ou número do canal

## 🚀 Funcionalidades Avançadas

### 1. Balanceamento de Carga Inteligente

O sistema utiliza um algoritmo multi-fator para selecionar o melhor canal:

#### Fatores de Seleção
- **40%** - Conversas ativas (menor = melhor)
- **30%** - Prioridade do canal (menor = melhor)
- **20%** - Taxa de sucesso (maior = melhor)
- **10%** - Tempo desde último uso (recente = melhor)

#### Exemplo de Cálculo
```
Canal A: 5 conversas ativas, prioridade 1, 95% sucesso, usado há 2h
Score = (5 × 0.4) + (1 × 0.3) + (5 × 0.2) + (22 × 0.1) = 5.7

Canal B: 2 conversas ativas, prioridade 2, 98% sucesso, usado há 1h
Score = (2 × 0.4) + (2 × 0.3) + (2 × 0.2) + (23 × 0.1) = 3.5

Resultado: Canal B é selecionado (menor score)
```

### 2. Contexto de Conversas

#### Como Funciona
1. **Nova Conversa**: Sistema escolhe o melhor canal disponível
2. **Continuação**: Mensagens subsequentes usam o mesmo canal
3. **Contexto Persistente**: Mantido por 24h de inatividade
4. **Limpeza Automática**: Conversas inativas são removidas

#### Mapeamento de Departamentos
- **Estoque** → Canais com `department: "estoque"`
- **TI** → Canais com `department: "ti"`
- **Oficial** → Canais com `department: "oficial"`
- **Outros** → Canal com menor prioridade ativo

### 3. Sistema de Fallback

#### Detecção de Falhas
- Falha na API do canal principal
- Timeout de conexão
- Erro de autenticação
- Resposta de erro da API

#### Processo de Fallback
1. **Detecção**: Canal principal falha
2. **Seleção**: Sistema escolhe canal saudável alternativo
3. **Teste**: Verifica conectividade do canal de fallback
4. **Envio**: Tenta enviar via canal alternativo
5. **Log**: Registra uso de fallback nos logs

## 📊 APIs Disponíveis

### Gerenciamento de Canais

#### Listar Todos os Canais
```http
GET /api/channels
```

#### Listar Canais Ativos
```http
GET /api/channels/active
```

#### Obter Canal Específico
```http
GET /api/channels/{channelId}
```

#### Adicionar Canal
```http
POST /api/channels
Content-Type: application/json

{
  "id": "novo-canal",
  "name": "Novo Canal",
  "number": "5516999999999",
  "token": "token-da-api",
  "active": true,
  "priority": 5,
  "department": "oficial",
  "description": "Canal de teste"
}
```

#### Atualizar Canal
```http
PUT /api/channels/{channelId}
Content-Type: application/json

{
  "name": "Nome Atualizado",
  "active": false
}
```

#### Ativar/Desativar Canal
```http
PATCH /api/channels/{channelId}/toggle
Content-Type: application/json

{
  "active": true
}
```

#### Remover Canal
```http
DELETE /api/channels/{channelId}
```

### Estatísticas e Métricas

#### Estatísticas de Carga
```http
GET /api/channels/stats/load
```

#### Estatísticas de Conversas
```http
GET /api/channels/stats/conversations
```

#### Saúde de Canal Específico
```http
GET /api/channels/{channelId}/health
```

#### Canais com Problemas
```http
GET /api/channels/health/unhealthy
```

#### Disponibilidade de Canais
```http
GET /api/channels/health/availability
```

### Limpeza e Manutenção

#### Limpar Conversas Inativas
```http
POST /api/channels/cleanup
```

## 🏥 Monitoramento e Saúde

### Status de Saúde dos Canais

#### Cálculo de Score (0-100)
- **100-80**: `healthy` - Canal funcionando perfeitamente
- **79-60**: `degraded` - Canal com pequenos problemas
- **59-30**: `warning` - Canal com problemas moderados
- **29-0**: `critical` - Canal com problemas críticos

#### Fatores de Avaliação
1. **Status Ativo**: Canal deve estar ativo
2. **Taxa de Falhas**: < 20% de falhas
3. **Atividade Recente**: Uso nas últimas 24h
4. **Carga**: < 50 conversas ativas simultâneas

### Alertas Automáticos

#### Problemas Detectados
- Canal inativo por mais de 24h
- Taxa de falhas > 20%
- Sobrecarga > 50 conversas ativas
- Falha de conectividade

#### Ações Recomendadas
1. **Verificar Token**: Renovar token expirado
2. **Reiniciar Canal**: Desativar e reativar
3. **Verificar Carga**: Redistribuir conversas
4. **Contatar Suporte**: Para problemas persistentes

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Canal Não Envia Mensagens
**Sintomas**: Mensagens falham constantemente
**Soluções**:
- Verificar se token está válido
- Testar conectividade da API
- Verificar se canal está ativo
- Checar logs de erro

#### 2. Balanceamento Não Funciona
**Sintomas**: Sempre usa o mesmo canal
**Soluções**:
- Verificar prioridades dos canais
- Checar se há canais ativos suficientes
- Verificar métricas de carga
- Revisar configuração de departamentos

#### 3. Fallback Não Ativa
**Sintomas**: Sistema para quando canal falha
**Soluções**:
- Verificar se há canais saudáveis disponíveis
- Checar configuração de fallback
- Verificar logs de erro
- Testar conectividade dos canais

#### 4. Contexto de Conversa Perdido
**Sintomas**: Respostas vêm de canal diferente
**Soluções**:
- Verificar se número está correto
- Checar mapeamento de departamentos
- Verificar limpeza automática de conversas
- Revisar logs de contexto

### Logs Importantes

#### Logs de Seleção de Canal
```
🎯 Canal escolhido por departamento: ANEXO1-Estoque (estoque)
📊 Score do canal ANEXO1-Estoque: { conversas: 2, prioridade: 0.3, sucesso: 1, ultimoUso: 0, total: 3.3 }
```

#### Logs de Fallback
```
⚠️ Falha no canal principal ANEXO1-Estoque: Connection timeout
🔄 Tentando encontrar canal de fallback para 5516999999999...
🎯 Canal de fallback selecionado: WhatsApp Oficial (551639775100)
✅ Mensagem enviada via canal de fallback: WhatsApp Oficial
```

#### Logs de Saúde
```
🏥 Canal ANEXO1-Estoque: status=healthy, score=85, issues=[]
⚠️ Canal TI-Suporte: status=warning, score=45, issues=["Taxa de falhas alta: 25.5%"]
```

## 💡 Exemplos de Uso

### Exemplo 1: Configuração Básica

```json
{
  "channels": [
    {
      "id": "principal",
      "name": "WhatsApp Principal",
      "number": "551639775100",
      "token": "token-principal",
      "active": true,
      "priority": 1,
      "department": "oficial"
    },
    {
      "id": "backup",
      "name": "WhatsApp Backup",
      "number": "5516991003715",
      "token": "token-backup",
      "active": true,
      "priority": 2,
      "department": "oficial"
    }
  ]
}
```

### Exemplo 2: Configuração por Departamentos

```json
{
  "channels": [
    {
      "id": "estoque",
      "name": "Estoque",
      "number": "5516991003715",
      "token": "token-estoque",
      "department": "estoque",
      "priority": 1
    },
    {
      "id": "ti",
      "name": "Suporte TI",
      "number": "5516991703483",
      "token": "token-ti",
      "department": "ti",
      "priority": 1
    },
    {
      "id": "oficial",
      "name": "Canal Oficial",
      "number": "551639775100",
      "token": "token-oficial",
      "department": "oficial",
      "priority": 2
    }
  ]
}
```

### Exemplo 3: Monitoramento via API

```javascript
// Verificar saúde de todos os canais
async function checkChannelHealth() {
  const response = await fetch('/api/channels/health/unhealthy');
  const data = await response.json();
  
  if (data.count > 0) {
    console.warn('Canais com problemas:', data.data);
    // Enviar alerta para administradores
  }
}

// Verificar disponibilidade
async function checkAvailability() {
  const response = await fetch('/api/channels/health/availability');
  const data = await response.json();
  
  if (!data.data.hasHealthyChannels) {
    console.error('Nenhum canal saudável disponível!');
    // Ativar modo de emergência
  }
}
```

## 📈 Métricas e Relatórios

### Dashboard de Canais
- **Conversas Ativas**: Número de conversas por canal
- **Mensagens Enviadas**: Total de mensagens enviadas
- **Taxa de Sucesso**: Percentual de mensagens bem-sucedidas
- **Status de Saúde**: Indicador visual de saúde do canal

### Relatórios Disponíveis
1. **Performance por Canal**: Métricas individuais
2. **Distribuição de Carga**: Como as conversas são distribuídas
3. **Histórico de Fallbacks**: Quando e por que fallbacks foram usados
4. **Tendências de Saúde**: Evolução da saúde dos canais

## 🔒 Segurança e Boas Práticas

### Segurança
- **Tokens Seguros**: Nunca exponha tokens em logs
- **Validação de Entrada**: Sempre valide dados de entrada
- **Rate Limiting**: Implemente limites de taxa para APIs
- **Monitoramento**: Monitore tentativas de acesso suspeitas

### Boas Práticas
1. **Backup de Configuração**: Mantenha backup do system_config.json
2. **Monitoramento Contínuo**: Configure alertas para problemas
3. **Testes Regulares**: Teste canais periodicamente
4. **Documentação**: Mantenha documentação atualizada
5. **Logs Estruturados**: Use logs estruturados para debugging

## 📞 Suporte

### Contatos
- **Desenvolvedor**: Sistema desenvolvido com IA
- **Documentação**: Este guia completo
- **Logs**: Consulte logs para debugging

### Recursos Adicionais
- **API Documentation**: Endpoints completos
- **Code Examples**: Exemplos de integração
- **Troubleshooting Guide**: Soluções para problemas comuns

---

**Versão**: 1.0.0  
**Última Atualização**: Dezembro 2024  
**Compatibilidade**: Node.js 14+, WhatsApp Business API
