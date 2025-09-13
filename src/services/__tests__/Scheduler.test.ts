import { Scheduler, MonitoringScheduler, createMonitoringScheduler } from '../Scheduler';
import { IMonitoringService } from '../MonitoringService';
import { IConfigManager } from '../ConfigManager';
import { WaitingPatient } from '../../models/WaitingPatient';

// Increase timeout for async tests
jest.setTimeout(10000);

// Mocks
const mockMonitoringService = {
  checkWaitingPatients: jest.fn(),
  getEligiblePatientsFor30MinMessage: jest.fn(),
  getEligiblePatientsForEndOfDayMessage: jest.fn(),
  isBusinessHours: jest.fn(),
  isWorkingDay: jest.fn(),
  getMonitoringStats: jest.fn(),
  getPatientWaitTime: jest.fn(),
  isEligibleFor30MinMessage: jest.fn()
} as jest.Mocked<IMonitoringService>;

const mockConfigManager = {
  isFlowPaused: jest.fn()
} as jest.Mocked<Pick<IConfigManager, 'isFlowPaused'>>;

describe('Scheduler', () => {
  let scheduler: Scheduler;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockCallback = jest.fn();
    scheduler = new Scheduler(mockCallback, { intervalMs: 1000, autoStart: false });
  });

  afterEach(() => {
    scheduler.stop();
    jest.useRealTimers();
  });

  describe('basic functionality', () => {
    it('deve iniciar e parar corretamente', () => {
      expect(scheduler.isRunning()).toBe(false);
      
      scheduler.start();
      expect(scheduler.isRunning()).toBe(true);
      
      scheduler.stop();
      expect(scheduler.isRunning()).toBe(false);
    });

    it('deve executar callback no intervalo especificado', async () => {
      scheduler.start();
      
      // Não deve ter executado ainda
      expect(mockCallback).not.toHaveBeenCalled();
      
      // Avançar 1 segundo
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // Wait for async operations
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      // Avançar mais 1 segundo
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // Wait for async operations
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('deve pausar e retomar execução', async () => {
      scheduler.start();
      
      // Pausar
      scheduler.pause();
      expect(scheduler.isPaused()).toBe(true);
      
      // Avançar tempo - não deve executar callback
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      expect(mockCallback).not.toHaveBeenCalled();
      
      // Retomar
      scheduler.resume();
      expect(scheduler.isPaused()).toBe(false);
      
      // Avançar tempo - deve executar callback
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('deve permitir alterar intervalo', () => {
      expect(scheduler.getInterval()).toBe(1000);
      
      scheduler.setInterval(2000);
      expect(scheduler.getInterval()).toBe(2000);
    });

    it('deve rejeitar intervalos muito pequenos', () => {
      expect(() => {
        scheduler.setInterval(500);
      }).toThrow('Intervalo mínimo é de 1000ms (1 segundo)');
    });

    it('deve reiniciar automaticamente ao alterar intervalo se estiver rodando', () => {
      scheduler.start();
      expect(scheduler.isRunning()).toBe(true);
      
      scheduler.setInterval(2000);
      expect(scheduler.isRunning()).toBe(true);
      expect(scheduler.getInterval()).toBe(2000);
    });

    it('deve tratar erros no callback sem parar o scheduler', async () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const errorScheduler = new Scheduler(errorCallback, { intervalMs: 1000, autoStart: false });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      errorScheduler.start();
      jest.advanceTimersByTime(1000);
      
      // Wait for the error handling
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleSpy).toHaveBeenCalledWith('Erro na execução do scheduler:', expect.any(Error));
      expect(errorScheduler.isRunning()).toBe(true);
      
      consoleSpy.mockRestore();
      errorScheduler.stop();
    });

    it('deve iniciar automaticamente se autoStart for true', () => {
      const autoScheduler = new Scheduler(mockCallback, { intervalMs: 1000, autoStart: true });
      
      expect(autoScheduler.isRunning()).toBe(true);
      
      autoScheduler.stop();
    });
  });
});

