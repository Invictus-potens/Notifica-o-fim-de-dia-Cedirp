# 📋 Implementação de Envio de Action Cards - Referência para Monitoramento Automático

## 🎯 **Objetivo**
Este documento serve como referência para implementar o envio automático de action cards no sistema de monitoramento a cada 60 segundos, usando a mesma lógica do envio individual que foi corrigida.

## ✅ **Lógica de Envio Corrigida**

### **1. Estrutura dos Dados do Paciente**
```javascript
// Dados convertidos da API CAM Krolik
const patient = {
  id: "68cb4b7fd579f3d3fe9d6a7e",           // ID do atendimento
  contactId: "68b1ff1281153b38b7009959",    // ID do contato (OBRIGATÓRIO para envio)
  name: "Felipe",
  phone: "5519995068303",                   // Número de telefone (OBRIGATÓRIO para envio)
  sectorId: "64d4db384f04cb80ac059912",
  sectorName: "Suporte Geral",
  channelId: "63e68f168a48875131856df8",
  channelType: "WhatsApp Business (Principal)",
  waitStartTime: "2025-09-17T23:59:59.244Z",
  waitTimeMinutes: 20,
  status: "waiting"
};
```

### **2. Função de Envio de Action Card**
```javascript
/**
 * Envia cartão de ação seguindo o modelo do curl da API CAM Krolik
 * @param {Object} payload - Dados do envio
 * @param {string} payload.number - Número de telefone do paciente
 * @param {string} payload.contactId - ID do contato (NÃO o attendanceId)
 * @param {string} payload.action_card_id - ID do action card
 * @param {boolean} payload.forceSend - Forçar envio (padrão: true)
 * @returns {Promise<Object>} Resposta da API
 */
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

    console.log(`📤 Enviando action card para ${payload.number}:`, requestPayload);

    const response = await this.axiosInstance.post('/core/v2/api/chats/send-action-card', requestPayload, {
      headers: {
        'accept': 'application/json',
        'access-token': this.token,
        'Content-Type': 'application/json-patch+json'
      }
    });

    console.log(`📤 Cartão de ação enviado com sucesso para ${payload.number}`);
    return response.data;
  } catch (error) {
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

### **3. Payload Correto para API CAM Krolik**
```javascript
// Modelo do curl que deve ser seguido:
const payload = {
  number: "5519995068303",                    // Número de telefone do paciente
  contactId: "68b1ff1281153b38b7009959",     // ID do contato (chat.contact.id)
  action_card_id: "631f2b4f307d23f46ac80a2b", // ID do action card
  forceSend: true                             // Forçar envio
};

