import { logger } from '../services/Logger';

export interface LogMaskingConfig {
  maskNames: boolean;
  maskPhones: boolean;
  maskEmails: boolean;
  maskIds: boolean;
  maskCustomFields: string[];
  replacementChar: string;
  showPartial: boolean;
  partialLength: number;
}

export class SecureLogger {
  private static readonly DEFAULT_CONFIG: LogMaskingConfig = {
    maskNames: true,
    maskPhones: true,
    maskEmails: true,
    maskIds: false,
    maskCustomFields: ['cpf', 'cnpj', 'rg'],
    replacementChar: '*',
    showPartial: true,
    partialLength: 3
  };

  private config: LogMaskingConfig;

  constructor(config: Partial<LogMaskingConfig> = {}) {
    this.config = { ...SecureLogger.DEFAULT_CONFIG, ...config };
  }

  /**
   * Mascara dados pessoais em uma string
   */
  maskSensitiveData(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let maskedText = text;

    // Mascarar nomes (padrões comuns de nomes brasileiros)
    if (this.config.maskNames) {
      maskedText = this.maskNames(maskedText);
    }

    // Mascarar telefones
    if (this.config.maskPhones) {
      maskedText = this.maskPhones(maskedText);
    }

    // Mascarar emails
    if (this.config.maskEmails) {
      maskedText = this.maskEmails(maskedText);
    }

    // Mascarar IDs se configurado
    if (this.config.maskIds) {
      maskedText = this.maskIds(maskedText);
    }

    // Mascarar campos customizados
    if (this.config.maskCustomFields.length > 0) {
      maskedText = this.maskCustomFields(maskedText);
    }

    return maskedText;
  }

  /**
   * Mascara nomes em uma string
   */
  private maskNames(text: string): string {
    // Padrões comuns de nomes brasileiros
    const namePatterns = [
      /\b[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+ [A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)*\b/g,
      /\b[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+ [A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]\.\s*[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+\b/g
    ];

    let maskedText = text;
    
    for (const pattern of namePatterns) {
      maskedText = maskedText.replace(pattern, (match) => {
        return this.maskString(match);
      });
    }

    return maskedText;
  }

  /**
   * Mascara telefones em uma string
   */
  private maskPhones(text: string): string {
    // Padrões de telefones brasileiros
    const phonePatterns = [
      /\(\d{2}\)\s*\d{4,5}-?\d{4}/g, // (11) 99999-9999 ou (11) 9999-9999
      /\d{2}\s*\d{4,5}-?\d{4}/g,     // 11 99999-9999 ou 11 9999-9999
      /\d{10,11}/g,                   // 11999999999
      /\+55\s*\d{2}\s*\d{4,5}-?\d{4}/g // +55 11 99999-9999
    ];

    let maskedText = text;
    
    for (const pattern of phonePatterns) {
      maskedText = maskedText.replace(pattern, (match) => {
        return this.maskString(match);
      });
    }

    return maskedText;
  }

  /**
   * Mascara emails em uma string
   */
  private maskEmails(text: string): string {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    
    return text.replace(emailPattern, (match) => {
      return this.maskString(match);
    });
  }

  /**
   * Mascara IDs em uma string
   */
  private maskIds(text: string): string {
    // Padrões comuns de IDs
    const idPatterns = [
      /\b[A-Za-z0-9]{8,}\b/g, // IDs alfanuméricos longos
      /\b\d{8,}\b/g,          // IDs numéricos longos
      /\b[A-Fa-f0-9]{8,}\b/g  // IDs hexadecimais
    ];

    let maskedText = text;
    
    for (const pattern of idPatterns) {
      maskedText = maskedText.replace(pattern, (match) => {
        return this.maskString(match);
      });
    }

    return maskedText;
  }

  /**
   * Mascara campos customizados
   */
  private maskCustomFields(text: string): string {
    let maskedText = text;
    
    for (const field of this.config.maskCustomFields) {
      // Buscar por padrões como "cpf: 12345678901" ou "CPF: 123.456.789-01"
      const patterns = [
        new RegExp(`\\b${field}:\\s*[\\d.-]+`, 'gi'),
        new RegExp(`\\b${field}\\s*[\\d.-]+`, 'gi'),
        new RegExp(`"${field}":\\s*"[^"]*"`, 'gi'),
        new RegExp(`'${field}':\\s*'[^']*'`, 'gi')
      ];

      for (const pattern of patterns) {
        maskedText = maskedText.replace(pattern, (match) => {
          return this.maskString(match);
        });
      }
    }

    return maskedText;
  }

  /**
   * Mascara uma string específica
   */
  private maskString(str: string): string {
    if (str.length <= 2) {
      return this.config.replacementChar.repeat(str.length);
    }

    if (this.config.showPartial && str.length > this.config.partialLength * 2) {
      const start = str.substring(0, this.config.partialLength);
      const end = str.substring(str.length - this.config.partialLength);
      const middle = this.config.replacementChar.repeat(str.length - (this.config.partialLength * 2));
      return start + middle + end;
    } else {
      return this.config.replacementChar.repeat(str.length);
    }
  }

  /**
   * Mascara dados em um objeto
   */
  maskObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.maskSensitiveData(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.maskObject(item));
    }

    if (typeof obj === 'object') {
      const maskedObj: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        // Verificar se a chave indica dados sensíveis
        if (this.isSensitiveKey(lowerKey)) {
          maskedObj[key] = this.maskSensitiveData(String(value));
        } else {
          maskedObj[key] = this.maskObject(value);
        }
      }
      
      return maskedObj;
    }

    return obj;
  }

