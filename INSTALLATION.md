# Guia de Instalação e Configuração

## Automação de Mensagem de Espera - CAM Krolik Integration

Este documento fornece instruções completas para instalação e configuração do sistema em ambiente de produção.

## 📋 Pré-requisitos

### Sistema Operacional
- Linux (Ubuntu 20.04+ recomendado)
- Windows 10/11 ou Windows Server 2019+
- macOS 10.15+

### Software Necessário
- **Node.js**: versão 18.x ou superior
- **npm**: versão 8.x ou superior
- **Git**: para clonagem do repositório
- **PM2**: para gerenciamento de processos (opcional)
- **Docker**: para deployment containerizado (opcional)

### Recursos de Sistema
- **RAM**: mínimo 512MB, recomendado 1GB
- **CPU**: 1 core, recomendado 2 cores
- **Armazenamento**: mínimo 1GB livre
- **Rede**: conexão estável com internet

### Serviços Externos
- **CAM Krolik**: instância ativa com API habilitada
- **Supabase**: projeto configurado (ou PostgreSQL)

## 🚀 Instalação Rápida

### 1. Clonar o Repositório
```bash
git clone https://github.com/your-repo/automacao-mensagem-espera.git
cd automacao-mensagem-espera
```

### 2. Executar Script de Configuração
```bash
# Linux/macOS
chmod +x scripts/*.sh
./scripts/setup.sh

# Windows
scripts\setup.bat
```

### 3. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
# Editar o arquivo .env com suas configurações
```

### 4. Iniciar a Aplicação
```bash
# Linux/macOS
./scripts/start.sh

# Windows
scripts\start.bat
```

## ⚙️ Configuração Detalhada

### Variáveis de Ambiente Obrigatórias

```bash
# API CAM Krolik
KROLIK_API_BASE_URL=https://sua-instancia.com/core/v2/api
KROLIK_API_TOKEN=seu-token-aqui

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
```

### Variáveis de Ambiente Opcionais

```bash
# Servidor
PORT=3000
HOST=0.0.0.0

# Horários
TIMEZONE=America/Sao_Paulo
END_OF_DAY_TIME=18:00

# Monitoramento
CHECK_INTERVAL_MINUTES=1
WAIT_TIME_THRESHOLD_MINUTES=30
MAX_CONCURRENT_ATTENDANCES=1000

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log

# Segurança
CORS_ORIGIN=https://seu-dominio.com
RATE_LIMIT_MAX_REQUESTS=100
```

### Configuração do Supabase

1. **Criar Projeto no Supabase**
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a URL e a chave anônima

2. **Configurar Tabelas** (automático na primeira execução)
   - `exclusion_list`: armazena atendimentos que já receberam mensagem
   - `system_config`: configurações do sistema

### Configuração da API CAM Krolik

1. **Obter Token de API**
   - Acesse sua instância do CAM Krolik
   - Vá para Configurações > API
   - Gere um novo token com permissões necessárias

2. **Endpoints Utilizados**
   - `/chats/list-lite`: listar atendimentos
   - `/chats/send-action-card`: enviar cartões de ação
   - `/chats/send-template`: enviar templates
   - `/sectors`: listar setores
   - `/action-cards`: listar cartões de ação

## 🐳 Deployment com Docker

### 1. Usando Docker Compose (Recomendado)
```bash
# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Iniciar serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f app
```

### 2. Usando Docker Standalone
```bash
# Build da imagem
docker build -t automacao-mensagem-espera .

# Executar container
docker run -d \
  --name automacao-app \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  automacao-mensagem-espera
```

## 🔧 Deployment com PM2

### 1. Instalar PM2
```bash
npm install -g pm2
```

### 2. Configurar e Iniciar
```bash
# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Verificar status
pm2 status

# Ver logs
pm2 logs automacao-mensagem-espera

# Monitoramento
pm2 monit
```

### 3. Configurar Inicialização Automática
```bash
# Salvar configuração atual
pm2 save

