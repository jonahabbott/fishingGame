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
├── systems/          # Game systems and managers
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

## Modular Architecture Principles

The codebase follows these architectural principles:

1. **Separation of Concerns:** Each module has a specific responsibility and purpose
2. **Encapsulation:** Implementation details are hidden behind clear interfaces
3. **Dependency Management:** Modules clearly define their dependencies
4. **Testability:** Code is structured to allow unit testing of individual components

## Development Approach

- **TypeScript:** Providing static typing to prevent runtime errors and improve maintainability
- **Jest:** For unit testing components
- **Vite:** Fast development server and efficient bundling

## Development Standards

- **File Naming:** Use PascalCase for classes (Player.ts, FishingRod.ts) and camelCase for utilities
- **Classes:** One main class per file where possible
- **Unit Testing:** Test files co-located with implementation in __tests__ folders
