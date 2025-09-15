import { logger } from '../services/Logger';

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'email' | 'phone' | 'uuid';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  data?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
  rule: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value: any;
  suggestion?: string;
}

export class ValidationUtils {
  /**
   * Valida um objeto contra um conjunto de regras
   */
  static validate(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let isValid = true;

    for (const rule of rules) {
      const fieldValue = this.getFieldValue(data, rule.field);
      const fieldResult = this.validateField(fieldValue, rule);
      
      if (!fieldResult.isValid) {
        isValid = false;
        errors.push(...fieldResult.errors);
      }
      
      if (fieldResult.warnings.length > 0) {
        warnings.push(...fieldResult.warnings);
      }
    }

    return {
      isValid,
      errors,
      warnings,
      data: isValid ? data : undefined
    };
  }

  /**
   * Valida um campo específico
   */
  private static validateField(value: any, rule: ValidationRule): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Verificar se é obrigatório
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: rule.field,
        message: rule.message || `${rule.field} é obrigatório`,
        value,
        rule: 'required'
      });
      return { isValid: false, errors, warnings };
    }

    // Se não é obrigatório e está vazio, pular validações
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return { isValid: true, errors, warnings };
    }

    // Validar tipo
    const typeResult = this.validateType(value, rule);
    if (!typeResult.isValid) {
      errors.push(...typeResult.errors);
      return { isValid: false, errors, warnings };
    }

    // Validar comprimento (para strings e arrays)
    if (rule.type === 'string' || rule.type === 'array') {
      const lengthResult = this.validateLength(value, rule);
      if (!lengthResult.isValid) {
        errors.push(...lengthResult.errors);
      }
      if (lengthResult.warnings.length > 0) {
        warnings.push(...lengthResult.warnings);
      }
    }

    // Validar range (para números)
    if (rule.type === 'number') {
      const rangeResult = this.validateRange(value, rule);
      if (!rangeResult.isValid) {
        errors.push(...rangeResult.errors);
      }
      if (rangeResult.warnings.length > 0) {
        warnings.push(...rangeResult.warnings);
      }
    }

    // Validar padrão (para strings)
    if (rule.type === 'string' && rule.pattern) {
      const patternResult = this.validatePattern(value, rule);
      if (!patternResult.isValid) {
        errors.push(...patternResult.errors);
      }
    }

    // Validar enum
    if (rule.enum && rule.enum.length > 0) {
      const enumResult = this.validateEnum(value, rule);
      if (!enumResult.isValid) {
        errors.push(...enumResult.errors);
      }
    }

    // Validar função customizada
    if (rule.custom) {
      const customResult = this.validateCustom(value, rule);
      if (!customResult.isValid) {
        errors.push(...customResult.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida tipo de dados
   */
  private static validateType(value: any, rule: ValidationRule): ValidationResult {
    const errors: ValidationError[] = [];

    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} deve ser uma string`,
            value,
            rule: 'type'
          });
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} deve ser um número`,
            value,
            rule: 'type'
          });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} deve ser um boolean`,
            value,
            rule: 'type'
          });
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} deve ser um array`,
            value,
            rule: 'type'
          });
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} deve ser um objeto`,
            value,
            rule: 'type'
          });
        }
        break;

      case 'date':
        if (!(value instanceof Date) && !this.isValidDate(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} deve ser uma data válida`,
            value,
            rule: 'type'
          });
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} deve ser um email válido`,
            value,
            rule: 'type'
          });
        }
        break;

      case 'phone':
        if (typeof value !== 'string' || !this.isValidPhone(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} deve ser um telefone válido`,
            value,
            rule: 'type'
          });
        }
        break;

      case 'uuid':
        if (typeof value !== 'string' || !this.isValidUUID(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} deve ser um UUID válido`,
            value,
            rule: 'type'
          });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Valida comprimento
   */
  private static validateLength(value: any, rule: ValidationRule): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} deve ter pelo menos ${rule.minLength} caracteres`,
          value,
          rule: 'minLength'
        });
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} deve ter no máximo ${rule.maxLength} caracteres`,
          value,
          rule: 'maxLength'
        });
      }

      // Aviso para strings muito longas
      if (value.length > 1000) {
        warnings.push({
          field: rule.field,
          message: `${rule.field} é muito longo (${value.length} caracteres)`,
          value: value.substring(0, 100) + '...',
          suggestion: 'Considere encurtar o texto'
        });
      }
    }

    if (rule.type === 'array' && Array.isArray(value)) {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} deve ter pelo menos ${rule.minLength} itens`,
          value,
          rule: 'minLength'
        });
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} deve ter no máximo ${rule.maxLength} itens`,
          value,
          rule: 'maxLength'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida range numérico
   */
  private static validateRange(value: any, rule: ValidationRule): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} deve ser pelo menos ${rule.min}`,
          value,
          rule: 'min'
        });
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} deve ser no máximo ${rule.max}`,
          value,
          rule: 'max'
        });
      }

      // Aviso para valores muito altos
      if (value > 1000000) {
        warnings.push({
          field: rule.field,
          message: `${rule.field} tem um valor muito alto (${value})`,
          value,
          suggestion: 'Verifique se o valor está correto'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida padrão regex
   */
  private static validatePattern(value: any, rule: ValidationRule): ValidationResult {
    const errors: ValidationError[] = [];

    if (typeof value === 'string' && rule.pattern) {
      if (!rule.pattern.test(value)) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} não atende ao padrão esperado`,
          value,
          rule: 'pattern'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Valida enum
   */
  private static validateEnum(value: any, rule: ValidationRule): ValidationResult {
    const errors: ValidationError[] = [];

    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field: rule.field,
        message: rule.message || `${rule.field} deve ser um dos valores: ${rule.enum.join(', ')}`,
        value,
        rule: 'enum'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Valida função customizada
   */
  private static validateCustom(value: any, rule: ValidationRule): ValidationResult {
    const errors: ValidationError[] = [];

    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        errors.push({
          field: rule.field,
          message: rule.message || (typeof result === 'string' ? result : `${rule.field} não passou na validação customizada`),
          value,
          rule: 'custom'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Obtém valor de um campo aninhado
   */
  private static getFieldValue(data: any, field: string): any {
    const parts = field.split('.');
    let value = data;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Valida email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida telefone brasileiro
   */
  private static isValidPhone(phone: string): boolean {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verifica se tem 10 ou 11 dígitos
    return cleanPhone.length === 10 || cleanPhone.length === 11;
  }

  /**
   * Valida UUID
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Valida data
   */
  private static isValidDate(date: any): boolean {
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }
    
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }
    
    return false;
  }

  /**
   * Valida payload da API CAM Krolik
   */
  static validateKrolikApiPayload(data: any, endpoint: string): ValidationResult {
    const rules: ValidationRule[] = [];

    switch (endpoint) {
      case 'send-text':
        rules.push(
          { field: 'chatId', type: 'string', required: true, minLength: 1 },
          { field: 'message', type: 'string', required: true, minLength: 1, maxLength: 1000 }
        );
        break;

      case 'send-action-card':
        rules.push(
          { field: 'chatId', type: 'string', required: true, minLength: 1 },
          { field: 'actionCardId', type: 'string', required: true, minLength: 1 }
        );
        break;

      case 'send-template':
        rules.push(
          { field: 'chatId', type: 'string', required: true, minLength: 1 },
          { field: 'templateId', type: 'string', required: true, minLength: 1 }
        );
        break;

      case 'send-action-card-by-phone':
        rules.push(
          { field: 'number', type: 'string', required: true, minLength: 1 },
          { field: 'contactId', type: 'string', required: true, minLength: 1 },
          { field: 'action_card_id', type: 'string', required: true, minLength: 1 }
        );
        break;

      case 'send-template-by-phone':
        rules.push(
          { field: 'number', type: 'string', required: true, minLength: 1 },
          { field: 'contactId', type: 'string', required: true, minLength: 1 },
          { field: 'templateId', type: 'string', required: true, minLength: 1 },
          { field: 'templateComponents', type: 'array', required: false }
        );
        break;

      case 'list-lite':
        rules.push(
          { field: 'status', type: 'number', required: false, min: 0, max: 10 }
        );
        break;

      default:
        return {
          isValid: false,
          errors: [{
            field: 'endpoint',
            message: `Endpoint não suportado: ${endpoint}`,
            value: endpoint,
            rule: 'endpoint'
          }],
          warnings: []
        };
    }

    return this.validate(data, rules);
  }

  /**
   * Valida dados de paciente
   */
  static validatePatientData(data: any): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'id', type: 'string', required: true, minLength: 1 },
      { field: 'name', type: 'string', required: true, minLength: 2, maxLength: 100 },
      { field: 'phone', type: 'phone', required: true },
      { field: 'sectorId', type: 'string', required: true, minLength: 1 },
      { field: 'channelId', type: 'string', required: true, minLength: 1 },
      { field: 'chatId', type: 'string', required: true, minLength: 1 },
      { field: 'waitTimeMinutes', type: 'number', required: true, min: 0, max: 1440 },
      { field: 'waitStartTime', type: 'date', required: true },
      { field: 'hasReceived30MinMessage', type: 'boolean', required: false },
      { field: 'last30MinMessageSentAt', type: 'date', required: false }
    ];

    return this.validate(data, rules);
  }

  /**
   * Valida configuração do sistema
   */
  static validateSystemConfig(data: any): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'apiUrl', type: 'string', required: true, pattern: /^https?:\/\/.+/ },
      { field: 'apiToken', type: 'string', required: true, minLength: 10 },
      { field: 'supabaseUrl', type: 'string', required: true, pattern: /^https?:\/\/.+/ },
      { field: 'supabaseKey', type: 'string', required: true, minLength: 10 },
      { field: 'endOfDayTime', type: 'string', required: true, pattern: /^\d{2}:\d{2}$/ },
      { field: 'flowPaused', type: 'boolean', required: false },
      { field: 'excludedSectors', type: 'array', required: false },
      { field: 'excludedChannels', type: 'array', required: false }
    ];

    return this.validate(data, rules);
  }

  /**
   * Sanitiza dados removendo caracteres perigosos
   */
  static sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return data
        .replace(/[<>]/g, '') // Remove < e >
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeData(value);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Valida e sanitiza dados
   */
  static validateAndSanitize(data: any, rules: ValidationRule[]): ValidationResult {
    const sanitizedData = this.sanitizeData(data);
    return this.validate(sanitizedData, rules);
  }
}

// Funções de conveniência
export const validateKrolikApiPayload = (data: any, endpoint: string) =>
  ValidationUtils.validateKrolikApiPayload(data, endpoint);

export const validatePatientData = (data: any) =>
  ValidationUtils.validatePatientData(data);

export const validateSystemConfig = (data: any) =>
  ValidationUtils.validateSystemConfig(data);

export const sanitizeData = (data: any) =>
  ValidationUtils.sanitizeData(data);
