import Phaser from 'phaser';

export default class FishingLine {
  private scene: Phaser.Scene;
  private line: Phaser.GameObjects.Graphics;
  private startPoint: Phaser.Math.Vector2;
  private endPoint: Phaser.Math.Vector2;
  private velocity: Phaser.Math.Vector2;
  private gravity: number = 200;
  private isActive: boolean = false;
  private lineColor: number = 0xFFFFFF;
  private lineWidth: number = 2;
  private maxCastDistance: number = 300; // Maximum possible cast distance
  private hook: Phaser.Physics.Arcade.Sprite; // Physical hook object
  private collisionGroups: Phaser.Physics.Arcade.StaticGroup[] = [];
  private groundDrag: number = 0.9; // High drag when on ground
  private airDrag: number = 0.98; // Lower drag in air

  constructor(scene: Phaser.Scene) {
    try {
      this.scene = scene;
      this.line = scene.add.graphics();
      this.startPoint = new Phaser.Math.Vector2(0, 0);
      this.endPoint = new Phaser.Math.Vector2(0, 0);
      this.velocity = new Phaser.Math.Vector2(0, 0);
      
      // Create a physics-enabled hook
      this.hook = scene.physics.add.sprite(0, 0, 'hook');
      this.hook.setVisible(true); // Make it visible
      this.hook.setActive(false);  // Deactivate initially
      this.hook.body.setSize(8, 8); // Small collision box
      this.hook.setBounce(0.3);    // Give it a slight bounce
      this.hook.setScale(1.5);     // Make it a bit larger for visibility
      
      // Set up physics properties for the hook
      this.hook.setDrag(600, 0); // High horizontal drag
      this.hook.setFriction(1, 0); // High horizontal friction
      
      console.log('FishingLine created successfully');
    } catch (error) {
      console.error('Error creating FishingLine:', error);
      throw error;
    }
  }

  /**
   * Add a collision group for the hook to collide with
   */
  public addCollisionGroup(group: Phaser.Physics.Arcade.StaticGroup): void {
    this.collisionGroups.push(group);
    this.scene.physics.add.collider(this.hook, group, this.onHookCollide, null, this);
  }

  /**
   * Callback when hook collides with something
   */
  private onHookCollide(hook: Phaser.Physics.Arcade.Sprite, object: Phaser.GameObjects.GameObject): void {
    // Apply stronger drag when touching ground
    if (hook.body.touching.down) {
      // Apply very high drag to stop movement quickly
      hook.setVelocityX(hook.body.velocity.x * 0.7); // Reduce x velocity significantly
    }
  }

  /**
   * Cast the fishing line with direct distance control
   * Distance is capped at maxCastDistance
   */
  public castWithDistance(startX: number, startY: number, directionX: number, directionY: number, distance: number): void {
    try {
      console.log(`Cast with distance initiated from (${startX}, ${startY}) with direction (${directionX}, ${directionY}), distance: ${distance}`);
      
      this.startPoint.set(startX, startY);
      this.endPoint.set(startX, startY); // Initialize end point at start

      // Cap the distance at the maximum value
      const castDistance = Math.min(distance, this.maxCastDistance);
      
      // Convert the distance to a velocity that will approximately travel that far
      // This is a simple approximation - adjust multiplier as needed
      const distanceMultiplier = 1.5; // This multiplier helps the hook travel approximately the desired distance
      const velocityMagnitude = castDistance * distanceMultiplier;
      
      // Calculate the cast velocity based on direction and normalized distance
      const velocityX = directionX * velocityMagnitude;
      const velocityY = directionY * velocityMagnitude;
      
      this.velocity.set(velocityX, velocityY);
      
      // Position and activate the hook
      this.hook.setPosition(startX, startY);
      this.hook.setVelocity(velocityX, velocityY);
      this.hook.setActive(true);
      this.hook.body.enable = true;
      this.hook.setVisible(true);
      
      // Rotate hook to face casting direction
      const angle = Math.atan2(directionY, directionX);
      const hookAngle = Phaser.Math.RadToDeg(angle);
      this.hook.setRotation(Phaser.Math.DegToRad(hookAngle + 90)); // +90 to align hook properly
      
      console.log(`Line velocity set to (${velocityX}, ${velocityY}) for target distance ${castDistance}`);

      this.isActive = true;
      
      // Draw initial line
      this.draw();
    } catch (error) {
      console.error('Error casting fishing line with distance:', error);
      this.reset();
    }
  }

