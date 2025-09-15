// JavaScript da interface web
class AutomationInterface {
    constructor() {
        this.apiBaseUrl = '/api';
        this.currentRoute = 'dashboard';
        
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
            console.log('Automação de Mensagem de Espera - Interface carregada');
        } catch (error) {
            console.error('Erro na inicialização:', error);
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
    }

    loadRouteData(route) {
        switch (route) {
            case 'dashboard':
                this.loadStatus();
                this.loadMetrics();
                break;
            case 'atendimentos':
                this.loadPatients();
                break;
            case 'configuracoes':
                this.loadActionCards();
                this.loadTemplates();
                this.loadSectors();
                break;
            case 'metricas':
                this.loadMetrics();
                break;
            case 'logs':
                this.loadLogs();
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
                    <td colspan="5" class="text-center text-muted py-4">
                        Nenhum atendimento em espera
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = patients.map(patient => `
            <tr>
                <td>${this.escapeHtml(patient.name)}</td>
                <td>${this.escapeHtml(patient.phone)}</td>
                <td>${this.escapeHtml(patient.sectorName)}</td>
                <td>${this.formatWaitTime(patient.waitTimeMinutes)}</td>
                <td>
                    <span class="badge bg-warning">Aguardando</span>
                </td>
            </tr>
        `).join('');
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

            // Update status elements
            const systemStatusElement = document.getElementById('system-status');
            if (systemStatusElement) {
                systemStatusElement.textContent = data.isRunning ? 'Sistema Ativo' : 'Sistema Pausado';
                systemStatusElement.className = `badge ${data.isRunning ? 'bg-success' : 'bg-warning'} me-3`;
            }

            // Update connection status
            const connectionStatusElement = document.getElementById('connection-status');
            if (connectionStatusElement) {
                connectionStatusElement.textContent = data.apiConnected ? 'Online' : 'Offline';
                connectionStatusElement.className = `badge ${data.apiConnected ? 'bg-success' : 'bg-danger'}`;
            }

        } catch (error) {
            console.error('Erro ao carregar status:', error);
        }
    }

