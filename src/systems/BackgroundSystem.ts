import Phaser from 'phaser';

/**
 * BackgroundSystem
 * Responsible for parallax backgrounds, day/night cycle, and ambient environmental effects
 */
export default class BackgroundSystem {
  private scene: Phaser.Scene;
  private backgroundLayers: Phaser.GameObjects.TileSprite[] = [];
  private dayNightCycle: Phaser.GameObjects.Graphics;
  private timeOfDay: number = 0; // 0 = dawn, 0.25 = noon, 0.5 = dusk, 0.75 = midnight
  private dayLength: number = 300000; // Full day/night cycle in ms (5 minutes)
  private dayTimer: Phaser.Time.TimerEvent;
  private sky: Phaser.GameObjects.Rectangle;
  
  // Ambient elements
  private clouds: Phaser.GameObjects.Sprite[] = [];
  private birds: Phaser.GameObjects.Sprite[] = [];
  private treeTops: Phaser.GameObjects.Sprite[] = [];
  
  // Decorative elements
  private decorations: Phaser.GameObjects.Sprite[] = [];
  
  // Day/night colors
  private readonly COLORS = {
    SKY: {
      DAWN: 0xffc8a0,
      DAY: 0x87ceeb,
      DUSK: 0xff9060,
      NIGHT: 0x1a2b50
    },
    OVERLAY: {
      DAWN: 0xffa254,
      DAY: 0xffffff,
      DUSK: 0xd75817,
      NIGHT: 0x0a1433
    }
  };
  
  /**
   * Create a new BackgroundSystem
   * @param scene The Phaser scene
   */
  constructor(scene: Phaser.Scene) {
    try {
      this.scene = scene;
      
      // Create sky background
      this.createSky();
      
      // Create parallax background layers
      this.createBackgroundLayers();
      
      // Create day/night cycle overlay
      this.createDayNightCycle();
      
      // Create ambient elements
      this.createAmbientElements();
      
      // Start day/night cycle
      this.startDayNightCycle();
      
      console.log('BackgroundSystem initialized successfully');
    } catch (error) {
      console.error('Error initializing BackgroundSystem:', error);
    }
  }
  
  /**
   * Create the sky background
   */
  private createSky(): void {
    try {
      // Create a full-screen rectangle for the sky
      const width = this.scene.scale.width;
      const height = this.scene.scale.height;
      
      this.sky = this.scene.add.rectangle(width / 2, height / 2, width, height, this.COLORS.SKY.DAY);
      this.sky.setDepth(-1000); // Ensure sky is behind everything
      this.sky.setScrollFactor(0); // Fixed position regardless of camera
      
      console.log('Sky created');
    } catch (error) {
      console.error('Error creating sky:', error);
    }
  }
  
  /**
   * Create the parallax background layers
   */
  private createBackgroundLayers(): void {
    try {
      const width = this.scene.scale.width;
      const height = this.scene.scale.height;
      
      // Create background textures if they don't exist
      this.createBackgroundTextures();
      
      // Far mountains - slowest parallax
      const mountains = this.scene.add.tileSprite(
        width / 2, 
        height - 200, 
        width, 
        150, 
        'bg_mountains'
      );
      mountains.setDepth(-900);
      mountains.setScrollFactor(0); // Fixed position
      this.backgroundLayers.push(mountains);
      
      // Hills - medium parallax
      const hills = this.scene.add.tileSprite(
        width / 2, 
        height - 160, 
        width, 
        100, 
        'bg_hills'
      );
      hills.setDepth(-800);
      hills.setScrollFactor(0);
      this.backgroundLayers.push(hills);
      
      // Trees - faster parallax
      const trees = this.scene.add.tileSprite(
        width / 2, 
        height - 120, 
        width, 
        100, 
        'bg_trees'
      );
      trees.setDepth(-700);
      trees.setScrollFactor(0);
      this.backgroundLayers.push(trees);
      
      console.log('Background layers created');
    } catch (error) {
      console.error('Error creating background layers:', error);
    }
  }
  
