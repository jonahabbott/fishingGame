import Phaser from 'phaser';

/**
 * TerrainSystem
 * Responsible for procedural terrain generation, chunk loading, and management
 */
export default class TerrainSystem {
  private scene: Phaser.Scene;
  private terrainGroup: Phaser.Physics.Arcade.StaticGroup;
  private chunkSize: number = 16; // Number of tiles per chunk
  private tileSize: number = 32; // Size of each tile in pixels
  private chunkWidth: number; // Width of a chunk in pixels
  private loadedChunks: Map<string, boolean> = new Map(); // Track which chunks are loaded
  private seed: number;
  private worldHeight: number;
  private terrainTypes: { [key: string]: Phaser.Textures.Texture };
  private lastCenterChunkIndex: number = 0; // Track the last chunk index to reduce unnecessary updates
  private updateThreshold: number = 2; // Distance in chunks before triggering a reload
  private chunkCache: Map<number, Phaser.GameObjects.GameObject[]> = new Map(); // Cache for chunk blocks

  /**
   * Create a new TerrainSystem
   * @param scene The Phaser scene
   * @param worldHeight The maximum world height (used for terrain generation boundaries)
   * @param seed Optional seed for the procedural generation
   */
  constructor(scene: Phaser.Scene, worldHeight: number, seed?: number) {
    this.scene = scene;
    this.worldHeight = worldHeight;
    this.seed = seed || Math.random() * 10000; // Random seed if none provided
    this.chunkWidth = this.chunkSize * this.tileSize;
    this.terrainGroup = scene.physics.add.staticGroup();

    // Initialize terrain types/textures
    this.terrainTypes = {
      dirt: scene.textures.get('terrain_dirt'),
      rock: scene.textures.get('terrain_rock'),
      sand: scene.textures.get('terrain_sand'),
    };

    console.log(`TerrainSystem created with seed ${this.seed}`);
  }

