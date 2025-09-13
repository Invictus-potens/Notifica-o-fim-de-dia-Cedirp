import * as fs from 'fs';
import * as path from 'path';
import { ExclusionEntry } from '../models';
import { IErrorHandler } from './ErrorHandler';

export class LocalStorageClient {
  private dataDir: string;
  private exclusionFile: string;
  private configFile: string;
  private errorHandler: IErrorHandler;

  constructor(errorHandler: IErrorHandler, dataDir: string = './data') {
    this.errorHandler = errorHandler;
    this.dataDir = dataDir;
    this.exclusionFile = path.join(dataDir, 'exclusion_entries.json');
    this.configFile = path.join(dataDir, 'system_config.json');
    
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (error) {
      this.errorHandler.logError(error as Error, 'LocalStorageClient.ensureDataDirectory');
    }
  }

  async addExclusionEntry(entry: Omit<ExclusionEntry, 'id'>): Promise<string | null> {
    try {
      const entries = await this.getExclusionEntries();
      const id = this.generateId();
      const newEntry: ExclusionEntry = {
        ...entry,
        id
      };
      
      entries.push(newEntry);
      await this.saveExclusionEntries(entries);
      
      return id;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'LocalStorageClient.addExclusionEntry');
      return null;
    }
  }

  async getExclusionEntries(): Promise<ExclusionEntry[]> {
    try {
      if (!fs.existsSync(this.exclusionFile)) {
        return [];
      }

      const data = fs.readFileSync(this.exclusionFile, 'utf8');
      const entries = JSON.parse(data) as any[];
      
      // Filter out expired entries and convert dates
      const now = new Date();
      return entries
        .map(entry => ({
          ...entry,
          sentAt: new Date(entry.sentAt),
          expiresAt: new Date(entry.expiresAt)
        }))
        .filter(entry => entry.expiresAt > now);
    } catch (error) {
      this.errorHandler.logError(error as Error, 'LocalStorageClient.getExclusionEntries');
      return [];
    }
  }

  private async saveExclusionEntries(entries: ExclusionEntry[]): Promise<void> {
    try {
      const data = JSON.stringify(entries, null, 2);
      fs.writeFileSync(this.exclusionFile, data, 'utf8');
    } catch (error) {
      this.errorHandler.logError(error as Error, 'LocalStorageClient.saveExclusionEntries');
      throw error;
    }
  }

  async cleanupExpiredEntries(): Promise<number> {
    try {
      // Read raw entries without filtering expired ones
      if (!fs.existsSync(this.exclusionFile)) {
        return 0;
      }

      const data = fs.readFileSync(this.exclusionFile, 'utf8');
      const rawEntries = JSON.parse(data) as any[];
      
      const now = new Date();
      const entries = rawEntries.map(entry => ({
        ...entry,
        sentAt: new Date(entry.sentAt),
        expiresAt: new Date(entry.expiresAt)
      }));
      
      const validEntries = entries.filter(entry => entry.expiresAt > now);
      const removedCount = entries.length - validEntries.length;
      
      if (removedCount > 0) {
        await this.saveExclusionEntries(validEntries);
      }
      
      return removedCount;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'LocalStorageClient.cleanupExpiredEntries');
      return 0;
    }
  }

  async setConfigValue(key: string, value: string): Promise<boolean> {
    try {
      const config = await this.getAllConfig();
      config[key] = value;
      
      const data = JSON.stringify(config, null, 2);
      fs.writeFileSync(this.configFile, data, 'utf8');
      
      return true;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'LocalStorageClient.setConfigValue');
      return false;
    }
  }

  async getConfigValue(key: string): Promise<string | null> {
    try {
      const config = await this.getAllConfig();
      return config[key] || null;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'LocalStorageClient.getConfigValue');
      return null;
    }
  }

  async getAllConfig(): Promise<Record<string, string>> {
    try {
      if (!fs.existsSync(this.configFile)) {
        return {};
      }

      const data = fs.readFileSync(this.configFile, 'utf8');
      return JSON.parse(data) as Record<string, string>;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'LocalStorageClient.getAllConfig');
      return {};
    }
  }

  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isHealthy(): boolean {
    try {
      return fs.existsSync(this.dataDir);
    } catch {
      return false;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      if (fs.existsSync(this.exclusionFile)) {
        fs.unlinkSync(this.exclusionFile);
      }
      if (fs.existsSync(this.configFile)) {
        fs.unlinkSync(this.configFile);
      }
    } catch (error) {
      this.errorHandler.logError(error as Error, 'LocalStorageClient.clearAllData');
    }
  }
}