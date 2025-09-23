# Lista Completa de Cartões de Ações Disponíveis

Este documento contém todos os cartões de ações (Action Cards) disponíveis na API CAM Krolik e configurados no sistema.

## Endpoint da API

**URL:** `https://api.camkrolik.com.br/core/v2/api/action-cards`  
**Método:** `GET`  
**Headers:** 
```json
{
  "accept": "application/json",
  "access-token": "63e68f168a48875131856df8"
}
```

---

## Cartões de Ações Disponíveis

**Total de cartões encontrados:** 33  
**Status:** Todos ativos ✅

### Lista Completa por ID

| # | ID do Cartão | Status | Descrição |
|---|--------------|--------|-----------|
| 1 | `631f2b4f307d23f46ac80a29` | ✅ Ativo | Cartão de ação disponível |
| 2 | `631f2b4f307d23f46ac80a2b` | ✅ Ativo | Cartão de ação disponível |
| 3 | `631f2b4f307d23f46ac80a27` | ✅ Ativo | Cartão de ação disponível |
| 4 | `631f2b4f307d23f46ac80a0e` | ✅ Ativo | Cartão de ação disponível |
| 5 | `631f2b4f307d23f46ac80a10` | ✅ Ativo | Cartão de ação disponível |
| 6 | `6329cf2f212a3a6c2a931aa9` | ✅ Ativo | Cartão de ação disponível |
| 7 | `633d8fadab671674331b0cde` | ✅ Ativo | Cartão de ação disponível |
| 8 | `6384c3cb8330cda91588c54a` | ✅ Ativo | Cartão de ação disponível |
| 9 | `6389e4a8127e7780362b76e2` | ✅ Ativo | Cartão de ação disponível |
| 10 | `638ddde67473e5a58357bd99` | ✅ Ativo | Cartão de ação disponível |
| 11 | `638de4af4126b988db11bb98` | ✅ Ativo | Cartão de ação disponível |
| 12 | `6398c317d5204b42453a0845` | ✅ Ativo | Cartão de ação disponível |
| 13 | `63a0b72c72104e5f3b4f41ce` | ✅ Ativo | Cartão de ação disponível |
| 14 | `63c9484d4632f8bd1b0a7e1b` | ✅ Ativo | Cartão de ação disponível |
| 15 | `63ce9a8c1f1f8a69f92dace5` | ✅ Ativo | Cartão de ação disponível |
| 16 | `63d01bcc6d3a8b7b0e3ad5b6` | ✅ Ativo | Cartão de ação disponível |
| 17 | `645a7875d55ce634adb04d4f` | ✅ Ativo | Cartão de ação disponível |
| 18 | `646d092cb72de2661ba97355` | ✅ Ativo | Cartão de ação disponível |
| 19 | `6480e3fde2636139265e8673` | ✅ Ativo | Cartão de ação disponível |
| 20 | `6494b35144635270842b43b0` | ✅ Ativo | Cartão de ação disponível |
| 21 | `64d284d36314d63fe3c14cdf` | ✅ Ativo | Cartão de ação disponível |
| 22 | `64fb70b81b1715288736d407` | ✅ Ativo | Cartão de ação disponível |
| 23 | `65720319c1583d37f9614aac` | ✅ Ativo | Cartão de ação disponível |
| 24 | `6572242f6e2f8df731db5e59` | ✅ Ativo | Cartão de ação disponível |
| 25 | `65cfa07c262227749fb036f3` | ✅ Ativo | Cartão de ação disponível |
| 26 | `6683fda4a519b988fc172994` | ✅ Ativo | Cartão de ação disponível |
| 27 | `66bf539fe433742b5844e511` | ✅ Ativo | Cartão de ação disponível |
| 28 | `6709c917c26e6f81dce12b27` | ✅ Ativo | Cartão de ação disponível |
| 29 | `67520e27d70317435aa7135e` | ✅ Ativo | Cartão de ação disponível |
| 30 | `676aab697745217d0a03dc0a` | ✅ Ativo | Cartão de ação disponível |
| 31 | `67922dd8434944ed9326d611` | ✅ Ativo | Cartão de ação disponível |
| 32 | `67a9f81fda3715329024ae88` | ✅ Ativo | Cartão de ação disponível |
| 33 | `68cbfa96b8640e9721e4feab` | ✅ Ativo | Cartão de ação disponível |

---

## Cartões Configurados no Sistema

### Cartões Atualmente em Uso

| Tipo | ID | Descrição | Uso |
|------|----|-----------|-----| 
| **Padrão** | `631f2b4f307d23f46ac80a2b` | Mensagem transferência padrão | Envio geral |
| **30 Minutos** | `68cbfa96b8640e9721e4feab` | Mensagem de 30 Minutos | Pacientes em espera |
| **Fim de Dia** | `631f2b4f307d23f46ac80a2b` | Fim de Expediente | Mensagem 18h |

