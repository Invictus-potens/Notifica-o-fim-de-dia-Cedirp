# Guia de Deployment - Automação de Mensagem de Espera

## 📋 Visão Geral

Este documento fornece instruções detalhadas para deployment da aplicação em diferentes ambientes de produção, incluindo configurações de segurança, monitoramento e manutenção.

## 🚀 Opções de Deployment

### 1. Deployment Tradicional (PM2)
- **Recomendado para**: Servidores dedicados, VPS
- **Vantagens**: Controle total, fácil debugging
- **Desvantagens**: Requer mais configuração manual

### 2. Deployment com Docker
- **Recomendado para**: Ambientes containerizados, Kubernetes
- **Vantagens**: Isolamento, portabilidade, escalabilidade
- **Desvantagens**: Overhead de containers

### 3. Deployment em Cloud
- **Recomendado para**: AWS, Google Cloud, Azure
- **Vantagens**: Escalabilidade automática, alta disponibilidade
- **Desvantagens**: Custos variáveis, dependência de provedor

## 🔧 Deployment com PM2 (Recomendado)

### Pré-requisitos
- Ubuntu 20.04+ ou CentOS 8+
- Node.js 18.x ou superior
- 2GB RAM mínimo, 4GB recomendado
- 10GB espaço em disco
- Conexão estável com internet

### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y curl wget git build-essential

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 2. Configuração da Aplicação

```bash
# Clonar repositório
git clone https://github.com/your-repo/automacao-mensagem-espera.git
cd automacao-mensagem-espera

# Executar script de configuração
chmod +x scripts/production-setup.sh
./scripts/production-setup.sh
```

### 3. Configuração de Variáveis de Ambiente

```bash
# Copiar template de produção
cp .env.production .env

# Editar configurações
nano .env
```

**Configurações obrigatórias:**
```bash
KROLIK_API_BASE_URL=https://sua-instancia.krolik.com/core/v2/api
KROLIK_API_TOKEN=seu-token-de-producao
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-supabase
```

### 4. Inicialização

```bash
# Validar configurações
node scripts/validate-env.js --check-connectivity

# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Salvar configuração PM2
pm2 save

# Configurar inicialização automática
pm2 startup
# Executar comando exibido pelo PM2
```

### 5. Configuração como Serviço do Sistema

```bash
# Habilitar serviço systemd
sudo systemctl enable automacao-mensagem-espera
sudo systemctl start automacao-mensagem-espera

# Verificar status
sudo systemctl status automacao-mensagem-espera
```

## 🐳 Deployment com Docker

### 1. Usando Docker Compose (Recomendado)

```bash
# Clonar repositório
git clone https://github.com/your-repo/automacao-mensagem-espera.git
cd automacao-mensagem-espera

# Configurar variáveis de ambiente
cp .env.production .env
# Editar .env com suas configurações

# Iniciar serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f app
```

### 2. Build e Deploy Manual

```bash
# Build da imagem
docker build -t automacao-mensagem-espera:latest .

# Executar container
docker run -d \
  --name automacao-app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/data:/app/data \
  automacao-mensagem-espera:latest

# Verificar status
docker ps
docker logs automacao-app
```

### 3. Docker com Nginx Reverse Proxy

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## ☁️ Deployment em Cloud

### AWS EC2

#### 1. Configuração da Instância

```bash
# Tipo de instância recomendado: t3.small ou superior
# Sistema operacional: Ubuntu 20.04 LTS
# Armazenamento: 20GB GP2 SSD mínimo

# Configurar Security Group
# - SSH (22): Seu IP
# - HTTP (80): 0.0.0.0/0
# - HTTPS (443): 0.0.0.0/0
# - Custom (3000): 0.0.0.0/0 (temporário)
```

#### 2. Configuração do Load Balancer (Opcional)

```bash
# Criar Application Load Balancer
# Target Group: EC2 instances na porta 3000
# Health Check: /health
# SSL Certificate: AWS Certificate Manager
```

#### 3. Configuração do RDS (Opcional)

```bash
# Se não usar Supabase, configurar PostgreSQL RDS
# Engine: PostgreSQL 14+
# Instance Class: db.t3.micro (desenvolvimento) ou db.t3.small (produção)
# Storage: 20GB GP2
```

### Google Cloud Platform

#### 1. Compute Engine

```bash
# Criar VM instance
gcloud compute instances create automacao-mensagem-espera \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server

# Configurar firewall
gcloud compute firewall-rules create allow-app-port \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow access to app port"
```

#### 2. Cloud Run (Containerizado)