  /**
   * Create background textures for layers
   */
  private createBackgroundTextures(): void {
    try {
      // Create mountain texture
      const mountainsGraphics = this.scene.add.graphics();
      mountainsGraphics.fillStyle(0x8080a0);
      
      // Draw jagged mountains
      mountainsGraphics.beginPath();
      mountainsGraphics.moveTo(0, 150);
      
      const mountainWidth = 150;
      const segments = Math.ceil(800 / mountainWidth) + 1;
      
      for (let i = 0; i < segments; i++) {
        const x = i * mountainWidth;
        const peakHeight = 70 + Math.random() * 60;
        mountainsGraphics.lineTo(x, 150 - peakHeight);
        mountainsGraphics.lineTo(x + mountainWidth / 2, 150);
        mountainsGraphics.lineTo(x + mountainWidth, 150 - peakHeight * 0.7);
      }
      
      mountainsGraphics.lineTo(800, 150);
      mountainsGraphics.closePath();
      mountainsGraphics.fill();
      
      mountainsGraphics.generateTexture('bg_mountains', 800, 150);
      mountainsGraphics.clear();
      
      // Create hills texture
      const hillsGraphics = this.scene.add.graphics();
      hillsGraphics.fillStyle(0x506050);
      
      // Draw rolling hills
      hillsGraphics.beginPath();
      hillsGraphics.moveTo(0, 100);
      
      const hillWidth = 80;
      const hillSegments = Math.ceil(800 / hillWidth) + 1;
      
      for (let i = 0; i < hillSegments; i++) {
        const x = i * hillWidth;
        const hillHeight = 30 + Math.random() * 20;
        
        // Draw curve for hill
        const controlPoint1X = x + hillWidth * 0.25;
        const controlPoint1Y = 100 - hillHeight;
        const controlPoint2X = x + hillWidth * 0.75;
        const controlPoint2Y = 100 - hillHeight;
        const endX = x + hillWidth;
        const endY = 100;
        
        // Add curve points to create smoother hills
        for (let t = 0; t <= 1; t += 0.1) {
          const cx = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * controlPoint1X + t * t * endX;
          const cy = (1 - t) * (1 - t) * 100 + 2 * (1 - t) * t * controlPoint1Y + t * t * endY;
          hillsGraphics.lineTo(cx, cy);
        }
      }
      
      hillsGraphics.lineTo(800, 100);
      hillsGraphics.lineTo(800, 100);
      hillsGraphics.closePath();
      hillsGraphics.fill();
      
      hillsGraphics.generateTexture('bg_hills', 800, 100);
      hillsGraphics.clear();
      
      // Create trees texture
      const treesGraphics = this.scene.add.graphics();
      treesGraphics.fillStyle(0x305030);
      
      // Draw a forest silhouette
      const treeCount = 20;
      const treeWidth = 800 / treeCount;
      
      for (let i = 0; i < treeCount; i++) {
        const x = i * treeWidth + treeWidth / 2;
        const treeHeight = 40 + Math.random() * 30;
        
        // Draw tree trunk
        treesGraphics.fillRect(x - 2, 100 - treeHeight * 0.3, 4, treeHeight * 0.3);
        
        // Draw tree canopy (triangle)
        treesGraphics.fillStyle(0x305030);
        treesGraphics.beginPath();
        treesGraphics.moveTo(x - treeWidth * 0.4, 100 - treeHeight * 0.3);
        treesGraphics.lineTo(x, 100 - treeHeight);
        treesGraphics.lineTo(x + treeWidth * 0.4, 100 - treeHeight * 0.3);
        treesGraphics.closePath();
        treesGraphics.fill();
        
        // Potentially add second layer of leaves
        if (Math.random() > 0.5) {
          treesGraphics.beginPath();
          treesGraphics.moveTo(x - treeWidth * 0.35, 100 - treeHeight * 0.5);
          treesGraphics.lineTo(x, 100 - treeHeight * 0.8);
          treesGraphics.lineTo(x + treeWidth * 0.35, 100 - treeHeight * 0.5);
          treesGraphics.closePath();
          treesGraphics.fill();
        }
      }
      
      treesGraphics.generateTexture('bg_trees', 800, 100);
      treesGraphics.clear();
      
      // Create cloud texture
      const cloudGraphics = this.scene.add.graphics();
      cloudGraphics.fillStyle(0xffffff);
      
      // Draw a fluffy cloud
      cloudGraphics.fillCircle(15, 15, 10);
      cloudGraphics.fillCircle(30, 10, 15);
      cloudGraphics.fillCircle(45, 15, 12);
      cloudGraphics.fillCircle(25, 20, 10);
      
      cloudGraphics.generateTexture('cloud', 60, 30);
      cloudGraphics.clear();
      
      // Create bird texture
      const birdGraphics = this.scene.add.graphics();
      birdGraphics.lineStyle(2, 0x000000);
      
      // Draw a simple bird (M shape)
      birdGraphics.beginPath();
      birdGraphics.moveTo(0, 5);
      birdGraphics.lineTo(5, 0);
      birdGraphics.lineTo(10, 5);
      birdGraphics.lineTo(15, 0);
      birdGraphics.lineTo(20, 5);
      birdGraphics.stroke();
      
      birdGraphics.generateTexture('bird', 20, 10);
      birdGraphics.clear();
      
      // Create tree top texture for decorative elements
      const treeTopGraphics = this.scene.add.graphics();
      treeTopGraphics.fillStyle(0x3a5a3a);
      
      // Draw a detailed tree top
      const centerX = 25;
      const centerY = 50;
      
      // Draw trunk
      treeTopGraphics.fillStyle(0x6b4226);
      treeTopGraphics.fillRect(centerX - 3, centerY - 10, 6, 20);
      
      // Draw canopy layers
      treeTopGraphics.fillStyle(0x3a5a3a);
      treeTopGraphics.beginPath();
      treeTopGraphics.moveTo(centerX - 20, centerY - 10);
      treeTopGraphics.lineTo(centerX, centerY - 40);
      treeTopGraphics.lineTo(centerX + 20, centerY - 10);
      treeTopGraphics.closePath();
      treeTopGraphics.fill();
      
      treeTopGraphics.fillStyle(0x426b42);
      treeTopGraphics.beginPath();
      treeTopGraphics.moveTo(centerX - 15, centerY - 20);
      treeTopGraphics.lineTo(centerX, centerY - 45);
      treeTopGraphics.lineTo(centerX + 15, centerY - 20);
      treeTopGraphics.closePath();
      treeTopGraphics.fill();
      
      treeTopGraphics.generateTexture('tree_top', 50, 50);
      treeTopGraphics.clear();
      
      console.log('Background textures created');
    } catch (error) {
      console.error('Error creating background textures:', error);
    }
  }
  
