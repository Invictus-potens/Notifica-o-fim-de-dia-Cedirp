@echo off
REM Script de configuração completa para ambiente de produção (Windows)
REM Automação de Mensagem de Espera - CAM Krolik Integration

echo 🚀 Configurando ambiente de produção completo...

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado. Por favor, instale Node.js 18.x ou superior.
    echo 📥 Download: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js encontrado
)

REM Verificar se npm está disponível
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm não encontrado
    pause
    exit /b 1
) else (
    echo ✅ npm encontrado
)

REM Instalar PM2 globalmente se não estiver instalado
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Instalando PM2 globalmente...
    npm install -g pm2
) else (
    echo ✅ PM2 encontrado
)

REM Instalar dependências do projeto
echo 📦 Instalando dependências do projeto...
npm ci --production
if %errorlevel% neq 0 (
    echo ❌ Falha na instalação de dependências
    pause
    exit /b 1
)

REM Compilar aplicação
echo 🔨 Compilando aplicação TypeScript...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Falha na compilação
    pause
    exit /b 1
)

REM Verificar se build foi criado
if not exist dist (
    echo ❌ Falha na compilação. Diretório 'dist' não foi criado.
    pause
    exit /b 1
)

REM Criar estrutura de diretórios
echo 📁 Criando estrutura de diretórios...
if not exist logs mkdir logs
if not exist data mkdir data
if not exist data\backup mkdir data\backup
if not exist data\temp mkdir data\temp
if not exist config mkdir config

REM Criar arquivo .env se não existir
if not exist .env (
    echo 📋 Criando arquivo .env a partir do template...
    copy .env.example .env
    echo ⚠️  IMPORTANTE: Configure as variáveis no arquivo .env antes de iniciar!
    echo    Edite o arquivo .env com suas configurações específicas.
) else (
    echo ✅ Arquivo .env já existe
)

REM Validar configurações se .env estiver configurado
echo 🔍 Validando configurações...
node scripts\validate-env.js >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Configurações válidas
) else (
    echo ⚠️  Algumas configurações precisam ser ajustadas no arquivo .env
)

REM Executar testes de validação
echo 🧪 Executando testes de validação...
npm test
if %errorlevel% equ 0 (
    echo ✅ Todos os testes passaram
) else (
    echo ⚠️  Alguns testes falharam. Verifique a configuração.
)

REM Criar script de backup automático
echo 💾 Criando script de backup automático...
(
echo @echo off
echo REM Backup automático
echo set BACKUP_DIR=data\backup
echo set DATE=%%date:~-4,4%%%%date:~-10,2%%%%date:~-7,2%%_%%time:~0,2%%%%time:~3,2%%%%time:~6,2%%
echo set DATE=%%DATE: =0%%
echo set BACKUP_FILE=backup_%%DATE%%.zip
echo echo 📦 Criando backup: %%BACKUP_FILE%%
echo powershell Compress-Archive -Path . -DestinationPath %%BACKUP_DIR%%\%%BACKUP_FILE%% -Exclude node_modules,dist,logs,data\backup
echo echo ✅ Backup criado: %%BACKUP_DIR%%\%%BACKUP_FILE%%
) > scripts\auto-backup.bat

REM Criar script de monitoramento de saúde
echo 🔍 Criando script de monitoramento de saúde...
(
echo @echo off
echo REM Monitor de saúde da aplicação
echo set HEALTH_URL=http://localhost:3000/health
echo set LOG_FILE=logs\health-monitor.log
echo set timestamp=%%date%% %%time%%
echo curl -f -s %%HEALTH_URL%% ^>nul 2^>^&1
echo if %%errorlevel%% equ 0 ^(
echo     echo [%%timestamp%%] ✅ Aplicação saudável ^>^> %%LOG_FILE%%
echo ^) else ^(
echo     echo [%%timestamp%%] ❌ Aplicação não responde ^>^> %%LOG_FILE%%
echo     pm2 restart automacao-mensagem-espera
echo ^)
) > scripts\health-monitor.bat

REM Criar script de inicialização como serviço Windows
echo ⚙️  Criando script de serviço Windows...
(
echo @echo off
echo REM Instalar como serviço Windows usando PM2
echo echo 🔧 Configurando serviço Windows...
echo pm2 install pm2-windows-service
echo pm2 set pm2-windows-service:SERVICE_NAME "AutomacaoMensagemEspera"
echo pm2 set pm2-windows-service:SERVICE_DISPLAY_NAME "Automação de Mensagem de Espera"
echo pm2 set pm2-windows-service:SERVICE_DESCRIPTION "Sistema de automação para envio de mensagens de espera integrado com CAM Krolik"
echo pm2 start ecosystem.config.js --env production
echo pm2 save
echo pm2 startup
echo echo ✅ Serviço Windows configurado
echo echo    Para gerenciar: services.msc
) > scripts\install-service.bat

echo.
echo 🎉 Configuração de produção concluída com sucesso!
echo.
echo 📝 Próximos passos:
echo 1. Configure as variáveis no arquivo .env:
echo    - KROLIK_API_BASE_URL
echo    - KROLIK_API_TOKEN
echo    - SUPABASE_URL
echo    - SUPABASE_ANON_KEY
echo.
echo 2. Valide as configurações:
echo    node scripts\validate-env.js --check-connectivity
echo.
echo 3. Inicie a aplicação:
echo    pm2 start ecosystem.config.js --env production
echo.
echo 4. ^(Opcional^) Instale como serviço Windows:
echo    scripts\install-service.bat
echo.
echo 5. Monitore a aplicação:
echo    pm2 monit
echo    pm2 logs automacao-mensagem-espera
echo.
echo 🔗 Acesse a interface web em: http://localhost:3000
echo.
pause