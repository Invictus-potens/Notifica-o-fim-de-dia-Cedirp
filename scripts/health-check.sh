#!/bin/bash

# Script de verificação de saúde da aplicação
# Automação de Mensagem de Espera - CAM Krolik Integration

PORT=${PORT:-3000}
HOST=${HOST:-localhost}

echo "🏥 Verificando saúde da aplicação..."

# Verificar se a aplicação está respondendo
response=$(curl -s -o /dev/null -w "%{http_code}" http://$HOST:$PORT/health || echo "000")

if [ "$response" = "200" ]; then
    echo "✅ Aplicação está saudável (HTTP $response)"
    exit 0
elif [ "$response" = "000" ]; then
    echo "❌ Aplicação não está respondendo (conexão falhou)"
    exit 1
else
    echo "⚠️  Aplicação respondeu com status HTTP $response"
    exit 1
fi