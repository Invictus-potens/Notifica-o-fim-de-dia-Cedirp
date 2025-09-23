# Payloads de Envio de Cartões de Ações por Canal

Este documento contém os payloads específicos para envio de cartões de ações através de cada canal configurado no sistema.

## Endpoint Base

**URL Externa:** `https://api.camkrolik.com.br/core/v2/api/chats/send-action-card`  
**URL Interna:** `http://localhost:3000/api/messages/send-action-card`

---

## 1. Canal ANEXO 1 - ESTOQUE

### Configuração
- **ID:** `anexo1-estoque`
- **Token:** `TOKEN_ANEXO1_ESTOQUE`
- **Departamento:** estoque
- **Número:** 1

### Payload via API Externa (cURL)
```bash
curl -X POST 'https://api.camkrolik.com.br/core/v2/api/chats/send-action-card' \
  -H 'accept: application/json' \
  -H 'access-token: 66180b4e5852dcf886a0ffd0' \
  -H 'Content-Type: application/json-patch+json' \
  -d '{
    "number": "5511999999999",
    "contactId": "contact_123456",
    "action_card_id": "card_estoque_001",
    "forceSend": true
  }'
```

### Payload via API Interna (JSON)
```json
{
  "patients": [
    {
      "number": "5511999999999",
      "contactId": "contact_123456",
      "channelId": "anexo1-estoque"
    }
  ],
  "action_card_id": "card_estoque_001",
  "channelId": "anexo1-estoque"
}
```

---

## 2. Canal WHATSAPP OFICIAL

### Configuração
- **ID:** `whatsapp-oficial`
- **Token:** `TOKEN_WHATSAPP_OFICIAL`
- **Departamento:** oficial
- **Número:** 2

### Payload via API Externa (cURL)
```bash
curl -X POST 'https://api.camkrolik.com.br/core/v2/api/chats/send-action-card' \
  -H 'accept: application/json' \
  -H 'access-token: 65f06d5b867543e1d094fa0f' \
  -H 'Content-Type: application/json-patch+json' \
  -d '{
    "number": "5511999999999",
    "contactId": "contact_123456",
    "action_card_id": "card_oficial_001",
    "forceSend": true
  }'
```

### Payload via API Interna (JSON)
```json
{
  "patients": [
    {
      "number": "5511999999999",
      "contactId": "contact_123456",
      "channelId": "whatsapp-oficial"
    }
  ],
  "action_card_id": "card_oficial_001",
  "channelId": "whatsapp-oficial"
}
```

---

## 3. Canal CONFIRMAÇÃO 1

### Configuração
- **ID:** `confirmacao1`
- **Token:** `TOKEN_CONFIRMACAO1`
- **Departamento:** confirmacao
- **Número:** 3

### Payload via API Externa (cURL)
```bash
curl -X POST 'https://api.camkrolik.com.br/core/v2/api/chats/send-action-card' \
  -H 'accept: application/json' \
  -H 'access-token: 6848611846467bfb329de619' \
  -H 'Content-Type: application/json-patch+json' \
  -d '{
    "number": "5511999999999",
    "contactId": "contact_123456",
    "action_card_id": "card_confirmacao_001",
    "forceSend": true
  }'
```

### Payload via API Interna (JSON)
```json
{
  "patients": [
    {
      "number": "5511999999999",
      "contactId": "contact_123456",
      "channelId": "confirmacao1"
    }
  ],
  "action_card_id": "card_confirmacao_001",
  "channelId": "confirmacao1"
}
```

---

## 4. Canal CONFIRMAÇÃO 2 - TI

### Configuração
- **ID:** `confirmacao2-ti`
- **Token:** `TOKEN_CONFIRMACAO2_TI`
- **Departamento:** ti
- **Número:** 4

### Payload via API Externa (cURL)
```bash
curl -X POST 'https://api.camkrolik.com.br/core/v2/api/chats/send-action-card' \
  -H 'accept: application/json' \
  -H 'access-token: 68486231df08d48001f8951d' \
  -H 'Content-Type: application/json-patch+json' \
  -d '{
    "number": "5511999999999",
    "contactId": "contact_123456",
    "action_card_id": "card_ti_001",
    "forceSend": true
  }'
```

