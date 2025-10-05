# 🚫 Sistema de Restrição de Mensagens - Horário Comercial

## 📋 Visão Geral

O sistema implementa uma restrição inteligente que **bloqueia o envio de mensagens automáticas** fora do horário comercial definido. Esta restrição garante que apenas mensagens oficiais sejam enviadas nos horários apropriados, mantendo a organização e profissionalismo do atendimento.

---

## 🎯 Objetivo da Restrição

- **Respeitar horário comercial** definido pela clínica
- **Evitar mensagens** fora do expediente
- **Garantir organização** no processo de comunicação
- **Melhorar a experiência** do paciente com comunicação profissional

---

## ⏰ Horários de Funcionamento

### 📅 **SEGUNDA A SEXTA-FEIRA**
- **Horário Comercial:** 8h às 18h
- **Bloqueio Especial:** 17h às 18h (apenas mensagem de fim)

### 📅 **SÁBADO**
- **Horário Comercial:** 8h às 12h
- **Bloqueio Especial:** 11h às 12h (apenas mensagem de fim)

### 📅 **DOMINGO**
- **Status:** ❌ **DIA NÃO ÚTIL**
- **Bloqueio:** Total durante todo o dia

---

## ⏰ Funcionamento por Dia da Semana

### 📅 **SEGUNDA-FEIRA**

#### 🌅 **Manhã (8h - 17h)**
- ✅ **Mensagens "aguardando"** funcionam normalmente
- ✅ Pacientes recebem notificações após 30 minutos de espera
- ✅ Sistema monitora e processa todos os pacientes ativamente

#### 🌇 **Tarde (17h - 18h) - PERÍODO DE BLOQUEIO ESPECIAL**
- ❌ **BLOQUEIO TOTAL** para mensagens "aguardando"
- ❌ **BLOQUEIO TOTAL** para mensagem de fim de expediente
- 📝 Pacientes continuam sendo registrados na fila
- 🔇 Sistema fica em "modo silencioso" para preparar o encerramento

#### 🌙 **Fim de Expediente (18h)**
- ✅ **Mensagem oficial de fim de expediente** é enviada
- 📱 Todos os pacientes aguardando recebem a mensagem de encerramento
- 💬 Mensagem: "Devido à grande demanda... será realizado no próximo expediente"

#### 🌙 **Noite (18h - 8h do dia seguinte)**
- ❌ **BLOQUEIO TOTAL** para mensagens (fora do horário comercial)
- 📝 Pacientes são registrados na fila, mas **NÃO recebem mensagens**
- 🔇 Sistema funciona em modo de monitoramento apenas

---

### 📅 **TERÇA-FEIRA**

#### 🌅 **Manhã (8h - 17h)**
- ✅ **Mensagens "aguardando"** funcionam normalmente
- ✅ Pacientes recebem notificações após 30 minutos de espera
- ✅ Sistema monitora e processa todos os pacientes ativamente

#### 🌇 **Tarde (17h - 18h) - PERÍODO DE BLOQUEIO ESPECIAL**
- ❌ **BLOQUEIO TOTAL** para mensagens "aguardando"
- ❌ **BLOQUEIO TOTAL** para mensagem de fim de expediente
- 📝 Pacientes continuam sendo registrados na fila
- 🔇 Sistema fica em "modo silencioso" para preparar o encerramento

#### 🌙 **Fim de Expediente (18h)**
- ✅ **Mensagem oficial de fim de expediente** é enviada
- 📱 Todos os pacientes aguardando recebem a mensagem de encerramento

#### 🌙 **Noite (18h - 8h do dia seguinte)**
- ❌ **BLOQUEIO TOTAL** para mensagens (fora do horário comercial)
- 📝 Pacientes são registrados na fila, mas **NÃO recebem mensagens**

---

### 📅 **QUARTA-FEIRA**

#### 🌅 **Manhã (8h - 17h)**
- ✅ **Mensagens "aguardando"** funcionam normalmente
- ✅ Pacientes recebem notificações após 30 minutos de espera
- ✅ Sistema monitora e processa todos os pacientes ativamente

#### 🌇 **Tarde (17h - 18h) - PERÍODO DE BLOQUEIO ESPECIAL**
- ❌ **BLOQUEIO TOTAL** para mensagens "aguardando"
- ❌ **BLOQUEIO TOTAL** para mensagem de fim de expediente
- 📝 Pacientes continuam sendo registrados na fila
- 🔇 Sistema fica em "modo silencioso" para preparar o encerramento

#### 🌙 **Fim de Expediente (18h)**
- ✅ **Mensagem oficial de fim de expediente** é enviada
- 📱 Todos os pacientes aguardando recebem a mensagem de encerramento

#### 🌙 **Noite (18h - 8h do dia seguinte)**
- ❌ **BLOQUEIO TOTAL** para mensagens (fora do horário comercial)
- 📝 Pacientes são registrados na fila, mas **NÃO recebem mensagens**

---

### 📅 **QUINTA-FEIRA**

