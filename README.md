# Automação de Mensagem de Espera - Sistema de Produção

Sistema de automação robusto para envio de mensagens para pacientes em fila de espera, integrado com a API do CAM Krolik e preparado para ambiente de produção.

## 🚀 Funcionalidades Principais

- **Envio automático de mensagens após 30 minutos de espera**
- **Mensagens de fim de expediente às 18h em dias úteis**
- **Interface web moderna para gerenciamento**
- **Integração completa com Supabase para persistência de dados**
- **Suporte a múltiplos canais (normal e API oficial)**
- **Sistema de cron jobs real com node-cron**
- **Gerenciamento de fuso horário com Luxon (America/Sao_Paulo)**
- **Retry automático com exponential backoff**
- **Sistema de fallback robusto**
- **Logs seguros com mascaramento de dados pessoais**
- **Health checks e monitoramento avançado**
- **Métricas de performance detalhadas**
- **Validação robusta de payloads da API**
- **Sistema de alertas e notificações**

## 📦 Instalação

### Desenvolvimento

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. Compile o projeto:
   ```bash
   npm run build
   ```

5. Inicie o servidor:
   ```bash
   npm start
   ```

### 🏭 Produção

Para configurar o ambiente de produção:

1. **Configuração automática:**
   ```bash
   npm run setup:production
   ```

2. **Configuração manual:**
   ```bash
   # Instalar dependências de produção
   npm install --production
   
   # Compilar projeto
   npm run build
   
   # Configurar PM2
   pm2 install pm2-logrotate
   
   # Iniciar em produção
   npm run start:production
   ```

3. **Verificar configuração:**
   ```bash
   npm run test:production
   ```

## 🔧 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Executa em modo de desenvolvimento
- `npm run build` - Compila o projeto
- `npm test` - Executa testes
- `npm run lint` - Verifica código

### Produção
- `npm run setup:production` - Configura ambiente de produção
- `npm run test:production` - Testa fluxo completo de produção
- `npm run start:production` - Inicia com PM2
- `npm run stop:production` - Para o serviço
- `npm run restart:production` - Reinicia o serviço
- `npm run logs:production` - Visualiza logs
- `npm run monitor:production` - Monitora com PM2
- `npm run health:check` - Verifica health check
- `npm run metrics:check` - Verifica métricas

## ⚙️ Configuração de Produção

### Variáveis de Ambiente

Crie um arquivo `.env` com as seguintes variáveis:

```env
# Configuração de Produção
NODE_ENV=production
PORT=48026

# API CAM Krolik
API_URL=https://api.camkrolik.com.br
API_TOKEN=your_api_token_here

# Supabase
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here

# Configurações do Sistema
END_OF_DAY_TIME=18:00
FLOW_PAUSED=false

# Logs
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Métricas
METRICS_ENABLED=true
METRICS_PORT=9090

# Health Check
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PORT=8080
```

### PM2 Configuration

O sistema usa PM2 para gerenciamento de processos em produção:

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Monitorar
pm2 monit

# Ver logs
pm2 logs

# Reiniciar
pm2 restart ecosystem.config.js
```

### Docker

Para executar com Docker:

```bash
# Build da imagem
docker build -t automacao-mensagem-espera .

# Executar container
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## 📊 Monitoramento e Métricas

### Health Checks

- **Endpoint:** `http://localhost:8080/health`
- **Verificação:** `npm run health:check`

### Métricas

- **Endpoint:** `http://localhost:9090/metrics`
- **Verificação:** `npm run metrics:check`

### Logs

- **Arquivo:** `logs/app.log`
- **Visualização:** `npm run logs:production`
- **Rotação:** Automática com PM2

### Alertas

O sistema inclui alertas automáticos para:
- Alto uso de memória (>80%)
- Alto uso de CPU (>80%)
- Taxa de erro alta (>10%)
- Tempo de resposta alto (>5s)

## 🔒 Segurança

### Logs Seguros

- Dados pessoais (nomes, telefones) são mascarados automaticamente
- Emails e CPFs são sanitizados
- Logs não contêm informações sensíveis

### Validação de Dados

- Todos os payloads da API são validados
- Dados são sanitizados antes do processamento
- Proteção contra XSS e injection

