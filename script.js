// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Base Resolution and Resizing
const BASE_WIDTH = 640;
const BASE_HEIGHT = 360;
const BASE_SPRITE_SIZE = 64;

// Gravity and Jump Physics
const gravity = 1;
const jumpHeight = -Math.sqrt(2 * gravity * BASE_HEIGHT * 0.4);

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
let highScore = 0; // Session-based high score
let gameRunning = false;
let showStartButton = true;
let showRestartButton = false;
let isGamePaused = false;
let showContinueButton = false;

// Speed Variables
let baseGameSpeed = 1;
let jumpSpeed = jumpHeight; // Speed of jump scaling
let movementSpeed = 5;
let obstacleSpawnSpeed = 2000; // in ms (time between spawns)
let obstacleSpeed = 5;

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
let continueButtonImage = loadImage('./continue_button.gif'); // Continue button image/GIF

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
  img.onload = () => (img.loaded = true);
  img.onerror = () => {
    img.loaded = false;
    console.warn(`Image failed to load: ${src}`);
  };
  return img;
}

// Helper to Load Audio with Fallbacks
function loadAudio(src) {
  const audio = new Audio(src);
  audio.onloadeddata = () => (audio.loaded = true);
  audio.onerror = () => {
    audio.loaded = false;
    console.warn(`Audio failed to load: ${src}`);
  };
  return audio;
}

// Button Drawing Function
function drawButton(area, image, fallbackText) {
  if (image?.loaded) {
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

    if (fallbackText === '▶️') {
      ctx.font = '30px Arial'; // Increase font size for play symbol
    }
    ctx.fillText(fallbackText, area.x + area.width / 2, area.y + area.height / 2);
  }
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
  const buttonWidth = 60 * scaleFactor; // Larger button size for Left and Right
  const buttonHeight = 60 * scaleFactor;

  startButton = { x: canvas.width / 2 - buttonWidth / 2, y: canvas.height / 2 - buttonHeight, width: buttonWidth, height: buttonHeight };
  restartButton = { x: canvas.width / 2 - buttonWidth / 2, y: canvas.height / 2 + buttonHeight + 20, width: buttonWidth, height: buttonHeight };
  leftButtonArea = { x: 20, y: canvas.height / 2 - buttonHeight / 2, width: buttonWidth, height: buttonHeight }; // Middle left
  rightButtonArea = { x: canvas.width - buttonWidth - 20, y: canvas.height / 2 - buttonHeight / 2, width: buttonWidth, height: buttonHeight }; // Middle right
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
    ctx.drawImage(startPageCharacter, canvas.width / 2 - BASE_SPRITE_SIZE / 2, canvas.height - BASE_SPRITE_SIZE - 30, BASE_SPRITE_SIZE, BASE_SPRITE_SIZE);
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

  // Display Score (if mid-game)
  if (gameRunning) {
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial'; // Adjusted font size for better fit
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
  }

  // Display High Score and Your Score on Game Over Screen
  if (!gameRunning && !showStartButton && showRestartButton) {
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';

    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
  }

  // Draw Buttons
  if (showStartButton) drawButton(startButton, startButtonImage, 'START');
  if (showRestartButton) drawButton(restartButton, restartButtonImage, 'RESTART');
  if (gameRunning) drawButton(pauseButtonArea, pauseButtonImage, '||');
  if (showContinueButton) drawButton(continueButton, continueButtonImage, '▶️'); // "Play" symbol
  drawButton(leftButtonArea, leftButtonImage, '←');
  drawButton(rightButtonArea, rightButtonImage, '→');
}
// Game Loop
function gameLoop() {
    if (!gameRunning || isGamePaused) return;
  
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
      obstacle.x -= obstacle.speed * baseGameSpeed;
  
      // Remove off-screen obstacles
      if (obstacle.x + obstacle.width < 0) {
        obstacles.splice(index, 1);
        score++;
        playAudio(scoreSound); // Play scoring sound
  
        // Speed Scaling: Every 5 points, increase game speed by 1%
        if (score % 5 === 0) {
          baseGameSpeed += 0.01; // 1% speed increase
          jumpSpeed += 0.01;
          movementSpeed += 0.01;
          obstacleSpawnSpeed -= 20; // Decrease spawn interval slightly
          obstacleSpeed += 0.1;
        }
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
    spawnObstacle(); // Start spawning obstacles
    gameLoop(); // Start the game loop
  }
  
  // Game Over Logic
  function gameOver() {
    gameRunning = false;
    bgMusic.pause(); // Stop background music
    playAudio(gameOverSound); // Play Game Over sound
    setTimeout(() => playAudio(gameOverMusic), 500); // Play Game Over music after a short delay
  
    // Show restart button
    showRestartButton = true;
  
    // Update high score if the current score is greater
    if (score > highScore) {
      highScore = score;
    }
  
    // Redraw the scene to display the game-over screen
    drawScene();
  }
  
  // Obstacle Spawning
  function spawnObstacle() {
    const obstacle = {
      x: canvas.width,
      y: canvas.height - BASE_SPRITE_SIZE - 30,
      width: BASE_SPRITE_SIZE,
      height: BASE_SPRITE_SIZE,
      speed: obstacleSpeed * baseGameSpeed,
    };
    obstacles.push(obstacle);
  
    const spawnInterval = Math.random() * (obstacleSpawnSpeed - obstacleSpawnSpeed / 2) + obstacleSpawnSpeed / 2;
    setTimeout(() => {
      if (gameRunning && !isGamePaused) spawnObstacle();
    }, spawnInterval / baseGameSpeed);
  }
  
  // Pause and Resume Logic
  function togglePause() {
    if (!gameRunning || showStartButton || showRestartButton) return; // Disable Pause on Start or Game Over
    isGamePaused = !isGamePaused;
    showContinueButton = isGamePaused;
  
    if (isGamePaused) {
      // Draw Pause Overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '50px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);
  
      if (continueButtonImage.loaded) {
        ctx.drawImage(continueButtonImage, continueButton.x, continueButton.y, continueButton.width, continueButton.height);
      } else {
        ctx.fillStyle = '#007bff';
        // ctx.fillRect(continueButton.x, continueButton.y, continueButton.width, continueButton.height);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('▶️', continueButton.x + continueButton.width / 2, continueButton.y + continueButton.height / 2);
      }
    } else {
      gameLoop(); // Resume game
    }
  }
  
  // Event Listeners
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
      dino.dx = -movementSpeed; // Move Dino left
    }
  
    // Right Button
    if (insideButton(mouseX, mouseY, rightButtonArea)) {
      dino.dx = movementSpeed; // Move Dino right
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
  
  // Keyboard Input
  document.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowLeft') dino.dx = -movementSpeed; // Move Dino left
    if (event.code === 'ArrowRight') dino.dx = movementSpeed; // Move Dino right
    if (event.code === 'ArrowUp' && !dino.jumping) {
      dino.dy = jumpHeight; // Trigger jump
      dino.jumping = true;
      playAudio(jumpSound); // Play jump sound
    }
    if (event.code === 'Tab') {
      togglePause(); // Pause/Resume game on Tab key press
    }
  });
  
  document.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
      dino.dx = 0; // Stop horizontal movement
    }
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
  