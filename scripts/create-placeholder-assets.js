import fs from 'fs';
import { createCanvas } from 'canvas';

// Ensure directories exist
const spriteDir = './src/assets/sprites';
if (!fs.existsSync(spriteDir)) {
  fs.mkdirSync(spriteDir, { recursive: true });
}

// Create player sprite (simple blue square with darker outline)
const playerCanvas = createCanvas(32, 32);
const playerCtx = playerCanvas.getContext('2d');
playerCtx.fillStyle = '#3498db'; // Blue fill
playerCtx.fillRect(2, 2, 28, 28);
playerCtx.strokeStyle = '#2980b9'; // Darker blue outline
playerCtx.lineWidth = 2;
playerCtx.strokeRect(2, 2, 28, 28);
const playerBuffer = playerCanvas.toBuffer('image/png');
fs.writeFileSync(`${spriteDir}/player.png`, playerBuffer);
console.log('Created player.png');

// Create ground tile (brown rectangle)
const groundCanvas = createCanvas(32, 32);
const groundCtx = groundCanvas.getContext('2d');
groundCtx.fillStyle = '#8B4513'; // Brown fill
groundCtx.fillRect(0, 0, 32, 32);
groundCtx.strokeStyle = '#654321'; // Darker brown outline
groundCtx.lineWidth = 2;
groundCtx.strokeRect(1, 1, 30, 30);
// Add some texture dots
groundCtx.fillStyle = '#654321';
for (let i = 0; i < 8; i++) {
  groundCtx.fillRect(4 + (i * 3) % 24, 4 + Math.floor(i / 3) * 8, 2, 2);
}
const groundBuffer = groundCanvas.toBuffer('image/png');
fs.writeFileSync(`${spriteDir}/ground.png`, groundBuffer);
console.log('Created ground.png');

// Create fishing rod (simple line with hook)
const rodCanvas = createCanvas(32, 32);
const rodCtx = rodCanvas.getContext('2d');
rodCtx.strokeStyle = '#8B4513'; // Brown rod
rodCtx.lineWidth = 2;
// Draw rod handle
rodCtx.beginPath();
rodCtx.moveTo(8, 24);
rodCtx.lineTo(24, 8);
rodCtx.stroke();
// Draw hook at the end
rodCtx.strokeStyle = '#A9A9A9'; // Gray hook
rodCtx.beginPath();
rodCtx.moveTo(24, 8);
rodCtx.lineTo(28, 6);
rodCtx.lineTo(26, 10);
rodCtx.stroke();
const rodBuffer = rodCanvas.toBuffer('image/png');
fs.writeFileSync(`${spriteDir}/fishing_rod.png`, rodBuffer);
console.log('Created fishing_rod.png');

console.log('All placeholder assets created successfully!'); 