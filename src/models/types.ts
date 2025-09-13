// Core data types for the automation system

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

export interface SystemConfig {
  flowPaused: boolean;
  excludedSectors: string[];
  excludedChannels: string[];
  selectedActionCard?: string;
  selectedTemplate?: string;
  endOfDayTime: string; // "18:00"
}

export interface ExclusionEntry {
  attendanceId: string;
  messageType: '30min' | 'end_of_day';
  sentAt: Date;
  expiresAt: Date;
}

export interface SystemStatus {
  isRunning: boolean;
  isPaused: boolean;
  flowActive: boolean;
  lastCheck?: Date;
  monitoringStats: {
    totalPatients: number;
    eligibleFor30Min: number;
    eligibleForEndOfDay: number;
    messagesSent: number;
    errors: number;
  };
}

export interface ErrorStatistics {
  totalErrors: number;
  criticalErrors: number;
  lastError?: {
    message: string;
    timestamp: Date;
    context: string;
  };
}

export interface Sector {
  id: string;
  name: string;
}

export interface ActionCard {
  id: string;
  name: string;
  content: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'normal' | 'api_oficial';
  token?: string;
}

export interface Attendance {
  id: string;
  customer_name: string;
  customer_phone: string;
  sector_id: string;
  sector_name: string;
  channel_id: string;
  channel_type: 'normal' | 'api_oficial';
  created_at: string;
}