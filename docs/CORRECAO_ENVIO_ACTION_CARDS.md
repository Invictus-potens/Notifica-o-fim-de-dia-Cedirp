# 🔧 Correção do Envio de Action Cards

## 📋 **Problema Identificado**

O envio de cartões de ação estava falhando com erro 400:
```
❌ Erro ao enviar cartão de ação: Request failed with status code 400
📋 Detalhes do erro: {
  "status": "400",
  "msg": "The number 68cb4b7fd579f3d3fe9d6a7e is invalid, check the problem INVALID_WA_NUMBER",
  "errorCode": "num_04"
}
```

## 🔍 **Causa do Problema**

1. **Payload não seguia o modelo do curl** - A função `sendActionCard` não estava usando os headers corretos
2. **Mapeamento incorreto de IDs** - O `contactId` estava sendo confundido com `attendanceId`

### **Estrutura dos Dados da API CAM Krolik:**
```json
{
  "attendanceId": "68cb4b7fd579f3d3fe9d6a7e",  // ID do atendimento
  "contact": {
    "id": "68b1ff1281153b38b7009959",          // ID do contato (para envio)
    "number": "5519995068303"                  // Número de telefone
  }
}
```

## ✅ **Soluções Implementadas**

### **1. Correção da Função `sendActionCard`**

**Problema**: Headers e validação incorretos.

**Solução**: Atualizada para seguir exatamente o modelo do curl:

```javascript
async sendActionCard(payload) {
  try {
    // Validar payload obrigatório
    if (!payload.number || !payload.contactId || !payload.action_card_id) {
      throw new Error('Payload incompleto: number, contactId e action_card_id são obrigatórios');
    }

    // Preparar payload seguindo exatamente o modelo do curl
    const requestPayload = {
      number: payload.number,
      contactId: payload.contactId,
      action_card_id: payload.action_card_id,
      forceSend: payload.forceSend !== undefined ? payload.forceSend : true
    };

    const response = await this.axiosInstance.post('/core/v2/api/chats/send-action-card', requestPayload, {
      headers: {
        'accept': 'application/json',
        'access-token': this.token,
        'Content-Type': 'application/json-patch+json'
      }
    });

    return response.data;
  } catch (error) {
    // Log detalhado do erro
    console.error(`❌ Erro ao enviar cartão de ação para ${payload.number}:`, error.message);
    if (error.response) {
      console.error('📋 Detalhes do erro:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw error;
  }
}
```

### **2. Correção do Mapeamento de IDs**

**Problema**: A função `convertChatToWaitingPatient` não estava mapeando o `contactId` corretamente.

**Solução**: Adicionado campo `contactId` separado:

```javascript
// ANTES
return {
  id: chat.attendanceId,  // ❌ Confundindo IDs
  name: chat.contact?.name || chat.description || 'Nome não informado',
  phone: chat.contact?.number || '',
  // ... outros campos
};

// DEPOIS
return {
  id: chat.attendanceId,           // ✅ ID do atendimento
  contactId: chat.contact?.id || '', // ✅ ID do contato (para envio)
  name: chat.contact?.name || chat.description || 'Nome não informado',
  phone: chat.contact?.number || '',
  // ... outros campos
};
```

### **3. Correção do Frontend**

**Problema**: O frontend estava usando `patient.id` como `contactId`.

**Solução**: Atualizado para usar `patient.contactId`:

```javascript
// ANTES
data-contact-id="${patient.id}"

// DEPOIS
data-contact-id="${patient.contactId || patient.id}"
```

## 📊 **Resultado das Correções**

### **Antes (Erro 400):**
```json
{
  "status": "400",
  "msg": "The number 68cb4b7fd579f3d3fe9d6a7e is invalid, check the problem INVALID_WA_NUMBER",
  "errorCode": "num_04"
}
```

### **Depois (Sucesso 202):**
```json
{
  "status": "202",
  "msg": "Successfully added to the transmission queue",
  "currentChatId": "68cb4b7fd579f3d3fe9d6a7e",
  "messageSentId": ""
}
```