#### 🌅 **Manhã (8h - 17h)**
- ✅ **Mensagens "aguardando"** funcionam normalmente
- ✅ Pacientes recebem notificações após 30 minutos de espera
- ✅ Sistema monitora e processa todos os pacientes ativamente

#### 🌇 **Tarde (17h - 18h) - PERÍODO DE BLOQUEIO ESPECIAL**
- ❌ **BLOQUEIO TOTAL** para mensagens "aguardando"
- ❌ **BLOQUEIO TOTAL** para mensagem de fim de expediente
- 📝 Pacientes continuam sendo registrados na fila
- 🔇 Sistema fica em "modo silencioso" para preparar o encerramento

#### 🌙 **Fim de Expediente (18h)**
- ✅ **Mensagem oficial de fim de expediente** é enviada
- 📱 Todos os pacientes aguardando recebem a mensagem de encerramento

#### 🌙 **Noite (18h - 8h do dia seguinte)**
- ❌ **BLOQUEIO TOTAL** para mensagens (fora do horário comercial)
- 📝 Pacientes são registrados na fila, mas **NÃO recebem mensagens**

---

### 📅 **SEXTA-FEIRA**

#### 🌅 **Manhã (8h - 17h)**
- ✅ **Mensagens "aguardando"** funcionam normalmente
- ✅ Pacientes recebem notificações após 30 minutos de espera
- ✅ Sistema monitora e processa todos os pacientes ativamente

#### 🌇 **Tarde (17h - 18h) - PERÍODO DE BLOQUEIO ESPECIAL**
- ❌ **BLOQUEIO TOTAL** para mensagens "aguardando"
- ❌ **BLOQUEIO TOTAL** para mensagem de fim de expediente
- 📝 Pacientes continuam sendo registrados na fila
- 🔇 Sistema fica em "modo silencioso" para preparar o encerramento

#### 🌙 **Fim de Expediente (18h)**
- ✅ **Mensagem oficial de fim de expediente** é enviada
- 📱 Todos os pacientes aguardando recebem a mensagem de encerramento

#### 🌙 **Noite (18h - 8h da segunda-feira seguinte)**
- ❌ **BLOQUEIO TOTAL** para mensagens (fora do horário comercial)
- 📝 Pacientes são registrados na fila, mas **NÃO recebem mensagens**
- 📅 Sistema funciona em modo de monitoramento durante todo o fim de semana

---

### 📅 **SÁBADO - HORÁRIO ESPECIAL**

#### 🌅 **Manhã (8h - 11h)**
- ✅ **Mensagens "aguardando"** funcionam normalmente
- ✅ Pacientes recebem notificações após 30 minutos de espera
- ✅ Sistema monitora e processa todos os pacientes ativamente

#### 🌇 **Tarde (11h - 12h) - PERÍODO DE BLOQUEIO ESPECIAL**
- ❌ **BLOQUEIO TOTAL** para mensagens "aguardando"
- ❌ **BLOQUEIO TOTAL** para mensagem de fim de expediente
- 📝 Pacientes continuam sendo registrados na fila
- 🔇 Sistema fica em "modo silencioso" para preparar o encerramento

#### 🌙 **Fim de Expediente (12h)**
- ✅ **Mensagem oficial de fim de expediente** é enviada
- 📱 Todos os pacientes aguardando recebem a mensagem de encerramento
- 💬 Mensagem: "Devido à grande demanda... será realizado no próximo expediente"

#### 🌙 **Tarde/Noite (12h - 8h da segunda-feira seguinte)**
- ❌ **BLOQUEIO TOTAL** para mensagens (fora do horário comercial)
- 📝 Pacientes são registrados na fila, mas **NÃO recebem mensagens**
- 📅 Sistema funciona em modo de monitoramento durante o fim de semana

---

### 📅 **DOMINGO - BLOQUEIO TOTAL**

#### 🌅 **Manhã (8h - 18h)**
- ❌ **BLOQUEIO TOTAL** para mensagens "aguardando"
- ❌ **BLOQUEIO TOTAL** para mensagem de fim de expediente
- 📝 Pacientes são registrados na fila, mas **NÃO recebem mensagens**
- 🔇 Sistema fica em "modo silencioso" durante todo o domingo

#### 🌙 **Noite (18h - 8h da segunda-feira seguinte)**
- ❌ **BLOQUEIO TOTAL** para mensagens
- 📝 Pacientes são registrados na fila, mas **NÃO recebem mensagens**
- 📅 Sistema funciona em modo de monitoramento apenas

---

## 🎬 Cenários de Exemplo

### 📅 **Cenário 1: Paciente chega às 16h30 (Segunda-feira)**
- ✅ **16h30:** Paciente chega na clínica
- ✅ **17h00:** Paciente completa 30 minutos de espera
- ❌ **17h00:** Sistema **NÃO envia** mensagem "aguardando" (bloqueio ativo)
- ✅ **18h00:** Paciente recebe mensagem de fim de expediente
- 📱 **Resultado:** Paciente recebe apenas a mensagem oficial de fim

