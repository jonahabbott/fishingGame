# Hook & Havoc: Architectural Overview

This document outlines the architectural approach and organization of the Hook & Havoc game codebase.

## Directory Structure

```
src/
├── assets/           # Game assets (sprites, audio, etc.)
├── scenes/           # Phaser Scene classes
│   ├── GameplayScene.ts
│   └── __tests__/    # Unit tests for scenes
├── gameobjects/      # Game object classes
│   ├── Player.ts
│   ├── FishingRod.ts
│   ├── FishingLine.ts
│   ├── CaughtItem.ts
│   └── __tests__/    # Unit tests for game objects
├── systems/          # Game systems and managers
│   ├── FishingSystem.ts
│   ├── TerrainSystem.ts
│   └── __tests__/    # Unit tests for systems
├── utils/            # Utility functions and helpers
├── data/             # Game data, constants, and configurations
└── main.ts           # Entry point
```

## Key Files

### /src/main.ts
- **Purpose:** Application entry point
- **Responsibilities:**
  - Configures and initializes the Phaser game instance
  - Sets up global game configuration (resolution, physics, rendering)
  - Registers game scenes

### /src/scenes/GameplayScene.ts
- **Purpose:** Main gameplay scene
- **Responsibilities:**
  - Loads game assets
  - Creates and manages game objects
  - Handles scene-specific input
  - Manages game state within the scene
  - Orchestrates player movement, fishing mechanics, and world interaction
  - Manages caught item display and inventory tracking

### /src/gameobjects/Player.ts
- **Purpose:** Player character controller
- **Responsibilities:**
  - Manages player movement through dual control schemes (arrow keys and WASD)
  - Handles player state (position, direction, jumping)
  - Maintains collision with environment

### /src/gameobjects/FishingRod.ts
- **Purpose:** Visual representation of the fishing rod
- **Responsibilities:**
  - Follows player position and orientation
  - Provides rod animations for casting and reeling
  - Calculates rod tip position for line attachment
  - Handles visual feedback during fishing actions

### /src/gameobjects/FishingLine.ts
- **Purpose:** Manages the fishing line and hook physics
- **Responsibilities:**
  - Renders the line between rod tip and hook
  - Provides physics for the hook (gravity, collision, friction)
  - Detects interaction with environment (water, ground)
  - Manages distance-based casting mechanics
  - Controls hook visualization and rotation

### /src/gameobjects/CaughtItem.ts
- **Purpose:** Visual representation of caught items
- **Responsibilities:**
  - Displays caught item sprites
  - Manages item animations (floating, rotating)
  - Handles auto-cleanup after animation completes

### /src/systems/FishingSystem.ts
- **Purpose:** Orchestrates the fishing mechanics
- **Responsibilities:**
  - Maintains extended fishing state machine (idle, casting, waiting_for_bite, bite, reeling, caught)
  - Connects player input to fishing actions
  - Coordinates between player, rod, and line
  - Manages mouse-based aiming and distance calculation
  - Handles bite indicators and visual feedback
  - Manages catch determination and item distribution
  - Generates and plays fishing-related sound effects

### /src/systems/TerrainSystem.ts
- **Purpose:** Procedural terrain generation and management
- **Responsibilities:**
  - Generates procedural terrain based on player position
  - Manages chunk-based loading and unloading for efficiency
  - Provides terrain collision for player and fishing line
  - Creates varied terrain heights using noise algorithms
  - Handles different terrain type distribution based on depth
  - Controls chunk boundaries and seamless transitions
  - Optimizes performance through dynamic loading

### /src/systems/BackgroundSystem.ts
- **Purpose:** Manages parallax backgrounds, day/night cycle, and ambient effects
- **Responsibilities:**
  - Renders multi-layered parallax scrolling backgrounds
  - Controls day/night cycle with dynamic lighting and color transitions
  - Manages ambient environmental elements like clouds and birds
  - Handles foreground decorative elements for visual depth
  - Synchronizes visual elements with camera movement
  - Provides time-of-day information to other systems
  - Optimizes rendering through efficient texture generation

## Core Game Systems

### Fishing System Architecture

The fishing system implements a modular design with clear separation of concerns:

1. **Input System:**
   - Dual fishing controls via F key and right mouse button
   - Input detection and event processing
   - Mouse position tracking for directional casting
   - Distance-based power calculation using mouse-to-player distance
   - Real-time visual feedback on casting distance and direction
   - Reeling input via R key or right-click during bite events

2. **Physics & Collision:**
   - Physics-based hook with arcade physics
   - Collision detection with ground and water
   - Ground friction for realistic behavior
   - Water area detection with splash effects
   - Hook rotation and orientation based on velocity
   - Trajectory calculation for distance-controlled casting

3. **Auto-Retraction System:**
   - Automatic detection of hooks that miss water and land on ground
   - Position tracking to determine when hook has stopped moving
   - Movement threshold detection (5 pixels) for identifying settled hooks
   - Timer-based auto-retraction after 1 second of inactivity
   - Conditional activation based on environment type (only on ground, not in water)
   - Configurable enable/disable flag for gameplay customization
   - Cleanup and reset mechanisms to prevent timer conflicts
   - Debug logging for system monitoring and troubleshooting

