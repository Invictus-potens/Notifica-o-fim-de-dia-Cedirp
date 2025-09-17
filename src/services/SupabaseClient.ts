import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import { ExclusionEntry, SystemConfig } from '../models';
import { IErrorHandler } from './ErrorHandler';

export class SupabaseClient {
  private client: SupabaseClientType;
  private errorHandler: IErrorHandler;
  private connectionStatus: boolean = false;

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
        this.connectionStatus = false;
        return false;
      }

      this.connectionStatus = true;
      await this.ensureTablesExist();
      return true;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'SupabaseClient.connect');
      this.connectionStatus = false;
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
    }
  }

  async addExclusionEntry(entry: Omit<ExclusionEntry, 'id'>): Promise<string | null> {
    if (!this.connectionStatus) {
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
    if (!this.connectionStatus) {
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
    if (!this.connectionStatus) {
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
    if (!this.connectionStatus) {
      return false;
    }

    try {
      // Primeiro, verificar se a chave já existe
      const { data: existingData, error: selectError } = await this.client
        .from('system_config')
        .select('id')
        .eq('key', key)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // Erro diferente de "não encontrado"
        this.errorHandler.logError(selectError, 'SupabaseClient.setConfigValue - select');
        return false;
      }

      const now = new Date().toISOString();

      if (existingData) {
        // Atualizar registro existente
        const { error: updateError } = await this.client
          .from('system_config')
          .update({
            value,
            updated_at: now
          })
          .eq('key', key);

        if (updateError) {
          this.errorHandler.logError(updateError, 'SupabaseClient.setConfigValue - update');
          return false;
        }
      } else {
        // Inserir novo registro
        const { error: insertError } = await this.client
          .from('system_config')
          .insert({
            key,
            value,
            updated_at: now,
            created_at: now
          });

        if (insertError) {
          this.errorHandler.logError(insertError, 'SupabaseClient.setConfigValue - insert');
          return false;
        }
      }

      return true;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'SupabaseClient.setConfigValue');
      return false;
    }
  }

  async getConfigValue(key: string): Promise<string | null> {
    if (!this.connectionStatus) {
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

  /**
   * Limpa registros duplicados na tabela system_config
   * Mantém apenas o registro mais recente para cada chave
   */
  async cleanupDuplicateConfigKeys(): Promise<number> {
    if (!this.connectionStatus) {
      return 0;
    }

    try {
      // Buscar todas as chaves com múltiplos registros
      const { data: duplicates, error: selectError } = await this.client
        .from('system_config')
        .select('key, id, updated_at')
        .order('key')
        .order('updated_at', { ascending: false });

      if (selectError) {
        this.errorHandler.logError(selectError, 'SupabaseClient.cleanupDuplicateConfigKeys - select');
        return 0;
      }

      if (!duplicates || duplicates.length === 0) {
        return 0;
      }

      // Agrupar por chave e identificar duplicatas
      const keyGroups: { [key: string]: any[] } = {};
      duplicates.forEach(record => {
        if (!keyGroups[record.key]) {
          keyGroups[record.key] = [];
        }
        keyGroups[record.key].push(record);
      });

      let deletedCount = 0;

      // Para cada chave com múltiplos registros, manter apenas o mais recente
      for (const [key, records] of Object.entries(keyGroups)) {
        if (records.length > 1) {
          // Ordenar por updated_at (mais recente primeiro)
          records.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          
          // Manter o primeiro (mais recente) e deletar os outros
          const toDelete = records.slice(1);
          
          for (const record of toDelete) {
            const { error: deleteError } = await this.client
              .from('system_config')
              .delete()
              .eq('id', record.id);

            if (deleteError) {
              this.errorHandler.logError(deleteError, `SupabaseClient.cleanupDuplicateConfigKeys - delete ${key}`);
            } else {
              deletedCount++;
            }
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 Limpeza de chaves duplicadas: ${deletedCount} registros removidos`);
      }

      return deletedCount;
    } catch (error) {
      this.errorHandler.logError(error as Error, 'SupabaseClient.cleanupDuplicateConfigKeys');
      return 0;
    }
  }

  async getAllConfig(): Promise<Record<string, string>> {
    if (!this.connectionStatus) {
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
    return this.connectionStatus;
  }

  /**
   * Verifica se está conectado ao Supabase
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('system_health')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  }


  async disconnect(): Promise<void> {
    // Supabase client doesn't require explicit disconnection
    this.connectionStatus = false;
  }
}