```bash
# Build e push da imagem
gcloud builds submit --tag gcr.io/PROJECT_ID/automacao-mensagem-espera

# Deploy no Cloud Run
gcloud run deploy automacao-mensagem-espera \
  --image gcr.io/PROJECT_ID/automacao-mensagem-espera \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10
```

### Azure

#### 1. Virtual Machine

```bash
# Criar Resource Group
az group create --name AutomacaoMensagemEspera --location eastus

# Criar VM
az vm create \
  --resource-group AutomacaoMensagemEspera \
  --name AutomacaoVM \
  --image UbuntuLTS \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys

# Abrir portas
az vm open-port --port 80 --resource-group AutomacaoMensagemEspera --name AutomacaoVM
az vm open-port --port 443 --resource-group AutomacaoMensagemEspera --name AutomacaoVM
az vm open-port --port 3000 --resource-group AutomacaoMensagemEspera --name AutomacaoVM
```

#### 2. Container Instances

```bash
# Deploy direto do Docker Hub
az container create \
  --resource-group AutomacaoMensagemEspera \
  --name automacao-container \
  --image your-dockerhub/automacao-mensagem-espera:latest \
  --dns-name-label automacao-mensagem-espera \
  --ports 3000 \
  --environment-variables NODE_ENV=production \
  --secure-environment-variables \
    KROLIK_API_TOKEN=your-token \
    SUPABASE_ANON_KEY=your-key
```

## 🔒 Configurações de Segurança

### 1. SSL/TLS

#### Certificado Let's Encrypt (Gratuito)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Certificado Próprio

```bash
# Gerar certificado auto-assinado (apenas desenvolvimento)
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes

# Configurar permissões
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem
```

### 2. Firewall

```bash
# Ubuntu UFW
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3000/tcp   # Bloquear acesso direto à aplicação

# CentOS/RHEL Firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 3. Nginx como Reverse Proxy

```nginx
# /etc/nginx/sites-available/automacao-mensagem-espera
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Headers de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/automacao-mensagem-espera /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Monitoramento e Observabilidade

### 1. Logs Centralizados

#### ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
      - ./logs:/logs

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200

volumes:
  elasticsearch_data:
```

#### Configuração do Logstash

```ruby
# logstash.conf
input {
  file {
    path => "/logs/*.log"
    start_position => "beginning"
    codec => "json"
  }
}

