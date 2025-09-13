import { ExclusionEntry } from '../models';
import { IErrorHandler } from './ErrorHandler';
import { SupabaseClient } from './SupabaseClient';
import { LocalStorageClient } from './LocalStorageClient';

export interface StorageInterface {
  addExclusionEntry(entry: Omit<ExclusionEntry, 'id'>): Promise<string | null>;
  getExclusionEntries(): Promise<ExclusionEntry[]>;
  cleanupExpiredEntries(): Promise<number>;
  setConfigValue(key: string, value: string): Promise<boolean>;
  getConfigValue(key: string): Promise<string | null>;
  getAllConfig(): Promise<Record<string, string>>;
  isHealthy(): boolean;
}

export class StorageService implements StorageInterface {
  private supabaseClient: SupabaseClient;
  private localClient: LocalStorageClient;
  private errorHandler: IErrorHandler;
  private useSupabase: boolean = false;

  constructor(errorHandler: IErrorHandler) {
    this.errorHandler = errorHandler;
    this.supabaseClient = new SupabaseClient(errorHandler);
    this.localClient = new LocalStorageClient(errorHandler);
  }

  async initialize(): Promise<void> {
    try {
      // Try to connect to Supabase first
      this.useSupabase = await this.supabaseClient.connect();
      
      if (this.useSupabase) {
        console.log('Connected to Supabase successfully');
      } else {
        console.warn('Failed to connect to Supabase, using local storage fallback');
      }
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.initialize');
      this.useSupabase = false;
      console.warn('Error initializing Supabase, using local storage fallback');
    }
  }

  private getActiveClient(): StorageInterface {
    return this.useSupabase ? this.supabaseClient : this.localClient;
  }

  async addExclusionEntry(entry: Omit<ExclusionEntry, 'id'>): Promise<string | null> {
    try {
      const result = await this.getActiveClient().addExclusionEntry(entry);
      
      // If Supabase fails, try local storage as fallback
      if (!result && this.useSupabase) {
        console.warn('Supabase failed, falling back to local storage');
        this.useSupabase = false;
        return await this.localClient.addExclusionEntry(entry);
      }
      
      return result;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.addExclusionEntry');
      
      // Try fallback if primary fails
      if (this.useSupabase) {
        try {
          this.useSupabase = false;
          return await this.localClient.addExclusionEntry(entry);
        } catch (fallbackError) {
          this.errorHandler.logError(fallbackError as Error, 'StorageService.addExclusionEntry.fallback');
        }
      }
      
      return null;
    }
  }

  async getExclusionEntries(): Promise<ExclusionEntry[]> {
    try {
      const result = await this.getActiveClient().getExclusionEntries();
      
      // If Supabase fails, try local storage as fallback
      if (result.length === 0 && this.useSupabase && !this.supabaseClient.isHealthy()) {
        console.warn('Supabase unhealthy, falling back to local storage');
        this.useSupabase = false;
        return await this.localClient.getExclusionEntries();
      }
      
      return result;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.getExclusionEntries');
      
      // Try fallback if primary fails
      if (this.useSupabase) {
        try {
          this.useSupabase = false;
          return await this.localClient.getExclusionEntries();
        } catch (fallbackError) {
          this.errorHandler.logError(fallbackError as Error, 'StorageService.getExclusionEntries.fallback');
        }
      }
      
      return [];
    }
  }

  async cleanupExpiredEntries(): Promise<number> {
    try {
      return await this.getActiveClient().cleanupExpiredEntries();
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.cleanupExpiredEntries');
      
      // Try fallback if primary fails
      if (this.useSupabase) {
        try {
          this.useSupabase = false;
          return await this.localClient.cleanupExpiredEntries();
        } catch (fallbackError) {
          this.errorHandler.logError(fallbackError as Error, 'StorageService.cleanupExpiredEntries.fallback');
        }
      }
      
      return 0;
    }
  }

  async setConfigValue(key: string, value: string): Promise<boolean> {
    try {
      const result = await this.getActiveClient().setConfigValue(key, value);
      
      // If Supabase fails, try local storage as fallback
      if (!result && this.useSupabase) {
        console.warn('Supabase failed, falling back to local storage');
        this.useSupabase = false;
        return await this.localClient.setConfigValue(key, value);
      }
      
      return result;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.setConfigValue');
      
      // Try fallback if primary fails
      if (this.useSupabase) {
        try {
          this.useSupabase = false;
          return await this.localClient.setConfigValue(key, value);
        } catch (fallbackError) {
          this.errorHandler.logError(fallbackError as Error, 'StorageService.setConfigValue.fallback');
        }
      }
      
      return false;
    }
  }