describe('MonitoringScheduler', () => {
  let monitoringScheduler: MonitoringScheduler;
  let mockPatients: WaitingPatient[];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockPatients = [
      {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        sectorId: 'sector1',
        sectorName: 'Cardiologia',
        channelId: 'channel1',
        channelType: 'normal',
        waitStartTime: new Date(Date.now() - 35 * 60 * 1000),
        waitTimeMinutes: 35
      }
    ];

    mockConfigManager.isFlowPaused.mockReturnValue(false);
    mockMonitoringService.isBusinessHours.mockReturnValue(true);
    mockMonitoringService.isWorkingDay.mockReturnValue(true);
    mockMonitoringService.checkWaitingPatients.mockResolvedValue(mockPatients);
    mockMonitoringService.getEligiblePatientsFor30MinMessage.mockResolvedValue(mockPatients);
    mockMonitoringService.getEligiblePatientsForEndOfDayMessage.mockResolvedValue([]);
    mockMonitoringService.getMonitoringStats.mockReturnValue({
      totalPatients: 1,
      patientsOver30Min: 1,
      averageWaitTime: 35,
      lastUpdate: new Date()
    });

    monitoringScheduler = new MonitoringScheduler(
      mockMonitoringService as unknown as IMonitoringService,
      mockConfigManager as unknown as IConfigManager,
      { intervalMs: 1000, autoStart: false }
    );
  });

  afterEach(() => {
    monitoringScheduler.stop();
    jest.useRealTimers();
  });

  describe('basic functionality', () => {
    it('deve iniciar e parar monitoramento', () => {
      expect(monitoringScheduler.isRunning()).toBe(false);
      
      monitoringScheduler.start();
      expect(monitoringScheduler.isRunning()).toBe(true);
      
      monitoringScheduler.stop();
      expect(monitoringScheduler.isRunning()).toBe(false);
    });

    it('deve pausar e retomar monitoramento', () => {
      monitoringScheduler.start();
      
      monitoringScheduler.pause();
      expect(monitoringScheduler.isPaused()).toBe(true);
      
      monitoringScheduler.resume();
      expect(monitoringScheduler.isPaused()).toBe(false);
    });

    it('deve permitir alterar intervalo de verificação', () => {
      monitoringScheduler.setCheckInterval(2000);
      expect(monitoringScheduler.getCheckInterval()).toBe(2000);
    });
  });

  describe('monitoring cycle', () => {
    it('deve executar ciclo completo de monitoramento', async () => {
      const mockCallback = jest.fn();
      monitoringScheduler.onEligiblePatientsFound(mockCallback);
      
      monitoringScheduler.start();
      jest.advanceTimersByTime(1000);
      
      // Wait for all async operations to complete
      await new Promise(resolve => setImmediate(resolve));
      
      expect(mockMonitoringService.getEligiblePatientsFor30MinMessage).toHaveBeenCalled();
      expect(mockMonitoringService.getEligiblePatientsForEndOfDayMessage).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(mockPatients);
    });

    it('deve continuar monitorando quando fluxo está pausado mas não processar', async () => {
      mockConfigManager.isFlowPaused.mockReturnValue(true);
      
      const mockCallback = jest.fn();
      monitoringScheduler.onEligiblePatientsFound(mockCallback);
      
      monitoringScheduler.start();
      jest.advanceTimersByTime(1000);
      
      await new Promise(resolve => setImmediate(resolve));
      
      expect(mockMonitoringService.checkWaitingPatients).toHaveBeenCalled();
      expect(mockMonitoringService.getEligiblePatientsFor30MinMessage).not.toHaveBeenCalled();
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('deve pular verificação fora do horário comercial', async () => {
      mockMonitoringService.isBusinessHours.mockReturnValue(false);
      
      const mockCallback = jest.fn();
      monitoringScheduler.onEligiblePatientsFound(mockCallback);
      
      monitoringScheduler.start();
      jest.advanceTimersByTime(1000);
      
      await new Promise(resolve => setImmediate(resolve));
      
      expect(mockMonitoringService.getEligiblePatientsFor30MinMessage).not.toHaveBeenCalled();
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('deve pular verificação em fins de semana', async () => {
      mockMonitoringService.isWorkingDay.mockReturnValue(false);
      
      const mockCallback = jest.fn();
      monitoringScheduler.onEligiblePatientsFound(mockCallback);
      
      monitoringScheduler.start();
      jest.advanceTimersByTime(1000);
      
      await new Promise(resolve => setImmediate(resolve));
      
      expect(mockMonitoringService.getEligiblePatientsFor30MinMessage).not.toHaveBeenCalled();
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('deve processar pacientes de fim de expediente', async () => {
      const endOfDayPatients = [mockPatients[0]];
      mockMonitoringService.getEligiblePatientsFor30MinMessage.mockResolvedValue([]);
      mockMonitoringService.getEligiblePatientsForEndOfDayMessage.mockResolvedValue(endOfDayPatients);
      
      const mockCallback = jest.fn();
      monitoringScheduler.onEligiblePatientsFound(mockCallback);
      
      monitoringScheduler.start();
      jest.advanceTimersByTime(1000);
      
      await new Promise(resolve => setImmediate(resolve));
      
      expect(mockCallback).toHaveBeenCalledWith(endOfDayPatients);
    });

    it('deve tratar erros no ciclo de monitoramento', async () => {
      mockMonitoringService.getEligiblePatientsFor30MinMessage.mockRejectedValue(new Error('API Error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      monitoringScheduler.start();
      jest.advanceTimersByTime(1000);
      
      await new Promise(resolve => setImmediate(resolve));
      
      expect(consoleSpy).toHaveBeenCalledWith('Erro no ciclo de monitoramento:', expect.any(Error));
      expect(monitoringScheduler.isRunning()).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });

  describe('stats and utilities', () => {
    it('deve retornar estatísticas corretas', () => {
      const stats = monitoringScheduler.getStats();
      
      expect(stats).toEqual({
        isRunning: false,
        isPaused: false,
        interval: 1000,
        monitoringStats: {
          totalPatients: 1,
          patientsOver30Min: 1,
          averageWaitTime: 35,
          lastUpdate: expect.any(Date)
        }
      });
    });

    it('deve permitir execução forçada do ciclo', async () => {
      const mockCallback = jest.fn();
      monitoringScheduler.onEligiblePatientsFound(mockCallback);
      
      await monitoringScheduler.forceCheck();
      
      expect(mockMonitoringService.getEligiblePatientsFor30MinMessage).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(mockPatients);
    });
  });
});

describe('createMonitoringScheduler', () => {
  it('deve criar MonitoringScheduler com configuração padrão', () => {
    const scheduler = createMonitoringScheduler(
      mockMonitoringService as unknown as IMonitoringService,
      mockConfigManager as unknown as IConfigManager
    );
    
    expect(scheduler).toBeInstanceOf(MonitoringScheduler);
    expect(scheduler.getCheckInterval()).toBe(60000); // 1 minuto padrão
    expect(scheduler.isRunning()).toBe(false); // autoStart false por padrão
  });

  it('deve criar MonitoringScheduler com configuração customizada', () => {
    const scheduler = createMonitoringScheduler(
      mockMonitoringService as unknown as IMonitoringService,
      mockConfigManager as unknown as IConfigManager,
      { intervalMs: 30000, autoStart: true }
    );
    
    expect(scheduler.getCheckInterval()).toBe(30000);
    expect(scheduler.isRunning()).toBe(true);
    
    scheduler.stop();
  });
});