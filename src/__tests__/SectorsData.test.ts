import { 
  SECTORS_DATA, 
  getSectorById, 
  getSectorByName, 
  getAllSectors, 
  sectorExists,
  getSectorNames 
} from '../data/sectors';

describe('Sectors Data', () => {
  test('should have sectors data loaded', () => {
    expect(SECTORS_DATA).toBeDefined();
    expect(SECTORS_DATA.length).toBeGreaterThan(0);
  });

  test('should find sector by ID', () => {
    const firstSector = SECTORS_DATA[0];
    const foundSector = getSectorById(firstSector.id);
    
    expect(foundSector).toBeDefined();
    expect(foundSector?.id).toBe(firstSector.id);
    expect(foundSector?.name).toBe(firstSector.name);
  });

  test('should return undefined for non-existent sector ID', () => {
    const foundSector = getSectorById('non-existent-id');
    expect(foundSector).toBeUndefined();
  });

  test('should find sector by name', () => {
    const foundSector = getSectorByName('Ressonância Magnética');
    
    expect(foundSector).toBeDefined();
    expect(foundSector?.name).toBe('Ressonância Magnética');
  });

  test('should find sector by partial name', () => {
    const foundSector = getSectorByName('Ressonância');
    
    expect(foundSector).toBeDefined();
    expect(foundSector?.name).toContain('Ressonância');
  });

  test('should return all sectors', () => {
    const allSectors = getAllSectors();
    
    expect(allSectors).toBeDefined();
    expect(allSectors.length).toBe(SECTORS_DATA.length);
    expect(allSectors).toEqual(SECTORS_DATA);
  });

  test('should check if sector exists', () => {
    const firstSector = SECTORS_DATA[0];
    
    expect(sectorExists(firstSector.id)).toBe(true);
    expect(sectorExists('non-existent-id')).toBe(false);
  });

  test('should get sector names', () => {
    const names = getSectorNames();
    
    expect(names).toBeDefined();
    expect(names.length).toBe(SECTORS_DATA.length);
    expect(names).toContain('Ressonância Magnética');
    expect(names).toContain('Tomografia Computadorizada');
  });

  test('should have required properties for each sector', () => {
    SECTORS_DATA.forEach(sector => {
      expect(sector).toHaveProperty('id');
      expect(sector).toHaveProperty('name');
      expect(sector).toHaveProperty('organizationId');
      expect(typeof sector.id).toBe('string');
      expect(typeof sector.name).toBe('string');
      expect(typeof sector.organizationId).toBe('string');
    });
  });

  test('should have unique IDs', () => {
    const ids = SECTORS_DATA.map(sector => sector.id);
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('should have unique names', () => {
    const names = SECTORS_DATA.map(sector => sector.name);
    const uniqueNames = new Set(names);
    
    expect(uniqueNames.size).toBe(names.length);
  });
});