  async getConfigValue(key: string): Promise<string | null> {
    try {
      const result = await this.getActiveClient().getConfigValue(key);
      
      // If Supabase fails, try local storage as fallback
      if (!result && this.useSupabase && !this.supabaseClient.isHealthy()) {
        console.warn('Supabase unhealthy, falling back to local storage');
        this.useSupabase = false;
        return await this.localClient.getConfigValue(key);
      }
      
      return result;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.getConfigValue');
      
      // Try fallback if primary fails
      if (this.useSupabase) {
        try {
          this.useSupabase = false;
          return await this.localClient.getConfigValue(key);
        } catch (fallbackError) {
          this.errorHandler.logError(fallbackError as Error, 'StorageService.getConfigValue.fallback');
        }
      }
      
      return null;
    }
  }

  async getAllConfig(): Promise<Record<string, string>> {
    try {
      const result = await this.getActiveClient().getAllConfig();
      
      // If Supabase fails, try local storage as fallback
      if (Object.keys(result).length === 0 && this.useSupabase && !this.supabaseClient.isHealthy()) {
        console.warn('Supabase unhealthy, falling back to local storage');
        this.useSupabase = false;
        return await this.localClient.getAllConfig();
      }
      
      return result;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.getAllConfig');
      
      // Try fallback if primary fails
      if (this.useSupabase) {
        try {
          this.useSupabase = false;
          return await this.localClient.getAllConfig();
        } catch (fallbackError) {
          this.errorHandler.logError(fallbackError as Error, 'StorageService.getAllConfig.fallback');
        }
      }
      
      return {};
    }
  }

  isHealthy(): boolean {
    return this.getActiveClient().isHealthy();
  }

  isUsingSupabase(): boolean {
    return this.useSupabase;
  }

  async reconnectSupabase(): Promise<boolean> {
    try {
      this.useSupabase = await this.supabaseClient.connect();
      if (this.useSupabase) {
        console.log('Reconnected to Supabase successfully');
      }
      return this.useSupabase;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.reconnectSupabase');
      return false;
    }
  }

  async performDailyCleanup(): Promise<void> {
    try {
      const removedCount = await this.cleanupExpiredEntries();
      console.log(`Daily cleanup completed: removed ${removedCount} expired entries`);
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.performDailyCleanup');
    }
  }

  // Additional methods for exclusion persistence
  async isAttendanceExcluded(attendanceId: string, messageType: '30min' | 'end_of_day'): Promise<boolean> {
    try {
      const entries = await this.getExclusionEntries();
      return entries.some(entry => 
        entry.attendanceId === attendanceId && 
        entry.messageType === messageType &&
        new Date() <= entry.expiresAt
      );
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.isAttendanceExcluded');
      return false;
    }
  }

  async getExclusionEntriesForAttendance(attendanceId: string): Promise<ExclusionEntry[]> {
    try {
      const entries = await this.getExclusionEntries();
      return entries.filter(entry => entry.attendanceId === attendanceId);
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.getExclusionEntriesForAttendance');
      return [];
    }
  }

  async getExclusionEntriesByType(messageType: '30min' | 'end_of_day'): Promise<ExclusionEntry[]> {
    try {
      const entries = await this.getExclusionEntries();
      return entries.filter(entry => entry.messageType === messageType);
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.getExclusionEntriesByType');
      return [];
    }
  }

  async removeExclusionEntry(attendanceId: string, messageType: '30min' | 'end_of_day'): Promise<boolean> {
    try {
      // This would need to be implemented in the underlying clients
      // For now, we'll rely on the expiration mechanism
      console.warn('removeExclusionEntry not implemented - entries will expire automatically');
      return false;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.removeExclusionEntry');
      return false;
    }
  }

  async getExclusionStats(): Promise<{ total: number; expired: number; by30min: number; byEndOfDay: number }> {
    try {
      const entries = await this.getExclusionEntries();
      const now = new Date();
      
      const stats = {
        total: entries.length,
        expired: 0,
        by30min: 0,
        byEndOfDay: 0
      };

      entries.forEach(entry => {
        if (now > entry.expiresAt) {
          stats.expired++;
        }
        if (entry.messageType === '30min') {
          stats.by30min++;
        } else {
          stats.byEndOfDay++;
        }
      });

      return stats;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'StorageService.getExclusionStats');
      return { total: 0, expired: 0, by30min: 0, byEndOfDay: 0 };
    }
  }
}