// JavaScript da interface web
class AutomationInterface {
    constructor() {
        this.apiBaseUrl = '/api';
        this.refreshInterval = null;
        this.isFlowPaused = false;
        this.excludedSectors = [];
        this.excludedChannels = [];
        
        this.init();
    }

    init() {
        console.log('Automação de Mensagem de Espera - Interface carregada');
        this.setupErrorBoundary();
        this.setupEventListeners();
        this.initializeEnhancements();
        this.loadInitialData();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Flow control buttons
        document.getElementById('toggle-flow-btn')?.addEventListener('click', () => this.toggleFlow());
        document.getElementById('pause-flow-btn')?.addEventListener('click', () => this.pauseFlow());
        document.getElementById('resume-flow-btn')?.addEventListener('click', () => this.resumeFlow());

        // Refresh buttons
        document.getElementById('refresh-status-btn')?.addEventListener('click', () => this.refreshStatus());
        document.getElementById('refresh-patients-btn')?.addEventListener('click', () => this.refreshPatients());

        // Exception list management
        document.getElementById('add-sector-btn')?.addEventListener('click', () => this.addExcludedSector());
        document.getElementById('add-channel-btn')?.addEventListener('click', () => this.addExcludedChannel());

        // Message configuration
        document.getElementById('save-message-config-btn')?.addEventListener('click', () => this.saveMessageConfig());

        // Filters
        document.getElementById('sector-filter')?.addEventListener('change', () => this.filterPatients());
        document.getElementById('log-level-filter')?.addEventListener('change', () => this.filterLogs());

        // Clear logs
        document.getElementById('clear-logs-btn')?.addEventListener('click', () => this.clearLogs());
        
        // Export logs
        document.getElementById('export-logs-btn')?.addEventListener('click', () => this.exportLogs());
        
        // Show log statistics
        document.getElementById('log-stats-btn')?.addEventListener('click', () => this.showLogStats());
        
        // Metrics functionality
        document.getElementById('refresh-metrics-btn')?.addEventListener('click', () => this.loadMetrics());
        document.getElementById('view-detailed-metrics-btn')?.addEventListener('click', () => this.showDetailedMetrics());

        // Enter key handlers
        document.getElementById('channel-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addExcludedChannel();
        });
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.refreshStatus(),
                this.refreshPatients(),
                this.loadSectors(),
                this.loadActionCards(),
                this.loadTemplates(),
                this.loadConfiguration(),
                this.loadLogs(),
                this.loadMetrics()
            ]);
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            this.showToast('Erro ao carregar dados iniciais', 'error');
        }
    }

    startAutoRefresh() {
        // Refresh data every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshStatus();
            this.refreshPatients();
        }, 30000);
        
        // Start log refresh
        this.startLogRefresh();
        
        // Start metrics refresh
        this.startMetricsRefresh();
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Status and data refresh methods
    async refreshStatus() {
        try {
            this.showButtonLoading('refresh-status-btn');
            
            const status = await this.apiCall(`${this.apiBaseUrl}/status`);
            
            this.updateStatusDisplay(status);
            this.updateSystemInfo(status);
            
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            this.showActionToast('Erro ao atualizar status do sistema', 'error', {
                text: 'Tentar Novamente',
                callback: 'window.automationInterface.refreshStatus()'
            });
        } finally {
            this.showButtonLoading('refresh-status-btn', false);
        }
    }

    async refreshPatients() {
        const loadingElement = document.getElementById('loading-patients');
        const tableContainer = document.getElementById('patients-table-container');
        
        try {
            this.showButtonLoading('refresh-patients-btn');
            if (loadingElement) loadingElement.classList.remove('d-none');
            if (tableContainer) tableContainer.classList.add('loading-state');
            
            const data = await this.apiCall(`${this.apiBaseUrl}/patients`);
            
            this.updatePatientsTable(data.patients || []);
            this.updatePatientStats(data.stats);
            
        } catch (error) {
            console.error('Erro ao atualizar pacientes:', error);
            this.showActionToast('Erro ao carregar lista de pacientes', 'error', {
                text: 'Tentar Novamente',
                callback: 'window.automationInterface.refreshPatients()'
            });
        } finally {
            this.showButtonLoading('refresh-patients-btn', false);
            if (loadingElement) loadingElement.classList.add('d-none');
            if (tableContainer) tableContainer.classList.remove('loading-state');
        }
    }

    async loadSectors() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/sectors`);
            const sectors = await response.json();
            
            this.populateSectorSelects(sectors);
            
        } catch (error) {
            console.error('Erro ao carregar setores:', error);
            this.showToast('Erro ao carregar setores', 'error');
        }
    }

    async loadActionCards() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/action-cards`);
            const actionCards = await response.json();
            
            this.populateActionCardSelect(actionCards);
            
        } catch (error) {
            console.error('Erro ao carregar cartões de ação:', error);
            this.showToast('Erro ao carregar cartões de ação', 'error');
        }
    }

    async loadTemplates() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/templates`);
            const templates = await response.json();
            
            this.populateTemplateSelect(templates);
            
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
            this.showToast('Erro ao carregar templates', 'error');
        }
    }

    async loadConfiguration() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/config`);
            const config = await response.json();
            
            this.updateConfigurationDisplay(config);
            
        } catch (error) {
            console.error('Erro ao carregar configuração:', error);
            this.showToast('Erro ao carregar configuração', 'error');
        }
    }

    // Flow control methods
    async toggleFlow() {
        if (this.isFlowPaused) {
            await this.resumeFlow();
        } else {
            await this.pauseFlow();
        }
    }

    async pauseFlow() {
        this.showConfirmation('Tem certeza que deseja pausar o fluxo de automação?', async () => {
            try {
                const response = await fetch(`${this.apiBaseUrl}/flow/pause`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.isFlowPaused = true;
                    this.updateFlowButtons();
                    this.showToast('Fluxo pausado com sucesso', 'success');
                } else {
                    throw new Error(result.error || 'Erro desconhecido');
                }
                
            } catch (error) {
                console.error('Erro ao pausar fluxo:', error);
                this.showToast('Erro ao pausar fluxo', 'error');
            }
        });
    }

    async resumeFlow() {
        this.showConfirmation('Tem certeza que deseja reativar o fluxo de automação?', async () => {
            try {
                const response = await fetch(`${this.apiBaseUrl}/flow/resume`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.isFlowPaused = false;
                    this.updateFlowButtons();
                    this.showToast('Fluxo reativado com sucesso', 'success');
                } else {
                    throw new Error(result.error || 'Erro desconhecido');
                }
                
            } catch (error) {
                console.error('Erro ao reativar fluxo:', error);
                this.showToast('Erro ao reativar fluxo', 'error');
            }
        });
    }

    // Exception list management
    addExcludedSector() {
        const select = document.getElementById('sector-select');
        if (!select || !select.value) {
            this.showToast('Selecione um setor para adicionar à lista de exceção', 'warning');
            return;
        }
        
        const sectorId = select.value;
        const sectorName = select.options[select.selectedIndex].text;
        
        if (this.excludedSectors.includes(sectorId)) {
            this.showToast('Este setor já está na lista de exceção', 'warning');
            return;
        }
        
        this.excludedSectors.push(sectorId);
        this.updateExcludedSectorsList();
        select.value = '';
        
        this.showToast(`Setor "${sectorName}" adicionado à lista de exceção`, 'success');
    }

    addExcludedChannel() {
        const input = document.getElementById('channel-input');
        if (!input || !input.value.trim()) {
            this.showToast('Digite o ID do canal para adicionar à lista de exceção', 'warning');
            return;
        }
        
        const channelId = input.value.trim();
        
        if (this.excludedChannels.includes(channelId)) {
            this.showToast('Este canal já está na lista de exceção', 'warning');
            return;
        }
        
        this.excludedChannels.push(channelId);
        this.updateExcludedChannelsList();
        input.value = '';
        
        this.showToast(`Canal "${channelId}" adicionado à lista de exceção`, 'success');
    }

    removeExcludedSector(sectorId) {
        this.excludedSectors = this.excludedSectors.filter(id => id !== sectorId);
        this.updateExcludedSectorsList();
        this.showToast('Setor removido da lista de exceção', 'success');
    }

    removeExcludedChannel(channelId) {
        this.excludedChannels = this.excludedChannels.filter(id => id !== channelId);
        this.updateExcludedChannelsList();
        this.showToast('Canal removido da lista de exceção', 'success');
    }

    async saveMessageConfig() {
        try {
            const actionCardSelect = document.getElementById('action-card-select');
            const templateSelect = document.getElementById('template-select');
            
            const config = {
                excludedSectors: this.excludedSectors,
                excludedChannels: this.excludedChannels,
                selectedActionCard: actionCardSelect?.value || null,
                selectedTemplate: templateSelect?.value || null
            };
            
            const response = await fetch(`${this.apiBaseUrl}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Configurações salvas com sucesso', 'success');
            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }
            
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
            this.showToast('Erro ao salvar configurações', 'error');
        }
    }

    // Filter methods
    filterPatients() {
        const sectorFilter = document.getElementById('sector-filter');
        const tbody = document.getElementById('patients-tbody');
        
        if (!sectorFilter || !tbody) return;
        
        const selectedSector = sectorFilter.value;
        const rows = tbody.querySelectorAll('tr[data-sector-id]');
        
        rows.forEach(row => {
            const sectorId = row.getAttribute('data-sector-id');
            if (!selectedSector || sectorId === selectedSector) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    filterLogs() {
        const levelFilter = document.getElementById('log-level-filter');
        const logsContainer = document.getElementById('logs-container');
        
        if (!levelFilter || !logsContainer) return;
        
        const selectedLevel = levelFilter.value;
        const logEntries = logsContainer.querySelectorAll('.log-entry');
        
        logEntries.forEach(entry => {
            const level = entry.getAttribute('data-level');
            if (!selectedLevel || level === selectedLevel) {
                entry.style.display = '';
            } else {
                entry.style.display = 'none';
            }
        });
    }

    async clearLogs() {
        this.showConfirmation('Tem certeza que deseja limpar todos os logs?', async () => {
            try {
                const response = await fetch(`${this.apiBaseUrl}/logs/clear`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const logsContainer = document.getElementById('logs-container');
                    if (logsContainer) {
                        logsContainer.innerHTML = '<div class="text-muted text-center py-4">Nenhum log disponível</div>';
                    }
                    this.showToast('Logs limpos com sucesso', 'success');
                } else {
                    throw new Error('Falha ao limpar logs');
                }
            } catch (error) {
                console.error('Erro ao limpar logs:', error);
                this.showToast('Erro ao limpar logs', 'error');
            }
        });
    }

    // Utility methods
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toastId = 'toast-' + Date.now();
        const bgClass = type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : type === 'success' ? 'bg-success' : 'bg-info';
        
        const toastHtml = `
            <div id="${toastId}" class="toast ${bgClass} text-white" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
        toast.show();
        
        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    showConfirmation(message, callback) {
        const modal = document.getElementById('confirmationModal');
        const messageElement = document.getElementById('confirmation-message');
        const confirmButton = document.getElementById('confirm-action-btn');
        
        if (!modal || !messageElement || !confirmButton) return;
        
        messageElement.textContent = message;
        
        // Remove existing event listeners
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        
        // Add new event listener
        newConfirmButton.addEventListener('click', () => {
            callback();
            bootstrap.Modal.getInstance(modal).hide();
        });
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    formatTime(date) {
        return new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    }

    formatWaitTime(minutes) {
        if (minutes < 60) {
            return `${minutes}min`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}min`;
    }
}

// Initialize the interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.automationInterface = new AutomationInterface();
});  
  // UI Update methods
    updateStatusDisplay(status) {
        // Update system status badge
        const systemStatusElement = document.getElementById('system-status');
        if (systemStatusElement) {
            if (status.flowActive) {
                systemStatusElement.textContent = 'Sistema Ativo';
                systemStatusElement.className = 'badge bg-success me-3';
            } else if (status.isPaused) {
                systemStatusElement.textContent = 'Sistema Pausado';
                systemStatusElement.className = 'badge bg-warning me-3';
            } else {
                systemStatusElement.textContent = 'Sistema Inativo';
                systemStatusElement.className = 'badge bg-danger me-3';
            }
        }

        // Update flow state
        this.isFlowPaused = status.isPaused;
        this.updateFlowButtons();

        // Update statistics
        if (status.monitoringStats) {
            this.updateElement('total-waiting', status.monitoringStats.totalPatients || 0);
            this.updateElement('messages-30min', status.monitoringStats.patientsOver30Min || 0);
        }

        // Update last check time
        if (status.lastUpdate) {
            this.updateElement('last-check', this.formatTime(new Date(status.lastUpdate)));
        }
    }

    updateSystemInfo(status) {
        if (status.uptime) {
            const uptimeElement = document.getElementById('system-uptime');
            if (uptimeElement) {
                uptimeElement.textContent = this.formatUptime(status.uptime);
            }
        }

        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = this.formatTime(new Date());
        }

        const connectionStatusElement = document.getElementById('connection-status');
        if (connectionStatusElement) {
            connectionStatusElement.textContent = 'Online';
            connectionStatusElement.className = 'badge bg-success';
        }
    }

    updateFlowButtons() {
        const toggleBtn = document.getElementById('toggle-flow-btn');
        const pauseBtn = document.getElementById('pause-flow-btn');
        const resumeBtn = document.getElementById('resume-flow-btn');

        if (toggleBtn) {
            if (this.isFlowPaused) {
                toggleBtn.innerHTML = '<i class="bi bi-play-fill"></i> Reativar Fluxo';
                toggleBtn.className = 'btn btn-outline-light btn-sm';
            } else {
                toggleBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pausar Fluxo';
                toggleBtn.className = 'btn btn-outline-light btn-sm';
            }
        }

        if (pauseBtn && resumeBtn) {
            if (this.isFlowPaused) {
                pauseBtn.classList.add('d-none');
                resumeBtn.classList.remove('d-none');
            } else {
                pauseBtn.classList.remove('d-none');
                resumeBtn.classList.add('d-none');
            }
        }
    }

    updatePatientsTable(patients) {
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
            <tr data-sector-id="${patient.sectorId}" class="fade-in">
                <td>
                    <div class="fw-semibold">${patient.name}</div>
                    <small class="text-muted">ID: ${patient.id}</small>
                </td>
                <td>${patient.phone}</td>
                <td>
                    <span class="badge bg-light text-dark">${patient.sectorName}</span>
                </td>
                <td>
                    <span class="fw-semibold ${patient.waitTimeMinutes >= 30 ? 'text-warning' : 'text-muted'}">
                        ${this.formatWaitTime(patient.waitTimeMinutes)}
                    </span>
                </td>
                <td>
                    ${this.getPatientStatusBadge(patient)}
                </td>
            </tr>
        `).join('');
    }

    updatePatientStats(stats) {
        if (!stats) return;

        this.updateElement('total-waiting', stats.totalPatients || 0);
        this.updateElement('messages-30min', stats.patientsOver30Min || 0);
    }

    populateSectorSelects(sectors) {
        const sectorSelect = document.getElementById('sector-select');
        const sectorFilter = document.getElementById('sector-filter');

        const sectorOptions = sectors.map(sector => 
            `<option value="${sector.id}">${sector.name}</option>`
        ).join('');

        if (sectorSelect) {
            sectorSelect.innerHTML = '<option value="">Selecione um setor...</option>' + sectorOptions;
        }

        if (sectorFilter) {
            sectorFilter.innerHTML = '<option value="">Todos os Setores</option>' + sectorOptions;
        }
    }

    populateActionCardSelect(actionCards) {
        const select = document.getElementById('action-card-select');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione um cartão...</option>' + 
            actionCards.map(card => 
                `<option value="${card.id}">${card.name}</option>`
            ).join('');
    }

    populateTemplateSelect(templates) {
        const select = document.getElementById('template-select');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione um template...</option>' + 
            templates.map(template => 
                `<option value="${template.id}">${template.name}</option>`
            ).join('');
    }

    updateConfigurationDisplay(config) {
        if (config.excludedSectors) {
            this.excludedSectors = config.excludedSectors;
            this.updateExcludedSectorsList();
        }

        if (config.excludedChannels) {
            this.excludedChannels = config.excludedChannels;
            this.updateExcludedChannelsList();
        }

        if (config.selectedActionCard) {
            const actionCardSelect = document.getElementById('action-card-select');
            if (actionCardSelect) {
                actionCardSelect.value = config.selectedActionCard;
            }
        }

        if (config.selectedTemplate) {
            const templateSelect = document.getElementById('template-select');
            if (templateSelect) {
                templateSelect.value = config.selectedTemplate;
            }
        }

        this.isFlowPaused = config.flowPaused || false;
        this.updateFlowButtons();
    }

    updateExcludedSectorsList() {
        const container = document.getElementById('excluded-sectors-list');
        if (!container) return;

        if (this.excludedSectors.length === 0) {
            container.innerHTML = '<small class="text-muted">Nenhum setor excluído</small>';
            return;
        }

        container.innerHTML = this.excludedSectors.map(sectorId => {
            const sectorSelect = document.getElementById('sector-select');
            const sectorName = sectorSelect ? 
                Array.from(sectorSelect.options).find(opt => opt.value === sectorId)?.text || sectorId :
                sectorId;

            return `
                <span class="exception-item">
                    ${sectorName}
                    <button type="button" class="btn-close" onclick="window.automationInterface.removeExcludedSector('${sectorId}')"></button>
                </span>
            `;
        }).join('');
    }

    updateExcludedChannelsList() {
        const container = document.getElementById('excluded-channels-list');
        if (!container) return;

        if (this.excludedChannels.length === 0) {
            container.innerHTML = '<small class="text-muted">Nenhum canal excluído</small>';
            return;
        }

        container.innerHTML = this.excludedChannels.map(channelId => `
            <span class="exception-item">
                ${channelId}
                <button type="button" class="btn-close" onclick="window.automationInterface.removeExcludedChannel('${channelId}')"></button>
            </span>
        `).join('');
    }

    getPatientStatusBadge(patient) {
        if (patient.waitTimeMinutes >= 30) {
            return '<span class="badge badge-waiting">Aguardando 30min+</span>';
        }
        return '<span class="badge bg-secondary">Aguardando</span>';
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else {
            return `${minutes}m ${seconds % 60}s`;
        }
    }

    // Load and display logs
    async loadLogs() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/logs`);
            const logs = await response.json();
            
            this.displayLogs(logs);
            
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        }
    }

    displayLogs(logs) {
        const container = document.getElementById('logs-container');
        if (!container) return;

        if (logs.length === 0) {
            container.innerHTML = '<div class="text-muted text-center py-4">Nenhum log disponível</div>';
            return;
        }

        container.innerHTML = logs.map(log => `
            <div class="log-entry log-${log.level}" data-level="${log.level}">
                <div>
                    <span class="log-timestamp">${this.formatTime(new Date(log.timestamp))}</span>
                    <span class="badge bg-${this.getLogLevelColor(log.level)} me-2">${log.level.toUpperCase()}</span>
                    <span class="log-message">${this.escapeHtml(log.message)}</span>
                </div>
                ${log.context ? `<div class="log-context">[${this.escapeHtml(log.context)}]</div>` : ''}
                ${log.metadata ? `<div class="log-metadata">Metadata: ${this.escapeHtml(JSON.stringify(log.metadata))}</div>` : ''}
                ${log.error ? `<div class="log-error-details">Error: ${this.escapeHtml(log.error.message)}</div>` : ''}
            </div>
        `).join('');

        // Auto-scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    getLogLevelColor(level) {
        switch (level) {
            case 'debug': return 'primary';
            case 'info': return 'info';
            case 'warn': return 'warning';
            case 'error': return 'danger';
            case 'critical': return 'dark';
            default: return 'secondary';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Auto-refresh logs
    startLogRefresh() {
        setInterval(() => {
            this.loadLogs();
        }, 10000); // Refresh logs every 10 seconds
    }

    // Export logs functionality
    async exportLogs() {
        try {
            const format = await this.showExportDialog();
            if (!format) return;

            const response = await fetch(`${this.apiBaseUrl}/logs/export?format=${format}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `logs_${new Date().toISOString().split('T')[0]}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showToast('Logs exportados com sucesso', 'success');
            } else {
                throw new Error('Falha ao exportar logs');
            }
        } catch (error) {
            console.error('Erro ao exportar logs:', error);
            this.showToast('Erro ao exportar logs', 'error');
        }
    }

    showExportDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Exportar Logs</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Selecione o formato para exportação:</p>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="exportFormat" id="formatJson" value="json" checked>
                                <label class="form-check-label" for="formatJson">JSON</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="exportFormat" id="formatCsv" value="csv">
                                <label class="form-check-label" for="formatCsv">CSV</label>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="confirmExport">Exportar</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            const bootstrapModal = new bootstrap.Modal(modal);
            
            modal.querySelector('#confirmExport').addEventListener('click', () => {
                const format = modal.querySelector('input[name="exportFormat"]:checked').value;
                bootstrapModal.hide();
                resolve(format);
            });
            
            modal.addEventListener('hidden.bs.modal', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
            
            bootstrapModal.show();
        });
    }

    // Show log statistics
    async showLogStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/logs/activity`);
            const stats = await response.json();
            
            this.displayLogStats(stats);
            
            const modal = new bootstrap.Modal(document.getElementById('logStatsModal'));
            modal.show();
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            this.showToast('Erro ao carregar estatísticas', 'error');
        }
    }

    displayLogStats(stats) {
        document.getElementById('stats-total-logs').textContent = stats.totalLogs;
        document.getElementById('stats-error-count').textContent = stats.errorCount;
        document.getElementById('stats-warning-count').textContent = stats.warningCount;
        document.getElementById('stats-critical-count').textContent = stats.criticalCount;
        
        // Top contexts
        const topContextsList = document.getElementById('top-contexts-list');
        if (stats.topContexts.length === 0) {
            topContextsList.innerHTML = '<div class="text-muted">Nenhum contexto encontrado</div>';
        } else {
            topContextsList.innerHTML = stats.topContexts.map(ctx => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${ctx.context}</span>
                    <span class="badge bg-primary rounded-pill">${ctx.count}</span>
                </div>
            `).join('');
        }
        
        // Recent errors
        const recentErrorsList = document.getElementById('recent-errors-list');
        if (stats.recentErrors.length === 0) {
            recentErrorsList.innerHTML = '<div class="text-muted">Nenhum erro recente</div>';
        } else {
            recentErrorsList.innerHTML = stats.recentErrors.map(error => `
                <div class="border-bottom pb-2 mb-2">
                    <div class="small text-muted">${this.formatTime(new Date(error.timestamp))}</div>
                    <div class="fw-bold">${this.escapeHtml(error.message)}</div>
                    <div class="small text-muted">[${this.escapeHtml(error.context)}]</div>
                </div>
            `).join('');
        }
    }

    // Metrics functionality
    async loadMetrics() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/metrics`);
            const metrics = await response.json();
            
            this.displayMetrics(metrics);
            
        } catch (error) {
            console.error('Erro ao carregar métricas:', error);
        }
    }

    displayMetrics(metrics) {
        // Basic metrics display
        document.getElementById('metrics-messages-sent').textContent = metrics.messages.totalSent;
        document.getElementById('metrics-api-calls').textContent = metrics.system.totalRequests;
        document.getElementById('metrics-avg-response').textContent = `${Math.round(metrics.system.averageApiResponseTime)}ms`;
        
        // Calculate error rate
        const errorRate = metrics.system.totalRequests > 0 
            ? ((metrics.system.apiCallsFailed / metrics.system.totalRequests) * 100).toFixed(1)
            : 0;
        document.getElementById('metrics-error-rate').textContent = `${errorRate}%`;
        
        // Display alerts
        this.displayAlerts(metrics.alerts);
    }

    displayAlerts(alerts) {
        const container = document.getElementById('alerts-container');
        
        if (alerts.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.severity === 'critical' ? 'danger' : 'warning'} alert-dismissible fade show py-2" role="alert">
                <small>
                    <i class="bi bi-${alert.severity === 'critical' ? 'exclamation-triangle-fill' : 'exclamation-triangle'} me-1"></i>
                    ${this.escapeHtml(alert.message)}
                </small>
                <button type="button" class="btn-close btn-close-sm" data-bs-dismiss="alert"></button>
            </div>
        `).join('');
    }

    async showDetailedMetrics() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/metrics`);
            const metrics = await response.json();
            
            this.displayDetailedMetrics(metrics);
            
            const modal = new bootstrap.Modal(document.getElementById('detailedMetricsModal'));
            modal.show();
        } catch (error) {
            console.error('Erro ao carregar métricas detalhadas:', error);
            this.showToast('Erro ao carregar métricas detalhadas', 'error');
        }
    }

    displayDetailedMetrics(metrics) {
        // Message metrics
        document.getElementById('detailed-messages-successful').textContent = metrics.messages.successful;
        document.getElementById('detailed-messages-failed').textContent = metrics.messages.failed;
        document.getElementById('detailed-messages-30min').textContent = metrics.messages.by30Min;
        document.getElementById('detailed-messages-endday').textContent = metrics.messages.byEndOfDay;
        
        // System metrics
        document.getElementById('detailed-uptime').textContent = this.formatDuration(metrics.system.uptime);
        document.getElementById('detailed-total-requests').textContent = metrics.system.totalRequests;
        document.getElementById('detailed-api-success').textContent = metrics.system.apiCallsSuccessful;
        document.getElementById('detailed-api-failed').textContent = metrics.system.apiCallsFailed;
        
        // Performance metrics
        document.getElementById('detailed-monitoring-cycles').textContent = metrics.performance.monitoringCycles;
        document.getElementById('detailed-patients-processed').textContent = metrics.performance.patientsProcessed;
        document.getElementById('detailed-avg-cycle-time').textContent = `${Math.round(metrics.performance.averageCycleTime)}ms`;
        document.getElementById('detailed-processing-errors').textContent = metrics.performance.processingErrors;
        
        // Messages by sector
        this.displayMessagesBySector(metrics.messages.bySector);
        
        // Messages by channel
        this.displayMessagesByChannel(metrics.messages.byChannel);
    }

    displayMessagesBySector(bySector) {
        const container = document.getElementById('messages-by-sector').querySelector('.card-body');
        
        if (Object.keys(bySector).length === 0) {
            container.innerHTML = '<div class="text-muted">Nenhum dado disponível</div>';
            return;
        }

        const entries = Object.entries(bySector).sort((a, b) => b[1] - a[1]);
        container.innerHTML = entries.map(([sector, count]) => `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small">${this.escapeHtml(sector)}</span>
                <span class="badge bg-primary rounded-pill">${count}</span>
            </div>
        `).join('');
    }

    displayMessagesByChannel(byChannel) {
        const container = document.getElementById('messages-by-channel').querySelector('.card-body');
        
        if (Object.keys(byChannel).length === 0) {
            container.innerHTML = '<div class="text-muted">Nenhum dado disponível</div>';
            return;
        }

        const entries = Object.entries(byChannel).sort((a, b) => b[1] - a[1]);
        container.innerHTML = entries.map(([channel, count]) => `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small">${this.escapeHtml(channel)}</span>
                <span class="badge bg-info rounded-pill">${count}</span>
            </div>
        `).join('');
    }

    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
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

    startMetricsRefresh() {
        setInterval(() => {
            this.loadMetrics();
        }, 30000); // Refresh metrics every 30 seconds
    }
}    
// Enhanced visual feedback methods
    showLoadingIndicator(elementId, show = true) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (show) {
            element.style.position = 'relative';
            if (!element.querySelector('.loading-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'loading-overlay';
                overlay.innerHTML = `
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                `;
                element.appendChild(overlay);
            }
        } else {
            const overlay = element.querySelector('.loading-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    }

    showButtonLoading(buttonId, loading = true, originalText = null) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (loading) {
            if (!button.dataset.originalText) {
                button.dataset.originalText = button.innerHTML;
            }
            button.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                Carregando...
            `;
            button.disabled = true;
        } else {
            button.innerHTML = button.dataset.originalText || originalText || button.innerHTML;
            button.disabled = false;
            delete button.dataset.originalText;
        }
    }

    // Enhanced error handling with retry functionality
    async apiCall(url, options = {}, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.json();
            } catch (error) {
                if (i === retries - 1) {
                    throw error;
                }
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }

    // Connection status monitoring
    startConnectionMonitoring() {
        const checkConnection = async () => {
            try {
                await this.apiCall(`${this.apiBaseUrl}/status`);
                this.updateConnectionStatus(true);
            } catch (error) {
                this.updateConnectionStatus(false);
            }
        };

        // Check connection every 30 seconds
        setInterval(checkConnection, 30000);
        
        // Also check on window focus
        window.addEventListener('focus', checkConnection);
    }

    updateConnectionStatus(isOnline) {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;

        if (isOnline) {
            statusElement.textContent = 'Online';
            statusElement.className = 'badge bg-success';
        } else {
            statusElement.textContent = 'Offline';
            statusElement.className = 'badge bg-danger';
            this.showToast('Conexão perdida com o servidor', 'error');
        }
    }

    // Enhanced toast notifications with actions
    showActionToast(message, type = 'info', action = null) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toastId = 'toast-' + Date.now();
        const bgClass = type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : type === 'success' ? 'bg-success' : 'bg-info';
        
        const actionButton = action ? `
            <button type="button" class="btn btn-sm btn-outline-light me-2" onclick="${action.callback}">
                ${action.text}
            </button>
        ` : '';

        const toastHtml = `
            <div id="${toastId}" class="toast ${bgClass} text-white" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                        ${actionButton}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { 
            delay: action ? 10000 : 5000 // Longer delay for action toasts
        });
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    // Responsive table handling
    makeTableResponsive() {
        const tables = document.querySelectorAll('.table-responsive table');
        
        tables.forEach(table => {
            // Add mobile-friendly data attributes
            const headers = table.querySelectorAll('th');
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach((cell, index) => {
                    if (headers[index]) {
                        cell.setAttribute('data-label', headers[index].textContent);
                    }
                });
            });
        });
    }

    // Keyboard navigation support
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R for refresh
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refreshStatus();
                this.refreshPatients();
                this.showToast('Dados atualizados', 'info');
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal.show');
                modals.forEach(modal => {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                });
            }
        });
    }

    // Accessibility improvements
    setupAccessibility() {
        // Add ARIA labels to interactive elements
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(button => {
            const text = button.textContent.trim();
            if (text) {
                button.setAttribute('aria-label', text);
            }
        });

        // Add focus indicators
        const focusableElements = document.querySelectorAll('button, input, select, [tabindex]');
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.classList.add('focus-visible');
            });
            
            element.addEventListener('blur', () => {
                element.classList.remove('focus-visible');
            });
        });
    }

    // Performance monitoring
    startPerformanceMonitoring() {
        // Monitor API response times
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const start = performance.now();
            try {
                const response = await originalFetch(...args);
                const duration = performance.now() - start;
                
                if (duration > 5000) { // Slow API call
                    console.warn(`Slow API call: ${args[0]} took ${duration.toFixed(2)}ms`);
                    this.showToast('Conexão lenta detectada', 'warning');
                }
                
                return response;
            } catch (error) {
                const duration = performance.now() - start;
                console.error(`Failed API call: ${args[0]} failed after ${duration.toFixed(2)}ms`, error);
                throw error;
            }
        };
    }

    // Enhanced initialization with all improvements
    initializeEnhancements() {
        this.makeTableResponsive();
        this.setupKeyboardNavigation();
        this.setupAccessibility();
        this.startConnectionMonitoring();
        this.startPerformanceMonitoring();
        
        // Add resize handler for responsive adjustments
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Add visibility change handler to pause/resume when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoRefresh();
            } else {
                this.startAutoRefresh();
                // Refresh data when tab becomes visible again
                this.refreshStatus();
                this.refreshPatients();
            }
        });
    }

    handleResize() {
        // Adjust table display for mobile
        const isMobile = window.innerWidth < 768;
        const tables = document.querySelectorAll('.table-responsive');
        
        tables.forEach(table => {
            if (isMobile) {
                table.classList.add('mobile-table');
            } else {
                table.classList.remove('mobile-table');
            }
        });
        
        // Adjust card layouts
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            if (isMobile) {
                card.classList.add('mobile-card');
            } else {
                card.classList.remove('mobile-card');
            }
        });
    }

    // Error boundary for unhandled errors
    setupErrorBoundary() {
        window.addEventListener('error', (event) => {
            console.error('Unhandled error:', event.error);
            this.showToast('Ocorreu um erro inesperado', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showToast('Erro de conexão ou processamento', 'error');
        });
    }