### Retry e Fallback

- Sistema de retry com exponential backoff
- Fallbacks automáticos para operações críticas
- Recuperação automática de falhas

## 🧪 Testes

### Testes de Desenvolvimento

```bash
npm test
npm run test:watch
npm run test:coverage
```

### Testes de Produção

```bash
npm run test:production
```

Este comando executa testes completos incluindo:
- Verificação de dependências
- Validação de configuração
- Testes de compilação
- Testes de inicialização
- Health checks
- Métricas
- Logs
- Validação
- Retry
- Fallback
- Cron jobs
- Timezone
- Segurança
- Performance
- Integração

## 📁 Estrutura do Projeto

## Estrutura do Projeto

```
src/
├── controllers/     # Controladores principais
├── services/        # Serviços de negócio
├── models/          # Interfaces e tipos TypeScript
└── index.ts         # Ponto de entrada da aplicação

public/              # Interface web
├── index.html
├── styles.css
└── app.js
```

## Configuração

O sistema utiliza variáveis de ambiente para configuração. Consulte o arquivo `.env.example` para ver todas as opções disponíveis.

## API Endpoints

- `GET /` - Interface web principal
- `GET /api/status` - Status do sistema
- `GET /api/patients` - Lista pacientes em espera
- `GET /api/sectors` - Lista setores disponíveis
- `GET /api/action-cards` - Lista cartões de ação
- `GET /api/templates` - Lista templates disponíveis
- `GET /api/channels` - Lista canais disponíveis
- `GET /api/logs` - Logs do sistema
- `GET /api/metrics` - Métricas do sistema
- `GET /api/health` - Health check do sistema
- `POST /api/messages/send-action-card` - Envio manual de cartões de ação
- `POST /api/messages/send-template` - Envio manual de templates

## Funcionalidade de Canais

O sistema agora inclui funcionalidade completa para listar e gerenciar canais da API CAM Krolik:

### Endpoint da API
```bash
curl -X 'GET' \
  'https://api.camkrolik.com.br/core/v2/api/channel/list' \
  -H 'accept: application/json' \
  -H 'access-token: 63e68f168a48875131856df8'
```

### Interface Web
- **Página de Configurações**: Lista de canais disponíveis para exclusão
- **Seletor de Canais**: Dropdown com todos os canais carregados da API
- **Informações Detalhadas**: Exibe ID, descrição, tipo e status do canal

### Exemplos de Uso
```bash
# Testar funcionalidade de canais
node scripts/test-channel-list.js

# Exemplo de listagem de canais
node examples/channel-list-example.js
```

## Funcionalidade de Seleção e Envio Manual

O sistema agora permite selecionar atendimentos específicos e enviar mensagens manualmente:

### Interface Web
- **Checkboxes de Seleção**: Cada atendimento na tabela possui um checkbox para seleção
- **Seleção em Massa**: Checkbox "Selecionar Todos" para selecionar todos os atendimentos
- **Botões de Ação**: Aparecem quando há atendimentos selecionados
- **Modais de Confirmação**: Interface para selecionar cartão de ação ou template

### Endpoints da API
```bash
# Enviar cartão de ação para pacientes selecionados
curl -X POST http://localhost:48026/api/messages/send-action-card \
  -H "Content-Type: application/json" \
  -d '{
    "patients": [
      {
        "number": "+5511999999999",
        "contactId": "patient-id-1"
      },
      {
        "number": "+5511888888888", 
        "contactId": "patient-id-2"
      }
    ],
    "action_card_id": "action-card-id"
  }'

# Enviar template para pacientes selecionados
curl -X POST http://localhost:48026/api/messages/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "patients": [
      {
        "number": "+5511999999999",
        "contactId": "patient-id-1"
      },
      {
        "number": "+5511888888888",
        "contactId": "patient-id-2"
      }
    ],
    "templateId": "template-id",
    "templateComponents": []
  }'
```

### Exemplos de Uso
```bash
# Testar endpoints de envio de mensagens (schema atualizado)
node examples/test-updated-send-messages.js

# Testar endpoints de envio de mensagens (schema antigo)
node examples/test-send-messages-example.js
```