import { MonitoringService } from '../MonitoringService';
import { KrolikApiClient } from '../KrolikApiClient';
import { IConfigManager } from '../ConfigManager';
import { WaitingPatient } from '../../models/WaitingPatient';

// Mocks
const mockKrolikClient = {
  listWaitingAttendances: jest.fn()
} as jest.Mocked<Pick<KrolikApiClient, 'listWaitingAttendances'>>;

const mockConfigManager = {
  isFlowPaused: jest.fn(),
  getExcludedSectors: jest.fn(),
  getExcludedChannels: jest.fn(),
  isAttendanceExcluded: jest.fn()
} as jest.Mocked<Pick<IConfigManager, 'isFlowPaused' | 'getExcludedSectors' | 'getExcludedChannels' | 'isAttendanceExcluded'>>;

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;
  let mockPatients: WaitingPatient[];

  beforeEach(() => {
    jest.clearAllMocks();
    
    monitoringService = new MonitoringService(
      mockKrolikClient as unknown as KrolikApiClient,
      mockConfigManager as unknown as IConfigManager
    );

    // Mock patients para testes
    const now = new Date();
    mockPatients = [
      {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        sectorId: 'sector1',
        sectorName: 'Cardiologia',
        channelId: 'channel1',
        channelType: 'normal',
        waitStartTime: new Date(now.getTime() - 35 * 60 * 1000), // 35 minutos atrás
        waitTimeMinutes: 35
      },
      {
        id: '2',
        name: 'Maria Santos',
        phone: '11888888888',
        sectorId: 'sector2',
        sectorName: 'Pediatria',
        channelId: 'channel2',
        channelType: 'api_oficial',
        waitStartTime: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutos atrás
        waitTimeMinutes: 15
      }
    ];

    mockKrolikClient.listWaitingAttendances.mockResolvedValue(mockPatients);
    mockConfigManager.isFlowPaused.mockReturnValue(false);
    mockConfigManager.getExcludedSectors.mockReturnValue([]);
    mockConfigManager.getExcludedChannels.mockReturnValue([]);
    mockConfigManager.isAttendanceExcluded.mockResolvedValue(false);
  });

  describe('checkWaitingPatients', () => {
    it('deve retornar lista de pacientes em espera', async () => {
      const patients = await monitoringService.checkWaitingPatients();
      
      expect(patients).toHaveLength(2);
      expect(patients[0].name).toBe('João Silva');
      expect(patients[1].name).toBe('Maria Santos');
      expect(mockKrolikClient.listWaitingAttendances).toHaveBeenCalledTimes(1);
    });

    it('deve usar cache quando válido', async () => {
      // Primeira chamada
      await monitoringService.checkWaitingPatients();
      
      // Segunda chamada imediata deve usar cache
      await monitoringService.checkWaitingPatients();
      
      expect(mockKrolikClient.listWaitingAttendances).toHaveBeenCalledTimes(1);
    });

    it('deve atualizar tempos de espera no cache', async () => {
      const patients = await monitoringService.checkWaitingPatients();
      
      // Verificar se tempos foram recalculados
      expect(patients[0].waitTimeMinutes).toBeGreaterThanOrEqual(35);
      expect(patients[1].waitTimeMinutes).toBeGreaterThanOrEqual(15);
    });

    it('deve retornar cache em caso de erro da API', async () => {
      // Primeira chamada bem-sucedida
      await monitoringService.checkWaitingPatients();
      
      // Simular erro na API
      mockKrolikClient.listWaitingAttendances.mockRejectedValueOnce(
        new Error('API Error')
      );
      
      // Limpar cache para forçar nova consulta
      monitoringService.clearCache();
      
      const patients = await monitoringService.checkWaitingPatients();
      expect(patients).toHaveLength(0); // Cache vazio após erro
    });
  });

  describe('getPatientWaitTime', () => {
    it('deve retornar tempo de espera correto para paciente existente', async () => {
      await monitoringService.checkWaitingPatients();
      
      const waitTime = monitoringService.getPatientWaitTime('1');
      expect(waitTime).toBeGreaterThanOrEqual(35);
    });

    it('deve retornar 0 para paciente inexistente', () => {
      const waitTime = monitoringService.getPatientWaitTime('inexistente');
      expect(waitTime).toBe(0);
    });
  });

  describe('isEligibleFor30MinMessage', () => {
    it('deve retornar true para paciente com mais de 30 minutos', () => {
      // Mock horário comercial e dia útil
      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);
      
      const eligible = monitoringService.isEligibleFor30MinMessage(mockPatients[0]);
      expect(eligible).toBe(true);
    });

    it('deve retornar false para paciente com menos de 30 minutos', () => {
      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);
      
      const eligible = monitoringService.isEligibleFor30MinMessage(mockPatients[1]);
      expect(eligible).toBe(false);
    });

    it('deve retornar false quando fluxo está pausado', () => {
      mockConfigManager.isFlowPaused.mockReturnValue(true);
      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);
      
      const eligible = monitoringService.isEligibleFor30MinMessage(mockPatients[0]);
      expect(eligible).toBe(false);
    });

    it('deve retornar false fora do horário comercial', () => {
      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(false);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);
      
      const eligible = monitoringService.isEligibleFor30MinMessage(mockPatients[0]);
      expect(eligible).toBe(false);
    });

    it('deve retornar false em fins de semana', () => {
      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(false);
      
      const eligible = monitoringService.isEligibleFor30MinMessage(mockPatients[0]);
      expect(eligible).toBe(false);
    });
  });

  describe('isBusinessHours', () => {
    it('deve retornar true durante horário comercial (8h-18h)', () => {
      // Mock data/hora para 14h no horário de Brasília
      const mockDate = new Date('2024-01-15T17:00:00.000Z'); // 14h Brasília (UTC-3)
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const isBusinessHours = monitoringService.isBusinessHours();
      expect(isBusinessHours).toBe(true);
      
      jest.restoreAllMocks();
    });

    it('deve retornar false fora do horário comercial', () => {
      // Mock data/hora para 19h no horário de Brasília
      const mockDate = new Date('2024-01-15T22:00:00.000Z'); // 19h Brasília (UTC-3)
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const isBusinessHours = monitoringService.isBusinessHours();
      expect(isBusinessHours).toBe(false);
      
      jest.restoreAllMocks();
    });

    it('deve retornar false antes das 8h', () => {
      // Mock data/hora para 7h no horário de Brasília
      const mockDate = new Date('2024-01-15T10:00:00.000Z'); // 7h Brasília (UTC-3)
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const isBusinessHours = monitoringService.isBusinessHours();
      expect(isBusinessHours).toBe(false);
      
      jest.restoreAllMocks();
    });
  });

  describe('isWorkingDay', () => {
    it('deve retornar true para segunda-feira', () => {
      const monday = new Date('2024-01-15T15:00:00.000Z'); // Segunda-feira
      const isWorkingDay = monitoringService.isWorkingDay(monday);
      expect(isWorkingDay).toBe(true);
    });

    it('deve retornar true para sexta-feira', () => {
      const friday = new Date('2024-01-19T15:00:00.000Z'); // Sexta-feira
      const isWorkingDay = monitoringService.isWorkingDay(friday);
      expect(isWorkingDay).toBe(true);
    });

    it('deve retornar false para sábado', () => {
      const saturday = new Date('2024-01-20T15:00:00.000Z'); // Sábado
      const isWorkingDay = monitoringService.isWorkingDay(saturday);
      expect(isWorkingDay).toBe(false);
    });

    it('deve retornar false para domingo', () => {
      const sunday = new Date('2024-01-21T15:00:00.000Z'); // Domingo
      const isWorkingDay = monitoringService.isWorkingDay(sunday);
      expect(isWorkingDay).toBe(false);
    });

    it('deve usar data atual quando não especificada', () => {
      // Mock para uma terça-feira
      const tuesday = new Date('2024-01-16T15:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => tuesday as any);
      
      const isWorkingDay = monitoringService.isWorkingDay();
      expect(isWorkingDay).toBe(true);
      
      jest.restoreAllMocks();
    });
  });

  describe('getEligiblePatientsFor30MinMessage', () => {
    it('deve retornar apenas pacientes elegíveis', async () => {
      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);
      
      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();
      
      expect(eligiblePatients).toHaveLength(1);
      expect(eligiblePatients[0].id).toBe('1'); // Apenas João com 35 minutos
    });

    it('deve excluir pacientes que já receberam mensagem', async () => {
      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);
      
      // Simular que paciente já recebeu mensagem
      mockConfigManager.isAttendanceExcluded.mockResolvedValue(true);
      
      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();
      
      expect(eligiblePatients).toHaveLength(0);
    });
  });

  describe('getEligiblePatientsForEndOfDayMessage', () => {
    it('deve retornar pacientes elegíveis às 18h em dia útil', async () => {
      // Mock 18h em dia útil
      const mockDate = new Date('2024-01-15T21:00:00.000Z'); // 18h Brasília
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const eligiblePatients = await monitoringService.getEligiblePatientsForEndOfDayMessage();
      
      expect(eligiblePatients).toHaveLength(2);
      
      jest.restoreAllMocks();
    });

    it('deve retornar array vazio fora das 18h', async () => {
      // Mock 17h
      const mockDate = new Date('2024-01-15T20:00:00.000Z'); // 17h Brasília
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const eligiblePatients = await monitoringService.getEligiblePatientsForEndOfDayMessage();
      
      expect(eligiblePatients).toHaveLength(0);
      
      jest.restoreAllMocks();
    });

    it('deve excluir setores da lista de exceção', async () => {
      const mockDate = new Date('2024-01-15T21:00:00.000Z'); // 18h Brasília
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      mockConfigManager.getExcludedSectors.mockReturnValue(['sector1']);
      
      const eligiblePatients = await monitoringService.getEligiblePatientsForEndOfDayMessage();
      
      expect(eligiblePatients).toHaveLength(1);
      expect(eligiblePatients[0].sectorId).toBe('sector2');
      
      jest.restoreAllMocks();
    });

    it('deve excluir canais da lista de exceção', async () => {
      const mockDate = new Date('2024-01-15T21:00:00.000Z'); // 18h Brasília
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      mockConfigManager.getExcludedChannels.mockReturnValue(['channel1']);
      
      const eligiblePatients = await monitoringService.getEligiblePatientsForEndOfDayMessage();
      
      expect(eligiblePatients).toHaveLength(1);
      expect(eligiblePatients[0].channelId).toBe('channel2');
      
      jest.restoreAllMocks();
    });
  });

  describe('getMonitoringStats', () => {
    it('deve retornar estatísticas corretas', async () => {
      await monitoringService.checkWaitingPatients();
      
      const stats = monitoringService.getMonitoringStats();
      
      expect(stats.totalPatients).toBe(2);
      expect(stats.patientsOver30Min).toBe(1);
      expect(stats.averageWaitTime).toBeGreaterThan(0);
      expect(stats.lastUpdate).toBeInstanceOf(Date);
    });

    it('deve retornar estatísticas vazias quando não há pacientes', () => {
      const stats = monitoringService.getMonitoringStats();
      
      expect(stats.totalPatients).toBe(0);
      expect(stats.patientsOver30Min).toBe(0);
      expect(stats.averageWaitTime).toBe(0);
    });
  });

  describe('clearCache', () => {
    it('deve limpar cache e forçar nova consulta', async () => {
      // Primeira consulta
      await monitoringService.checkWaitingPatients();
      expect(mockKrolikClient.listWaitingAttendances).toHaveBeenCalledTimes(1);
      
      // Limpar cache
      monitoringService.clearCache();
      
      // Nova consulta deve chamar API novamente
      await monitoringService.checkWaitingPatients();
      expect(mockKrolikClient.listWaitingAttendances).toHaveBeenCalledTimes(2);
    });
  });
});