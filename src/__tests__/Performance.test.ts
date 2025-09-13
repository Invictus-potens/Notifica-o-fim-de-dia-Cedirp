import { MonitoringService } from '../services/MonitoringService';
import { MessageService } from '../services/MessageService';
import { ConfigManager } from '../services/ConfigManager';
import { KrolikApiClient } from '../services/KrolikApiClient';
import { ErrorHandler } from '../services/ErrorHandler';
import { WaitingPatient } from '../models/types';

describe('Performance Tests - 1000 Attendances', () => {
  let monitoringService: MonitoringService;
  let messageService: MessageService;
  let configManager: ConfigManager;
  let krolikApiClient: KrolikApiClient;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    // Mock dependencies
    krolikApiClient = {
      listWaitingAttendances: jest.fn(),
      sendActionCard: jest.fn(),
      sendTemplate: jest.fn(),
      getSectors: jest.fn(),
      getActionCards: jest.fn(),
    } as any;

    configManager = {
      getExcludedSectors: jest.fn().mockReturnValue([]),
      getExcludedChannels: jest.fn().mockReturnValue([]),
      addToExclusionList: jest.fn(),
      isFlowPaused: jest.fn().mockReturnValue(false),
      cleanupDailyData: jest.fn(),
    } as any;

    errorHandler = {
      logError: jest.fn(),
      notifyAdministrator: jest.fn(),
      getErrorStats: jest.fn(),
    } as any;

    monitoringService = new MonitoringService(krolikApiClient, configManager);
    messageService = new MessageService(krolikApiClient, configManager, errorHandler);
  });

  const generateMockPatients = (count: number): WaitingPatient[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `patient-${i}`,
      name: `Patient ${i}`,
      phone: `+5511${String(i).padStart(8, '0')}`,
      sectorId: `sector-${i % 10}`, // 10 different sectors
      sectorName: `Setor ${i % 10}`,
      channelId: `channel-${i % 5}`, // 5 different channels
      channelType: i % 2 === 0 ? 'normal' : 'api_oficial',
      waitStartTime: new Date(Date.now() - (31 * 60 * 1000)), // 31 minutes ago
      waitTimeMinutes: 31,
    }));
  };

  test('should handle 1000 waiting patients efficiently', async () => {
    const patients = generateMockPatients(1000);
    
    // Mock API response
    (krolikApiClient.listWaitingAttendances as jest.Mock).mockResolvedValue(
      patients.map(p => ({
        id: p.id,
        customer_name: p.name,
        customer_phone: p.phone,
        sector_id: p.sectorId,
        sector_name: p.sectorName,
        channel_id: p.channelId,
        channel_type: p.channelType,
        created_at: p.waitStartTime.toISOString(),
      }))
    );

    const startTime = Date.now();
    
    // Test monitoring service performance
    const waitingPatients = await monitoringService.checkWaitingPatients();
    
    const monitoringTime = Date.now() - startTime;
    
    expect(waitingPatients).toHaveLength(1000);
    expect(monitoringTime).toBeLessThan(5000); // Should complete in less than 5 seconds
    
    console.log(`✓ Monitoring 1000 patients completed in ${monitoringTime}ms`);
  });

  test('should process 30-minute messages for 1000 patients efficiently', async () => {
    const patients = generateMockPatients(1000);
    
    // Mock successful message sending
    (krolikApiClient.sendActionCard as jest.Mock).mockResolvedValue(true);
    (krolikApiClient.sendTemplate as jest.Mock).mockResolvedValue(true);
    
    const startTime = Date.now();
    
    // Process messages in batches to simulate real-world scenario
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < patients.length; i += batchSize) {
      const batch = patients.slice(i, i + batchSize);
      batches.push(batch);
    }
    
    let processedCount = 0;
    
    for (const batch of batches) {
      const promises = batch.map(async (patient) => {
        const result = await messageService.send30MinuteMessage(patient);
        if (result) processedCount++;
        return result;
      });
      
      await Promise.all(promises);
    }
    
    const processingTime = Date.now() - startTime;
    
    expect(processedCount).toBe(1000);
    expect(processingTime).toBeLessThan(30000); // Should complete in less than 30 seconds
    
    console.log(`✓ Processed 1000 30-minute messages in ${processingTime}ms`);
  });

  test('should handle end-of-day messages for 1000 patients efficiently', async () => {
    const patients = generateMockPatients(1000);
    
    // Mock successful message sending
    (krolikApiClient.sendActionCard as jest.Mock).mockResolvedValue(true);
    (krolikApiClient.sendTemplate as jest.Mock).mockResolvedValue(true);
    
    const startTime = Date.now();
    
    await messageService.sendEndOfDayMessages(patients);
    
    const processingTime = Date.now() - startTime;
    
    expect(processingTime).toBeLessThan(45000); // Should complete in less than 45 seconds
    
    console.log(`✓ Processed 1000 end-of-day messages in ${processingTime}ms`);
  });

  test('should maintain performance under memory constraints', async () => {
    const patients = generateMockPatients(1000);
    
    // Monitor memory usage
    const initialMemory = process.memoryUsage();
    
    // Simulate multiple processing cycles
    for (let cycle = 0; cycle < 10; cycle++) {
      (krolikApiClient.listWaitingAttendances as jest.Mock).mockResolvedValue(
        patients.map(p => ({
          id: p.id,
          customer_name: p.name,
          customer_phone: p.phone,
          sector_id: p.sectorId,
          sector_name: p.sectorName,
          channel_id: p.channelId,
          channel_type: p.channelType,
          created_at: p.waitStartTime.toISOString(),
        }))
      );
      
      await monitoringService.checkWaitingPatients();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Memory increase should be reasonable (less than 100MB)
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    
    console.log(`✓ Memory increase after 10 cycles: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
  });

  test('should handle concurrent operations efficiently', async () => {
    const patients = generateMockPatients(500); // Use 500 for concurrent test
    
    (krolikApiClient.listWaitingAttendances as jest.Mock).mockResolvedValue(
      patients.map(p => ({
        id: p.id,
        customer_name: p.name,
        customer_phone: p.phone,
        sector_id: p.sectorId,
        sector_name: p.sectorName,
        channel_id: p.channelId,
        channel_type: p.channelType,
        created_at: p.waitStartTime.toISOString(),
      }))
    );
    
    (krolikApiClient.sendActionCard as jest.Mock).mockResolvedValue(true);
    (krolikApiClient.sendTemplate as jest.Mock).mockResolvedValue(true);
    
    const startTime = Date.now();
    
    // Run monitoring and messaging concurrently
    const [waitingPatients] = await Promise.all([
      monitoringService.checkWaitingPatients(),
      messageService.sendEndOfDayMessages(patients.slice(0, 250)),
      messageService.sendEndOfDayMessages(patients.slice(250, 500)),
    ]);
    
    const concurrentTime = Date.now() - startTime;
    
    expect(waitingPatients).toHaveLength(500);
    expect(concurrentTime).toBeLessThan(20000); // Should complete in less than 20 seconds
    
    console.log(`✓ Concurrent operations completed in ${concurrentTime}ms`);
  });
});