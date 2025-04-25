import Phaser from 'phaser';
import Player from '../gameobjects/Player';
import FishingSystem from '../systems/FishingSystem';
import CaughtItem from '../gameobjects/CaughtItem';
import TerrainSystem from '../systems/TerrainSystem';
import WaterZoneSystem, { WaterZoneType } from '../systems/WaterZoneSystem';

export default class GameplayScene extends Phaser.Scene {
  // Declare class properties for game objects
  private player!: Player;
  // ground is no longer used since we have TerrainSystem
  private terrainSystem!: TerrainSystem;
  private waterZoneSystem!: WaterZoneSystem;
  private fishingSystem!: FishingSystem;
  private waterArea!: Phaser.Geom.Rectangle; // Keep for backward compatibility during transition
  private waterGraphics!: Phaser.GameObjects.Graphics;
  private catchMessage!: Phaser.GameObjects.Text;
  private catchCount: { [key: string]: number } = {
    common_fish: 0,
    uncommon_fish: 0,
    rare_fish: 0,
    treasure: 0,
    junk: 0
  };
  private catchCountText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;
  private waterTypeText!: Phaser.GameObjects.Text;

  constructor() {
    super('GameplayScene');
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

      // Create terrain textures
      this.createTerrainTextures();

      // Initialize terrain system
      this.terrainSystem = new TerrainSystem(this, this.scale.height);
      
      // Initialize water zone system (using the same seed as terrain for consistency)
      // Pass terrainSystem to allow water to avoid terrain
      this.waterZoneSystem = new WaterZoneSystem(this, this.scale.height, this.terrainSystem);
      
      // Create a temporary fallback water area for backward compatibility
      // This will be removed once all systems are updated to use WaterZoneSystem
      this.createFallbackWaterArea();
      
      // Create the player
      this.player = new Player(this, 400, 300);

      // Initialize fishing system
      console.log('Initializing fishing system');
      this.fishingSystem = new FishingSystem(this, this.waterArea, this.waterZoneSystem);
      
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
      
      // Create water type display
      this.createWaterTypeDisplay();
      
      // Set camera bounds to allow horizontal scrolling
      this.cameras.main.setBounds(-10000, 0, 20000, this.scale.height);
      
      // Force initial terrain generation
      console.log('Generating initial terrain');
      this.terrainSystem.update(this.cameras.main.scrollX + this.scale.width / 2);
      
      // Force initial water zone generation
      console.log('Generating initial water zones');
      this.waterZoneSystem.update(this.cameras.main.scrollX + this.scale.width / 2);
      
      // Additional call to ensure terrain is visible
      this.terrainSystem.update(this.cameras.main.scrollX);
      
      // Explicitly refresh terrain
      this.terrainSystem.refreshTerrain();
      
      console.log('GameplayScene created successfully!');
    } catch (error) {
      console.error('Error in GameplayScene create:', error);
    }
  }

  update(time: number, delta: number): void {
    try {
      // Update player
      this.player.update();
      
      // Update fishing system
      const playerSprite = this.player.getSprite();
      this.fishingSystem.update(
        playerSprite.x, 
        playerSprite.y, 
        this.player.isFacingRight(),
        delta
      );
      
      // Update terrain based on camera position
      // Use the center of the camera view for terrain updates
      const cameraCenterX = this.cameras.main.scrollX + this.scale.width / 2;
      this.terrainSystem.update(cameraCenterX);
      
      // Update water zones based on camera position
      this.waterZoneSystem.update(cameraCenterX);
      
      // Update water type display
      this.updateWaterTypeDisplay();
    } catch (error) {
      console.error('Error in GameplayScene update:', error);
    }
  }

  /**
   * Handle a caught item
   */
  private handleCaughtItem(itemType: string): void {
    try {
      // Create a floating item at the hook position
      const hookPos = this.fishingSystem.getHookPosition();
      if (hookPos) {
        new CaughtItem(this, hookPos.x, hookPos.y - 20, itemType);
      }
      
      // Update catch count
      if (this.catchCount.hasOwnProperty(itemType)) {
        this.catchCount[itemType]++;
      } else {
        // If it's a new type from the water zone system, categorize it
        if (itemType.includes('treasure') || itemType.includes('artifact')) {
          this.catchCount.treasure++;
        } else if (itemType.includes('can') || itemType.includes('driftwood')) {
          this.catchCount.junk++;
        } else {
          // Check if it's a rare fish
          const hookPos = this.fishingSystem.getHookPosition();
          if (hookPos) {
            const waterType = this.waterZoneSystem.getWaterTypeAt(hookPos.x, hookPos.y);
            const fishPop = this.waterZoneSystem.getFishPopulationAt(hookPos.x, hookPos.y);
            
            if (fishPop) {
              if (fishPop.rareFish.includes(itemType)) {
                this.catchCount.rare_fish++;
              } else if (fishPop.uncommonFish.includes(itemType)) {
                this.catchCount.uncommon_fish++;
              } else {
                this.catchCount.common_fish++;
              }
            } else {
              // Fallback to common fish if no population data
              this.catchCount.common_fish++;
            }
          }
        }
      }
      
      // Update catch display
      this.updateCatchDisplay(itemType);
    } catch (error) {
      console.error('Error handling caught item:', error);
    }
  }

  /**
   * Create UI for catch messages
   */
  private createCatchUI(): void {
    try {
      // Create catch message text
      this.catchMessage = this.add.text(
        this.scale.width / 2, 
        100,
        '',
        { 
          fontSize: '24px', 
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center'
        }
      );
      this.catchMessage.setOrigin(0.5, 0.5);
      this.catchMessage.setScrollFactor(0); // Fix to camera
      
      // Create catch count display
      this.catchCountText = this.add.text(
        10, 
        10, 
        this.formatCatchCount(),
        { 
          fontSize: '16px', 
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }
      );
      this.catchCountText.setScrollFactor(0); // Fix to camera
    } catch (error) {
      console.error('Error creating catch UI:', error);
    }
  }

  /**
   * Format the catch count for display
   */
  private formatCatchCount(): string {
    return `Caught Items:
Common Fish: ${this.catchCount.common_fish}
Uncommon Fish: ${this.catchCount.uncommon_fish}
Rare Fish: ${this.catchCount.rare_fish}
Treasure: ${this.catchCount.treasure}
Junk: ${this.catchCount.junk}`;
  }

  /**
   * Update the catch display with a new item
   */
  private updateCatchDisplay(itemType: string): void {
    try {
      // Update catch count text
      this.catchCountText.setText(this.formatCatchCount());
      
      // Show catch message
      let message = '';
      
      // Check if it's a special item from water zone system
      if (itemType.includes('treasure') || itemType.includes('artifact')) {
        message = `You found ${itemType.replace('_', ' ')}!`;
      } else if (itemType.includes('can') || itemType.includes('driftwood')) {
        message = `You caught some ${itemType.replace('_', ' ')}!`;
      } else {
        // Format fish name nicely
        const fishName = itemType.replace(/_/g, ' ');
        message = `You caught a ${fishName}!`;
      }
      
      this.catchMessage.setText(message);
      
      // Animate the message
      this.catchMessage.setAlpha(1);
      this.tweens.add({
        targets: this.catchMessage,
        y: 80,
        alpha: 0,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => {
          this.catchMessage.y = 100;
        }
      });
    } catch (error) {
      console.error('Error updating catch display:', error);
    }
  }

  /**
   * Create help text
   */
  private createHelpText(): void {
    try {
      this.helpText = this.add.text(
        this.scale.width - 10, 
        10,
        'Controls:\nArrows/WASD: Move\nF/Right-click: Cast\nR/Right-click: Reel',
        { 
          fontSize: '14px', 
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'right'
        }
      );
      this.helpText.setOrigin(1, 0); // Align to top-right
      this.helpText.setScrollFactor(0); // Fix to camera
    } catch (error) {
      console.error('Error creating help text:', error);
    }
  }
  
  /**
   * Create water type display text
   */
  private createWaterTypeDisplay(): void {
    try {
      this.waterTypeText = this.add.text(
        this.scale.width - 10,
        70,
        'Water: None',
        {
          fontSize: '14px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'right'
        }
      );
      this.waterTypeText.setOrigin(1, 0); // Align to top-right
      this.waterTypeText.setScrollFactor(0); // Fix to camera
    } catch (error) {
      console.error('Error creating water type display:', error);
    }
  }
  
  /**
   * Update water type display based on hook position
   */
  private updateWaterTypeDisplay(): void {
    try {
      // Get hook position
      const hookPos = this.fishingSystem.getHookPosition();
      
      if (hookPos) {
        // Check if hook is in water
        const waterType = this.waterZoneSystem.getWaterTypeAt(hookPos.x, hookPos.y);
        
        if (waterType) {
          // Format water type name (e.g., LAKE -> Lake)
          const formattedType = waterType.charAt(0) + waterType.slice(1).toLowerCase();
          this.waterTypeText.setText(`Water: ${formattedType}`);
          
          // Set color based on water type
          let color: string;
          switch (waterType) {
            case WaterZoneType.LAKE:
              color = '#3399ff';
              break;
            case WaterZoneType.RIVER:
              color = '#66ccff';
              break;
            case WaterZoneType.OCEAN:
              color = '#0066cc';
              break;
            default:
              color = '#ffffff';
          }
          
          this.waterTypeText.setColor(color);
        } else {
          // Not in water
          this.waterTypeText.setText('Water: None');
          this.waterTypeText.setColor('#ffffff');
        }
      }
    } catch (error) {
      console.error('Error updating water type display:', error);
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
  
  /**
   * Create temporary fallback water area for backward compatibility
   * This will be removed once all systems are updated to use WaterZoneSystem
   */
  private createFallbackWaterArea(): void {
    try {
      // Create a simple rectangle for backward compatibility
      const groundHeight = 32; // Height of the ground tiles
      const waterWidth = this.scale.width / 2;
      const waterHeight = 180;
      const waterX = this.scale.width - waterWidth;
      const waterY = this.scale.height - groundHeight - waterHeight / 2;
      
      this.waterArea = new Phaser.Geom.Rectangle(waterX, waterY, waterWidth, waterHeight);
      console.log('Created fallback water area for backward compatibility');
    } catch (error) {
      console.error('Error creating fallback water area:', error);
      // Create a fallback water area if there's an error
      this.waterArea = new Phaser.Geom.Rectangle(
        this.scale.width - 200, 
        this.scale.height - 150, 
        200, 
        100
      );
    }
  }
} 