## 🧪 **Testes Realizados**

### **1. Teste de Envio de Action Card**
```bash
node examples/test-send-action-card.js
```

**Resultado:**
```
📤 Enviando action card para 5519995068303: {
  number: '5519995068303',
  contactId: '68b1ff1281153b38b7009959',
  action_card_id: '631f2b4f307d23f46ac80a10',
  forceSend: true
}
📤 Cartão de ação enviado com sucesso para 5519995068303
✅ Action card enviado com sucesso!
📋 Resposta da API:
{
  "status": "202",
  "msg": "Successfully added to the transmission queue",
  "currentChatId": "68cb4b7fd579f3d3fe9d6a7e",
  "messageSentId": ""
}
```

### **2. Validação dos Dados**
```bash
node -e "const {KrolikApiClient} = require('./src/services/KrolikApiClient'); const client = new KrolikApiClient({baseURL: 'https://api.camkrolik.com.br', token: '63e68f168a48875131856df8'}); client.listWaitingAttendances().then(p => console.log('Primeiro paciente:', JSON.stringify(p[0], null, 2))).catch(console.error);"
```

**Resultado:**
```json
{
  "id": "68cb4b7fd579f3d3fe9d6a7e",           // AttendanceId
  "contactId": "68b1ff1281153b38b7009959",    // ContactId (correto)
  "name": "Felipe",
  "phone": "5519995068303",
  "sectorName": "Suporte Geral",
  "waitTimeMinutes": 20,
  "status": "waiting"
}
```

## 🎯 **Funcionalidades Corrigidas**

### **1. Envio de Action Cards**
- ✅ **Payload**: Segue exatamente o modelo do curl fornecido
- ✅ **Headers**: Usa `Content-Type: application/json-patch+json`
- ✅ **Validação**: Verifica campos obrigatórios
- ✅ **Logs**: Detalhes completos de erros

### **2. Mapeamento de IDs**
- ✅ **AttendanceId**: ID do atendimento (`chat.attendanceId`)
- ✅ **ContactId**: ID do contato (`chat.contact.id`)
- ✅ **Phone**: Número de telefone (`chat.contact.number`)

### **3. Frontend**
- ✅ **Seleção**: Usa `contactId` correto para envio
- ✅ **Exibição**: Mostra ambos os IDs quando necessário
- ✅ **Compatibilidade**: Fallback para `patient.id` se necessário

## 📝 **Arquivos Modificados**

- ✅ **`src/services/KrolikApiClient.js`** - Função `sendActionCard` corrigida
- ✅ **`public/app.js`** - Frontend atualizado para usar `contactId` correto
- ✅ **`examples/test-send-action-card.js`** - Teste de envio criado

## 🚀 **Como Testar**

### **1. Testar via Script**
```bash
node examples/test-send-action-card.js
```

### **2. Testar via Interface Web**
```bash
# Acessar interface
http://localhost:3000

# Navegar para "Atendimentos"
# 1. Selecionar pacientes
# 2. Escolher action card
# 3. Clicar em "Enviar Mensagem"
# 4. Verificar se não há mais erros 400
```

### **3. Verificar Logs do Servidor**
```bash
# Logs de sucesso devem aparecer:
📤 Cartão de ação enviado com sucesso para [número]
📊 API: Resultado real - X sucessos, 0 falhas
```

## ✨ **Benefícios das Correções**

- ✅ **Envio Funcional**: Action cards são enviados com sucesso
- ✅ **Conformidade**: Segue exatamente o modelo do curl fornecido
- ✅ **Precisão**: Usa IDs corretos para cada finalidade
- ✅ **Robustez**: Validação e logs detalhados
- ✅ **Usabilidade**: Interface funcional para envio de mensagens

---

**🎉 Problema resolvido com sucesso!**

O envio de cartões de ação agora funciona perfeitamente, seguindo o modelo do curl fornecido e usando os IDs corretos da API CAM Krolik.
