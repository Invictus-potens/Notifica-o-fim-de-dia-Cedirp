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
                
                // Usar name ou title, com fallback para id
                const displayName = card.name || card.title || `Cartão ${card.id}`;
                
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
            console.log('Carregando templates...');
            
            const response = await fetch('/api/templates');
            const templates = await response.json();

            if (!response.ok) {
                throw new Error(templates.error || 'Erro ao carregar templates');
            }

            this.displayTemplates(templates);

        } catch (error) {
            console.error('Erro ao carregar templates:', error);
            this.showError('Erro ao carregar templates: ' + error.message);
        }
    }

    displayTemplates(templates) {
        const selectElement = document.getElementById('template-select');
        if (!selectElement) return;

        // Clear existing options except the first one
        selectElement.innerHTML = '<option value="">Selecione um template...</option>';

        if (templates && templates.length > 0) {
            templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = template.name || template.title || `Template ${template.id}`;
                selectElement.appendChild(option);
            });
        } else {
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
            const sectors = await response.json();

            if (!response.ok) {
                throw new Error(sectors.error || 'Erro ao carregar setores');
            }

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

        // Update sector select in configuracoes page
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
