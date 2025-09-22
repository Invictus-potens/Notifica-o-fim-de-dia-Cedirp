# Configuração de Tokens via .env

## Visão Geral

O sistema agora suporta carregar tokens de API dos canais WhatsApp através de um arquivo `.env`, mantendo todas as outras configurações no `system_config.json`.

## Como Configurar

### 1. Criar arquivo .env

Crie um arquivo `.env` na raiz do projeto com os seguintes tokens:

```env
# Tokens de API para os canais WhatsApp
# Cada token corresponde a um canal específico

# Canal Anexo1 - Estoque
TOKEN_ANEXO1_ESTOQUE=66180b4e5852dcf886a0ffd0

# Canal WhatsApp Oficial
TOKEN_WHATSAPP_OFICIAL=65f06d5b867543e1d094fa0f

# Canal Confirmação 1
TOKEN_CONFIRMACAO1=6848611846467bfb329de619

# Canal Confirmação 2 - TI
TOKEN_CONFIRMACAO2_TI=68486231df08d48001f8951d

# Canal Confirmação 3 - Carla
TOKEN_CONFIRMACAO3_CARLA=6878f61667716e87a4ca2fbd
```

### 2. Mapeamento de Tokens

Os tokens são mapeados automaticamente para os canais correspondentes:

| Variável .env | Canal ID | Descrição |
|---------------|----------|-----------|
| `TOKEN_ANEXO1_ESTOQUE` | `anexo1-estoque` | Canal principal para setor de estoque |
| `TOKEN_WHATSAPP_OFICIAL` | `whatsapp-oficial` | Canal oficial da empresa |
| `TOKEN_CONFIRMACAO1` | `confirmacao1` | Canal de confirmação 1 |
| `TOKEN_CONFIRMACAO2_TI` | `confirmacao2-ti` | Canal de TI e suporte técnico |
| `TOKEN_CONFIRMACAO3_CARLA` | `confirmacao3-carla` | Canal da equipe Carla |

### 3. Testar Configuração

Execute o script de teste para verificar se os tokens estão sendo carregados corretamente:

```bash
node test-token-loading.js
```

## Funcionamento

1. **Carregamento**: O sistema carrega os tokens do `.env` na inicialização
2. **Mapeamento**: Os tokens são automaticamente mapeados para os canais correspondentes
3. **Fallback**: Se um token não for encontrado no `.env`, o sistema usa o token do `system_config.json`
4. **Logs**: O sistema registra quais tokens foram carregados e quais estão faltando

## Vantagens

- ✅ **Segurança**: Tokens sensíveis não ficam no código fonte
- ✅ **Flexibilidade**: Fácil alteração de tokens sem modificar configurações
- ✅ **Backup**: Configurações principais permanecem no `system_config.json`
- ✅ **Ambiente**: Diferentes tokens para diferentes ambientes (dev/prod)

## Exemplo de Logs

```
🔑 Token carregado para anexo1-estoque: 66180b4e...
🔑 Token carregado para whatsapp-oficial: 65f06d5b...
⚠️ Token não encontrado no .env: TOKEN_CONFIRMACAO1
✅ Configuração carregada do arquivo system_config.json
📱 Canais configurados: 5
```

## Troubleshooting

### Token não encontrado
- Verifique se o arquivo `.env` existe na raiz do projeto
- Confirme se o nome da variável está correto (case-sensitive)
- Certifique-se de que não há espaços extras ou caracteres especiais

### Sistema não inicia
- Verifique se o arquivo `.env` tem a sintaxe correta
- Confirme se todas as variáveis estão definidas
- Execute o script de teste para diagnosticar problemas
