# Multi-stage Dockerfile para Automação de Mensagem de Espera
# CAM Krolik Integration

# Estágio de build
FROM node:18-alpine AS builder

# Instalar dependências de build
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    bash \
    curl

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig.json ./
COPY jest.config.js ./

# Instalar todas as dependências (incluindo dev)
RUN npm ci

# Copiar código fonte
COPY src/ ./src/

# Compilar aplicação TypeScript
RUN npm run build

# Executar testes para validar build
RUN npm run test:ci

# Estágio de produção
FROM node:18-alpine AS production

# Instalar dependências do sistema
RUN apk add --no-cache \
    bash \
    curl \
    tzdata \
    dumb-init

# Configurar timezone
ENV TZ=America/Sao_Paulo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S automacao -u 1001 -G nodejs

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

# Copiar aplicação compilada do estágio builder
COPY --from=builder /app/dist ./dist

# Copiar arquivos necessários para produção
COPY public/ ./public/
COPY scripts/ ./scripts/
COPY ecosystem.config.js ./
COPY .env.example ./
COPY config/ ./config/

# Criar diretórios necessários
RUN mkdir -p logs data/backup data/temp

# Tornar scripts executáveis
RUN chmod +x scripts/*.sh

# Definir permissões
RUN chown -R automacao:nodejs /app

# Mudar para usuário não-root
USER automacao

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Expor porta
EXPOSE 3000

# Configurar health check mais robusto
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Labels para metadados
LABEL maintainer="Automação de Mensagem de Espera Team"
LABEL version="1.0.0"
LABEL description="Sistema de automação para envio de mensagens de espera integrado com CAM Krolik"

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Comando de inicialização
CMD ["node", "dist/index.js"]