# Configurar startup
pm2 startup
# Seguir instruções exibidas
```

## 🌐 Configuração com Nginx (Opcional)

### 1. Instalar Nginx
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. Configurar SSL
```bash
# Criar diretório para certificados
sudo mkdir -p /etc/nginx/ssl

# Copiar certificados (substitua pelos seus)
sudo cp cert.pem /etc/nginx/ssl/
sudo cp key.pem /etc/nginx/ssl/
```

### 3. Aplicar Configuração
```bash
# Copiar configuração
sudo cp nginx.conf /etc/nginx/nginx.conf

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔍 Verificação da Instalação

### 1. Validar Configurações
```bash
# Verificar variáveis de ambiente
node scripts/validate-env.js

# Verificar conectividade
node scripts/validate-env.js --check-connectivity
```

### 2. Executar Testes
```bash
# Testes unitários
npm test

# Testes de integração
npm run test:ci
```

### 3. Verificar Health Check
```bash
# Verificar se aplicação está respondendo
curl http://localhost:3000/health

# Ou usar script
./scripts/health-check.sh
```

### 4. Acessar Interface Web
- Abra o navegador em `http://localhost:3000`
- Verifique se a interface carrega corretamente
- Teste funcionalidades básicas

## 📊 Monitoramento e Manutenção

### Logs
```bash
# Ver logs em tempo real
npm run logs

# Ou diretamente
tail -f logs/app.log
```

### Backup
```bash
# Criar backup
npm run backup

# Listar backups
node scripts/backup.js list

# Limpar backups antigos
node scripts/backup.js clean
```

### Atualizações
```bash
# Parar aplicação
pm2 stop automacao-mensagem-espera

# Atualizar código
git pull origin main

# Instalar dependências
npm install

# Recompilar
npm run build

# Reiniciar aplicação
pm2 restart automacao-mensagem-espera
```

## 🚨 Solução de Problemas

### Problemas Comuns

1. **Erro de Conexão com API**
   - Verificar URL e token da API
   - Testar conectividade: `curl -H "Authorization: Bearer SEU_TOKEN" URL_API/sectors`

2. **Erro de Conexão com Supabase**
   - Verificar URL e chave do Supabase
   - Verificar se projeto está ativo

3. **Aplicação Não Inicia**
   - Verificar logs: `npm run logs`
   - Validar configurações: `node scripts/validate-env.js`
   - Verificar porta disponível: `netstat -tlnp | grep 3000`

4. **Interface Não Carrega**
   - Verificar se aplicação está rodando
   - Verificar configurações de CORS
   - Verificar logs do navegador (F12)

### Logs de Debug
```bash
# Ativar logs detalhados
export LOG_LEVEL=debug

# Reiniciar aplicação
pm2 restart automacao-mensagem-espera
```

## 📞 Suporte

Para suporte técnico:
1. Verificar logs de erro
2. Executar diagnósticos: `node scripts/validate-env.js --check-connectivity`
3. Consultar documentação da API CAM Krolik
4. Verificar status dos serviços externos (Supabase)

## 🔐 Considerações de Segurança

### 1. Tokens e Chaves
- **Nunca commitar arquivos `.env`** no controle de versão
- **Usar variáveis de ambiente** em produção para dados sensíveis
- **Rotacionar tokens periodicamente** (recomendado: a cada 90 dias)
- **Usar chaves SSH** para acesso ao servidor
- **Implementar 2FA** quando possível

### 2. Rede e Firewall
- **Usar HTTPS obrigatoriamente** em produção
- **Configurar firewall** para permitir apenas portas necessárias:
  ```bash
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP (redirect)
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  ```
- **Limitar acesso por IP** se necessário
- **Usar VPN** para acesso administrativo

### 3. Atualizações e Patches
- **Manter dependências atualizadas**:
  ```bash
  npm audit
  npm update
  ```
