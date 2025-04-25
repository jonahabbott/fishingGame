import Phaser from 'phaser';
import Player from '../gameobjects/Player';
import FishingSystem from '../systems/FishingSystem';
import CaughtItem from '../gameobjects/CaughtItem';
import TerrainSystem from '../systems/TerrainSystem';
import BackgroundSystem from '../systems/BackgroundSystem';

export default class GameplayScene extends Phaser.Scene {
  // Declare class properties for game objects
  private player!: Player;
  private fishingSystem!: FishingSystem;
  private terrainSystem!: TerrainSystem;
  private backgroundSystem!: BackgroundSystem;
  private waterArea!: Phaser.Geom.Rectangle;
  private waterGraphics!: Phaser.GameObjects.Graphics;
  private catchText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;
  private counts: {
    [key: string]: number
  } = {
    common_fish: 0,
    uncommon_fish: 0,
    rare_fish: 0,
    treasure: 0,
    junk: 0
  };
  private countTexts: {
    [key: string]: Phaser.GameObjects.Text
  } = {};

  constructor() {
    super({ key: 'GameplayScene' });
  }

  preload(): void {
    // Create basic rectangle textures for our game entities
    this.createPlaceholderTextures();
  }

  create(): void {
    try {
      console.log('Creating GameplayScene');
      
      // Disable browser context menu on right-click
      this.input.mouse?.disableContextMenu();
      
      // Set gravity
      this.physics.world.gravity.y = 500;

      // Initialize background system first (so it's behind everything)
      this.backgroundSystem = new BackgroundSystem(this);
      
      // Create terrain textures
      this.createTerrainTextures();

      // Initialize terrain system
      this.terrainSystem = new TerrainSystem(this, this.scale.height);
      
      // Create the water area
      this.createWaterArea();
      
      // Verify water area was created
      if (!this.waterArea) {
        console.error('Water area is undefined after createWaterArea');
        // Create a simple fallback water area
        this.waterArea = new Phaser.Geom.Rectangle(0, 0, 100, 100);
      }

      // Create the player
      this.player = new Player(this, 400, 300);

      // Initialize fishing system
      console.log('Initializing fishing system');
      this.fishingSystem = new FishingSystem(this, this.waterArea);
      
      // Add terrain collision to the fishing line
      if (this.fishingSystem.getLine()) {
        this.fishingSystem.getLine().addCollisionGroup(this.terrainSystem.getTerrainGroup());
        console.log('Added terrain collision to fishing line');
      }
      
      // Register catch callback
      this.fishingSystem.onCatch((itemType) => {
        console.log(`Player caught a ${itemType}!`);
        this.handleCaughtItem(itemType);
      });

      // Set up collision between player and terrain
      this.physics.add.collider(this.player.getSprite(), this.terrainSystem.getTerrainGroup());

      // Set up camera to follow player
      this.cameras.main.startFollow(this.player.getSprite(), true, 0.05, 0.05);
      
      // Create UI for catch messages
      this.createCatchUI();
      
      // Create help text
      this.createHelpText();
      
      // Set camera bounds to allow horizontal scrolling
      this.cameras.main.setBounds(-10000, 0, 20000, this.scale.height);
      
      // Force initial terrain generation
      console.log('Generating initial terrain');
      this.terrainSystem.update(this.cameras.main.scrollX + this.scale.width / 2);
      // Additional call to ensure terrain is visible
      this.terrainSystem.update(this.cameras.main.scrollX);
      // Explicitly refresh terrain
      this.terrainSystem.refreshTerrain();
      
      console.log('GameplayScene created successfully!');
    } catch (error) {
      console.error('Error in GameplayScene create:', error);
    }
  }

