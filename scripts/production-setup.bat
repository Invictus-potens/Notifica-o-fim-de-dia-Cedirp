@echo off
REM Script de configuração completa para ambiente de produção (Windows)
REM Automação de Mensagem de Espera - CAM Krolik Integration
REM Versão: 1.0.0

setlocal enabledelayedexpansion

echo 🚀 Iniciando configuração de produção completa...

REM Configurações
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..
set LOG_FILE=%PROJECT_DIR%\logs\production-setup.log

REM Criar diretório de logs se não existir
if not exist "%PROJECT_DIR%\logs" mkdir "%PROJECT_DIR%\logs"

REM Função para logging
call :log "📁 Diretório do projeto: %PROJECT_DIR%"

REM Verificar se Node.js está instalado
call :log "🔍 Verificando pré-requisitos..."
node --version >nul 2>&1
if %errorlevel% neq 0 (
    call :error "❌ Node.js não encontrado. Por favor, instale Node.js 18.x ou superior."
    echo 📥 Download: https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    call :log "✅ Node.js encontrado: !NODE_VERSION!"
)

REM Verificar se npm está disponível
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    call :error "❌ npm não encontrado"
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    call :log "✅ npm encontrado: !NPM_VERSION!"
)

REM Instalar PM2 globalmente se não estiver instalado
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    call :log "📦 Instalando PM2 globalmente..."
    npm install -g pm2
    if %errorlevel% neq 0 (
        call :error "❌ Falha na instalação do PM2"
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('pm2 --version') do set PM2_VERSION=%%i
    call :log "✅ PM2 encontrado: !PM2_VERSION!"
)

REM Configurar sistema
call :log "🔧 Configurando sistema..."
cd /d "%PROJECT_DIR%"

REM Criar estrutura de diretórios
if not exist logs mkdir logs
if not exist data mkdir data
if not exist data\backup mkdir data\backup
if not exist data\temp mkdir data\temp
if not exist config mkdir config

call :log "✅ Estrutura de diretórios criada"

REM Instalar dependências do projeto
call :log "📦 Instalando dependências do projeto..."
npm ci --production
if %errorlevel% neq 0 (
    call :error "❌ Falha na instalação de dependências"
    pause
    exit /b 1
)

call :log "✅ Dependências instaladas"

REM Compilar aplicação
call :log "🔨 Compilando aplicação TypeScript..."

REM Instalar dependências de desenvolvimento temporariamente
npm install --include=dev
if %errorlevel% neq 0 (
    call :error "❌ Falha na instalação de dependências de desenvolvimento"
    pause
    exit /b 1
)

REM Compilar
npm run build
if %errorlevel% neq 0 (
    call :error "❌ Falha na compilação"
    pause
    exit /b 1
)

REM Remover dependências de desenvolvimento
npm prune --production

REM Verificar se build foi criado
if not exist dist (
    call :error "❌ Falha na compilação. Diretório 'dist' não foi criado."
    pause
    exit /b 1
)

call :log "✅ Aplicação compilada com sucesso"

REM Configurar ambiente
call :log "📋 Configurando ambiente..."

REM Criar arquivo .env se não existir
if not exist .env (
    call :log "📋 Criando arquivo .env a partir do template..."
    copy .env.example .env
    call :warning "⚠️  IMPORTANTE: Configure as variáveis no arquivo .env antes de iniciar!"
    call :warning "   Edite o arquivo .env com suas configurações específicas."
) else (
    call :log "✅ Arquivo .env já existe"
)

REM Validar configurações
call :log "🔍 Validando configurações..."
node scripts\validate-env.js >nul 2>&1
if %errorlevel% equ 0 (
    call :log "✅ Configurações válidas"
) else (
    call :warning "⚠️  Algumas configurações precisam ser ajustadas no arquivo .env"
)

REM Criar scripts de automação
call :log "💾 Criando scripts de automação..."

REM Script de backup automático
(
echo @echo off
echo REM Backup automático
echo set BACKUP_DIR=data\backup
echo set DATE=%%date:~-4,4%%%%date:~-10,2%%%%date:~-7,2%%_%%time:~0,2%%%%time:~3,2%%%%time:~6,2%%
echo set DATE=%%DATE: =0%%
echo set BACKUP_FILE=backup_%%DATE%%.zip
echo echo 📦 Criando backup: %%BACKUP_FILE%%
echo powershell "Compress-Archive -Path . -DestinationPath %%BACKUP_DIR%%\%%BACKUP_FILE%% -Exclude node_modules,dist,logs,'data\backup',.git"
echo if %%errorlevel%% equ 0 ^(
echo     echo ✅ Backup criado: %%BACKUP_DIR%%\%%BACKUP_FILE%%
echo ^) else ^(
echo     echo ❌ Falha na criação do backup
echo ^)
echo REM Limpar backups antigos ^(manter últimos 7^)
echo forfiles /p %%BACKUP_DIR%% /m backup_*.zip /d -7 /c "cmd /c del @path" 2^>nul
) > scripts\auto-backup.bat

