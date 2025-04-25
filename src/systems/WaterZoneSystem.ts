import Phaser from 'phaser';
import TerrainSystem from './TerrainSystem';

/**
 * Enum representing different water zone types
 */
export enum WaterZoneType {
  LAKE = 'lake',
  RIVER = 'river',
  OCEAN = 'ocean'
}

/**
 * Interface representing a water zone
 */
export interface WaterZone {
  type: WaterZoneType;
  area: Phaser.Geom.Rectangle;
  graphics: Phaser.GameObjects.Graphics;
  fishPopulation: FishPopulation;
}

/**
 * Interface representing fish population in a water zone
 */
export interface FishPopulation {
  commonFish: string[];
  uncommonFish: string[];
  rareFish: string[];
  specialItems: string[];
}

/**
 * WaterZoneSystem
 * Manages different water zones (lake, river, ocean) with unique properties and fish populations
 */
export default class WaterZoneSystem {
  private scene: Phaser.Scene;
  private waterZones: Map<string, WaterZone> = new Map();
  private activeZones: WaterZone[] = [];
  private defaultDepth: number = 150;
  private depthVariation: number = 50;
  private seed: number;
  private worldHeight: number;
  private terrainSystem: TerrainSystem | null = null;
  private waterFrequency: number = 0.6;
  
  /**
   * Create a new WaterZoneSystem
   * @param scene The Phaser scene
   * @param worldHeight The maximum world height
   * @param terrainSystem Optional TerrainSystem for terrain collision checks
   * @param seed Optional seed for procedural generation
   */
  constructor(scene: Phaser.Scene, worldHeight: number, terrainSystem?: TerrainSystem, seed?: number) {
    this.scene = scene;
    this.worldHeight = worldHeight;
    this.seed = seed || Math.random() * 10000;
    this.terrainSystem = terrainSystem || null;
    
    // Create water zone textures
    this.createWaterTextures();
    
    console.log(`WaterZoneSystem created with seed ${this.seed}`);
  }
  
  /**
   * Update water zones based on camera position
   * @param cameraCenterX The center X position of the camera
   */
  public update(cameraCenterX: number): void {
    try {
      // Generate/update water zones based on camera position
      this.updateVisibleWaterZones(cameraCenterX);
    } catch (error) {
      console.error('Error updating water zones:', error);
    }
  }
  
  /**
   * Get all water zones that contain a specific point
   * @param x X coordinate to check
   * @param y Y coordinate to check
   * @returns Array of water zones containing the point
   */
  public getWaterZonesAt(x: number, y: number): WaterZone[] {
    const zonesAtPoint: WaterZone[] = [];
    
    for (const zone of this.activeZones) {
      if (zone.area.contains(x, y)) {
        zonesAtPoint.push(zone);
      }
    }
    
    return zonesAtPoint;
  }
  