- **Aplicar patches de segurança** do sistema operacional
- **Monitorar vulnerabilidades** com ferramentas como Snyk
- **Configurar atualizações automáticas** para patches críticos

### 4. Logs e Auditoria
- **Não logar dados sensíveis** (tokens, senhas, dados pessoais)
- **Configurar rotação de logs** para evitar uso excessivo de disco
- **Monitorar tentativas de acesso** não autorizadas
- **Implementar alertas** para eventos críticos

## 📈 Otimização de Performance

### 1. Recursos do Sistema
- **Monitorar uso de CPU e memória**:
  ```bash
  htop
  free -h
  df -h
  ```
- **Ajustar configurações** baseado no uso:
  - `MAX_CONCURRENT_ATTENDANCES`: máximo de atendimentos simultâneos
  - `CHECK_INTERVAL_MINUTES`: frequência de verificação
  - `BATCH_SIZE`: tamanho do lote de processamento

### 2. Configurações de Rede
- **Configurar timeouts adequados**:
  - API timeout: 10-30 segundos
  - Database timeout: 5-10 segundos
  - Health check timeout: 3-5 segundos
- **Usar connection pooling** para banco de dados
- **Implementar retry logic** com backoff exponencial
- **Configurar keep-alive** para conexões HTTP

### 3. Cache e Armazenamento
- **Usar Redis** para cache de dados frequentes:
  ```bash
  # Instalar Redis
  sudo apt install redis-server
  
  # Configurar no .env
  REDIS_URL=redis://localhost:6379
  CACHE_TTL_SECONDS=300
  ```
- **Implementar cache de aplicação** para:
  - Lista de setores (TTL: 1 hora)
  - Cartões de ação (TTL: 1 hora)
  - Configurações do sistema (TTL: 5 minutos)

### 4. Banco de Dados
- **Limpar dados antigos regularmente**:
  ```bash
  # Configurar limpeza automática
  0 2 * * * /app/scripts/cleanup-old-data.sh
  ```
- **Monitorar performance das queries**
- **Usar índices apropriados** nas tabelas
- **Configurar connection pooling**

### 5. Monitoramento Avançado
- **Implementar métricas customizadas**:
  - Tempo de resposta da API
  - Taxa de sucesso de envio de mensagens
  - Uso de recursos do sistema
- **Configurar alertas** para:
  - CPU > 80%
  - Memória > 85%
  - Disco > 90%
  - Falhas de API > 5%

## 🚀 Deployment Avançado

### 1. Blue-Green Deployment
```bash
# Script de blue-green deployment
./scripts/blue-green-deploy.sh
```

### 2. Rolling Updates com Docker
```bash
# Atualização sem downtime
docker-compose up -d --scale app=2
docker-compose up -d --no-deps app
docker-compose up -d --scale app=1
```

### 3. Backup e Recuperação
```bash
# Backup automático diário
0 2 * * * /app/scripts/auto-backup.sh

# Teste de recuperação mensal
0 3 1 * * /app/scripts/test-recovery.sh
```

### 4. Monitoramento de Saúde
```bash
# Health check avançado
./scripts/advanced-health-check.sh

# Monitoramento contínuo
watch -n 30 './scripts/health-monitor.sh'
```

## 📊 Métricas e Observabilidade

### 1. Métricas de Aplicação
- **Mensagens enviadas por hora**
- **Taxa de sucesso de envio**
- **Tempo médio de processamento**
- **Número de atendimentos monitorados**

### 2. Métricas de Sistema
- **CPU, Memória, Disco, Rede**
- **Latência de rede**
- **Disponibilidade dos serviços**
- **Tempo de resposta das APIs**

### 3. Alertas Configurados
- **Falha na API do CAM Krolik**
- **Falha na conexão com Supabase**
- **Alto uso de recursos**
- **Falha no envio de mensagens**

### 4. Dashboards
- **Painel de status em tempo real**
- **Gráficos de performance**
- **Logs estruturados**
- **Relatórios de uso**