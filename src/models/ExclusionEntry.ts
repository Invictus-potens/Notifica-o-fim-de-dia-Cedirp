export interface ExclusionEntry {
  id?: string;
  attendanceId: string;
  messageType: '30min' | 'end_of_day';
  sentAt: Date;
  expiresAt: Date;
}

export function validateExclusionEntry(entry: any): entry is ExclusionEntry {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  // Validar id (opcional)
  if (entry.id !== undefined && (typeof entry.id !== 'string' || entry.id.trim() === '')) {
    return false;
  }

  // Validar attendanceId
  if (!entry.attendanceId || typeof entry.attendanceId !== 'string' || entry.attendanceId.trim() === '') {
    return false;
  }

  // Validar messageType
  if (!entry.messageType || !['30min', 'end_of_day'].includes(entry.messageType)) {
    return false;
  }

  // Validar sentAt
  if (!entry.sentAt || !(entry.sentAt instanceof Date) || isNaN(entry.sentAt.getTime())) {
    return false;
  }

  // Validar expiresAt
  if (!entry.expiresAt || !(entry.expiresAt instanceof Date) || isNaN(entry.expiresAt.getTime())) {
    return false;
  }

  // Validar que expiresAt é posterior a sentAt
  if (entry.expiresAt <= entry.sentAt) {
    return false;
  }

  return true;
}

export function createExclusionEntry(
  attendanceId: string, 
  messageType: '30min' | 'end_of_day'
): ExclusionEntry | null {
  const now = new Date();
  const expiresAt = new Date(now);
  
  // Definir expiração baseada no tipo de mensagem
  if (messageType === '30min') {
    // Expira no final do dia (23:59:59)
    expiresAt.setHours(23, 59, 59, 999);
  } else {
    // Mensagem de fim de expediente expira em 1 hora
    expiresAt.setHours(expiresAt.getHours() + 1);
  }

  const entry = {
    attendanceId: attendanceId.trim(),
    messageType,
    sentAt: now,
    expiresAt
  };

  return validateExclusionEntry(entry) ? entry : null;
}

export function isExclusionEntryExpired(entry: ExclusionEntry): boolean {
  return new Date() > entry.expiresAt;
}