  update(): void {
    try {
      // Update player
      this.player.update();
      
      // Get player position
      const playerSprite = this.player.getSprite();
      
      // Update fishing system
      this.fishingSystem.update(
        playerSprite.x, 
        playerSprite.y, 
        this.player.isFacingRight(),
        this.game.loop.delta
      );
      
      // Update terrain based on camera position
      const cameraX = this.cameras.main.scrollX + this.scale.width / 2;
      this.terrainSystem.update(cameraX);
      
      // Update background system with camera position
      this.backgroundSystem.update(cameraX);
      
    } catch (error) {
      console.error('Error in GameplayScene update:', error);
    }
  }

  /**
   * Create help text with controls
   */
  private createHelpText(): void {
    try {
      // Create text explaining controls
      this.helpText = this.add.text(
        this.scale.width / 2,
        this.scale.height - 70,
        'Controls: Arrow Keys/WASD to move, Right-Click or F to cast - mouse distance directly controls casting distance, Right-Click or R to reel when bite occurs',
        {
          fontFamily: 'Arial',
          fontSize: '12px',
          color: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'center'
        }
      );
      this.helpText.setOrigin(0.5, 0.5);
      this.helpText.setDepth(100);
      
      console.log('Help text created');
    } catch (error) {
      console.error('Error creating help text:', error);
    }
  }

  /**
   * Create UI elements for showing caught items
   */
  private createCatchUI(): void {
    try {
      // Create text for catch messages (initially empty)
      this.catchText = this.add.text(
        this.scale.width / 2, 
        100, 
        '', 
        { 
          fontFamily: 'Arial', 
          fontSize: '24px', 
          color: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center'
        }
      );
      this.catchText.setOrigin(0.5, 0.5);
      this.catchText.setDepth(100);
      
      // Create catch count display in top-left corner
      this.updateCatchCountText();
      
      console.log('Catch UI created');
    } catch (error) {
      console.error('Error creating catch UI:', error);
    }
  }

  /**
   * Update the catch count display
   */
  private updateCatchCountText(): void {
    try {
      // Remove existing text if it exists
      if (this.countTexts.common_fish) {
        this.countTexts.common_fish.destroy();
      }
      
      // Create text showing current catch counts
      let catchText = 'Catches:\n';
      
      if (this.counts.common_fish > 0) {
        catchText += `Common Fish: ${this.counts.common_fish}\n`;
      }
      
      if (this.counts.uncommon_fish > 0) {
        catchText += `Uncommon Fish: ${this.counts.uncommon_fish}\n`;
      }
      
      if (this.counts.rare_fish > 0) {
        catchText += `Rare Fish: ${this.counts.rare_fish}\n`;
      }
      
      if (this.counts.treasure > 0) {
        catchText += `Treasure: ${this.counts.treasure}\n`;
      }
      
      if (this.counts.junk > 0) {
        catchText += `Junk: ${this.counts.junk}\n`;
      }
      
      this.countTexts.common_fish = this.add.text(
        20, 
        20, 
        catchText, 
        { 
          fontFamily: 'Arial', 
          fontSize: '16px', 
          color: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 3
        }
      );
      this.countTexts.common_fish.setDepth(100);
      
      console.log('Catch count text updated');
    } catch (error) {
      console.error('Error updating catch count text:', error);
    }
  }

  /**
   * Handle caught item
   */
  private handleCaughtItem(itemType: string): void {
    try {
      // Increment counter for this item type
      if (itemType in this.counts) {
        this.counts[itemType]++;
      }
      
      // Update catch count display
      this.updateCatchCountText();
      
      // Get descriptive text based on item type
      const itemText = this.getItemDisplayText(itemType);
      
      // Display catch message
      this.catchText.setText(itemText);
      
      // Animate the message
      this.tweens.killTweensOf(this.catchText);
      this.catchText.setAlpha(1);
      this.catchText.setScale(0.5);
      
      this.tweens.add({
        targets: this.catchText,
        scale: 1,
        duration: 300,
        ease: 'Back.easeOut'
      });
      
      // Fade out after a delay
      this.tweens.add({
        targets: this.catchText,
        alpha: 0,
        delay: 2000,
        duration: 500
      });
      
      // Show the item sprite floating up from the water
      this.showCaughtItemAnimation(itemType);
      
      console.log(`Handled caught item: ${itemType}`);
    } catch (error) {
      console.error('Error handling caught item:', error);
    }
  }

