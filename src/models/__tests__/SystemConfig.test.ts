import { 
  SystemConfig, 
  validateSystemConfig, 
  createDefaultSystemConfig, 
  updateSystemConfig 
} from '../SystemConfig';

describe('SystemConfig', () => {
  describe('validateSystemConfig', () => {
    it('should return true for valid SystemConfig', () => {
      const validConfig: SystemConfig = {
        flowPaused: false,
        excludedSectors: ['sector1', 'sector2'],
        excludedChannels: ['channel1'],
        selectedActionCard: 'card1',
        selectedTemplate: 'template1',
        endOfDayTime: '18:00'
      };

      expect(validateSystemConfig(validConfig)).toBe(true);
    });

    it('should return true for valid config with optional fields undefined', () => {
      const validConfig: SystemConfig = {
        flowPaused: true,
        excludedSectors: [],
        excludedChannels: [],
        selectedActionCard: undefined,
        selectedTemplate: undefined,
        endOfDayTime: '17:30'
      };

      expect(validateSystemConfig(validConfig)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(validateSystemConfig(null)).toBe(false);
      expect(validateSystemConfig(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(validateSystemConfig('string')).toBe(false);
      expect(validateSystemConfig(123)).toBe(false);
      expect(validateSystemConfig([])).toBe(false);
    });

    it('should return false for invalid flowPaused type', () => {
      const invalidConfig = {
        flowPaused: 'true',
        excludedSectors: [],
        excludedChannels: [],
        endOfDayTime: '18:00'
      };

      expect(validateSystemConfig(invalidConfig)).toBe(false);
    });

    it('should return false for non-array excludedSectors', () => {
      const invalidConfig = {
        flowPaused: false,
        excludedSectors: 'sector1,sector2',
        excludedChannels: [],
        endOfDayTime: '18:00'
      };

      expect(validateSystemConfig(invalidConfig)).toBe(false);
    });

    it('should return false for excludedSectors with non-string elements', () => {
      const invalidConfig = {
        flowPaused: false,
        excludedSectors: ['sector1', 123, 'sector2'],
        excludedChannels: [],
        endOfDayTime: '18:00'
      };

      expect(validateSystemConfig(invalidConfig)).toBe(false);
    });

    it('should return false for invalid endOfDayTime format', () => {
      const invalidConfigs = [
        {
          flowPaused: false,
          excludedSectors: [],
          excludedChannels: [],
          endOfDayTime: '25:00' // invalid hour
        },
        {
          flowPaused: false,
          excludedSectors: [],
          excludedChannels: [],
          endOfDayTime: '18:60' // invalid minute
        },
        {
          flowPaused: false,
          excludedSectors: [],
          excludedChannels: [],
          endOfDayTime: '18' // missing minute
        },
        {
          flowPaused: false,
          excludedSectors: [],
          excludedChannels: [],
          endOfDayTime: 'invalid-time'
        }
      ];

      invalidConfigs.forEach(config => {
        expect(validateSystemConfig(config)).toBe(false);
      });
    });

    it('should return true for valid time formats', () => {
      const validTimes = ['00:00', '12:30', '23:59', '9:15', '18:00'];
      
      validTimes.forEach(time => {
        const config = {
          flowPaused: false,
          excludedSectors: [],
          excludedChannels: [],
          endOfDayTime: time
        };
        expect(validateSystemConfig(config)).toBe(true);
      });
    });
  });

  describe('createDefaultSystemConfig', () => {
    it('should create valid default configuration', () => {
      const defaultConfig = createDefaultSystemConfig();
      
      expect(validateSystemConfig(defaultConfig)).toBe(true);
      expect(defaultConfig.flowPaused).toBe(false);
      expect(defaultConfig.excludedSectors).toEqual([]);
      expect(defaultConfig.excludedChannels).toEqual([]);
      expect(defaultConfig.selectedActionCard).toBeUndefined();
      expect(defaultConfig.selectedTemplate).toBeUndefined();
      expect(defaultConfig.endOfDayTime).toBe('18:00');
    });
  });

  describe('updateSystemConfig', () => {
    it('should update config with valid changes', () => {
      const currentConfig = createDefaultSystemConfig();
      const updates = {
        flowPaused: true,
        excludedSectors: ['sector1']
      };

      const updatedConfig = updateSystemConfig(currentConfig, updates);
      
      expect(updatedConfig.flowPaused).toBe(true);
      expect(updatedConfig.excludedSectors).toEqual(['sector1']);
      expect(updatedConfig.endOfDayTime).toBe('18:00'); // unchanged
    });

    it('should return original config for invalid updates', () => {
      const currentConfig = createDefaultSystemConfig();
      const invalidUpdates = {
        flowPaused: 'invalid' as any,
        endOfDayTime: 'invalid-time'
      };

      const result = updateSystemConfig(currentConfig, invalidUpdates);
      
      expect(result).toEqual(currentConfig);
    });

    it('should handle partial updates correctly', () => {
      const currentConfig = createDefaultSystemConfig();
      const updates = {
        selectedActionCard: 'card123'
      };

      const updatedConfig = updateSystemConfig(currentConfig, updates);
      
      expect(updatedConfig.selectedActionCard).toBe('card123');
      expect(updatedConfig.flowPaused).toBe(false); // unchanged
    });
  });
});