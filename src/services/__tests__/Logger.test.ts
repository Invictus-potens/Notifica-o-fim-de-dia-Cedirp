import { Logger, logger } from '../Logger';
import { LogLevel } from '../ErrorHandler';

describe('Logger', () => {
  beforeEach(() => {
    // Clear logs before each test
    logger.clearLogs();
  });

  afterEach(() => {
    // Restore console methods if mocked
    ['debug', 'info', 'warn', 'error'].forEach(method => {
      if (jest.isMockFunction(console[method as keyof Console])) {
        (console[method as keyof Console] as jest.Mock).mockRestore();
      }
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(logger);
    });
  });

  describe('Basic Logging Methods', () => {
    it('should log debug messages', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      
      logger.debug('Debug message', 'TEST_CONTEXT', { key: 'value' });
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Debug message');
      expect(logs[0].context).toBe('TEST_CONTEXT');
      expect(logs[0].metadata).toEqual({ key: 'value' });
      
      consoleSpy.mockRestore();
    });

    it('should log info messages', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      logger.info('Info message', 'TEST_CONTEXT');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Info message');
      
      consoleSpy.mockRestore();
    });

    it('should log warning messages', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      logger.warn('Warning message', 'TEST_CONTEXT');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].message).toBe('Warning message');
      
      consoleSpy.mockRestore();
    });

    it('should log error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Test error');
      
      logger.error('Error message', 'TEST_CONTEXT', testError);
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].message).toBe('Error message');
      expect(logs[0].error).toBe(testError);
      
      consoleSpy.mockRestore();
    });

    it('should log critical messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Critical error');
      
      logger.critical('Critical message', 'TEST_CONTEXT', testError);
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.CRITICAL);
      expect(logs[0].message).toBe('Critical message');
      expect(logs[0].error).toBe(testError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Convenience Methods', () => {
    it('should log API calls', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Successful API call
      logger.logApiCall('/api/test', 'GET', true, 150);
      
      let logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('API call successful');
      expect(logs[0].context).toBe('API_CLIENT');
      expect(logs[0].metadata).toEqual({
        endpoint: '/api/test',
        method: 'GET',
        duration: 150
      });
      
      // Failed API call
      logger.logApiCall('/api/test', 'POST', false);
      
      logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[1].level).toBe(LogLevel.ERROR);
      expect(logs[1].message).toBe('API call failed');
      
      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('should log message sending', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Successful message
      logger.logMessageSent('patient123', '30min', true);
      
      let logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Message sent successfully');
      expect(logs[0].context).toBe('MESSAGE_SERVICE');
      expect(logs[0].metadata).toEqual({
        patientId: 'patient123',
        messageType: '30min'
      });
      
      // Failed message
      const error = new Error('Send failed');
      logger.logMessageSent('patient456', 'end_of_day', false, error);
      
      logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[1].level).toBe(LogLevel.ERROR);
      expect(logs[1].message).toBe('Failed to send message');
      expect(logs[1].error).toBe(error);
      
      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('should log monitoring cycles', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      logger.logMonitoringCycle(25, 3, 1500);
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Monitoring cycle completed');
      expect(logs[0].context).toBe('MONITORING_SERVICE');
      expect(logs[0].metadata).toEqual({
        patientsFound: 25,
        messagesEligible: 3,
        duration: 1500
      });
      
      consoleSpy.mockRestore();
    });

    it('should log configuration changes', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      logger.logConfigChange('flowPaused', false, true, 'admin123');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Configuration changed');
      expect(logs[0].context).toBe('CONFIG_MANAGER');
      expect(logs[0].metadata).toEqual({
        setting: 'flowPaused',
        oldValue: false,
        newValue: true,
        userId: 'admin123'
      });
      
      consoleSpy.mockRestore();
    });

    it('should log database operations', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Successful operation
      logger.logDatabaseOperation('INSERT', 'exclusions', true);
      
      let logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Database operation successful');
      expect(logs[0].context).toBe('DATABASE');
      
      // Failed operation
      const error = new Error('Connection failed');
      logger.logDatabaseOperation('SELECT', 'config', false, error);
      
      logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[1].level).toBe(LogLevel.ERROR);
      expect(logs[1].message).toBe('Database operation failed');
      expect(logs[1].error).toBe(error);
      
      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Log Management', () => {
    it('should get logs with filtering', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      logger.debug('Debug message', 'TEST');
      logger.info('Info message', 'TEST');
      logger.error('Error message', 'TEST');
      
      const allLogs = logger.getLogs();
      expect(allLogs).toHaveLength(3);
      
      const errorLogs = logger.getLogs(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe(LogLevel.ERROR);
      
      const limitedLogs = logger.getLogs(undefined, 2);
      expect(limitedLogs).toHaveLength(2);
      
      consoleSpy.mockRestore();
      infoSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('should clear logs', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      logger.info('Test message', 'TEST');
      expect(logger.getLogs()).toHaveLength(1);
      
      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
      
      consoleSpy.mockRestore();
    });

    it('should get error statistics', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const error1 = new TypeError('Type error');
      const error2 = new ReferenceError('Reference error');
      
      logger.error('Error 1', 'CONTEXT_A', error1);
      logger.error('Error 2', 'CONTEXT_B', error2);
      
      const stats = logger.getErrorStats();
      expect(stats.totalErrors).toBe(2);
      expect(stats.errorsByType['TypeError']).toBe(1);
      expect(stats.errorsByType['ReferenceError']).toBe(1);
      expect(stats.errorsByContext['CONTEXT_A']).toBe(1);
      expect(stats.errorsByContext['CONTEXT_B']).toBe(1);
      
      consoleSpy.mockRestore();
    });

    it('should set log level', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();
      
      // Set to INFO level
      logger.setLogLevel(LogLevel.INFO);
      
      logger.debug('Debug message', 'TEST'); // Should be filtered
      logger.info('Info message', 'TEST');   // Should be logged
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      
      consoleSpy.mockRestore();
      infoSpy.mockRestore();
    });
  });
});