### Payload via API Interna (JSON)
```json
{
  "patients": [
    {
      "number": "5511999999999",
      "contactId": "contact_123456",
      "channelId": "confirmacao2-ti"
    }
  ],
  "action_card_id": "card_ti_001",
  "channelId": "confirmacao2-ti"
}
```

---

## 5. Canal CONFIRMAÇÃO 3 - CARLA

### Configuração
- **ID:** `confirmacao3-carla`
- **Token:** `TOKEN_CONFIRMACAO3_CARLA`
- **Departamento:** carla
- **Número:** 5

### Payload via API Externa (cURL)
```bash
curl -X POST 'https://api.camkrolik.com.br/core/v2/api/chats/send-action-card' \
  -H 'accept: application/json' \
  -H 'access-token: 6878f61667716e87a4ca2fbd' \
  -H 'Content-Type: application/json-patch+json' \
  -d '{
    "number": "5511999999999",
    "contactId": "contact_123456",
    "action_card_id": "card_carla_001",
    "forceSend": true
  }'
```

### Payload via API Interna (JSON)
```json
{
  "patients": [
    {
      "number": "5511999999999",
      "contactId": "contact_123456",
      "channelId": "confirmacao3-carla"
    }
  ],
  "action_card_id": "card_carla_001",
  "channelId": "confirmacao3-carla"
}
```

---

## Payload Genérico (Múltiplos Pacientes)

### Para Envio em Massa via API Interna
```json
{
  "patients": [
    {
      "number": "5511999999999",
      "contactId": "contact_123456",
      "channelId": "anexo1-estoque"
    },
    {
      "number": "5511888888888",
      "contactId": "contact_789012",
      "channelId": "whatsapp-oficial"
    },
    {
      "number": "5511777777777",
      "contactId": "contact_345678",
      "channelId": "confirmacao1"
    }
  ],
  "action_card_id": "card_generico_001"
}
```

---

## Headers Obrigatórios

### Para API Externa (CAM Krolik)
```javascript
{
  'accept': 'application/json',
  'access-token': 'TOKEN_DO_CANAL_ESPECÍFICO',
  'Content-Type': 'application/json-patch+json'
}
```

### Para API Interna
```javascript
{
  'Content-Type': 'application/json'
}
```

---

## Campos Obrigatórios

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `number` | string | Número do telefone do paciente | ✅ |
| `contactId` | string | ID do contato na API CAM Krolik | ✅ |
| `action_card_id` | string | ID do cartão de ação a ser enviado | ✅ |
| `forceSend` | boolean | Força o envio mesmo se já foi enviado | ❌ (default: true) |
| `channelId` | string | ID do canal (apenas para API interna) | ❌ |

---

## Exemplos de Action Cards por Canal

### Canal Estoque
- `card_estoque_001` - Confirmação de pedido
- `card_estoque_002` - Status de entrega
- `card_estoque_003` - Aviso de disponibilidade

### Canal Oficial
- `card_oficial_001` - Boas-vindas
- `card_oficial_002` - Informações gerais
- `card_oficial_003` - Suporte ao cliente

### Canal Confirmação 1
- `card_confirmacao_001` - Confirmação de agendamento
- `card_confirmacao_002` - Lembrete de consulta
- `card_confirmacao_003` - Cancelamento

### Canal TI
- `card_ti_001` - Suporte técnico
- `card_ti_002` - Resolução de problemas
- `card_ti_003` - Atualizações do sistema

### Canal Carla
- `card_carla_001` - Atendimento especializado
- `card_carla_002` - Consultas específicas
- `card_carla_003` - Follow-up personalizado

---

## Notas Importantes

1. **Tokens são específicos** para cada canal e não devem ser intercambiados
2. **Content-Type** deve ser exatamente `application/json-patch+json` para a API externa
3. **forceSend: true** é recomendado para garantir o envio
4. **channelId** é usado apenas na API interna para seleção automática do canal
5. **contactId** deve ser obtido através da API de listagem de chats
6. **number** deve incluir código do país (55 para Brasil)

---

## Teste de Conectividade

Para testar se um canal está funcionando:

```bash
# Teste básico de conectividade
curl -X GET 'https://api.camkrolik.com.br/core/v2/api/channel/list' \
  -H 'accept: application/json' \
  -H 'access-token: TOKEN_DO_CANAL'
```

Se retornar dados dos canais, o token está válido e o canal pode ser usado para envio de cartões de ações.
