// Mock Phaser
jest.mock('phaser', () => {
  // Mock sprite
  class MockSprite {
    x: number = 0;
    y: number = 0;
    angle: number = 0;
    
    constructor() {}
    
    setFlipX() { return this; }
  }
  
  // Mock vector
  class MockVector2 {
    x: number;
    y: number;
    
    constructor(x: number = 0, y: number = 0) {
      this.x = x;
      this.y = y;
    }
    
    set(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    }
  }
  
  // Mock scene
  class MockScene {
    add: any;
    tweens: any;
    
    constructor() {
      this.add = {
        sprite: () => new MockSprite()
      };
      
      this.tweens = {
        add: jest.fn()
      };
    }
  }
  
  return {
    Scene: MockScene,
    GameObjects: {
      Sprite: MockSprite
    },
    Math: {
      Vector2: MockVector2
    },
    __esModule: true,
    default: {
      Scene: MockScene,
      GameObjects: {
        Sprite: MockSprite
      },
      Math: {
        Vector2: MockVector2
      }
    }
  };
});

// Import after mocks
import FishingRod from '../FishingRod';
import Phaser from 'phaser';

describe('FishingRod', () => {
  let scene: Phaser.Scene;
  let fishingRod: FishingRod;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    scene = new Phaser.Scene('');
    fishingRod = new FishingRod(scene, 100, 100);
  });
  
  test('fishing rod should be created with sprite', () => {
    expect(fishingRod.getSprite()).toBeDefined();
  });
  
  test('fishing rod should update position based on player', () => {
    // Test position update
    const playerX = 200;
    const playerY = 150;
    const isFacingRight = true;
    
    // Execute
    fishingRod.update(playerX, playerY, isFacingRight);
    
    // Verify rod position is offset from player
    const sprite = fishingRod.getSprite();
    expect(sprite.x).toBeGreaterThan(playerX); // Rod should be to the right when facing right
    expect(sprite.y).not.toBe(playerY); // Rod should have vertical offset
  });
  
  test('fishing rod should flip when player faces left', () => {
    // Test both directions
    const playerX = 200;
    const playerY = 150;
    
    // Mock the setFlipX method
    const mockSetFlipX = jest.spyOn(fishingRod.getSprite(), 'setFlipX');
    
    // Test facing left
    fishingRod.update(playerX, playerY, false);
    expect(mockSetFlipX).toHaveBeenCalledWith(true);
    
    // Test facing right
    mockSetFlipX.mockClear();
    fishingRod.update(playerX, playerY, true);
    expect(mockSetFlipX).toHaveBeenCalledWith(false);
  });
  
  test('fishing rod should play cast animation', () => {
    // Test animation
    fishingRod.playCastAnimation();
    
    // Verify tween was created
    expect(scene.tweens.add).toHaveBeenCalled();
    
    // Get the tween config
    const tweenConfig = (scene.tweens.add as jest.Mock).mock.calls[0][0];
    
    // Verify tween properties
    expect(tweenConfig.targets).toBe(fishingRod.getSprite());
    expect(tweenConfig.yoyo).toBe(true);
  });
  
  test('fishing rod should calculate tip position correctly', () => {
    // Test getting tip position
    const tipPosition = fishingRod.getTipPosition();
    
    // Verify we get a valid Vector2
    expect(tipPosition).toBeDefined();
    expect(typeof tipPosition.x).toBe('number');
    expect(typeof tipPosition.y).toBe('number');
  });
}); 