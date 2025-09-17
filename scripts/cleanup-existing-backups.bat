@echo off
echo 🧹 Script de Limpeza Imediata de Backups
echo.
echo Este script vai limpar os backups existentes mantendo apenas os 10 mais recentes.
echo.
set /p confirm=Deseja continuar? (s/N): 
if /i not "%confirm%"=="s" (
    echo Operação cancelada.
    pause
    exit /b
)

echo.
echo 📊 Analisando backups existentes...
node scripts/cleanup-backups.js list

echo.
echo 🗑️ Executando limpeza (mantendo 10 backups)...
node scripts/cleanup-backups.js clean 10

echo.
echo ✅ Limpeza concluída!
echo.
pause