// Headers obrigatórios:
const headers = {
  'accept': 'application/json',
  'access-token': 'SEU_TOKEN_AQUI',
  'Content-Type': 'application/json-patch+json'
};
```

## 🔄 **Resposta de Sucesso da API**
```json
{
  "status": "202",
  "msg": "Successfully added to the transmission queue",
  "currentChatId": "68cb4b7fd579f3d3fe9d6a7e",
  "messageSentId": ""
}
```

## 🚨 **Erros Comuns e Soluções**

### **Erro 400 - Número Inválido**
```json
{
  "status": "400",
  "msg": "The number 68cb4b7fd579f3d3fe9d6a7e is invalid, check the problem INVALID_WA_NUMBER",
  "errorCode": "num_04"
}
```
**Causa**: Usar `attendanceId` como `contactId`
**Solução**: Usar `chat.contact.id` como `contactId`

### **Erro 400 - Payload Incompleto**
```json
{
  "status": "400",
  "msg": "Missing required fields"
}
```
**Causa**: Campos obrigatórios ausentes
**Solução**: Validar `number`, `contactId` e `action_card_id`

## 🎯 **Implementação no Monitoramento Automático**

### **1. Critérios de Elegibilidade**
```javascript
// Pacientes elegíveis para mensagem de 30 minutos
function getEligiblePatientsFor30MinMessage(patients, configManager) {
  return patients.filter(patient => {
    // Critério: 30 minutos ou mais de espera
    const waitTimeOk = patient.waitTimeMinutes >= 30;
    
    // Critério: Dentro do horário comercial
    const businessHoursOk = isWithinBusinessHours();
    
    // Critério: Dia útil
    const workingDayOk = isWorkingDay();
    
    // Critério: Setor não excluído
    const sectorNotExcluded = !configManager.isAttendanceExcluded(
      `${patient.name}_${patient.phone}_${patient.sectorId}`
    );
    
    // Critério: Paciente não processado anteriormente
    const notProcessed = !jsonPatientManager.isPatientProcessed(patient.id);
    
    return waitTimeOk && businessHoursOk && workingDayOk && 
           sectorNotExcluded && notProcessed;
  });
}
```

### **2. Processamento de Pacientes Elegíveis**
```javascript
async function processEligiblePatients(eligiblePatients, actionCardId) {
  const results = [];
  let successCount = 0;
  let failedCount = 0;

  for (const patient of eligiblePatients) {
    try {
      // Preparar payload seguindo a lógica corrigida
      const payload = {
        number: patient.phone,           // Número de telefone
        contactId: patient.contactId,    // ID do contato (NÃO attendanceId)
        action_card_id: actionCardId,    // ID do action card configurado
        forceSend: true
      };

      console.log(`🤖 [AUTOMÁTICO] Enviando action card para ${patient.name} (${patient.phone})`);

      // Enviar via API CAM Krolik
      const response = await krolikApiClient.sendActionCard(payload);
      
      // Marcar como processado
      await jsonPatientManager.markPatientAsProcessed(patient.id);
      
      // Adicionar à lista de exclusão para evitar reenvios
      configManager.addAttendanceExclusion(
        `${patient.name}_${patient.phone}_${patient.sectorId}`
      );

      results.push({
        patientId: patient.id,
        patientName: patient.name,
        phone: patient.phone,
        success: true,
        message: 'Enviado automaticamente',
        response: response
      });
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ [AUTOMÁTICO] Falha ao enviar para ${patient.name}:`, error.message);
      
      results.push({
        patientId: patient.id,
        patientName: patient.name,
        phone: patient.phone,
        success: false,
        error: error.message
      });
      
      failedCount++;
    }
  }

  // Log do resultado
  console.log(`🤖 [AUTOMÁTICO] Resultado: ${successCount} sucessos, ${failedCount} falhas`);
  
  return {
    success: successCount,
    failed: failedCount,
    results: results
  };
}
```

### **3. Integração no Ciclo de Monitoramento**
```javascript
// No MonitoringService.ts - método checkWaitingPatients()
async function checkWaitingPatients() {
  try {
    // 1. Buscar pacientes da API CAM Krolik
    const currentPatients = await krolikClient.listWaitingAttendances();
    
    // 2. Atualizar dados no JsonPatientManager
    await jsonPatientManager.updateActivePatients(currentPatients);
    
    // 3. Verificar pacientes elegíveis para mensagem de 30 minutos
    const eligibleFor30Min = getEligiblePatientsFor30MinMessage(
      currentPatients, 
      configManager
    );
    
    // 4. Enviar mensagens se houver pacientes elegíveis
    if (eligibleFor30Min.length > 0) {
      const actionCardId = configManager.getSelectedActionCard30Min();
      
      if (actionCardId) {
        console.log(`🤖 [AUTOMÁTICO] Encontrados ${eligibleFor30Min.length} pacientes elegíveis para mensagem de 30 minutos`);
        
        const result = await processEligiblePatients(eligibleFor30Min, actionCardId);
        
        // Registrar métricas
        metricsService.recordAutomaticMessageSent(result.success, result.failed);
      } else {
        console.log(`⚠️ [AUTOMÁTICO] Nenhum action card de 30 minutos configurado`);
      }
    }
    
    return currentPatients;
    
  } catch (error) {
    console.error('❌ Erro no ciclo de monitoramento:', error);
    throw error;
  }
}
```

## 📊 **Mapeamento de Setores**
```javascript
// Função para mapear IDs de setores para nomes
function getSectorName(sectorId) {
  const sectorMap = {
    '64d4db384f04cb80ac059912': 'Suporte Geral',
    '631f7d27307d23f46af88983': 'Administrativo/Financeiro',
    '6400efb5343817d4ddbb2a4c': 'Suporte CAM',
    '6401f4f49b1ff8512b525e9c': 'Suporte Telefonia'
  };
  
  return sectorMap[sectorId] || `Setor ${sectorId}`;
}
```

## 🔧 **Configurações Necessárias**

### **1. Action Cards Configurados**
- ✅ Action card para mensagem de 30 minutos
- ✅ Action card para mensagem de fim de dia (18h)
- ✅ Action cards devem ter IDs válidos da API CAM Krolik

### **2. Lista de Exclusões**
- ✅ Setores excluídos por ID
- ✅ Canais excluídos por ID
- ✅ Pacientes individuais (nome + telefone + setor)

### **3. Horários de Funcionamento**
- ✅ Horário comercial configurado
- ✅ Dias úteis configurados
- ✅ Timezone Brasília

## 🧪 **Testes de Validação**

### **1. Teste de Envio Individual**
```bash
node examples/test-send-action-card.js
```

### **2. Teste de Elegibilidade**
```javascript
// Verificar se pacientes são marcados como elegíveis corretamente
const patients = await krolikClient.listWaitingAttendances();
const eligible = getEligiblePatientsFor30MinMessage(patients, configManager);
console.log(`Pacientes elegíveis: ${eligible.length}`);
```

### **3. Teste de Processamento**
```javascript
// Testar envio automático sem marcar como processado
const result = await processEligiblePatients(testPatients, actionCardId);
console.log(`Resultado: ${result.success} sucessos, ${result.failed} falhas`);
```

## 📝 **Logs Importantes**

### **Sucesso**
```
🤖 [AUTOMÁTICO] Enviando action card para Felipe (5519995068303)
📤 Cartão de ação enviado com sucesso para 5519995068303
🤖 [AUTOMÁTICO] Resultado: 1 sucessos, 0 falhas
```

### **Falha**
```
❌ [AUTOMÁTICO] Falha ao enviar para Ana Paula: Request failed with status code 400
📋 Detalhes do erro: { status: 400, data: { ... } }
🤖 [AUTOMÁTICO] Resultado: 0 sucessos, 1 falhas
```

## 🎯 **Pontos Críticos para Implementação**

1. **✅ Usar `contactId` correto** - `chat.contact.id`, não `chat.attendanceId`
2. **✅ Validar payload obrigatório** - `number`, `contactId`, `action_card_id`
3. **✅ Headers corretos** - `Content-Type: application/json-patch+json`
4. **✅ Marcar como processado** - Evitar reenvios
5. **✅ Adicionar à exclusão** - Lista de pacientes já notificados
6. **✅ Logs detalhados** - Para debugging e monitoramento
7. **✅ Tratamento de erros** - Continuar processamento mesmo com falhas

---

**📋 Este documento deve ser consultado sempre que implementar o envio automático de action cards no sistema de monitoramento a cada 60 segundos.**
