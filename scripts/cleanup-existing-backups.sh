#!/bin/bash

echo "🧹 Script de Limpeza Imediata de Backups"
echo ""
echo "Este script vai limpar os backups existentes mantendo apenas os 10 mais recentes."
echo ""

read -p "Deseja continuar? (s/N): " confirm
if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo "📊 Analisando backups existentes..."
node scripts/cleanup-backups.js list

echo ""
echo "🗑️ Executando limpeza (mantendo 10 backups)..."
node scripts/cleanup-backups.js clean 10

echo ""
echo "✅ Limpeza concluída!"
echo ""
