# 🚫 Sistema de Restrição de Mensagens - 17h às 18h

## 📋 Visão Geral

O sistema implementa uma restrição inteligente que **bloqueia o envio de mensagens automáticas "aguardando"** durante o período de **17h às 18h** em dias úteis. Esta restrição foi criada para preparar o ambiente para o fim do expediente, garantindo que apenas a mensagem oficial de fim de expediente seja enviada no horário correto.

---

## 🎯 Objetivo da Restrição

- **Preparar o ambiente** para o fim do expediente
- **Evitar conflitos** entre mensagens automáticas e mensagem oficial de fim
- **Garantir ordem** no processo de encerramento do atendimento
- **Melhorar a experiência** do paciente com comunicação organizada

---

## ⏰ Funcionamento por Dia da Semana

### 📅 **SEGUNDA-FEIRA**

#### 🌅 **Manhã (8h - 17h)**
- ✅ **Mensagens "aguardando"** funcionam normalmente
- ✅ Pacientes recebem notificações após 30 minutos de espera
- ✅ Sistema monitora e processa todos os pacientes ativamente

#### 🌇 **Tarde (17h - 18h) - PERÍODO DE BLOQUEIO**
- ❌ **BLOQUEIO TOTAL** para mensagens "aguardando"
- ❌ **BLOQUEIO TOTAL** para mensagem de fim de expediente
- 📝 Pacientes continuam sendo registrados na fila
- 🔇 Sistema fica em "modo silencioso" para preparar o encerramento

#### 🌙 **Fim de Expediente (18h)**
- ✅ **Mensagem oficial de fim de expediente** é enviada
- 📱 Todos os pacientes aguardando recebem a mensagem de encerramento
- 💬 Mensagem: "Devido à grande demanda... será realizado no próximo expediente"

#### 🌙 **Noite (18h - 8h do dia seguinte)**
- ✅ **Mensagens "aguardando"** voltam a funcionar normalmente
- ✅ Pacientes que chegam fora do horário recebem notificações
- 🌙 Sistema funciona normalmente durante toda a noite

---

### 📅 **TERÇA-FEIRA**

#### 🌅 **Manhã (8h - 17h)**
- ✅ **Mensagens "aguardando"** funcionam normalmente
- ✅ Pacientes recebem notificações após 30 minutos de espera
- ✅ Sistema monitora e processa todos os pacientes ativamente

#### 🌇 **Tarde (17h - 18h) - PERÍODO DE BLOQUEIO**
- ❌ **BLOQUEIO TOTAL** para mensagens "aguardando"
- ❌ **BLOQUEIO TOTAL** para mensagem de fim de expediente
- 📝 Pacientes continuam sendo registrados na fila
- 🔇 Sistema fica em "modo silencioso" para preparar o encerramento

#### 🌙 **Fim de Expediente (18h)**
- ✅ **Mensagem oficial de fim de expediente** é enviada
- 📱 Todos os pacientes aguardando recebem a mensagem de encerramento

#### 🌙 **Noite (18h - 8h do dia seguinte)**
- ✅ **Mensagens "aguardando"** voltam a funcionar normalmente
- ✅ Pacientes que chegam fora do horário recebem notificações

---

### 📅 **QUARTA-FEIRA**

#### 🌅 **Manhã (8h - 17h)**
- ✅ **Mensagens "aguardando"** funcionam normalmente
- ✅ Pacientes recebem notificações após 30 minutos de espera
- ✅ Sistema monitora e processa todos os pacientes ativamente

#### 🌇 **Tarde (17h - 18h) - PERÍODO DE BLOQUEIO**
- ❌ **BLOQUEIO TOTAL** para mensagens "aguardando"
- ❌ **BLOQUEIO TOTAL** para mensagem de fim de expediente
- 📝 Pacientes continuam sendo registrados na fila
- 🔇 Sistema fica em "modo silencioso" para preparar o encerramento

#### 🌙 **Fim de Expediente (18h)**
- ✅ **Mensagem oficial de fim de expediente** é enviada
- 📱 Todos os pacientes aguardando recebem a mensagem de encerramento

#### 🌙 **Noite (18h - 8h do dia seguinte)**
- ✅ **Mensagens "aguardando"** voltam a funcionar normalmente
- ✅ Pacientes que chegam fora do horário recebem notificações

---

### 📅 **QUINTA-FEIRA**

#### 🌅 **Manhã (8h - 17h)**
- ✅ **Mensagens "aguardando"** funcionam normalmente
- ✅ Pacientes recebem notificações após 30 minutos de espera
- ✅ Sistema monitora e processa todos os pacientes ativamente

#### 🌇 **Tarde (17h - 18h) - PERÍODO DE BLOQUEIO**
- ❌ **BLOQUEIO TOTAL** para mensagens "aguardando"
- ❌ **BLOQUEIO TOTAL** para mensagem de fim de expediente
- 📝 Pacientes continuam sendo registrados na fila
- 🔇 Sistema fica em "modo silencioso" para preparar o encerramento

#### 🌙 **Fim de Expediente (18h)**
- ✅ **Mensagem oficial de fim de expediente** é enviada
- 📱 Todos os pacientes aguardando recebem a mensagem de encerramento

#### 🌙 **Noite (18h - 8h do dia seguinte)**
- ✅ **Mensagens "aguardando"** voltam a funcionar normalmente
- ✅ Pacientes que chegam fora do horário recebem notificações

