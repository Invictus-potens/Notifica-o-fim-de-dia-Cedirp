# Script PowerShell para reiniciar PM2
# Felipe-chan, vamos corrigir o PM2! 🔄✨

Write-Host "🔄 Reiniciando PM2 com configuração corrigida..." -ForegroundColor Cyan

# Parar o processo atual
Write-Host "⏹️ Parando processo atual..." -ForegroundColor Yellow
pm2 stop notifica-cedirp

# Deletar o processo
Write-Host "🗑️ Removendo processo antigo..." -ForegroundColor Yellow
pm2 delete notifica-cedirp

# Iniciar com a nova configuração (usando cedirp.js)
Write-Host "🚀 Iniciando com nova configuração (cedirp.js)..." -ForegroundColor Green
pm2 start ecosystem.config.js --env production

# Mostrar status
Write-Host "📊 Status atual:" -ForegroundColor Cyan
pm2 status

Write-Host "✅ PM2 reiniciado com sucesso!" -ForegroundColor Green
Write-Host "📝 Para ver os logs: pm2 logs notifica-cedirp" -ForegroundColor Blue
Write-Host "📊 Para monitorar: pm2 monit" -ForegroundColor Blue
