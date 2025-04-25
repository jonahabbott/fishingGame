import Phaser from 'phaser';

export default class Player {
  private scene: Phaser.Scene;
  private sprite: Phaser.Physics.Arcade.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys: { 
    W: Phaser.Input.Keyboard.Key, 
    A: Phaser.Input.Keyboard.Key, 
    S: Phaser.Input.Keyboard.Key, 
    D: Phaser.Input.Keyboard.Key 
  };
  private facingRight: boolean = true;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    
    // Create the player sprite
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setBounce(0.1);
    // Remove world bounds to allow exploration of procedural terrain
    // this.sprite.setCollideWorldBounds(true);
    
    // Set up arrow key input
    this.cursors = scene.input.keyboard.createCursorKeys();
    
    // Set up WASD key input
    this.wasdKeys = {
      W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  }
  
  /**
   * Get the underlying Phaser sprite for the player
   */
  public getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }
  
  /**
   * Check if player is facing right
   */
  public isFacingRight(): boolean {
    return this.facingRight;
  }
  
  /**
   * Update player movement and actions
   */
  public update(): void {
    // Handle movement - check both arrow keys and WASD
    const moveLeft = this.cursors.left.isDown || this.wasdKeys.A.isDown;
    const moveRight = this.cursors.right.isDown || this.wasdKeys.D.isDown;
    const jump = this.cursors.up.isDown || this.wasdKeys.W.isDown;
    
    if (moveLeft) {
      this.sprite.setVelocityX(-160);
      this.facingRight = false;
    } else if (moveRight) {
      this.sprite.setVelocityX(160);
      this.facingRight = true;
    } else {
      // Apply damping when no left/right keys are pressed
      this.sprite.setVelocityX(this.sprite.body.velocity.x * 0.9);
    }
    
    // Handle jumping - only if touching the ground
    if (jump && this.sprite.body.touching.down) {
      this.sprite.setVelocityY(-350);
    }
  }
} 