---

### 📅 **SEXTA-FEIRA**

#### 🌅 **Manhã (8h - 17h)**
- ✅ **Mensagens "aguardando"** funcionam normalmente
- ✅ Pacientes recebem notificações após 30 minutos de espera
- ✅ Sistema monitora e processa todos os pacientes ativamente

#### 🌇 **Tarde (17h - 18h) - PERÍODO DE BLOQUEIO**
- ❌ **BLOQUEIO TOTAL** para mensagens "aguardando"
- ❌ **BLOQUEIO TOTAL** para mensagem de fim de expediente
- 📝 Pacientes continuam sendo registrados na fila
- 🔇 Sistema fica em "modo silencioso" para preparar o encerramento

#### 🌙 **Fim de Expediente (18h)**
- ✅ **Mensagem oficial de fim de expediente** é enviada
- 📱 Todos os pacientes aguardando recebem a mensagem de encerramento

#### 🌙 **Noite (18h - 8h da segunda-feira seguinte)**
- ✅ **Mensagens "aguardando"** voltam a funcionar normalmente
- ✅ Pacientes que chegam fora do horário recebem notificações
- 📅 Sistema funciona normalmente durante todo o fim de semana

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
- ✅ **Mensagens "aguardando"** voltam a funcionar normalmente
- ✅ Pacientes que chegam fora do horário recebem notificações
- 📅 Sistema funciona normalmente durante todo o fim de semana

---

### 📅 **DOMINGO - SEM RESTRIÇÕES**

#### 🌅 **Manhã (8h - 18h)**
- ✅ **Mensagens "aguardando"** funcionam normalmente
- ✅ Pacientes recebem notificações após 30 minutos de espera
- ✅ Sistema monitora e processa todos os pacientes ativamente
- 🚫 **NÃO HÁ** período de bloqueio aos domingos

#### 🌙 **Noite (18h - 8h da segunda-feira seguinte)**
- ✅ **Mensagens "aguardando"** funcionam normalmente
- ✅ Pacientes que chegam fora do horário recebem notificações
- 📅 Sistema funciona normalmente durante toda a noite

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
- ✅ **19h30:** Sistema **ENVIA** mensagem "aguardando" (bloqueio inativo)
- 📱 **Resultado:** Paciente recebe mensagem normal de aguardo

### 📅 **Cenário 4: Paciente chega às 10h30 (Sábado)**
- ✅ **10h30:** Paciente chega na clínica
- ✅ **11h00:** Paciente completa 30 minutos de espera
- ❌ **11h00:** Sistema **NÃO envia** mensagem "aguardando" (bloqueio sábado ativo)
- ✅ **12h00:** Paciente recebe mensagem de fim de expediente
- 📱 **Resultado:** Paciente recebe apenas a mensagem oficial de fim

### 📅 **Cenário 5: Paciente chega às 15h (Domingo)**
- ✅ **15h:** Paciente chega na clínica
- ✅ **15h30:** Paciente completa 30 minutos de espera
- ✅ **15h30:** Sistema **ENVIA** mensagem "aguardando" (sem restrições aos domingos)
- 📱 **Resultado:** Paciente recebe mensagem normal de aguardo

---

## 🎯 Benefícios da Restrição

### 👥 **Para os Pacientes:**
- **Comunicação organizada** no fim do expediente
- **Evita mensagens conflitantes** durante o encerramento
- **Experiência mais profissional** com mensagem oficial única
- **Clareza** sobre o status do atendimento

### 🏥 **Para a Clínica:**
- **Processo de encerramento** mais organizado
- **Evita sobrecarga** de mensagens no fim do expediente
- **Controle total** sobre a comunicação oficial
- **Preparação adequada** para o fim do atendimento

### 🤖 **Para o Sistema:**
- **Reduz conflitos** entre mensagens automáticas e oficiais
- **Melhora a performance** durante transições
- **Facilita manutenção** e monitoramento
- **Garante consistência** no processo

---

## 📊 Resumo da Lógica

| Período | Dias Úteis (Seg-Sex) | Sábado | Domingo |
|---------|---------------------|--------|---------|
| **8h-17h** | ✅ Mensagens normais | ✅ Mensagens normais | ✅ Mensagens normais |
| **17h-18h** | ❌ **BLOQUEIO TOTAL** | ✅ Mensagens normais | ✅ Mensagens normais |
| **11h-12h** | ✅ Mensagens normais | ❌ **BLOQUEIO TOTAL** | ✅ Mensagens normais |
| **18h (Seg-Sex)** | ✅ Fim de expediente | ✅ Mensagens normais | ✅ Mensagens normais |
| **12h (Sáb)** | ✅ Mensagens normais | ✅ Fim de expediente | ✅ Mensagens normais |
| **18h+** | ✅ Mensagens normais | ✅ Mensagens normais | ✅ Mensagens normais |

---

## 🔍 Monitoramento

O sistema registra todos os eventos de bloqueio e envio, permitindo:
- **Acompanhamento** de quantos pacientes foram afetados
- **Análise** de padrões de uso
- **Otimização** dos horários conforme necessário
- **Relatórios** detalhados para gestão

---

*Este sistema garante uma experiência profissional e organizada tanto para pacientes quanto para a equipe da clínica, mantendo a comunicação clara e eficiente em todos os momentos.*
