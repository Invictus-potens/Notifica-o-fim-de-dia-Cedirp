#!/bin/bash

echo "🔄 Reiniciando PM2 com configuração corrigida..."

# Parar o processo atual
pm2 stop notifica-cedirp

# Deletar o processo
pm2 delete notifica-cedirp

# Iniciar com a nova configuração
pm2 start ecosystem.config.js --env production

# Mostrar status
pm2 status

echo "✅ PM2 reiniciado com sucesso!"
echo "📝 Para ver os logs: pm2 logs notifica-cedirp"
echo "📊 Para monitorar: pm2 monit"
