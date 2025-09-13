export interface WaitingPatient {
  id: string;
  name: string;
  phone: string;
  sectorId: string;
  sectorName: string;
  channelId: string;
  channelType: 'normal' | 'api_oficial';
  waitStartTime: Date;
  waitTimeMinutes: number;
}

export function validateWaitingPatient(patient: any): patient is WaitingPatient {
  if (!patient || typeof patient !== 'object') {
    return false;
  }

  // Validar campos obrigatórios
  if (!patient.id || typeof patient.id !== 'string' || patient.id.trim() === '') {
    return false;
  }

  if (!patient.name || typeof patient.name !== 'string' || patient.name.trim() === '') {
    return false;
  }

  if (!patient.phone || typeof patient.phone !== 'string' || patient.phone.trim() === '') {
    return false;
  }

  if (!patient.sectorId || typeof patient.sectorId !== 'string' || patient.sectorId.trim() === '') {
    return false;
  }

  if (!patient.sectorName || typeof patient.sectorName !== 'string' || patient.sectorName.trim() === '') {
    return false;
  }

  if (!patient.channelId || typeof patient.channelId !== 'string' || patient.channelId.trim() === '') {
    return false;
  }

  // Validar channelType
  if (!patient.channelType || !['normal', 'api_oficial'].includes(patient.channelType)) {
    return false;
  }

  // Validar waitStartTime
  if (!patient.waitStartTime || !(patient.waitStartTime instanceof Date) || isNaN(patient.waitStartTime.getTime())) {
    return false;
  }

  // Validar waitTimeMinutes
  if (typeof patient.waitTimeMinutes !== 'number' || patient.waitTimeMinutes < 0) {
    return false;
  }

  return true;
}

export function createWaitingPatient(data: Partial<WaitingPatient>): WaitingPatient | null {
  const patient = {
    id: data.id || '',
    name: data.name || '',
    phone: data.phone || '',
    sectorId: data.sectorId || '',
    sectorName: data.sectorName || '',
    channelId: data.channelId || '',
    channelType: data.channelType || 'normal' as const,
    waitStartTime: data.waitStartTime || new Date(),
    waitTimeMinutes: data.waitTimeMinutes || 0
  };

  return validateWaitingPatient(patient) ? patient : null;
}