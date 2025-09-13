import { SystemConfig, validateSystemConfig, createDefaultSystemConfig } from '../models/SystemConfig';
import { ExclusionEntry, createExclusionEntry, isExclusionEntryExpired } from '../models/ExclusionEntry';
import { StorageService } from './StorageService';
import { IErrorHandler } from './ErrorHandler';

export interface IConfigManager {
  initialize(): Promise<void>;
  getExcludedSectors(): string[];
  getExcludedChannels(): string[];
  addToExclusionList(attendanceId: string, messageType: '30min' | 'end_of_day'): Promise<void>;
  isFlowPaused(): boolean;
  cleanupDailyData(): Promise<void>;
  getSystemConfig(): SystemConfig;
  updateSystemConfig(updates: Partial<SystemConfig>): Promise<void>;
  isAttendanceExcluded(attendanceId: string, messageType: '30min' | 'end_of_day'): Promise<boolean>;
}

export class ConfigManager implements IConfigManager {
  private storageService: StorageService;
  private systemConfig: SystemConfig;
  private exclusionList: Map<string, ExclusionEntry> = new Map();
  private errorHandler: IErrorHandler;

  constructor(errorHandler: IErrorHandler) {
    this.errorHandler = errorHandler;
    this.storageService = new StorageService(errorHandler);
    this.systemConfig = createDefaultSystemConfig();
  }

  async initialize(): Promise<void> {
    await this.storageService.initialize();
    await this.loadSystemConfig();
    await this.loadExclusionList();
  }



  private async loadSystemConfig(): Promise<void> {
    try {
      const configData = await this.storageService.getAllConfig();
      
      if (Object.keys(configData).length > 0) {
        const config = {
          flowPaused: configData.flowPaused === 'true',
          excludedSectors: configData.excludedSectors ? JSON.parse(configData.excludedSectors) : [],
          excludedChannels: configData.excludedChannels ? JSON.parse(configData.excludedChannels) : [],
          selectedActionCard: configData.selectedActionCard,
          selectedTemplate: configData.selectedTemplate,
          endOfDayTime: configData.endOfDayTime || '18:00'
        };

        if (validateSystemConfig(config)) {
          this.systemConfig = config;
          return;
        }
      }
    } catch (error) {
      this.errorHandler.logError(error as Error, 'ConfigManager.loadSystemConfig');
    }

    // Usar configuração padrão se tudo falhar
    this.systemConfig = createDefaultSystemConfig();
  }

  private async loadExclusionList(): Promise<void> {
    this.exclusionList.clear();

    try {
      const entries = await this.storageService.getExclusionEntries();
      
      entries.forEach((entry) => {
        if (!isExclusionEntryExpired(entry)) {
          this.exclusionList.set(`${entry.attendanceId}_${entry.messageType}`, entry);
        }
      });
    } catch (error) {
      this.errorHandler.logError(error as Error, 'ConfigManager.loadExclusionList');
    }
  }

  private async saveSystemConfig(): Promise<void> {
    try {
      await Promise.all([
        this.storageService.setConfigValue('flowPaused', this.systemConfig.flowPaused.toString()),
        this.storageService.setConfigValue('excludedSectors', JSON.stringify(this.systemConfig.excludedSectors)),
        this.storageService.setConfigValue('excludedChannels', JSON.stringify(this.systemConfig.excludedChannels)),
        this.storageService.setConfigValue('selectedActionCard', this.systemConfig.selectedActionCard || ''),
        this.storageService.setConfigValue('selectedTemplate', this.systemConfig.selectedTemplate || ''),
        this.storageService.setConfigValue('endOfDayTime', this.systemConfig.endOfDayTime)
      ]);
    } catch (error) {
      this.errorHandler.logError(error as Error, 'ConfigManager.saveSystemConfig');
    }
  }

  // Note: Exclusion list is now handled directly by StorageService
  // This method is kept for compatibility but delegates to StorageService

  // Implementação da interface IConfigManager
  getExcludedSectors(): string[] {
    return [...this.systemConfig.excludedSectors];
  }

  getExcludedChannels(): string[] {
    return [...this.systemConfig.excludedChannels];
  }

  async addToExclusionList(attendanceId: string, messageType: '30min' | 'end_of_day'): Promise<void> {
    const entry = createExclusionEntry(attendanceId, messageType);
    if (entry) {
      const key = `${entry.attendanceId}_${entry.messageType}`;
      this.exclusionList.set(key, entry);
      
      // Save to persistent storage
      await this.storageService.addExclusionEntry({
        attendanceId: entry.attendanceId,
        messageType: entry.messageType,
        sentAt: entry.sentAt,
        expiresAt: entry.expiresAt
      });
    }
  }

  isFlowPaused(): boolean {
    return this.systemConfig.flowPaused;
  }

  async cleanupDailyData(): Promise<void> {
    // Remover entradas expiradas da memória
    const expiredKeys: string[] = [];
    
    this.exclusionList.forEach((entry, key) => {
      if (isExclusionEntryExpired(entry)) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.exclusionList.delete(key);
    });

    // Cleanup expired entries from persistent storage
    await this.storageService.cleanupExpiredEntries();
    
    console.log(`Daily cleanup completed: removed ${expiredKeys.length} expired entries from memory`);
  }

  getSystemConfig(): SystemConfig {
    return { ...this.systemConfig };
  }

  async updateSystemConfig(updates: Partial<SystemConfig>): Promise<void> {
    const newConfig = { ...this.systemConfig, ...updates };
    
    if (validateSystemConfig(newConfig)) {
      this.systemConfig = newConfig;
      await this.saveSystemConfig();
    } else {
      throw new Error('Invalid system configuration');
    }
  }

  async isAttendanceExcluded(attendanceId: string, messageType: '30min' | 'end_of_day'): Promise<boolean> {
    const key = `${attendanceId}_${messageType}`;
    const entry = this.exclusionList.get(key);
    
    if (!entry) {
      return false;
    }

    if (isExclusionEntryExpired(entry)) {
      this.exclusionList.delete(key);
      return false;
    }

    return true;
  }
}