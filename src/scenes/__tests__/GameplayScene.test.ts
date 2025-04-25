// Mock Player class
jest.mock('../../gameobjects/Player', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        getSprite: jest.fn().mockReturnValue({}),
        update: jest.fn(),
        isFacingRight: jest.fn().mockReturnValue(true)
      };
    })
  };
});

// Mock FishingSystem
jest.mock('../../systems/FishingSystem', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        update: jest.fn(),
        onCatch: jest.fn(),
        getLine: jest.fn().mockReturnValue({
          addCollisionGroup: jest.fn()
        })
      };
    })
  };
});

// Mock TerrainSystem
jest.mock('../../systems/TerrainSystem', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        update: jest.fn(),
        getTerrainGroup: jest.fn().mockReturnValue({})
      };
    })
  };
});

// Mock Phaser
jest.mock('phaser', () => {
  class MockGraphics {
    fillStyle() { return this; }
    strokeStyle() { return this; }
    lineStyle() { return this; }
    fillRect() { return this; }
    strokeRect() { return this; }
    lineBetween() { return this; }
    generateTexture() { return this; }
    fillCircle() { return this; }
    fillEllipse() { return this; }
    fillTriangle() { return this; }
  }
  
  class MockText {
    setOrigin() { return this; }
    setDepth() { return this; }
    setText() { return this; }
    setAlpha() { return this; }
    setScale() { return this; }
    destroy() { return this; }
  }
  
  class MockGameObjects {
    graphics = () => new MockGraphics();
    text = () => new MockText();
  }
  
  class MockStaticGroup {
    create() { return this; }
  }
  
  class MockGeom {
    Rectangle = jest.fn().mockImplementation(() => ({}));
  }
  
  class MockPhysics {
    add = {
      staticGroup: () => new MockStaticGroup(),
      collider: jest.fn(),
      sprite: jest.fn().mockReturnValue({
        setBounce: jest.fn().mockReturnThis(),
        setCollideWorldBounds: jest.fn().mockReturnThis()
      })
    };
    world = {
      gravity: { y: 0 }
    };
  }
  
  class MockCamera {
    startFollow() { return this; }
    setBackgroundColor() { return this; }
    setBounds() { return this; }
    scrollX = 0;
  }
  
  class MockCameras {
    main = new MockCamera();
  }

  class MockTweens {
    add() { return this; }
    killTweensOf() { return this; }
  }

  class MockInput {
    mouse = {
      disableContextMenu: jest.fn()
    };
    keyboard = {
      createCursorKeys: jest.fn().mockReturnValue({}),
      addKey: jest.fn()
    };
  }

  class MockScene {
    scene = { key: '' };
    cameras = new MockCameras();
    physics = new MockPhysics();
    scale = { width: 800, height: 600 };
    add = new MockGameObjects();
    input = new MockInput();
    tweens = new MockTweens();
    
    constructor(config: string) {
      this.scene.key = config;
    }
  }
  
  return {
    Scene: MockScene,
    __esModule: true,
    default: {
      Scene: MockScene,
      Geom: MockGeom
    },
    Geom: {
      Rectangle: jest.fn().mockImplementation(() => ({}))
    }
  };
});

// Import after mock
import GameplayScene from '../GameplayScene';
import Player from '../../gameobjects/Player';
import TerrainSystem from '../../systems/TerrainSystem';
import FishingSystem from '../../systems/FishingSystem';

describe('GameplayScene', () => {
  let scene: GameplayScene;
  
  beforeEach(() => {
    scene = new GameplayScene();
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  test('scene should be created with correct key', () => {
    expect(scene.scene.key).toBe('GameplayScene');
  });
  
  test('create should set up terrain, player, and fishing systems', () => {
    // Mock functions and properties needed for create
    const mockCollider = jest.spyOn(scene.physics.add, 'collider');
    
    // Call create
    scene.create();
    
    // Verify Player and systems are instantiated
    expect(Player).toHaveBeenCalledWith(scene, 400, 300);
    expect(TerrainSystem).toHaveBeenCalledWith(scene, 600); // 600 is the height
    expect(FishingSystem).toHaveBeenCalled();
    expect(mockCollider).toHaveBeenCalled();
  });
  
  test('update should call all system updates', () => {
    // Set up scene with player and systems
    scene.create();
    
    // Get the mocked instances
    const playerInstance = (Player as jest.Mock).mock.results[0].value;
    const terrainInstance = (TerrainSystem as jest.Mock).mock.results[0].value;
    const fishingInstance = (FishingSystem as jest.Mock).mock.results[0].value;
    
    // Call update
    scene.update(0, 16);
    
    // Verify updates were called
    expect(playerInstance.update).toHaveBeenCalled();
    expect(terrainInstance.update).toHaveBeenCalled();
    expect(fishingInstance.update).toHaveBeenCalled();
  });
}); 