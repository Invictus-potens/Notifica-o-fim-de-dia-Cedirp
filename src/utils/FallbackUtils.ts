import { logger } from '../services/Logger';
import { RetryUtils } from './RetryUtils';

export interface FallbackConfig {
  maxRetries: number;
  retryDelay: number;
  fallbackDelay: number;
  enableLogging: boolean;
  enableMetrics: boolean;
}

export interface FallbackResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  usedFallback: boolean;
  attempts: number;
  totalTime: number;
  fallbackReason?: string;
}

export class FallbackUtils {
  private static readonly DEFAULT_CONFIG: FallbackConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    fallbackDelay: 500,
    enableLogging: true,
    enableMetrics: true
  };

  /**
   * Executa operação principal com fallback
   */
  static async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    config: Partial<FallbackConfig> = {}
  ): Promise<FallbackResult<T>> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    let attempts = 0;
    let lastError: any;

    // Tentar operação principal com retry
    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      attempts = attempt + 1;
      
      try {
        const result = await primaryOperation();
        const totalTime = Date.now() - startTime;
        
        if (finalConfig.enableLogging) {
          logger.info(`Operação principal bem-sucedida após ${attempts} tentativas`, 'FallbackUtils');
        }
        
        return {
          success: true,
          data: result,
          usedFallback: false,
          attempts,
          totalTime
        };
        
      } catch (error) {
        lastError = error;
        
        if (attempt < finalConfig.maxRetries) {
          const delay = finalConfig.retryDelay * Math.pow(2, attempt);
          if (finalConfig.enableLogging) {
            logger.warn(`Tentativa ${attempts} falhou, tentando novamente em ${delay}ms`, 'FallbackUtils');
          }
          await this.delay(delay);
        }
      }
    }

    // Se operação principal falhou, tentar fallback
    if (finalConfig.enableLogging) {
      logger.warn('Operação principal falhou, executando fallback', 'FallbackUtils');
    }

    try {
      await this.delay(finalConfig.fallbackDelay);
      const result = await fallbackOperation();
      const totalTime = Date.now() - startTime;
      
      if (finalConfig.enableLogging) {
        logger.info('Fallback executado com sucesso', 'FallbackUtils');
      }
      
      return {
        success: true,
        data: result,
        usedFallback: true,
        attempts,
        totalTime,
        fallbackReason: lastError?.message || 'Primary operation failed'
      };
      
    } catch (fallbackError) {
      const totalTime = Date.now() - startTime;
      
      if (finalConfig.enableLogging) {
        logger.error('Fallback também falhou', 'FallbackUtils', fallbackError as Error);
      }
      
      return {
        success: false,
        error: fallbackError,
        usedFallback: true,
        attempts,
        totalTime,
        fallbackReason: 'Both primary and fallback operations failed'
      };
    }
  }

  /**
   * Executa operação com múltiplos fallbacks
   */
  static async executeWithMultipleFallbacks<T>(
    operations: (() => Promise<T>)[],
    config: Partial<FallbackConfig> = {}
  ): Promise<FallbackResult<T>> {
    if (operations.length < 2) {
      throw new Error('At least 2 operations required (primary + fallback)');
    }

    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    let attempts = 0;
    let lastError: any;

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      const isPrimary = i === 0;
      
      try {
        const result = await operation();
        const totalTime = Date.now() - startTime;
        
        if (finalConfig.enableLogging) {
          if (isPrimary) {
            logger.info(`Operação principal bem-sucedida`, 'FallbackUtils');
          } else {
            logger.info(`Fallback ${i} executado com sucesso`, 'FallbackUtils');
          }
        }
        
        return {
          success: true,
          data: result,
          usedFallback: !isPrimary,
          attempts: attempts + 1,
          totalTime,
          fallbackReason: isPrimary ? undefined : `Primary operation failed: ${lastError?.message}`
        };
        
      } catch (error) {
        lastError = error;
        attempts++;
        
        if (finalConfig.enableLogging) {
          if (isPrimary) {
            logger.warn(`Operação principal falhou, tentando fallback ${i + 1}`, 'FallbackUtils');
          } else {
            logger.warn(`Fallback ${i} falhou, tentando próximo`, 'FallbackUtils');
          }
        }
        
        if (i < operations.length - 1) {
          await this.delay(finalConfig.fallbackDelay);
        }
      }
    }

    const totalTime = Date.now() - startTime;
    
    if (finalConfig.enableLogging) {
      logger.error('Todas as operações falharam', 'FallbackUtils');
    }
    
    return {
      success: false,
      error: lastError,
      usedFallback: true,
      attempts,
      totalTime,
      fallbackReason: 'All operations failed'
    };
  }

  /**
   * Executa operação com fallback condicional
   */
  static async executeWithConditionalFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    fallbackCondition: (error: any) => boolean,
    config: Partial<FallbackConfig> = {}
  ): Promise<FallbackResult<T>> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    let attempts = 0;
    let lastError: any;

    try {
      const result = await primaryOperation();
      const totalTime = Date.now() - startTime;
      
      if (finalConfig.enableLogging) {
        logger.info('Operação principal bem-sucedida', 'FallbackUtils');
      }
      
      return {
        success: true,
        data: result,
        usedFallback: false,
        attempts: 1,
        totalTime
      };
      
    } catch (error) {
      lastError = error;
      attempts = 1;
      
      if (!fallbackCondition(error)) {
        const totalTime = Date.now() - startTime;
        
        if (finalConfig.enableLogging) {
          logger.warn('Erro não atende condição para fallback', 'FallbackUtils');
        }
        
        return {
          success: false,
          error,
          usedFallback: false,
          attempts,
          totalTime,
          fallbackReason: 'Error does not meet fallback condition'
        };
      }

      if (finalConfig.enableLogging) {
        logger.warn('Erro atende condição para fallback, executando fallback', 'FallbackUtils');
      }

      try {
        await this.delay(finalConfig.fallbackDelay);
        const result = await fallbackOperation();
        const totalTime = Date.now() - startTime;
        
        if (finalConfig.enableLogging) {
          logger.info('Fallback executado com sucesso', 'FallbackUtils');
        }
        
        return {
          success: true,
          data: result,
          usedFallback: true,
          attempts,
          totalTime,
          fallbackReason: `Fallback condition met: ${error instanceof Error ? error.message : String(error)}`
        };
        
      } catch (fallbackError) {
        const totalTime = Date.now() - startTime;
        
        if (finalConfig.enableLogging) {
          logger.error('Fallback também falhou', 'FallbackUtils', fallbackError as Error);
        }
        
        return {
          success: false,
          error: fallbackError,
          usedFallback: true,
          attempts,
          totalTime,
          fallbackReason: 'Both primary and fallback operations failed'
        };
      }
    }
  }

  /**
   * Executa operação com fallback de cache
   */
  static async executeWithCacheFallback<T>(
    primaryOperation: () => Promise<T>,
    cacheKey: string,
    cacheGetter: (key: string) => Promise<T | null>,
    cacheSetter: (key: string, value: T) => Promise<void>,
    config: Partial<FallbackConfig> = {}
  ): Promise<FallbackResult<T>> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    let attempts = 0;
    let lastError: any;

    try {
      const result = await primaryOperation();
      const totalTime = Date.now() - startTime;
      
      // Salvar no cache
      try {
        await cacheSetter(cacheKey, result);
      } catch (cacheError) {
        if (finalConfig.enableLogging) {
          logger.warn('Falha ao salvar no cache', 'FallbackUtils', cacheError as Error);
        }
      }
      
      if (finalConfig.enableLogging) {
        logger.info('Operação principal bem-sucedida', 'FallbackUtils');
      }
      
      return {
        success: true,
        data: result,
        usedFallback: false,
        attempts: 1,
        totalTime
      };
      
    } catch (error) {
      lastError = error;
      attempts = 1;
      
      if (finalConfig.enableLogging) {
        logger.warn('Operação principal falhou, tentando cache', 'FallbackUtils');
      }

      try {
        const cachedResult = await cacheGetter(cacheKey);
        
        if (cachedResult !== null) {
          const totalTime = Date.now() - startTime;
          
          if (finalConfig.enableLogging) {
            logger.info('Dados recuperados do cache', 'FallbackUtils');
          }
          
          return {
            success: true,
            data: cachedResult,
            usedFallback: true,
            attempts,
            totalTime,
            fallbackReason: 'Primary operation failed, using cached data'
          };
        } else {
          const totalTime = Date.now() - startTime;
          
          if (finalConfig.enableLogging) {
            logger.warn('Cache vazio, operação falhou', 'FallbackUtils');
          }
          
          return {
            success: false,
            error,
            usedFallback: true,
            attempts,
            totalTime,
            fallbackReason: 'Primary operation failed and cache is empty'
          };
        }
        
      } catch (cacheError) {
        const totalTime = Date.now() - startTime;
        
        if (finalConfig.enableLogging) {
          logger.error('Falha ao acessar cache', 'FallbackUtils', cacheError as Error);
        }
        
        return {
          success: false,
          error: cacheError,
          usedFallback: true,
          attempts,
          totalTime,
          fallbackReason: 'Both primary operation and cache failed'
        };
      }
    }
  }

  /**
   * Executa operação com fallback de valor padrão
   */
  static async executeWithDefaultFallback<T>(
    primaryOperation: () => Promise<T>,
    defaultValue: T,
    config: Partial<FallbackConfig> = {}
  ): Promise<FallbackResult<T>> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    let attempts = 0;
    let lastError: any;

    try {
      const result = await primaryOperation();
      const totalTime = Date.now() - startTime;
      
      if (finalConfig.enableLogging) {
        logger.info('Operação principal bem-sucedida', 'FallbackUtils');
      }
      
      return {
        success: true,
        data: result,
        usedFallback: false,
        attempts: 1,
        totalTime
      };
      
    } catch (error) {
      lastError = error;
      attempts = 1;
      
      if (finalConfig.enableLogging) {
        logger.warn('Operação principal falhou, usando valor padrão', 'FallbackUtils');
      }

      const totalTime = Date.now() - startTime;
      
      return {
        success: true,
        data: defaultValue,
        usedFallback: true,
        attempts,
        totalTime,
        fallbackReason: `Primary operation failed, using default value: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Executa operação com fallback de retry
   */
  static async executeWithRetryFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    retryConfig: any = {},
    config: Partial<FallbackConfig> = {}
  ): Promise<FallbackResult<T>> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    let attempts = 0;
    let lastError: any;

    // Tentar operação principal com retry
    const retryResult = await RetryUtils.executeWithRetry(primaryOperation, retryConfig);
    
    if (retryResult.success) {
      const totalTime = Date.now() - startTime;
      
      if (finalConfig.enableLogging) {
        logger.info('Operação principal bem-sucedida com retry', 'FallbackUtils');
      }
      
      return {
        success: true,
        data: retryResult.data,
        usedFallback: false,
        attempts: retryResult.attempts,
        totalTime
      };
    }

    lastError = retryResult.error;
    attempts = retryResult.attempts;

    if (finalConfig.enableLogging) {
      logger.warn('Operação principal falhou mesmo com retry, executando fallback', 'FallbackUtils');
    }

    try {
      await this.delay(finalConfig.fallbackDelay);
      const result = await fallbackOperation();
      const totalTime = Date.now() - startTime;
      
      if (finalConfig.enableLogging) {
        logger.info('Fallback executado com sucesso', 'FallbackUtils');
      }
      
      return {
        success: true,
        data: result,
        usedFallback: true,
        attempts,
        totalTime,
        fallbackReason: `Primary operation failed after ${attempts} attempts`
      };
      
    } catch (fallbackError) {
      const totalTime = Date.now() - startTime;
      
      if (finalConfig.enableLogging) {
        logger.error('Fallback também falhou', 'FallbackUtils', fallbackError as Error);
      }
      
      return {
        success: false,
        error: fallbackError,
        usedFallback: true,
        attempts,
        totalTime,
        fallbackReason: 'Both primary operation (with retry) and fallback failed'
      };
    }
  }

  /**
   * Utilitário de delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtém estatísticas de fallback
   */
  static getFallbackStats(results: FallbackResult<any>[]): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    operationsUsingFallback: number;
    averageAttempts: number;
    averageTime: number;
    fallbackReasons: { [reason: string]: number };
  } {
    const totalOperations = results.length;
    const successfulOperations = results.filter(r => r.success).length;
    const failedOperations = totalOperations - successfulOperations;
    const operationsUsingFallback = results.filter(r => r.usedFallback).length;
    const totalAttempts = results.reduce((sum, r) => sum + r.attempts, 0);
    const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
    
    const fallbackReasons: { [reason: string]: number } = {};
    results.forEach(r => {
      if (r.fallbackReason) {
        fallbackReasons[r.fallbackReason] = (fallbackReasons[r.fallbackReason] || 0) + 1;
      }
    });

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      operationsUsingFallback,
      averageAttempts: totalOperations > 0 ? totalAttempts / totalOperations : 0,
      averageTime: totalOperations > 0 ? totalTime / totalOperations : 0,
      fallbackReasons
    };
  }
}

// Funções de conveniência
export const executeWithFallback = <T>(
  primaryOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T>,
  config?: Partial<FallbackConfig>
) => FallbackUtils.executeWithFallback(primaryOperation, fallbackOperation, config);

export const executeWithDefaultFallback = <T>(
  primaryOperation: () => Promise<T>,
  defaultValue: T,
  config?: Partial<FallbackConfig>
) => FallbackUtils.executeWithDefaultFallback(primaryOperation, defaultValue, config);

export const executeWithCacheFallback = <T>(
  primaryOperation: () => Promise<T>,
  cacheKey: string,
  cacheGetter: (key: string) => Promise<T | null>,
  cacheSetter: (key: string, value: T) => Promise<void>,
  config?: Partial<FallbackConfig>
) => FallbackUtils.executeWithCacheFallback(primaryOperation, cacheKey, cacheGetter, cacheSetter, config);