    async loadMetrics() {
        try {
            const response = await fetch('/api/metrics');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar métricas');
            }

            // Update metrics elements
            const messagesSentElement = document.getElementById('metrics-messages-sent');
            if (messagesSentElement) {
                messagesSentElement.textContent = data.messagesSent || 0;
            }

            const apiCallsElement = document.getElementById('metrics-api-calls');
            if (apiCallsElement) {
                apiCallsElement.textContent = data.apiCalls || 0;
            }

            const avgResponseElement = document.getElementById('metrics-avg-response');
            if (avgResponseElement) {
                avgResponseElement.textContent = `${data.avgResponseTime || 0}ms`;
            }

            const errorRateElement = document.getElementById('metrics-error-rate');
            if (errorRateElement) {
                errorRateElement.textContent = `${data.errorRate || 0}%`;
            }

        } catch (error) {
            console.error('Erro ao carregar métricas:', error);
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
        const selectElement = document.getElementById('action-card-select');
        if (!selectElement) return;

        // Clear existing options except the first one
        selectElement.innerHTML = '<option value="">Selecione um cartão de ação...</option>';

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
            
            console.log(`📋 Exibindo ${actionCards.length} cartões de ação no seletor`);
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum cartão disponível';
            selectElement.appendChild(option);
            console.log('📋 Nenhum cartão de ação encontrado');
        }
    }

    async loadTemplates() {
        try {
            console.log('🚀 loadTemplates iniciado...');
            
            const response = await fetch('/api/templates');
            console.log('📡 Resposta da API recebida:', response.status);
            
            const result = await response.json();
            console.log('📄 Resultado da API:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao carregar templates');
            }

            // A API agora retorna { success: true, data: [...], total: X }
            const templates = result.success ? result.data : result;
            console.log('📋 Templates processados:', templates);
            console.log('📊 Quantidade de templates:', templates?.length);

            this.displayTemplates(templates);

        } catch (error) {
            console.error('❌ Erro ao carregar templates:', error);
            this.showError('Erro ao carregar templates: ' + error.message);
        }
    }

    displayTemplates(templates) {
        console.log('🎯 displayTemplates chamado com:', templates);
        
        const selectElement = document.getElementById('template-select');
        if (!selectElement) {
            console.error('❌ Elemento template-select não encontrado!');
            return;
        }

        // Clear existing options except the first one
        selectElement.innerHTML = '<option value="">Selecione um template...</option>';

        if (templates && templates.length > 0) {
            console.log(`📋 Processando ${templates.length} templates`);
            templates.forEach((template, index) => {
                console.log(`Template ${index + 1}:`, template);
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = template.description || template.name || template.title || `Template ${template.id}`;
                selectElement.appendChild(option);
            });
            console.log(`✅ ${templates.length} templates adicionados ao select`);
        } else {
            console.log('⚠️ Nenhum template encontrado, adicionando opção padrão');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum template disponível';
            selectElement.appendChild(option);
        }
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

    // Métodos para gerenciar listas de exclusão
    initializeExclusionLists() {
        // Initialize excluded sectors list
        this.excludedSectors = [];
        this.excludedChannels = [];

        // Add event listeners
        const addSectorBtn = document.getElementById('add-sector-btn');
        const addChannelBtn = document.getElementById('add-channel-btn');
        const sectorSelect = document.getElementById('sector-select');
        const channelInput = document.getElementById('channel-input');

        if (addSectorBtn) {
            addSectorBtn.addEventListener('click', () => this.addSectorToExclusion());
        }

        if (addChannelBtn) {
            addChannelBtn.addEventListener('click', () => this.addChannelToExclusion());
        }

        if (sectorSelect) {
            sectorSelect.addEventListener('change', () => this.onSectorSelectChange());
        }

        if (channelInput) {
            channelInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addChannelToExclusion();
                }
            });
        }

        // Load existing exclusions
        this.loadExcludedSectors();
        this.loadExcludedChannels();
    }

    // Métodos para controle de fluxo
    initializeFlowControl() {
        // Initialize flow state
        this.isFlowPaused = false;

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

        // Load current flow state
        this.loadFlowState();
    }

    async toggleFlow() {
        if (this.isFlowPaused) {
            await this.resumeFlow();
        } else {
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
            if (this.isFlowPaused) {
                toggleFlowBtn.innerHTML = '<i class="bi bi-play-fill"></i> Retomar Fluxo';
                toggleFlowBtn.className = 'btn btn-success btn-sm';
            } else {
                toggleFlowBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pausar Fluxo';
                toggleFlowBtn.className = 'btn btn-outline-primary btn-sm';
            }
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
                this.isFlowPaused = result.isPaused;
                this.updateFlowButtons();
                this.updateSystemStatus(
                    this.isFlowPaused ? 'Sistema Pausado' : 'Sistema Ativo',
                    this.isFlowPaused ? 'warning' : 'success'
                );
            }
        } catch (error) {
            console.error('Erro ao verificar estado do fluxo:', error);
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
        const channelInput = document.getElementById('channel-input');
        const channelId = channelInput.value.trim();

        if (!channelId) {
            this.showError('Digite um ID de canal para adicionar à lista de exclusão');
            return;
        }

        // Check if already excluded
        if (this.excludedChannels.includes(channelId)) {
            this.showError('Este canal já está na lista de exclusão');
            return;
        }

        this.excludedChannels.push(channelId);
        this.updateExcludedChannelsDisplay();
        this.saveExcludedChannels();
        
        // Reset input
        channelInput.value = '';
        
        this.showSuccess(`Canal "${channelId}" adicionado à lista de exclusão`);
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
        this.excludedChannels = this.excludedChannels.filter(id => id !== channelId);
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
        this.excludedChannels.forEach(channelId => {
            const channelDiv = document.createElement('div');
            channelDiv.className = 'd-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded border';
            channelDiv.innerHTML = `
                <div>
                    <strong>${this.escapeHtml(channelId)}</strong>
                </div>
                <button class="btn btn-outline-danger btn-sm remove-channel-btn" data-channel-id="${channelId}">
                    <i class="bi bi-x"></i>
                </button>
            `;

            // Add event listener to the remove button
            const removeBtn = channelDiv.querySelector('.remove-channel-btn');
            removeBtn.addEventListener('click', () => {
                this.removeChannelFromExclusion(channelId);
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
