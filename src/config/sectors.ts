// Configuração dos setores
export const SECTORS_CONFIG = {
  // Usar dados da API em vez de dados estáticos
  USE_STATIC_DATA: false,
  
  // Cache de setores (em segundos)
  CACHE_TTL: 3600, // 1 hora
  
  // Atualizar dados da API automaticamente
  AUTO_UPDATE: true,
  
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
