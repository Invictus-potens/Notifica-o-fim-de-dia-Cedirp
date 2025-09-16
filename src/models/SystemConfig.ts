export interface SystemConfig {
  flowPaused: boolean;
  excludedSectors: string[];
  excludedChannels: string[];
  selectedActionCard?: string;
  selectedActionCard30Min?: string;
  selectedActionCardEndDay?: string;
  selectedTemplate?: string;
  endOfDayTime: string; // "18:00"
}

export function validateSystemConfig(config: any): config is SystemConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  // Validar flowPaused
  if (typeof config.flowPaused !== 'boolean') {
    return false;
  }

  // Validar excludedSectors
  if (!Array.isArray(config.excludedSectors)) {
    return false;
  }
  if (!config.excludedSectors.every((sector: any) => typeof sector === 'string')) {
    return false;
  }

  // Validar excludedChannels
  if (!Array.isArray(config.excludedChannels)) {
    return false;
  }
  if (!config.excludedChannels.every((channel: any) => typeof channel === 'string')) {
    return false;
  }

  // Validar selectedActionCard (opcional)
  if (config.selectedActionCard !== undefined && typeof config.selectedActionCard !== 'string') {
    return false;
  }

  // Validar selectedActionCard30Min (opcional)
  if (config.selectedActionCard30Min !== undefined && typeof config.selectedActionCard30Min !== 'string') {
    return false;
  }

  // Validar selectedActionCardEndDay (opcional)
  if (config.selectedActionCardEndDay !== undefined && typeof config.selectedActionCardEndDay !== 'string') {
    return false;
  }

  // Validar selectedTemplate (opcional)
  if (config.selectedTemplate !== undefined && typeof config.selectedTemplate !== 'string') {
    return false;
  }

  // Validar endOfDayTime (formato HH:MM)
  if (!config.endOfDayTime || typeof config.endOfDayTime !== 'string') {
    return false;
  }
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(config.endOfDayTime)) {
    return false;
  }

  return true;
}

export function createDefaultSystemConfig(): SystemConfig {
  return {
    flowPaused: false,
    excludedSectors: [],
    excludedChannels: [],
    selectedActionCard: undefined,
    selectedActionCard30Min: undefined,
    selectedActionCardEndDay: undefined,
    selectedTemplate: undefined,
    endOfDayTime: '18:00'
  };
}

export function updateSystemConfig(current: SystemConfig, updates: Partial<SystemConfig>): SystemConfig {
  const updated = { ...current, ...updates };
  return validateSystemConfig(updated) ? updated : current;
}