filter {
  if [level] == "error" {
    mutate {
      add_tag => ["error"]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "automacao-mensagem-espera-%{+YYYY.MM.dd}"
  }
}
```

### 2. Métricas com Prometheus e Grafana

```yaml
# docker-compose.metrics.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  prometheus_data:
  grafana_data:
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'automacao-mensagem-espera'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### 3. Alertas

#### Configuração de Alertas no Grafana

```json
{
  "alert": {
    "name": "API CAM Krolik Indisponível",
    "message": "A API do CAM Krolik não está respondendo",
    "frequency": "10s",
    "conditions": [
      {
        "query": {
          "queryType": "",
          "refId": "A"
        },
        "reducer": {
          "type": "last",
          "params": []
        },
        "evaluator": {
          "params": [1],
          "type": "lt"
        }
      }
    ],
    "executionErrorState": "alerting",
    "noDataState": "no_data",
    "for": "1m"
  }
}
```

#### Notificações via Slack

```bash
# Configurar webhook no .env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Configurar no Grafana
# Notification channels > Add channel
# Type: Slack
# Webhook URL: ${SLACK_WEBHOOK_URL}
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/automacao-mensagem-espera
            git pull origin main
            npm ci --production
            npm run build
            pm2 reload ecosystem.config.js --env production
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm test
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

deploy:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
  script:
    - ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "
        cd /var/www/automacao-mensagem-espera &&
        git pull origin main &&
        npm ci --production &&
        npm run build &&
        pm2 reload ecosystem.config.js --env production"
  only:
    - main
```

## 🔧 Manutenção e Troubleshooting

### 1. Comandos Úteis

```bash
# Status da aplicação
pm2 status
pm2 monit

# Logs
pm2 logs automacao-mensagem-espera
tail -f logs/app.log

# Restart
pm2 restart automacao-mensagem-espera

# Reload (zero downtime)
pm2 reload automacao-mensagem-espera

# Health check
curl http://localhost:3000/health

# Validar configurações
node scripts/validate-env.js --check-connectivity
```

### 2. Problemas Comuns

#### Aplicação não inicia

```bash
# Verificar logs
pm2 logs automacao-mensagem-espera --lines 50

# Verificar configurações
node scripts/validate-env.js

# Verificar porta
netstat -tlnp | grep 3000

# Verificar permissões
ls -la dist/
```

#### Alta utilização de CPU/Memória

```bash
# Monitorar recursos
htop
pm2 monit

# Verificar logs de performance
grep "performance" logs/app.log

# Ajustar configurações
# Editar .env:
# MAX_CONCURRENT_ATTENDANCES=500
# BATCH_SIZE=50
# CHECK_INTERVAL_MINUTES=2
```

#### Falhas de conectividade

```bash
# Testar API CAM Krolik
curl -H "Authorization: Bearer $KROLIK_API_TOKEN" \
     "$KROLIK_API_BASE_URL/sectors"

# Testar Supabase
curl -H "apikey: $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/"

# Verificar DNS
nslookup your-krolik-instance.com
nslookup your-project.supabase.co
```

### 3. Backup e Recuperação

```bash
# Backup manual
./scripts/auto-backup.sh

# Listar backups
ls -la data/backup/

# Restaurar backup
tar -xzf data/backup/backup_YYYYMMDD_HHMMSS.tar.gz

# Backup do banco de dados (se usar PostgreSQL local)
pg_dump -U postgres -h localhost automacao_db > backup_db.sql

# Restaurar banco
psql -U postgres -h localhost automacao_db < backup_db.sql
```

### 4. Atualizações

```bash
# Parar aplicação
pm2 stop automacao-mensagem-espera

# Backup antes da atualização
./scripts/auto-backup.sh

# Atualizar código
git pull origin main

# Instalar dependências
npm ci --production

# Recompilar
npm run build

# Executar testes
npm test

# Reiniciar aplicação
pm2 start automacao-mensagem-espera

# Verificar saúde
curl http://localhost:3000/health
```

## 📈 Otimização de Performance

### 1. Configurações de Sistema

```bash
# Aumentar limites de arquivo
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Otimizar TCP
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
sysctl -p
```

### 2. Configurações de Node.js

```bash
# Aumentar heap size
export NODE_OPTIONS="--max-old-space-size=2048"

# Configurar no ecosystem.config.js
node_args: ['--max-old-space-size=2048']
```

### 3. Configurações de Nginx

```nginx
# Otimizações de performance
worker_processes auto;
worker_connections 1024;

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;

# Caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🚨 Plano de Recuperação de Desastres

### 1. Backup Completo

```bash
# Script de backup completo
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/automacao-$BACKUP_DATE"

mkdir -p $BACKUP_DIR

# Backup da aplicação
tar -czf $BACKUP_DIR/app.tar.gz /var/www/automacao-mensagem-espera

# Backup das configurações
cp /etc/nginx/sites-available/automacao-mensagem-espera $BACKUP_DIR/
cp /etc/systemd/system/automacao-mensagem-espera.service $BACKUP_DIR/

# Backup do banco de dados (se aplicável)
pg_dump automacao_db > $BACKUP_DIR/database.sql

echo "Backup completo criado em: $BACKUP_DIR"
```

### 2. Procedimento de Recuperação

```bash
# 1. Preparar novo servidor
# 2. Instalar dependências
# 3. Restaurar aplicação
tar -xzf backup/app.tar.gz -C /

# 4. Restaurar configurações
cp backup/automacao-mensagem-espera /etc/nginx/sites-available/
cp backup/automacao-mensagem-espera.service /etc/systemd/system/

# 5. Restaurar banco de dados
psql -U postgres automacao_db < backup/database.sql

# 6. Reiniciar serviços
systemctl daemon-reload
systemctl enable automacao-mensagem-espera
systemctl start automacao-mensagem-espera
systemctl reload nginx
```

### 3. Testes de Recuperação

```bash
# Script de teste mensal
#!/bin/bash
echo "Iniciando teste de recuperação..."

# Criar backup de teste
./scripts/auto-backup.sh

# Simular falha
pm2 stop automacao-mensagem-espera

# Aguardar
sleep 30

# Verificar detecção de falha
if ! curl -f http://localhost:3000/health; then
    echo "✅ Falha detectada corretamente"
else
    echo "❌ Falha não detectada"
fi

# Restaurar serviço
pm2 start automacao-mensagem-espera

# Verificar recuperação
sleep 10
if curl -f http://localhost:3000/health; then
    echo "✅ Recuperação bem-sucedida"
else
    echo "❌ Falha na recuperação"
fi
```

Este guia de deployment fornece uma base sólida para colocar a aplicação em produção com segurança, monitoramento adequado e procedimentos de manutenção bem definidos.