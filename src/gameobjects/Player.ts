import Phaser from 'phaser';

export default class Player {
  private scene: Phaser.Scene;
  private sprite: Phaser.Physics.Arcade.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    
    // Create the player sprite
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setBounce(0.1);
    this.sprite.setCollideWorldBounds(true);
    
    // Set up input
    this.cursors = scene.input.keyboard.createCursorKeys();
  }
  
  /**
   * Get the underlying Phaser sprite for the player
   */
  public getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }
  
  /**
   * Update player movement and actions
   */
  public update(): void {
    // Handle movement
    if (this.cursors.left.isDown) {
      this.sprite.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
      this.sprite.setVelocityX(160);
    } else {
      // Apply damping when no left/right keys are pressed
      this.sprite.setVelocityX(this.sprite.body.velocity.x * 0.9);
    }
    
    // Handle jumping - only if touching the ground
    if (this.cursors.up.isDown && this.sprite.body.touching.down) {
      this.sprite.setVelocityY(-350);
    }
  }
} 