  /**
   * Show an animation of the caught item
   */
  private showCaughtItemAnimation(itemType: string): void {
    try {
      // Get the end point of the fishing line (hook position)
      const hookPos = this.fishingSystem.getLine().getEndPoint();
      
      // Create a floating item animation at the hook position
      new CaughtItem(this, hookPos.x, hookPos.y, itemType);
      
      console.log(`Created ${itemType} animation at (${hookPos.x}, ${hookPos.y})`);
    } catch (error) {
      console.error('Error showing caught item animation:', error);
    }
  }

  /**
   * Get display text for a caught item
   */
  private getItemDisplayText(itemType: string): string {
    switch (itemType) {
      case 'common_fish':
        return 'Caught a Common Fish!';
      case 'uncommon_fish':
        return 'Caught an Uncommon Fish!';
      case 'rare_fish':
        return 'Caught a Rare Fish!\nWhat a catch!';
      case 'treasure':
        return 'Found a Treasure!\nLucky!';
      case 'junk':
        return 'Just some junk...';
      default:
        return 'Caught something!';
    }
  }

  /**
   * Create terrain textures for different terrain types
   */
  private createTerrainTextures(): void {
    try {
      // Dirt terrain - brown with grass on top
      const dirtGraphics = this.add.graphics();
      dirtGraphics.fillStyle(0x8B4513);
      dirtGraphics.fillRect(0, 0, 32, 32);
      dirtGraphics.fillStyle(0x7CFC00); // Grass color
      dirtGraphics.fillRect(0, 0, 32, 5); // Grass layer on top
      dirtGraphics.strokeRect(0, 0, 32, 32);
      dirtGraphics.generateTexture('terrain_dirt', 32, 32);
      
      // Rock terrain - gray
      const rockGraphics = this.add.graphics();
      rockGraphics.fillStyle(0x777777);
      rockGraphics.fillRect(0, 0, 32, 32);
      rockGraphics.lineStyle(1, 0x555555);
      rockGraphics.strokeRect(0, 0, 32, 32);
      // Add some cracks for texture
      rockGraphics.lineStyle(1, 0x666666);
      rockGraphics.lineBetween(8, 8, 16, 16);
      rockGraphics.lineBetween(24, 10, 18, 24);
      rockGraphics.generateTexture('terrain_rock', 32, 32);
      
      // Sand terrain - light tan
      const sandGraphics = this.add.graphics();
      sandGraphics.fillStyle(0xF0E68C);
      sandGraphics.fillRect(0, 0, 32, 32);
      sandGraphics.lineStyle(1, 0xDEB887);
      sandGraphics.strokeRect(0, 0, 32, 32);
      // Add some dot patterns for texture
      sandGraphics.fillStyle(0xE6D79E);
      for (let i = 0; i < 8; i++) {
        const x = 4 + Math.random() * 24;
        const y = 4 + Math.random() * 24;
        sandGraphics.fillCircle(x, y, 1);
      }
      sandGraphics.generateTexture('terrain_sand', 32, 32);
      
      console.log('Terrain textures created');
    } catch (error) {
      console.error('Error creating terrain textures:', error);
    }
  }

  private createPlaceholderTextures(): void {
    try {
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
      
      // Hook - small circle with pointy end
      const hookGraphics = this.add.graphics();
      hookGraphics.fillStyle(0xA9A9A9);
      hookGraphics.fillCircle(4, 4, 3);
      hookGraphics.fillTriangle(4, 1, 7, 4, 4, 7);
      hookGraphics.generateTexture('hook', 8, 8);
      
      // Create item textures
      this.createItemTextures();
      
      console.log('Placeholder textures created');
    } catch (error) {
      console.error('Error creating placeholder textures:', error);
    }
  }
  
