import { WaitingPatient, validateWaitingPatient, createWaitingPatient } from '../WaitingPatient';

describe('WaitingPatient', () => {
  describe('validateWaitingPatient', () => {
    it('should return true for valid WaitingPatient', () => {
      const validPatient: WaitingPatient = {
        id: '123',
        name: 'João Silva',
        phone: '11999999999',
        sectorId: 'sector1',
        sectorName: 'Cardiologia',
        channelId: 'channel1',
        channelType: 'normal',
        waitStartTime: new Date(),
        waitTimeMinutes: 30
      };

      expect(validateWaitingPatient(validPatient)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(validateWaitingPatient(null)).toBe(false);
      expect(validateWaitingPatient(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(validateWaitingPatient('string')).toBe(false);
      expect(validateWaitingPatient(123)).toBe(false);
      expect(validateWaitingPatient([])).toBe(false);
    });

    it('should return false for missing required fields', () => {
      const incompletePatient = {
        name: 'João Silva',
        phone: '11999999999'
        // missing other required fields
      };

      expect(validateWaitingPatient(incompletePatient)).toBe(false);
    });

    it('should return false for empty string fields', () => {
      const patientWithEmptyFields = {
        id: '',
        name: 'João Silva',
        phone: '11999999999',
        sectorId: 'sector1',
        sectorName: 'Cardiologia',
        channelId: 'channel1',
        channelType: 'normal',
        waitStartTime: new Date(),
        waitTimeMinutes: 30
      };

      expect(validateWaitingPatient(patientWithEmptyFields)).toBe(false);
    });

    it('should return false for invalid channelType', () => {
      const patientWithInvalidChannelType = {
        id: '123',
        name: 'João Silva',
        phone: '11999999999',
        sectorId: 'sector1',
        sectorName: 'Cardiologia',
        channelId: 'channel1',
        channelType: 'invalid_type',
        waitStartTime: new Date(),
        waitTimeMinutes: 30
      };

      expect(validateWaitingPatient(patientWithInvalidChannelType)).toBe(false);
    });

    it('should return false for invalid waitStartTime', () => {
      const patientWithInvalidDate = {
        id: '123',
        name: 'João Silva',
        phone: '11999999999',
        sectorId: 'sector1',
        sectorName: 'Cardiologia',
        channelId: 'channel1',
        channelType: 'normal',
        waitStartTime: 'invalid-date',
        waitTimeMinutes: 30
      };

      expect(validateWaitingPatient(patientWithInvalidDate)).toBe(false);
    });

    it('should return false for negative waitTimeMinutes', () => {
      const patientWithNegativeTime = {
        id: '123',
        name: 'João Silva',
        phone: '11999999999',
        sectorId: 'sector1',
        sectorName: 'Cardiologia',
        channelId: 'channel1',
        channelType: 'normal',
        waitStartTime: new Date(),
        waitTimeMinutes: -5
      };

      expect(validateWaitingPatient(patientWithNegativeTime)).toBe(false);
    });
  });

  describe('createWaitingPatient', () => {
    it('should create valid WaitingPatient with complete data', () => {
      const data = {
        id: '123',
        name: 'João Silva',
        phone: '11999999999',
        sectorId: 'sector1',
        sectorName: 'Cardiologia',
        channelId: 'channel1',
        channelType: 'normal' as const,
        waitStartTime: new Date(),
        waitTimeMinutes: 30
      };

      const result = createWaitingPatient(data);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('123');
      expect(result?.name).toBe('João Silva');
    });

    it('should return null for invalid data', () => {
      const invalidData = {
        id: '',
        name: 'João Silva'
        // missing required fields
      };

      const result = createWaitingPatient(invalidData);
      expect(result).toBeNull();
    });

    it('should use default values for missing optional fields', () => {
      const minimalData = {
        id: '123',
        name: 'João Silva',
        phone: '11999999999',
        sectorId: 'sector1',
        sectorName: 'Cardiologia',
        channelId: 'channel1'
      };

      const result = createWaitingPatient(minimalData);
      expect(result).not.toBeNull();
      expect(result?.channelType).toBe('normal');
      expect(result?.waitTimeMinutes).toBe(0);
      expect(result?.waitStartTime).toBeInstanceOf(Date);
    });
  });
});