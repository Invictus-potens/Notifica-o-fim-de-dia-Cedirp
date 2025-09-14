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

        } catch (error) {
            console.error('Erro na navegação:', error);
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
