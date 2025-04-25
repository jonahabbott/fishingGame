# Recommended Tech Stack: HOOK & HAVOC

This document outlines a recommended technology stack for developing the 2D Fishing Adventure Sandbox game, "HOOK & HAVOC," designed for web browsers.

## 1. Core Engine & Language

* **Game Engine:** **Phaser.js (v3 or latest)**
    * *Reasoning:* A mature, feature-rich, and widely used 2D game framework specifically designed for HTML5 Canvas and WebGL rendering in browsers. It provides excellent support for physics (Arcade Physics is suitable), sprites, animations, tilemaps, input handling, audio, and state management, aligning well with the GDD's requirements. It has a large community and ample documentation/examples.
* **Programming Language:** **TypeScript**
    * *Reasoning:* While Phaser works perfectly with JavaScript, TypeScript adds static typing. This significantly improves code maintainability, reduces runtime errors, enhances developer tooling (autocompletion, refactoring), and makes managing a larger codebase (like a sandbox game) much easier, especially if multiple developers are involved. Phaser has excellent TypeScript support.

## 2. Development Environment & Tooling

* **Package Manager:** **npm** or **yarn**
    * *Reasoning:* Standard tools for managing project dependencies (Phaser, libraries, build tools).
* **Module Bundler/Build Tool:** **Vite**
    * *Reasoning:* Offers extremely fast development server startup and Hot Module Replacement (HMR) compared to older tools like Webpack. It simplifies the build process for modern JavaScript/TypeScript projects and has excellent support for Phaser development templates.
* **Version Control:** **Git** (hosted on GitHub, GitLab, Bitbucket, etc.)
    * *Reasoning:* Essential for tracking changes, collaboration, and managing different versions of the codebase.

## 3. Procedural Generation

* **Noise Algorithms:** Implementations of **Perlin Noise** or **Simplex Noise**.
    * *Reasoning:* These algorithms are standard for generating natural-looking procedural terrain, cave systems, and resource distribution maps. Libraries like `simplex-noise` are available, or they can be implemented directly.
* **Seeded Randomness:** Library like **`seedrandom`**
    * *Reasoning:* Ensures that procedural generation is deterministic based on a seed, allowing players to replay or share specific world layouts.

## 4. Persistence (Saving Game State)

* **Initial:** **Browser `localStorage` or `IndexedDB`**
    * *Reasoning:* Simple client-side storage suitable for single-player save games (player inventory, position, base state, world seed/progress). `IndexedDB` offers more capacity and flexibility than `localStorage` for larger save files.
* **Future/Advanced:** **Node.js Backend + Database**
    * *Reasoning:* If features like leaderboards, cloud saves, or potential future multiplayer are considered, a simple Node.js backend (using frameworks like Express.js or Fastify) paired with a database (e.g., PostgreSQL, MongoDB) would be necessary.

## 5. UI Development

* **Within Phaser:** Utilize Phaser's built-in text objects, images, buttons, and container elements.
    * *Reasoning:* Keeps the UI integrated within the game loop and rendering context, simplifying state management between the game and UI.
* **Alternative (Complex UI):** HTML/CSS Overlay
    * *Reasoning:* For very complex UI elements (like intricate crafting menus or inventory screens), layering HTML elements over the Phaser canvas can sometimes be easier using standard web development techniques. However, this adds complexity in communication between the HTML UI and the Phaser game state. Start with Phaser's UI tools first.

## 6. Deployment

* **Static Web Host:** Services like **Netlify, Vercel, GitHub Pages, AWS S3/CloudFront**.
    * *Reasoning:* Since it's a client-side web game (initially), it can be deployed easily as static files (HTML, CSS, JS bundles, assets) on numerous hosting platforms, many offering generous free tiers.

This stack provides a robust foundation using modern web technologies, leveraging the strengths of Phaser.js while incorporating tools for efficient development, scalability, and the specific needs outlined in the GDD.

# IMPORTANT: Game Design Context
# Always read the Game Design Document before writing any code to ensure alignment with the project vision.

Consult the [game-design-document.md](mdc:memory-bank/game-design-document.md) for core game mechanics, features, and overall direction.
