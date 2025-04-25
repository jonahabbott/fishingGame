import Phaser from 'phaser';

/**
 * Class for visually representing caught items
 */
export default class CaughtItem {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Sprite;
  private itemType: string;
  private floatTween: Phaser.Tweens.Tween | null = null;
  
  constructor(scene: Phaser.Scene, x: number, y: number, itemType: string) {
    this.scene = scene;
    this.itemType = itemType;
    
    try {
      // Create sprite for the caught item
      this.sprite = scene.add.sprite(x, y, itemType);
      this.sprite.setDepth(50);
      this.sprite.setScale(0.5);
      
      // Start animation
      this.animateItem();
      
      console.log(`Created CaughtItem of type ${itemType} at (${x}, ${y})`);
    } catch (error) {
      console.error('Error creating CaughtItem:', error);
    }
  }
  
  /**
   * Animate the caught item floating up
   */
  private animateItem(): void {
    try {
      // Scale up animation
      this.scene.tweens.add({
        targets: this.sprite,
        scale: 1.5,
        duration: 500,
        ease: 'Back.easeOut'
      });
      
      // Float up animation
      this.floatTween = this.scene.tweens.add({
        targets: this.sprite,
        y: this.sprite.y - 100,
        alpha: 0,
        duration: 2000,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          this.destroy();
        }
      });
      
      // Add a bit of rotation (different for each item type)
      const rotationAmount = (this.itemType === 'junk' || this.itemType === 'treasure') ? 
        Phaser.Math.Between(-30, 30) : Phaser.Math.Between(-10, 10);
        
      this.scene.tweens.add({
        targets: this.sprite,
        angle: rotationAmount,
        duration: 1000,
        ease: 'Sine.easeInOut'
      });
    } catch (error) {
      console.error('Error animating caught item:', error);
    }
  }
  
  /**
   * Clean up the caught item
   */
  public destroy(): void {
    try {
      // Remove tweens
      if (this.floatTween) {
        this.floatTween.stop();
      }
      
      this.scene.tweens.killTweensOf(this.sprite);
      
      // Remove sprite
      this.sprite.destroy();
      
      console.log(`Destroyed CaughtItem of type ${this.itemType}`);
    } catch (error) {
      console.error('Error destroying CaughtItem:', error);
    }
  }
} 