  /**
   * Verifica se uma chave indica dados sensíveis
   */
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'name', 'nome', 'patient', 'paciente',
      'phone', 'telefone', 'celular', 'mobile',
      'email', 'e-mail', 'mail',
      'cpf', 'cnpj', 'rg', 'document',
      'id', 'patientid', 'chatid', 'channelid'
    ];

    return sensitiveKeys.some(sensitiveKey => 
      key.includes(sensitiveKey) || sensitiveKey.includes(key)
    );
  }

  /**
   * Log seguro com mascaramento automático
   */
  secureLog(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any, context?: string): void {
    const maskedData = data ? this.maskObject(data) : undefined;
    const maskedMessage = this.maskSensitiveData(message);
    
    // Formatação melhorada para logs com horário local
    const timestamp = new Date().toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const contextStr = context ? `[${context}]` : '';
    const levelStr = level.toUpperCase().padEnd(5);
    
    const logMessage = `${timestamp} ${levelStr} ${contextStr} ${maskedMessage}`;
    
    // Usar console diretamente para evitar recursão
    if (maskedData) {
      (console as any)[level](logMessage, maskedData);
    } else {
      (console as any)[level](logMessage);
    }
  }

  /**
   * Log de erro seguro
   */
  secureError(message: string, error?: Error, context?: string): void {
    const maskedMessage = this.maskSensitiveData(message);
    const maskedError = error ? {
      ...error,
      message: this.maskSensitiveData(error.message),
      stack: error.stack ? this.maskSensitiveData(error.stack) : undefined
    } : undefined;
    
    // Formatação melhorada para logs de erro
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '[ERROR]';
    
    const logMessage = `${timestamp} ERROR ${contextStr} ${maskedMessage}`;
    
    // Usar console.error diretamente para evitar recursão
    if (maskedError) {
      console.error(logMessage, maskedError);
    } else {
      console.error(logMessage);
    }
  }

  /**
   * Log de dados de paciente de forma segura
   */
  logPatientData(level: 'info' | 'warn' | 'error' | 'debug', message: string, patient: any, context?: string): void {
    const maskedPatient = this.maskObject(patient);
    this.secureLog(level, message, { patient: maskedPatient }, context);
  }

  /**
   * Log de dados de API de forma segura
   */
  logApiData(level: 'info' | 'warn' | 'error' | 'debug', message: string, apiData: any, context?: string): void {
    const maskedApiData = this.maskObject(apiData);
    this.secureLog(level, message, { apiData: maskedApiData }, context);
  }

  /**
   * Log de configuração de forma segura
   */
  logConfig(level: 'info' | 'warn' | 'error' | 'debug', message: string, config: any, context?: string): void {
    const maskedConfig = this.maskObject(config);
    this.secureLog(level, message, { config: maskedConfig }, context);
  }

  /**
   * Atualiza configuração de mascaramento
   */
  updateConfig(newConfig: Partial<LogMaskingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): LogMaskingConfig {
    return { ...this.config };
  }
}

// Instância singleton com configuração padrão
export const secureLogger = new SecureLogger();

// Funções de conveniência
export const secureLog = (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any, context?: string) =>
  secureLogger.secureLog(level, message, data, context);

export const secureError = (message: string, error?: Error, context?: string) =>
  secureLogger.secureError(message, error, context);

export const logPatientData = (level: 'info' | 'warn' | 'error' | 'debug', message: string, patient: any, context?: string) =>
  secureLogger.logPatientData(level, message, patient, context);

export const logApiData = (level: 'info' | 'warn' | 'error' | 'debug', message: string, apiData: any, context?: string) =>
  secureLogger.logApiData(level, message, apiData, context);

export const logConfig = (level: 'info' | 'warn' | 'error' | 'debug', message: string, config: any, context?: string) =>
  secureLogger.logConfig(level, message, config, context);
