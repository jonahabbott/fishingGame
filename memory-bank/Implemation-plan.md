# HOOK & HAVOC - Base Game Implementation Plan

This plan outlines the initial steps to create the core foundation of the HOOK & HAVOC game using Phaser 3, TypeScript, and Vite. It focuses *only* on the absolute base mechanics needed for a functional prototype, excluding advanced features like complex procedural generation, crafting, base building, detailed combat, and persistence for now.

**Guiding Principles:**
* Follow the modular architecture guidelines provided.
* Use TypeScript for all code.
* Leverage Phaser's features where possible.
* Steps are small and incremental.
* Each step includes a validation test.

## Directory Structure & Modular Architecture

The project will use the following directory structure to ensure a modular, organized codebase:

```
src/
├── assets/           # Game assets (sprites, audio, etc.)
├── scenes/           # Phaser Scene classes
│   ├── GameplayScene.ts
│   └── ...
├── gameobjects/      # Game object classes
│   ├── Player.ts
│   ├── FishingRod.ts
│   └── ...
├── systems/          # Game systems and managers
│   ├── FishingSystem.ts
│   ├── InputManager.ts
│   └── ...
├── utils/            # Utility functions and helpers
├── data/             # Game data, constants, and configurations
└── main.ts           # Entry point
```

**Modular Architecture Principles:**
* Each directory and file has a clear responsibility
* Avoid monolithic files by breaking down logic (e.g., Player logic in Player.ts, fishing rules in FishingSystem.ts)
* Clear separation using TypeScript classes and modules
* Group files logically by feature (world, player, inventory) and type (scenes, gameobjects, systems)

## Phase 1: Project Setup & Basic Scene

**Step 1.1: Initialize Project**
* **Instruction:** Set up a new Vite project using a relevant TypeScript + Phaser 3 template. Install necessary dependencies (Phaser).
* **Validation:** Run the default Vite development server (`npm run dev` or `yarn dev`). Verify that the default Phaser welcome/blank screen loads correctly in the browser without errors.
* **Testing:** Create basic unit test configuration using a testing framework (Jest recommended).

**Step 1.2: Create Main Game Scene**
* **Instruction:** Create a new TypeScript file for the main gameplay scene (e.g., `src/scenes/GameplayScene.ts`) extending `Phaser.Scene`. Configure Phaser to load this scene on startup.
* **Validation:** Run the game. Verify that the custom `GameplayScene` is now active instead of the default template scene (e.g., by adding a simple background color or console log message in the scene's `create` method).
* **Testing:** Write unit test to verify scene is created and initialized correctly.

**Step 1.3: Basic Asset Loading**
* **Instruction:** Create an `assets` directory. Add placeholder image files (.png format with transparency) for the player character, a simple ground tile, and a fishing rod. Keep them extremely simple with basic shapes or color blocks. Configure the `GameplayScene`'s `preload` method to load these assets.
* **Validation:** Check the browser's developer console Network tab to confirm the image assets are loaded successfully when the game starts. No visual change is expected yet.
* **Testing:** Create unit test to verify assets are properly loaded.

## Phase 2: Player Character & Movement

**Step 2.1: Add Player Sprite**
* **Instruction:** Create a `src/gameobjects/Player.ts` class to encapsulate player logic. In the `GameplayScene`'s `create` method, instantiate the player and add the preloaded player sprite to the scene using Phaser's physics system (Arcade Physics). Position it initially on the screen.
* **Validation:** Run the game. Verify the player sprite is visible on the screen.
* **Testing:** Write unit test for player initialization.

**Step 2.2: Implement Basic Ground**
* **Instruction:** Create a static physics group for the ground. Add a simple, repeating ground tile sprite across the bottom of the screen and add it to the static group. Add a collider between the player sprite and the ground group. Enable basic gravity (Y: 500).
* **Validation:** Run the game. Verify the player sprite falls due to gravity and stops correctly on the ground platform.
* **Testing:** Write unit test for ground collision.

**Step 2.3: Implement Left/Right Movement**
* **Instruction:** Add keyboard input handling (e.g., for 'A'/'Left Arrow' and 'D'/'Right Arrow') using Phaser's built-in input methods. In the player class's `update` method, check for these inputs and set the player sprite's horizontal velocity accordingly (approximately X: 160 for movement). Add drag (or manual damping by multiplying velocity by 0.9 when stopped) to prevent sliding.
* **Validation:** Run the game. Press the left and right movement keys. Verify the player sprite moves left and right correctly on the ground platform.
* **Testing:** Create unit test for player movement logic.

**Step 2.4: Implement Basic Jump**
* **Instruction:** Add keyboard input handling for jumping (e.g., 'W'/'Up Arrow' or 'Space'). When the jump key is pressed *and* the player sprite is touching the ground, apply an upward vertical velocity (approximately Y: -350). Set bounce value to around 0.1 to avoid excessive bouncing on landing.
* **Validation:** Run the game. Press the jump key. Verify the player sprite jumps upwards and falls back to the ground due to gravity. Verify that jumping while already in the air is not possible.
* **Testing:** Write unit test for jumping mechanics.

**Step 2.5: Implement Camera Follow**
* **Instruction:** Configure the camera to follow the player sprite, ensuring the player remains in view as they move through the world.
* **Validation:** Run the game. Move the player character around and verify the camera follows smoothly.
* **Testing:** Write unit test for camera functionality.

## Phase 3: Core Fishing Mechanic (Basic)

**Step 3.1: Create Modular Fishing System**
* **Instruction:** Create the following fishing-related modules:
  * `src/gameobjects/FishingRod.ts`: Visual representation and animations of the rod
  * `src/gameobjects/FishingLine.ts`: Line visual and physics
  * `src/systems/FishingSystem.ts`: Core fishing state machine and logic
* **Validation:** Verify the modules compile without errors and are properly connected.
* **Testing:** Write unit tests for each module's core functionality.

**Step 3.2: Add Fishing Rod Sprite**
* **Instruction:** Implement the `FishingRod` class to add the preloaded fishing rod sprite to the scene. Position it relative to the player sprite (e.g., slightly offset). Make the rod sprite follow the player's position in the `update` loop.
* **Validation:** Run the game. Verify the fishing rod sprite appears near the player and moves along with the player sprite.
* **Testing:** Write unit test for fishing rod positioning.

**Step 3.3: Implement Casting Action (Visual Only)**
* **Instruction:** Add keyboard/mouse input handling for casting (e.g., mouse click or 'F' key) using Phaser's built-in input system. When the cast input is detected, play a simple visual cue on the rod (e.g., rotate it slightly forward) using the `FishingRod` class. Do not implement line mechanics yet.
* **Validation:** Run the game. Press the cast input. Verify the fishing rod sprite performs its simple visual cue (e.g., rotation).
* **Testing:** Write unit test for casting action detection.

**Step 3.4: Implement Basic Fishing Line**
* **Instruction:** Implement the `FishingLine` class to handle the line's physics and visuals. When the cast action is triggered, draw a line with physics and curvature (using Phaser's Physics system or Rope/Graphics objects) from the tip of the rod sprite outwards in the direction the player is facing (or based on mouse position). Keep the line visible for a short, fixed duration or until a 'reel in' input.
* **Validation:** Run the game. Press the cast input. Verify a physically accurate fishing line with proper curvature is drawn outwards from the rod's position.
* **Testing:** Write unit test for fishing line physics.

