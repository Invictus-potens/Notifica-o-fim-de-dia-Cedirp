// Configuração dos setores
export const SECTORS_CONFIG = {
  // Usar dados estáticos em vez de consultar a API
  USE_STATIC_DATA: true,
  
  // Cache de setores (em segundos)
  CACHE_TTL: 3600, // 1 hora
  
  // Atualizar dados estáticos automaticamente
  AUTO_UPDATE: false,
  
  // Log de operações com setores
  ENABLE_LOGGING: true
};

// Função para verificar se deve usar dados estáticos
export function shouldUseStaticData(): boolean {
  return SECTORS_CONFIG.USE_STATIC_DATA;
}

// Função para obter TTL do cache
export function getCacheTTL(): number {
  return SECTORS_CONFIG.CACHE_TTL;
}

// Função para verificar se logging está habilitado
export function isLoggingEnabled(): boolean {
  return SECTORS_CONFIG.ENABLE_LOGGING;
}