  /**
   * Create textures for fish and items
   */
  private createItemTextures(): void {
    try {
      // Common Fish - simple green fish
      const commonFishGraphics = this.add.graphics();
      commonFishGraphics.fillStyle(0x7FFF00);
      commonFishGraphics.fillEllipse(8, 8, 14, 8);
      commonFishGraphics.fillTriangle(15, 8, 20, 3, 20, 13);
      commonFishGraphics.generateTexture('common_fish', 24, 16);
      
      // Uncommon Fish - blue fish
      const uncommonFishGraphics = this.add.graphics();
      uncommonFishGraphics.fillStyle(0x00BFFF);
      uncommonFishGraphics.fillEllipse(8, 8, 14, 8);
      uncommonFishGraphics.fillTriangle(15, 8, 22, 2, 22, 14);
      uncommonFishGraphics.generateTexture('uncommon_fish', 24, 16);
      
      // Rare Fish - goldfish
      const rareFishGraphics = this.add.graphics();
      rareFishGraphics.fillStyle(0xFFD700);
      rareFishGraphics.fillEllipse(8, 8, 14, 10);
      rareFishGraphics.fillTriangle(15, 8, 24, 3, 24, 13);
      rareFishGraphics.generateTexture('rare_fish', 24, 16);
      
      // Treasure - simple chest
      const treasureGraphics = this.add.graphics();
      treasureGraphics.fillStyle(0xCD853F);
      treasureGraphics.fillRect(2, 8, 20, 14);
      treasureGraphics.fillStyle(0xFFD700);
      treasureGraphics.fillEllipse(12, 8, 16, 6);
      treasureGraphics.generateTexture('treasure', 24, 24);
      
      // Junk - old boot
      const junkGraphics = this.add.graphics();
      junkGraphics.fillStyle(0x696969);
      junkGraphics.fillRect(4, 4, 12, 20);
      junkGraphics.fillRect(4, 18, 16, 6);
      junkGraphics.generateTexture('junk', 24, 24);
      
      console.log('Item textures created');
    } catch (error) {
      console.error('Error creating item textures:', error);
    }
  }
  
  private createWaterArea(): void {
    try {
      // Create multiple water areas across the screen
      this.createMainWaterArea();
      this.createAdditionalWaterAreas();
      
      console.log('All water areas created successfully');
    } catch (error) {
      console.error('Error creating water areas:', error);
      // Create a fallback water area if there's an error
      this.waterArea = new Phaser.Geom.Rectangle(
        this.scale.width - 200, 
        this.scale.height - 150, 
        200, 
        100
      );
    }
  }

