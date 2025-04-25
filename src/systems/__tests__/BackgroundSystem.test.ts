import BackgroundSystem from '../BackgroundSystem';

// Mock Phaser objects
const mockRectangle = {
  setDepth: jest.fn().mockReturnThis(),
  setScrollFactor: jest.fn().mockReturnThis(),
  setFillStyle: jest.fn().mockReturnThis()
};

const mockTileSprite = {
  setDepth: jest.fn().mockReturnThis(),
  setScrollFactor: jest.fn().mockReturnThis(),
  destroy: jest.fn()
};

const mockGraphics = {
  fillStyle: jest.fn().mockReturnThis(),
  beginPath: jest.fn().mockReturnThis(),
  moveTo: jest.fn().mockReturnThis(),
  lineTo: jest.fn().mockReturnThis(),
  closePath: jest.fn().mockReturnThis(),
  fill: jest.fn().mockReturnThis(),
  clear: jest.fn().mockReturnThis(),
  lineStyle: jest.fn().mockReturnThis(),
  stroke: jest.fn().mockReturnThis(),
  fillRect: jest.fn().mockReturnThis(),
  fillCircle: jest.fn().mockReturnThis(),
  generateTexture: jest.fn().mockReturnThis(),
  setDepth: jest.fn().mockReturnThis(),
  setScrollFactor: jest.fn().mockReturnThis(),
  destroy: jest.fn(),
  clear: jest.fn()
};

const mockSprite = {
  setDepth: jest.fn().mockReturnThis(),
  setScrollFactor: jest.fn().mockReturnThis(),
  setScale: jest.fn().mockReturnThis(),
  setData: jest.fn().mockReturnThis(),
  setAlpha: jest.fn().mockReturnThis(),
  getData: jest.fn().mockImplementation((key) => {
    if (key === 'speed') return 0.1;
    if (key === 'direction') return 1;
    return null;
  }),
  setFlipX: jest.fn().mockReturnThis(),
  destroy: jest.fn()
};

const mockTween = {
  remove: jest.fn()
};

const mockScene = {
  add: {
    rectangle: jest.fn().mockReturnValue(mockRectangle),
    tileSprite: jest.fn().mockReturnValue(mockTileSprite),
    graphics: jest.fn().mockReturnValue(mockGraphics),
    sprite: jest.fn().mockReturnValue(mockSprite)
  },
  scale: {
    width: 800,
    height: 600
  },
  time: {
    addEvent: jest.fn().mockReturnValue(mockTween),
    now: 1000
  },
  tweens: {
    add: jest.fn()
  },
  cameras: {
    main: {
      scrollX: 0
    }
  }
};

describe('BackgroundSystem', () => {
  let backgroundSystem: BackgroundSystem;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore - We're mocking the Phaser.Scene
    backgroundSystem = new BackgroundSystem(mockScene);
  });
  
  test('should initialize with default values', () => {
    expect(backgroundSystem).toBeDefined();
    expect(mockScene.add.rectangle).toHaveBeenCalled();
    expect(mockScene.add.graphics).toHaveBeenCalled();
    expect(mockScene.time.addEvent).toHaveBeenCalled();
  });
  
  test('should create background layers', () => {
    // @ts-ignore - Accessing private method for testing
    backgroundSystem.createBackgroundLayers();
    
    // Should create 3 tileSprite layers (mountains, hills, trees)
    expect(mockScene.add.tileSprite).toHaveBeenCalledTimes(3);
    expect(mockScene.add.tileSprite).toHaveBeenCalledWith(
      400, // width/2
      expect.any(Number),
      800, // width
      expect.any(Number),
      expect.any(String)
    );
  });
  
  test('should create ambient elements', () => {
    // @ts-ignore - Accessing private method for testing
    backgroundSystem.createAmbientElements();
    
    // Should create clouds, birds, and tree tops
    expect(mockScene.add.sprite).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      'cloud'
    );
    
    expect(mockScene.add.sprite).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      'bird'
    );
    
    expect(mockScene.add.sprite).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      'tree_top'
    );
  });
  
  test('should create day/night cycle', () => {
    // @ts-ignore - Accessing private method for testing
    backgroundSystem.createDayNightCycle();
    
    expect(mockScene.add.graphics).toHaveBeenCalled();
    expect(mockGraphics.setDepth).toHaveBeenCalledWith(1000);
    expect(mockGraphics.setScrollFactor).toHaveBeenCalledWith(0);
  });
  
  test('should update background parallax based on camera position', () => {
    // Setup mock background layers
    // @ts-ignore - Setting private property for testing
    backgroundSystem.backgroundLayers = [
      { tilePositionX: 0 },
      { tilePositionX: 0 },
      { tilePositionX: 0 }
    ];
    
    backgroundSystem.update(500);
    
    // Assert parallax movement at different speeds
    // @ts-ignore - Accessing private property for testing
    expect(backgroundSystem.backgroundLayers[0].tilePositionX).toBe(500 * 0.1);
    // @ts-ignore - Accessing private property for testing
    expect(backgroundSystem.backgroundLayers[1].tilePositionX).toBe(500 * 0.2);
    // @ts-ignore - Accessing private property for testing
    expect(backgroundSystem.backgroundLayers[2].tilePositionX).toBe(500 * 0.4);
  });
  
  test('should set time of day', () => {
    const updateDayNightCycleSpy = jest.spyOn(
      backgroundSystem as any, 
      'updateDayNightCycle'
    );
    
    backgroundSystem.setTimeOfDay(0.5);
    
    // @ts-ignore - Accessing private property for testing
    expect(backgroundSystem.timeOfDay).toBe(0.5);
    expect(updateDayNightCycleSpy).toHaveBeenCalledWith(0.5);
  });
  
  test('should get time of day', () => {
    // @ts-ignore - Setting private property for testing
    backgroundSystem.timeOfDay = 0.75;
    
    expect(backgroundSystem.getTimeOfDay()).toBe(0.75);
  });
  
  test('should properly clean up resources on destroy', () => {
    // Setup mock objects
    // @ts-ignore - Setting private properties for testing
    backgroundSystem.backgroundLayers = [mockTileSprite, mockTileSprite, mockTileSprite];
    // @ts-ignore - Setting private properties for testing
    backgroundSystem.clouds = [mockSprite, mockSprite];
    // @ts-ignore - Setting private properties for testing
    backgroundSystem.birds = [mockSprite, mockSprite];
    // @ts-ignore - Setting private properties for testing
    backgroundSystem.treeTops = [mockSprite, mockSprite];
    // @ts-ignore - Setting private properties for testing
    backgroundSystem.dayTimer = mockTween;
    // @ts-ignore - Setting private properties for testing
    backgroundSystem.dayNightCycle = mockGraphics;
    
    backgroundSystem.destroy();
    
    expect(mockTween.remove).toHaveBeenCalled();
    expect(mockGraphics.destroy).toHaveBeenCalled();
    expect(mockTileSprite.destroy).toHaveBeenCalledTimes(3);
    expect(mockSprite.destroy).toHaveBeenCalledTimes(6);
  });
}); 