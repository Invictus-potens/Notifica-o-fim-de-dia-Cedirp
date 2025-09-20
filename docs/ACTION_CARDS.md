# Funcionalidade de Cartões de Ação

Este documento descreve a implementação da funcionalidade de busca e uso de cartões de ação da API CAM Krolik.

## Visão Geral

A funcionalidade permite buscar cartões de ação disponíveis na API CAM Krolik e utilizá-los no sistema de automação de mensagens. Os cartões de ação são templates pré-definidos que são enviados AUTOMATICAMENTE para pacientes em diferentes situações.

**⚠️ IMPORTANTE: O sistema agora envia mensagens SOMENTE por automação. Não há mais opção de envio manual.**

## Endpoint da API

```bash
curl -X 'GET' \
  'https://api.camkrolik.com.br/core/v2/api/action-cards' \
  -H 'accept: application/json' \
  -H 'access-token: 63e68f168a48875131856df8'
```

## Implementação

### Backend

#### 1. KrolikApiClient (`src/services/KrolikApiClient.ts`)

```typescript
// Buscar todos os cartões de ação
async getActionCards(): Promise<ActionCard[]>

// Buscar cartão específico por ID
async getActionCard(cardId: string): Promise<ActionCard>
```

#### 2. MainController (`src/controllers/MainController.ts`)

```typescript
// Método público para buscar cartões
async getActionCards()
```

#### 3. API Routes (`src/index.ts`)

```typescript
// Rota GET /api/action-cards
app.get('/api/action-cards', async (req, res) => {
  // Busca cartões da API CAM Krolik
  // Retorna dados ou fallback em caso de erro
})
```

### Frontend

#### 1. JavaScript (`public/app.js`)

```javascript
// Carregar cartões de ação
async loadActionCards()

// Exibir cartões no seletor
displayActionCards(actionCards)
```

#### 2. Interface HTML (`public/index.html`)

```html
<!-- Seletor de cartões de ação -->
<select id="action-card-select" class="form-select form-select-sm">
  <option value="">Selecione um cartão de ação...</option>
</select>
```

## Estrutura de Dados

### ActionCard Interface

```typescript
interface ActionCard {
  id: string;
  name: string;
  content: string;
  active: boolean;
  title?: string;
  description?: string;
  type?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  organizationId?: string;
  isDefault?: boolean;
  metadata?: any;
}
```

### Resposta da API

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Mensagem de Espera 30min",
      "content": "Template para mensagem de espera",
      "active": true,
      "type": "waiting_message"
    }
  ],
  "total": 1,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Funcionalidades

### 1. Busca de Cartões

- Lista todos os cartões de ação disponíveis
- Filtra apenas cartões ativos
- Suporte a fallback em caso de erro da API

### 2. Exibição no Frontend

- Seletor dropdown com cartões disponíveis
- Informações adicionais (tipo, status)
- Tooltip com descrição do cartão

### 3. Tratamento de Erros

- Fallback para dados mock em caso de falha
- Notificações de aviso para o usuário
- Logs detalhados para debug

## Testes

### Script de Teste

```bash
# Testar funcionalidade completa
npm run test:action-cards

# Exemplo de uso
npm run example:action-cards
```

### Teste Manual

1. Inicie o servidor: `npm run dev`
2. Acesse: `http://localhost:3000`
3. Navegue para "Configurações"
4. Verifique o seletor de cartões de ação

## Configuração

### Variáveis de Ambiente

```env
KROLIK_API_URL=https://api.camkrolik.com.br
KROLIK_API_TOKEN=63e68f168a48875131856df8
```

### Headers da API

```typescript
{
  'accept': 'application/json',
  'access-token': '63e68f168a48875131856df8'
}
```

## Uso

### 1. Buscar Cartões

```typescript
const actionCards = await mainController.getActionCards();
```

### 2. Filtrar Cartões

```typescript
// Apenas cartões ativos
const activeCards = actionCards.filter(card => card.active !== false);

// Por tipo
const waitingCards = actionCards.filter(card => card.type === 'waiting_message');
```

### 3. Enviar Cartão

```typescript
// Enviar cartão para um chat específico
const success = await krolikApiClient.sendActionCard(chatId, cardId);
```

## Monitoramento

### Logs

- Busca de cartões: `📋 Buscando cartões de ação...`
- Sucesso: `✅ Encontrados X cartões de ação`
- Erro: `❌ Erro ao buscar cartões de ação`

### Métricas

- Total de cartões carregados
- Taxa de sucesso da API
- Tempo de resposta

## Troubleshooting

### Problemas Comuns

1. **API não responde**
   - Verifique conectividade
   - Confirme token válido
   - Sistema usa fallback automaticamente

2. **Cartões não aparecem**
   - Verifique logs do servidor
   - Confirme se API retorna dados
   - Teste endpoint diretamente

3. **Erro de autenticação**
   - Verifique token da API
   - Confirme headers corretos

### Debug

```bash
# Ver logs detalhados
npm run dev

# Testar API diretamente
curl -H "access-token: SEU_TOKEN" https://api.camkrolik.com.br/core/v2/api/action-cards
```

## Melhorias Futuras

- Cache de cartões para melhor performance
- Filtros avançados no frontend
- Validação de cartões antes do envio
- Histórico de cartões enviados
- Templates personalizados