REM Script de monitoramento de saúde
(
echo @echo off
echo REM Monitor de saúde da aplicação
echo set HEALTH_URL=http://localhost:%PORT%/health
echo set LOG_FILE=logs\health-monitor.log
echo set timestamp=%%date%% %%time%%
echo curl -f -s %%HEALTH_URL%% ^>nul 2^>^&1
echo if %%errorlevel%% equ 0 ^(
echo     echo [%%timestamp%%] ✅ Aplicação saudável ^>^> %%LOG_FILE%%
echo ^) else ^(
echo     echo [%%timestamp%%] ❌ Aplicação não responde ^>^> %%LOG_FILE%%
echo     echo [%%timestamp%%] 🔄 Tentando reiniciar aplicação... ^>^> %%LOG_FILE%%
echo     pm2 restart automacao-mensagem-espera
echo ^)
) > scripts\health-monitor.bat

REM Script de inicialização como serviço Windows
(
echo @echo off
echo REM Instalar como serviço Windows usando PM2
echo echo 🔧 Configurando serviço Windows...
echo pm2 install pm2-windows-service
echo if %%errorlevel%% neq 0 ^(
echo     echo ❌ Falha na instalação do pm2-windows-service
echo     echo Instalando manualmente...
echo     npm install -g pm2-windows-service
echo ^)
echo pm2 set pm2-windows-service:SERVICE_NAME "AutomacaoMensagemEspera"
echo pm2 set pm2-windows-service:SERVICE_DISPLAY_NAME "Automação de Mensagem de Espera"
echo pm2 set pm2-windows-service:SERVICE_DESCRIPTION "Sistema de automação para envio de mensagens de espera integrado com CAM Krolik"
echo pm2 start ecosystem.config.js --env production
echo pm2 save
echo pm2 startup
echo echo ✅ Serviço Windows configurado
echo echo    Para gerenciar: services.msc
echo echo    Para desinstalar: pm2 unstartup
) > scripts\install-service.bat

REM Script de inicialização rápida
(
echo @echo off
echo REM Script de inicialização rápida
echo echo 🚀 Iniciando Automação de Mensagem de Espera...
echo cd /d "%%~dp0.."
echo pm2 start ecosystem.config.js --env production
echo if %%errorlevel%% equ 0 ^(
echo     echo ✅ Aplicação iniciada com sucesso
echo     echo 🔗 Acesse: http://localhost:%PORT%
echo     echo 📊 Monitoramento: pm2 monit
echo ^) else ^(
echo     echo ❌ Falha na inicialização
echo     echo 📋 Verifique as configurações no arquivo .env
echo ^)
echo pause
) > scripts\start-production.bat

REM Script de parada
(
echo @echo off
echo REM Script de parada da aplicação
echo echo 🛑 Parando Automação de Mensagem de Espera...
echo cd /d "%%~dp0.."
echo pm2 stop automacao-mensagem-espera
echo if %%errorlevel%% equ 0 ^(
echo     echo ✅ Aplicação parada com sucesso
echo ^) else ^(
echo     echo ⚠️  Aplicação pode não estar rodando
echo ^)
echo pause
) > scripts\stop-production.bat

call :log "✅ Scripts de automação criados"

REM Executar testes de validação
call :log "🧪 Executando testes de validação..."

REM Instalar dependências de teste temporariamente
npm install --include=dev

npm test
if %errorlevel% equ 0 (
    call :log "✅ Todos os testes passaram"
) else (
    call :warning "⚠️  Alguns testes falharam. Verifique a configuração."
)

REM Remover dependências de desenvolvimento
npm prune --production

REM Configurar tarefas agendadas do Windows (opcional)
call :log "⏰ Configurando tarefas agendadas..."

REM Backup diário às 02:00
schtasks /create /tn "AutomacaoMensagemEspera_Backup" /tr "%PROJECT_DIR%\scripts\auto-backup.bat" /sc daily /st 02:00 /f >nul 2>&1
if %errorlevel% equ 0 (
    call :log "✅ Backup automático agendado para 02:00 diariamente"
) else (
    call :warning "⚠️  Falha ao agendar backup automático"
)

REM Monitoramento a cada 5 minutos
schtasks /create /tn "AutomacaoMensagemEspera_HealthCheck" /tr "%PROJECT_DIR%\scripts\health-monitor.bat" /sc minute /mo 5 /f >nul 2>&1
if %errorlevel% equ 0 (
    call :log "✅ Monitoramento de saúde agendado a cada 5 minutos"
) else (
    call :warning "⚠️  Falha ao agendar monitoramento de saúde"
)

call :log "🎉 Configuração de produção concluída com sucesso!"

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
echo    scripts\start-production.bat
echo    OU: pm2 start ecosystem.config.js --env production
echo.
echo 4. ^(Opcional^) Instale como serviço Windows:
echo    scripts\install-service.bat
echo.
echo 5. Monitore a aplicação:
echo    pm2 monit
echo    pm2 logs automacao-mensagem-espera
echo.
echo 🔗 Acesse a interface web em: http://localhost:%PORT%
echo.

call :log "✅ Setup completo registrado em: %LOG_FILE%"
pause
goto :eof

REM Funções auxiliares
:log
echo [%date% %time%] %~1
echo [%date% %time%] %~1 >> "%LOG_FILE%"
goto :eof

:error
echo [%date% %time%] ERROR: %~1
echo [%date% %time%] ERROR: %~1 >> "%LOG_FILE%"
goto :eof

:warning
echo [%date% %time%] WARNING: %~1
echo [%date% %time%] WARNING: %~1 >> "%LOG_FILE%"
goto :eof