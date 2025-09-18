# ⚙️ Configuração do Monitoramento Automático

## 📋 **Configurações Necessárias**

### **1. Action Cards Obrigatórios**
```json
{
  "selectedActionCard30Min": "631f2b4f307d23f46ac80a2b",
  "selectedActionCardEndDay": "631f2b4f307d23f46ac80a2b"
}
```

### **2. Lista de Exclusões**
```json
{
  "excludedSectors": [
    "64d4db384f04cb80ac059912",  // Suporte Geral
    "631f7d27307d23f46af88983"   // Administrativo/Financeiro
  ],
  "excludedChannels": [
    "63e68f168a48875131856df8"   // Canal Principal
  ]
}
```

### **3. Horários de Funcionamento**
```javascript
// Configurações de horário comercial
const BUSINESS_HOURS = {
  start: 8,    // 08:00
  end: 18,     // 18:00
  timezone: 'America/Sao_Paulo'
};

// Configurações de dias úteis
const WORKING_DAYS = [1, 2, 3, 4, 5]; // Segunda a sexta

// Configuração de mensagem de fim de dia
const END_OF_DAY_TIME = {
  hour: 18,
  minute: 0
};
```

## 🔄 **Integração no MonitoringService.ts**

### **1. Método Principal**
```typescript
async checkWaitingPatients() {
  try {
    // 1. Buscar pacientes da API CAM Krolik
    const currentPatients = await this.krolikClient.listWaitingAttendances();
    
    // 2. Atualizar dados no JsonPatientManager
    await this.jsonPatientManager.updateActivePatients(currentPatients);
    
    // 3. Verificar e processar mensagens de 30 minutos
    await this.process30MinuteMessages(currentPatients);
    
    // 4. Verificar e processar mensagens de fim de dia
    await this.processEndOfDayMessages(currentPatients);
    
    return currentPatients;
    
  } catch (error) {
    console.error('❌ Erro no ciclo de monitoramento:', error);
    throw error;
  }
}
```

### **2. Processamento de Mensagens de 30 Minutos**
```typescript
private async process30MinuteMessages(patients: WaitingPatient[]) {
  // Verificar se está dentro do horário comercial
  if (!this.isWithinBusinessHours()) {
    console.log('🕐 Fora do horário comercial - pulando mensagens de 30 minutos');
    return;
  }
  
  // Verificar se é dia útil
  if (!this.isWorkingDay()) {
    console.log('📅 Não é dia útil - pulando mensagens de 30 minutos');
    return;
  }
  
  // Buscar pacientes elegíveis
  const eligiblePatients = this.getEligiblePatientsFor30MinMessage(patients);
  
  if (eligiblePatients.length === 0) {
    console.log('👥 Nenhum paciente elegível para mensagem de 30 minutos');
    return;
  }
  
  // Obter action card configurado
  const actionCardId = this.configManager.getSelectedActionCard30Min();
  if (!actionCardId) {
    console.log('⚠️ Nenhum action card de 30 minutos configurado');
    return;
  }
  
  console.log(`🤖 [AUTOMÁTICO] Enviando mensagem de 30 minutos para ${eligiblePatients.length} pacientes`);
  
  // Processar envios
  const result = await this.sendActionCardsToPatients(eligiblePatients, actionCardId, '30min');
  
  // Registrar métricas
  this.metricsService.recordAutomaticMessageSent(result.success, result.failed, '30min');
}
```

### **3. Processamento de Mensagens de Fim de Dia**
```typescript
private async processEndOfDayMessages(patients: WaitingPatient[]) {
  // Verificar se é hora da mensagem de fim de dia (18h)
  if (!this.isEndOfDayTime()) {
    return;
  }
  
  // Buscar pacientes elegíveis
  const eligiblePatients = this.getEligiblePatientsForEndOfDayMessage(patients);
  
  if (eligiblePatients.length === 0) {
    console.log('👥 Nenhum paciente elegível para mensagem de fim de dia');
    return;
  }
  
  // Obter action card configurado
  const actionCardId = this.configManager.getSelectedActionCardEndDay();
  if (!actionCardId) {
    console.log('⚠️ Nenhum action card de fim de dia configurado');
    return;
  }
  
  console.log(`🤖 [AUTOMÁTICO] Enviando mensagem de fim de dia para ${eligiblePatients.length} pacientes`);
  
  // Processar envios
  const result = await this.sendActionCardsToPatients(eligiblePatients, actionCardId, 'endday');
  
  // Registrar métricas
  this.metricsService.recordAutomaticMessageSent(result.success, result.failed, 'endday');
  
  // Limpar dados diários após mensagem de fim de dia
  await this.jsonPatientManager.clearAllFiles();
}
```

