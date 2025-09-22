# Como Criar o Arquivo .env

## Instruções

1. **Crie um arquivo chamado `.env` na raiz do projeto** (mesmo diretório do `package.json`)

2. **Adicione o seguinte conteúdo ao arquivo .env:**

```env
# Tokens de API para os canais WhatsApp
TOKEN_ANEXO1_ESTOQUE=66180b4e5852dcf886a0ffd0
TOKEN_WHATSAPP_OFICIAL=65f06d5b867543e1d094fa0f
TOKEN_CONFIRMACAO1=6848611846467bfb329de619
TOKEN_CONFIRMACAO2_TI=68486231df08d48001f8951d
TOKEN_CONFIRMACAO3_CARLA=6878f61667716e87a4ca2fbd
```

3. **Salve o arquivo**

4. **Teste se está funcionando:**
   ```bash
   node test-env.js
   ```

## Verificação

Após criar o arquivo .env, você deve ver:
- ✅ Arquivo .env carregado com sucesso
- ✅ Todos os 5 tokens encontrados
- ✅ Token válido para KrolikApiClient

## Solução do Problema

O erro 500 ao carregar Action Cards era causado porque:
1. Não havia tokens configurados no .env
2. O KrolikApiClient não conseguia se conectar à API
3. Havia rotas duplicadas no backend (já corrigido)

Com os tokens configurados, o sistema deve funcionar normalmente!
