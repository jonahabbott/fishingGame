// Mock Phaser
jest.mock('phaser', () => {
  // Mock sprite with physics body
  class MockSprite {
    body: any;
    scene: any;
    
    constructor() {
      this.body = {
        velocity: { x: 0, y: 0 },
        touching: { down: false }
      };
    }
    
    setBounce() { return this; }
    setCollideWorldBounds() { return this; }
    setVelocityX(x: number) { this.body.velocity.x = x; }
    setVelocityY(y: number) { this.body.velocity.y = y; }
  }
  
  // Mock scene
  class MockScene {
    physics: any;
    input: any;
    
    constructor() {
      this.physics = {
        add: {
          sprite: () => new MockSprite()
        }
      };
      
      this.input = {
        keyboard: {
          createCursorKeys: jest.fn().mockReturnValue({
            left: { isDown: false },
            right: { isDown: false },
            up: { isDown: false }
          })
        }
      };
    }
  }
  
  return {
    Scene: MockScene,
    Physics: {
      Arcade: {
        Sprite: MockSprite
      }
    },
    __esModule: true,
    default: {
      Scene: MockScene,
      Physics: {
        Arcade: {
          Sprite: MockSprite
        }
      }
    }
  };
});

// Import after mocks
import Player from '../Player';
import Phaser from 'phaser';

describe('Player', () => {
  let scene: Phaser.Scene;
  let player: Player;
  let cursorsMock: any;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    scene = new Phaser.Scene('');
    cursorsMock = {
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: false }
    };
    
    // Update the mock to return our controllable mock
    (scene.input.keyboard.createCursorKeys as jest.Mock).mockReturnValue(cursorsMock);
    
    player = new Player(scene, 100, 100);
  });
  
  test('player should be created with sprite', () => {
    expect(player.getSprite()).toBeDefined();
  });
  
  test('player should move right when right cursor is pressed', () => {
    // Setup: mock right cursor as pressed
    cursorsMock.right.isDown = true;
    
    // Execute
    player.update();
    
    // Verify
    expect(player.getSprite().body.velocity.x).toBeGreaterThan(0);
  });
  
  test('player should move left when left cursor is pressed', () => {
    // Setup: mock left cursor as pressed
    cursorsMock.left.isDown = true;
    
    // Execute
    player.update();
    
    // Verify
    expect(player.getSprite().body.velocity.x).toBeLessThan(0);
  });
  
  test('player should jump when up cursor is pressed and touching ground', () => {
    // Setup: mock up cursor as pressed and player touching ground
    cursorsMock.up.isDown = true;
    player.getSprite().body.touching.down = true;
    
    // Execute
    player.update();
    
    // Verify
    expect(player.getSprite().body.velocity.y).toBeLessThan(0);
  });
}); 