  /**
   * Create the day/night cycle overlay
   */
  private createDayNightCycle(): void {
    try {
      // Create full-screen overlay for day/night tinting
      this.dayNightCycle = this.scene.add.graphics();
      this.dayNightCycle.setDepth(1000); // Ensure overlay is on top of everything
      this.dayNightCycle.setScrollFactor(0); // Fixed position regardless of camera
      
      // Initial state (day)
      this.updateDayNightCycle(this.timeOfDay);
      
      console.log('Day/night cycle created');
    } catch (error) {
      console.error('Error creating day/night cycle:', error);
    }
  }
  
  /**
   * Create ambient elements (clouds, birds, etc.)
   */
  private createAmbientElements(): void {
    try {
      const width = this.scene.scale.width;
      const height = this.scene.scale.height;
      
      // Create clouds
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * width;
        const y = 50 + Math.random() * 100;
        const scale = 0.5 + Math.random() * 1.5;
        const speed = 0.1 + Math.random() * 0.2;
        
        const cloud = this.scene.add.sprite(x, y, 'cloud');
        cloud.setDepth(-950);
        cloud.setScrollFactor(0);
        cloud.setScale(scale);
        cloud.setData('speed', speed);
        cloud.setAlpha(0.7);
        
        this.clouds.push(cloud);
      }
      
      // Create occasional birds
      for (let i = 0; i < 3; i++) {
        const x = Math.random() * width;
        const y = 100 + Math.random() * 150;
        const scale = 0.5 + Math.random() * 1;
        const speed = 0.3 + Math.random() * 0.5;
        
        const bird = this.scene.add.sprite(x, y, 'bird');
        bird.setDepth(-850);
        bird.setScrollFactor(0);
        bird.setScale(scale);
        bird.setData('speed', speed);
        bird.setData('direction', Math.random() > 0.5 ? 1 : -1);
        if (bird.getData('direction') === -1) {
          bird.setFlipX(true);
        }
        
        this.birds.push(bird);
      }
      
      // Create foreground tree tops (decorative elements)
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * width * 3 - width;
        const y = height - 100 - Math.random() * 50;
        const scale = 0.8 + Math.random() * 1.5;
        
        const treeTop = this.scene.add.sprite(x, y, 'tree_top');
        treeTop.setDepth(-600);
        treeTop.setScale(scale);
        treeTop.setScrollFactor(0.8); // Slight parallax
        
        this.treeTops.push(treeTop);
      }
      
