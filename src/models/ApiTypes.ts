// Tipos específicos para a API do CAM Krolik

export interface Attendance {
  id: string;
  name: string;
  phone: string;
  sectorId: string;
  sectorName: string;
  channelId: string;
  channelType: 'normal' | 'api_oficial';
  waitStartTime: string; // ISO string da API
  status: number;
}

export interface Sector {
  id: string;
  name: string;
  active: boolean;
}

export interface ActionCard {
  id: string;
  name: string;
  content: string;
  active: boolean;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  active: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface KrolikApiConfig {
  baseUrl: string;
  apiToken: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  response?: any;
}

export interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByContext: Record<string, number>;
  lastError?: {
    message: string;
    context: string;
    timestamp: Date;
  };
}

export interface SystemStatus {
  isRunning: boolean;
  isPaused: boolean;
  flowActive: boolean;
  lastUpdate: Date;
  monitoringStats: {
    totalPatients: number;
    patientsOver30Min: number;
    averageWaitTime: number;
    lastUpdate: Date;
  };
  schedulerStats: {
    isRunning: boolean;
    isPaused: boolean;
    interval: number;
  };
  errorStats: ErrorStatistics;
  uptime: number; // milliseconds
}