  /**
   * Check if a point is within any water zone
   * @param x X coordinate to check
   * @param y Y coordinate to check
   * @returns Boolean indicating if point is in water
   */
  public isInWater(x: number, y: number): boolean {
    for (const zone of this.activeZones) {
      if (zone.area.contains(x, y)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get the water zone type at a specific point
   * @param x X coordinate to check
   * @param y Y coordinate to check
   * @returns The water zone type or null if not in water
   */
  public getWaterTypeAt(x: number, y: number): WaterZoneType | null {
    for (const zone of this.activeZones) {
      if (zone.area.contains(x, y)) {
        return zone.type;
      }
    }
    return null;
  }
  
  /**
   * Get fish population at a specific point
   * @param x X coordinate to check
   * @param y Y coordinate to check
   * @returns The fish population or null if not in water
   */
  public getFishPopulationAt(x: number, y: number): FishPopulation | null {
    for (const zone of this.activeZones) {
      if (zone.area.contains(x, y)) {
        return zone.fishPopulation;
      }
    }
    return null;
  }
  
  /**
   * Update visible water zones based on camera position
   * @param cameraCenterX The center X position of the camera
   */
  private updateVisibleWaterZones(cameraCenterX: number): void {
    const camera = this.scene.cameras.main;
    const viewportWidth = camera.width;
    const loadDistance = viewportWidth * 1.5; // Load water zones within 1.5x viewport width
    
    // Determine range of water zones to load
    const minX = cameraCenterX - loadDistance;
    const maxX = cameraCenterX + loadDistance;
    
    // Check for visible zone chunks in this range
    this.generateWaterZonesInRange(minX, maxX);
    
    // Unload distant zones
    this.unloadDistantWaterZones(cameraCenterX, loadDistance * 1.5); // Unload at 1.5x load distance
  }
  
  /**
   * Generate water zones within a specific range
   * @param minX Minimum X coordinate
   * @param maxX Maximum X coordinate
   */
  private generateWaterZonesInRange(minX: number, maxX: number): void {
    // Size of each zone chunk
    const zoneChunkSize = 800;
    
    // Calculate chunk indices for the range
    const startChunk = Math.floor(minX / zoneChunkSize);
    const endChunk = Math.floor(maxX / zoneChunkSize);
    
    // Generate each chunk in range
    for (let chunkIndex = startChunk; chunkIndex <= endChunk; chunkIndex++) {
      const chunkKey = `zone_${chunkIndex}`;
      
      // Skip if this chunk is already loaded
      if (this.waterZones.has(chunkKey)) {
        continue;
      }
      
      // Randomize water generation - only generate water in some chunks
      // Always generate water in the starting area (chunk 0)
      const shouldGenerateWater = chunkIndex === 0 || this.noise(chunkIndex, 99) < this.waterFrequency;
      if (!shouldGenerateWater) {
        continue;
      }
      
      // Generate a new water zone chunk
      const chunkX = chunkIndex * zoneChunkSize;
      this.generateWaterZoneChunk(chunkIndex, chunkX);
    }
  }
  
  /**
   * Generate a single water zone chunk
   * @param chunkIndex Index of the chunk
   * @param chunkX X coordinate of the chunk
   */
  private generateWaterZoneChunk(chunkIndex: number, chunkX: number): void {
    const chunkKey = `zone_${chunkIndex}`;
    const zoneChunkSize = 800;
    
    // Determine zone type based on position and noise
    const zoneType = this.determineZoneType(chunkIndex);
    
    // Create zone area - size varies by type
    let width = zoneChunkSize;
    let height: number;
    let x = chunkX;
    let y: number;
    
    // Configure zone based on type (reduced sizes)
    switch (zoneType) {
      case WaterZoneType.LAKE:
        // Lakes are wider but shallower
        width = zoneChunkSize * (0.5 + this.noise(chunkIndex, 0) * 0.3);
        height = this.defaultDepth * (0.7 + this.noise(chunkIndex, 1) * 0.2);
        // Position lakes near the bottom of the screen
        x = chunkX + (zoneChunkSize - width) / 2;
        y = this.worldHeight - height;
        break;
        
      case WaterZoneType.RIVER:
        // Rivers are narrower and have variable height
        width = zoneChunkSize * (0.3 + this.noise(chunkIndex, 0) * 0.2);
        height = this.worldHeight * (0.25 + this.noise(chunkIndex, 1) * 0.1);
        x = chunkX + (zoneChunkSize - width) / 2;
        y = this.worldHeight - height;
        break;
        
      case WaterZoneType.OCEAN:
        // Oceans are wide and deep
        width = zoneChunkSize * 0.8;
        height = this.defaultDepth * (1.0 + this.noise(chunkIndex, 1) * 0.3);
        x = chunkX + (zoneChunkSize - width) / 2;
        y = this.worldHeight - height;
        break;
        
      default:
        // Default lake style
        width = zoneChunkSize * 0.6;
        height = this.defaultDepth;
        x = chunkX + (zoneChunkSize - width) / 2;
        y = this.worldHeight - height;
    }
    
    // Create zone area
    const area = new Phaser.Geom.Rectangle(x, y, width, height);
    
    // If we have a terrain system, adjust water to avoid terrain
    if (this.terrainSystem) {
      this.adjustWaterForTerrain(area);
    }
    
    // Create graphics for the zone
    const graphics = this.scene.add.graphics();
    
    // Render the zone based on its type
    this.renderWaterZone(graphics, area, zoneType);
    
    // Create fish population for this zone
    const fishPopulation = this.createFishPopulation(zoneType, chunkIndex);
    
    // Create the water zone
    const waterZone: WaterZone = {
      type: zoneType,
      area,
      graphics,
      fishPopulation
    };
    
    // Store the zone
    this.waterZones.set(chunkKey, waterZone);
    this.activeZones.push(waterZone);
    
    console.log(`Generated ${zoneType} at ${x}, ${y} with size ${width}x${height}`);
  }
  
  /**
   * Adjust water rectangle to avoid overlap with terrain
   * @param waterArea The water area rectangle to adjust
   */
  private adjustWaterForTerrain(waterArea: Phaser.Geom.Rectangle): void {
    if (!this.terrainSystem) return;
    
    // Add a small margin to prevent water from touching terrain
    const margin = 5;
    
    // Get the terrain group
    const terrainGroup = this.terrainSystem.getTerrainGroup();
    
    // Check bottom of water area for terrain
    let lowestY = waterArea.y;
    
    // Iterate through terrain blocks to find ones that would overlap with water
    terrainGroup.getChildren().forEach((block) => {
      const sprite = block as Phaser.Physics.Arcade.Sprite;
      
      // Check if block overlaps with water horizontally
      if (
        sprite.x + sprite.width/2 >= waterArea.x && 
        sprite.x - sprite.width/2 <= waterArea.right
      ) {
        // Find the highest terrain point in this column
        if (sprite.y - sprite.height/2 < lowestY) {
          lowestY = sprite.y - sprite.height/2 - margin;
        }
      }
    });
    
    // Adjust water height to avoid terrain
    if (lowestY < waterArea.bottom) {
      const newHeight = waterArea.bottom - lowestY;
      if (newHeight > 30) { // Only if there's meaningful water left
        waterArea.height = newHeight;
      }
    }
  }
  
  /**
   * Unload water zones that are too far from the camera
   * @param cameraCenterX The center X position of the camera
   * @param maxDistance Maximum distance before unloading
   */
  private unloadDistantWaterZones(cameraCenterX: number, maxDistance: number): void {
    const keysToRemove: string[] = [];
    const zonesToRemove: WaterZone[] = [];
    
    // Find zones to unload
    this.waterZones.forEach((zone, key) => {
      const zoneCenter = zone.area.centerX;
      const distance = Math.abs(zoneCenter - cameraCenterX);
      
      if (distance > maxDistance) {
        keysToRemove.push(key);
        zonesToRemove.push(zone);
      }
    });
    
    // Unload distant zones
    for (const key of keysToRemove) {
      this.waterZones.delete(key);
    }
    
    for (const zone of zonesToRemove) {
      // Remove from active zones
      const index = this.activeZones.indexOf(zone);
      if (index !== -1) {
        this.activeZones.splice(index, 1);
      }
      
      // Destroy graphics
      zone.graphics.destroy();
    }
    
    if (keysToRemove.length > 0) {
      console.log(`Unloaded ${keysToRemove.length} distant water zones`);
    }
  }
  
  /**
   * Determine zone type based on chunk index and noise
   * @param chunkIndex Index of the chunk
   * @returns The determined water zone type
   */
  private determineZoneType(chunkIndex: number): WaterZoneType {
    // Use noise to determine zone type
    const noiseValue = this.noise(chunkIndex, 42);
    
    // Special case: always make the starting area a lake
    if (chunkIndex === 0) {
      return WaterZoneType.LAKE;
    }
    
    // Special case: make oceans more common at greater distances
    const distanceFromCenter = Math.abs(chunkIndex);
    if (distanceFromCenter > 5 && noiseValue > 0.4) {
      return WaterZoneType.OCEAN;
    }
    
    // Distribute zone types based on noise value (modified distribution)
    if (noiseValue < 0.4) {
      return WaterZoneType.LAKE;
    } else if (noiseValue < 0.7) {
      return WaterZoneType.RIVER;
    } else {
      return WaterZoneType.OCEAN;
    }
  }
  
  /**
   * Render a water zone based on its type
   * @param graphics Graphics object to render on
   * @param area Rectangle defining the zone area
   * @param type Water zone type
   */
  private renderWaterZone(graphics: Phaser.GameObjects.Graphics, area: Phaser.Geom.Rectangle, type: WaterZoneType): void {
    graphics.clear();
    
    // Set color based on zone type
    let fillColor: number;
    let alpha: number;
    
    switch (type) {
      case WaterZoneType.LAKE:
        fillColor = 0x3399ff; // Lighter blue for lakes
        alpha = 0.6;
        break;
        
      case WaterZoneType.RIVER:
        fillColor = 0x66ccff; // Blue-green for rivers
        alpha = 0.7;
        break;
        
      case WaterZoneType.OCEAN:
        fillColor = 0x0066cc; // Darker blue for oceans
        alpha = 0.8;
        break;
        
      default:
        fillColor = 0x0099ff; // Default blue
        alpha = 0.6;
    }
    
    // Fill the water area
    graphics.fillStyle(fillColor, alpha);
    graphics.fillRect(area.x, area.y, area.width, area.height);
    
    // Add decorative elements based on zone type
    this.addWaterDecorations(graphics, area, type);
    
    // Add animations to make it look like water
    this.scene.tweens.add({
      targets: graphics,
      alpha: alpha - 0.1, // Slightly change alpha for wave effect
      yoyo: true,
      repeat: -1,
      duration: 1500,
      ease: 'Sine.easeInOut'
    });
  }
  
  /**
   * Add decorative elements to a water zone
   * @param graphics Graphics object to render on
   * @param area Rectangle defining the zone area
   * @param type Water zone type
   */
  private addWaterDecorations(graphics: Phaser.GameObjects.Graphics, area: Phaser.Geom.Rectangle, type: WaterZoneType): void {
    switch (type) {
      case WaterZoneType.LAKE:
        // Add gentle ripples to lakes
        graphics.lineStyle(1, 0xffffff, 0.3);
        for (let i = 0; i < 5; i++) {
          const x = area.x + area.width * (0.2 + 0.6 * Math.random());
          const y = area.y + area.height * (0.2 + 0.6 * Math.random());
          const radius = 5 + Math.random() * 10;
          graphics.strokeCircle(x, y, radius);
        }
        break;
        
      case WaterZoneType.RIVER:
        // Add current lines to rivers
        graphics.lineStyle(1, 0xffffff, 0.2);
        for (let i = 0; i < 8; i++) {
          const x1 = area.x + i * (area.width / 8);
          const y1 = area.y + Math.random() * area.height * 0.3;
          const x2 = x1 + 15 + Math.random() * 10;
          const y2 = y1 + 10 + Math.random() * 20;
          graphics.lineBetween(x1, y1, x2, y2);
        }
        break;
        
      case WaterZoneType.OCEAN:
        // Add wave lines to oceans
        graphics.lineStyle(1, 0xffffff, 0.2);
        for (let i = 0; i < 3; i++) {
          const y = area.y + 20 + i * 30;
          graphics.beginPath();
          graphics.moveTo(area.x, y);
          
          for (let x = area.x; x < area.x + area.width; x += 30) {
            const amplitude = 5 + Math.random() * 5;
            const y2 = y + Math.sin((x - area.x) / 50) * amplitude;
            graphics.lineTo(x, y2);
          }
          
          graphics.strokePath();
        }
        break;
    }
  }
  
  /**
   * Create fish population for a water zone
   * @param zoneType The type of water zone
   * @param chunkIndex The chunk index for seed variety
   * @returns Fish population for the zone
   */
  private createFishPopulation(zoneType: WaterZoneType, chunkIndex: number): FishPopulation {
    // Base populations for each zone type
    let population: FishPopulation;
    
    switch (zoneType) {
      case WaterZoneType.LAKE:
        population = {
          commonFish: ['bass', 'bluegill', 'crappie', 'perch'],
          uncommonFish: ['walleye', 'catfish', 'pike'],
          rareFish: ['sturgeon', 'muskie'],
          specialItems: ['lake_treasure', 'rusty_can']
        };
        break;
        
      case WaterZoneType.RIVER:
        population = {
          commonFish: ['trout', 'chub', 'dace'],
          uncommonFish: ['salmon', 'grayling', 'char'],
          rareFish: ['steelhead', 'golden_trout'],
          specialItems: ['river_treasure', 'driftwood']
        };
        break;
        
      case WaterZoneType.OCEAN:
        population = {
          commonFish: ['cod', 'mackerel', 'herring'],
          uncommonFish: ['tuna', 'marlin', 'swordfish'],
          rareFish: ['shark', 'whale', 'giant_squid'],
          specialItems: ['sunken_treasure', 'ancient_artifact']
        };
        break;
        
      default:
        // Default population as fallback
        population = {
          commonFish: ['small_fish'],
          uncommonFish: ['medium_fish'],
          rareFish: ['big_fish'],
          specialItems: ['treasure']
        };
    }
    
    // Add some variation based on chunk index
    const seedVariety = this.noise(chunkIndex, 123);
    if (seedVariety > 0.7) {
      // Add special fish to this zone
      population.rareFish.push('legendary_fish');
    }
    
    return population;
  }
  
  /**
   * Create textures for water zones
   */
  private createWaterTextures(): void {
    try {
      // Create texture for lake water
      const lakeGraphics = this.scene.add.graphics();
      lakeGraphics.fillStyle(0x3399ff, 0.6);
      lakeGraphics.fillRect(0, 0, 32, 32);
      lakeGraphics.lineStyle(1, 0xffffff, 0.2);
      lakeGraphics.strokeCircle(16, 16, 8);
      lakeGraphics.generateTexture('water_lake', 32, 32);
      lakeGraphics.destroy();
      
      // Create texture for river water
      const riverGraphics = this.scene.add.graphics();
      riverGraphics.fillStyle(0x66ccff, 0.7);
      riverGraphics.fillRect(0, 0, 32, 32);
      riverGraphics.lineStyle(1, 0xffffff, 0.2);
      riverGraphics.lineBetween(0, 16, 32, 16);
      riverGraphics.generateTexture('water_river', 32, 32);
      riverGraphics.destroy();
      
      // Create texture for ocean water
      const oceanGraphics = this.scene.add.graphics();
      oceanGraphics.fillStyle(0x0066cc, 0.8);
      oceanGraphics.fillRect(0, 0, 32, 32);
      oceanGraphics.lineStyle(1, 0xffffff, 0.2);
      for (let i = 0; i < 3; i++) {
        const y = 8 + i * 8;
        oceanGraphics.lineBetween(0, y, 32, y);
      }
      oceanGraphics.generateTexture('water_ocean', 32, 32);
      oceanGraphics.destroy();
      
      console.log('Water textures created');
    } catch (error) {
      console.error('Error creating water textures:', error);
    }
  }
  
  /**
   * Simple noise function for varied generation
   * @param x X coordinate for noise
   * @param y Y coordinate for noise
   * @returns Noise value between 0 and 1
   */
  private noise(x: number, y: number): number {
    // Simple deterministic noise function
    const n = Math.sin(x * 1.5 + this.seed) * Math.cos(y * 1.3 + this.seed * 0.7);
    return (n + 1) * 0.5; // Map from [-1,1] to [0,1]
  }
} 