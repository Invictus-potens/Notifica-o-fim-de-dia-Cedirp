import { ErrorHandler, LogLevel, LogEntry } from '../ErrorHandler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler(LogLevel.DEBUG, 100);
  });

  afterEach(() => {
    // Limpar console.error mock se existir
    if (jest.isMockFunction(console.error)) {
      (console.error as jest.Mock).mockRestore();
    }
  });

  describe('Logging Methods', () => {
    it('should log debug messages when log level allows', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      
      errorHandler.debug('Debug message', 'TEST_CONTEXT');
      
      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Debug message');
      expect(logs[0].context).toBe('TEST_CONTEXT');
      
      consoleSpy.mockRestore();
    });

    it('should log info messages', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      errorHandler.info('Info message', 'TEST_CONTEXT');
      
      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Info message');
      
      consoleSpy.mockRestore();
    });

    it('should log warning messages', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      errorHandler.warn('Warning message', 'TEST_CONTEXT');
      
      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].message).toBe('Warning message');
      
      consoleSpy.mockRestore();
    });

    it('should log error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Test error');
      
      errorHandler.error('Error message', 'TEST_CONTEXT', testError);
      
      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].message).toBe('Error message');
      expect(logs[0].error).toBe(testError);
      
      consoleSpy.mockRestore();
    });

    it('should log critical messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Critical error');
      
      errorHandler.critical('Critical message', 'TEST_CONTEXT', testError);
      
      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.CRITICAL);
      expect(logs[0].message).toBe('Critical message');
      expect(logs[0].error).toBe(testError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect log level filtering', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      
      // Set log level to INFO
      errorHandler.setLogLevel(LogLevel.INFO);
      
      // Debug message should be filtered out
      errorHandler.debug('Debug message', 'TEST_CONTEXT');
      
      // Info message should be logged
      errorHandler.info('Info message', 'TEST_CONTEXT');
      
      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      
      consoleSpy.mockRestore();
    });

    it('should filter logs by level when retrieving', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      errorHandler.debug('Debug message', 'TEST_CONTEXT');
      errorHandler.info('Info message', 'TEST_CONTEXT');
      errorHandler.error('Error message', 'TEST_CONTEXT');
      
      const allLogs = errorHandler.getLogs();
      expect(allLogs).toHaveLength(3);
      
      const errorLogs = errorHandler.getLogs(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe(LogLevel.ERROR);
      
      consoleSpy.mockRestore();
      infoSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Metadata Support', () => {
    it('should store metadata with log entries', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const metadata = { userId: '123', action: 'login' };
      
      errorHandler.info('User action', 'AUTH_SERVICE', metadata);
      
      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].metadata).toEqual(metadata);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Statistics', () => {
    it('should track error statistics', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const error1 = new TypeError('Type error');
      const error2 = new ReferenceError('Reference error');
      const error3 = new TypeError('Another type error');
      
      errorHandler.error('Error 1', 'CONTEXT_A', error1);
      errorHandler.error('Error 2', 'CONTEXT_B', error2);
      errorHandler.error('Error 3', 'CONTEXT_A', error3);
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType['TypeError']).toBe(2);
      expect(stats.errorsByType['ReferenceError']).toBe(1);
      expect(stats.errorsByContext['CONTEXT_A']).toBe(2);
      expect(stats.errorsByContext['CONTEXT_B']).toBe(1);
      expect(stats.lastError).toBeDefined();
      expect(stats.lastError?.message).toBe('Error 3');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Log Management', () => {
    it('should limit number of logs stored', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const smallHandler = new ErrorHandler(LogLevel.DEBUG, 5);
      
      // Add more logs than the limit
      for (let i = 0; i < 10; i++) {
        smallHandler.info(`Message ${i}`, 'TEST_CONTEXT');
      }
      
      const logs = smallHandler.getLogs();
      expect(logs).toHaveLength(5);
      // Should keep the most recent logs
      expect(logs[0].message).toBe('Message 5');
      expect(logs[4].message).toBe('Message 9');
      
      consoleSpy.mockRestore();
    });

    it('should clear all logs', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      errorHandler.info('Message 1', 'TEST_CONTEXT');
      errorHandler.info('Message 2', 'TEST_CONTEXT');
      
      expect(errorHandler.getLogs()).toHaveLength(2);
      
      errorHandler.clearLogs();
      
      expect(errorHandler.getLogs()).toHaveLength(0);
      expect(errorHandler.getErrorStats().totalErrors).toBe(0);
      
      consoleSpy.mockRestore();
    });

    it('should limit returned logs when requested', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      for (let i = 0; i < 10; i++) {
        errorHandler.info(`Message ${i}`, 'TEST_CONTEXT');
      }
      
      const limitedLogs = errorHandler.getLogs(undefined, 3);
      expect(limitedLogs).toHaveLength(3);
      // Should return the most recent logs
      expect(limitedLogs[0].message).toBe('Message 7');
      expect(limitedLogs[2].message).toBe('Message 9');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Legacy Methods', () => {
    it('should support legacy logError method', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Legacy error');
      
      errorHandler.logError(testError, 'LEGACY_CONTEXT');
      
      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].message).toBe('Legacy error');
      expect(logs[0].context).toBe('LEGACY_CONTEXT');
      expect(logs[0].error).toBe(testError);
      
      consoleSpy.mockRestore();
    });

    it('should support notifyAdministrator method', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const criticalError = new Error('Critical system error');
      
      errorHandler.notifyAdministrator(criticalError);
      
      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.CRITICAL);
      expect(logs[0].context).toBe('ADMIN_NOTIFICATION');
      expect(logs[0].error).toBe(criticalError);
      
      consoleSpy.mockRestore();
    });
  });
});