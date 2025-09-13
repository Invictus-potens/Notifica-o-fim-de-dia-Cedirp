import {
  validateWaitingPatient,
  validateSystemConfig,
  validateExclusionEntry,
  validateApiResponse,
  isValidPhoneNumber,
  isValidEmail,
  sanitizeInput
} from '../validation';
import { WaitingPatient } from '../WaitingPatient';
import { SystemConfig } from '../SystemConfig';
import { ExclusionEntry } from '../ExclusionEntry';

describe('Validation Functions', () => {
  describe('validateWaitingPatient', () => {
    const validPatient: WaitingPatient = {
      id: 'patient123',
      name: 'João Silva',
      phone: '11999999999',
      sectorId: 'sector1',
      sectorName: 'Cardiologia',
      channelId: 'channel1',
      channelType: 'normal',
      waitStartTime: new Date(),
      waitTimeMinutes: 30
    };

    it('should validate a valid patient', () => {
      const result = validateWaitingPatient(validPatient);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject patient with missing id', () => {
      const invalidPatient = { ...validPatient, id: '' };
      const result = validateWaitingPatient(invalidPatient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID é obrigatório');
    });

    it('should reject patient with missing name', () => {
      const invalidPatient = { ...validPatient, name: '' };
      const result = validateWaitingPatient(invalidPatient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nome é obrigatório');
    });

    it('should reject patient with invalid phone', () => {
      const invalidPatient = { ...validPatient, phone: '123' };
      const result = validateWaitingPatient(invalidPatient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Telefone deve ter pelo menos 10 dígitos');
    });

    it('should reject patient with missing sector info', () => {
      const invalidPatient = { ...validPatient, sectorId: '', sectorName: '' };
      const result = validateWaitingPatient(invalidPatient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID do setor é obrigatório');
      expect(result.errors).toContain('Nome do setor é obrigatório');
    });

    it('should reject patient with missing channel info', () => {
      const invalidPatient = { ...validPatient, channelId: '' };
      const result = validateWaitingPatient(invalidPatient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID do canal é obrigatório');
    });

    it('should reject patient with invalid channel type', () => {
      const invalidPatient = { ...validPatient, channelType: 'invalid' as any };
      const result = validateWaitingPatient(invalidPatient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tipo de canal deve ser "normal" ou "api_oficial"');
    });

    it('should reject patient with invalid wait time', () => {
      const invalidPatient = { ...validPatient, waitTimeMinutes: -1 };
      const result = validateWaitingPatient(invalidPatient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tempo de espera deve ser maior ou igual a 0');
    });

    it('should reject patient with future wait start time', () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute in future
      const invalidPatient = { ...validPatient, waitStartTime: futureDate };
      const result = validateWaitingPatient(invalidPatient);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Horário de início da espera não pode ser no futuro');
    });

    it('should handle null/undefined patient', () => {
      const result1 = validateWaitingPatient(null as any);
      const result2 = validateWaitingPatient(undefined as any);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.errors).toContain('Paciente é obrigatório');
      expect(result2.errors).toContain('Paciente é obrigatório');
    });
  });

  describe('validateSystemConfig', () => {
    const validConfig: SystemConfig = {
      flowPaused: false,
      excludedSectors: ['sector1'],
      excludedChannels: ['channel1'],
      selectedActionCard: 'card1',
      selectedTemplate: 'template1',
      endOfDayTime: '18:00'
    };

    it('should validate a valid config', () => {
      const result = validateSystemConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject config with invalid endOfDayTime format', () => {
      const invalidConfig = { ...validConfig, endOfDayTime: '25:00' };
      const result = validateSystemConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Horário de fim de expediente deve estar no formato HH:MM (00:00-23:59)');
    });

    it('should reject config with invalid endOfDayTime format (not HH:MM)', () => {
      const invalidConfig = { ...validConfig, endOfDayTime: '6pm' };
      const result = validateSystemConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Horário de fim de expediente deve estar no formato HH:MM (00:00-23:59)');
    });

    it('should accept valid time formats', () => {
      const validTimes = ['00:00', '12:30', '23:59', '18:00'];
      
      validTimes.forEach(time => {
        const config = { ...validConfig, endOfDayTime: time };
        const result = validateSystemConfig(config);
        expect(result.isValid).toBe(true);
      });
    });

    it('should handle null/undefined config', () => {
      const result1 = validateSystemConfig(null as any);
      const result2 = validateSystemConfig(undefined as any);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.errors).toContain('Configuração é obrigatória');
      expect(result2.errors).toContain('Configuração é obrigatória');
    });

    it('should validate arrays are actually arrays', () => {
      const invalidConfig = {
        ...validConfig,
        excludedSectors: 'not-an-array' as any,
        excludedChannels: 123 as any
      };
      const result = validateSystemConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Setores excluídos deve ser um array');
      expect(result.errors).toContain('Canais excluídos deve ser um array');
    });
  });

  describe('validateExclusionEntry', () => {
    const validEntry: ExclusionEntry = {
      id: 'entry123',
      attendanceId: 'att123',
      messageType: '30min',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    it('should validate a valid entry', () => {
      const result = validateExclusionEntry(validEntry);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject entry with missing required fields', () => {
      const invalidEntry = {
        ...validEntry,
        id: '',
        attendanceId: '',
        messageType: '' as any
      };
      const result = validateExclusionEntry(invalidEntry);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID é obrigatório');
      expect(result.errors).toContain('ID do atendimento é obrigatório');
      expect(result.errors).toContain('Tipo de mensagem é obrigatório');
    });

    it('should reject entry with invalid message type', () => {
      const invalidEntry = { ...validEntry, messageType: 'invalid' as any };
      const result = validateExclusionEntry(invalidEntry);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tipo de mensagem deve ser "30min" ou "end_of_day"');
    });

    it('should reject entry with expiration before sent date', () => {
      const invalidEntry = {
        ...validEntry,
        sentAt: new Date(),
        expiresAt: new Date(Date.now() - 60000) // 1 minute ago
      };
      const result = validateExclusionEntry(invalidEntry);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data de expiração deve ser posterior à data de envio');
    });

    it('should handle null/undefined entry', () => {
      const result1 = validateExclusionEntry(null as any);
      const result2 = validateExclusionEntry(undefined as any);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.errors).toContain('Entrada de exclusão é obrigatória');
      expect(result2.errors).toContain('Entrada de exclusão é obrigatória');
    });

    it('should handle invalid date objects', () => {
      const invalidEntry = {
        ...validEntry,
        sentAt: new Date('invalid'),
        expiresAt: new Date('invalid')
      };
      const result = validateExclusionEntry(invalidEntry);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data de envio deve ser uma data válida');
      expect(result.errors).toContain('Data de expiração deve ser uma data válida');
    });
  });

  describe('validateApiResponse', () => {
    it('should validate successful API response', () => {
      const response = {
        success: true,
        data: { test: 'data' },
        message: 'Success'
      };
      
      const result = validateApiResponse(response);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate failed API response', () => {
      const response = {
        success: false,
        error: 'Something went wrong',
        message: 'Error occurred'
      };
      
      const result = validateApiResponse(response);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject response without success field', () => {
      const response = {
        data: { test: 'data' }
      };
      
      const result = validateApiResponse(response);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Campo "success" é obrigatório');
    });

    it('should handle null/undefined response', () => {
      const result1 = validateApiResponse(null as any);
      const result2 = validateApiResponse(undefined as any);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.errors).toContain('Resposta da API é obrigatória');
      expect(result2.errors).toContain('Resposta da API é obrigatória');
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should validate Brazilian phone numbers', () => {
      const validNumbers = [
        '11999999999',
        '(11) 99999-9999',
        '+55 11 99999-9999',
        '5511999999999',
        '11 99999-9999'
      ];
      
      validNumbers.forEach(number => {
        expect(isValidPhoneNumber(number)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidNumbers = [
        '123',
        '11999',
        'abc123',
        '',
        null,
        undefined
      ];
      
      invalidNumbers.forEach(number => {
        expect(isValidPhoneNumber(number as any)).toBe(false);
      });
    });
  });

  describe('isValidEmail', () => {
    it('should validate email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];
      
      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        '',
        null,
        undefined
      ];
      
      invalidEmails.forEach(email => {
        expect(isValidEmail(email as any)).toBe(false);
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML and script tags', () => {
      const maliciousInput = '<script>alert("xss")</script><b>Bold text</b>';
      const sanitized = sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Bold text');
    });

    it('should trim whitespace', () => {
      const input = '  test input  ';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('test input');
    });

    it('should handle null/undefined input', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeInput(123 as any)).toBe('123');
      expect(sanitizeInput(true as any)).toBe('true');
      expect(sanitizeInput({} as any)).toBe('[object Object]');
    });

    it('should preserve safe HTML entities', () => {
      const input = 'Test &amp; example &lt;tag&gt;';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toContain('&amp;');
      expect(sanitized).toContain('&lt;');
      expect(sanitized).toContain('&gt;');
    });

    it('should limit input length', () => {
      const longInput = 'a'.repeat(10000);
      const sanitized = sanitizeInput(longInput, 100);
      
      expect(sanitized.length).toBeLessThanOrEqual(100);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle circular references in objects', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      // Should not throw error
      expect(() => validateSystemConfig(circularObj)).not.toThrow();
    });

    it('should handle very large numbers', () => {
      const patient = {
        id: 'test',
        name: 'Test',
        phone: '11999999999',
        sectorId: 'sector1',
        sectorName: 'Test Sector',
        channelId: 'channel1',
        channelType: 'normal' as const,
        waitStartTime: new Date(),
        waitTimeMinutes: Number.MAX_SAFE_INTEGER
      };
      
      const result = validateWaitingPatient(patient);
      expect(result.isValid).toBe(true);
    });

    it('should handle special characters in strings', () => {
      const patient = {
        id: 'test-123',
        name: 'José da Silva Ñoño',
        phone: '11999999999',
        sectorId: 'sector-1',
        sectorName: 'Cardiología & Neurología',
        channelId: 'channel_1',
        channelType: 'normal' as const,
        waitStartTime: new Date(),
        waitTimeMinutes: 30
      };
      
      const result = validateWaitingPatient(patient);
      expect(result.isValid).toBe(true);
    });
  });
});