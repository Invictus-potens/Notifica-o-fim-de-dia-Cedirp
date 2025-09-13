#!/bin/bash

# Script de inicialização para ambiente de produção
# Automação de Mensagem de Espera - CAM Krolik Integration

set -e

echo "🚀 Iniciando Automação de Mensagem de Espera..."

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📋 Copie o arquivo .env.example para .env e configure as variáveis necessárias"
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install --production
fi

# Verificar se o build existe
if [ ! -d "dist" ]; then
    echo "🔨 Compilando aplicação..."
    npm run build
fi

# Verificar variáveis de ambiente obrigatórias
echo "🔍 Verificando configurações..."

required_vars=(
    "KROLIK_API_BASE_URL"
    "KROLIK_API_TOKEN"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Variável de ambiente obrigatória não configurada: $var"
        exit 1
    fi
done

echo "✅ Configurações validadas"

# Criar diretório de logs se não existir
mkdir -p logs

# Iniciar aplicação
echo "🎯 Iniciando aplicação..."
NODE_ENV=production npm start