  /**
   * Legacy cast method (kept for compatibility)
   */
  public cast(startX: number, startY: number, directionX: number, directionY: number, power: number = 1.3): void {
    try {
      console.log(`Legacy cast method called - redirecting to castWithDistance`);
      
      // Calculate a reasonable distance based on power
      const distance = power * (this.maxCastDistance / 1.6);
      
      // Use the new method instead
      this.castWithDistance(startX, startY, directionX, directionY, distance);
    } catch (error) {
      console.error('Error in legacy cast method:', error);
      this.reset();
    }
  }

  /**
   * Update the start point of the line without affecting the physics
   * This allows the line to remain connected to the rod tip
   */
  public updateStartPoint(x: number, y: number): void {
    try {
      // Update only the start point
      this.startPoint.set(x, y);
      
      // Redraw the line without changing physics
      this.draw();
    } catch (error) {
      console.error('Error updating line start point:', error);
    }
  }

  /**
   * Update the line physics and redraw it
   */
  public update(delta: number): void {
    if (!this.isActive) return;

    try {
      // Get hook position and update end point
      if (this.hook.active) {
        this.endPoint.x = this.hook.x;
        this.endPoint.y = this.hook.y;
        
        // Check if hook is on ground and apply friction
        if (this.hook.body.touching.down) {
          // Apply strong drag when on ground
          this.hook.setDragX(800);
        } else {
          // Less drag in the air
          this.hook.setDragX(50);
        }
      } else {
        // If hook is not active, use traditional physics
        // (This is a fallback and shouldn't normally execute)
        const timeStep = delta / 1000; // Convert to seconds
        
        // Apply gravity to y velocity
        this.velocity.y += this.gravity * timeStep;
        
        // Update end point position based on velocity
        this.endPoint.x += this.velocity.x * timeStep;
        this.endPoint.y += this.velocity.y * timeStep;

        // Apply drag to slow down the line
        this.velocity.x *= 0.98;
        this.velocity.y *= 0.98;
      }

      // Redraw the line
      this.draw();
    } catch (error) {
      console.error('Error updating fishing line:', error);
      this.reset();
    }
  }

  /**
   * Draw the fishing line between start and end points
   */
  private draw(): void {
    try {
      // Clear previous drawing
      this.line.clear();
      
      // Set line style
      this.line.lineStyle(this.lineWidth, this.lineColor);
      
      // Draw a simple straight line from start to end
      this.line.lineBetween(
        this.startPoint.x, 
        this.startPoint.y, 
        this.endPoint.x, 
        this.endPoint.y
      );
      
      console.log('Line drawn successfully');
    } catch (error) {
      console.error('Error drawing fishing line:', error);
    }
  }

  /**
   * Check if the line end point is within a given rectangle (water area)
   */
  public isInWater(waterRect: Phaser.Geom.Rectangle): boolean {
    try {
      if (!waterRect) {
        console.error('No water rectangle provided');
        return false;
      }
      
      const result = waterRect.contains(this.endPoint.x, this.endPoint.y);
      console.log(`Line end (${this.endPoint.x}, ${this.endPoint.y}) in water: ${result}`);
      return result;
    } catch (error) {
      console.error('Error checking if line is in water:', error);
      return false;
    }
  }

  /**
   * Get the position of the end of the line (hook position)
   */
  public getEndPoint(): Phaser.Math.Vector2 {
    return this.endPoint;
  }

  /**
   * Check if the line is currently active
   */
  public getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Get the hook object
   */
  public getHook(): Phaser.Physics.Arcade.Sprite {
    return this.hook;
  }

  /**
   * Deactivate the line and clear its graphics
   */
  public reset(): void {
    try {
      this.isActive = false;
      this.line.clear();
      
      // Deactivate hook physics
      this.hook.setActive(false);
      this.hook.body.enable = false;
      this.hook.setVisible(false);
      
      console.log('Fishing line reset');
    } catch (error) {
      console.error('Error resetting fishing line:', error);
    }
  }
} 