import Phaser from 'phaser';

export default class FishingRod {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Sprite;
  private offset: Phaser.Math.Vector2;
  private facingRight: boolean = true;
  private reelAnimation: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    try {
      this.sprite = scene.add.sprite(x, y, 'fishing_rod');
      this.offset = new Phaser.Math.Vector2(20, -5); // Offset from player position
      console.log('FishingRod created successfully');
    } catch (error) {
      console.error('Error creating FishingRod:', error);
      throw error;
    }
  }

  /**
   * Updates the rod position relative to the player
   */
  public update(playerX: number, playerY: number, isFacingRight: boolean): void {
    try {
      this.facingRight = isFacingRight;
      
      // Position the rod based on player position and facing direction
      const xOffset = isFacingRight ? this.offset.x : -this.offset.x;
      this.sprite.x = playerX + xOffset;
      this.sprite.y = playerY + this.offset.y;
      
      // Flip the rod sprite based on player direction
      this.sprite.setFlipX(!isFacingRight);
    } catch (error) {
      console.error('Error updating FishingRod:', error);
    }
  }

  /**
   * Play the casting animation
   */
  public playCastAnimation(): void {
    try {
      // Simple rotation animation to simulate casting
      this.scene.tweens.add({
        targets: this.sprite,
        angle: this.facingRight ? 45 : -45,
        duration: 300,
        yoyo: true, // Return to original position
        ease: 'Power1'
      });
      console.log('Rod cast animation started');
    } catch (error) {
      console.error('Error in rod cast animation:', error);
    }
  }

  /**
   * Play the reeling animation
   */
  public playReelAnimation(): void {
    try {
      // Stop any existing animation
      if (this.reelAnimation) {
        this.reelAnimation.stop();
      }
      
      // Rapid small back-and-forth motion to simulate reeling
      this.reelAnimation = this.scene.tweens.add({
        targets: this.sprite,
        angle: {
          from: this.facingRight ? -5 : 5,
          to: this.facingRight ? 5 : -5
        },
        duration: 100,
        yoyo: true,
        repeat: 10, // Repeat the animation several times for reeling effect
        ease: 'Linear'
      });
      
      console.log('Rod reeling animation started');
    } catch (error) {
      console.error('Error in rod reeling animation:', error);
    }
  }

  /**
   * Reset any rod animations
   */
  public resetAnimation(): void {
    try {
      // Stop any active animations
      this.scene.tweens.killTweensOf(this.sprite);
      
      // Reset the rod angle
      this.sprite.angle = 0;
      
      console.log('Rod animation reset');
    } catch (error) {
      console.error('Error resetting rod animation:', error);
    }
  }

  /**
   * Get the position of the tip of the rod (where the line connects)
   */
  public getTipPosition(): Phaser.Math.Vector2 {
    try {
      // Calculate the position of the rod tip based on rod position and rotation
      const angle = this.sprite.angle * (Math.PI / 180);
      const tipOffset = this.facingRight ? 
        new Phaser.Math.Vector2(16, -16) : 
        new Phaser.Math.Vector2(-16, -16);
      
      const tipX = this.sprite.x + tipOffset.x * Math.cos(angle) - tipOffset.y * Math.sin(angle);
      const tipY = this.sprite.y + tipOffset.x * Math.sin(angle) + tipOffset.y * Math.cos(angle);
      
      console.log('Rod tip calculated at:', tipX, tipY, 'angle:', this.sprite.angle, 'facingRight:', this.facingRight);
      
      return new Phaser.Math.Vector2(tipX, tipY);
    } catch (error) {
      console.error('Error calculating rod tip position:', error);
      // Return a fallback position to prevent freeze
      return new Phaser.Math.Vector2(this.sprite.x, this.sprite.y);
    }
  }

  /**
   * Get the rod sprite object
   */
  public getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }
} 