### **4. Envio de Action Cards**
```typescript
private async sendActionCardsToPatients(patients: WaitingPatient[], actionCardId: string, messageType: string) {
  const results = [];
  let successCount = 0;
  let failedCount = 0;

  for (const patient of patients) {
    try {
      // Preparar payload seguindo a lógica corrigida
      const payload = {
        number: patient.phone,
        contactId: patient.contactId,  // NÃO patient.id (attendanceId)
        action_card_id: actionCardId,
        forceSend: true
      };

      console.log(`📤 [AUTOMÁTICO] Enviando action card para ${patient.name} (${patient.phone})`);

      // Enviar via API CAM Krolik
      const response = await this.krolikClient.sendActionCard(payload);
      
      // Marcar como processado (apenas para mensagem de 30 minutos)
      if (messageType === '30min') {
        await this.jsonPatientManager.markPatientAsProcessed(patient.id);
        
        // Adicionar à lista de exclusão
        const patientKey = `${patient.name}_${patient.phone}_${patient.sectorId}`;
        this.configManager.addAttendanceExclusion(patientKey);
      }

      results.push({
        patientId: patient.id,
        patientName: patient.name,
        phone: patient.phone,
        success: true,
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

  console.log(`🤖 [AUTOMÁTICO] Resultado ${messageType}: ${successCount} sucessos, ${failedCount} falhas`);
  
  return {
    success: successCount,
    failed: failedCount,
    results: results
  };
}
```

## 🎯 **Critérios de Elegibilidade**

### **Mensagem de 30 Minutos**
```typescript
private getEligiblePatientsFor30MinMessage(patients: WaitingPatient[]): WaitingPatient[] {
  return patients.filter(patient => {
    // Critério: 30 minutos ou mais de espera
    const waitTimeOk = patient.waitTimeMinutes >= 30;
    
    // Critério: Setor não excluído
    const patientKey = `${patient.name}_${patient.phone}_${patient.sectorId}`;
    const sectorNotExcluded = !this.configManager.isAttendanceExcluded(patientKey);
    
    // Critério: Paciente não processado anteriormente
    const notProcessed = !this.jsonPatientManager.isPatientProcessed(patient.id);
    
    return waitTimeOk && sectorNotExcluded && notProcessed;
  });
}
```

### **Mensagem de Fim de Dia**
```typescript
private getEligiblePatientsForEndOfDayMessage(patients: WaitingPatient[]): WaitingPatient[] {
  return patients.filter(patient => {
    // Critério: Qualquer paciente em espera
    const isWaiting = patient.status === 'waiting';
    
    // Critério: Setor não excluído
    const patientKey = `${patient.name}_${patient.phone}_${patient.sectorId}`;
    const sectorNotExcluded = !this.configManager.isAttendanceExcluded(patientKey);
    
    return isWaiting && sectorNotExcluded;
  });
}
```

## 📊 **Logs Esperados**

### **Sucesso**
```
🔄 [AUTOMÁTICO] Iniciando ciclo de monitoramento...
📊 [AUTOMÁTICO] Encontrados 7 pacientes aguardando
🤖 [AUTOMÁTICO] Enviando mensagem de 30 minutos para 2 pacientes
📤 [AUTOMÁTICO] Enviando action card para Felipe (5519995068303)
📤 Cartão de ação enviado com sucesso para 5519995068303
📤 [AUTOMÁTICO] Enviando action card para Ana Paula (5516991025029)
📤 Cartão de ação enviado com sucesso para 5516991025029
🤖 [AUTOMÁTICO] Resultado 30min: 2 sucessos, 0 falhas
```

### **Falha**
```
❌ [AUTOMÁTICO] Falha ao enviar para Jorge Coqueiro: Request failed with status code 400
📋 Detalhes do erro: { status: 400, data: { ... } }
🤖 [AUTOMÁTICO] Resultado 30min: 1 sucessos, 1 falhas
```

### **Sem Pacientes Elegíveis**
```
👥 Nenhum paciente elegível para mensagem de 30 minutos
🕐 Fora do horário comercial - pulando mensagens de 30 minutos
📅 Não é dia útil - pulando mensagens de 30 minutos
```

## 🔧 **Configurações de Ambiente**

### **Variáveis de Ambiente**
```bash
# API CAM Krolik
KROLIK_API_BASE_URL=https://api.camkrolik.com.br
KROLIK_API_TOKEN=63e68f168a48875131856df8

# Configurações de monitoramento
MONITORING_INTERVAL=60000  # 60 segundos
BUSINESS_START_HOUR=8
BUSINESS_END_HOUR=18
END_OF_DAY_HOUR=18
END_OF_DAY_MINUTE=0
```

### **Configurações do Sistema**
```json
{
  "monitoring": {
    "interval": 60000,
    "businessHours": {
      "start": 8,
      "end": 18,
      "timezone": "America/Sao_Paulo"
    },
    "endOfDay": {
      "hour": 18,
      "minute": 0
    },
    "workingDays": [1, 2, 3, 4, 5]
  }
}
```

---

**📋 Use este documento como referência para configurar o monitoramento automático no sistema.**
