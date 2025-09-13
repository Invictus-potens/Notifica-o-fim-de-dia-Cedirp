import { MonitoringService } from '../MonitoringService';
import { MessageService } from '../MessageService';
import { ConfigManager } from '../ConfigManager';
import { KrolikApiClient } from '../KrolikApiClient';
import { StorageService } from '../StorageService';
import { ErrorHandler } from '../ErrorHandler';
import { WaitingPatient } from '../../models/WaitingPatient';

// Mock all dependencies
jest.mock('../KrolikApiClient');
jest.mock('../StorageService');
jest.mock('../ErrorHandler');

describe('Message Flow Integration Tests', () => {
  let monitoringService: MonitoringService;
  let messageService: MessageService;
  let configManager: ConfigManager;
  let mockKrolikClient: jest.Mocked<KrolikApiClient>;
  let mockStorageService: jest.Mocked<StorageService>;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;

  const mockPatients: WaitingPatient[] = [
    {
      id: 'patient1',
      name: 'João Silva',
      phone: '11999999999',
      sectorId: 'sector1',
      sectorName: 'Cardiologia',
      channelId: 'channel1',
      channelType: 'normal',
      waitStartTime: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
      waitTimeMinutes: 35
    },
    {
      id: 'patient2',
      name: 'Maria Santos',
      phone: '11888888888',
      sectorId: 'sector2',
      sectorName: 'Pediatria',
      channelId: 'channel2',
      channelType: 'api_oficial',
      waitStartTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      waitTimeMinutes: 45
    },
    {
      id: 'patient3',
      name: 'Pedro Costa',
      phone: '11777777777',
      sectorId: 'sector1', // Same sector as patient1
      sectorName: 'Cardiologia',
      channelId: 'channel3',
      channelType: 'normal',
      waitStartTime: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      waitTimeMinutes: 20
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockKrolikClient = new KrolikApiClient({} as any) as jest.Mocked<KrolikApiClient>;
    mockStorageService = new StorageService({} as any) as jest.Mocked<StorageService>;
    mockErrorHandler = new ErrorHandler() as jest.Mocked<ErrorHandler>;

    // Mock implementations
    mockKrolikClient.listWaitingAttendances = jest.fn().mockResolvedValue(mockPatients);
    mockKrolikClient.sendActionCard = jest.fn().mockResolvedValue(true);
    mockKrolikClient.sendTemplate = jest.fn().mockResolvedValue(true);
    mockKrolikClient.getSectors = jest.fn().mockResolvedValue([
      { id: 'sector1', name: 'Cardiologia', active: true },
      { id: 'sector2', name: 'Pediatria', active: true }
    ]);
    mockKrolikClient.getActionCards = jest.fn().mockResolvedValue([
      { id: 'card1', name: 'Mensagem 30min', content: 'Aguarde...', active: true }
    ]);

    mockStorageService.initialize = jest.fn().mockResolvedValue();
    mockStorageService.addExclusionEntry = jest.fn().mockResolvedValue('entry-id');
    mockStorageService.getExclusionEntries = jest.fn().mockResolvedValue([]);
    mockStorageService.getAllConfig = jest.fn().mockResolvedValue({
      flowPaused: 'false',
      excludedSectors: '[]',
      excludedChannels: '[]',
      selectedActionCard: 'card1',
      selectedTemplate: 'template1',
      endOfDayTime: '18:00'
    });
    mockStorageService.setConfigValue = jest.fn().mockResolvedValue(true);

    mockErrorHandler.logError = jest.fn();
    mockErrorHandler.getErrorStats = jest.fn().mockReturnValue({
      totalErrors: 0,
      errorsByType: {},
      recentErrors: []
    });

    // Create services
    configManager = new ConfigManager(mockStorageService, mockErrorHandler);
    monitoringService = new MonitoringService(mockKrolikClient, configManager);
    messageService = new MessageService(mockKrolikClient, configManager, mockErrorHandler);
  });

  describe('30-minute message flow', () => {
    it('should process complete 30-minute message flow', async () => {
      // Mock business hours and working day
      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      // Initialize services
      await configManager.initialize();

      // Step 1: Get eligible patients for 30-minute messages
      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();

      // Should return patients with > 30 minutes wait time
      expect(eligiblePatients).toHaveLength(2); // patient1 (35min) and patient2 (45min)
      expect(eligiblePatients.map(p => p.id)).toEqual(['patient1', 'patient2']);

      // Step 2: Send messages to eligible patients
      for (const patient of eligiblePatients) {
        const success = await messageService.send30MinuteMessage(patient);
        expect(success).toBe(true);
      }

      // Verify correct API calls were made
      expect(mockKrolikClient.sendActionCard).toHaveBeenCalledWith('channel1', 'card1');
      expect(mockKrolikClient.sendTemplate).toHaveBeenCalledWith('channel2', 'template1');

      // Verify exclusion entries were added
      expect(mockStorageService.addExclusionEntry).toHaveBeenCalledTimes(2);
      expect(mockStorageService.addExclusionEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          attendanceId: 'patient1',
          messageType: '30min'
        })
      );
      expect(mockStorageService.addExclusionEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          attendanceId: 'patient2',
          messageType: '30min'
        })
      );
    });

    it('should respect exclusion list for 30-minute messages', async () => {
      // Mock that patient1 already received a message
      mockStorageService.getExclusionEntries.mockResolvedValue([
        {
          id: 'entry1',
          attendanceId: 'patient1',
          messageType: '30min',
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      ]);

      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      await configManager.initialize();

      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();

      // Should only return patient2 (patient1 is excluded)
      expect(eligiblePatients).toHaveLength(1);
      expect(eligiblePatients[0].id).toBe('patient2');
    });

    it('should respect sector exclusions', async () => {
      // Mock sector1 as excluded
      mockStorageService.getAllConfig.mockResolvedValue({
        flowPaused: 'false',
        excludedSectors: '["sector1"]',
        excludedChannels: '[]',
        selectedActionCard: 'card1',
        selectedTemplate: 'template1',
        endOfDayTime: '18:00'
      });

      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      await configManager.initialize();

      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();

      // Should only return patient2 (patient1 is in excluded sector1)
      expect(eligiblePatients).toHaveLength(1);
      expect(eligiblePatients[0].id).toBe('patient2');
    });

    it('should respect channel exclusions', async () => {
      // Mock channel1 as excluded
      mockStorageService.getAllConfig.mockResolvedValue({
        flowPaused: 'false',
        excludedSectors: '[]',
        excludedChannels: '["channel1"]',
        selectedActionCard: 'card1',
        selectedTemplate: 'template1',
        endOfDayTime: '18:00'
      });

      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      await configManager.initialize();

      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();

      // Should only return patient2 (patient1 uses excluded channel1)
      expect(eligiblePatients).toHaveLength(1);
      expect(eligiblePatients[0].id).toBe('patient2');
    });

    it('should not send messages when flow is paused', async () => {
      // Mock flow as paused
      mockStorageService.getAllConfig.mockResolvedValue({
        flowPaused: 'true',
        excludedSectors: '[]',
        excludedChannels: '[]',
        selectedActionCard: 'card1',
        selectedTemplate: 'template1',
        endOfDayTime: '18:00'
      });

      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      await configManager.initialize();

      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();

      // Should return empty array when flow is paused
      expect(eligiblePatients).toHaveLength(0);
    });

    it('should not send messages outside business hours', async () => {
      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(false);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      await configManager.initialize();

      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();

      expect(eligiblePatients).toHaveLength(0);
    });

    it('should not send messages on weekends', async () => {
      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(false);

      await configManager.initialize();

      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();

      expect(eligiblePatients).toHaveLength(0);
    });
  });

  describe('End-of-day message flow', () => {
    it('should process end-of-day messages at 18:00', async () => {
      // Mock 18:00 on a working day
      const mockDate = new Date('2024-01-15T21:00:00.000Z'); // 18:00 Brasília (UTC-3)
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      await configManager.initialize();

      const eligiblePatients = await monitoringService.getEligiblePatientsForEndOfDayMessage();

      // Should return all patients at 18:00
      expect(eligiblePatients).toHaveLength(3);

      // Send end-of-day messages
      await messageService.sendEndOfDayMessages(eligiblePatients);

      // Verify messages were sent
      expect(mockKrolikClient.sendActionCard).toHaveBeenCalledTimes(2); // patient1 and patient3 (normal channels)
      expect(mockKrolikClient.sendTemplate).toHaveBeenCalledTimes(1); // patient2 (api_oficial channel)

      jest.restoreAllMocks();
    });

    it('should not send end-of-day messages outside 18:00', async () => {
      // Mock 17:00
      const mockDate = new Date('2024-01-15T20:00:00.000Z'); // 17:00 Brasília (UTC-3)
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      await configManager.initialize();

      const eligiblePatients = await monitoringService.getEligiblePatientsForEndOfDayMessage();

      expect(eligiblePatients).toHaveLength(0);

      jest.restoreAllMocks();
    });

    it('should respect exclusions for end-of-day messages', async () => {
      // Mock 18:00 with sector1 excluded
      const mockDate = new Date('2024-01-15T21:00:00.000Z'); // 18:00 Brasília
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      mockStorageService.getAllConfig.mockResolvedValue({
        flowPaused: 'false',
        excludedSectors: '["sector1"]',
        excludedChannels: '[]',
        selectedActionCard: 'card1',
        selectedTemplate: 'template1',
        endOfDayTime: '18:00'
      });

      await configManager.initialize();

      const eligiblePatients = await monitoringService.getEligiblePatientsForEndOfDayMessage();

      // Should only return patient2 (patients 1 and 3 are in excluded sector1)
      expect(eligiblePatients).toHaveLength(1);
      expect(eligiblePatients[0].id).toBe('patient2');

      jest.restoreAllMocks();
    });
  });

  describe('Error handling in message flow', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API failure
      mockKrolikClient.sendActionCard.mockResolvedValue(false);
      mockKrolikClient.sendTemplate.mockResolvedValue(false);

      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      await configManager.initialize();

      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();
      
      for (const patient of eligiblePatients) {
        const success = await messageService.send30MinuteMessage(patient);
        expect(success).toBe(false);
      }

      // Should not add exclusion entries when message sending fails
      expect(mockStorageService.addExclusionEntry).not.toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', async () => {
      // Mock storage failure
      mockStorageService.addExclusionEntry.mockResolvedValue(null);

      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      await configManager.initialize();

      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();
      
      for (const patient of eligiblePatients) {
        const success = await messageService.send30MinuteMessage(patient);
        // Should still return true even if exclusion entry fails
        expect(success).toBe(true);
      }

      // Should log errors
      expect(mockErrorHandler.logError).toHaveBeenCalled();
    });

    it('should continue processing other patients when one fails', async () => {
      // Mock first patient's message to fail, second to succeed
      mockKrolikClient.sendActionCard.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      mockKrolikClient.sendTemplate.mockResolvedValue(true);

      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      await configManager.initialize();

      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();
      
      const results = [];
      for (const patient of eligiblePatients) {
        const success = await messageService.send30MinuteMessage(patient);
        results.push(success);
      }

      // First should fail, second should succeed
      expect(results).toEqual([false, true]);
      
      // Only successful message should create exclusion entry
      expect(mockStorageService.addExclusionEntry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance and scalability', () => {
    it('should handle large number of patients efficiently', async () => {
      // Create 100 patients
      const manyPatients: WaitingPatient[] = Array.from({ length: 100 }, (_, i) => ({
        id: `patient${i}`,
        name: `Patient ${i}`,
        phone: '11999999999',
        sectorId: 'sector1',
        sectorName: 'Test Sector',
        channelId: 'channel1',
        channelType: 'normal',
        waitStartTime: new Date(Date.now() - 35 * 60 * 1000),
        waitTimeMinutes: 35
      }));

      mockKrolikClient.listWaitingAttendances.mockResolvedValue(manyPatients);

      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      await configManager.initialize();

      const startTime = Date.now();
      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();
      const endTime = Date.now();

      // Should process 100 patients quickly (under 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(eligiblePatients).toHaveLength(100);
    });

    it('should handle concurrent message sending', async () => {
      jest.spyOn(monitoringService, 'isBusinessHours').mockReturnValue(true);
      jest.spyOn(monitoringService, 'isWorkingDay').mockReturnValue(true);

      await configManager.initialize();

      const eligiblePatients = await monitoringService.getEligiblePatientsFor30MinMessage();
      
      // Send messages concurrently
      const promises = eligiblePatients.map(patient => 
        messageService.send30MinuteMessage(patient)
      );

      const results = await Promise.all(promises);

      // All should succeed
      expect(results.every(result => result === true)).toBe(true);
      expect(mockStorageService.addExclusionEntry).toHaveBeenCalledTimes(eligiblePatients.length);
    });
  });
});