import { logger } from '../services/Logger';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  totalTime: number;
}

export class RetryUtils {
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error: any) => {
      // Retry em erros de rede, timeout, ou 5xx
      if (!error.status) return true; // Erro de rede
      if (error.status >= 500) return true; // Erro do servidor
      if (error.status === 429) return true; // Rate limit
      if (error.status === 408) return true; // Timeout
      return false;
    }
  };

  /**
   * Executa uma função com retry e exponential backoff
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    let lastError: any;
    let attempts = 0;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      attempts = attempt + 1;
      
      try {
        const result = await operation();
        const totalTime = Date.now() - startTime;
        
        if (attempt > 0) {
          logger.info(`Operação bem-sucedida após ${attempts} tentativas (${totalTime}ms)`, 'RetryUtils');
        }
        
        return {
          success: true,
          data: result,
          attempts,
          totalTime
        };
        
      } catch (error) {
        lastError = error;
        
        // Verificar se deve tentar novamente
        if (attempt === finalConfig.maxRetries || 
            !finalConfig.retryCondition!(error)) {
          break;
        }
        
        // Calcular delay com exponential backoff
        const delay = this.calculateDelay(attempt, finalConfig);
        
        logger.warn(
          `Tentativa ${attempts} falhou, tentando novamente em ${delay}ms: ${error}`,
          'RetryUtils'
        );
        
        await this.delay(delay);
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    logger.error(
      `Operação falhou após ${attempts} tentativas (${totalTime}ms): ${lastError}`,
      'RetryUtils'
    );
    
    return {
      success: false,
      error: lastError,
      attempts,
      totalTime
    };
  }

  /**
   * Executa múltiplas operações em paralelo com retry
   */
  static async executeBatchWithRetry<T>(
    operations: (() => Promise<T>)[],
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>[]> {
    const promises = operations.map(operation => 
      this.executeWithRetry(operation, config)
    );
    
    return Promise.all(promises);
  }

  /**
   * Executa operações em sequência com retry
   */
  static async executeSequenceWithRetry<T>(
    operations: (() => Promise<T>)[],
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>[]> {
    const results: RetryResult<T>[] = [];
    
    for (const operation of operations) {
      const result = await this.executeWithRetry(operation, config);
      results.push(result);
      
      // Se falhou e não deve continuar, parar aqui
      if (!result.success && (config as any).stopOnFailure !== false) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Calcula delay com exponential backoff e jitter
   */
  private static calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    
    // Aplicar delay máximo
    delay = Math.min(delay, config.maxDelay);
    
    // Aplicar jitter para evitar thundering herd
    if (config.jitter) {
      const jitterRange = delay * 0.1; // 10% de jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }
    
    return Math.max(0, Math.floor(delay));
  }

  /**
   * Delay utilitário
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cria configuração de retry para APIs
   */
  static createApiRetryConfig(overrides: Partial<RetryConfig> = {}): RetryConfig {
    return {
      ...this.DEFAULT_CONFIG,
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true,
      retryCondition: (error: any) => {
        // Retry em erros de rede, timeout, ou 5xx
        if (!error.status) return true;
        if (error.status >= 500) return true;
        if (error.status === 429) return true;
        if (error.status === 408) return true;
        if (error.status === 503) return true; // Service Unavailable
        if (error.status === 502) return true; // Bad Gateway
        return false;
      },
      ...overrides
    };
  }

  /**
   * Cria configuração de retry para operações críticas
   */
  static createCriticalRetryConfig(overrides: Partial<RetryConfig> = {}): RetryConfig {
    return {
      ...this.DEFAULT_CONFIG,
      maxRetries: 10,
      baseDelay: 500,
      maxDelay: 30000,
      backoffMultiplier: 1.5,
      jitter: true,
      retryCondition: (error: any) => {
        // Retry em quase todos os erros para operações críticas
        if (!error.status) return true;
        if (error.status >= 400) return true;
        return false;
      },
      ...overrides
    };
  }

  /**
   * Cria configuração de retry para operações não críticas
   */
  static createNonCriticalRetryConfig(overrides: Partial<RetryConfig> = {}): RetryConfig {
    return {
      ...this.DEFAULT_CONFIG,
      maxRetries: 2,
      baseDelay: 2000,
      maxDelay: 5000,
      backoffMultiplier: 2,
      jitter: true,
      retryCondition: (error: any) => {
        // Retry apenas em erros de servidor
        if (!error.status) return true;
        if (error.status >= 500) return true;
        if (error.status === 429) return true;
        return false;
      },
      ...overrides
    };
  }

  /**
   * Executa operação com retry e fallback
   */
  static async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const result = await this.executeWithRetry(operation, config);
    
    if (result.success) {
      return result.data!;
    }
    
    logger.warn('Operação principal falhou, executando fallback', 'RetryUtils');
    
    try {
      return await fallback();
    } catch (fallbackError) {
      logger.error('Fallback também falhou', 'RetryUtils', fallbackError as Error);
      throw fallbackError;
    }
  }

  /**
   * Executa operação com timeout
   */
  static async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout após ${timeoutMs}ms`)), timeoutMs);
    });
    
    const operationWithTimeout = () => Promise.race([operation(), timeoutPromise]);
    
    return this.executeWithRetry(operationWithTimeout, config);
  }

  /**
   * Obtém estatísticas de retry de uma operação
   */
  static getRetryStats(results: RetryResult<any>[]): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    totalAttempts: number;
    averageAttempts: number;
    totalTime: number;
    averageTime: number;
  } {
    const totalOperations = results.length;
    const successfulOperations = results.filter(r => r.success).length;
    const failedOperations = totalOperations - successfulOperations;
    const totalAttempts = results.reduce((sum, r) => sum + r.attempts, 0);
    const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
    
    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      totalAttempts,
      averageAttempts: totalOperations > 0 ? totalAttempts / totalOperations : 0,
      totalTime,
      averageTime: totalOperations > 0 ? totalTime / totalOperations : 0
    };
  }
}

/**
 * Decorator para adicionar retry automático a métodos
 */
export function withRetry(config: Partial<RetryConfig> = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      return RetryUtils.executeWithRetry(
        () => method.apply(this, args),
        config
      );
    };
  };
}

/**
 * Funções de conveniência
 */
export const retryApiCall = <T>(operation: () => Promise<T>, config?: Partial<RetryConfig>) =>
  RetryUtils.executeWithRetry(operation, RetryUtils.createApiRetryConfig(config));

export const retryCriticalOperation = <T>(operation: () => Promise<T>, config?: Partial<RetryConfig>) =>
  RetryUtils.executeWithRetry(operation, RetryUtils.createCriticalRetryConfig(config));

export const retryNonCriticalOperation = <T>(operation: () => Promise<T>, config?: Partial<RetryConfig>) =>
  RetryUtils.executeWithRetry(operation, RetryUtils.createNonCriticalRetryConfig(config));
