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

    initializeApp() {
        try {
            console.log('Inicializando aplicação...');
            this.setupEventListeners();
            this.setupRouter();
            this.initializeExclusionLists();
            this.initializeFlowControl();
            this.initializePatientSelection();
            this.startRealtimeTimer(); // Iniciar timer em tempo real
            
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
                'metricas': 'Métricas',
                'sistema': 'Informações do Sistema'
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

        // Refresh status button
        const refreshStatusBtn = document.getElementById('refresh-status-btn');
        if (refreshStatusBtn) {
            refreshStatusBtn.addEventListener('click', () => {
                this.loadStatus();
            });
        }

        // Refresh metrics button
        const refreshMetricsBtn = document.getElementById('refresh-metrics-btn');
        if (refreshMetricsBtn) {
            refreshMetricsBtn.addEventListener('click', () => {
                this.loadMetrics();
            });
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

        // Action card selection - geral (legacy)
        const actionCardSelect = document.getElementById('action-card-select');
        if (actionCardSelect) {
            actionCardSelect.addEventListener('change', (e) => {
                const selectedCardId = e.target.value;
                if (selectedCardId) {
                    const selectedOption = e.target.selectedOptions[0];
                    const cardName = selectedOption.textContent;
                    
                    this.addUserActionLog('info', 
                        `Card de ação geral selecionado: ${cardName}`, 
                        'Seleção de Card',
                        { 
                            cardId: selectedCardId,
                            cardName: cardName,
                            type: 'general'
                        }
                    );
                }
            });
        }
    }

    loadRouteData(route) {
        switch (route) {
            case 'dashboard':
                this.loadStatus();
                this.loadMetrics();
                break;
            case 'atendimentos':
                this.loadPatients();
                // Always sync system status when loading patients
                this.checkFlowState();
                break;
            case 'configuracoes':
                this.loadActionCards();
                this.loadSectors();
                this.loadChannels();
                this.loadMessageConfig();
                // Always sync system status when loading config
                this.checkFlowState();
                break;
            case 'metricas':
                this.loadMetrics();
                // Always sync system status when loading metrics
                this.checkFlowState();
                break;
            case 'logs':
                this.loadLogs();
                // Always sync system status when loading logs
                this.checkFlowState();
                break;
            case 'sistema':
                // Always sync system status when loading system info
                this.checkFlowState();
                break;
        }
    }

    async loadPatients() {
        try {
            console.log('Carregando pacientes...');
            
            // Show loading state
            const loadingElement = document.getElementById('loading-patients');
            const tableContainer = document.getElementById('patients-table-container');
            
            if (loadingElement) loadingElement.classList.remove('d-none');
            if (tableContainer) tableContainer.classList.add('d-none');

            const response = await fetch('/api/patients');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar pacientes');
            }

            this.displayPatients(data.patients || []);
            
            // Update total waiting count in dashboard
            const totalWaitingElement = document.getElementById('total-waiting');
            if (totalWaitingElement) {
                totalWaitingElement.textContent = data.total || 0;
            }

            // Update last check time
            const lastCheckElement = document.getElementById('last-check');
            if (lastCheckElement && data.lastUpdate) {
                const updateTime = new Date(data.lastUpdate);
                lastCheckElement.textContent = updateTime.toLocaleTimeString();
            }

        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
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
        const tbody = document.getElementById('patients-tbody');
        if (!tbody) return;

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

        tbody.innerHTML = patients.map(patient => `
            <tr>
                <td>
                    <input type="checkbox" class="form-check-input patient-checkbox" 
                           data-patient-id="${patient.id}" 
                           data-patient-name="${this.escapeHtml(patient.name)}"
                           data-patient-phone="${this.escapeHtml(patient.phone || patient.number || '')}">
                </td>
                <td>${this.escapeHtml(patient.name)}</td>
                <td>${this.escapeHtml(patient.phone || patient.number || '')}</td>
                <td>${this.escapeHtml(patient.sectorName)}</td>
                <td>${this.formatWaitTime(patient.waitTimeMinutes)}</td>
                <td>
                    <span class="badge bg-warning">Aguardando</span>
                </td>
            </tr>
        `).join('');

        // Adicionar event listeners para os checkboxes
        this.setupPatientSelection();
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

    async loadStatus() {
        try {
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
                totalWaitingElement.textContent = statusData.monitoringStats.totalPatients || 0;
            }

            // Update 30min messages today
            const messages30MinElement = document.getElementById('messages-30min');
            if (messages30MinElement && statusData.monitoringStats) {
                messages30MinElement.textContent = statusData.monitoringStats.patientsOver30Min || 0;
            }

            // Update end of day messages
            const messagesEndDayElement = document.getElementById('messages-endday');
            if (messagesEndDayElement && statusData.monitoringStats) {
                messagesEndDayElement.textContent = statusData.monitoringStats.patientsOver30Min || 0; // Using same data for now
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

    async loadMetrics() {
        try {
            const response = await fetch('/api/metrics');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar métricas');
            }

            // Update metrics elements with real data
            this.updateDashboardMetricsData(data);

        } catch (error) {
            console.error('Erro ao carregar métricas:', error);
            this.showError('Erro ao carregar métricas do sistema');
        }
    }

    updateDashboardMetricsData(metricsData) {
        try {
            // Update messages sent
            const messagesSentElement = document.getElementById('metrics-messages-sent');
            if (messagesSentElement) {
                const messagesSent = metricsData.messages?.totalSent || 0;
                messagesSentElement.textContent = messagesSent;
            }

            // Update API calls
            const apiCallsElement = document.getElementById('metrics-api-calls');
            if (apiCallsElement) {
                const apiCalls = (metricsData.system?.apiCallsSuccessful || 0) + (metricsData.system?.apiCallsFailed || 0);
                apiCallsElement.textContent = apiCalls;
            }

            // Update average response time
            const avgResponseElement = document.getElementById('metrics-avg-response');
            if (avgResponseElement) {
                const avgResponse = metricsData.system?.averageApiResponseTime || metricsData.messages?.averageResponseTime || 0;
                avgResponseElement.textContent = `${Math.round(avgResponse)}ms`;
            }

            // Update error rate
            const errorRateElement = document.getElementById('metrics-error-rate');
            if (errorRateElement) {
                const totalApiCalls = (metricsData.system?.apiCallsSuccessful || 0) + (metricsData.system?.apiCallsFailed || 0);
                const errorRate = totalApiCalls > 0 ? 
                    Math.round((metricsData.system?.apiCallsFailed || 0) / totalApiCalls * 100) : 0;
                errorRateElement.textContent = `${errorRate}%`;
            }

            // Update detailed metrics if available
            this.updateDetailedMetrics(metricsData);

        } catch (error) {
            console.error('Erro ao atualizar métricas do dashboard:', error);
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
            console.log('📋 Carregando cartões de ação...');
            
            const response = await fetch('/api/action-cards');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao carregar cartões de ação');
            }

            // Verificar se é fallback
            if (result.fallback) {
                console.warn('⚠️ Usando dados de fallback para cartões de ação');
                this.showWarning('Usando dados de exemplo - API não disponível');
            }

            console.log(`📋 Carregados ${result.total || 0} cartões de ação`);
            this.displayActionCards(result.data || result);

        } catch (error) {
            console.error('❌ Erro ao carregar cartões de ação:', error);
            this.showError('Erro ao carregar cartões de ação: ' + error.message);
        }
    }

    displayActionCards(actionCards) {
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
                
                console.log(`📋 Exibindo ${actionCards.length} cartões de ação no seletor ${selectId}`);
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Nenhum cartão disponível';
                selectElement.appendChild(option);
                console.log(`📋 Nenhum cartão de ação encontrado para ${selectId}`);
            }
        };

        // Popular os três selects
        populateSelect('action-card-30min-select', 'Selecione cartão para 30min...');
        populateSelect('action-card-endday-select', 'Selecione cartão para fim de dia...');
        populateSelect('action-card-select', 'Selecione cartão geral...');
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
        // Update sector filter in atendimentos page
        const sectorFilter = document.getElementById('sector-filter');
        if (sectorFilter) {
            sectorFilter.innerHTML = '<option value="">Todos os Setores</option>';
            
            if (sectors && sectors.length > 0) {
                sectors.forEach(sector => {
                    const option = document.createElement('option');
                    option.value = sector.id;
                    option.textContent = sector.name;
                    sectorFilter.appendChild(option);
                });
            }
        }

        // Update sector select in configuracoes page (Listas de Exceção)
        const sectorSelect = document.getElementById('sector-select');
        if (sectorSelect) {
            sectorSelect.innerHTML = '<option value="">Selecione um setor...</option>';
            
            if (sectors && sectors.length > 0) {
                sectors.forEach(sector => {
                    const option = document.createElement('option');
                    option.value = sector.id;
                    option.textContent = sector.name;
                    sectorSelect.appendChild(option);
                });
            }
        }

        // Store sectors for later use
        this.availableSectors = sectors || [];
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
        // Update channel select in configuracoes page (Listas de Exceção)
        const channelSelect = document.getElementById('channel-select');
        if (channelSelect) {
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
            }
        }

        // Store channels for later use
        this.availableChannels = channels || [];
    }

    // Métodos para gerenciar listas de exclusão
    initializeExclusionLists() {
        // Initialize excluded sectors list
        this.excludedSectors = [];
        this.excludedChannels = [];
        this.availableChannels = [];

        // Add event listeners
        const addSectorBtn = document.getElementById('add-sector-btn');
        const addChannelBtn = document.getElementById('add-channel-btn');
        const sectorSelect = document.getElementById('sector-select');
        const channelSelect = document.getElementById('channel-select');

        if (addSectorBtn) {
            addSectorBtn.addEventListener('click', () => this.addSectorToExclusion());
        }

        if (addChannelBtn) {
            addChannelBtn.addEventListener('click', () => this.addChannelToExclusion());
        }

        if (sectorSelect) {
            sectorSelect.addEventListener('change', () => this.onSectorSelectChange());
        }

        if (channelSelect) {
            channelSelect.addEventListener('change', () => this.onChannelSelectChange());
        }

        // Load existing exclusions
        this.loadExcludedSectors();
        this.loadExcludedChannels();

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
            
            const response = await fetch('/api/flow/pause', {
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
            this.addUserActionLog('info', 
                'Fluxo de mensagens pausado pelo usuário', 
                'Controle de Fluxo',
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
            
            const response = await fetch('/api/flow/resume', {
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
            this.addUserActionLog('info', 
                'Fluxo de mensagens retomado pelo usuário', 
                'Controle de Fluxo',
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
            
            // Reset select
            sectorSelect.value = '';
            
            this.showSuccess(`Setor "${sector.name}" adicionado à lista de exclusão`);
        }
    }

    addChannelToExclusion() {
        const channelSelect = document.getElementById('channel-select');
        const selectedChannelId = channelSelect.value;

        if (!selectedChannelId) {
            this.showError('Selecione um canal para adicionar à lista de exclusão');
            return;
        }

        // Check if already excluded
        if (this.excludedChannels.some(channel => channel.id === selectedChannelId)) {
            this.showError('Este canal já está na lista de exclusão');
            return;
        }

        // Find channel details
        const channel = this.availableChannels.find(c => c.id === selectedChannelId);
        if (channel) {
            this.excludedChannels.push(channel);
            this.updateExcludedChannelsDisplay();
            this.saveExcludedChannels();
            
            // Reset select
            channelSelect.value = '';
            
            const displayName = channel.description || channel.identifier || `Canal ${channel.id}`;
            this.showSuccess(`Canal "${displayName}" adicionado à lista de exclusão`);
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

    removeChannelFromExclusion(channelId) {
        this.excludedChannels = this.excludedChannels.filter(channel => channel.id !== channelId);
        this.updateExcludedChannelsDisplay();
        this.saveExcludedChannels();
        this.showSuccess('Canal removido da lista de exclusão');
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

    updateExcludedChannelsDisplay() {
        const container = document.getElementById('excluded-channels-list');
        if (!container) return;

        if (this.excludedChannels.length === 0) {
            container.innerHTML = '<small class="text-muted">Nenhum canal excluído</small>';
            return;
        }

        // Clear container
        container.innerHTML = '';

        // Create elements for each excluded channel
        this.excludedChannels.forEach(channel => {
            const channelDiv = document.createElement('div');
            channelDiv.className = 'd-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded border';
            
            const displayName = channel.description || channel.identifier || `Canal ${channel.id}`;
            const typeInfo = channel.type ? ` (${getChannelTypeName(channel.type)})` : '';
            
            channelDiv.innerHTML = `
                <div>
                    <strong>${this.escapeHtml(displayName)}</strong>
                    <br>
                    <small class="text-muted">ID: ${channel.id}${typeInfo}</small>
                </div>
                <button class="btn btn-outline-danger btn-sm remove-channel-btn" data-channel-id="${channel.id}">
                    <i class="bi bi-x"></i>
                </button>
            `;

            // Add event listener to the remove button
            const removeBtn = channelDiv.querySelector('.remove-channel-btn');
            removeBtn.addEventListener('click', () => {
                this.removeChannelFromExclusion(channel.id);
            });

            container.appendChild(channelDiv);
        });
    }

    onSectorSelectChange() {
        const sectorSelect = document.getElementById('sector-select');
        const addSectorBtn = document.getElementById('add-sector-btn');
        
        if (sectorSelect && addSectorBtn) {
            addSectorBtn.disabled = !sectorSelect.value;
        }
    }

    onChannelSelectChange() {
        const channelSelect = document.getElementById('channel-select');
        const addChannelBtn = document.getElementById('add-channel-btn');
        
        if (channelSelect && addChannelBtn) {
            addChannelBtn.disabled = !channelSelect.value;
        }
    }

    saveExcludedSectors() {
        localStorage.setItem('excludedSectors', JSON.stringify(this.excludedSectors));
    }

    saveExcludedChannels() {
        localStorage.setItem('excludedChannels', JSON.stringify(this.excludedChannels));
    }

    loadExcludedSectors() {
        try {
            const saved = localStorage.getItem('excludedSectors');
            if (saved) {
                this.excludedSectors = JSON.parse(saved);
                this.updateExcludedSectorsDisplay();
            }
        } catch (error) {
            console.error('Erro ao carregar setores excluídos:', error);
        }
    }

    loadExcludedChannels() {
        try {
            const saved = localStorage.getItem('excludedChannels');
            if (saved) {
                this.excludedChannels = JSON.parse(saved);
                this.updateExcludedChannelsDisplay();
            }
        } catch (error) {
            console.error('Erro ao carregar canais excluídos:', error);
        }
    }

    async loadMessageConfig() {
        try {
            console.log('📋 Carregando configurações de mensagem...');
            
            const response = await fetch('/api/config');
            const result = await response.json();
            
            if (response.ok && result) {
                console.log('📋 Configurações recebidas da API:', result);
                
                // Update action card selects
                const actionCardSelect = document.getElementById('action-card-select');
                const actionCard30MinSelect = document.getElementById('action-card-30min-select');
                const actionCardEndDaySelect = document.getElementById('action-card-endday-select');
                
                if (actionCardSelect) {
                    if (result.selectedActionCard) {
                        actionCardSelect.value = result.selectedActionCard;
                        console.log('✅ Action card geral selecionado:', result.selectedActionCard);
                    } else {
                        console.log('⚠️ Nenhum action card geral selecionado');
                    }
                } else {
                    console.log('❌ Elemento action-card-select não encontrado');
                }

                if (actionCard30MinSelect) {
                    if (result.selectedActionCard30Min) {
                        actionCard30MinSelect.value = result.selectedActionCard30Min;
                        console.log('✅ Action card 30min selecionado:', result.selectedActionCard30Min);
                    } else {
                        console.log('⚠️ Nenhum action card 30min selecionado');
                    }
                } else {
                    console.log('❌ Elemento action-card-30min-select não encontrado');
                }

                if (actionCardEndDaySelect) {
                    if (result.selectedActionCardEndDay) {
                        actionCardEndDaySelect.value = result.selectedActionCardEndDay;
                        console.log('✅ Action card fim de dia selecionado:', result.selectedActionCardEndDay);
                    } else {
                        console.log('⚠️ Nenhum action card fim de dia selecionado');
                    }
                } else {
                    console.log('❌ Elemento action-card-endday-select não encontrado');
                }
                
                
                console.log('✅ Configurações de mensagem carregadas:', result);
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
            
            // Get selected values
            const actionCardSelect = document.getElementById('action-card-select');
            const actionCard30MinSelect = document.getElementById('action-card-30min-select');
            const actionCardEndDaySelect = document.getElementById('action-card-endday-select');
            
            const selectedActionCard = actionCardSelect ? actionCardSelect.value : '';
            const selectedActionCard30Min = actionCard30MinSelect ? actionCard30MinSelect.value : '';
            const selectedActionCardEndDay = actionCardEndDaySelect ? actionCardEndDaySelect.value : '';
            
            // Validate that at least one is selected
            if (!selectedActionCard && !selectedActionCard30Min && !selectedActionCardEndDay) {
                this.showError('Selecione pelo menos um cartão de ação');
                return;
            }
            
            // Prepare configuration data
            const configData = {
                selectedActionCard: selectedActionCard || undefined,
                selectedActionCard30Min: selectedActionCard30Min || undefined,
                selectedActionCardEndDay: selectedActionCardEndDay || undefined
            };
            
            console.log('💾 Dados de configuração:', configData);
            
            // Send to API
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(configData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showSuccess('Configurações de mensagem salvas com sucesso!');
                console.log('✅ Configurações salvas:', result);
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

    // Métodos para gerenciar seleção de pacientes
    initializePatientSelection() {
        this.selectedPatients = [];
        this.setupPatientSelectionButtons();
    }

    setupPatientSelectionButtons() {
        // Botão "Selecionar Todos"
        const selectAllCheckbox = document.getElementById('select-all-patients');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleAllPatients(e.target.checked);
            });
        }

        // Botões de ação
        const sendMessageBtn = document.getElementById('send-message-btn');
        const clearSelectionBtn = document.getElementById('clear-selection-btn');

        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', () => this.openSendMessageModal());
        }

        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => this.clearSelection());
        }

        // Event listeners para o modal de envio de mensagem
        this.setupModalEventListeners();
    }

    setupPatientSelection() {
        const checkboxes = document.querySelectorAll('.patient-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updatePatientSelection();
            });
        });
    }

    toggleAllPatients(checked) {
        const checkboxes = document.querySelectorAll('.patient-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updatePatientSelection();
    }

    updatePatientSelection() {
        const checkboxes = document.querySelectorAll('.patient-checkbox:checked');
        this.selectedPatients = Array.from(checkboxes).map(checkbox => ({
            id: checkbox.dataset.patientId,
            name: checkbox.dataset.patientName,
            phone: checkbox.dataset.patientPhone || '', // Garantir que sempre tenha um valor
            number: checkbox.dataset.patientPhone || '' // Para compatibilidade
        }));

        const actionsContainer = document.getElementById('selected-patients-actions');
        const selectedCount = document.getElementById('selected-count');
        const selectAllCheckbox = document.getElementById('select-all-patients');

        if (actionsContainer && selectedCount) {
            if (this.selectedPatients.length > 0) {
                actionsContainer.classList.remove('d-none');
                selectedCount.textContent = this.selectedPatients.length;
            } else {
                actionsContainer.classList.add('d-none');
            }
        }

        // Atualizar checkbox "Selecionar Todos"
        if (selectAllCheckbox) {
            const totalCheckboxes = document.querySelectorAll('.patient-checkbox').length;
            const checkedCheckboxes = document.querySelectorAll('.patient-checkbox:checked').length;
            selectAllCheckbox.checked = checkedCheckboxes === totalCheckboxes && totalCheckboxes > 0;
            selectAllCheckbox.indeterminate = checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes;
        }
    }

    clearSelection() {
        const checkboxes = document.querySelectorAll('.patient-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        const selectAllCheckbox = document.getElementById('select-all-patients');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }

        this.updatePatientSelection();
    }

    setupModalEventListeners() {
        // Botão de fechar modal
        const closeModalBtn = document.getElementById('close-send-message-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideModal('sendMessageModal'));
        }

        // Botão de cancelar
        const cancelBtn = document.getElementById('cancel-send-message-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideModal('sendMessageModal'));
        }

        // Botão de confirmar envio
        const confirmBtn = document.getElementById('confirm-send-message-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.sendMessageToSelectedPatients());
        }
    }

    async openSendMessageModal() {
        if (this.selectedPatients.length === 0) {
            this.showError('Selecione pelo menos um atendimento');
            return;
        }

        // Carregar configurações de mensagem antes de determinar o tipo
        await this.loadMessageConfig();
        
        // Determinar tipo de mensagem baseado na configuração
        this.determineMessageType();
        
        // Atualizar lista de pacientes selecionados
        this.updateSelectedPatientsList('selected-patients-list');

        // Mostrar modal
        const modal = document.getElementById('sendMessageModal');
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    }

    determineMessageType() {
        const messageTypeInfo = document.getElementById('message-type-info');
        if (!messageTypeInfo) return;

        // Verificar qual tipo está selecionado nas configurações
        const actionCardSelect = document.getElementById('action-card-select');
        
        console.log('🔍 Verificando tipo de mensagem...');
        console.log('Action card select:', actionCardSelect ? actionCardSelect.value : 'não encontrado');
        
        if (actionCardSelect && actionCardSelect.value) {
            const selectedOption = actionCardSelect.options[actionCardSelect.selectedIndex];
            messageTypeInfo.innerHTML = `Enviando <strong>Cartão de Ação</strong>: ${selectedOption.textContent}`;
            this.currentMessageType = 'action_card';
            this.currentMessageId = actionCardSelect.value;
            console.log('✅ Tipo de mensagem definido como action_card:', this.currentMessageId);
        } else {
            messageTypeInfo.innerHTML = '<span class="text-warning">⚠️ Nenhum cartão de ação selecionado nas configurações</span>';
            this.currentMessageType = null;
            this.currentMessageId = null;
            console.log('❌ Nenhum tipo de mensagem selecionado');
        }
    }

    loadActionCardsForModal(selectId) {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) return;

        selectElement.innerHTML = '<option value="">Carregando cartões...</option>';

        // Usar os cartões já carregados ou carregar novamente
        if (this.availableActionCards && this.availableActionCards.length > 0) {
            this.populateActionCardSelect(selectElement, this.availableActionCards);
        } else {
            this.loadActionCards().then(() => {
                this.populateActionCardSelect(selectElement, this.availableActionCards || []);
            });
        }
    }


    populateActionCardSelect(selectElement, actionCards) {
        selectElement.innerHTML = '<option value="">Selecione um cartão de ação...</option>';
        
        if (actionCards && actionCards.length > 0) {
            actionCards.forEach(card => {
                const option = document.createElement('option');
                option.value = card.id;
                const displayName = card.description || card.name || card.title || `Cartão ${card.id}`;
                option.textContent = displayName;
                selectElement.appendChild(option);
            });
        }
    }


    updateSelectedPatientsList(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.selectedPatients.length === 0) {
            container.innerHTML = '<div class="text-muted">Nenhum atendimento selecionado</div>';
            return;
        }

        container.innerHTML = this.selectedPatients.map(patient => `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                <div>
                    <strong>${this.escapeHtml(patient.name)}</strong>
                    <br>
                    <small class="text-muted">Telefone: ${this.escapeHtml(patient.phone || 'Não informado')}</small>
                    <br>
                    <small class="text-muted">ID: ${patient.id}</small>
                </div>
            </div>
        `).join('');
    }

    async sendMessageToSelectedPatients() {
        if (!this.currentMessageType || !this.currentMessageId) {
            this.showError('Configure um cartão de ação nas configurações primeiro');
            return;
        }

        const patients = this.selectedPatients.map(p => ({
            number: p.phone, // Número de telefone do paciente
            contactId: p.id   // ID do chat/atendimento
        }));

        // Validar se todos os pacientes têm número de telefone
        const patientsWithoutPhone = patients.filter(p => !p.number || p.number.trim() === '');
        if (patientsWithoutPhone.length > 0) {
            this.showError('Alguns pacientes selecionados não possuem número de telefone válido');
            return;
        }

        // Log para debug
        console.log('📤 Enviando mensagem para pacientes:', patients);
        console.log('📤 Dados detalhados dos pacientes selecionados:', this.selectedPatients);
        
        try {
            let endpoint, payload;
            
            if (this.currentMessageType === 'action_card') {
                endpoint = '/api/messages/send-action-card';
                payload = {
                    patients,
                    action_card_id: this.currentMessageId
                };
                console.log('🔍 Action Card ID sendo enviado:', this.currentMessageId);
                console.log('🔍 Payload completo:', payload);
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const messageType = 'Cartão de Ação';
                this.showSuccess(`${messageType} enviado: ${result.data.success} sucessos, ${result.data.failed} falhas`);
                
                // Log de sucesso para o usuário
                this.addUserActionLog('info', 
                    `Mensagem manual enviada com sucesso para ${patients.length} pacientes`, 
                    'Envio Manual',
                    { 
                        messageType: this.currentMessageType,
                        messageId: this.currentMessageId,
                        totalPatients: patients.length,
                        successCount: result.data.success,
                        failedCount: result.data.failed
                    }
                );
                
                this.clearSelection();
                this.hideModal('sendMessageModal');
            } else {
                this.showError(result.message || `Erro ao enviar ${this.currentMessageType}`);
                
                // Log de erro para o usuário
                this.addUserActionLog('error', 
                    `Falha ao enviar mensagem manual: ${result.message || 'Erro desconhecido'}`, 
                    'Envio Manual',
                    { 
                        messageType: this.currentMessageType,
                        messageId: this.currentMessageId,
                        totalPatients: patients.length,
                        error: result.message
                    }
                );
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            this.showError('Erro ao enviar mensagem: ' + error.message);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    }

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
     * Escapa HTML para segurança
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
