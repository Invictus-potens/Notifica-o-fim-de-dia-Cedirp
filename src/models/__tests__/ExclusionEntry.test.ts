import { 
  ExclusionEntry, 
  validateExclusionEntry, 
  createExclusionEntry, 
  isExclusionEntryExpired 
} from '../ExclusionEntry';

describe('ExclusionEntry', () => {
  describe('validateExclusionEntry', () => {
    it('should return true for valid ExclusionEntry', () => {
      const now = new Date();
      const later = new Date(now.getTime() + 60000); // 1 minute later

      const validEntry: ExclusionEntry = {
        attendanceId: 'attendance123',
        messageType: '30min',
        sentAt: now,
        expiresAt: later
      };

      expect(validateExclusionEntry(validEntry)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(validateExclusionEntry(null)).toBe(false);
      expect(validateExclusionEntry(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(validateExclusionEntry('string')).toBe(false);
      expect(validateExclusionEntry(123)).toBe(false);
      expect(validateExclusionEntry([])).toBe(false);
    });

    it('should return false for empty attendanceId', () => {
      const now = new Date();
      const later = new Date(now.getTime() + 60000);

      const invalidEntry = {
        attendanceId: '',
        messageType: '30min',
        sentAt: now,
        expiresAt: later
      };

      expect(validateExclusionEntry(invalidEntry)).toBe(false);
    });

    it('should return false for invalid messageType', () => {
      const now = new Date();
      const later = new Date(now.getTime() + 60000);

      const invalidEntry = {
        attendanceId: 'attendance123',
        messageType: 'invalid_type',
        sentAt: now,
        expiresAt: later
      };

      expect(validateExclusionEntry(invalidEntry)).toBe(false);
    });

    it('should return false for invalid date objects', () => {
      const invalidEntries = [
        {
          attendanceId: 'attendance123',
          messageType: '30min',
          sentAt: 'invalid-date',
          expiresAt: new Date()
        },
        {
          attendanceId: 'attendance123',
          messageType: '30min',
          sentAt: new Date(),
          expiresAt: 'invalid-date'
        },
        {
          attendanceId: 'attendance123',
          messageType: '30min',
          sentAt: new Date('invalid'),
          expiresAt: new Date()
        }
      ];

      invalidEntries.forEach(entry => {
        expect(validateExclusionEntry(entry)).toBe(false);
      });
    });

    it('should return false when expiresAt is before or equal to sentAt', () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 60000); // 1 minute earlier

      const invalidEntry1 = {
        attendanceId: 'attendance123',
        messageType: '30min',
        sentAt: now,
        expiresAt: earlier
      };

      const invalidEntry2 = {
        attendanceId: 'attendance123',
        messageType: '30min',
        sentAt: now,
        expiresAt: now
      };

      expect(validateExclusionEntry(invalidEntry1)).toBe(false);
      expect(validateExclusionEntry(invalidEntry2)).toBe(false);
    });
  });

  describe('createExclusionEntry', () => {
    it('should create valid ExclusionEntry for 30min message', () => {
      const attendanceId = 'attendance123';
      const messageType = '30min';

      const entry = createExclusionEntry(attendanceId, messageType);

      expect(entry).not.toBeNull();
      expect(entry?.attendanceId).toBe(attendanceId);
      expect(entry?.messageType).toBe(messageType);
      expect(entry?.sentAt).toBeInstanceOf(Date);
      expect(entry?.expiresAt).toBeInstanceOf(Date);
      expect(entry?.expiresAt.getTime()).toBeGreaterThan(entry?.sentAt.getTime() || 0);
    });

    it('should create valid ExclusionEntry for end_of_day message', () => {
      const attendanceId = 'attendance456';
      const messageType = 'end_of_day';

      const entry = createExclusionEntry(attendanceId, messageType);

      expect(entry).not.toBeNull();
      expect(entry?.attendanceId).toBe(attendanceId);
      expect(entry?.messageType).toBe(messageType);
    });

    it('should set correct expiration for 30min message (end of day)', () => {
      const entry = createExclusionEntry('attendance123', '30min');

      expect(entry).not.toBeNull();
      expect(entry?.expiresAt.getHours()).toBe(23);
      expect(entry?.expiresAt.getMinutes()).toBe(59);
      expect(entry?.expiresAt.getSeconds()).toBe(59);
    });

    it('should set correct expiration for end_of_day message (1 hour)', () => {
      const beforeCreation = new Date();
      const entry = createExclusionEntry('attendance123', 'end_of_day');
      const afterCreation = new Date();

      expect(entry).not.toBeNull();
      
      const expectedMinExpiration = new Date(beforeCreation.getTime() + 60 * 60 * 1000);
      const expectedMaxExpiration = new Date(afterCreation.getTime() + 60 * 60 * 1000);

      expect(entry?.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiration.getTime());
      expect(entry?.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiration.getTime());
    });

    it('should return null for empty attendanceId', () => {
      const entry = createExclusionEntry('', '30min');
      expect(entry).toBeNull();
    });

    it('should trim whitespace from attendanceId', () => {
      const entry = createExclusionEntry('  attendance123  ', '30min');
      expect(entry?.attendanceId).toBe('attendance123');
    });
  });

  describe('isExclusionEntryExpired', () => {
    it('should return true for expired entry', () => {
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago
      const expiredEntry: ExclusionEntry = {
        attendanceId: 'attendance123',
        messageType: '30min',
        sentAt: new Date(Date.now() - 120000), // 2 minutes ago
        expiresAt: pastDate
      };

      expect(isExclusionEntryExpired(expiredEntry)).toBe(true);
    });

    it('should return false for non-expired entry', () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const validEntry: ExclusionEntry = {
        attendanceId: 'attendance123',
        messageType: '30min',
        sentAt: new Date(),
        expiresAt: futureDate
      };

      expect(isExclusionEntryExpired(validEntry)).toBe(false);
    });

    it('should return true for entry expiring exactly now', () => {
      const now = new Date();
      const entryExpiringNow: ExclusionEntry = {
        attendanceId: 'attendance123',
        messageType: '30min',
        sentAt: new Date(now.getTime() - 60000),
        expiresAt: now
      };

      // Wait a tiny bit to ensure "now" is in the past
      setTimeout(() => {
        expect(isExclusionEntryExpired(entryExpiringNow)).toBe(true);
      }, 1);
    });
  });
});