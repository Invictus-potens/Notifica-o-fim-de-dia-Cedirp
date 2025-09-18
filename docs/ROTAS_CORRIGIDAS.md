# 🔧 Rotas Corrigidas - API CAM Krolik

## 📋 **Resumo das Correções**

Baseado no documento `rotas.md`, todas as rotas foram corrigidas para usar as APIs corretas da CAM Krolik ao invés de dados estáticos simulados.

## ✅ **Rotas Corrigidas**

### 1. **GET /api/patients** - Lista pacientes em espera
**❌ Antes:** Dados estáticos simulados
**✅ Agora:** API real da CAM Krolik

```javascript
// Rota correta implementada
POST https://api.camkrolik.com.br/core/v2/api/chats/list-lite
Headers:
- accept: application/json
- access-token: {seu_token}
- Content-Type: application/json-patch+json

Body:
{
  "typeChat": 2,
  "status": 1
}
```

### 2. **GET /api/sectors** - Lista setores disponíveis
**❌ Antes:** Array estático de setores
**✅ Agora:** API real da CAM Krolik

```javascript
// Rota correta implementada
GET https://api.camkrolik.com.br/core/v2/api/sectors
// Retorna array de setores com estrutura:
[
  {
    "id": "string",
    "name": "string",
    "organizationId": "string",
    "serviceTimeRuleId": "string"
  }
]
```

### 3. **GET /api/action-cards** - Lista cartões de ação
**❌ Antes:** Array estático de action cards
**✅ Agora:** API real da CAM Krolik

```javascript
// Rota correta implementada
GET https://api.camkrolik.com.br/core/v2/api/action-cards
// Retorna array de action cards com estrutura:
[
  {
    "id": "string",
    "description": "string",
    "messages": [
      {
        "id": "string",
        "typeMessage": 0,
        "typeFile": 0,
        "text": "string",
        "extension": "string",
        "file": "string",
        "order": 0,
        "scriptId": "string",
        "typeEvent": 0
      }
    ]
  }
]
```

### 4. **GET /api/channels** - Lista canais disponíveis
**❌ Antes:** Array estático de canais
**✅ Agora:** API real da CAM Krolik

```javascript
// Rota correta implementada
GET https://api.camkrolik.com.br/core/v2/api/channel/list
// Retorna array de canais com estrutura:
[
  {
    "id": "string",
    "organizationId": "string",
    "description": "string",
    "identifier": "string",
    "type": 0
  }
]
```

### 5. **POST /api/messages/send-action-card** - Envio manual de cartões
**❌ Antes:** Simulação de envio
**✅ Agora:** API real da CAM Krolik

```javascript
// Rota correta implementada
POST https://api.camkrolik.com.br/core/v2/api/chats/send-action-card
{
  "number": "string",
  "contactId": "string",
  "action_card_id": "string",
  "forceSend": true
}
```

## 🔧 **Arquivos Modificados**

### **1. src/services/KrolikApiClient.js** (NOVO)
- ✅ Cliente HTTP para API CAM Krolik
- ✅ Métodos para todas as rotas necessárias
- ✅ Tratamento de erros e timeouts
- ✅ Conversão de dados da API para modelo interno

### **2. src/index.js** (ATUALIZADO)
- ✅ Importação do KrolikApiClient
- ✅ Inicialização do cliente com configurações
- ✅ Correção de todas as 5 rotas
- ✅ Teste de conexão na inicialização
- ✅ Logs detalhados para debug

## 🌐 **Configuração Necessária**

Para usar as APIs corretas, configure as variáveis de ambiente:

```bash
# .env
KROLIK_API_BASE_URL=https://api.camkrolik.com.br
KROLIK_API_TOKEN=seu_token_aqui
```

## 📊 **Estrutura de Resposta Padrão**

Todas as rotas agora retornam dados reais da API CAM Krolik:

```json
{
  "success": true,
  "data": [...], // Dados reais da API
  "total": 0,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Em caso de erro:
```json
{
  "success": false,
  "error": "Descrição do erro",
  "message": "Mensagem detalhada",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🧪 **Como Testar**

### **1. Testar Conexão**
```bash
curl -X GET "http://localhost:3000/health?quick=true"
```

### **2. Testar Rotas Corrigidas**
```bash
# Pacientes (via nossa API)
curl -X GET "http://localhost:3000/api/patients"

# Pacientes (diretamente na API CAM Krolik)
curl -X POST 'https://api.camkrolik.com.br/core/v2/api/chats/list-lite' \
  -H 'accept: application/json' \
  -H 'access-token: SEU_TOKEN_AQUI' \
  -H 'Content-Type: application/json-patch+json' \
  -d '{
    "typeChat": 2,
    "status": 1
  }'

# Setores
curl -X GET "http://localhost:3000/api/sectors"

# Action Cards
curl -X GET "http://localhost:3000/api/action-cards"

# Canais
curl -X GET "http://localhost:3000/api/channels"
```

### **3. Testar Envio de Action Card**
```bash
curl -X POST "http://localhost:3000/api/messages/send-action-card" \
  -H "Content-Type: application/json" \
  -d '{
    "patients": [
      {
        "number": "11999999999",
        "contactId": "contact123"
      }
    ],
    "action_card_id": "card123"
  }'
```

## 📝 **Logs de Debug**

O sistema agora exibe logs detalhados:

```
🔍 TESTANDO CONECTIVIDADE COM API CAM KROLIK...
✅ API CAM Krolik conectada com sucesso!

📋 API: Buscando pacientes na API CAM Krolik...
👥 Encontrados 5 pacientes aguardando
📋 API: Retornando 5 pacientes

📋 API: Buscando setores na API CAM Krolik...
🏥 Encontrados 4 setores
📋 API: Retornando 4 setores
```

## ⚠️ **Importante**

1. **Token de API**: Certifique-se de que o token da API CAM Krolik está configurado corretamente
2. **Conectividade**: Verifique se o servidor tem acesso à internet para acessar a API
3. **Rate Limiting**: A API pode ter limites de requisições por minuto
4. **Timeout**: Configure timeout adequado para requisições lentas

## 🎯 **Benefícios das Correções**

- ✅ **Dados Reais**: Todas as rotas agora retornam dados reais da API CAM Krolik
- ✅ **Sincronização**: Dados sempre atualizados conforme a API
- ✅ **Confiabilidade**: Tratamento adequado de erros e timeouts
- ✅ **Debugging**: Logs detalhados para identificar problemas
- ✅ **Performance**: Cliente HTTP otimizado com configurações adequadas

---

**🎉 Todas as rotas foram corrigidas com sucesso!**

O sistema agora usa as APIs corretas da CAM Krolik conforme especificado no documento `rotas.md`.
