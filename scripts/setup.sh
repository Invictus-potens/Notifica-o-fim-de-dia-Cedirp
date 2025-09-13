#!/bin/bash

# Script de configuração inicial para ambiente de produção
# Automação de Mensagem de Espera - CAM Krolik Integration

set -e

echo "⚙️  Configurando ambiente de produção..."

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Compilar aplicação
echo "🔨 Compilando aplicação..."
npm run build

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📋 Criando arquivo .env a partir do template..."
    cp .env.example .env
    echo "✏️  Configure as variáveis no arquivo .env antes de iniciar a aplicação"
fi

# Criar diretórios necessários
echo "📁 Criando estrutura de diretórios..."
mkdir -p logs
mkdir -p data/backup

# Tornar scripts executáveis
chmod +x scripts/*.sh

# Executar testes para validar instalação
echo "🧪 Executando testes de validação..."
npm test

echo "✅ Configuração concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure as variáveis no arquivo .env"
echo "2. Execute: ./scripts/start.sh"
echo ""