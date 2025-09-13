import { WaitingPatient, SystemConfig, ExclusionEntry } from './types';

export function validateWaitingPatient(patient: any): patient is WaitingPatient {
  return (
    typeof patient === 'object' &&
    typeof patient.id === 'string' &&
    typeof patient.name === 'string' &&
    typeof patient.phone === 'string' &&
    typeof patient.sectorId === 'string' &&
    typeof patient.sectorName === 'string' &&
    typeof patient.channelId === 'string' &&
    (patient.channelType === 'normal' || patient.channelType === 'api_oficial') &&
    patient.waitStartTime instanceof Date &&
    typeof patient.waitTimeMinutes === 'number'
  );
}

export function validateSystemConfig(config: any): config is SystemConfig {
  return (
    typeof config === 'object' &&
    typeof config.flowPaused === 'boolean' &&
    Array.isArray(config.excludedSectors) &&
    Array.isArray(config.excludedChannels) &&
    typeof config.endOfDayTime === 'string'
  );
}

export function validateExclusionEntry(entry: any): entry is ExclusionEntry {
  return (
    typeof entry === 'object' &&
    typeof entry.attendanceId === 'string' &&
    (entry.messageType === '30min' || entry.messageType === 'end_of_day') &&
    entry.sentAt instanceof Date &&
    entry.expiresAt instanceof Date
  );
}

export function validatePhoneNumber(phone: string): boolean {
  // Brazilian phone number validation
  const phoneRegex = /^\+55\d{10,11}$/;
  return phoneRegex.test(phone);
}

export function validateSectorId(sectorId: string): boolean {
  return typeof sectorId === 'string' && sectorId.length > 0;
}

export function validateChannelId(channelId: string): boolean {
  return typeof channelId === 'string' && channelId.length > 0;
}