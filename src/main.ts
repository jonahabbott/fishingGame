import Phaser from 'phaser';
import GameplayScene from './scenes/GameplayScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: true // Enable physics debug for development
    }
  },
  scene: [GameplayScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: true
  }
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