      console.log('Ambient elements created');
    } catch (error) {
      console.error('Error creating ambient elements:', error);
    }
  }
  
  /**
   * Start the day/night cycle
   */
  private startDayNightCycle(): void {
    try {
      // Start a timer to advance the time of day
      this.dayTimer = this.scene.time.addEvent({
        delay: 100, // Update every 100ms
        callback: () => {
          // Increment time of day (full cycle in dayLength ms)
          this.timeOfDay = (this.timeOfDay + 0.1 / (this.dayLength / 100)) % 1;
          this.updateDayNightCycle(this.timeOfDay);
        },
        callbackScope: this,
        loop: true
      });
      
      console.log('Day/night cycle started');
    } catch (error) {
      console.error('Error starting day/night cycle:', error);
    }
  }
  
  /**
   * Update the day/night cycle visuals
   * @param time Time of day (0-1)
   */
  private updateDayNightCycle(time: number): void {
    try {
      // Determine sky colors based on time of day
      let skyColor: number;
      let overlayColor: number;
      let alpha: number;
      
      if (time < 0.25) { // Dawn to day
        const t = time * 4; // Normalize to 0-1
        skyColor = this.lerpColor(this.COLORS.SKY.DAWN, this.COLORS.SKY.DAY, t);
        overlayColor = this.COLORS.OVERLAY.DAY;
        alpha = Math.max(0, 0.3 - t * 0.3); // Fade out overlay
      } else if (time < 0.5) { // Day to dusk
        const t = (time - 0.25) * 4; // Normalize to 0-1
        skyColor = this.lerpColor(this.COLORS.SKY.DAY, this.COLORS.SKY.DUSK, t);
        overlayColor = this.lerpColor(this.COLORS.OVERLAY.DAY, this.COLORS.OVERLAY.DUSK, t);
        alpha = t * 0.3; // Fade in overlay
      } else if (time < 0.75) { // Dusk to night
        const t = (time - 0.5) * 4; // Normalize to 0-1
        skyColor = this.lerpColor(this.COLORS.SKY.DUSK, this.COLORS.SKY.NIGHT, t);
        overlayColor = this.lerpColor(this.COLORS.OVERLAY.DUSK, this.COLORS.OVERLAY.NIGHT, t);
        alpha = 0.3 + t * 0.3; // Increase overlay opacity
      } else { // Night to dawn
        const t = (time - 0.75) * 4; // Normalize to 0-1
        skyColor = this.lerpColor(this.COLORS.SKY.NIGHT, this.COLORS.SKY.DAWN, t);
        overlayColor = this.lerpColor(this.COLORS.OVERLAY.NIGHT, this.COLORS.OVERLAY.DAWN, t);
        alpha = 0.6 - t * 0.3; // Decrease overlay opacity
      }
      
      // Update sky color
      if (this.sky) {
        this.sky.setFillStyle(skyColor);
      }
      
      // Update overlay
      this.dayNightCycle.clear();
      this.dayNightCycle.fillStyle(overlayColor, alpha);
      this.dayNightCycle.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    } catch (error) {
      console.error('Error updating day/night cycle:', error);
    }
  }
  
  /**
   * Interpolate between two colors
   * @param color1 First color (hexadecimal)
   * @param color2 Second color (hexadecimal)
   * @param t Interpolation factor (0-1)
   * @returns Interpolated color
   */
  private lerpColor(color1: number, color2: number, t: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    
    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;
    
    const r = Math.floor(r1 + (r2 - r1) * t);
    const g = Math.floor(g1 + (g2 - g1) * t);
    const b = Math.floor(b1 + (b2 - b1) * t);
    
    return (r << 16) | (g << 8) | b;
  }
  
  /**
   * Update background parallax based on camera position
   * @param cameraX Camera x position
   */
  public update(cameraX: number): void {
    try {
      // Update parallax layers
      if (this.backgroundLayers.length >= 3) {
        // Far mountains (slowest)
        this.backgroundLayers[0].tilePositionX = cameraX * 0.1;
        
        // Hills (medium)
        this.backgroundLayers[1].tilePositionX = cameraX * 0.2;
        
        // Trees (fastest)
        this.backgroundLayers[2].tilePositionX = cameraX * 0.4;
      }
      
      // Update cloud positions
      for (const cloud of this.clouds) {
        cloud.x -= cloud.getData('speed');
        
        // Wrap clouds around the screen
        if (cloud.x < -cloud.width) {
          cloud.x = this.scene.scale.width + cloud.width;
          cloud.y = 50 + Math.random() * 100;
        }
      }
      
      // Update bird positions
      for (const bird of this.birds) {
        const direction = bird.getData('direction');
        const speed = bird.getData('speed');
        bird.x += direction * speed;
        
        // Slight up/down movement
        bird.y += Math.sin(this.scene.time.now / 200) * 0.5;
        
        // Wrap birds around the screen
        if ((direction === 1 && bird.x > this.scene.scale.width + bird.width) ||
            (direction === -1 && bird.x < -bird.width)) {
          bird.x = direction === 1 ? -bird.width : this.scene.scale.width + bird.width;
          bird.y = 100 + Math.random() * 150;
        }
      }
      
      // Update tree positions (simple parallax)
      for (const tree of this.treeTops) {
        // If tree goes off screen, wrap to the other side
        const halfWidth = this.scene.scale.width / 2;
        if (tree.x < cameraX - halfWidth - 100) {
          tree.x = cameraX + halfWidth + Math.random() * 200;
        } else if (tree.x > cameraX + halfWidth + 100) {
          tree.x = cameraX - halfWidth - Math.random() * 200;
        }
      }
    } catch (error) {
      console.error('Error updating backgrounds:', error);
    }
  }
  
  /**
   * Set the time of day directly (0-1)
   * @param time Time of day (0-1)
   */
  public setTimeOfDay(time: number): void {
    this.timeOfDay = time % 1;
    this.updateDayNightCycle(this.timeOfDay);
  }
  
  /**
   * Get the current time of day
   * @returns Current time of day (0-1)
   */
  public getTimeOfDay(): number {
    return this.timeOfDay;
  }
  
  /**
   * Set the day/night cycle speed
   * @param duration Duration of a full day/night cycle in milliseconds
   */
  public setDayLength(duration: number): void {
    this.dayLength = duration;
  }
  
  /**
   * Pause the day/night cycle
   */
  public pauseDayNightCycle(): void {
    if (this.dayTimer) {
      this.dayTimer.paused = true;
    }
  }
  
  /**
   * Resume the day/night cycle
   */
  public resumeDayNightCycle(): void {
    if (this.dayTimer) {
      this.dayTimer.paused = false;
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    try {
      // Stop timer
      if (this.dayTimer) {
        this.dayTimer.remove();
      }
      
      // Clean up graphics
      if (this.dayNightCycle) {
        this.dayNightCycle.destroy();
      }
      
      // Clean up sprites
      this.backgroundLayers.forEach(layer => layer.destroy());
      this.clouds.forEach(cloud => cloud.destroy());
      this.birds.forEach(bird => bird.destroy());
      this.treeTops.forEach(tree => tree.destroy());
      this.decorations.forEach(deco => deco.destroy());
      
      console.log('BackgroundSystem destroyed');
    } catch (error) {
      console.error('Error destroying BackgroundSystem:', error);
    }
  }
} 