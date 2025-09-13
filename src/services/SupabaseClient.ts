import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import { ExclusionEntry, SystemConfig } from '../models';
import { IErrorHandler } from './ErrorHandler';

export class SupabaseClient {
  private client: SupabaseClientType;
  private errorHandler: IErrorHandler;
  private isConnected: boolean = false;

  constructor(errorHandler: IErrorHandler) {
    this.errorHandler = errorHandler;
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and ANON KEY must be provided in environment variables');
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async connect(): Promise<boolean> {
    try {
      // Test connection by trying to access the database
      const { error } = await this.client.from('system_config').select('count').limit(1);
      
      if (error) {
        this.errorHandler.logError(error, 'SupabaseClient.connect');
        this.isConnected = false;
        return false;
      }

      this.isConnected = true;
      await this.ensureTablesExist();
      return true;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'SupabaseClient.connect');
      this.isConnected = false;
      return false;
    }
  }

  async ensureTablesExist(): Promise<void> {
    try {
      // Check if exclusion_entries table exists and create if not
      await this.createExclusionEntriesTable();
      
      // Check if system_config table exists and create if not
      await this.createSystemConfigTable();
      
    } catch (error) {
      this.errorHandler.logError(error as Error, 'SupabaseClient.ensureTablesExist');
      throw error;
    }
  }

  private async createExclusionEntriesTable(): Promise<void> {
    const { error } = await this.client.rpc('create_exclusion_entries_table');
    
    if (error && !error.message.includes('already exists')) {
      // If RPC doesn't exist, try direct SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS exclusion_entries (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          attendance_id TEXT NOT NULL,
          message_type TEXT NOT NULL CHECK (message_type IN ('30min', 'end_of_day')),
          sent_at TIMESTAMPTZ NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_exclusion_entries_attendance_id ON exclusion_entries(attendance_id);
        CREATE INDEX IF NOT EXISTS idx_exclusion_entries_expires_at ON exclusion_entries(expires_at);
      `;
      
      // Note: Direct SQL execution would require database admin privileges
      // In production, these tables should be created via Supabase migrations
      console.warn('Table creation should be done via Supabase migrations in production');
    }
  }

  private async createSystemConfigTable(): Promise<void> {
    const { error } = await this.client.rpc('create_system_config_table');
    
    if (error && !error.message.includes('already exists')) {
      // If RPC doesn't exist, try direct SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS system_config (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);
      `;
      
      // Note: Direct SQL execution would require database admin privileges
      console.warn('Table creation should be done via Supabase migrations in production');
    }
  }

  async addExclusionEntry(entry: Omit<ExclusionEntry, 'id'>): Promise<string | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const { data, error } = await this.client
        .from('exclusion_entries')
        .insert({
          attendance_id: entry.attendanceId,
          message_type: entry.messageType,
          sent_at: entry.sentAt.toISOString(),
          expires_at: entry.expiresAt.toISOString()
        })
        .select('id')
        .single();

      if (error) {
        this.errorHandler.logError(error, 'SupabaseClient.addExclusionEntry');
        return null;
      }

      return (data as any)?.id || null;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'SupabaseClient.addExclusionEntry');
      return null;
    }
  }

  async getExclusionEntries(): Promise<ExclusionEntry[]> {
    if (!this.isConnected) {
      return [];
    }

    try {
      const { data, error } = await this.client
        .from('exclusion_entries')
        .select('*')
        .gt('expires_at', new Date().toISOString());

      if (error) {
        this.errorHandler.logError(error, 'SupabaseClient.getExclusionEntries');
        return [];
      }

      return (data as any[]).map((row: any) => ({
        id: row.id,
        attendanceId: row.attendance_id,
        messageType: row.message_type,
        sentAt: new Date(row.sent_at),
        expiresAt: new Date(row.expires_at)
      }));
    } catch (error) {
      this.errorHandler.logError(error as Error, 'SupabaseClient.getExclusionEntries');
      return [];
    }
  }

  async cleanupExpiredEntries(): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const { data, error } = await this.client
        .from('exclusion_entries')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        this.errorHandler.logError(error, 'SupabaseClient.cleanupExpiredEntries');
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'SupabaseClient.cleanupExpiredEntries');
      return 0;
    }
  }

  async setConfigValue(key: string, value: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const { error } = await this.client
        .from('system_config')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        });

      if (error) {
        this.errorHandler.logError(error, 'SupabaseClient.setConfigValue');
        return false;
      }

      return true;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'SupabaseClient.setConfigValue');
      return false;
    }
  }

  async getConfigValue(key: string): Promise<string | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const { data, error } = await this.client
        .from('system_config')
        .select('value')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          this.errorHandler.logError(error, 'SupabaseClient.getConfigValue');
        }
        return null;
      }

      return (data as any)?.value || null;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'SupabaseClient.getConfigValue');
      return null;
    }
  }

  async getAllConfig(): Promise<Record<string, string>> {
    if (!this.isConnected) {
      return {};
    }

    try {
      const { data, error } = await this.client
        .from('system_config')
        .select('key, value');

      if (error) {
        this.errorHandler.logError(error, 'SupabaseClient.getAllConfig');
        return {};
      }

      const config: Record<string, string> = {};
      (data as any[]).forEach((row: any) => {
        config[row.key] = row.value;
      });

      return config;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'SupabaseClient.getAllConfig');
      return {};
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    // Supabase client doesn't require explicit disconnection
    this.isConnected = false;
  }
}