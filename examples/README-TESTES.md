# 🎀 GUIA DE TESTES DO SISTEMA DE TAGS

## 📋 Sobre

Este documento explica como executar os testes do novo **Sistema de TAGS** implementado para resolver o problema de pacientes não receberem mensagem de fim de expediente após receberem mensagem de 30 minutos.

---

## 🎯 Problema Resolvido

**Antes:** Pacientes que recebiam mensagem de 30 minutos eram marcados como "processados" e removidos da lista de ativos, não recebendo a mensagem de fim de expediente.

**Agora:** Pacientes permanecem ativos e recebem **TAGS** das mensagens enviadas (`30min`, `end_of_day`), permitindo receber múltiplas mensagens diferentes.

---

## 🧪 Testes Disponíveis

### 1. **test-tags-system.js** (NOVO! 🎀)
Teste completo do sistema de TAGS com 6 cenários:

- ✅ **Cenário 1:** Paciente Normal (30min + Fim de Dia)
- ✅ **Cenário 2:** Validação das Tags nos Pacientes Ativos  
- ✅ **Cenário 3:** Verificação de Horário Comercial
- ✅ **Cenário 4:** Validação de Setores Excluídos
- ✅ **Cenário 5:** Proteção Contra Duplicação de Tags
- ✅ **Cenário 6:** Status Geral do Sistema

### 2. **test-flow-control.js** (Existente)
Teste do controle de fluxo (pausar/retomar)

---

## 🚀 Como Executar

### Pré-requisitos
1. Sistema deve estar rodando (porta 48026)
2. Node.js instalado
3. Luxon instalado (`npm install`)

### Executar Teste do Sistema de TAGS

```bash
# Navegue até a pasta do projeto
cd Notifica-o-fim-de-dia-Cedirp

# Execute o teste
node examples/test-tags-system.js
```

### Executar Teste de Fluxo

```bash
node examples/test-flow-control.js
```

---

## 📊 Saída Esperada

### ✅ Teste Bem-Sucedido

```
🎀 ============================================
   TESTE DO SISTEMA DE TAGS DE MENSAGENS
============================================

🧪 TESTE 1: Paciente Normal (30min + Fim de Dia)
============================================
👤 Paciente de teste: João Silva
   📞 Telefone: 11999999999
   🎀 Tags atuais: ["30min", "end_of_day"]
✅ PASSOU: Paciente tem AMBAS as tags

🧪 TESTE 2: Validação das Tags nos Pacientes Ativos
============================================
📊 Total de pacientes ativos: 5
📈 ESTATÍSTICAS:
   Com AMBAS as tags: 3
✅ PASSOU: Sistema de tags está funcionando

[... outros testes ...]

🎉 TESTES CONCLUÍDOS COM SUCESSO!
```

### ❌ Problemas Comuns

**Erro: "ECONNREFUSED"**
```
❌ ERRO durante execução dos testes: connect ECONNREFUSED
🔧 Solução: Verificar se o servidor está rodando
```

**Solução:** Execute `npm start` ou `pm2 start ecosystem.config.js`

---

## 🔍 O Que Cada Teste Verifica

### Teste 1: Paciente Normal
- Verifica se paciente pode ter tags `30min` E `end_of_day`
- Valida estrutura do objeto de tags
- Confirma que histórico de mensagens está correto

### Teste 2: Validação de Tags
- Conta quantos pacientes têm cada tipo de tag
- Verifica se estrutura de dados está correta
- Gera estatísticas do sistema

### Teste 3: Horário Comercial
- Verifica configuração de horários
- Valida se está dentro/fora do expediente
- Confirma que mensagem de 30min respeita horário

### Teste 4: Setores Excluídos
- Lista setores excluídos
- Verifica se pacientes desses setores têm tags
- Confirma que sistema bloqueia corretamente

### Teste 5: Duplicação de Tags
- Procura tags duplicadas
- Valida que cada tag aparece no máximo 1 vez
- Detecta tags inválidas

### Teste 6: Status do Sistema
- Verifica se sistema está rodando
- Checa se fluxo está pausado
- Mostra quantidade de pacientes ativos

---

## 📝 Interpretando os Resultados

### Tags Possíveis

| Tag | Significado |
|-----|-------------|
| `[]` | Paciente novo, sem mensagens enviadas |
| `["30min"]` | Recebeu mensagem de 30min, pode receber fim de dia |
| `["end_of_day"]` | Recebeu mensagem de fim de dia (entrou perto das 18h) |
| `["30min", "end_of_day"]` | Recebeu AMBAS as mensagens ✅ |

### Estados Esperados

✅ **CORRETO:**
- Paciente com tag `30min` ainda na lista de ativos
- Paciente com ambas as tags ainda na lista de ativos  
- Paciente de setor excluído sem tags

❌ **INCORRETO:**
- Paciente com tag `30min` duplicada
- Paciente de setor excluído com tags
- Tags inválidas (diferentes de `30min` ou `end_of_day`)

---

## 🐛 Troubleshooting

### Problema: Testes falhando

**Verificar:**
1. Sistema está rodando? `pm2 status`
2. Porta 48026 está disponível? `netstat -an | findstr 48026`
3. Há pacientes ativos? Acesse `http://localhost:48026`

### Problema: Pacientes sem tags

**Possível causa:**
- Sistema acabou de ser iniciado
- Ainda não completaram 30min de espera
- Fora do horário comercial
- Fluxo está pausado

**Solução:**
- Aguardar ciclo de verificação (60 segundos)
- Verificar configuração de horários
- Verificar se fluxo não está pausado

---

## 💡 Dicas

1. **Execute os testes regularmente** para garantir que sistema está funcionando
2. **Analise as estatísticas** para entender padrões de uso
3. **Compare resultados** antes e depois de mudanças
4. **Salve logs** para histórico: `node examples/test-tags-system.js > test-results.log`

---

## 📞 Suporte

Se os testes indicarem problemas, verifique:
- Logs do sistema: `pm2 logs cedirp-notificacao`
- Arquivo de configuração: `data/system_config.json`
- Pacientes ativos: `data/patients_active.json`
- Histórico de mensagens: `data/messages_sent.json`

---

## 🎊 Resultado Esperado

Ao final dos testes, você deve ver:

```
💡 CONCLUSÃO:
   O sistema de TAGS foi implementado com sucesso!
   Pacientes que receberam mensagem de 30min AGORA
   também receberão mensagem de fim de expediente.
   O problema relatado pelo cliente foi RESOLVIDO! 🎊
```

---

**Última atualização:** 30/09/2025  
**Versão do sistema:** 1.0.0 com Sistema de TAGS
