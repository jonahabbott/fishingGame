import Phaser from 'phaser';
import Player from '../gameobjects/Player';

export default class GameplayScene extends Phaser.Scene {
  // Declare class properties for game objects
  private player!: Player;
  private ground!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super('GameplayScene');
  }

  preload(): void {
    // Create basic rectangle textures for our game entities
    this.createPlaceholderTextures();
  }

  create(): void {
    // Set gravity
    this.physics.world.gravity.y = 500;

    // Create the ground
    this.ground = this.physics.add.staticGroup();
    
    // Add ground tiles across the bottom of the screen
    const groundWidth = 32; // Width of our ground sprite
    const screenWidth = this.scale.width;
    const numTiles = Math.ceil(screenWidth / groundWidth);
    
    for (let i = 0; i < numTiles; i++) {
      this.ground.create(i * groundWidth + groundWidth / 2, this.scale.height - groundWidth / 2, 'ground');
    }

    // Create the player
    this.player = new Player(this, 400, 300);

    // Set up collision between player and ground
    this.physics.add.collider(this.player.getSprite(), this.ground);

    // Set up camera to follow player
    this.cameras.main.startFollow(this.player.getSprite(), true, 0.05, 0.05);
    
    console.log('GameplayScene created successfully!');
  }

  update(): void {
    // Update player
    this.player.update();
  }

  private createPlaceholderTextures(): void {
    // Player - blue square
    this.add.graphics()
      .fillStyle(0x3498db)
      .fillRect(0, 0, 32, 32)
      .strokeRect(0, 0, 32, 32)
      .generateTexture('player', 32, 32);
    
    // Ground - brown rectangle  
    this.add.graphics()
      .fillStyle(0x8B4513)
      .fillRect(0, 0, 32, 32)
      .strokeRect(0, 0, 32, 32)
      .generateTexture('ground', 32, 32);
    
    // Fishing rod - simple line
    const rodGraphics = this.add.graphics();
    rodGraphics.lineStyle(2, 0x8B4513);
    rodGraphics.lineBetween(8, 24, 24, 8);
    // Hook
    rodGraphics.lineStyle(2, 0xA9A9A9);
    rodGraphics.lineBetween(24, 8, 28, 6);
    rodGraphics.lineBetween(28, 6, 26, 10);
    rodGraphics.generateTexture('fishing_rod', 32, 32);
  }
} 