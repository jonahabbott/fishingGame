import Phaser from 'phaser';
import FishingRod from '../gameobjects/FishingRod';
import FishingLine from '../gameobjects/FishingLine';

// Define fishing states
enum FishingState {
  IDLE,
  CASTING,
  FISHING,
  WAITING_FOR_BITE,
  BITE,
  REELING,
  CAUGHT
}

export default class FishingSystem {
  private scene: Phaser.Scene;
  private rod: FishingRod;
  private line: FishingLine;
  private state: FishingState = FishingState.IDLE;
  private waterArea: Phaser.Geom.Rectangle;
  private fishingTimer: Phaser.Time.TimerEvent | null = null;
  private castKey: Phaser.Input.Keyboard.Key;
  private reelKey: Phaser.Input.Keyboard.Key;
  private rightClickPressed: boolean = false;
  private catchCallback: ((itemType: string) => void) | null = null;
  private lineStartPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private lineEndPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private biteIndicator: Phaser.GameObjects.Sprite | null = null;
  private biteSound: Phaser.Sound.BaseSound | null = null;
  private reelSound: Phaser.Sound.BaseSound | null = null;
  private splashSound: Phaser.Sound.BaseSound | null = null;
  private catchWindow: Phaser.Time.TimerEvent | null = null;
  private catchWindowDuration: number = 2000; // Time player has to reel in fish (ms)
  private fishEscaped: boolean = false;
  private mousePosition: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private maxCastDistance: number = 300; // Maximum cast distance
  private hookSettleTimer: Phaser.Time.TimerEvent | null = null; // Timer to check if hook has settled
  private lastHookPosition: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0); // Track the hook's last position
  private hookMovementThreshold: number = 15; // Increased threshold for how much the hook needs to move to be considered still moving
  private autoRetractEnabled: boolean = true; // Whether auto-retraction is enabled

  constructor(scene: Phaser.Scene, waterArea: Phaser.Geom.Rectangle) {
    this.scene = scene;
    this.waterArea = waterArea;
    
    try {
      // Create fishing rod at default position
      this.rod = new FishingRod(scene, 0, 0);
      
      // Create fishing line
      this.line = new FishingLine(scene);
      
      // Setup input for fishing action
      // Keep F key for backup/testing
      this.castKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
      
      // Add R key for reeling
      this.reelKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      
      // Setup right-click input
      scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          this.rightClickPressed = true;
        }
      });
      
      scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        this.rightClickPressed = false;
      });
      
      // Track mouse position
      scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        // Convert screen coordinates to world coordinates
        const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.mousePosition.x = worldPoint.x;
        this.mousePosition.y = worldPoint.y;
      });
      
      // Create bite indicator sprite (initially hidden)
      this.createBiteIndicator();
      
      // Create simple sounds
      this.createSounds();
      
      console.log('FishingSystem initialized successfully with right-click controls');
    } catch (error) {
      console.error('Error initializing FishingSystem:', error);
    }
  }

  /**
   * Create the bite indicator sprite
   */
  private createBiteIndicator(): void {
    try {
      // Create a simple exclamation mark sprite for the bite indicator
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xFFFF00); // Yellow color
      
      // Draw exclamation mark
      graphics.fillRect(8, 0, 8, 24); // Vertical line
      graphics.fillRect(8, 28, 8, 8); // Bottom dot
      
      // Generate texture
      graphics.generateTexture('bite_indicator', 24, 40);
      graphics.destroy();
      
      // Create the sprite (initially hidden)
      this.biteIndicator = this.scene.add.sprite(0, 0, 'bite_indicator');
      this.biteIndicator.setVisible(false);
      this.biteIndicator.setDepth(100); // Make sure it's on top
      
      console.log('Bite indicator created');
    } catch (error) {
      console.error('Error creating bite indicator:', error);
    }
  }

  /**
   * Create sound effects
   */
  private createSounds(): void {
    try {
      // Create simple sounds using Web Audio API
      const audioContext = this.scene.sound.context;
      
      // Create splash sound
      const splashBuffer = this.createSplashSound(audioContext);
      this.splashSound = this.scene.sound.add('splash');
      
      // Create bite sound
      const biteBuffer = this.createBiteSound(audioContext);
      this.biteSound = this.scene.sound.add('bite');
      
      // Create reel sound  
      const reelBuffer = this.createReelSound(audioContext);
      this.reelSound = this.scene.sound.add('reel');
      
      console.log('Fishing sounds created');
    } catch (error) {
      console.error('Error creating sounds:', error);
    }
  }

  /**
   * Create splash sound buffer
   */
  private createSplashSound(context: AudioContext): AudioBuffer {
    try {
      // Create buffer for a simple splash sound
      const sampleRate = context.sampleRate;
      const buffer = context.createBuffer(1, sampleRate * 0.5, sampleRate);
      const channel = buffer.getChannelData(0);
      
      // Generate white noise with a quick fade out
      for (let i = 0; i < channel.length; i++) {
        channel[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / (sampleRate * 0.2));
      }
      
      // Register with Phaser's sound manager
      this.scene.cache.audio.add('splash', buffer);
      
      return buffer;
    } catch (error) {
      console.error('Error creating splash sound:', error);
      return context.createBuffer(1, 1, context.sampleRate);
    }
  }

  /**
   * Create bite sound buffer
   */
  private createBiteSound(context: AudioContext): AudioBuffer {
    try {
      // Create buffer for a simple "bite" sound
      const sampleRate = context.sampleRate;
      const buffer = context.createBuffer(1, sampleRate * 0.3, sampleRate);
      const channel = buffer.getChannelData(0);
      
      // Generate a quick "pop" sound
      const frequency = 150;
      for (let i = 0; i < channel.length; i++) {
        const t = i / sampleRate;
        channel[i] = Math.sin(frequency * 2 * Math.PI * t) * Math.max(0, 1 - i / (sampleRate * 0.1));
      }
      
      // Register with Phaser's sound manager
      this.scene.cache.audio.add('bite', buffer);
      
      return buffer;
    } catch (error) {
      console.error('Error creating bite sound:', error);
      return context.createBuffer(1, 1, context.sampleRate);
    }
  }

  /**
   * Create reel sound buffer
   */
  private createReelSound(context: AudioContext): AudioBuffer {
    try {
      // Create buffer for a simple "reel" sound
      const sampleRate = context.sampleRate;
      const buffer = context.createBuffer(1, sampleRate * 0.5, sampleRate);
      const channel = buffer.getChannelData(0);
      
      // Generate a series of clicks
      const clickInterval = sampleRate * 0.05; // Click every 50ms
      
      for (let i = 0; i < channel.length; i++) {
        // Create a click sound every interval
        if (i % Math.floor(clickInterval) < 20) {
          channel[i] = Math.random() * 0.5;
        } else {
          channel[i] = 0;
        }
      }
      
      // Register with Phaser's sound manager
      this.scene.cache.audio.add('reel', buffer);
      
      return buffer;
    } catch (error) {
      console.error('Error creating reel sound:', error);
      return context.createBuffer(1, 1, context.sampleRate);
    }
  }

  /**
   * Update fishing system state
   */
  public update(playerX: number, playerY: number, isFacingRight: boolean, delta: number): void {
    try {
      // Update rod position relative to player
      this.rod.update(playerX, playerY, isFacingRight);
      
      // Keep line connected to rod tip when active
      if (this.state !== FishingState.IDLE && this.line.getIsActive()) {
        // Get current rod tip position
        const tipPosition = this.rod.getTipPosition();
        
        // Update line start point to match rod tip (only if actively fishing)
        if (this.state === FishingState.CASTING || 
            this.state === FishingState.FISHING || 
            this.state === FishingState.WAITING_FOR_BITE ||
            this.state === FishingState.BITE ||
            this.state === FishingState.REELING) {
          
          // Store current end position
          const currentEnd = this.line.getEndPoint();
          
          // Re-cast the line but maintain the end point's position and physics
          this.line.updateStartPoint(tipPosition.x, tipPosition.y);
        }
      }
      
      // Update line physics
      this.line.update(delta);
      
      // Check for cast input when in IDLE state
      if (this.state === FishingState.IDLE && 
          (Phaser.Input.Keyboard.JustDown(this.castKey) || this.rightClickPressed)) {
        console.log('Cast input detected, attempting to cast');
        this.startCast(isFacingRight);
        this.rightClickPressed = false; // Reset so we don't cast every frame
      }
      
      // Check for reel input when in BITE state
      if (this.state === FishingState.BITE && 
          (Phaser.Input.Keyboard.JustDown(this.reelKey) || this.rightClickPressed)) {
        console.log('Reel input detected, attempting to reel');
        this.startReeling();
        this.rightClickPressed = false; // Reset so we don't reel every frame
      }
      
      // Check if line is in water after casting
      if (this.state === FishingState.CASTING && this.line.getIsActive()) {
        try {
          const inWater = this.line.isInWater(this.waterArea);
          if (inWater) {
            this.splashSound?.play();
            this.startFishing();
          } else {
            // If not in water, check if hook has settled
            this.checkHookSettled();
          }
        } catch (error) {
          console.error('Error in water detection:', error);
          // Reset to prevent getting stuck
          this.reset();
        }
      }
      
      // Update bite indicator position if active
      if (this.state === FishingState.BITE && this.biteIndicator) {
        const hookPos = this.line.getEndPoint();
        this.biteIndicator.setPosition(hookPos.x, hookPos.y - 40);
      }
    } catch (error) {
      console.error('Error in FishingSystem update:', error);
      // Reset the system to prevent getting stuck
      this.reset();
    }
  }

  /**
   * Calculate the direction to cast based on mouse position
   */
  private calculateCastDirection(tipPosition: Phaser.Math.Vector2, isFacingRight: boolean): Phaser.Math.Vector2 {
    try {
      // Direction from rod tip to mouse cursor (already in world coordinates)
      const direction = new Phaser.Math.Vector2(
        this.mousePosition.x - tipPosition.x,
        this.mousePosition.y - tipPosition.y
      );
      
      // Calculate distance for power scaling
      const distance = direction.length();
      
      // Normalize the direction vector
      if (distance > 0) {
        direction.x = direction.x / distance;
        direction.y = direction.y / distance;
      } else {
        // Fallback if vectors are the same point
        direction.x = isFacingRight ? 1 : -1;
        direction.y = 0.2;
      }
      
      // Ensure there's at least some upward component to make nice arcs
      if (direction.y > 0.7) { // If pointing too much downward
        direction.y = 0.7;  // Cap the downward component
        
        // Re-normalize to ensure vector length stays 1
        const newLength = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        direction.x = direction.x / newLength;
        direction.y = direction.y / newLength;
      }
      
      // Debug visualization of cast direction with distance indication
      this.visualizeCastDirection(tipPosition, direction, distance);
      
      return direction;
    } catch (error) {
      console.error('Error calculating cast direction:', error);
      // Return fallback direction
      return new Phaser.Math.Vector2(isFacingRight ? 1 : -1, 0.2);
    }
  }

  /**
   * Visualize the cast direction with a temporary line
   */
  private visualizeCastDirection(tipPosition: Phaser.Math.Vector2, direction: Phaser.Math.Vector2, distance: number): void {
    try {
      // Create a temporary line showing cast direction
      const aimLine = this.scene.add.graphics();
      
      // Line color changes with distance - green for short, yellow for medium, red for long
      let lineColor = 0x00FF00; // Green for short distance
      if (distance > 200) {
        lineColor = 0xFF0000; // Red for long distance
      } else if (distance > 100) {
        lineColor = 0xFFFF00; // Yellow for medium distance
      }
      
      // Draw aim line
      aimLine.lineStyle(1, lineColor, 0.5);
      
      // Line length is proportional to distance with a max
      const lineLength = Math.min(distance, 150);
      
      aimLine.lineBetween(
        tipPosition.x, 
        tipPosition.y, 
        tipPosition.x + direction.x * lineLength, 
        tipPosition.y + direction.y * lineLength
      );
      
      // Fade out and destroy after a short time
      this.scene.tweens.add({
        targets: aimLine,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          aimLine.destroy();
        }
      });
    } catch (error) {
      console.error('Error visualizing cast direction:', error);
    }
  }

  /**
   * Start the casting action
   */
  private startCast(isFacingRight: boolean): void {
    try {
      this.state = FishingState.CASTING;
      
      // Get rod tip position for line start
      console.log('Getting rod tip position');
      const tipPosition = this.rod.getTipPosition();
      console.log('Rod tip position:', tipPosition);
      console.log('Mouse world position:', this.mousePosition.x, this.mousePosition.y);
      
      // Calculate cast direction based on mouse position
      const direction = this.calculateCastDirection(tipPosition, isFacingRight);
      console.log('Cast direction:', direction.x, direction.y);
      
      // Calculate distance from rod tip to mouse cursor
      const castDistance = Phaser.Math.Distance.Between(
        tipPosition.x, 
        tipPosition.y, 
        this.mousePosition.x, 
        this.mousePosition.y
      );
      
      console.log(`Mouse distance: ${castDistance}`);
      
      // Play rod animation
      this.rod.playCastAnimation();
      
      // Initialize the last hook position
      this.lastHookPosition.set(tipPosition.x, tipPosition.y);
      
      // Cancel any existing hook settle timer
      if (this.hookSettleTimer) {
        this.hookSettleTimer.remove();
        this.hookSettleTimer = null;
        console.log('Cleared previous hook settle timer during new cast');
      }
      
      // Small delay to sync with the rod animation
      this.scene.time.delayedCall(100, () => {
        // Cast the line with updated tip position after animation started
        const updatedTipPosition = this.rod.getTipPosition();
        console.log('Casting line from', updatedTipPosition.x, updatedTipPosition.y, 'toward mouse with distance', castDistance);
        
        // Use direct distance casting
        this.line.castWithDistance(
          updatedTipPosition.x, 
          updatedTipPosition.y, 
          direction.x, 
          direction.y, 
          castDistance
        );
      });
    } catch (error) {
      console.error('Error starting cast:', error);
      this.state = FishingState.IDLE; // Reset state on error
    }
  }

  /**
   * Start fishing (line is in water)
   */
  private startFishing(): void {
    if (this.state !== FishingState.CASTING) return;
    
    try {
      this.state = FishingState.WAITING_FOR_BITE;
      console.log("Line is in water, waiting for bite...");
      
      // Start a timer for the bite (random duration between 1 and 4 seconds)
      const biteDelay = Phaser.Math.Between(1000, 4000);
      this.fishingTimer = this.scene.time.delayedCall(biteDelay, () => {
        this.triggerBite();
      });
    } catch (error) {
      console.error('Error starting fishing:', error);
      this.reset();
    }
  }

  /**
   * Trigger a fish bite
   */
  private triggerBite(): void {
    if (this.state !== FishingState.WAITING_FOR_BITE) return;
    
    try {
      this.state = FishingState.BITE;
      console.log("Fish bite!");
      
      // Play bite sound
      this.biteSound?.play();
      
      // Show bite indicator
      if (this.biteIndicator) {
        const hookPos = this.line.getEndPoint();
        this.biteIndicator.setPosition(hookPos.x, hookPos.y - 40);
        this.biteIndicator.setVisible(true);
        
        // Add bobbing animation to the indicator
        this.scene.tweens.add({
          targets: this.biteIndicator,
          y: hookPos.y - 50,
          duration: 300,
          yoyo: true,
          repeat: -1
        });
        
        // Make it pulse
        this.scene.tweens.add({
          targets: this.biteIndicator,
          alpha: 0.5,
          duration: 200,
          yoyo: true,
          repeat: -1
        });
      }
      
      // Start timer for catch window
      this.catchWindow = this.scene.time.delayedCall(this.catchWindowDuration, () => {
        // If we're still in BITE state, fish escaped
        if (this.state === FishingState.BITE) {
          console.log("Fish escaped!");
          this.fishEscaped = true;
          this.reset();
        }
      });
      
      // Add visual effect to the water
      this.addWaterRippleEffect();
    } catch (error) {
      console.error('Error triggering bite:', error);
      this.reset();
    }
  }

  /**
   * Add a ripple effect to the water around the hook
   */
  private addWaterRippleEffect(): void {
    try {
      const hookPos = this.line.getEndPoint();
      
      // Create ripple circles
      const ripple = this.scene.add.graphics();
      ripple.lineStyle(2, 0xFFFFFF, 0.8);
      ripple.strokeCircle(hookPos.x, hookPos.y, 10);
      
      // Animate the ripple
      this.scene.tweens.add({
        targets: ripple,
        alpha: 0,
        scaleX: 3,
        scaleY: 3,
        duration: 1000,
        onComplete: () => {
          ripple.destroy();
        }
      });
    } catch (error) {
      console.error('Error creating water ripple effect:', error);
    }
  }

  /**
   * Start reeling in the fish
   */
  private startReeling(): void {
    if (this.state !== FishingState.BITE) return;
    
    try {
      this.state = FishingState.REELING;
      console.log("Reeling in the fish!");
      
      // Hide bite indicator
      if (this.biteIndicator) {
        this.scene.tweens.killTweensOf(this.biteIndicator);
        this.biteIndicator.setVisible(false);
      }
      
      // Remove catch window timer
      if (this.catchWindow) {
        this.catchWindow.remove();
        this.catchWindow = null;
      }
      
      // Play reel sound
      this.reelSound?.play();
      
      // Rod reeling animation
      this.rod.playReelAnimation();
      
      // Start a short timer to represent the reeling time
      this.fishingTimer = this.scene.time.delayedCall(1500, () => {
        this.catchFish();
      });
    } catch (error) {
      console.error('Error reeling in fish:', error);
      this.reset();
    }
  }

  /**
   * Catch a fish
   */
  private catchFish(): void {
    if (this.state !== FishingState.REELING) return;
    
    try {
      this.state = FishingState.CAUGHT;
      console.log("Caught something!");
      
      // Determine what was caught based on location, depth, time, etc.
      const caughtItem = this.determineCaughtItem();
      
      // Reset after a delay
      this.scene.time.delayedCall(1000, () => {
        this.reset();
        
        // Call the catch callback if set
        if (this.catchCallback) {
          this.catchCallback(caughtItem);
        }
      });
    } catch (error) {
      console.error('Error in catchFish:', error);
      this.reset();
    }
  }

  /**
   * Determine what item was caught
   */
  private determineCaughtItem(): string {
    try {
      // Simple random distribution of items
      const rand = Math.random();
      
      if (rand < 0.1) {
        return "treasure"; // 10% chance for treasure
      } else if (rand < 0.3) {
        return "junk"; // 20% chance for junk
      } else {
        // 70% chance for fish, with different types
        const fishRand = Math.random();
        if (fishRand < 0.6) {
          return "common_fish";
        } else if (fishRand < 0.9) {
          return "uncommon_fish";
        } else {
          return "rare_fish";
        }
      }
    } catch (error) {
      console.error('Error determining caught item:', error);
      return "common_fish"; // Fallback to common fish
    }
  }

  /**
   * Reset fishing state
   */
  public reset(): void {
    try {
      console.log('Resetting fishing system');
      this.state = FishingState.IDLE;
      this.line.reset();
      this.rightClickPressed = false; // Reset the right-click state
      
      // Hide bite indicator
      if (this.biteIndicator) {
        this.scene.tweens.killTweensOf(this.biteIndicator);
        this.biteIndicator.setVisible(false);
      }
      
      // Clear timers
      if (this.fishingTimer) {
        this.fishingTimer.remove();
        this.fishingTimer = null;
      }
      
      if (this.catchWindow) {
        this.catchWindow.remove();
        this.catchWindow = null;
      }
      
      // Reset the rod visually
      this.rod.resetAnimation();
    } catch (error) {
      console.error('Error resetting fishing system:', error);
    }
  }

  /**
   * Register a callback for when something is caught
   */
  public onCatch(callback: (itemType: string) => void): void {
    this.catchCallback = callback;
  }

  /**
   * Get the current fishing state
   */
  public getState(): FishingState {
    return this.state;
  }

  /**
   * Get the fishing line instance
   */
  public getLine(): FishingLine {
    return this.line;
  }

  /**
   * Check if the hook has settled (stopped moving)
   */
  private checkHookSettled(): void {
    // Get current hook position
    const currentHookPos = this.line.getEndPoint();
    
    // Get the hook physics body to check if it's touching terrain
    const hook = this.line.getHook();
    
    // Calculate movement since last check to determine if hook is still moving significantly
    const movementDistance = Phaser.Math.Distance.Between(
      this.lastHookPosition.x,
      this.lastHookPosition.y,
      currentHookPos.x,
      currentHookPos.y
    );

    // Debug logging for hook status
    if (this.state === FishingState.CASTING) {
      console.log(`Hook status - touching down: ${hook?.body?.touching?.down}, velocity Y: ${hook?.body?.velocity?.y}, movement: ${movementDistance}`);
    }
    
    // Only consider the hook settled if it's actually touching terrain (not water) AND has minimal movement
    if (hook && hook.body && hook.body.touching.down && movementDistance < this.hookMovementThreshold) {
      // Hook is touching terrain - start auto-retract timer if not already started
      if (!this.hookSettleTimer) {
        console.log('Hook touched terrain and stopped moving, starting auto-retract timer');
        
        // Check if hook is in water (shouldn't be, but just in case)
        const inWater = this.line.isInWater(this.waterArea);
        if (inWater) {
          // If it's in water, don't auto-retract
          console.log("Hook is in water, won't auto-retract");
          return;
        }
        
        // Start a timer to give the player a moment before auto-retracting
        this.hookSettleTimer = this.scene.time.delayedCall(1000, () => {
          // After timer expires, check again if hook is in water
          const nowInWater = this.line.isInWater(this.waterArea);
          
          // Double check the hook is still touching ground
          if (!hook.body.touching.down) {
            console.log("Hook is no longer touching ground, canceling auto-retract");
            this.hookSettleTimer = null;
            return;
          }
          
          // If hook is not in water, auto-retract the line
          if (!nowInWater && this.autoRetractEnabled) {
            console.log('Hook touched non-water terrain. Auto-retracting line.');
            this.reset(); // Reset fishing to allow casting again
          }
          
          this.hookSettleTimer = null;
        });
      }
    } else {
      // If the hook was previously scheduled for retraction but is now moving or in air, cancel it
      if (this.hookSettleTimer && (!hook.body.touching.down || movementDistance >= this.hookMovementThreshold)) {
        console.log("Hook is moving again or in air, canceling auto-retract timer");
        this.hookSettleTimer.remove();
        this.hookSettleTimer = null;
      }
    }
    
    // Update the last hook position
    this.lastHookPosition.x = currentHookPos.x;
    this.lastHookPosition.y = currentHookPos.y;
  }
} 