4. **Visual Representation:**
   - Rod animations for both casting and reeling
   - Line rendering between rod tip and hook with tension visualization
   - Dynamic aim line visualization with distance-based color coding
     - Green: Short cast (0-100px)
     - Yellow: Medium cast (100-200px)
     - Red: Long cast (200-300px)
   - Distance limit indicator at maximum cast range
   - Bite indicators with pulsing and bobbing animations
   - Water ripple effects during bite events
   - Caught item animations and floating effects

5. **State Management:**
   - Enhanced state machine for fishing process
   - Transitions between idle, casting, waiting_for_bite, bite, reeling, and caught states
   - Bite window timer with escape mechanics
   - Error recovery and state reset
   - Automated state timeout recovery

6. **Distance-Based Casting System:**
   - Direct mouse distance to casting distance relationship
   - Maximum cast distance capping at 300 pixels
   - Visual feedback proportional to cast distance
   - Direction normalization and downward angle capping
   - Intuitive power control without charging mechanics
   - Consistent physics application for deterministic behavior

7. **Audio System:**
   - Procedurally generated sound effects
   - Contextual audio feedback (splash, bite, reeling)
   - Web Audio API integration
   - Distance-based volume scaling

8. **Item System:**
   - Multiple item types with varying rarity
   - Probability-based item determination
   - Visual representation of caught items
   - Item count tracking and display
   - Category-based item classification

## World Generation System

The terrain generation system implements a modular design based on these components:

1. **Chunk Management:**
   - Divides world into fixed-size chunks (16 tiles per chunk)
   - Loads chunks dynamically based on camera position
   - Maintains map of loaded chunks for efficient tracking
   - Unloads distant chunks to maintain performance
   - Provides method to determine which chunks should be visible

2. **Procedural Height Generation:**
   - Uses simplified noise function for terrain height variation
   - Configurable minimum height and maximum height variation
   - Seed-based generation for reproducible worlds
   - Frequency control for adjusting terrain jaggedness
   - Normalized noise mapping for consistent height ranges

3. **Terrain Variety:**
   - Multiple terrain types (dirt, rock, sand)
   - Terrain type selection based on depth in column
   - Visual differentiation with distinctive textures
   - Grass-topped surface for visual polish
   - Layered terrain distribution (sand near surface, rock deeper)

4. **Collision and Physics:**
   - Static physics bodies for terrain tiles
   - Efficient collision handling through static groups
   - Integration with player and fishing line collision systems
   - Proper collision body updating on terrain changes
   - Boundary tracking for consistent collision detection

5. **Performance Optimization:**
   - Only renders terrain chunks near the player
   - Configurable loading radius (typically 2 chunks in each direction)
   - Efficient chunk refreshing when moving through the world
   - Recycling of terrain blocks when possible
   - Memory management through cleanup of unused chunks

## Background System Architecture

The background system provides visual atmosphere and environmental effects through these components:

1. **Parallax Scrolling Layers:**
   - Multiple depth-sorted background layers (mountains, hills, trees)
   - Varying scroll speeds for sense of depth and distance
   - Procedurally generated textures for visual variety
   - Camera-synchronized movement with different parallax factors
   - Fixed screen positioning with world-space movement

2. **Day/Night Cycle:**
   - Full day/night cycle with transitions between four distinct phases
   - Dynamic sky color changes based on time of day
   - Global lighting overlay with variable opacity
   - Color interpolation system for smooth transitions
   - Configurable cycle duration (default 5 minutes per cycle)
   - Time controls for pausing, resuming, and manual time setting

3. **Ambient Elements:**
   - Cloud generation with variable sizes, speeds, and positions
   - Bird animation with random flight patterns and directions
   - Continuous movement with screen wrapping for infinite scrolling
   - Depth-appropriate rendering order for proper layering
   - Semi-transparent effects for atmospheric depth
   - Subtle animation for natural movement

4. **Decorative Elements:**
   - Foreground decorative elements with partial parallax
   - Tree tops and other nature elements to enhance environment
   - Dynamic repositioning based on camera movement
   - Procedurally varied appearance for natural look
   - Efficient object reuse through element recycling

5. **Performance Considerations:**
   - Procedural texture generation at initialization to minimize assets
   - Automatic screen wrapping to limit object count
   - Camera-based element culling and repositioning
   - Render depth management to ensure proper layering
   - Efficient cleanup mechanisms for resource management

## Modular Architecture Principles

The codebase follows these architectural principles:

1. **Separation of Concerns:** Each module has a specific responsibility and purpose
2. **Encapsulation:** Implementation details are hidden behind clear interfaces
3. **Dependency Management:** Modules clearly define their dependencies
4. **Testability:** Code is structured to allow unit testing of individual components
5. **Error Handling:** Robust error detection and recovery throughout the system
6. **Flexibility:** Support for multiple control schemes and input methods
7. **Progressive Enhancement:** Systems built to allow incremental feature additions

## Development Approach

- **TypeScript:** Providing static typing to prevent runtime errors and improve maintainability
- **Jest:** For unit testing components
- **Vite:** Fast development server and efficient bundling
- **Phaser 3:** Game framework with built-in physics, rendering, and input handling

## Development Standards

- **File Naming:** Use PascalCase for classes (Player.ts, FishingRod.ts) and camelCase for utilities
- **Classes:** One main class per file where possible
- **Unit Testing:** Test files co-located with implementation in __tests__ folders
- **Comments:** JSDoc style comments for public methods and important code sections
- **Error Handling:** Try-catch blocks around critical sections with detailed error logging
- **State Management:** Clear state transitions with appropriate validation 