// Mock Player class
jest.mock('../../gameobjects/Player', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        getSprite: jest.fn().mockReturnValue({}),
        update: jest.fn()
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
  }
  
  class MockGameObjects {
    graphics = () => new MockGraphics();
  }
  
  class MockStaticGroup {
    create() { return this; }
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
  }
  
  class MockCameras {
    main = new MockCamera();
  }

  class MockScene {
    scene = { key: '' };
    cameras = new MockCameras();
    physics = new MockPhysics();
    scale = { width: 800, height: 600 };
    add = new MockGameObjects();
    
    constructor(config: string) {
      this.scene.key = config;
    }
  }
  
  return {
    Scene: MockScene,
    __esModule: true,
    default: {
      Scene: MockScene
    }
  };
});

// Import after mock
import GameplayScene from '../GameplayScene';
import Player from '../../gameobjects/Player';

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
  
  test('create should set up ground, player, and colliders', () => {
    // Mock functions and properties needed for create
    const mockCollider = jest.spyOn(scene.physics.add, 'collider');
    
    // Call create
    scene.create();
    
    // Verify Player is instantiated, collision is set up
    expect(Player).toHaveBeenCalledWith(scene, 400, 300);
    expect(mockCollider).toHaveBeenCalled();
  });
  
  test('update should call player update', () => {
    // Set up scene with player
    scene.create();
    
    // Get the mocked player instance
    const playerInstance = (Player as jest.Mock).mock.results[0].value;
    
    // Call update
    scene.update();
    
    // Verify player's update was called
    expect(playerInstance.update).toHaveBeenCalled();
  });
}); 