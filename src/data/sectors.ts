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
    "id": "631f2b4f307d23f46ac80a1c",
    "name": "Comercial",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "631f7d27307d23f46af88983",
    "name": "Administrativo/Financeiro",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "63440c6e7400be926a5237d1",
    "name": "Grupo",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "6400efb5343817d4ddbb2a4c",
    "name": "Suporte CAM",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "6401f4f49b1ff8512b525e9c",
    "name": "Suporte Telefonia",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "6492095a2071b73706a3bda9",
    "name": "Servidor",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "64d4db384f04cb80ac059912",
    "name": "Suporte Geral",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "65720e7b991a54728a27c0db",
    "name": "Avaliação",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "6634ed287a52f05462cb028c",
    "name": "NPS",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "668c2f2ac46b84967464c5f2",
    "name": "Suporte TI (Manutenção/Infrastrutura)",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "674f0858a37c238610154000",
    "name": "Sucesso do Cliente",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "674f0bb23759129539a542fd",
    "name": "Auditoria",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "679cb8a027182216928c6bd6",
    "name": "Comunicado",
    "organizationId": "631f2b4f307d23f46ac80a12"
  },
  {
    "id": "67a3ca664d0be50c658c2d79",
    "name": "Indique e Ganhe",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "67ae3aceda37153290847530",
    "name": "Desenvolvimento",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": ""
  },
  {
    "id": "67b4707ab84af8f53a3c320d",
    "name": "Campanha contratação",
    "organizationId": "631f2b4f307d23f46ac80a12",
    "serviceTimeRuleId": "631f2b4f307d23f46ac80a15"
  },
  {
    "id": "68c1d1fb712a4302650d8008",
    "name": "Campanhas Comercial",
    "organizationId": "631f2b4f307d23f46ac80a12"
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
