@echo off
REM Script de inicialização para ambiente de produção (Windows)
REM Automação de Mensagem de Espera - CAM Krolik Integration

echo 🚀 Iniciando Automação de Mensagem de Espera...

REM Verificar se o arquivo .env existe
if not exist .env (
    echo ❌ Arquivo .env não encontrado!
    echo 📋 Copie o arquivo .env.example para .env e configure as variáveis necessárias
    exit /b 1
)

REM Verificar se as dependências estão instaladas
if not exist node_modules (
    echo 📦 Instalando dependências...
    npm install --production
)

REM Verificar se o build existe
if not exist dist (
    echo 🔨 Compilando aplicação...
    npm run build
)

echo 🔍 Verificando configurações...

REM Criar diretório de logs se não existir
if not exist logs mkdir logs

REM Iniciar aplicação
echo 🎯 Iniciando aplicação...
set NODE_ENV=production
npm start