### 📅 **Cenário 2: Paciente chega às 17h30 (Terça-feira)**
- ✅ **17h30:** Paciente chega na clínica
- ❌ **18h00:** Paciente completa 30 minutos de espera, mas **NÃO recebe** mensagem
- ✅ **18h00:** Paciente recebe mensagem de fim de expediente
- 📱 **Resultado:** Paciente recebe apenas a mensagem oficial de fim

### 📅 **Cenário 3: Paciente chega às 19h (Quarta-feira)**
- ✅ **19h:** Paciente chega na clínica (fora do horário)
- ✅ **19h30:** Paciente completa 30 minutos de espera
- ❌ **19h30:** Sistema **NÃO ENVIA** mensagem "aguardando" (fora do horário comercial)
- 📱 **Resultado:** Paciente **NÃO recebe** nenhuma mensagem (fora do expediente)

### 📅 **Cenário 4: Paciente chega às 10h30 (Sábado)**
- ✅ **10h30:** Paciente chega na clínica
- ✅ **11h00:** Paciente completa 30 minutos de espera
- ❌ **11h00:** Sistema **NÃO envia** mensagem "aguardando" (bloqueio sábado ativo)
- ✅ **12h00:** Paciente recebe mensagem de fim de expediente
- 📱 **Resultado:** Paciente recebe apenas a mensagem oficial de fim

### 📅 **Cenário 5: Paciente chega às 15h (Domingo)**
- ✅ **15h:** Paciente chega na clínica
- ✅ **15h30:** Paciente completa 30 minutos de espera
- ❌ **15h30:** Sistema **NÃO ENVIA** mensagem "aguardando" (bloqueio total aos domingos)
- 📱 **Resultado:** Paciente **NÃO recebe** nenhuma mensagem (domingo é dia não útil)

### 📅 **Cenário 6: Paciente chega às 13h (Sábado)**
- ✅ **13h:** Paciente chega na clínica (fora do horário comercial de sábado)
- ✅ **13h30:** Paciente completa 30 minutos de espera
- ❌ **13h30:** Sistema **NÃO ENVIA** mensagem "aguardando" (fora do horário comercial)
- 📱 **Resultado:** Paciente **NÃO recebe** nenhuma mensagem (fora do expediente de sábado)

---

## 🎯 Benefícios da Restrição

### 👥 **Para os Pacientes:**
- **Comunicação organizada** respeitando horários comerciais
- **Evita mensagens** em horários inadequados
- **Experiência mais profissional** com comunicação controlada
- **Clareza** sobre o status do atendimento

### 🏥 **Para a Clínica:**
- **Respeita horário comercial** definido
- **Evita mensagens** fora do expediente
- **Controle total** sobre a comunicação
- **Profissionalismo** no atendimento

### 🤖 **Para o Sistema:**
- **Reduz processamento** desnecessário fora do horário
- **Melhora a performance** durante horários não comerciais
- **Facilita manutenção** e monitoramento
- **Garante consistência** no processo

---

## 📊 Resumo da Lógica

| Período | Dias Úteis (Seg-Sex) | Sábado | Domingo |
|---------|---------------------|--------|---------|
| **8h-17h** | ✅ Mensagens normais | ✅ Mensagens normais | ❌ **BLOQUEIO TOTAL** |
| **17h-18h** | ❌ **BLOQUEIO ESPECIAL** | ❌ **BLOQUEIO TOTAL** | ❌ **BLOQUEIO TOTAL** |
| **11h-12h** | ✅ Mensagens normais | ❌ **BLOQUEIO ESPECIAL** | ❌ **BLOQUEIO TOTAL** |
| **18h (Seg-Sex)** | ✅ Fim de expediente | ❌ **BLOQUEIO TOTAL** | ❌ **BLOQUEIO TOTAL** |
| **12h (Sáb)** | ❌ **BLOQUEIO TOTAL** | ✅ Fim de expediente | ❌ **BLOQUEIO TOTAL** |
| **Fora expediente** | ❌ **BLOQUEIO TOTAL** | ❌ **BLOQUEIO TOTAL** | ❌ **BLOQUEIO TOTAL** |

---

## 🔍 Monitoramento

O sistema registra todos os eventos de bloqueio e envio, permitindo:
- **Acompanhamento** de quantos pacientes foram afetados
- **Análise** de padrões de uso
- **Otimização** dos horários conforme necessário
- **Relatórios** detalhados para gestão

---

## 🛠️ Implementação Técnica

### 🔧 **Funções Principais:**

#### `isWorkingDay()`
- Verifica se é dia útil (Segunda a Sábado)
- Retorna `false` para domingos

#### `isBusinessHours()`
- Verifica se está no horário comercial
- Considera horários especiais para sábados
- **Bloqueia domingos** automaticamente

#### `isWaitingMessageBlocked()`
- Verifica bloqueio especial 17h-18h (dias úteis)
- Verifica bloqueio especial 11h-12h (sábados)

#### `canSendEndOfDayMessage()`
- Permite mensagem de fim apenas no horário correto
- Respeita período de bloqueio

---

*Este sistema garante uma experiência profissional e organizada, respeitando rigorosamente os horários comerciais definidos pela clínica.*