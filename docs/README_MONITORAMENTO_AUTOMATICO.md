# 📚 Documentação do Monitoramento Automático

## 🎯 **Objetivo**
Esta documentação contém todas as informações necessárias para implementar o envio automático de action cards no sistema de monitoramento a cada 60 segundos.

## 📋 **Documentos Disponíveis**

### **1. Implementação Principal**
- **[IMPLEMENTACAO_ENVIO_ACTION_CARDS.md](./IMPLEMENTACAO_ENVIO_ACTION_CARDS.md)**
  - Lógica corrigida de envio de action cards
  - Estrutura dos dados do paciente
  - Função de envio seguindo modelo do curl
  - Critérios de elegibilidade
  - Tratamento de erros

### **2. Configuração do Sistema**
- **[CONFIGURACAO_MONITORAMENTO_AUTOMATICO.md](./CONFIGURACAO_MONITORAMENTO_AUTOMATICO.md)**
  - Configurações necessárias
  - Integração no MonitoringService.ts
  - Critérios de elegibilidade detalhados
  - Logs esperados
  - Configurações de ambiente

### **3. Exemplo Prático**
- **[../examples/automatic-message-sending-example.js](../examples/automatic-message-sending-example.js)**
  - Código de exemplo completo
  - Classe AutomaticMessageSender
  - Métodos de elegibilidade
  - Processamento de pacientes
  - Exemplo de uso

## 🔑 **Pontos Críticos para Implementação**

### **1. Correção do Envio de Action Cards**
```javascript
// ✅ CORRETO - Usar contactId
const payload = {
  number: patient.phone,
  contactId: patient.contactId,  // chat.contact.id
  action_card_id: actionCardId,
  forceSend: true
};

// ❌ INCORRETO - Usar attendanceId
const payload = {
  number: patient.phone,
  contactId: patient.id,  // chat.attendanceId
  action_card_id: actionCardId,
  forceSend: true
};
```

### **2. Headers Obrigatórios**
```javascript
const headers = {
  'accept': 'application/json',
  'access-token': 'SEU_TOKEN_AQUI',
  'Content-Type': 'application/json-patch+json'  // CRÍTICO
};
```

### **3. Estrutura dos Dados**
```javascript
// Dados convertidos corretamente da API CAM Krolik
const patient = {
  id: "68cb4b7fd579f3d3fe9d6a7e",           // AttendanceId
  contactId: "68b1ff1281153b38b7009959",    // ContactId (para envio)
  name: "Felipe",
  phone: "5519995068303",
  sectorId: "64d4db384f04cb80ac059912",
  sectorName: "Suporte Geral",
  waitTimeMinutes: 20,
  status: "waiting"
};
```

## 🚀 **Como Implementar**

### **1. Ler a Documentação**
1. Comece com `IMPLEMENTACAO_ENVIO_ACTION_CARDS.md`
2. Configure conforme `CONFIGURACAO_MONITORAMENTO_AUTOMATICO.md`
3. Use o exemplo em `automatic-message-sending-example.js`

### **2. Integrar no MonitoringService.ts**
```typescript
// Adicionar método principal
async checkWaitingPatients() {
  // 1. Buscar pacientes da API
  // 2. Atualizar JsonPatientManager
  // 3. Processar mensagens de 30 minutos
  // 4. Processar mensagens de fim de dia
}

// Adicionar métodos de processamento
private async process30MinuteMessages(patients) { /* ... */ }
private async processEndOfDayMessages(patients) { /* ... */ }
private async sendActionCardsToPatients(patients, actionCardId, messageType) { /* ... */ }
```

### **3. Configurar Critérios de Elegibilidade**
```typescript
// Mensagem de 30 minutos
private getEligiblePatientsFor30MinMessage(patients) {
  return patients.filter(patient => {
    const waitTimeOk = patient.waitTimeMinutes >= 30;
    const businessHoursOk = this.isWithinBusinessHours();
    const workingDayOk = this.isWorkingDay();
    const sectorNotExcluded = !this.configManager.isAttendanceExcluded(patientKey);
    const notProcessed = !this.jsonPatientManager.isPatientProcessed(patient.id);
    
    return waitTimeOk && businessHoursOk && workingDayOk && 
           sectorNotExcluded && notProcessed;
  });
}
```

## 🧪 **Como Testar**

### **1. Teste de Envio Individual**
```bash
node examples/test-send-action-card.js
```

### **2. Teste de Elegibilidade**
```bash
node examples/automatic-message-sending-example.js
```

### **3. Teste de Integração**
```bash
# Verificar se pacientes são marcados como elegíveis
# Verificar se action cards são enviados corretamente
# Verificar logs de sucesso/falha
```

## 📊 **Logs Esperados**

### **Sucesso**
```
🤖 [AUTOMÁTICO] Enviando action card para Felipe (5519995068303)
📤 Cartão de ação enviado com sucesso para 5519995068303
🤖 [AUTOMÁTICO] Resultado 30min: 1 sucessos, 0 falhas
```

### **Falha**
```
❌ [AUTOMÁTICO] Falha ao enviar para Ana Paula: Request failed with status code 400
📋 Detalhes do erro: { status: 400, data: { ... } }
🤖 [AUTOMÁTICO] Resultado 30min: 0 sucessos, 1 falhas
```

## ⚠️ **Cuidados Importantes**

1. **✅ Usar `contactId` correto** - `chat.contact.id`, não `chat.attendanceId`
2. **✅ Validar payload obrigatório** - `number`, `contactId`, `action_card_id`
3. **✅ Headers corretos** - `Content-Type: application/json-patch+json`
4. **✅ Marcar como processado** - Evitar reenvios
5. **✅ Adicionar à exclusão** - Lista de pacientes já notificados
6. **✅ Logs detalhados** - Para debugging e monitoramento
7. **✅ Tratamento de erros** - Continuar processamento mesmo com falhas

## 📞 **Suporte**

Se encontrar problemas durante a implementação:

1. **Verificar logs** - Procurar por erros 400 ou payload inválido
2. **Validar dados** - Confirmar se `contactId` está correto
3. **Testar individualmente** - Usar `test-send-action-card.js`
4. **Consultar documentação** - Revisar os documentos desta pasta

---

**🎯 Esta documentação deve ser consultada sempre que implementar o envio automático de action cards no sistema de monitoramento.**