  /**
   * Create the main water area (large body of water on the right)
   */
  private createMainWaterArea(): void {
    // Create main water area on the right side of the screen
    const groundHeight = 32; // Height of the ground tiles
    const waterWidth = this.scale.width / 2; // Increased from 1/3 to 1/2 for more fishing area
    const waterHeight = 180; // Increased from 150 to 180 for deeper water
    const waterX = this.scale.width - waterWidth;
    const waterY = this.scale.height - groundHeight - waterHeight / 2;
    
    console.log(`Creating main water area at (${waterX}, ${waterY}) with dimensions ${waterWidth}x${waterHeight}`);
    
    // Define the water rectangle for collision detection - ensure proper initialization
    this.waterArea = new Phaser.Geom.Rectangle(waterX, waterY, waterWidth, waterHeight);
    
    // Draw water area for visual representation
    this.waterGraphics = this.add.graphics();
    
    // Add a layered effect to the water
    // Deep water background
    this.waterGraphics.fillStyle(0x0077cc, 0.7); // Deeper blue
    this.waterGraphics.fillRect(waterX, waterY, waterWidth, waterHeight);
    
    // Middle layer of water
    this.waterGraphics.fillStyle(0x0099ff, 0.6); // Standard blue water
    this.waterGraphics.fillRect(waterX, waterY, waterWidth, waterHeight - 30);
    
    // Surface water with slight transparency
    this.waterGraphics.fillStyle(0x66ccff, 0.5); // Lighter blue for surface
    this.waterGraphics.fillRect(waterX, waterY, waterWidth, waterHeight - 60);
    
    // Add a darker bottom border to visually indicate the lake floor
    this.waterGraphics.fillStyle(0x005c99, 0.8); // Dark blue for lake bottom
    this.waterGraphics.fillRect(waterX, waterY + waterHeight - 15, waterWidth, 15);
    
    // Add simple wave animation to make it look like water
    this.tweens.add({
      targets: this.waterGraphics,
      alpha: 0.7,
      yoyo: true,
      repeat: -1,
      duration: 1500,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Create additional smaller water areas throughout the world
   */
  private createAdditionalWaterAreas(): void {
    const groundHeight = 32; // Height of the ground tiles
    const smallWaterGraphics = this.add.graphics();
    smallWaterGraphics.fillStyle(0x0099ff, 0.6); // Semi-transparent blue
    
    // Create several small ponds/lakes at regular intervals
    // We'll create water areas to the left and right of the main area
    const pondCount = 6; // Number of additional ponds to create
    const pondWidth = 120; // Width of each pond
    const pondHeight = 100; // Height of each pond
    const spacing = 400; // Space between ponds
    
    for (let i = 0; i < pondCount; i++) {
      // Alternate between left and right sides of the world
      const direction = i % 2 === 0 ? -1 : 1;
      const distance = (i + 1) * spacing;
      
      // Calculate position
      // For the left side, we go left from the center of the screen
      // For the right side, we go right from the right edge of the screen
      const pondX = direction === -1 
        ? (this.scale.width / 2) - distance 
        : (this.scale.width + distance);
      
      const pondY = this.scale.height - groundHeight - pondHeight / 2;
      
      // Create the pond
      smallWaterGraphics.fillRect(pondX, pondY, pondWidth, pondHeight);
      
      // Add a darker bottom border to visually indicate the pond floor
      smallWaterGraphics.fillStyle(0x007acc, 0.8); // Darker blue for pond bottom
      smallWaterGraphics.fillRect(pondX, pondY + pondHeight - 8, pondWidth, 8);
      
      // Reset fill style for next pond
      smallWaterGraphics.fillStyle(0x0099ff, 0.6);
      
      // Add this area to the main water area as a union
      // This way the fishing system will detect the hook in any water area
      const pondRect = new Phaser.Geom.Rectangle(pondX, pondY, pondWidth, pondHeight);
      
      // For the first additional pond, we need to create a new waterArea that combines the main one
      // For subsequent ponds, we just add to the existing union
      if (i === 0) {
        // Create a copy of the main water area
        const mainAreaCopy = new Phaser.Geom.Rectangle(
          this.waterArea.x,
          this.waterArea.y,
          this.waterArea.width,
          this.waterArea.height
        );
        
        // Create a union rect that includes both the main area and this pond
        // We can't directly union the rectangles in Phaser, so we create a larger containing rectangle
        const unionRect = Phaser.Geom.Rectangle.Union(mainAreaCopy, pondRect);
        
        // Replace the main water area with this union
        this.waterArea = unionRect;
      } else {
        // For subsequent ponds, just expand the existing union rectangle to contain this new pond
        Phaser.Geom.Rectangle.Union(this.waterArea, pondRect, this.waterArea);
      }
      
      console.log(`Created additional water pond at (${pondX}, ${pondY})`);
    }
    
    // Add wave animation to the additional ponds
    this.tweens.add({
      targets: smallWaterGraphics,
      alpha: 0.7,
      yoyo: true,
      repeat: -1,
      duration: 1500,
      ease: 'Sine.easeInOut'
    });
  }
} 