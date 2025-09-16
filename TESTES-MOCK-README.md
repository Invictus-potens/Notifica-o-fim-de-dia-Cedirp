# 🧪 Testes MOCK - Sistema de Notificações

Este diretório contém arquivos de teste MOCK para as duas principais funcionalidades do sistema de notificações.

## 📋 Funcionalidades Testadas

### 1. 📱 Mensagem de 30 Minutos
**Arquivo:** `test-30min-message.js`

Testa o envio automático de mensagem para pacientes que estão aguardando há mais de 30 minutos.

**Configuração:**
- ✅ **Número de teste:** `5516981892476` (Felipe Prado)
- ✅ **Tempo de espera:** 32 minutos (mais de 30 min)
- ✅ **Tipo de mensagem:** Action Card
- ✅ **Action Card ID:** `676aab697745217d0a03dc0a` ("Feliz Natal")
- ✅ **Setor:** Suporte Geral
- ✅ **Canal:** WhatsApp Business (Principal) - Tipo 4

### 2. 🕐 Mensagem de Fim de Expediente (18h)
**Arquivo:** `test-18h-endday-message.js`

Testa o envio automático de mensagem de fim de dia para pacientes que ainda estão aguardando.

**Configuração:**
- ✅ **Número de teste:** `5516981892476` (Felipe Prado)
- ✅ **Horário de fim:** 18:00
- ✅ **Tipo de mensagem:** Action Card (mesmo que 30min)
- ✅ **Action Card ID:** `676aab697745217d0a03dc0a` ("Feliz Natal")
- ✅ **Tempo de espera:** 8 horas (simulando fim de dia)
- ✅ **Setor:** Suporte Geral
- ✅ **Canal:** WhatsApp Business (Principal) - Tipo 4

## 🚀 Como Executar os Testes

### Pré-requisitos

1. **Variáveis de Ambiente Configuradas:**
   ```bash
   KROLIK_API_BASE_URL=https://api.camkrolik.com.br
   KROLIK_API_TOKEN=seu_token_aqui
   ```

2. **Node.js instalado** (versão 14 ou superior)

3. **Dependências instaladas:**
   ```bash
   npm install
   ```

### Executar Teste de 30 Minutos

```bash
node test-30min-message.js
```

**O que o teste faz:**
- ✅ Verifica conexão com API CAM Krolik
- ✅ Simula paciente aguardando há 32 minutos
- ✅ Envia Action Card via WhatsApp
- ✅ Registra logs de sucesso/erro
- ✅ Exibe estatísticas detalhadas

### Executar Teste de Fim de Expediente

```bash
node test-18h-endday-message.js
```

**O que o teste faz:**
- ✅ Verifica horário de fim de expediente (18h)
- ✅ Simula lista de pacientes aguardando
- ✅ Filtra apenas o número de teste
- ✅ Envia Template de fim de dia
- ✅ Registra logs de sucesso/erro
- ✅ Exibe estatísticas detalhadas

## 📊 Exemplo de Saída

### Teste de 30 Minutos
```
🧪 ===========================================
   TESTE MOCK - MENSAGEM DE 30 MINUTOS
============================================
📱 Número de teste: 5516981892476
👤 Paciente: Felipe Prado
⏰ Tempo de espera: 32 minutos
🏥 Setor: Suporte Geral
📲 Canal: normal
============================================

🔍 Testando conexão com a API...
✅ Conexão com API estabelecida!
Status: 200

🚀 Enviando mensagem de 30min para Felipe Prado (16981892476)...
📤 Payload da mensagem:
{
  "chatId": "whatsapp:16981892476@c.us",
  "actionCard": {
    "title": "Mensagem de 30 minutos - TESTE",
    "message": "Olá Felipe Prado! Você está aguardando há 32 minutos...",
    "buttons": [...]
  }
}

✅ Resposta da API:
Status: 200
Data: { "success": true, "messageId": "..." }

📊 ===========================================
   RESULTADO DO TESTE
============================================
✅ SUCESSO: Mensagem enviada com sucesso!
📱 Para: Felipe Prado (16981892476)
⏰ Tempo de espera: 32 minutos
📅 Timestamp: 16/09/2025 00:35:00
============================================
```

## 🔧 Configurações dos Testes

### Dados do Paciente de Teste
```javascript
const mockPatient = {
  id: 'test-patient-001',
  name: 'Felipe Prado',
  phone: '5516981892476',
  sectorId: 'suporte-geral',
  sectorName: 'Suporte Geral',
  channelId: 'channel-001',
  channelType: 'normal', // Tipo 4 - WhatsApp Business (Principal)
  waitTimeMinutes: 32, // Para teste de 30min
  status: 'waiting'
};
```

### Mensagens de Teste

**Mensagem de 30 Minutos:**
```
Olá Felipe Prado! Você está aguardando há 32 minutos. 
Este é um teste da funcionalidade de envio automático.
```

**Mensagem de Fim de Dia:**
```
Olá Felipe Prado!

Nosso expediente está encerrando às 18:00.

Você ainda está na nossa lista de espera e será atendido assim que retornarmos.

Agradecemos sua paciência!

Este é um teste da funcionalidade de envio automático de fim de dia.
```

## 🚨 Importante

- ⚠️ **APENAS o número `5516981892476` receberá mensagens**
- ⚠️ **Estes são testes MOCK - não afetam dados reais**
- ⚠️ **Verifique se o token da API está configurado corretamente**
- ⚠️ **Os testes simulam cenários reais mas com dados controlados**

## 🐛 Troubleshooting

### Erro de Token
```
❌ ERRO: KROLIK_API_TOKEN não está configurado!
💡 Configure a variável de ambiente KROLIK_API_TOKEN
```

**Solução:** Configure a variável de ambiente:
```bash
export KROLIK_API_TOKEN=seu_token_aqui
```

### Erro de Conexão
```
❌ Erro ao enviar mensagem:
Status: 401
Mensagem: Unauthorized
```

**Solução:** Verifique se o token está correto e se a API está acessível.

### Erro de Timeout
```
❌ Erro ao enviar mensagem:
Status: 408
Mensagem: Request timeout
```

**Solução:** Verifique sua conexão com a internet e se a API está respondendo.

## 📝 Logs

Os testes geram logs detalhados incluindo:
- ✅ Status de conexão com API
- 📤 Payload enviado
- ✅ Resposta recebida
- 📊 Estatísticas de sucesso/erro
- 🕐 Timestamps de execução

---

**Desenvolvido para:** Sistema de Notificações Cedirp  
**Data:** Setembro 2025  
**Versão:** 1.0.0
