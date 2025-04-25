// Mock FishingRod and FishingLine
jest.mock('../../gameobjects/FishingRod', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      update: jest.fn(),
      playCastAnimation: jest.fn(),
      getTipPosition: jest.fn().mockReturnValue({ x: 150, y: 100 }),
      getSprite: jest.fn()
    }))
  };
});

jest.mock('../../gameobjects/FishingLine', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      cast: jest.fn(),
      update: jest.fn(),
      isInWater: jest.fn().mockReturnValue(false),
      getEndPoint: jest.fn().mockReturnValue({ x: 200, y: 200 }),
      getIsActive: jest.fn().mockReturnValue(true),
      reset: jest.fn()
    }))
  };
});

// Mock Phaser
jest.mock('phaser', () => {
  // Mock rectangle
  class MockRectangle {
    contains(x: number, y: number) {
      return false; // Default behavior, can be overridden in tests
    }
  }
  
  // Mock time events
  class MockTimerEvent {
    remove() {}
  }
  
  // Mock scene
  class MockScene {
    time: any;
    input: any;
    
    constructor() {
      this.time = {
        delayedCall: jest.fn().mockReturnValue(new MockTimerEvent())
      };
      
      this.input = {
        keyboard: {
          addKey: jest.fn().mockReturnValue({ isDown: false })
        }
      };
    }
  }
  
  return {
    Scene: MockScene,
    Geom: {
      Rectangle: MockRectangle
    },
    Input: {
      Keyboard: {
        JustDown: jest.fn().mockReturnValue(false),
        KeyCodes: {
          F: 70
        }
      }
    },
    __esModule: true,
    default: {
      Scene: MockScene,
      Geom: {
        Rectangle: MockRectangle
      },
      Input: {
        Keyboard: {
          JustDown: jest.fn().mockReturnValue(false),
          KeyCodes: {
            F: 70
          }
        }
      }
    }
  };
});

// Import after mocks
import FishingSystem from '../FishingSystem';
import FishingRod from '../../gameobjects/FishingRod';
import FishingLine from '../../gameobjects/FishingLine';
import Phaser from 'phaser';

describe('FishingSystem', () => {
  let scene: Phaser.Scene;
  let waterArea: Phaser.Geom.Rectangle;
  let fishingSystem: FishingSystem;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    scene = new Phaser.Scene('');
    waterArea = new Phaser.Geom.Rectangle();
    fishingSystem = new FishingSystem(scene, waterArea);
  });
  
  test('fishing system should initialize properly', () => {
    // Verify FishingRod and FishingLine were created
    expect(FishingRod).toHaveBeenCalled();
    expect(FishingLine).toHaveBeenCalled();
  });
  
  test('fishing system should update rod position', () => {
    // Get the internal rod instance from the mock
    const rod = (FishingRod as jest.Mock).mock.instances[0];
    
    // Call update
    fishingSystem.update(100, 100, true, 16);
    
    // Verify rod.update was called with correct parameters
    expect(rod.update).toHaveBeenCalledWith(100, 100, true);
  });
  
  test('fishing system should start cast when F key is pressed', () => {
    // Mock JustDown to return true
    (Phaser.Input.Keyboard.JustDown as jest.Mock).mockReturnValueOnce(true);
    
    // Get the instances from the mocks
    const rod = (FishingRod as jest.Mock).mock.instances[0];
    const line = (FishingLine as jest.Mock).mock.instances[0];
    
    // Call update
    fishingSystem.update(100, 100, true, 16);
    
    // Verify cast was started
    expect(rod.playCastAnimation).toHaveBeenCalled();
    expect(line.cast).toHaveBeenCalled();
  });
  
  test('fishing system should detect line in water', () => {
    // Mock line.isInWater to return true
    const line = (FishingLine as jest.Mock).mock.instances[0];
    (line.isInWater as jest.Mock).mockReturnValueOnce(true);
    
    // Make sure the system is in CASTING state (this is a bit of a hack since state is private)
    // Force it into CASTING state by triggering a cast
    (Phaser.Input.Keyboard.JustDown as jest.Mock).mockReturnValueOnce(true);
    fishingSystem.update(100, 100, true, 16);
    
    // Reset mocks for the next check
    jest.clearAllMocks();
    
    // Call update again to check for water collision
    fishingSystem.update(100, 100, true, 16);
    
    // Verify a fishing timer was started
    expect(scene.time.delayedCall).toHaveBeenCalled();
  });
  
  test('fishing system should call catch callback', () => {
    // Set up the catch callback
    const catchCallback = jest.fn();
    fishingSystem.onCatch(catchCallback);
    
    // Simulate the fishing process
    // 1. Trigger cast
    (Phaser.Input.Keyboard.JustDown as jest.Mock).mockReturnValueOnce(true);
    fishingSystem.update(100, 100, true, 16);
    
    // 2. Simulate line in water
    const line = (FishingLine as jest.Mock).mock.instances[0];
    (line.isInWater as jest.Mock).mockReturnValueOnce(true);
    fishingSystem.update(100, 100, true, 16);
    
    // 3. Get the callback from the delayedCall and execute it
    const timerCallback = (scene.time.delayedCall as jest.Mock).mock.calls[0][1];
    timerCallback();
    
    // 4. Get the reset callback and execute it (this is the one that calls the catchCallback)
    const resetCallback = (scene.time.delayedCall as jest.Mock).mock.calls[1][1];
    resetCallback();
    
    // Verify the catch callback was called
    expect(catchCallback).toHaveBeenCalled();
  });
  
  test('fishing system should reset properly', () => {
    // Get the line instance
    const line = (FishingLine as jest.Mock).mock.instances[0];
    
    // Reset the system
    fishingSystem.reset();
    
    // Verify line was reset
    expect(line.reset).toHaveBeenCalled();
  });
}); 