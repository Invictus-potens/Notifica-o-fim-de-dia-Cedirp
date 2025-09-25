// JavaScript da interface web

/**
 * Mapeia tipos numéricos de canais para nomes descritivos
 */
function getChannelTypeName(type) {
    const typeMap = {
        1: 'WhatsApp Pessoal',
        2: 'WhatsApp Business',
        3: 'WhatsApp Business API',
        4: 'WhatsApp Business (Principal)',
        5: 'Telegram',
        6: 'Instagram',
        7: 'Facebook Messenger',
        8: 'SMS',
        9: 'Email',
        10: 'API Externa'
    };
    
    return typeMap[type] || `Tipo ${type}`;
}

class AutomationInterface {
    constructor() {
        this.apiBaseUrl = '/api';
        this.currentRoute = 'dashboard';
        this.timerInterval = null;
        this.systemConfig = {}; // Armazenar configurações do sistema
        this.actionCards = []; // Armazenar action cards da API
        this.messageHistory = null; // Histórico de mensagens enviadas
        
        // Gerenciador centralizado de timers
        this.timerManager = {
            refreshInterval: 30000, // Padrão 30 segundos
            intervals: new Map(), // Armazena todos os intervalos ativos
            isRunning: false
        };
        
        this.init();
    }

    init() {
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeApp();
            });
        } else {
            this.initializeApp();
        }
    }

    /**
     * Gerenciador centralizado de timers
     */
    
    /**
     * Inicializa o gerenciador de timers com o intervalo do system_config.json
     */
    async initializeTimerManager() {
        // Carregar intervalo do system_config.json diretamente via API
        await this.loadRefreshIntervalFromConfig();
    }

    /**
     * Carrega o intervalo de atualização diretamente do system_config.json
     */
    async loadRefreshIntervalFromConfig() {
        try {
            console.log('🔧 Carregando refreshInterval do system_config.json...');
            const response = await fetch('/api/config');
            if (response.ok) {
                const data = await response.json();
                console.log('📋 Dados recebidos da API:', data);
                if (data.success && data.data && data.data.refreshInterval) {
                    this.timerManager.refreshInterval = parseInt(data.data.refreshInterval) * 1000;
                    console.log(`✅ Timer Manager inicializado com intervalo: ${data.data.refreshInterval}s (${this.timerManager.refreshInterval}ms)`);
                } else {
                    this.timerManager.refreshInterval = 30000; // 30 segundos padrão
                    console.log(`⚠️ Timer Manager usando intervalo padrão: 30s (dados inválidos)`);
                }
            } else {
                this.timerManager.refreshInterval = 30000; // 30 segundos padrão
                console.log(`⚠️ Timer Manager usando intervalo padrão: 30s (erro na API)`);
            }
        } catch (error) {
            this.timerManager.refreshInterval = 30000; // 30 segundos padrão
            console.log(`❌ Timer Manager usando intervalo padrão: 30s (erro: ${error.message})`);
        }
    }

    /**
     * Inicia todos os timers consolidados
     */
    startConsolidatedTimers() {
        if (this.timerManager.isRunning) {
            console.log('⚠️ Timers já estão rodando');
            return;
        }

        console.log(`🚀 Iniciando timers consolidados com intervalo: ${this.timerManager.refreshInterval / 1000}s`);
        console.log(`📊 Intervalo em milissegundos: ${this.timerManager.refreshInterval}ms`);
        
        // Timer principal que executa todas as atualizações
        const mainInterval = setInterval(() => {
            console.log(`⏰ Executando refresh consolidado - próximo em ${this.timerManager.refreshInterval / 1000}s`);
            this.executeConsolidatedRefresh();
        }, this.timerManager.refreshInterval);

        this.timerManager.intervals.set('main', mainInterval);
        this.timerManager.isRunning = true;

        // Timer de countdown removido - agora usa apenas o refreshInterval configurado
        // Os countdowns serão atualizados junto com os dados principais
        
        console.log('✅ Timers consolidados iniciados');
        console.log(`🔄 Próxima atualização em: ${this.timerManager.refreshInterval / 1000} segundos`);
    }

    /**
     * Para todos os timers
     */
    stopAllTimers() {
        console.log('⏹️ Parando todos os timers...');
        
        this.timerManager.intervals.forEach((interval, name) => {
            clearInterval(interval);
            console.log(`   - Timer ${name} parado`);
        });
        
        this.timerManager.intervals.clear();
        this.timerManager.isRunning = false;
        
        console.log('✅ Todos os timers parados');
    }

    /**
     * Executa todas as atualizações consolidadas
     */
    async executeConsolidatedRefresh() {
        try {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`🔄 [${timestamp}] Executando refresh consolidado...`);
            
            // Atualizar dados baseado na rota atual
            switch (this.currentRoute) {
                case 'dashboard':
                    console.log(`📊 [${timestamp}] Carregando status do dashboard...`);
                    await this.loadStatus();
                    break;
                case 'atendimentos':
                    console.log(`👥 [${timestamp}] Carregando pacientes...`);
                    await this.loadPatients();
                    await this.checkFlowState();
                    // Atualizar countdowns junto com os dados principais
                    this.updateCountdowns();
                    break;
                case 'configuracoes':
                    // Não atualizar automaticamente configurações
                    break;
                case 'metricas':
                    console.log(`📈 [${timestamp}] Carregando métricas...`);
                    await this.loadMetrics();
                    await this.checkFlowState();
                    break;
                case 'logs':
                    console.log(`📋 [${timestamp}] Carregando logs...`);
                    await this.loadUserLogs();
                    await this.checkFlowState();
                    break;
            }
            
            console.log(`✅ [${timestamp}] Refresh consolidado concluído`);
        } catch (error) {
            console.error('❌ Erro no refresh consolidado:', error);
        }
    }

    /**
     * Método removido - intervalo de atualização agora é controlado apenas via system_config.json
     */

    async initializeApp() {
        try {
            console.log('Inicializando aplicação...');
            this.setupEventListeners();
            this.setupRouter();
            this.initializeExclusionLists();
            this.initializeFlowControl();
            // initializePatientSelection removido - sistema agora é apenas automático
            this.initializePatientData();
            this.initializeSystemTab(); // Inicializar configurações do sistema (agora na aba Configurações)
            this.initializeMetricsTab(); // Inicializar aba Métricas
            this.initializeLogsTab(); // Inicializar aba Logs
            this.startRealtimeTimer(); // Iniciar timer em tempo real
            // Carregar configurações do sistema ANTES de outras operações
            await this.loadSystemConfig();
            // Inicializar gerenciador de timers com configuração
            await this.initializeTimerManager();
            // Carregar action cards para nomes corretos
            await this.loadActionCards();
            // Iniciar timers consolidados
            this.startConsolidatedTimers();
            
            // Fallback: ensure button is enabled after a delay
            setTimeout(() => {
                this.ensureButtonEnabled();
            }, 2000);
            
            console.log('Automação de Mensagem de Espera - Interface carregada');
        } catch (error) {
            console.error('Erro na inicialização:', error);
        }
    }
    
    ensureButtonEnabled() {
        const toggleFlowBtn = document.getElementById('toggle-flow-btn');
        if (toggleFlowBtn && toggleFlowBtn.disabled) {
            console.log('🔧 Fallback: Habilitando botão após timeout...');
            this.enableFlowButton();
        }
    }

    setupEventListeners() {
        // Sidebar navigation
        this.setupSidebarNavigation();
        
        // Sidebar toggle functionality - with delay to ensure DOM is ready
        setTimeout(() => {
            this.setupSidebarToggle();
            this.setupDataRefreshButtons();
        }, 100);
    }

    setupSidebarNavigation() {
        const navLinks = document.querySelectorAll('[data-route]');
        
        if (navLinks.length === 0) {
            console.error('Erro: Nenhum link com data-route encontrado');
            return;
        }
        
        navLinks.forEach((link) => {
            const route = link.getAttribute('data-route');
            
            // Add event listener
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (route) {
                    console.log(`Navegando para: ${route}`);
                    this.navigateToRoute(route);
                } else {
                    console.error('Erro: Nenhum atributo data-route encontrado');
                }
            });
        });
    }

    setupSidebarToggle() {
        // Sidebar elements
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        
        // Toggle buttons
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebarOpenBtn = document.getElementById('sidebar-open-btn');
        const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
        const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');

        console.log('Configurando sidebar toggle...');
        console.log('Sidebar:', sidebar);
        console.log('Main content:', mainContent);
        console.log('Sidebar overlay:', sidebarOverlay);
        console.log('Sidebar toggle:', sidebarToggle);
        console.log('Sidebar open btn:', sidebarOpenBtn);
        console.log('Sidebar close btn:', sidebarCloseBtn);
        console.log('Mobile sidebar toggle:', mobileSidebarToggle);

        // Function to open sidebar
        const openSidebar = () => {
            console.log('Abrindo sidebar...');
            if (sidebar) {
                sidebar.classList.remove('collapsed');
                sidebar.classList.add('show');
                console.log('Classes da sidebar após abrir:', sidebar.className);
            }
            if (mainContent) {
                mainContent.classList.remove('expanded');
                console.log('Classes do main-content após abrir:', mainContent.className);
            }
            if (sidebarOverlay) {
                sidebarOverlay.classList.add('show');
            }
            
            // Hide open button when sidebar is open
            if (sidebarOpenBtn) {
                sidebarOpenBtn.style.display = 'none';
            }
        };

        // Function to close sidebar
        const closeSidebar = () => {
            console.log('Fechando sidebar...');
            if (sidebar) {
                sidebar.classList.add('collapsed');
                sidebar.classList.remove('show');
                console.log('Classes da sidebar após fechar:', sidebar.className);
            }
            if (mainContent) {
                mainContent.classList.add('expanded');
                console.log('Classes do main-content após fechar:', mainContent.className);
            }
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('show');
            }
            
            // Show open button when sidebar is closed
            if (sidebarOpenBtn) {
                sidebarOpenBtn.style.display = 'inline-flex';
            }
        };

        // Function to toggle sidebar
        const toggleSidebar = () => {
            if (sidebar && sidebar.classList.contains('collapsed')) {
                openSidebar();
            } else {
                closeSidebar();
            }
        };

        // Event listeners for desktop
        if (sidebarOpenBtn) {
            console.log('Adicionando event listener para sidebar-open-btn');
            sidebarOpenBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Botão abrir sidebar clicado');
                openSidebar();
            });
        } else {
            console.warn('sidebar-open-btn não encontrado');
        }

        if (sidebarCloseBtn) {
            console.log('Adicionando event listener para sidebar-close-btn');
            sidebarCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Botão fechar sidebar clicado');
                closeSidebar();
            });
        } else {
            console.warn('sidebar-close-btn não encontrado');
        }

        // Event listeners for mobile
        if (sidebarToggle) {
            console.log('Adicionando event listener para sidebar-toggle');
            sidebarToggle.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Botão toggle sidebar clicado');
                toggleSidebar();
            });
        } else {
            console.warn('sidebar-toggle não encontrado');
        }

        if (mobileSidebarToggle) {
            console.log('Adicionando event listener para mobile-sidebar-toggle');
            mobileSidebarToggle.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Botão mobile sidebar toggle clicado');
                toggleSidebar();
            });
        } else {
            console.warn('mobile-sidebar-toggle não encontrado');
        }

        // Close sidebar when clicking overlay
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', (e) => {
                e.preventDefault();
                closeSidebar();
            });
        }

        // Close sidebar on window resize if needed
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 992) {
                // Desktop - ensure sidebar is visible
                if (sidebar) {
                    sidebar.classList.remove('collapsed', 'show');
                }
                if (mainContent) {
                    mainContent.classList.remove('expanded');
                }
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('show');
                }
                
                // Show desktop open button, hide mobile toggle
                if (sidebarOpenBtn) {
                    sidebarOpenBtn.style.display = 'inline-flex';
                }
                if (mobileSidebarToggle) {
                    mobileSidebarToggle.style.display = 'none';
                }
            } else {
                // Mobile - ensure sidebar is hidden by default
                if (sidebar) {
                    sidebar.classList.add('collapsed');
                    sidebar.classList.remove('show');
                }
                if (mainContent) {
                    mainContent.classList.add('expanded');
                }
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('show');
                }
                
                // Hide desktop open button, show mobile toggle
                if (sidebarOpenBtn) {
                    sidebarOpenBtn.style.display = 'none';
                }
                if (mobileSidebarToggle) {
                    mobileSidebarToggle.style.display = 'inline-flex';
                }
            }
        });

        // Initialize sidebar state based on screen size
        console.log('Inicializando estado da sidebar...');
        console.log('Largura da tela:', window.innerWidth);
        
        if (window.innerWidth < 992) {
            console.log('Modo mobile - fechando sidebar');
            closeSidebar();
            
            // Hide desktop open button, show mobile toggle
            if (sidebarOpenBtn) {
                sidebarOpenBtn.style.display = 'none';
            }
            if (mobileSidebarToggle) {
                mobileSidebarToggle.style.display = 'inline-flex';
            }
        } else {
            console.log('Modo desktop - abrindo sidebar');
            openSidebar();
            
            // Show desktop open button, hide mobile toggle
            if (sidebarOpenBtn) {
                sidebarOpenBtn.style.display = 'inline-flex';
            }
            if (mobileSidebarToggle) {
                mobileSidebarToggle.style.display = 'none';
            }
        }
    }

    navigateToRoute(route) {
        try {
            console.log(`🚀 navigateToRoute chamada com rota: ${route}`);
            
            // Hide all route contents
            document.querySelectorAll('.route-content').forEach(content => {
                content.classList.remove('active');
            });

            // Remove active class from all nav links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });

            // Show selected route content
            const routeContent = document.getElementById(`${route}-route`);
            if (routeContent) {
                routeContent.classList.add('active');
            } else {
                console.error(`Conteúdo da rota não encontrado: ${route}-route`);
                return;
            }

            // Add active class to nav link
            const navLink = document.querySelector(`[data-route="${route}"]`);
            if (navLink) {
                navLink.classList.add('active');
            }

            // Update page title
            const titles = {
                'dashboard': 'Dashboard',
                'atendimentos': 'Atendimentos',
                'controle': 'Controle do Fluxo',
                'configuracoes': 'Configurações',
                'logs': 'Logs do Sistema',
                'metricas': 'Métricas'
            };

            const pageTitle = document.getElementById('page-title');
            if (pageTitle && titles[route]) {
                pageTitle.textContent = titles[route];
            }

            // Update URL hash
            window.location.hash = route;

            // Update current route
            this.currentRoute = route;

            // Show/hide real-time timer based on route
            const realtimeTimer = document.getElementById('realtime-timer');
            if (realtimeTimer) {
                if (route === 'dashboard') {
                    realtimeTimer.style.display = 'block';
                } else {
                    realtimeTimer.style.display = 'none';
                }
            }

            // Load data for specific routes
            console.log(`📋 Chamando loadRouteData para rota: ${route}`);
            this.loadRouteData(route);

        } catch (error) {
            console.error('Erro na navegação:', error);
        }
    }

    setupDataRefreshButtons() {
        // Refresh patients button
        const refreshPatientsBtn = document.getElementById('refresh-patients-btn');
        if (refreshPatientsBtn) {
            refreshPatientsBtn.addEventListener('click', () => {
                this.loadPatients();
            });
        }

        // Sector filter
        const sectorFilter = document.getElementById('sector-filter');
        if (sectorFilter) {
            sectorFilter.addEventListener('change', (e) => {
                this.filterPatientsBySector(e.target.value);
            });
        } else {
            console.error('❌ Select sector-filter não encontrado!');
        }



        // Logs buttons
        const exportLogsBtn = document.getElementById('export-logs-btn');
        if (exportLogsBtn) {
            exportLogsBtn.addEventListener('click', () => {
                this.exportLogs();
            });
        }

        const clearLogsBtn = document.getElementById('clear-logs-btn');
        if (clearLogsBtn) {
            clearLogsBtn.addEventListener('click', () => {
                this.clearLogs();
            });
        }

        const logLevelFilter = document.getElementById('log-level-filter');
        if (logLevelFilter) {
            logLevelFilter.addEventListener('change', () => {
                this.loadLogs();
            });
        }

        // Action card selection - 30 minutos
        const actionCard30MinSelect = document.getElementById('action-card-30min-select');
        if (actionCard30MinSelect) {
            actionCard30MinSelect.addEventListener('change', (e) => {
                const selectedCardId = e.target.value;
                if (selectedCardId) {
                    const selectedOption = e.target.selectedOptions[0];
                    const cardName = selectedOption.textContent;
                    
                    this.addUserActionLog('info', 
                        `Card de ação 30min selecionado: ${cardName}`, 
                        'Seleção de Card',
                        { 
                            cardId: selectedCardId,
                            cardName: cardName,
                            type: '30min'
                        }
                    );
                }
            });
        }

        // Action card selection - fim de expediente
        const actionCardEndDaySelect = document.getElementById('action-card-endday-select');
        if (actionCardEndDaySelect) {
            actionCardEndDaySelect.addEventListener('change', (e) => {
                const selectedCardId = e.target.value;
                if (selectedCardId) {
                    const selectedOption = e.target.selectedOptions[0];
                    const cardName = selectedOption.textContent;
                    
                    this.addUserActionLog('info', 
                        `Card de ação fim de dia selecionado: ${cardName}`, 
                        'Seleção de Card',
                        { 
                            cardId: selectedCardId,
                            cardName: cardName,
                            type: 'endday'
                        }
                    );
                }
            });
        }

        // Action card selection - geral removido - sistema agora é apenas automático
    }

    loadRouteData(route) {
        console.log(`📋 loadRouteData chamada para rota: ${route}`);
        
        switch (route) {
            case 'dashboard':
                console.log('📊 Carregando dados do dashboard...');
                this.loadStatus();
                break;
            case 'atendimentos':
                console.log('👥 Carregando dados dos atendimentos...');
                this.loadPatients();
                // Always sync system status when loading patients
                this.checkFlowState();
                break;
            case 'configuracoes':
                console.log('⚙️ Carregando dados das configurações...');
                console.log('🃏 Chamando loadActionCards...');
                this.loadActionCards();
                console.log('🏥 Chamando loadSectors...');
                this.loadSectors();
                console.log('📱 Chamando loadChannels...');
                this.loadChannels();
                console.log('💬 Chamando loadMessageConfig...');
                this.loadMessageConfig();
                // Load exclusion lists after sectors/channels are loaded
                console.log('📋 Chamando loadExclusionLists...');
                this.loadExclusionLists();
                // Carregar configurações do sistema (unificado)
                console.log('🔧 Chamando loadSystemConfig...');
                this.loadSystemConfig();
                // Always sync system status when loading config
                this.checkFlowState();
                break;
            case 'metricas':
                console.log('📈 Carregando métricas...');
                // Always sync system status when loading metrics
                this.checkFlowState();
                break;
            case 'logs':
                console.log('📝 Carregando logs...');
                this.loadUserLogs();
                // Always sync system status when loading logs
                this.checkFlowState();
                break;
        }
    }

    async loadPatients() {
        try {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`📋 [${timestamp}] Carregando pacientes da API CAM Krolik...`);
            
            // Show loading state
            const loadingElement = document.getElementById('loading-patients');
            const tableContainer = document.getElementById('patients-table-container');
            
            if (loadingElement) loadingElement.classList.remove('d-none');
            if (tableContainer) tableContainer.classList.add('d-none');

            // PRIMEIRO: Carregar Action Cards para ter os nomes corretos
            if (!this.actionCards || this.actionCards.length === 0) {
                console.log('🃏 Carregando Action Cards antes dos pacientes...');
                await this.loadActionCards();
            }

            // SEGUNDO: Carregar Setores para ter os nomes corretos
            if (!this.availableSectors || this.availableSectors.length === 0) {
                console.log('🏥 Carregando Setores antes dos pacientes...');
                await this.loadSectors();
            }

            // TERCEIRO: Carregar histórico de mensagens para verificar status dos pacientes
            await this.loadMessageHistory();

            // QUARTO: Carregar pacientes
            const response = await fetch('/api/patients');
            const data = await response.json();

            console.log('📥 Resposta da API /api/patients:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar pacientes');
            }

            const patients = data.data || [];
            console.log(`📊 Exibindo ${patients.length} pacientes na interface`);
            
            // GARANTIR que Action Cards estão carregados antes de exibir
            if (!this.actionCards || this.actionCards.length === 0) {
                console.log('⚠️ Action Cards não carregados, tentando novamente...');
                await this.loadActionCards();
            }
            
            // IMPORTANTE: Armazenar pacientes para filtro funcionar
            this.patients = patients;
            console.log('💾 Pacientes armazenados para filtro:', this.patients.length);
            
            this.displayPatients(patients);
            
            // Update total waiting count in dashboard
            const totalWaitingElement = document.getElementById('total-waiting');
            if (totalWaitingElement) {
                totalWaitingElement.textContent = data.total || patients.length;
            }

            // Update last check time
            const lastCheckElement = document.getElementById('last-check');
            if (lastCheckElement && data.timestamp) {
                const updateTime = new Date(data.timestamp);
                lastCheckElement.textContent = updateTime.toLocaleTimeString();
            }

        } catch (error) {
            console.error('❌ Erro ao carregar pacientes:', error);
            this.showError('Erro ao carregar pacientes: ' + error.message);
        } finally {
            // Hide loading state
            const loadingElement = document.getElementById('loading-patients');
            const tableContainer = document.getElementById('patients-table-container');
            
            if (loadingElement) loadingElement.classList.add('d-none');
            if (tableContainer) tableContainer.classList.remove('d-none');
        }
    }

    displayPatients(patients) {
        try {
            const tbody = document.getElementById('patients-tbody');
            if (!tbody) {
                return;
            }

            if (patients.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted py-4">
                            Nenhum atendimento em espera
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = patients.map(patient => {
                return `
            <tr>
                <td>${this.escapeHtml(patient.name || 'Nome não informado')}</td>
                <td>${this.escapeHtml(patient.phone || patient.number || '')}</td>
                <td>${this.getSectorName(patient.sectorId || patient.sector_id) || 'Setor não informado'}</td>
                <td>${this.formatWaitTime(patient.waitTimeMinutes || 0)}</td>
                <td>
                    ${this.generateNextMessageInfo(patient)}
                </td>
                <td>
                    <span class="badge bg-warning">Aguardando</span>
                </td>
            </tr>
        `;
        }).join('');

            // Checkboxes removidos - sistema agora é apenas automático
        } catch (error) {
            console.error('Erro em displayPatients:', error);
        }
    }

    /**
     * Obtém o nome do setor pelo ID
     */
    getSectorName(sectorId) {
        console.log('🔍 getSectorName chamado com sectorId:', sectorId);
        console.log('📋 availableSectors disponíveis:', this.availableSectors?.length || 0);
        
        if (!sectorId) {
            console.log('❌ sectorId não fornecido');
            return 'Setor não informado';
        }
        
        if (!this.availableSectors || this.availableSectors.length === 0) {
            console.log('❌ availableSectors não carregado');
            return 'Setores não carregados';
        }
        
        const sector = this.availableSectors.find(s => s.id === sectorId);
        console.log('🔍 Setor encontrado:', sector);
        
        return sector ? sector.name : 'Setor não encontrado';
    }

    /**
     * Obtém o nome do action card pelo ID - 100% DINÂMICO DA API
     */
    getActionCardName(cardId) {
        if (!cardId) {
            return 'Sem Card';
        }
        
        // Se Action Cards ainda não foram carregados, retornar "Carregando..."
        if (!this.actionCards || this.actionCards.length === 0) {
            return 'Carregando...';
        }
        
        // BUSCAR DIRETAMENTE NOS ACTION CARDS CARREGADOS DA API
        const foundCard = this.actionCards.find(card => card.id === cardId);
        
        if (foundCard) {
            // Retornar o nome/descrição REAL da API CAM Krolik
            return foundCard.description || foundCard.name || foundCard.title || 'Action Card';
        }
        
        // Se não encontrou o ID na API, mostrar que não existe
        return `ID não encontrado na API`;
    }


    /**
     * Gera informação da próxima mensagem para um paciente
     */
    generateNextMessageInfo(patient) {
        const waitTime = patient.waitTimeMinutes || 0;
        const now = new Date();
        const currentHour = now.getHours();
        
        // Usar configurações reais do sistema (serão carregadas via API)
        const minWaitTime = this.systemConfig?.minWaitTime || 30;
        const maxWaitTime = this.systemConfig?.maxWaitTime || 40;
        const ignoreBusinessHours = this.systemConfig?.ignoreBusinessHours === 'true' || this.systemConfig?.ignoreBusinessHours === true;
        const endOfDayPaused = this.systemConfig?.endOfDayPaused === 'true' || this.systemConfig?.endOfDayPaused === true;
        
        // DEBUG: Log das configurações para verificar se estão sendo carregadas
        console.log(`🔍 generateNextMessageInfo para ${patient.name}:`, {
            waitTime,
            currentHour,
            minWaitTime,
            maxWaitTime,
            ignoreBusinessHours,
            endOfDayPaused,
            systemConfig: this.systemConfig
        });
        
        // Obter IDs dos action cards do config e buscar nomes na API
        const actionCard30Min = this.systemConfig?.selectedActionCard30Min;
        const actionCardEndDay = this.systemConfig?.selectedActionCardEndDay;
        const card30MinName = this.getActionCardName(actionCard30Min);
        const cardEndDayName = this.getActionCardName(actionCardEndDay);
        
        
        // Verificar se paciente já recebeu mensagem de 30 minutos
        const hasReceived30MinMessage = this.hasPatientReceivedMessage(patient);
        
        // Se paciente já recebeu mensagem de 30min E não está pausado, mostrar countdown para fim de expediente
        if (hasReceived30MinMessage && !endOfDayPaused) {
            const endOfDayTime = new Date(now);
            const endHour = parseInt(this.systemConfig?.endOfDayTime?.split(':')[0] || '18');
            endOfDayTime.setHours(endHour, 0, 0, 0);
            const timeRemaining = endOfDayTime.getTime() - now.getTime();
            
            // Se ainda há tempo até o fim do expediente
            if (timeRemaining > 0) {
                // Criar elemento com ID único para atualização dinâmica
                const patientId = patient.id || patient.attendanceId || Math.random().toString(36).substr(2, 9);
                const countdownId = `countdown-endday-${patientId}`;
                
                return `
                    <div class="text-primary">
                        <div class="fw-bold" id="${countdownId}" data-target-time="${Date.now() + timeRemaining}">
                            ${this.formatTimeRemaining(timeRemaining)}
                        </div>
                        <small class="text-muted">${cardEndDayName}</small>
                    </div>
                `;
            } else {
                // Fim de expediente já passou
                return `
                    <div class="text-warning">
                        <div class="fw-bold">Expediente encerrado</div>
                        <small class="text-muted">${cardEndDayName}</small>
                    </div>
                `;
            }
        }
        
        // Verificar se está fora do horário comercial (apenas se ignoreBusinessHours for false)
        let startHour, endHour;
        let isOutsideBusinessHours = false;
        
        // Verificar se é sábado e usar horários específicos para sábado
        if (currentDayOfWeek === 6) { // 6 = sábado
            startHour = parseInt(this.systemConfig?.saturdayStartTime?.split(':')[0] || '8');
            endHour = parseInt(this.systemConfig?.saturdayEndTime?.split(':')[0] || '12');
            isOutsideBusinessHours = currentHour < startHour || currentHour >= endHour;
            
            console.log(`🗓️ Verificação de horário comercial (SÁBADO):`, {
                saturdayStartTime: this.systemConfig?.saturdayStartTime || '08:00',
                saturdayEndTime: this.systemConfig?.saturdayEndTime || '12:00',
                startHour,
                endHour,
                currentHour,
                currentDayOfWeek,
                isOutsideBusinessHours,
                ignoreBusinessHours,
                shouldShowOutsideHours: !ignoreBusinessHours && isOutsideBusinessHours
            });
        } else {
            // Dias úteis normais (segunda a sexta)
            startHour = parseInt(this.systemConfig?.startOfDayTime?.split(':')[0] || '8');
            endHour = parseInt(this.systemConfig?.endOfDayTime?.split(':')[0] || '18');
            isOutsideBusinessHours = currentHour < startHour || currentHour >= endHour;
            
            console.log(`🕐 Verificação de horário comercial (DIAS ÚTEIS):`, {
                startOfDayTime: this.systemConfig?.startOfDayTime || '08:00',
                endOfDayTime: this.systemConfig?.endOfDayTime || '18:00',
                startHour,
                endHour,
                currentHour,
                currentDayOfWeek,
                isOutsideBusinessHours,
                ignoreBusinessHours,
                shouldShowOutsideHours: !ignoreBusinessHours && isOutsideBusinessHours
            });
        }
        
        if (!ignoreBusinessHours && isOutsideBusinessHours) {
            const dayType = currentDayOfWeek === 6 ? 'sábado' : 'dia útil';
            console.log(`❌ Mostrando "Fora do horário" para ${patient.name} (${dayType})`);
            return `
                <div class="text-warning">
                    <div class="fw-bold">Fora do horário</div>
                    <small class="text-muted">${card30MinName} (${dayType})</small>
                </div>
            `;
        }
        
        // Calcular tempo para mensagem baseado no tempo de espera
        if (waitTime < minWaitTime) {
            // Ainda não atingiu o tempo mínimo - calcular tempo restante
            const timeRemaining = (minWaitTime - waitTime) * 60 * 1000;
            
            // Criar elemento com ID único para atualização dinâmica
            const patientId = patient.id || patient.attendanceId || Math.random().toString(36).substr(2, 9);
            const countdownId = `countdown-${patientId}`;
            
            return `
                <div class="text-primary">
                    <div class="fw-bold" id="${countdownId}" data-remaining="${timeRemaining}" data-target-time="${Date.now() + timeRemaining}">
                        ${this.formatTimeRemaining(timeRemaining)}
                    </div>
                    <small class="text-muted">${card30MinName}</small>
                </div>
            `;
        } else if (waitTime >= minWaitTime && waitTime <= maxWaitTime) {
            // Paciente está no intervalo ideal - PRONTO para receber mensagem AGORA
            return `
                <div class="text-success">
                    <div class="fw-bold">PRONTO</div>
                    <small class="text-muted">${card30MinName}</small>
                </div>
            `;
        } else {
            // Paciente já passou do tempo máximo
            return `
                <div class="text-danger">
                    <div class="fw-bold">00:00:00</div>
                    <small class="text-muted">Tempo excedido</small>
                </div>
            `;
        }
    }

    /**
     * Carrega histórico de mensagens para verificar status dos pacientes
     */
    async loadMessageHistory() {
        try {
            console.log('📨 Carregando histórico de mensagens...');
            const response = await fetch(`${this.apiBaseUrl}/messages/history`);
            
            if (response.ok) {
                this.messageHistory = await response.json();
                console.log(`✅ Histórico carregado: ${this.messageHistory?.messages?.length || 0} mensagens`);
            } else {
                console.warn('⚠️ Não foi possível carregar o histórico de mensagens');
                this.messageHistory = { messages: [] };
            }
        } catch (error) {
            console.error('❌ Erro ao carregar histórico de mensagens:', error);
            this.messageHistory = { messages: [] };
        }
    }

    /**
     * Carrega configurações do sistema via API
     */
    async loadSystemConfig() {
        try {
            console.log('⚙️ Carregando configurações do sistema...');
            const response = await fetch(`${this.apiBaseUrl}/config`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.systemConfig = {
                        minWaitTime: parseInt(data.data.minWaitTime) || 30,
                        maxWaitTime: parseInt(data.data.maxWaitTime) || 40,
                        ignoreBusinessHours: data.data.ignoreBusinessHours === 'true' || data.data.ignoreBusinessHours === true,
                        endOfDayPaused: data.data.endOfDayPaused === 'true' || data.data.endOfDayPaused === true,
                        selectedActionCard30Min: data.data.selectedActionCard30Min,
                        selectedActionCard30MinDescription: data.data.selectedActionCard30MinDescription,
                        selectedActionCardEndDay: data.data.selectedActionCardEndDay,
                        selectedActionCardEndDayDescription: data.data.selectedActionCardEndDayDescription,
                        startOfDayTime: data.data.startOfDayTime || '08:00',
                        endOfDayTime: data.data.endOfDayTime || '18:00'
                    };
                    console.log('✅ Configurações carregadas:', this.systemConfig);
                }
            }
        } catch (error) {
            console.error('❌ Erro ao carregar configurações:', error);
            // Usar configurações padrão em caso de erro
            this.systemConfig = {
                minWaitTime: 30,
                maxWaitTime: 40,
                ignoreBusinessHours: false,
                endOfDayPaused: true,
                selectedActionCard30Min: '68cbfa96b8640e9721e4feab',
                selectedActionCardEndDay: '631f2b4f307d23f46ac80a2b',
                startOfDayTime: '08:00',
                endOfDayTime: '18:00'
            };
        }
    }

    /**
     * Função removida - substituída por gerenciador consolidado de timers
     */

    /**
     * Função removida - countdowns agora são atualizados junto com os dados principais
     * através do executeConsolidatedRefresh() que usa o refreshInterval configurado
     */

    /**
     * Atualiza os countdowns dinâmicos baseado no refreshInterval configurado
     */
    updateCountdowns() {
        // Buscar todos os elementos de countdown na página
        const countdownElements = document.querySelectorAll('[id^="countdown-"]');
        
        countdownElements.forEach(element => {
            const targetTime = parseInt(element.getAttribute('data-target-time'));
            const now = Date.now();
            const timeRemaining = targetTime - now;
            const isEndDayCountdown = element.id.includes('endday');
            
            if (timeRemaining <= 0) {
                // Tempo esgotado
                if (isEndDayCountdown) {
                    element.textContent = 'Expediente encerrado';
                    element.classList.remove('text-primary');
                    element.classList.add('text-warning');
                } else {
                    element.textContent = '00:00:00';
                    element.classList.remove('text-primary');
                    element.classList.add('text-success');
                }
                
                // Dados serão atualizados automaticamente pelo timer principal
                // Não é necessário chamar loadPatients() aqui
            } else {
                // Atualizar countdown
                element.textContent = this.formatTimeRemaining(timeRemaining);
                
                // Mudar cor quando estiver próximo do fim
                if (timeRemaining <= 5 * 60 * 1000) {
                    element.classList.remove('text-primary');
                    element.classList.add('text-warning');
                } else {
                    element.classList.remove('text-warning');
                    element.classList.add('text-primary');
                }
            }
        });
    }

    formatWaitTime(minutes) {
        if (!minutes || minutes < 0) return '--';
        
        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}min`;
        }
    }

    /**
     * Formata tempo restante em formato HH:MM:SS
     * @param {number} timeRemaining - Tempo restante em millisegundos
     * @returns {string} Tempo formatado como HH:MM:SS
     */
    formatTimeRemaining(timeRemaining) {
        if (timeRemaining <= 0) {
            return '00:00:00';
        }
        
        const totalSeconds = Math.floor(timeRemaining / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    async loadStatus() {
        try {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`📊 [${timestamp}] Carregando status da API...`);
            const response = await fetch('/api/status');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar status');
            }

            // Update system status badge
            const systemStatusElement = document.getElementById('system-status');
            if (systemStatusElement) {
                systemStatusElement.textContent = data.isRunning ? 'Sistema Ativo' : 'Sistema Pausado';
                systemStatusElement.className = `badge ${data.isRunning ? 'bg-success' : 'bg-warning'} me-3`;
            }

            // Update flow control button
            const toggleFlowBtn = document.getElementById('toggle-flow-btn');
            if (toggleFlowBtn) {
                if (data.isPaused) {
                    toggleFlowBtn.innerHTML = '<i class="bi bi-play-fill"></i> Retomar Fluxo';
                    toggleFlowBtn.className = 'btn btn-success btn-sm';
                } else {
                    toggleFlowBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pausar Fluxo';
                    toggleFlowBtn.className = 'btn btn-outline-primary btn-sm';
                }
            }

            // Update connection status
            const connectionStatusElement = document.getElementById('connection-status');
            if (connectionStatusElement) {
                connectionStatusElement.textContent = data.apiConnected ? 'Online' : 'Offline';
                connectionStatusElement.className = `badge ${data.apiConnected ? 'bg-success' : 'bg-danger'}`;
            }

            // Update dashboard status metrics
            this.updateDashboardStatusData(data);

        } catch (error) {
            console.error('Erro ao carregar status:', error);
            this.showError('Erro ao carregar status do sistema');
        }
    }

    updateDashboardStatusData(statusData) {
        try {
            // Update total waiting patients
            const totalWaitingElement = document.getElementById('total-waiting');
            if (totalWaitingElement && statusData.monitoringStats) {
                const value = statusData.monitoringStats.totalPatients || 0;
                totalWaitingElement.textContent = value;
            }

            // Update 30min messages today
            const messages30MinElement = document.getElementById('messages-30min');
            if (messages30MinElement && statusData.monitoringStats) {
                const value = statusData.monitoringStats.patientsOver30Min || 0;
                if (value > 0) {
                    messages30MinElement.textContent = value;
                    messages30MinElement.className = 'h6 text-warning';
                } else {
                    messages30MinElement.textContent = 'Nenhum dado disponível';
                    messages30MinElement.className = 'small text-muted';
                }
            }

            // Update end of day messages
            const messagesEndDayElement = document.getElementById('messages-endday');
            if (messagesEndDayElement && statusData.monitoringStats) {
                const value = statusData.monitoringStats.patientsEndOfDay || 0;
                if (value > 0) {
                    messagesEndDayElement.textContent = value;
                    messagesEndDayElement.className = 'h6 text-danger';
                } else {
                    messagesEndDayElement.textContent = 'Nenhum dado disponível';
                    messagesEndDayElement.className = 'small text-muted';
                }
            }

            // Update last check time
            const lastCheckElement = document.getElementById('last-check');
            if (lastCheckElement && statusData.lastUpdate) {
                const lastUpdate = new Date(statusData.lastUpdate);
                const timeString = lastUpdate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                lastCheckElement.textContent = timeString;
            }

        } catch (error) {
            console.error('Erro ao atualizar dados do dashboard:', error);
        }
    }



    updateDetailedMetrics(metricsData) {
        try {
            // Update detailed 30min messages
            const detailed30MinElement = document.getElementById('detailed-messages-30min');
            if (detailed30MinElement) {
                detailed30MinElement.textContent = metricsData.messages?.by30Min || 0;
            }

            // Update detailed end of day messages
            const detailedEndDayElement = document.getElementById('detailed-messages-endday');
            if (detailedEndDayElement) {
                detailedEndDayElement.textContent = metricsData.messages?.byEndOfDay || 0;
            }

            // Update modal detailed metrics
            const modal30MinElement = document.getElementById('detailed-messages-30min-modal');
            if (modal30MinElement) {
                modal30MinElement.textContent = metricsData.messages?.by30Min || 0;
            }

            const modalEndDayElement = document.getElementById('detailed-messages-endday-modal');
            if (modalEndDayElement) {
                modalEndDayElement.textContent = metricsData.messages?.byEndOfDay || 0;
            }

        } catch (error) {
            console.error('Erro ao atualizar métricas detalhadas:', error);
        }
    }

    async loadLogs() {
        try {
            const response = await fetch('/api/logs');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar logs');
            }

            const logsContainer = document.getElementById('logs-container');
            if (logsContainer) {
                if (data.logs && data.logs.length > 0) {
                    logsContainer.innerHTML = data.logs.map(log => `
                        <div class="log-entry mb-2 p-2 border rounded">
                            <div class="d-flex justify-content-between">
                                <span class="badge bg-${this.getLogLevelColor(log.level)}">${log.level.toUpperCase()}</span>
                                <small class="text-muted">${new Date(log.timestamp).toLocaleString()}</small>
                            </div>
                            <div class="mt-1">${this.escapeHtml(log.message)}</div>
                        </div>
                    `).join('');
                } else {
                    logsContainer.innerHTML = '<div class="text-muted text-center py-4">Nenhum log disponível</div>';
                }
            }

        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        }
    }

    getLogLevelColor(level) {
        const colors = {
            'debug': 'secondary',
            'info': 'primary',
            'warn': 'warning',
            'error': 'danger',
            'critical': 'dark'
        };
        return colors[level] || 'secondary';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async loadActionCards() {
        try {
            console.log('🃏 Carregando Action Cards...');
            
            const response = await fetch('/api/action-cards/available');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao carregar cartões de ação');
            }

            console.log(`🃏 ${result.data?.length || 0} Action Cards carregados`);
            
            // Armazenar para uso em outras funções
            this.actionCards = result.data || [];

            this.displayActionCards(result.data || []);
            
            // Carregar configurações salvas dos cartões
            await this.loadSavedActionCardConfig();

        } catch (error) {
            console.error('❌ Erro ao carregar cartões de ação:', error);
            this.showError('Erro ao carregar cartões de ação: ' + error.message);
        }
    }

    async loadSavedActionCardConfig() {
        try {
            const response = await fetch('/api/config');
            const result = await response.json();


            if (response.ok && result.success) {
                const config = result.data;
                
                // Aplicar configurações salvas nos selects (apenas para automação)
                
                if (config.selectedActionCard30Min) {
                    const select = document.getElementById('action-card-30min-select');
                    if (select) {
                        select.value = config.selectedActionCard30Min;
                    } else {
                        console.warn('⚠️ Elemento action-card-30min-select não encontrado');
                    }
                }
                
                if (config.selectedActionCardEndDay) {
                    const select = document.getElementById('action-card-endday-select');
                    if (select) {
                        select.value = config.selectedActionCardEndDay;
                    } else {
                        console.warn('⚠️ Elemento action-card-endday-select não encontrado');
                    }
                }
                
            } else {
                console.error('❌ Resposta inválida da API:', result);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar configurações de cartões:', error);
        }
    }

    displayActionCards(actionCards) {
        // Armazenar action cards para uso posterior
        this.actionCards = actionCards || [];
        
        // Função para popular um select com action cards
        const populateSelect = (selectId, placeholder) => {
            const selectElement = document.getElementById(selectId);
            if (!selectElement) return;

            // Clear existing options
            selectElement.innerHTML = `<option value="">${placeholder}</option>`;

            if (actionCards && actionCards.length > 0) {
                actionCards.forEach(card => {
                    const option = document.createElement('option');
                    option.value = card.id;
                    
                    // Usar description, name ou title, com fallback para id
                    const displayName = card.description || card.name || card.title || `Cartão ${card.id}`;
                    
                    // Adicionar informações adicionais se disponíveis
                    let optionText = displayName;
                    if (card.type) {
                        optionText += ` (${card.type})`;
                    }
                    if (card.active === false) {
                        optionText += ' [Inativo]';
                    }
                    
                    option.textContent = optionText;
                    option.title = card.description || card.content || displayName;
                    
                    selectElement.appendChild(option);
                });
                
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Nenhum cartão disponível';
                selectElement.appendChild(option);
            }
        };

        // Popular os selects (apenas para automação)
        populateSelect('action-card-30min-select', 'Selecione cartão para 30min...');
        populateSelect('action-card-endday-select', 'Selecione cartão para fim de dia...');
    }



    async loadSectors() {
        try {
            console.log('Carregando setores...');
            
            const response = await fetch('/api/sectors');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao carregar setores');
            }

            // A API agora retorna { success: true, data: [...], total: X }
            const sectors = result.success ? result.data : result;
            console.log('Setores carregados:', sectors);

            this.displaySectors(sectors);

        } catch (error) {
            console.error('Erro ao carregar setores:', error);
            this.showError('Erro ao carregar setores: ' + error.message);
        }
    }

    displaySectors(sectors) {
        console.log('📋 displaySectors chamada com:', sectors?.length || 0, 'setores');
        
        // Update sector filter in atendimentos page
        const sectorFilter = document.getElementById('sector-filter');
        if (sectorFilter) {
            console.log('✅ sector-filter encontrado, populando...');
            sectorFilter.innerHTML = '<option value="">Todos os Setores</option>';
            
            if (sectors && sectors.length > 0) {
                sectors.forEach(sector => {
                    const option = document.createElement('option');
                    option.value = sector.id;
                    option.textContent = sector.name;
                    sectorFilter.appendChild(option);
                });
                console.log(`✅ ${sectors.length} setores adicionados ao sector-filter`);
            }
        } else {
            console.log('❌ sector-filter não encontrado');
        }

        // Update sector select in configuracoes page (Listas de Exceção)
        const sectorSelect = document.getElementById('sector-select');
        if (sectorSelect) {
            console.log('✅ sector-select encontrado, populando...');
            sectorSelect.innerHTML = '<option value="">Selecione um setor...</option>';
            
            if (sectors && sectors.length > 0) {
                sectors.forEach(sector => {
                    const option = document.createElement('option');
                    option.value = sector.id;
                    option.textContent = sector.name;
                    sectorSelect.appendChild(option);
                });
                console.log(`✅ ${sectors.length} setores adicionados ao sector-select`);
            }
        } else {
            console.log('❌ sector-select não encontrado');
        }

        // Store sectors for later use
        this.availableSectors = sectors || [];
        console.log('✅ availableSectors atualizado com', this.availableSectors.length, 'setores');
    }

    async loadChannels() {
        try {
            console.log('📋 Carregando canais...');
            
            const response = await fetch('/api/channels');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao carregar canais');
            }

            // A API retorna { success: true, data: [...], total: X }
            const channels = result.success ? result.data : result;
            console.log('Canais carregados:', channels);

            this.displayChannels(channels);

        } catch (error) {
            console.error('Erro ao carregar canais:', error);
            this.showError('Erro ao carregar canais: ' + error.message);
        }
    }

    displayChannels(channels) {
        console.log('📱 displayChannels chamada com:', channels?.length || 0, 'canais');
        
        // Update channel select in configuracoes page (Listas de Exceção)
        const channelSelect = document.getElementById('channel-select');
        if (channelSelect) {
            console.log('✅ channel-select encontrado, populando...');
            channelSelect.innerHTML = '<option value="">Selecione um canal...</option>';
            
            if (channels && channels.length > 0) {
                channels.forEach(channel => {
                    const option = document.createElement('option');
                    option.value = channel.id;
                    
                    // Usar description, identifier ou id para exibição
                    const displayName = channel.description || channel.identifier || `Canal ${channel.id}`;
                    
                    // Adicionar informações adicionais se disponíveis
                    let optionText = displayName;
                    if (channel.type) {
                        const typeName = getChannelTypeName(channel.type);
                        optionText += ` (${typeName})`;
                    }
                    if (channel.active === false) {
                        optionText += ' [Inativo]';
                    }
                    
                    option.textContent = optionText;
                    option.title = channel.description || channel.identifier || displayName;
                    
                    channelSelect.appendChild(option);
                });
                console.log(`✅ ${channels.length} canais adicionados ao channel-select`);
            }
        } else {
            console.log('❌ channel-select não encontrado');
        }

        // Store channels for later use
        this.availableChannels = channels || [];
        console.log('✅ availableChannels atualizado com', this.availableChannels.length, 'canais');
    }

    // Métodos para gerenciar listas de exclusão
    initializeExclusionLists() {
        // Initialize excluded sectors list
        this.excludedSectors = [];

        // Add event listeners
        const addSectorBtn = document.getElementById('add-sector-btn');
        const sectorSelect = document.getElementById('sector-select');

        if (addSectorBtn) {
            addSectorBtn.addEventListener('click', () => this.addSectorToExclusion());
        }

        if (sectorSelect) {
            sectorSelect.addEventListener('change', () => this.onSectorSelectChange());
        }

        // Load existing exclusions (will be called after sectors/channels are loaded)
        // this.loadExclusionLists(); // Called separately in loadRouteData

        // Add event listener for save message config button
        const saveMessageConfigBtn = document.getElementById('save-message-config-btn');
        if (saveMessageConfigBtn) {
            saveMessageConfigBtn.addEventListener('click', () => this.saveMessageConfig());
        }
    }

    // Métodos para controle de fluxo
    initializeFlowControl() {
        // Initialize flow state as unknown (will be loaded from server)
        this.isFlowPaused = null;

        // Add event listeners for flow control buttons
        const toggleFlowBtn = document.getElementById('toggle-flow-btn');
        const pauseFlowBtn = document.getElementById('pause-flow-btn');
        const resumeFlowBtn = document.getElementById('resume-flow-btn');

        if (toggleFlowBtn) {
            toggleFlowBtn.addEventListener('click', () => this.toggleFlow());
        }

        if (pauseFlowBtn) {
            pauseFlowBtn.addEventListener('click', () => this.pauseFlow());
        }

        if (resumeFlowBtn) {
            resumeFlowBtn.addEventListener('click', () => this.resumeFlow());
        }

        // Load current flow state FIRST before showing any UI
        this.loadFlowState();
    }

    async toggleFlow() {
        console.log('🔘 Botão de toggle clicado!');
        console.log('🔍 Estado atual isFlowPaused:', this.isFlowPaused);
        
        if (this.isFlowPaused === null) {
            console.warn('⚠️ Estado do fluxo ainda não foi carregado, tentando verificar...');
            await this.checkFlowState();
            return;
        }
        
        if (this.isFlowPaused) {
            console.log('▶️ Iniciando retomada do fluxo...');
            await this.resumeFlow();
        } else {
            console.log('⏸️ Iniciando pausa do fluxo...');
            await this.pauseFlow();
        }
    }

    async pauseFlow() {
        try {
            console.log('🔄 Pausando fluxo...');
            
            const response = await fetch('/api/system/pause', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao pausar fluxo');
            }

            this.isFlowPaused = true;
            this.updateFlowButtons();
            this.updateSystemStatus('Sistema Pausado', 'warning');
            this.showSuccess('Fluxo pausado com sucesso');
            
            // Log de ação do usuário
            await this.addUserActionLog('warning', 
                'Controle de Fluxo', 
                'Usuário pausou o fluxo de mensagens automáticas',
                { action: 'pause' }
            );

        } catch (error) {
            console.error('❌ Erro ao pausar fluxo:', error);
            this.showError('Erro ao pausar fluxo: ' + error.message);
        }
    }

    async resumeFlow() {
        try {
            console.log('▶️ Retomando fluxo...');
            
            const response = await fetch('/api/system/resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao retomar fluxo');
            }

            this.isFlowPaused = false;
            this.updateFlowButtons();
            this.updateSystemStatus('Sistema Ativo', 'success');
            this.showSuccess('Fluxo retomado com sucesso');
            
            // Log de ação do usuário
            await this.addUserActionLog('info', 
                'Controle de Fluxo', 
                'Usuário retomou o fluxo de mensagens automáticas',
                { action: 'resume' }
            );

        } catch (error) {
            console.error('❌ Erro ao retomar fluxo:', error);
            this.showError('Erro ao retomar fluxo: ' + error.message);
        }
    }

    updateFlowButtons() {
        const toggleFlowBtn = document.getElementById('toggle-flow-btn');
        const pauseFlowBtn = document.getElementById('pause-flow-btn');
        const resumeFlowBtn = document.getElementById('resume-flow-btn');

        if (toggleFlowBtn) {
            // Always enable the button when updating
            toggleFlowBtn.disabled = false;
            
            if (this.isFlowPaused) {
                toggleFlowBtn.innerHTML = '<i class="bi bi-play-fill"></i> Retomar Fluxo';
                toggleFlowBtn.className = 'btn btn-success btn-sm';
            } else {
                toggleFlowBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pausar Fluxo';
                toggleFlowBtn.className = 'btn btn-outline-primary btn-sm';
            }
            
            console.log(`🔘 Botão atualizado: ${this.isFlowPaused ? 'Retomar' : 'Pausar'} (habilitado)`);
        }

        if (pauseFlowBtn) {
            pauseFlowBtn.style.display = this.isFlowPaused ? 'none' : 'block';
        }

        if (resumeFlowBtn) {
            resumeFlowBtn.style.display = this.isFlowPaused ? 'block' : 'none';
        }
    }

    updateSystemStatus(text, type) {
        const statusElement = document.getElementById('system-status');
        if (statusElement) {
            statusElement.textContent = text;
            statusElement.className = `badge bg-${type} me-3`;
        }
    }

    loadFlowState() {
        // Try to get current flow state from the system
        this.checkFlowState();
    }

    async checkFlowState() {
        try {
            const response = await fetch('/api/status');
            const result = await response.json();

            if (response.ok && result.isPaused !== undefined) {
                const wasPaused = this.isFlowPaused;
                this.isFlowPaused = result.isPaused;
                
                // Always update UI when we get a valid response
                this.updateFlowButtons();
                this.updateSystemStatus(
                    this.isFlowPaused ? 'Sistema Pausado' : 'Sistema Ativo',
                    this.isFlowPaused ? 'warning' : 'success'
                );
                
                console.log(`🔄 Estado do sistema sincronizado: ${this.isFlowPaused ? 'Pausado' : 'Ativo'}`);
            } else {
                console.warn('Resposta inválida da API de status:', result);
                // Enable button even if we can't get status
                this.enableFlowButton();
                this.updateSystemStatus('Status Desconhecido', 'secondary');
            }
        } catch (error) {
            console.error('Erro ao verificar estado do fluxo:', error);
            // On error, still enable the button
            this.enableFlowButton();
            this.updateSystemStatus('Status Desconhecido', 'secondary');
        }
    }
    
    enableFlowButton() {
        const toggleFlowBtn = document.getElementById('toggle-flow-btn');
        if (toggleFlowBtn) {
            toggleFlowBtn.disabled = false;
            toggleFlowBtn.innerHTML = '<i class="bi bi-question-circle"></i> Estado Desconhecido';
            toggleFlowBtn.className = 'btn btn-outline-secondary btn-sm';
            console.log('🔘 Botão habilitado (estado desconhecido)');
        }
    }

    addSectorToExclusion() {
        const sectorSelect = document.getElementById('sector-select');
        const selectedSectorId = sectorSelect.value;

        if (!selectedSectorId) {
            this.showError('Selecione um setor para adicionar à lista de exclusão');
            return;
        }

        // Check if already excluded
        if (this.excludedSectors.some(sector => sector.id === selectedSectorId)) {
            this.showError('Este setor já está na lista de exclusão');
            return;
        }

        // Find sector details
        const sector = this.availableSectors.find(s => s.id === selectedSectorId);
        if (sector) {
            this.excludedSectors.push(sector);
            this.updateExcludedSectorsDisplay();
            this.saveExcludedSectors();
            
            // Log da ação do usuário
            this.addUserActionLog('info', 
                'Lista de Exclusão', 
                `Usuário adicionou setor "${sector.name}" à lista de exclusão`,
                { sectorId: sector.id, sectorName: sector.name, action: 'add' }
            );
            
            // Reset select
            sectorSelect.value = '';
            
            this.showSuccess(`Setor "${sector.name}" adicionado à lista de exclusão`);
        }
    }


    removeSectorFromExclusion(sectorId) {
        console.log('Removendo setor da exclusão:', sectorId);
        console.log('Setores antes da remoção:', this.excludedSectors);
        
        this.excludedSectors = this.excludedSectors.filter(sector => sector.id !== sectorId);
        
        console.log('Setores após remoção:', this.excludedSectors);
        
        this.updateExcludedSectorsDisplay();
        this.saveExcludedSectors();
        this.showSuccess('Setor removido da lista de exclusão');
    }


    updateExcludedSectorsDisplay() {
        const container = document.getElementById('excluded-sectors-list');
        if (!container) return;

        if (this.excludedSectors.length === 0) {
            container.innerHTML = '<small class="text-muted">Nenhum setor excluído</small>';
            return;
        }

        // Clear container
        container.innerHTML = '';

        // Create elements for each excluded sector
        this.excludedSectors.forEach(sector => {
            const sectorDiv = document.createElement('div');
            sectorDiv.className = 'd-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded border';
            sectorDiv.innerHTML = `
                <div>
                    <strong>${this.escapeHtml(sector.name)}</strong>
                    <br>
                    <small class="text-muted">ID: ${sector.id}</small>
                </div>
                <button class="btn btn-outline-danger btn-sm remove-sector-btn" data-sector-id="${sector.id}">
                    <i class="bi bi-x"></i>
                </button>
            `;

            // Add event listener to the remove button
            const removeBtn = sectorDiv.querySelector('.remove-sector-btn');
            removeBtn.addEventListener('click', () => {
                this.removeSectorFromExclusion(sector.id);
            });

            container.appendChild(sectorDiv);
        });
    }


    onSectorSelectChange() {
        const sectorSelect = document.getElementById('sector-select');
        const addSectorBtn = document.getElementById('add-sector-btn');
        
        if (sectorSelect && addSectorBtn) {
            addSectorBtn.disabled = !sectorSelect.value;
        }
    }


    async saveExcludedSectors() {
        // Salvar localmente (rápido)
        localStorage.setItem('excludedSectors', JSON.stringify(this.excludedSectors));
        
        // Sincronizar com backend (persistente)
        try {
            await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    excludedSectors: this.excludedSectors.map(s => s.id)
                })
            });
            console.log('✅ Setores excluídos sincronizados com backend');
        } catch (error) {
            console.error('❌ Erro ao sincronizar setores excluídos:', error);
        }
    }


    async loadExcludedSectors() {
        try {
            // Primeiro, tentar carregar do backend
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                if (config.excludedSectors && Array.isArray(config.excludedSectors)) {
                    // Carregar setores completos da lista disponível
                    this.excludedSectors = this.availableSectors.filter(sector => 
                        config.excludedSectors.includes(sector.id)
                    );
                    this.updateExcludedSectorsDisplay();
                    console.log('✅ Setores excluídos carregados do backend');
                    return;
                }
            }
            
            // Fallback: carregar do localStorage
            const saved = localStorage.getItem('excludedSectors');
            if (saved) {
                this.excludedSectors = JSON.parse(saved);
                this.updateExcludedSectorsDisplay();
                console.log('⚠️ Setores excluídos carregados do localStorage (fallback)');
            }
        } catch (error) {
            console.error('Erro ao carregar setores excluídos:', error);
            // Fallback para localStorage
            try {
                const saved = localStorage.getItem('excludedSectors');
                if (saved) {
                    this.excludedSectors = JSON.parse(saved);
                    this.updateExcludedSectorsDisplay();
                }
            } catch (localError) {
                console.error('Erro no fallback localStorage:', localError);
            }
        }
    }


    async loadExclusionLists() {
        // Não carregar setores novamente, pois já foram carregados
        // Apenas carregar as exclusões (que dependem das listas já carregadas)
        await this.loadExcludedSectors();
        
        console.log('✅ Listas de exclusão carregadas com sucesso');
    }

    async loadMessageConfig() {
        try {
            
            const response = await fetch('/api/config');
            const result = await response.json();
            
            
            if (response.ok && result.success) {
                const config = result.data;
                
                // Update action card selects (apenas para automação)
                const actionCard30MinSelect = document.getElementById('action-card-30min-select');
                const actionCardEndDaySelect = document.getElementById('action-card-endday-select');

                if (actionCard30MinSelect) {
                    if (config.selectedActionCard30Min) {
                        actionCard30MinSelect.value = config.selectedActionCard30Min;
                    } else {
                    }
                } else {
                }

                if (actionCardEndDaySelect) {
                    if (config.selectedActionCardEndDay) {
                        actionCardEndDaySelect.value = config.selectedActionCardEndDay;
                    } else {
                    }
                } else {
                }
                
                console.log('✅ Configurações de mensagem carregadas:', config);
            } else {
                console.log('❌ Erro na resposta da API:', result);
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar configurações de mensagem:', error);
            this.showError('Erro ao carregar configurações: ' + error.message);
        }
    }

    async saveMessageConfig() {
        try {
            console.log('💾 Salvando configurações de mensagem...');
            
            // 1. Primeiro, buscar configurações atuais para manter valores não alterados
            console.log('🔍 Buscando configurações atuais...');
            const currentConfigResponse = await fetch('/api/config');
            const currentConfigResult = await currentConfigResponse.json();
            const currentConfig = currentConfigResult.data || {};
            
            // Get selected values from form (apenas para automação)
            const actionCard30MinSelect = document.getElementById('action-card-30min-select');
            const actionCardEndDaySelect = document.getElementById('action-card-endday-select');
            
            const selectedActionCard30Min = actionCard30MinSelect ? actionCard30MinSelect.value : '';
            const selectedActionCardEndDay = actionCardEndDaySelect ? actionCardEndDaySelect.value : '';
            
            // 2. Aplicar lógica: se não selecionou novo, manter o antigo
            const finalActionCard30Min = selectedActionCard30Min || currentConfig.selectedActionCard30Min;
            const finalActionCardEndDay = selectedActionCardEndDay || currentConfig.selectedActionCardEndDay;
            
            // 3. Validar que pelo menos um está definido
            if (!finalActionCard30Min && !finalActionCardEndDay) {
                this.showError('Erro: Nenhum cartão de ação está configurado. Selecione pelo menos um.');
                return;
            }
            
            // 4. Preparar dados apenas com os campos que devem ser atualizados
            const configData = {};
            
            // Só incluir no payload se há mudança ou se é um novo valor
            if (selectedActionCard30Min || !currentConfig.selectedActionCard30Min) {
                configData.selectedActionCard30Min = finalActionCard30Min;
            }
            if (selectedActionCardEndDay || !currentConfig.selectedActionCardEndDay) {
                configData.selectedActionCardEndDay = finalActionCardEndDay;
            }
            
            // Incluir exclusões na configuração
            configData.excludedSectors = this.excludedSectors.map(s => s.id);
            
            console.log('📤 Dados que serão enviados para API:', configData);
            
            // 5. Usar rota específica para Action Cards se há mudanças nos cards
            const hasActionCardChanges = configData.selectedActionCard30Min || configData.selectedActionCardEndDay;
            
            let response;
            if (hasActionCardChanges) {
                // Usar rota específica para Action Cards (apenas para automação)
                const actionCardData = {
                    thirtyMin: finalActionCard30Min,
                    endOfDay: finalActionCardEndDay
                };
                
                response = await fetch('/api/action-cards', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(actionCardData)
                });
            } else {
                // Usar rota geral para outras configurações
                console.log('📤 Enviando para /api/config:', configData);
                response = await fetch('/api/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(configData)
                });
            }
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showSuccess('Configurações de mensagem salvas com sucesso!');
                console.log('✅ Configurações salvas:', result);
                
                // Log da ação do usuário
                await this.addUserActionLog('info', 
                    'Action Cards Configurados', 
                    'Usuário atualizou configurações de Action Cards',
                    { 
                        actionCard30Min: finalActionCard30Min,
                        actionCardEndDay: finalActionCardEndDay
                    }
                );
                
                // 6. Atualizar visualmente os campos com os valores finais
                if (actionCard30MinSelect) actionCard30MinSelect.value = finalActionCard30Min || '';
                if (actionCardEndDaySelect) actionCardEndDaySelect.value = finalActionCardEndDay || '';
                
                console.log('🔄 Interface atualizada com valores salvos');
            } else {
                throw new Error(result.error || 'Erro ao salvar configurações');
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar configurações de mensagem:', error);
            this.showError('Erro ao salvar configurações: ' + error.message);
        }
    }

    showSuccess(message) {
        // Create success toast notification
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer) {
            const toast = document.createElement('div');
            toast.className = 'toast show';
            toast.innerHTML = `
                <div class="toast-header">
                    <i class="bi bi-check-circle-fill text-success me-2"></i>
                    <strong class="me-auto">Sucesso</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${this.escapeHtml(message)}
                </div>
            `;
            toastContainer.appendChild(toast);
            
            // Auto remove after 3 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 3000);
        }
    }

    showError(message) {
        // Create toast notification
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer) {
            const toast = document.createElement('div');
            toast.className = 'toast show';
            toast.innerHTML = `
                <div class="toast-header">
                    <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                    <strong class="me-auto">Erro</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${this.escapeHtml(message)}
                </div>
            `;
            toastContainer.appendChild(toast);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                toast.remove();
            }, 5000);
        }
    }

    showWarning(message) {
        // Create toast notification
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer) {
            const toast = document.createElement('div');
            toast.className = 'toast show';
            toast.innerHTML = `
                <div class="toast-header">
                    <i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                    <strong class="me-auto">Aviso</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${this.escapeHtml(message)}
                </div>
            `;
            toastContainer.appendChild(toast);
            
            // Auto remove after 4 seconds
            setTimeout(() => {
                toast.remove();
            }, 4000);
        }
    }

    showNotification(message, type = 'info') {
        // Create toast notification
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer) {
            let icon, bgColor, textColor, title;
            
            switch (type) {
                case 'success':
                    icon = 'bi-check-circle-fill';
                    textColor = 'text-success';
                    title = 'Sucesso';
                    break;
                case 'error':
                    icon = 'bi-x-circle-fill';
                    textColor = 'text-danger';
                    title = 'Erro';
                    break;
                case 'warning':
                    icon = 'bi-exclamation-triangle-fill';
                    textColor = 'text-warning';
                    title = 'Aviso';
                    break;
                case 'info':
                default:
                    icon = 'bi-info-circle-fill';
                    textColor = 'text-info';
                    title = 'Informação';
                    break;
            }

            const toast = document.createElement('div');
            toast.className = 'toast show';
            toast.innerHTML = `
                <div class="toast-header">
                    <i class="bi ${icon} ${textColor} me-2"></i>
                    <strong class="me-auto">${title}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${this.escapeHtml(message)}
                </div>
            `;
            toastContainer.appendChild(toast);
            
            // Auto remove after 5 seconds for success, 6 seconds for others
            const duration = type === 'success' ? 5000 : 6000;
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, duration);
        }
    }

    setupRouter() {
        // Handle hash changes
        window.addEventListener('hashchange', (e) => {
            try {
                const hash = window.location.hash.substring(1);
                const route = hash || 'dashboard';
                this.navigateToRoute(route);
            } catch (error) {
                console.error('Erro no hashchange:', error);
            }
        });

        // Initialize with current hash or default route
        try {
            const hash = window.location.hash.substring(1);
            const initialRoute = hash || 'dashboard';
            this.navigateToRoute(initialRoute);
        } catch (error) {
            console.error('Erro na inicialização do router:', error);
            this.navigateToRoute('dashboard');
        }
    }


    handleRouteSpecificActions(route) {
        switch (route) {
            case 'logs':
                // Carregar logs sempre que a aba for acessada
                console.log('📋 Carregando logs da aba Logs...');
                if (this.loadUserLogs) {
                    this.loadUserLogs();
                }
                break;
            case 'metricas':
                // Carregar métricas sempre que a aba for acessada
                console.log('📊 Carregando métricas da aba Métricas...');
                if (this.loadMetrics) {
                    this.loadMetrics();
                }
                break;
            case 'atendimentos':
                // Carregar pacientes sempre que a aba for acessada
                console.log('👥 Carregando pacientes da aba Atendimentos...');
                if (this.loadPatients) {
                    this.loadPatients();
                }
                break;
        }
    }

    // Métodos para gerenciar seleção de pacientes
    // Função initializePatientSelection removida - sistema agora é apenas automático

    // Função setupPatientSelectionButtons removida - sistema agora é apenas automático


    // Funções de seleção de pacientes removidas - sistema agora é apenas automático

    // Função clearSelection removida - sistema agora é apenas automático

    // Função setupModalEventListeners removida - sistema agora é apenas automático

    // Função openSendMessageModal removida - sistema agora é apenas automático

    // Todas as funções de envio manual removidas - sistema agora é apenas automático

    /**
     * Inicia o timer em tempo real
     */
    startRealtimeTimer() {
        this.updateTimer();
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000); // Atualiza a cada segundo
    }

    /**
     * Para o timer em tempo real
     */
    stopRealtimeTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Atualiza o display do timer com a hora e data atuais
     */
    updateTimer() {
        const now = new Date();
        
        // Formatar hora (HH:MM:SS)
        const timeString = now.toLocaleTimeString('pt-BR', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Formatar data (DD/MM/AAAA)
        const dateString = now.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Atualizar elementos DOM
        const timeElement = document.getElementById('current-time');
        const dateElement = document.getElementById('current-date');
        
        if (timeElement) {
            timeElement.textContent = timeString;
        }
        
        if (dateElement) {
            dateElement.textContent = dateString;
        }
    }

    /**
     * Formata data para exibição mais elegante
     */
    formatDateForDisplay(date) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return date.toLocaleDateString('pt-BR', options);
    }

    /**
     * Carrega logs do sistema
     */
    async loadLogs() {
        try {
            const level = document.getElementById('log-level-filter')?.value || '';
            const url = level ? `/api/logs?level=${encodeURIComponent(level)}` : '/api/logs';
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.displayLogs(data.data);
            } else {
                console.error('Erro ao carregar logs:', data.error || 'Erro desconhecido');
                this.displayLogs([]); // Exibir lista vazia em caso de erro
            }
        } catch (error) {
            console.error('Erro ao carregar logs:', error.message || error);
            this.displayLogs([]); // Exibir lista vazia em caso de erro
        }
    }

    /**
     * Exibe logs no container
     */
    displayLogs(logs) {
        const container = document.getElementById('logs-container');
        if (!container) return;

        if (logs.length === 0) {
            container.innerHTML = '<div class="text-muted text-center py-4">Nenhum log disponível</div>';
            return;
        }

        const logsHtml = logs.map(log => {
            const levelClass = this.getLogLevelClass(log.level);
            const levelIcon = this.getLogLevelIcon(log.level);
            const timestamp = new Date(log.timestamp).toLocaleString('pt-BR');
            
            let metadataHtml = '';
            if (log.metadata && Object.keys(log.metadata).length > 0) {
                metadataHtml = `<div class="log-metadata text-muted small mt-1">${JSON.stringify(log.metadata)}</div>`;
            }

            let stackHtml = '';
            if (log.stack) {
                stackHtml = `<div class="log-stack text-danger small mt-1"><pre>${log.stack}</pre></div>`;
            }

            return `
                <div class="log-entry mb-2 p-2 border-start border-3 ${levelClass}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center mb-1">
                                <i class="bi ${levelIcon} me-2"></i>
                                <span class="fw-bold log-level">${log.level.toUpperCase()}</span>
                                <span class="text-muted ms-2 small">${timestamp}</span>
                                <span class="badge bg-secondary ms-2">${log.context}</span>
                            </div>
                            <div class="log-message">${this.escapeHtml(log.message)}</div>
                            ${metadataHtml}
                            ${stackHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = logsHtml;
    }

    /**
     * Obtém classe CSS para o nível do log
     */
    getLogLevelClass(level) {
        const classes = {
            'debug': 'border-info',
            'info': 'border-primary',
            'warn': 'border-warning',
            'error': 'border-danger',
            'critical': 'border-danger bg-danger bg-opacity-10'
        };
        return classes[level] || 'border-secondary';
    }

    /**
     * Obtém ícone para o nível do log
     */
    getLogLevelIcon(level) {
        const icons = {
            'debug': 'bi-bug',
            'info': 'bi-info-circle',
            'warn': 'bi-exclamation-triangle',
            'error': 'bi-x-circle',
            'critical': 'bi-x-octagon'
        };
        return icons[level] || 'bi-circle';
    }


    /**
     * Limpa todos os logs
     */
    async clearLogs() {
        if (!confirm('Tem certeza que deseja limpar todos os logs?')) {
            return;
        }

        try {
            const response = await fetch('/api/logs', {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('Logs limpos com sucesso', 'success');
                this.loadLogs(); // Recarrega a lista vazia
            } else {
                this.showAlert('Erro ao limpar logs: ' + data.error, 'danger');
            }
        } catch (error) {
            console.error('Erro ao limpar logs:', error);
            this.showAlert('Erro ao limpar logs', 'danger');
        }
    }

    /**
     * Exporta logs
     */
    async exportLogs() {
        try {
            const level = document.getElementById('log-level-filter')?.value || '';
            const url = level ? `/api/logs/export?format=json&level=${encodeURIComponent(level)}` : '/api/logs/export?format=json';
            
            const response = await fetch(url);
            
            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `logs_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(downloadUrl);
                
                this.showAlert('Logs exportados com sucesso', 'success');
            } else {
                this.showAlert('Erro ao exportar logs', 'danger');
            }
        } catch (error) {
            console.error('Erro ao exportar logs:', error);
            this.showAlert('Erro ao exportar logs', 'danger');
        }
    }

    /**
     * Inicializa dados dos pacientes
     */
    initializePatientData() {
        console.log('Inicializando dados dos pacientes...');
        this.patients = [];
        this.processedPatients = new Set(); // Para rastrear pacientes que receberam mensagens
        this.loadPatients();
        // Atualização automática agora é feita pelo gerenciador consolidado de timers
    }




    /**
     * Filtra pacientes por setor
     */
    filterPatientsBySector(sectorId) {
        console.log('🔍 Filtrando pacientes por setor:', sectorId);
        console.log('📋 Pacientes disponíveis:', this.patients?.length || 0);
        
        if (!sectorId) {
            // Mostrar todos os pacientes
            this.displayPatients(this.patients);
            return;
        }
        
        // Filtrar pacientes pelo setor selecionado
        const filteredPatients = this.patients.filter(patient => {
            const patientSectorId = patient.sectorId || patient.sector_id;
            console.log(`🔍 Paciente ${patient.name}: sectorId=${patientSectorId}, filtro=${sectorId}`);
            return patientSectorId === sectorId;
        });
        
        console.log(`📊 Filtrados ${filteredPatients.length} pacientes do setor ${sectorId}`);
        this.displayPatients(filteredPatients);
    }

    /**
     * Verifica se o paciente recebeu uma mensagem
     */
    hasPatientReceivedMessage(patient) {
        // Verificar se está na lista de pacientes processados
        const patientKey = `${patient.name}_${patient.phone}_${patient.sectorId}`;
        if (this.processedPatients.has(patientKey)) {
            return true;
        }
        
        // Verificar também se há mensagens enviadas para este paciente hoje
        // (usando ID do paciente ou combinação nome+telefone)
        if (this.messageHistory && this.messageHistory.messages) {
            const today = new Date().toDateString();
            
            // Buscar mensagens que correspondam ao paciente
            const matchingMessages = this.messageHistory.messages.filter(msg => {
                const msgDate = new Date(msg.sentAt).toDateString();
                const matchesDate = msgDate === today;
                const matchesId = msg.patientId === patient.id;
                const matchesNamePhone = msg.patientName === patient.name && msg.patientPhone === patient.phone;
                
                return matchesDate && (matchesId || matchesNamePhone);
            });
            
            return matchingMessages.length > 0;
        }
        return false;
    }

    /**
     * Retorna o status da mensagem para exibição
     */
    getMessageStatus(patient, hasReceivedMessage) {
        if (hasReceivedMessage) {
            return '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Enviada</span>';
        } else if (this.isEligibleFor30MinMessage(patient)) {
            return '<span class="badge bg-warning"><i class="bi bi-clock"></i> Elegível</span>';
        } else if (this.isEligibleForEndOfDayMessage(patient)) {
            return '<span class="badge bg-info"><i class="bi bi-sunset"></i> Fim de Dia</span>';
        } else {
            return '<span class="badge bg-secondary"><i class="bi bi-dash-circle"></i> Não Enviada</span>';
        }
    }

    /**
     * Verifica se paciente é elegível para mensagem de 30min
     */
    isEligibleFor30MinMessage(patient) {
        const waitTime = patient.waitTimeMinutes || 0;
        return waitTime >= 30 && waitTime <= 40;
    }

    /**
     * Verifica se paciente é elegível para mensagem de fim de dia
     * TODOS os pacientes aguardando são elegíveis para fim de dia
     */
    isEligibleForEndOfDayMessage(patient) {
        // Verificar se é fim de dia (18h)
        const now = new Date();
        const hour = now.getHours();
        return hour >= 18;
    }



    /**
     * Configura seleção de pacientes
     */
    setupPatientSelection() {
        const checkboxes = document.querySelectorAll('.patient-checkbox');
        const selectAllCheckbox = document.getElementById('select-all-patients');
        
        // Event listener para seleção individual
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSelectedPatientsList();
                this.updateSelectAllCheckbox();
            });
        });
        
        // Event listener para selecionar todos
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
                this.updateSelectedPatientsList();
            });
        }
    }

    /**
     * Atualiza lista de pacientes selecionados
     */
    updateSelectedPatientsList() {
        const selectedCheckboxes = document.querySelectorAll('.patient-checkbox:checked');
        const selectedCount = selectedCheckboxes.length;
        
        // Atualizar contador se existir
        const counterElement = document.getElementById('selected-patients-count');
        if (counterElement) {
            counterElement.textContent = selectedCount;
        }
        
        // Habilitar/desabilitar botão de envio
        const sendButton = document.getElementById('send-messages-btn');
        if (sendButton) {
            sendButton.disabled = selectedCount === 0;
        }
    }

    /**
     * Atualiza checkbox "Selecionar Todos"
     */
    updateSelectAllCheckbox() {
        const checkboxes = document.querySelectorAll('.patient-checkbox');
        const selectAllCheckbox = document.getElementById('select-all-patients');
        
        if (selectAllCheckbox && checkboxes.length > 0) {
            const checkedCount = document.querySelectorAll('.patient-checkbox:checked').length;
            
            if (checkedCount === 0) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = false;
            } else if (checkedCount === checkboxes.length) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = true;
            } else {
                selectAllCheckbox.indeterminate = true;
            }
        }
    }

    /**
     * Atualiza horário da última verificação
     */
    updateLastCheckTime() {
        const lastCheckElement = document.getElementById('last-check');
        if (lastCheckElement) {
            const now = new Date();
            lastCheckElement.textContent = now.toLocaleTimeString('pt-BR');
        }
    }

    /**
     * Marca paciente como tendo recebido mensagem
     */
    markPatientAsProcessed(patient) {
        const patientKey = `${patient.name}_${patient.phone}_${patient.sectorId}`;
        this.processedPatients.add(patientKey);
        
        // Atualizar exibição
        this.displayPatients(this.patients);
        
        console.log(`Paciente ${patient.name} marcado como processado`);
    }

    /**
     * Função removida - substituída por gerenciador consolidado de timers
     */

    /**
     * Função removida - substituída por startCountdownTimer()
     */

    /**
     * Função removida - não está sendo usada
     */

    /**
     * Calcula contagem regressiva individual para um paciente
     */
    calculateIndividualCountdown(waitTime, minWaitTime, maxWaitTime, ignoreBusinessHours, endOfDayPaused) {
        const now = new Date();
        const currentHour = now.getHours();
        
        console.log(`🧮 Calculando para ${waitTime}min - Hora atual: ${currentHour}h`);
        
        // Verificar se mensagem de fim de dia está ativa e se é hora (17h55-18h00)
        if (!endOfDayPaused && currentHour >= 17 && currentHour < 18) {
            const endOfDayTime = new Date(now);
            // Usar configuração dinâmica do sistema
            const endHour = parseInt(this.systemConfig?.endOfDayTime?.split(':')[0] || '18');
            endOfDayTime.setHours(endHour, 0, 0, 0);
            const timeRemaining = endOfDayTime.getTime() - now.getTime();
            
            console.log(`🌅 Horário de fim de dia - Tempo restante: ${timeRemaining}ms`);
            
            return {
                timeString: this.formatTimeRemaining(timeRemaining),
                timeRemaining: timeRemaining,
                messageType: `Fim de dia - ${this.getActionCardName(this.systemConfig?.selectedActionCardEndDay)}`
            };
        }
        
        // Verificar se está fora do horário comercial (apenas se ignoreBusinessHours for false)
        const startHour = parseInt(this.systemConfig?.startOfDayTime?.split(':')[0] || '8');
        const endHour = parseInt(this.systemConfig?.endOfDayTime?.split(':')[0] || '18');
        if (!ignoreBusinessHours && (currentHour < startHour || currentHour >= endHour)) {
            const nextBusinessDay = new Date(now);
            nextBusinessDay.setDate(nextBusinessDay.getDate() + (nextBusinessDay.getDay() === 6 ? 2 : 1));
            // Usar configuração dinâmica do sistema (startHour já foi declarado acima)
            nextBusinessDay.setHours(startHour, 0, 0, 0);
            const timeRemaining = nextBusinessDay.getTime() - now.getTime();
            
            console.log(`📅 Fora do horário comercial - Próximo dia útil: ${nextBusinessDay}`);
            
            return {
                timeString: this.formatTimeRemaining(timeRemaining),
                timeRemaining: timeRemaining,
                messageType: `Fora do horário - ${this.getActionCardName(this.systemConfig?.selectedActionCard30Min)}`
            };
        }
        
        // Calcular tempo para mensagem de 30min baseado no tempo de espera atual
        if (waitTime < minWaitTime) {
            // Paciente ainda não atingiu o tempo mínimo
            const timeRemaining = (minWaitTime - waitTime) * 60 * 1000; // Converter para millisegundos
            
            console.log(`⏳ Ainda não atingiu tempo mínimo - Faltam: ${timeRemaining}ms`);
            
            return {
                timeString: this.formatTimeRemaining(timeRemaining),
                timeRemaining: timeRemaining,
                messageType: `${this.getActionCardName(this.systemConfig?.selectedActionCard30Min)} - ${minWaitTime}min`
            };
        } else if (waitTime >= minWaitTime && waitTime <= maxWaitTime) {
            // Paciente está no intervalo ideal - pode receber mensagem a qualquer momento
            const maxTimeRemaining = (maxWaitTime - waitTime) * 60 * 1000;
            
            console.log(`✅ No intervalo ideal - Tempo restante: ${maxTimeRemaining}ms`);
            
            return {
                timeString: this.formatTimeRemaining(maxTimeRemaining),
                timeRemaining: maxTimeRemaining,
                messageType: `${this.getActionCardName(this.systemConfig?.selectedActionCard30Min)} (PRONTO)`
            };
        } else {
            // Paciente já passou do tempo máximo - deve ter recebido mensagem
            console.log(`⚠️ Tempo excedido - ${waitTime}min > ${maxWaitTime}min`);
            
            return {
                timeString: '00:00',
                timeRemaining: 0,
                messageType: 'Tempo excedido'
            };
        }
    }

    /**
     * Formata tempo restante em string legível com segundos
     */
    formatTimeRemaining(timeRemaining) {
        if (timeRemaining <= 0) {
            return '00:00';
        }
        
        const minutes = Math.floor(timeRemaining / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Obtém estatísticas dos pacientes
     */
    getPatientStats() {
        const total = this.patients.length;
        const processed = this.processedPatients.size;
        const eligible30min = this.patients.filter(p => this.isEligibleFor30MinMessage(p)).length;
        const eligibleEndOfDay = this.patients.filter(p => this.isEligibleForEndOfDayMessage(p)).length;
        
        return {
            total,
            processed,
            eligible30min,
            eligibleEndOfDay,
            waiting: total - processed
        };
    }

    /**
     * Adiciona log de ação do usuário
     */
    async addUserActionLog(level, message, context, metadata = {}) {
        try {
            await fetch('/api/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    level,
                    message,
                    context,
                    metadata
                })
            });
        } catch (error) {
            console.error('Erro ao adicionar log de ação do usuário:', error);
        }
    }

    /**
     * Sistema Tab - Gerenciamento completo das configurações do sistema (agora na aba Configurações)
     */
    initializeSystemTab() {
        console.log('🔧 Inicializando configurações do sistema na aba Configurações...');
        
        // Elementos da interface
        this.systemElements = {
            // Horários
            startOfDayTime: document.getElementById('start-of-day-time'),
            endOfDayTime: document.getElementById('end-of-day-time'),
            logCleanupTime: document.getElementById('log-cleanup-time'),
            
            // Horários de sábado
            saturdayStartTime: document.getElementById('saturday-start-time'),
            saturdayEndTime: document.getElementById('saturday-end-time'),
            
            // Tempos de espera
            minWaitTime: document.getElementById('min-wait-time'),
            maxWaitTime: document.getElementById('max-wait-time'),
            
            // Botões
            saveBtn: document.getElementById('save-system-config-btn'),
            
            // Status
            configWarning: document.getElementById('config-warning'),
            configWarningText: document.getElementById('config-warning-text')
        };

        // Verificar se elementos foram encontrados
        console.log('🔍 Verificando elementos encontrados:');
        Object.entries(this.systemElements).forEach(([key, element]) => {
            if (element) {
                console.log(`   ✅ ${key}: encontrado`);
            } else {
                console.log(`   ❌ ${key}: NÃO encontrado`);
            }
        });

        // Configuração original para detectar mudanças
        this.originalSystemConfig = null;
        this.hasUnsavedChanges = false;

        // Event listeners
        this.setupSystemEventListeners();
        
        // Carregar configurações iniciais
        this.loadSystemConfig();
    }

    setupSystemEventListeners() {
        // Salvar configurações
        this.systemElements.saveBtn?.addEventListener('click', () => {
            this.saveSystemConfig();
        });

        // Detectar mudanças nos campos
        Object.values(this.systemElements).forEach(element => {
            if (element && (element.type === 'time' || element.type === 'number' || element.type === 'checkbox' || element.tagName === 'SELECT')) {
                element.addEventListener('change', () => {
                    this.detectConfigChanges();
                });
                element.addEventListener('input', () => {
                    this.detectConfigChanges();
                });
            }
        });

        // Validação em tempo real
        this.systemElements.minWaitTime?.addEventListener('input', () => {
            this.validateWaitTimes();
        });
        this.systemElements.maxWaitTime?.addEventListener('input', () => {
            this.validateWaitTimes();
        });
    }

    async loadSystemConfig() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            
            if (response.ok) {
                // CRÍTICO: Atualizar this.systemConfig para que generateNextMessageInfo funcione
                if (config.data) {
                    this.systemConfig = {
                        minWaitTime: parseInt(config.data.minWaitTime) || 30,
                        maxWaitTime: parseInt(config.data.maxWaitTime) || 40,
                        ignoreBusinessHours: config.data.ignoreBusinessHours === 'true' || config.data.ignoreBusinessHours === true,
                        endOfDayPaused: config.data.endOfDayPaused === 'true' || config.data.endOfDayPaused === true,
                        selectedActionCard30Min: config.data.selectedActionCard30Min,
                        selectedActionCard30MinDescription: config.data.selectedActionCard30MinDescription,
                        selectedActionCardEndDay: config.data.selectedActionCardEndDay,
                        selectedActionCardEndDayDescription: config.data.selectedActionCardEndDayDescription,
                        startOfDayTime: config.data.startOfDayTime || '08:00',
                        endOfDayTime: config.data.endOfDayTime || '18:00',
                        saturdayStartTime: config.data.saturdayStartTime || '08:00',
                        saturdayEndTime: config.data.saturdayEndTime || '12:00'
                    };
                    console.log('✅ systemConfig atualizado na aba Sistema:', this.systemConfig);
                }
                
                this.populateSystemConfig(config);
                this.originalSystemConfig = { ...config };
                this.hasUnsavedChanges = false;
                this.updateWarningState();
            } else {
                throw new Error(config.message || 'Erro ao carregar configurações');
            }
        } catch (error) {
            console.error('Erro ao carregar configurações do sistema:', error);
            this.showNotification('Erro ao carregar configurações do sistema', 'error');
        }
    }

    populateSystemConfig(config) {
        console.log('🔧 Populando configurações do sistema:', config);
        
        // Verificar se config tem estrutura aninhada (config.data) ou direta
        const configData = config.data || config;
        
        // Horários
        if (this.systemElements.startOfDayTime) {
            this.systemElements.startOfDayTime.value = configData.startOfDayTime || '08:00';
            console.log(`📅 startOfDayTime: ${configData.startOfDayTime || '08:00'}`);
        }
        if (this.systemElements.endOfDayTime) {
            this.systemElements.endOfDayTime.value = configData.endOfDayTime || '18:00';
            console.log(`📅 endOfDayTime: ${configData.endOfDayTime || '18:00'}`);
        }
        if (this.systemElements.logCleanupTime) {
            this.systemElements.logCleanupTime.value = configData.logCleanupTime || '23:59';
            console.log(`📅 logCleanupTime: ${configData.logCleanupTime || '23:59'}`);
        }

        // Horários de sábado
        if (this.systemElements.saturdayStartTime) {
            this.systemElements.saturdayStartTime.value = configData.saturdayStartTime || '08:00';
            console.log(`🗓️ saturdayStartTime: ${configData.saturdayStartTime || '08:00'}`);
        }
        if (this.systemElements.saturdayEndTime) {
            this.systemElements.saturdayEndTime.value = configData.saturdayEndTime || '12:00';
            console.log(`🗓️ saturdayEndTime: ${configData.saturdayEndTime || '12:00'}`);
        }

        // Tempos de espera
        if (this.systemElements.minWaitTime) {
            this.systemElements.minWaitTime.value = parseInt(configData.minWaitTime) || 30;
            console.log(`⏰ minWaitTime: ${parseInt(configData.minWaitTime) || 30}`);
        }
        if (this.systemElements.maxWaitTime) {
            this.systemElements.maxWaitTime.value = parseInt(configData.maxWaitTime) || 35;
            console.log(`⏰ maxWaitTime: ${parseInt(configData.maxWaitTime) || 35}`);
        }
        
        console.log('✅ Configurações populadas com sucesso');
    }

    async saveSystemConfig() {
        try {
            // Validar configurações antes de salvar
            if (!this.validateSystemConfig()) {
                return;
            }

            this.systemElements.saveBtn.disabled = true;

            const configData = this.collectSystemConfig();
            
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(configData)
            });

            const result = await response.json();

            if (response.ok) {
                this.originalSystemConfig = { ...configData };
                this.hasUnsavedChanges = false;
                this.updateWarningState();
                this.showNotification('Configurações do sistema salvas com sucesso!', 'success');
                
                // Logar a ação do usuário
                await this.addUserActionLog('info', 'Configurações Salvas', 'Usuário salvou configurações do sistema', {
                    startOfDayTime: configData.startOfDayTime,
                    endOfDayTime: configData.endOfDayTime,
                    minWaitTime: configData.minWaitTime,
                    maxWaitTime: configData.maxWaitTime
                });
                
                // Recarregar configurações para garantir sincronização
                setTimeout(() => this.loadSystemConfig(), 1000);
            } else {
                throw new Error(result.message || 'Erro ao salvar configurações');
            }
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            this.showNotification('Erro ao salvar configurações do sistema', 'error');
        } finally {
            this.systemElements.saveBtn.disabled = false;
        }
    }

    collectSystemConfig() {
        return {
            // Horários
            startOfDayTime: this.systemElements.startOfDayTime?.value || '08:00',
            endOfDayTime: this.systemElements.endOfDayTime?.value || '18:00',
            logCleanupTime: this.systemElements.logCleanupTime?.value || '23:59',
            
            // Horários de sábado
            saturdayStartTime: this.systemElements.saturdayStartTime?.value || '08:00',
            saturdayEndTime: this.systemElements.saturdayEndTime?.value || '12:00',
            
            // Tempos de espera
            minWaitTime: this.systemElements.minWaitTime?.value || '30',
            maxWaitTime: this.systemElements.maxWaitTime?.value || '35'
        };
    }

    validateSystemConfig() {
        let isValid = true;
        const errors = [];

        // Validar tempos de espera
        const minWait = parseInt(this.systemElements.minWaitTime?.value);
        const maxWait = parseInt(this.systemElements.maxWaitTime?.value);

        if (minWait >= maxWait) {
            errors.push('O tempo máximo deve ser maior que o tempo mínimo');
            isValid = false;
        }

        if (minWait < 1 || maxWait < 1) {
            errors.push('Os tempos de espera devem ser maiores que 0');
            isValid = false;
        }

        // Validar horários
        const startTime = this.systemElements.startOfDayTime?.value;
        const endTime = this.systemElements.endOfDayTime?.value;

        if (startTime && endTime && startTime >= endTime) {
            errors.push('O horário de fim do dia deve ser posterior ao horário de início');
            isValid = false;
        }

        // Validar horários de sábado
        const saturdayStartTime = this.systemElements.saturdayStartTime?.value;
        const saturdayEndTime = this.systemElements.saturdayEndTime?.value;

        if (saturdayStartTime && saturdayEndTime && saturdayStartTime >= saturdayEndTime) {
            errors.push('O horário de fim do sábado deve ser posterior ao horário de início do sábado');
            isValid = false;
        }

        if (!isValid) {
            this.showNotification(`Erro de validação: ${errors.join(', ')}`, 'error');
        }

        return isValid;
    }

    validateWaitTimes() {
        const minWait = parseInt(this.systemElements.minWaitTime?.value);
        const maxWait = parseInt(this.systemElements.maxWaitTime?.value);
        
        if (minWait && maxWait && minWait >= maxWait) {
            this.systemElements.maxWaitTime.setCustomValidity('O tempo máximo deve ser maior que o mínimo');
        } else {
            this.systemElements.maxWaitTime.setCustomValidity('');
        }
    }

    detectConfigChanges() {
        if (!this.originalSystemConfig) return;

        const currentConfig = this.collectSystemConfig();
        const hasChanges = JSON.stringify(currentConfig) !== JSON.stringify(this.originalSystemConfig);
        
        if (hasChanges !== this.hasUnsavedChanges) {
            this.hasUnsavedChanges = hasChanges;
            this.updateWarningState();
        }
    }

    updateWarningState() {
        if (this.hasUnsavedChanges) {
            this.systemElements.configWarning?.classList.remove('d-none');
            this.systemElements.configWarningText.textContent = 'Há alterações não salvas.';
        } else {
            this.systemElements.configWarning?.classList.add('d-none');
        }
    }

    /**
     * Métricas Tab - Implementação completa das métricas do sistema
     */
    initializeMetricsTab() {
        // Elementos da interface de métricas
        this.metricsElements = {
            // Métricas de Mensagens
            messagesSent: document.getElementById('messages-sent'),
            messagesFailed: document.getElementById('messages-failed'),
            messages30Min: document.getElementById('messages-30min'),
            messagesEndDay: document.getElementById('messages-endday'),
            
            // Métricas de Sistema
            systemUptime: document.getElementById('system-uptime'),
            totalRequests: document.getElementById('total-requests'),
            apiSuccess: document.getElementById('api-success'),
            apiFailures: document.getElementById('api-failures'),
            
            // Botão de atualizar
            refreshBtn: document.getElementById('refresh-metrics-btn')
        };

        // Setup event listeners
        this.setupMetricsEventListeners();
        
        // Carregar métricas iniciais
        this.loadMetrics();
        
        // Auto-refresh agora é feito pelo gerenciador consolidado de timers
    }

    setupMetricsEventListeners() {
        // Botão de atualizar métricas
        this.metricsElements.refreshBtn?.addEventListener('click', () => {
            this.loadMetrics();
        });
    }

    async loadMetrics() {
        try {
            // Carregar métricas de mensagens
            await this.loadMessageMetrics();
            
            // Carregar métricas de sistema
            await this.loadSystemMetrics();
            
        } catch (error) {
            console.error('Erro ao carregar métricas:', error);
            this.showNotification('Erro ao carregar métricas', 'error');
        }
    }

    async loadMessageMetrics() {
        try {
            // Carregar métricas persistentes do backend
            const response = await fetch('/api/status');
            
            if (response.ok) {
                const data = await response.json();
                
                // Usar métricas persistentes do backend
                const sent = data.messageMetrics?.totalSent || 0;
                const failed = data.messageMetrics?.totalFailed || 0;
                const thirtyMin = data.messageMetrics?.messages30Min || 0;
                const endDay = data.messageMetrics?.messagesEndDay || 0;
                
                this.updateMessageMetrics(sent, failed, thirtyMin, endDay);
            } else {
                // Se não conseguir carregar, usar zeros
                this.updateMessageMetrics(0, 0, 0, 0);
            }
        } catch (error) {
            console.log('Dados de mensagens não disponíveis, usando zeros');
            this.updateMessageMetrics(0, 0, 0, 0);
        }
    }

    async loadSystemMetrics() {
        try {
            // Tentar carregar dados do sistema
            const response = await fetch('/api/status');
            
            if (response.ok) {
                const data = await response.json();
                
                // Extrair métricas do sistema
                const uptimeMs = data.uptime || 0;
                const uptime = this.formatUptime(uptimeMs);
                const requests = data.totalRequests || 0;
                const apiSuccess = data.apiSuccess || 0;
                const apiFailures = data.apiFailures || 0;
                
                this.updateSystemMetrics(uptime, requests, apiSuccess, apiFailures);
            } else {
                // Se não conseguir carregar, usar valores padrão
                this.updateSystemMetrics('--', 0, 0, 0);
            }
        } catch (error) {
            console.log('Dados do sistema não disponíveis, usando valores padrão');
            this.updateSystemMetrics('--', 0, 0, 0);
        }
    }

    updateMessageMetrics(sent, failed, thirtyMin, endDay) {
        this.updateMetricValue(this.metricsElements.messagesSent, sent);
        this.updateMetricValue(this.metricsElements.messagesFailed, failed);
        this.updateMetricValue(this.metricsElements.messages30Min, thirtyMin);
        this.updateMetricValue(this.metricsElements.messagesEndDay, endDay);
    }

    updateSystemMetrics(uptime, requests, apiSuccess, apiFailures) {
        this.updateMetricValue(this.metricsElements.systemUptime, uptime);
        this.updateMetricValue(this.metricsElements.totalRequests, requests);
        this.updateMetricValue(this.metricsElements.apiSuccess, apiSuccess);
        this.updateMetricValue(this.metricsElements.apiFailures, apiFailures);
    }

    updateMetricValue(element, value) {
        if (element) {
            const oldValue = element.textContent;
            element.textContent = value;
            
            // Adicionar animação se o valor mudou
            if (oldValue !== value.toString()) {
                element.classList.add('updated');
                setTimeout(() => {
                    element.classList.remove('updated');
                }, 600);
            }
        }
    }

    formatUptime(uptimeMs) {
        if (!uptimeMs || uptimeMs === 0) return '--';
        
        const seconds = Math.floor(uptimeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Limpar interval quando necessário
    destroyMetricsTab() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }
    }

    /**
     * Logs Tab - Sistema de logs de ações do usuário
     */
    initializeLogsTab() {
        // Elementos da interface de logs
        this.logsElements = {
            container: document.getElementById('logs-container'),
            levelFilter: document.getElementById('log-level-filter'),
            exportBtn: document.getElementById('export-logs-btn'),
            clearBtn: document.getElementById('clear-logs-btn')
        };

        // Setup event listeners
        this.setupLogsEventListeners();
        
        // Carregar logs iniciais
        this.loadUserLogs();
    }

    setupLogsEventListeners() {
        // Filtro por nível
        this.logsElements.levelFilter?.addEventListener('change', () => {
            this.loadUserLogs();
        });

        // Exportar logs
        this.logsElements.exportBtn?.addEventListener('click', () => {
            this.exportUserLogs();
        });

        // Limpar logs
        this.logsElements.clearBtn?.addEventListener('click', () => {
            this.clearUserLogs();
        });
    }

    async loadUserLogs() {
        try {
            const level = this.logsElements.levelFilter?.value || '';
            
            // Construir URL com parâmetros condicionais
            let url = '/api/logs/user?limit=100';
            if (level && level.trim() !== '') {
                url += `&level=${encodeURIComponent(level)}`;
            }
            
            console.log(`📋 Carregando logs com URL: ${url}`);
            console.log(`📋 Filtro selecionado: "${level}"`);
            
            const response = await fetch(url);
            const result = await response.json();
            
            console.log(`📋 Resposta da API:`, result);
            
            if (response.ok && result.success) {
                console.log(`📋 Exibindo ${result.data.length} logs`);
                this.displayUserLogs(result.data);
            } else {
                console.error('Erro na resposta da API:', result);
                this.displayUserLogs([]);
            }
        } catch (error) {
            console.error('Erro ao carregar logs do usuário:', error);
            this.displayUserLogs([]);
        }
    }

    displayUserLogs(logs) {
        const container = this.logsElements.container;
        if (!container) return;

        if (logs.length === 0) {
            container.innerHTML = `
                <div class="text-muted text-center py-4">
                    <i class="bi bi-journal-x me-2"></i>
                    Nenhum log de usuário disponível
                </div>
            `;
            return;
        }

        const logsHtml = logs.map(log => {
            const levelClass = this.getLogLevelClass(log.level);
            const levelIcon = this.getLogLevelIcon(log.level);
            const formattedDate = new Date(log.timestamp).toLocaleString('pt-BR');
            
            return `
                <div class="log-entry border-start border-3 ${levelClass} mb-2 p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="d-flex align-items-center">
                            <span class="log-level badge me-2">
                                <i class="bi ${levelIcon} me-1"></i>${log.level.toUpperCase()}
                            </span>
                            <strong class="log-action">${this.escapeHtml(log.action)}</strong>
                        </div>
                        <small class="text-muted log-time">${formattedDate}</small>
                    </div>
                    <div class="log-details text-muted mb-2">
                        ${this.escapeHtml(log.details)}
                    </div>
                    ${log.metadata && Object.keys(log.metadata).length > 0 ? `
                        <div class="log-metadata">
                            <small class="text-muted">
                                <i class="bi bi-info-circle me-1"></i>
                                ${this.formatMetadata(log.metadata)}
                            </small>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = logsHtml;
        
        // Auto-scroll para o topo para mostrar logs mais recentes
        container.scrollTop = 0;
    }


    formatMetadata(metadata) {
        const relevantFields = [];
        
        if (metadata.oldValue && metadata.newValue) {
            relevantFields.push(`${metadata.oldValue} → ${metadata.newValue}`);
        }
        
        if (metadata.actionCard) {
            relevantFields.push(`Action Card: ${metadata.actionCard}`);
        }
        
        if (metadata.patientCount) {
            relevantFields.push(`${metadata.patientCount} pacientes`);
        }
        
        return relevantFields.length > 0 ? relevantFields.join(' | ') : 'Sem detalhes adicionais';
    }

    async exportUserLogs() {
        try {
            const response = await fetch('/api/logs/user?limit=1000');
            const result = await response.json();
            
            if (response.ok && result.success) {
                const dataStr = JSON.stringify(result.data, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                const exportFileName = `user_logs_${new Date().toISOString().split('T')[0]}.json`;
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileName);
                linkElement.click();
                
                this.showNotification('Logs exportados com sucesso!', 'success');
                
                // Logar a própria ação de exportar
                await this.addUserActionLog('info', 'Exportar Logs', 'Usuário exportou logs do sistema');
            } else {
                throw new Error('Erro ao obter logs para exportação');
            }
        } catch (error) {
            console.error('Erro ao exportar logs:', error);
            this.showNotification('Erro ao exportar logs', 'error');
        }
    }

    async clearUserLogs() {
        try {
            const response = await fetch('/api/logs/user', {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showNotification('Logs limpos com sucesso!', 'success');
                this.loadUserLogs(); // Recarregar (deve mostrar vazio)
            } else {
                throw new Error(result.message || 'Erro ao limpar logs');
            }
        } catch (error) {
            console.error('Erro ao limpar logs:', error);
            this.showNotification('Erro ao limpar logs', 'error');
        }
    }

    /**
     * Adiciona log de ação do usuário
     */
    async addUserActionLog(level, action, details, metadata = {}) {
        try {
            await fetch('/api/logs/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    level,
                    action,
                    details,
                    metadata
                })
            });
        } catch (error) {
            console.error('Erro ao adicionar log de ação do usuário:', error);
        }
    }

}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.automationInterface = new AutomationInterface();
});

// Fallback if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
} else {
    // DOM is already loaded
    window.automationInterface = new AutomationInterface();
}