**Step 3.5: Define Water Area**
* **Instruction:** Define a simple rectangular area in the scene representing water (e.g., using a `Phaser.Geom.Rectangle`). Add a basic visual representation (blue rectangle) for debugging purposes.
* **Validation:** Run the game. Verify the water area is visible with a blue rectangular representation.
* **Testing:** Write unit test for water area detection.

**Step 3.6: Detect Line in Water**
* **Instruction:** Enhance the `FishingLine` and `FishingSystem` classes to check if the endpoint of the line intersects with the defined water rectangle.
* **Validation:** Run the game. Cast the line so its endpoint is within the logical water area. Verify via console log or debugger that the intersection is correctly detected. Cast the line so it does not hit the water and verify no intersection is detected.
* **Testing:** Write unit test for line-water intersection.

**Step 3.7: Basic "Catch" Event (Placeholder)**
* **Instruction:** If the line endpoint is detected within the water area (from Step 3.6), start a short timer. When the timer finishes, trigger a placeholder "catch" event (e.g., print "Caught something!" to the console). This simulates the core fishing interaction without needing actual items or reeling yet.
* **Validation:** Run the game. Cast the line into the water area. Wait for the timer duration. Verify the "Caught something!" message appears in the console. Verify the message doesn't appear if the line isn't cast into the water.
* **Testing:** Write unit test for catch event timing.

## Modular Architecture Example: Fishing System

Here's a detailed breakdown of how the fishing system is modularized:

1. **`PlayerController.ts` (in `gameobjects/Player.ts`)**
   * **Responsibility:** Handles player input for initiating fishing actions.
   * **Interaction:** Tells the `FishingSystem` to attempt starting the cast if the player is in a valid state.

2. **`FishingRod.ts` (in `gameobjects/`)**
   * **Responsibility:** Visual fishing rod, animations, and current rod type data.
   * **Interaction:** Updates visual state based on commands from `FishingSystem`.

3. **`FishingLine.ts` (in `gameobjects/`)**
   * **Responsibility:** Manages visual representation and physics of the fishing line.
   * **Interaction:** Created/managed by `FishingSystem`, reports collisions back.

4. **`FishingBobber.ts` (in `gameobjects/`)**
   * **Responsibility:** Represents the visual bobber/lure and "bite" indication.
   * **Interaction:** Position controlled by `FishingSystem`, reports events back.

5. **`FishingSystem.ts` (in `systems/`)**
   * **Responsibility:** Manages the fishing state machine and orchestrates all components.
   * **Interaction:** Central coordinator that receives input and manages all fishing-related entities.

6. **`LootTableManager.ts` (in `data/`)**
   * **Responsibility:** Defines what can be caught in different areas/conditions.
   * **Interaction:** Queried by `FishingSystem` when determining catches.

7. **`InventorySystem.ts` (in `systems/`)**
   * **Responsibility:** Manages player's inventory.
   * **Interaction:** Receives caught items from `FishingSystem`.

## Next Steps (Beyond Base Game)

* Implement actual reeling mechanics.
* Add basic resource items (e.g., generic "Fish", "Junk").
* Introduce a simple inventory display (Phaser UI or HTML).
* Basic procedural world elements (e.g., using Perlin/Simplex noise for simple terrain height).
* Basic enemy interaction (hooking an object).
* Saving/Loading game state (using `localStorage`).
* Refining player animations and world graphics.

This plan provides a starting point focused solely on getting the core loop elements functional. Remember to adhere to the modular architecture guidelines throughout development.