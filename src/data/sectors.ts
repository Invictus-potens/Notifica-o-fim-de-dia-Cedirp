// Dados estáticos dos setores para otimizar consultas
// Fonte: API CAM Krolik

export interface SectorData {
  id: string;
  name: string;
  organizationId: string;
  serviceTimeRuleId?: string;
}

export const SECTORS_DATA: SectorData[] = [
  {
    "id": "65eb53aa0e74e281e12ba594",
    "name": "Grupos WhatsApp/Setor geral",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "65eb5a0e681c0098402e5839",
    "name": "Ressonância Magnética",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "65eb5a1a01515baa7f9c6b9f",
    "name": "Tomografia Computadorizada",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "65eb5a217b2ad8749ef7aa42",
    "name": "Ultrassom",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "65eb5a270c00c6ae4943cdc6",
    "name": "Mamografia",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "65eb5a3501515baa7fa15ef8",
    "name": "Densitometria Óssea",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "65eb5a3c01515baa7fa25c4a",
    "name": "Cardiologia",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "65eb5a420c00c6ae49486316",
    "name": "Raio X",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "65eb5a4d973bd0cedb32efa2",
    "name": "Biopsias e Procedimentos",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "65eb5a52973bd0cedb33df0d",
    "name": "Outros",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "65ef29cf867543e1d040ec9f",
    "name": "Outras informações",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "65f0a689746a222fbccc906c",
    "name": "Anexo",
    "organizationId": "65eb53aa0e74e281e12ba2bc"
  },
  {
    "id": "6627fab80f0dbc5420282b2b",
    "name": "Resultados",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "6627fac62c6fb7d3c7fb7aba",
    "name": "Impressão de exame",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "6627fad02c6fb7d3c7fd6d78",
    "name": "Orçamento",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "665090aef00af9d07c2a5e97",
    "name": "Cancelar agendamento",
    "organizationId": "65eb53aa0e74e281e12ba2bc",
    "serviceTimeRuleId": "65eb53aa0e74e281e12ba568"
  },
  {
    "id": "682739784933d4656bf60583",
    "name": "Confirmação",
    "organizationId": "65eb53aa0e74e281e12ba2bc"
  }
];

// Função para buscar setor por ID
export function getSectorById(id: string): SectorData | undefined {
  return SECTORS_DATA.find(sector => sector.id === id);
}

// Função para buscar setor por nome
export function getSectorByName(name: string): SectorData | undefined {
  return SECTORS_DATA.find(sector => 
    sector.name.toLowerCase().includes(name.toLowerCase())
  );
}

// Função para listar todos os setores
export function getAllSectors(): SectorData[] {
  return [...SECTORS_DATA];
}

// Função para buscar setores por organização
export function getSectorsByOrganization(organizationId: string): SectorData[] {
  return SECTORS_DATA.filter(sector => sector.organizationId === organizationId);
}

// Função para verificar se um setor existe
export function sectorExists(id: string): boolean {
  return SECTORS_DATA.some(sector => sector.id === id);
}

// Função para obter nomes dos setores (para logs)
export function getSectorNames(): string[] {
  return SECTORS_DATA.map(sector => sector.name);
}