### Configuração Atual

```json
{
  "selectedActionCard": "631f2b4f307d23f46ac80a2b",
  "selectedActionCard30Min": "68cbfa96b8640e9721e4feab", 
  "selectedActionCardEndDay": "631f2b4f307d23f46ac80a2b"
}
```

---

## Como Usar os Cartões

### 1. Buscar Todos os Cartões

```bash
curl -X GET 'https://api.camkrolik.com.br/core/v2/api/action-cards' \
  -H 'accept: application/json' \
  -H 'access-token: 63e68f168a48875131856df8'
```

### 2. Buscar Cartão Específico

```bash
curl -X GET 'https://api.camkrolik.com.br/core/v2/api/action-cards/631f2b4f307d23f46ac80a2b' \
  -H 'accept: application/json' \
  -H 'access-token: 63e68f168a48875131856df8'
```

### 3. Enviar Cartão de Ação

```bash
curl -X POST 'https://api.camkrolik.com.br/core/v2/api/chats/send-action-card' \
  -H 'accept: application/json' \
  -H 'access-token: TOKEN_DO_CANAL' \
  -H 'Content-Type: application/json-patch+json' \
  -d '{
    "number": "5511999999999",
    "contactId": "contact_123456",
    "action_card_id": "631f2b4f307d23f46ac80a2b",
    "forceSend": true
  }'
```

---

## Estrutura de um Cartão de Ação

### Campos Disponíveis

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID único do cartão |
| `name` | string | Nome do cartão |
| `title` | string | Título do cartão |
| `description` | string | Descrição do cartão |
| `content` | string | Conteúdo/mensagem do cartão |
| `active` | boolean | Status de ativação |
| `type` | string | Tipo do cartão |
| `category` | string | Categoria do cartão |
| `organizationId` | string | ID da organização |
| `isDefault` | boolean | Se é cartão padrão |
| `createdAt` | string | Data de criação |
| `updatedAt` | string | Data de atualização |

### Exemplo de Resposta

```json
{
  "id": "631f2b4f307d23f46ac80a2b",
  "name": "Mensagem de Espera",
  "title": "Aguarde um momento",
  "description": "Mensagem enviada para pacientes em espera",
  "content": "Olá! Estamos verificando sua situação. Aguarde um momento.",
  "active": true,
  "type": "waiting_message",
  "category": "automation",
  "organizationId": "org_123",
  "isDefault": false,
  "createdAt": "2022-09-10T10:00:00.000Z",
  "updatedAt": "2022-09-10T10:00:00.000Z"
}
```

---

## Integração com o Sistema

### Endpoints Internos

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/action-cards/available` | GET | Lista cartões disponíveis |
| `/api/messages/send-action-card` | POST | Envia cartão para pacientes |

### Uso no Frontend

```javascript
// Carregar cartões disponíveis
const response = await fetch('/api/action-cards/available');
const { data: actionCards } = await response.json();

// Exibir no seletor
actionCards.forEach(card => {
  const option = document.createElement('option');
  option.value = card.id;
  option.textContent = card.description || card.name || card.id;
  selectElement.appendChild(option);
});
```

### Uso no Backend

```javascript
// Enviar cartão de ação
const result = await krolikApiClient.sendActionCard({
  number: patient.phone,
  contactId: patient.contactId,
  action_card_id: '631f2b4f307d23f46ac80a2b',
  forceSend: true
});
```

---

## Scripts de Teste

### Testar Listagem de Cartões

```bash
node examples/action-cards-example.js
```

### Testar Envio de Cartão

```bash
node examples/test-send-action-card.js
```

---

## Notas Importantes

1. **Todos os cartões estão ativos** - Não há cartões desabilitados
2. **IDs são únicos** - Cada cartão tem um ID específico
3. **Compatibilidade** - Todos os cartões são compatíveis com a API atual
4. **Configuração dinâmica** - Cartões podem ser alterados via interface web
5. **Fallback** - Sistema tem cartões padrão configurados

---

## Atualização da Lista

Para atualizar esta lista:

1. Execute o script de exemplo:
   ```bash
   node examples/action-cards-example.js
   ```

2. Verifique se há novos cartões na API:
   ```bash
   curl -X GET 'https://api.camkrolik.com.br/core/v2/api/action-cards' \
     -H 'accept: application/json' \
     -H 'access-token: 63e68f168a48875131856df8'
   ```

3. Atualize este documento com os novos IDs encontrados

---

**Última atualização:** $(date)  
**Total de cartões:** 33  
**Status da API:** ✅ Funcionando
