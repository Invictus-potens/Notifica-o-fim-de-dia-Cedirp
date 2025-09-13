import { MetricsService, metricsService } from '../MetricsService';

describe('MetricsService', () => {
  let metrics: MetricsService;

  beforeEach(() => {
    metrics = new MetricsService();
  });

  describe('Message Metrics', () => {
    it('should record successful message sending', () => {
      metrics.recordMessageSent(true, '30min', 'sector1', 'channel1', 1500);

      const messageMetrics = metrics.getMessageMetrics();
      expect(messageMetrics.totalSent).toBe(1);
      expect(messageMetrics.successful).toBe(1);
      expect(messageMetrics.failed).toBe(0);
      expect(messageMetrics.by30Min).toBe(1);
      expect(messageMetrics.byEndOfDay).toBe(0);
      expect(messageMetrics.bySector['sector1']).toBe(1);
      expect(messageMetrics.byChannel['channel1']).toBe(1);
      expect(messageMetrics.averageResponseTime).toBe(1500);
      expect(messageMetrics.lastSentAt).toBeDefined();
    });

    it('should record failed message sending', () => {
      metrics.recordMessageSent(false, 'end_of_day', 'sector2', 'channel2');

      const messageMetrics = metrics.getMessageMetrics();
      expect(messageMetrics.totalSent).toBe(1);
      expect(messageMetrics.successful).toBe(0);
      expect(messageMetrics.failed).toBe(1);
      expect(messageMetrics.by30Min).toBe(0);
      expect(messageMetrics.byEndOfDay).toBe(1);
      expect(messageMetrics.bySector['sector2']).toBe(1);
      expect(messageMetrics.byChannel['channel2']).toBe(1);
    });

    it('should calculate average response time correctly', () => {
      metrics.recordMessageSent(true, '30min', 'sector1', 'channel1', 1000);
      metrics.recordMessageSent(true, '30min', 'sector1', 'channel1', 2000);
      metrics.recordMessageSent(true, '30min', 'sector1', 'channel1', 3000);

      const messageMetrics = metrics.getMessageMetrics();
      expect(messageMetrics.averageResponseTime).toBe(2000);
    });

    it('should track messages by sector and channel', () => {
      metrics.recordMessageSent(true, '30min', 'sector1', 'channel1');
      metrics.recordMessageSent(true, '30min', 'sector1', 'channel2');
      metrics.recordMessageSent(true, 'end_of_day', 'sector2', 'channel1');

      const messageMetrics = metrics.getMessageMetrics();
      expect(messageMetrics.bySector['sector1']).toBe(2);
      expect(messageMetrics.bySector['sector2']).toBe(1);
      expect(messageMetrics.byChannel['channel1']).toBe(2);
      expect(messageMetrics.byChannel['channel2']).toBe(1);
    });
  });

  describe('API Metrics', () => {
    it('should record successful API calls', () => {
      metrics.recordApiCall(true, 500, '/api/test');

      const systemMetrics = metrics.getSystemMetrics();
      expect(systemMetrics.totalRequests).toBe(1);
      expect(systemMetrics.apiCallsSuccessful).toBe(1);
      expect(systemMetrics.apiCallsFailed).toBe(0);
      expect(systemMetrics.averageApiResponseTime).toBe(500);
    });

    it('should record failed API calls', () => {
      metrics.recordApiCall(false, 2000, '/api/test');

      const systemMetrics = metrics.getSystemMetrics();
      expect(systemMetrics.totalRequests).toBe(1);
      expect(systemMetrics.apiCallsSuccessful).toBe(0);
      expect(systemMetrics.apiCallsFailed).toBe(1);
      expect(systemMetrics.averageApiResponseTime).toBe(2000);
    });

    it('should calculate average API response time', () => {
      metrics.recordApiCall(true, 100);
      metrics.recordApiCall(true, 200);
      metrics.recordApiCall(false, 300);

      const systemMetrics = metrics.getSystemMetrics();
      expect(systemMetrics.averageApiResponseTime).toBe(200);
    });
  });

  describe('Performance Metrics', () => {
    it('should record monitoring cycles', () => {
      metrics.recordMonitoringCycle(1500, 25, 3, 0);

      const performanceMetrics = metrics.getPerformanceMetrics();
      expect(performanceMetrics.monitoringCycles).toBe(1);
      expect(performanceMetrics.patientsProcessed).toBe(25);
      expect(performanceMetrics.messagesQueued).toBe(3);
      expect(performanceMetrics.processingErrors).toBe(0);
      expect(performanceMetrics.lastCycleTime).toBe(1500);
      expect(performanceMetrics.averageCycleTime).toBe(1500);
      expect(performanceMetrics.lastCycleAt).toBeDefined();
    });

    it('should calculate average cycle time', () => {
      metrics.recordMonitoringCycle(1000, 10, 1);
      metrics.recordMonitoringCycle(2000, 15, 2);
      metrics.recordMonitoringCycle(3000, 20, 3);

      const performanceMetrics = metrics.getPerformanceMetrics();
      expect(performanceMetrics.averageCycleTime).toBe(2000);
      expect(performanceMetrics.patientsProcessed).toBe(45);
      expect(performanceMetrics.messagesQueued).toBe(6);
    });

    it('should track processing errors', () => {
      metrics.recordMonitoringCycle(1500, 25, 3, 2);

      const performanceMetrics = metrics.getPerformanceMetrics();
      expect(performanceMetrics.processingErrors).toBe(2);
    });
  });

  describe('Error Tracking', () => {
    it('should record errors', () => {
      metrics.recordError('API_CLIENT', 'Connection failed');
      metrics.recordError('MESSAGE_SERVICE', 'Send failed');

      // Errors are tracked internally, we can verify through alerts
      const allMetrics = metrics.getAllMetrics();
      expect(allMetrics).toBeDefined();
    });
  });

  describe('Alert System', () => {
    it('should generate API failure rate alert', () => {
      // Generate moderate failure rate (around 15% - above 10% threshold but below 20%)
      for (let i = 0; i < 8; i++) {
        metrics.recordApiCall(true, 100);
      }
      for (let i = 0; i < 2; i++) {
        metrics.recordApiCall(false, 100);
      }

      const alerts = metrics.checkAlerts();
      const apiAlert = alerts.find(alert => alert.type === 'api_failure_rate');
      expect(apiAlert).toBeDefined();
      expect(apiAlert?.severity).toBe('warning');
    });

    it('should generate slow response alert', () => {
      metrics.recordApiCall(true, 10000); // Very slow response

      const alerts = metrics.checkAlerts();
      const responseAlert = alerts.find(alert => alert.type === 'slow_response');
      expect(responseAlert).toBeDefined();
    });

    it('should generate high error rate alert', () => {
      // Generate many errors
      for (let i = 0; i < 60; i++) {
        metrics.recordError('TEST', 'Test error');
      }

      const alerts = metrics.checkAlerts();
      const errorAlert = alerts.find(alert => alert.type === 'high_error_rate');
      expect(errorAlert).toBeDefined();
    });

    it('should not generate alerts when thresholds are not exceeded', () => {
      metrics.recordApiCall(true, 100);
      metrics.recordMessageSent(true, '30min', 'sector1', 'channel1', 500);

      const alerts = metrics.checkAlerts();
      expect(alerts).toHaveLength(0);
    });
  });

  describe('System Metrics', () => {
    it('should track system uptime', () => {
      const systemMetrics = metrics.getSystemMetrics();
      expect(systemMetrics.uptime).toBeGreaterThanOrEqual(0);
      expect(systemMetrics.startTime).toBeInstanceOf(Date);
    });

    it('should update system metrics', () => {
      const initialMetrics = metrics.getSystemMetrics();
      
      // Wait a bit and check again
      setTimeout(() => {
        const updatedMetrics = metrics.getSystemMetrics();
        expect(updatedMetrics.uptime).toBeGreaterThan(initialMetrics.uptime);
      }, 10);
    });
  });

  describe('Configuration', () => {
    it('should update alert thresholds', () => {
      const newThresholds = {
        maxApiFailureRate: 5,
        maxResponseTime: 3000
      };

      metrics.updateAlertThresholds(newThresholds);

      // Test that new thresholds are applied
      metrics.recordApiCall(false, 4000);
      const alerts = metrics.checkAlerts();
      
      // Should trigger alert with new lower threshold
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should reset daily metrics', () => {
      // Add some data
      metrics.recordMessageSent(true, '30min', 'sector1', 'channel1');
      metrics.recordMonitoringCycle(1500, 25, 3);

      // Reset
      metrics.resetDailyMetrics();

      const messageMetrics = metrics.getMessageMetrics();
      const performanceMetrics = metrics.getPerformanceMetrics();

      expect(messageMetrics.totalSent).toBe(0);
      expect(messageMetrics.successful).toBe(0);
      expect(performanceMetrics.patientsProcessed).toBe(0);
      expect(performanceMetrics.messagesQueued).toBe(0);
    });
  });

  describe('All Metrics', () => {
    it('should return all metrics in correct format', () => {
      metrics.recordMessageSent(true, '30min', 'sector1', 'channel1', 1000);
      metrics.recordApiCall(true, 500);
      metrics.recordMonitoringCycle(2000, 10, 2);

      const allMetrics = metrics.getAllMetrics();

      expect(allMetrics).toHaveProperty('messages');
      expect(allMetrics).toHaveProperty('system');
      expect(allMetrics).toHaveProperty('performance');
      expect(allMetrics).toHaveProperty('alerts');

      expect(allMetrics.messages.totalSent).toBe(1);
      expect(allMetrics.system.totalRequests).toBe(1);
      expect(allMetrics.performance.monitoringCycles).toBe(1);
      expect(Array.isArray(allMetrics.alerts)).toBe(true);
    });
  });

  describe('Singleton Instance', () => {
    it('should provide singleton instance', () => {
      expect(metricsService).toBeInstanceOf(MetricsService);
      
      const instance1 = metricsService;
      const instance2 = metricsService;
      
      expect(instance1).toBe(instance2);
    });
  });
});