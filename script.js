// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Base Resolution and Resizing
const BASE_WIDTH = 640;
const BASE_HEIGHT = 360;
const BASE_SPRITE_SIZE = 64;

// Game Variables
let dino = {
  x: BASE_WIDTH / 2 - BASE_SPRITE_SIZE / 2,
  y: BASE_HEIGHT - BASE_SPRITE_SIZE - 30,
  width: BASE_SPRITE_SIZE,
  height: BASE_SPRITE_SIZE,
  dx: 0,
  dy: 0,
  jumping: false,
};
let obstacles = [];
let score = 0;
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
let gameRunning = false;
let showStartButton = true;
let showRestartButton = false;
let isGamePaused = false;
let showContinueButton = false;

// Game Speed Variables
let gameSpeed = 1; // Base speed multiplier
let obstacleSpeed = 5; // Speed of obstacles

// Gravity and Jump Physics
const gravity = 1;
const jumpHeight = -Math.sqrt(2 * gravity * BASE_HEIGHT * 0.4);

// Button Areas
let startButton = {};
let restartButton = {};
let leftButtonArea = {};
let rightButtonArea = {};
let pauseButtonArea = {};
let continueButton = {};

// Load Assets with Fallbacks
let dinoSprite = loadImage('./dino.png');
let enemySprite = loadImage('./enemy.png');
let backgroundSprite = loadImage('./background.png');
let groundSprite = loadImage('./ground.png');
let startPageCharacter = loadImage('./start_character.png');
let startButtonImage = loadImage('./start_button.png');
let restartButtonImage = loadImage('./restart_button.png');
let leftButtonImage = loadImage('./left_button.png');
let rightButtonImage = loadImage('./right_button.png');
let pauseButtonImage = loadImage('./pause_button.png');
let continueButtonImage = loadImage('./continue_button.gif'); // GIF or Image for Continue Button

// Load Audio with Fallbacks
let bgMusic = loadAudio('./background.mp3');
let jumpSound = loadAudio('./jump.mp3');
let scoreSound = loadAudio('./score.mp3');
let collisionSound = loadAudio('./collision.mp3');
let gameOverMusic = loadAudio('./gameover_music.mp3');
let gameOverSound = loadAudio('./gameover_sound.mp3');
let startPageMusic = loadAudio('./start_music.mp3');

// Helper to Load Images with Fallbacks
function loadImage(src) {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    img.loaded = true;
  };
  img.onerror = () => {
    img.loaded = false;
    console.warn(`Image failed to load: ${src}`);
  };
  return img;
}

// Helper to Load Audio with Fallbacks
function loadAudio(src) {
  const audio = new Audio(src);
  audio.onloadeddata = () => {
    audio.loaded = true;
  };
  audio.onerror = () => {
    audio.loaded = false;
    console.warn(`Audio failed to load: ${src}`);
  };
  return audio;
}

// Resize Canvas and Update Button Areas
function resizeCanvas() {
  const container = document.getElementById('gameContainer');
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  if (containerWidth / containerHeight > BASE_WIDTH / BASE_HEIGHT) {
    canvas.height = containerHeight;
    canvas.width = containerHeight * (BASE_WIDTH / BASE_HEIGHT);
  } else {
    canvas.width = containerWidth;
    canvas.height = containerWidth / (BASE_WIDTH / BASE_HEIGHT);
  }
  const scaleFactor = canvas.width / BASE_WIDTH;

  // Update Dino
  dino.width = dino.height = BASE_SPRITE_SIZE * scaleFactor;
  dino.x = canvas.width / 2 - dino.width / 2;
  dino.y = canvas.height - dino.height - 30 * scaleFactor;

  // Update Button Areas
  const buttonWidth = 100 * scaleFactor;
  const buttonHeight = 50 * scaleFactor;
  startButton = { x: canvas.width / 2 - buttonWidth / 2, y: canvas.height / 2 - buttonHeight, width: buttonWidth, height: buttonHeight };
  restartButton = { ...startButton };
  leftButtonArea = { x: 20, y: canvas.height - buttonHeight - 20, width: buttonWidth, height: buttonHeight };
  rightButtonArea = { x: canvas.width - buttonWidth - 20, y: canvas.height - buttonHeight - 20, width: buttonWidth, height: buttonHeight };
  pauseButtonArea = { x: canvas.width - 60, y: 20, width: 40, height: 40 };
  continueButton = { x: canvas.width / 2 - buttonWidth / 2, y: canvas.height / 2 + buttonHeight, width: buttonWidth, height: buttonHeight };

  drawScene();
}