  /**
   * Get the terrain collision group for adding colliders
   */
  public getTerrainGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.terrainGroup;
  }

  /**
   * Update the terrain based on the camera position
   * Loads new chunks as needed and unloads distant ones
   * @param cameraX The x-coordinate of the camera center
   */
  public update(cameraX: number): void {
    try {
      // Calculate which chunk the camera is in
      const centerChunkIndex = Math.floor(cameraX / this.chunkWidth);
      
      // Skip update if we haven't moved far enough from the last update position
      // BUT only if we already have some chunks loaded
      const hasLoadedChunks = this.loadedChunks.size > 0;
      if (hasLoadedChunks && Math.abs(centerChunkIndex - this.lastCenterChunkIndex) < this.updateThreshold) {
        return;
      }
      
      // Calculate which chunks should be visible based on camera position
      const visibleChunks = this.getVisibleChunkIndices(cameraX);
      
      // Track chunks that need to be generated
      const chunksToGenerate: number[] = [];
      
      // First, identify all chunks that need generation without modifying the scene
      visibleChunks.forEach(chunkIndex => {
        const chunkKey = `chunk_${chunkIndex}`;
        if (!this.loadedChunks.has(chunkKey)) {
          chunksToGenerate.push(chunkIndex);
        }
      });
      
      // Then, perform the actual chunk generation in a batch
      chunksToGenerate.forEach(chunkIndex => {
        this.generateChunk(chunkIndex);
        const chunkKey = `chunk_${chunkIndex}`;
        this.loadedChunks.set(chunkKey, true);
      });
      
      // Finally, handle unloading of distant chunks
      // Only unload chunks that are significantly far away to reduce frequent loading/unloading
      const maxDistance = 5; // Increased from 2 to 5 chunks for smoother transitions
      this.loadedChunks.forEach((loaded, chunkKey) => {
        const chunkIndex = parseInt(chunkKey.split('_')[1]);
        if (Math.abs(chunkIndex - centerChunkIndex) > maxDistance) {
          this.unloadChunk(chunkIndex);
          this.loadedChunks.delete(chunkKey);
        }
      });
      
      // Update the last center chunk index
      this.lastCenterChunkIndex = centerChunkIndex;
      
      // Update physics bodies in a batch to reduce overhead
      this.terrainGroup.refresh();
      
    } catch (error) {
      console.error('Error updating terrain:', error);
    }
  }

  /**
   * Get the indices of chunks that should be visible
   * @param cameraX The x-coordinate of the camera center
   */
  private getVisibleChunkIndices(cameraX: number): number[] {
    // Calculate which chunk the camera is in
    const centerChunkIndex = Math.floor(cameraX / this.chunkWidth);
    
    // Load 3 chunks on either side (increased from 2 for smoother transitions)
    const chunksToLoad = 3;
    const visibleChunks: number[] = [];
    
    for (let i = centerChunkIndex - chunksToLoad; i <= centerChunkIndex + chunksToLoad; i++) {
      visibleChunks.push(i);
    }
    
    return visibleChunks;
  }

  /**
   * Generate a chunk of terrain at the specified index
   * @param chunkIndex The index of the chunk to generate
   */
  private generateChunk(chunkIndex: number): void {
    try {
      // If this chunk is in the cache, restore it instead of regenerating
      if (this.chunkCache.has(chunkIndex)) {
        const cachedBlocks = this.chunkCache.get(chunkIndex);
        if (cachedBlocks && cachedBlocks.length > 0) {
          cachedBlocks.forEach(block => {
            // Make sure block is actually added to the scene
            if (!this.terrainGroup.contains(block)) {
              this.terrainGroup.add(block);
            }
          });
          console.log(`Restored chunk at index ${chunkIndex} from cache`);
          return;
        }
      }
      
      const chunkStartX = chunkIndex * this.chunkWidth;
      const generatedBlocks: Phaser.GameObjects.GameObject[] = [];
      
      // Use simplex noise or another algorithm to generate terrain height
      for (let i = 0; i < this.chunkSize; i++) {
        const x = chunkStartX + i * this.tileSize + this.tileSize / 2;
        
        // Generate height using noise function
        // Higher frequency = more jagged terrain
        // Lower frequency = smoother terrain
        const noiseValue = this.noise(x * 0.01, 0, this.seed);
        const normalizedNoise = (noiseValue + 1) / 2; // Convert to 0-1 range
        
        // Map noise to terrain height
        // Limit the range to not go too high or too low
        const minHeight = 3; // Minimum blocks from bottom
        const maxHeightVariation = 6; // Maximum height variation
        const height = Math.floor(minHeight + normalizedNoise * maxHeightVariation);
        
        // Create the terrain column and collect the blocks
        const columnBlocks = this.createTerrainColumn(x, height);
        generatedBlocks.push(...columnBlocks);
      }
      
      // Cache the generated blocks for this chunk
      this.chunkCache.set(chunkIndex, [...generatedBlocks]);
      
      console.log(`Generated chunk at index ${chunkIndex}`);
    } catch (error) {
      console.error(`Error generating chunk ${chunkIndex}:`, error);
    }
  }

  /**
   * Create a column of terrain blocks at the specified position
   * @param x The x-coordinate of the column
   * @param height The height of the column (in blocks)
   * @returns Array of created blocks
   */
  private createTerrainColumn(x: number, height: number): Phaser.GameObjects.GameObject[] {
    const columnBlocks: Phaser.GameObjects.GameObject[] = [];
    const terrainY = this.worldHeight - this.tileSize / 2; // Ground level Y coordinate
    
    for (let i = 0; i < height; i++) {
      const y = terrainY - i * this.tileSize;
      const terrainType = this.getTerrainTypeForHeight(i, height);
      
      // Create the terrain block
      const block = this.terrainGroup.create(x, y, terrainType);
      block.setOrigin(0.5, 0.5);
      // Avoid refreshing individual bodies, we'll do a batch refresh
      // block.refreshBody(); 
      
      columnBlocks.push(block);
    }
    
    return columnBlocks;
  }

  /**
   * Determine the terrain type based on depth
   * @param currentHeight The current height in the column (0 is top, higher is deeper)
   * @param totalHeight The total height of the column
   */
  private getTerrainTypeForHeight(currentHeight: number, totalHeight: number): string {
    // Surface block is different texture (grass/dirt)
    if (currentHeight === totalHeight - 1) {
      return 'terrain_dirt';
    }
    
    // Sand near the surface
    if (currentHeight >= totalHeight - 3) {
      return 'terrain_sand';
    }
    
    // Rock for deeper blocks
    return 'terrain_rock';
  }

  /**
   * Unload a chunk of terrain at the specified index
   * @param chunkIndex The index of the chunk to unload
   */
  private unloadChunk(chunkIndex: number): void {
    try {
      const chunkStartX = chunkIndex * this.chunkWidth;
      const chunkEndX = chunkStartX + this.chunkWidth;
      
      // Get all terrain blocks in this chunk
      const blocksToRemove: Phaser.GameObjects.GameObject[] = [];
      
      // Find blocks that are in this chunk
      this.terrainGroup.getChildren().forEach((child) => {
        const block = child as Phaser.Physics.Arcade.Sprite;
        if (block.x >= chunkStartX && block.x < chunkEndX) {
          blocksToRemove.push(block);
        }
      });
      
      // If no blocks to remove, exit early
      if (blocksToRemove.length === 0) {
        return;
      }
      
      // Instead of destroying blocks, remove them from the group but keep for cache
      if (!this.chunkCache.has(chunkIndex)) {
        // Store a COPY of the blocks array to prevent shared references
        this.chunkCache.set(chunkIndex, [...blocksToRemove]);
      }
      
      // Remove blocks from the group but don't destroy them
      blocksToRemove.forEach(block => {
        this.terrainGroup.remove(block, false, false); // Don't destroy the block
      });
      
      console.log(`Unloaded chunk at index ${chunkIndex} (removed ${blocksToRemove.length} blocks)`);
    } catch (error) {
      console.error(`Error unloading chunk ${chunkIndex}:`, error);
    }
  }

  /**
   * Force refresh of all terrain blocks
   * This ensures that all block physics bodies are properly updated
   */
  public refreshTerrain(): void {
    this.terrainGroup.refresh();
    console.log('Terrain physics bodies refreshed');
  }

  /**
   * Simplified Perlin noise implementation
   * This is a simple implementation for demonstration
   * In a real game, you'd use a library like simplex-noise
   */
  private noise(x: number, y: number, seed: number): number {
    // Simple 1D noise function for demonstration
    // In a real implementation, use a proper noise library
    return Math.sin(x + seed) * Math.cos(y + seed * 0.7);
  }
} 