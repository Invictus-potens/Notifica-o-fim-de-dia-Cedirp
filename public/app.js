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