// Draw Game Elements
function drawScene() {
  // Draw Background
  if (backgroundSprite.loaded) {
    ctx.drawImage(backgroundSprite, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#cce7ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw Ground
  if (groundSprite.loaded) {
    ctx.drawImage(groundSprite, 0, canvas.height - 30, canvas.width, 30);
  } else {
    ctx.fillStyle = '#333';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
  }

  // Draw Dino
  if (gameRunning) {
    if (dinoSprite.loaded) {
      ctx.drawImage(dinoSprite, dino.x, dino.y, dino.width, dino.height);
    } else {
      ctx.fillStyle = '#555';
      ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
    }
  } else if (showStartButton && startPageCharacter.loaded) {
    ctx.drawImage(startPageCharacter, canvas.width / 2 - 50, canvas.height / 2 - 100, 100, 100);
  }

  // Draw Obstacles
  obstacles.forEach((obstacle) => {
    if (enemySprite.loaded) {
      ctx.drawImage(enemySprite, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    } else {
      ctx.fillStyle = '#333';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
  });

  // Display Score
  ctx.fillStyle = '#000';
  ctx.font = '30px Arial';
  ctx.fillText(`Score: ${score}`, 10, 40);

  // Draw Buttons
  if (showStartButton) drawButton(startButton, startButtonImage, 'START');
  if (showRestartButton) drawButton(restartButton, restartButtonImage, 'RESTART');
  if (gameRunning) drawButton(pauseButtonArea, pauseButtonImage, '||');
  if (showContinueButton) drawButton(continueButton, continueButtonImage, 'CONTINUE');
  drawButton(leftButtonArea, leftButtonImage, '←');
  drawButton(rightButtonArea, rightButtonImage, '→');
}

function drawButton(area, image, fallbackText) {
  if (image.loaded) {
    ctx.drawImage(image, area.x, area.y, area.width, area.height);
  } else {
    ctx.fillStyle = '#007bff';
    ctx.fillRect(area.x, area.y, area.width, area.height);
    ctx.strokeStyle = '#0056b3';
    ctx.strokeRect(area.x, area.y, area.width, area.height);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fallbackText, area.x + area.width / 2, area.y + area.height / 2);
  }
}

// Handle Pause
function togglePause() {
  if (!gameRunning || showStartButton || showRestartButton) return; // Disable Pause on Start or Game Over
  isGamePaused = !isGamePaused;
  showContinueButton = isGamePaused;
  if (isGamePaused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);
  } else {
    gameLoop(); // Resume game
  }
}

// Spawn Obstacles
function spawnObstacle() {
  const obstacle = {
    x: canvas.width,
    y: canvas.height - BASE_SPRITE_SIZE - 30,
    width: BASE_SPRITE_SIZE,
    height: BASE_SPRITE_SIZE,
    speed: obstacleSpeed,
  };
  obstacles.push(obstacle);
}

// Obstacle Spawning Interval
setInterval(() => {
  if (gameRunning && !isGamePaused) {
    spawnObstacle();
  }
}, 2000); // Spawn an obstacle every 2 seconds

// Main Game Loop
function gameLoop() {
  if (!gameRunning || isGamePaused) {
    return;
  }

  // Update Dino Position
  dino.x += dino.dx;
  dino.y += dino.dy;
  if (dino.jumping) {
    dino.dy += gravity;
  }

  // Prevent Dino from falling below the ground
  if (dino.y + dino.height >= canvas.height - 30) {
    dino.y = canvas.height - 30 - dino.height;
    dino.jumping = false;
    dino.dy = 0;
  }

  // Prevent Dino from moving off-screen horizontally
  if (dino.x < 0) dino.x = 0;
  if (dino.x + dino.width > canvas.width) dino.x = canvas.width - dino.width;

  // Update Obstacles
  obstacles.forEach((obstacle, index) => {
    obstacle.x -= obstacle.speed * gameSpeed; // Speed up the obstacles
    // Remove off-screen obstacles
    if (obstacle.x + obstacle.width < 0) {
      obstacles.splice(index, 1);
      score++;
      playAudio(scoreSound); // Play scoring sound
    }
    // Check Collision
    if (
      dino.x < obstacle.x + obstacle.width &&
      dino.x + dino.width > obstacle.x &&
      dino.y < obstacle.y + obstacle.height &&
      dino.y + dino.height > obstacle.y
    ) {
      playAudio(collisionSound); // Play collision sound
      gameOver(); // Trigger Game Over
    }
  });

  // Speed up the game over time
  if (score % 5 === 0 && score > 0) { // Increase speed every 5 points
    gameSpeed += 0.1;
    obstacleSpeed += 0.5; // Increase obstacle speed
  }

  // Redraw the Scene
  drawScene();

  // Request Next Frame
  requestAnimationFrame(gameLoop);
}

// Start the Game
function startGame() {
  playAudio(startPageMusic); // Stop Start Page Music
  bgMusic.loop = true;
  playAudio(bgMusic); // Play background music
  gameRunning = true;
  showStartButton = false;
  gameLoop(); // Start the game loop
}

// Game Over
function gameOver() {
  gameRunning = false;
  showRestartButton = true;
  bgMusic.pause(); // Stop background music
  playAudio(gameOverSound); // Play Game Over sound
  setTimeout(() => playAudio(gameOverMusic), 500); // Play Game Over music after a short delay
}

// Mouse and Touch Controls
canvas.addEventListener('mousedown', (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // Start Button
  if (showStartButton && insideButton(mouseX, mouseY, startButton)) {
    startGame();
  }

  // Restart Button
  if (showRestartButton && insideButton(mouseX, mouseY, restartButton)) {
    location.reload(); // Reload the page to reset the game
  }

  // Pause Button
  if (insideButton(mouseX, mouseY, pauseButtonArea)) {
    togglePause();
  }

  // Continue Button
  if (isGamePaused && insideButton(mouseX, mouseY, continueButton)) {
    togglePause();
    showContinueButton = false;
  }

  // Left Button
  if (insideButton(mouseX, mouseY, leftButtonArea)) {
    dino.dx = -5; // Move Dino left
  }

  // Right Button
  if (insideButton(mouseX, mouseY, rightButtonArea)) {
    dino.dx = 5; // Move Dino right
  }

  // Jump
  if (!showStartButton && !showRestartButton && !isGamePaused && !dino.jumping) {
    dino.dy = jumpHeight; // Trigger jump
    dino.jumping = true;
    playAudio(jumpSound); // Play jump sound
  }
});

canvas.addEventListener('mouseup', () => {
  dino.dx = 0; // Stop horizontal movement
});

// Keyboard Controls
document.addEventListener('keydown', (event) => {
  if (event.code === 'ArrowLeft') dino.dx = -5; // Move Dino left
  if (event.code === 'ArrowRight') dino.dx = 5; // Move Dino right
  if ((event.code === 'ArrowUp' || event.code === 'Space') && !dino.jumping) {
    dino.dy = jumpHeight; // Trigger jump
    dino.jumping = true;
    playAudio(jumpSound); // Play jump sound
  }
  if (event.code === 'Tab') {
    togglePause(); // Pause/Resume game on Tab key press
  }
});

document.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') dino.dx = 0; // Stop horizontal movement
});

// Button Detection Logic
function insideButton(x, y, button) {
  return x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height;
}

// Play Audio Safely
function playAudio(audio) {
  if (audio && audio.loaded) {
    audio.currentTime = 0; // Reset to the beginning
    audio.play().catch(() => {
      console.warn(`Failed to play audio: ${audio.src}`);
    });
  }
}

// Resize the Canvas
resizeCanvas();
window.addEventListener('resize', resizeCanvas);