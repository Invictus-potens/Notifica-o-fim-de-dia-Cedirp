// Tipos específicos para a API do CAM Krolik
import { WaitingPatient } from './WaitingPatient';

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
  typeChat?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatListRequest {
  typeChat: number;
  status: number;
  dateFilters: {
    startDate?: string;
    endDate?: string;
  };
  page: number;
  limit?: number;
}

export interface ChatListResponse {
  data: WaitingPatient[];
  total: number;
  page: number;
  totalPages?: number;
}

export interface ChatApiResponse {
  chats: ChatData[];
  curPage: number;
  totalAmountChats: number;
  amountPage: number;
  hasNext: boolean;
  hasPrevius: boolean;
}

export interface ChatData {
  attendanceId: string;
  organizationId: string;
  sectorId: string;
  protocol: string;
  status: number;
  type: number;
  origen: number;
  description: string;
  secondaryDescription: string;
  linkImage: string;
  countUnreadMessages: number;
  hasTag: boolean;
  utcDhStartChat: string;
  contact: {
    id: string;
    name: string;
    secondaryName: string;
    number: string;
    linkImage: string;
    isMe: boolean;
    tags: any[];
  };
  channel: {
    id: string;
    type: number;
    description: string;
    identifier: string;
  };
  textLastMessage: string;
  lastReceivedMessageDate: string;
  lastSentMessageDate: string;
  timeInAutomatic: number;
  timeInOutOfHour: number;
  timeInWaiting: number;
  timeInManual: number;
}

export interface Sector {
  id: string;
  name: string;
  active: boolean;
}

export interface ActionCard {
  id: string;
  description: string;
  messages: Array<{
    id: string;
    typeMessage: number;
    typeFile: number;
    text: string;
    order: number;
    typeEvent: number;
    extension?: string;
    file?: string;
    scriptId?: string;
  }>;
  // Propriedades opcionais para compatibilidade
  name?: string;
  content?: string;
  active?: boolean;
  title?: string;
  type?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  organizationId?: string;
  isDefault?: boolean;
  metadata?: any;
}

export interface Template {
  id: string;
  description: string;
  canEdit: boolean;
  staticComponents: Array<{
    type: string;
    text: string;
    format?: string;
    buttons?: Array<{
      type: string;
      text: string;
    }>;
  }>;
  dynamicComponents: Array<{
    type: string;
    text: string;
  }>;
  // Propriedades opcionais para compatibilidade
  name?: string;
  content?: string;
  active?: boolean;
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

export interface Channel {
  id: string;
  description: string;
  identifier: string;
  type: number;
  active?: boolean;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChannelListResponse {
  channels: Channel[];
  total?: number;
}

export interface SystemStatus {
  isRunning: boolean;
  isPaused: boolean;
  flowActive: boolean;
  lastUpdate: Date;
  apiConnected: boolean;
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

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  context: string;
  metadata?: Record<string, any>;
  stack?: string;
}

export interface LogFilter {
  level?: string;
  context?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}