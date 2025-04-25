import TerrainSystem from '../TerrainSystem';

// Mock Phaser objects
const mockScene = {
  physics: {
    add: {
      staticGroup: jest.fn().mockReturnValue({
        create: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnValue({
            refreshBody: jest.fn()
          }),
          refreshBody: jest.fn(),
          destroy: jest.fn()
        }),
        getChildren: jest.fn().mockReturnValue([
          { x: 50, destroy: jest.fn() },
          { x: 150, destroy: jest.fn() },
          { x: 250, destroy: jest.fn() }
        ])
      })
    }
  },
  textures: {
    get: jest.fn().mockReturnValue({})
  }
};

describe('TerrainSystem', () => {
  let terrainSystem: TerrainSystem;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore - We're mocking the Phaser.Scene
    terrainSystem = new TerrainSystem(mockScene, 600);
  });
  
  test('should initialize with default values', () => {
    // @ts-ignore - We're mocking the Phaser.Scene
    const ts = new TerrainSystem(mockScene, 600);
    expect(ts).toBeDefined();
    expect(mockScene.physics.add.staticGroup).toHaveBeenCalled();
  });
  
  test('should return the terrain group', () => {
    const terrainGroup = terrainSystem.getTerrainGroup();
    expect(terrainGroup).toBeDefined();
  });
  
  test('should update terrain based on camera position', () => {
    // Spy on private methods using any type cast
    const getVisibleChunkIndicesSpy = jest.spyOn(
      terrainSystem as any, 
      'getVisibleChunkIndices'
    );
    
    const generateChunkSpy = jest.spyOn(
      terrainSystem as any, 
      'generateChunk'
    );
    
    terrainSystem.update(400);
    
    expect(getVisibleChunkIndicesSpy).toHaveBeenCalledWith(400);
    expect(generateChunkSpy).toHaveBeenCalled();
  });
  
  test('should calculate visible chunk indices correctly', () => {
    // Directly test the private method using any type cast
    const chunks = (terrainSystem as any).getVisibleChunkIndices(400);
    
    // Assuming 16 tiles per chunk and 32px tile size = 512px chunk width
    // Camera at 400 should be in chunk index 0 (0-511px)
    // So we should get chunks -2, -1, 0, 1, 2 (with default 2 chunks loading radius)
    expect(chunks).toContain(0);
    expect(chunks).toContain(-1);
    expect(chunks).toContain(1);
    expect(chunks).toContain(-2);
    expect(chunks).toContain(2);
    expect(chunks.length).toBe(5);
  });
  
  test('should unload chunks that are out of view', () => {
    // Set up the loadedChunks Map with some chunks
    // @ts-ignore - Accessing private property for testing
    terrainSystem.loadedChunks.set('chunk_-5', true);
    // @ts-ignore - Accessing private property for testing
    terrainSystem.loadedChunks.set('chunk_-4', true);
    
    const unloadChunkSpy = jest.spyOn(
      terrainSystem as any, 
      'unloadChunk'
    );
    
    // Update with camera in position that would make chunks -5 and -4 out of view
    terrainSystem.update(400);
    
    expect(unloadChunkSpy).toHaveBeenCalledWith(-5);
    expect(unloadChunkSpy).toHaveBeenCalledWith(-4);
  });
}); 