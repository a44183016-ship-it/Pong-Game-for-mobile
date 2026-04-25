// ============================================
// GAME CONFIGURATION & STATE
// ============================================

const config = {
    difficulties: {
        easy: {
            aiSpeed: 3,
            aiDeadZone: 50,
            ballSpeed: 4,
            ballSpeedIncrease: 1.01,
            maxBallDy: 4
        },
        normal: {
            aiSpeed: 4.5,
            aiDeadZone: 35,
            ballSpeed: 5,
            ballSpeedIncrease: 1.02,
            maxBallDy: 5
        },
        hard: {
            aiSpeed: 6,
            aiDeadZone: 15,
            ballSpeed: 6,
            ballSpeedIncrease: 1.03,
            maxBallDy: 6
        }
    }
};

let gameState = {
    mode: null, // 'single' or 'local'
    difficulty: 'normal',
    isRunning: false,
    isPaused: false,
    currentConfig: null
};

// Canvas setup
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Scale paddle positions on resize
    if (oldWidth && oldHeight) {
        playerPaddle.y = (playerPaddle.y / oldHeight) * canvas.height;
        computerPaddle.y = (computerPaddle.y / oldHeight) * canvas.height;
    }
}

window.addEventListener('resize', resizeCanvas);

// Game objects
const paddleWidth = 10;
const paddleHeight = 80;
const ballSize = 8;

const playerPaddle = {
    x: 10,
    y: 0,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 6
};

const computerPaddle = {
    x: 0,
    y: 0,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 4.5
};

const ball = {
    x: 0,
    y: 0,
    dx: 5,
    dy: 5,
    size: ballSize,
    speed: 5,
    initialSpeed: 5
};

let player1Score = 0;
let player2Score = 0;
let mouseY = 0;
let mouseY2 = 0;

const keys = {};
const touches = {};

// ============================================
// SCREEN MANAGEMENT
// ============================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function startGameMode(mode) {
    gameState.mode = mode;
    if (mode === 'single') {
        showScreen('difficultyScreen');
    } else {
        startWithDifficulty('normal');
    }
}

function startWithDifficulty(difficulty) {
    gameState.difficulty = difficulty;
    gameState.currentConfig = config.difficulties[difficulty];
    initializeGame();
    showScreen('gameScreen');
}

function backToMenu() {
    showScreen('menuScreen');
}

function goToMenu() {
    resetGame();
    showScreen('menuScreen');
}

// ============================================
// GAME INITIALIZATION
// ============================================

function initializeGame() {
    resizeCanvas();
    
    // Set initial positions
    playerPaddle.x = 10;
    playerPaddle.y = canvas.height / 2 - paddleHeight / 2;
    playerPaddle.speed = 6;
    
    computerPaddle.x = canvas.width - 20;
    computerPaddle.y = canvas.height / 2 - paddleHeight / 2;
    computerPaddle.speed = gameState.currentConfig.aiSpeed;
    
    // Reset scores
    player1Score = 0;
    player2Score = 0;
    updateScoreboard();
    
    // Initialize ball
    ball.initialSpeed = gameState.currentConfig.ballSpeed;
    ball.speed = ball.initialSpeed;
    resetBall();
    
    // Update UI
    const diffLabel = gameState.difficulty.charAt(0).toUpperCase() + gameState.difficulty.slice(1);
    document.getElementById('difficultyDisplay').textContent = `${diffLabel}`;
    document.getElementById('difficultyDisplay').className = `difficulty-badge ${gameState.difficulty}`;
    
    if (gameState.mode === 'single') {
        document.getElementById('player1Label').textContent = 'You';
        document.getElementById('player2Label').textContent = 'Computer';
        document.getElementById('mobileControls').style.display = 'none';
    } else {
        document.getElementById('player1Label').textContent = 'Player 1';
        document.getElementById('player2Label').textContent = 'Player 2';
        document.getElementById('mobileControls').style.display = 'flex';
    }
    
    gameState.isRunning = false;
    gameState.isPaused = false;
    updateGameStatus();
}

// ============================================
// INPUT HANDLING
// ============================================

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouseY = touch.clientY - rect.top;
}, { passive: false });

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouseY = touch.clientY - rect.top;
}, { passive: false });

// Mobile button controls - Player 1
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');

upBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touches['up'] = true;
    upBtn.classList.add('active');
});

upBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touches['up'] = false;
    upBtn.classList.remove('active');
});

downBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touches['down'] = true;
    downBtn.classList.add('active');
});

downBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touches['down'] = false;
    downBtn.classList.remove('active');
});

upBtn.addEventListener('mousedown', () => {
    touches['up'] = true;
    upBtn.classList.add('active');
});

upBtn.addEventListener('mouseup', () => {
    touches['up'] = false;
    upBtn.classList.remove('active');
});

downBtn.addEventListener('mousedown', () => {
    touches['down'] = true;
    downBtn.classList.add('active');
});

downBtn.addEventListener('mouseup', () => {
    touches['down'] = false;
    downBtn.classList.remove('active');
});

// Mobile button controls - Player 2
const upBtn2 = document.getElementById('upBtn2');
const downBtn2 = document.getElementById('downBtn2');

upBtn2.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touches['up2'] = true;
    upBtn2.classList.add('active');
});

upBtn2.addEventListener('touchend', (e) => {
    e.preventDefault();
    touches['up2'] = false;
    upBtn2.classList.remove('active');
});

downBtn2.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touches['down2'] = true;
    downBtn2.classList.add('active');
});

downBtn2.addEventListener('touchend', (e) => {
    e.preventDefault();
    touches['down2'] = false;
    downBtn2.classList.remove('active');
});

upBtn2.addEventListener('mousedown', () => {
    touches['up2'] = true;
    upBtn2.classList.add('active');
});

upBtn2.addEventListener('mouseup', () => {
    touches['up2'] = false;
    upBtn2.classList.remove('active');
});

downBtn2.addEventListener('mousedown', () => {
    touches['down2'] = true;
    downBtn2.classList.add('active');
});

downBtn2.addEventListener('mouseup', () => {
    touches['down2'] = false;
    downBtn2.classList.remove('active');
});

// Button controls
document.getElementById('startBtn').addEventListener('click', () => {
    if (!gameState.isRunning) {
        gameState.isRunning = true;
        gameState.isPaused = false;
        updateGameStatus();
    }
});

document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('menuBtn').addEventListener('click', goToMenu);

// ============================================
// GAME LOGIC - UPDATE
// ============================================

function update() {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    // Player 1 paddle movement
    if (gameState.mode === 'local') {
        // Local multiplayer - Player 1 with arrow keys or buttons
        if (keys['ArrowUp'] || touches['up']) {
            if (playerPaddle.y > 0) {
                playerPaddle.y -= playerPaddle.speed;
            }
        } else if (keys['ArrowDown'] || touches['down']) {
            if (playerPaddle.y < canvas.height - playerPaddle.height) {
                playerPaddle.y += playerPaddle.speed;
            }
        } else {
            const paddleCenter = playerPaddle.height / 2;
            const targetY = mouseY - paddleCenter;
            if (targetY < playerPaddle.y) {
                playerPaddle.y = Math.max(0, playerPaddle.y - playerPaddle.speed);
            } else if (targetY > playerPaddle.y) {
                playerPaddle.y = Math.min(canvas.height - playerPaddle.height, playerPaddle.y + playerPaddle.speed);
            }
        }
        
        // Player 2 with W/S or buttons
        if (keys['w'] || keys['W'] || touches['up2']) {
            if (computerPaddle.y > 0) {
                computerPaddle.y -= computerPaddle.speed;
            }
        } else if (keys['s'] || keys['S'] || touches['down2']) {
            if (computerPaddle.y < canvas.height - computerPaddle.height) {
                computerPaddle.y += computerPaddle.speed;
            }
        } else {
            const paddleCenter = computerPaddle.height / 2;
            const targetY = mouseY2 - paddleCenter;
            if (targetY < computerPaddle.y) {
                computerPaddle.y = Math.max(0, computerPaddle.y - computerPaddle.speed);
            } else if (targetY > computerPaddle.y) {
                computerPaddle.y = Math.min(canvas.height - computerPaddle.height, computerPaddle.y + computerPaddle.speed);
            }
        }
    } else {
        // Single player - vs AI
        if (keys['ArrowUp'] || touches['up']) {
            if (playerPaddle.y > 0) {
                playerPaddle.y -= playerPaddle.speed;
            }
        } else if (keys['ArrowDown'] || touches['down']) {
            if (playerPaddle.y < canvas.height - playerPaddle.height) {
                playerPaddle.y += playerPaddle.speed;
            }
        } else {
            const paddleCenter = playerPaddle.height / 2;
            const targetY = mouseY - paddleCenter;
            if (targetY < playerPaddle.y) {
                playerPaddle.y = Math.max(0, playerPaddle.y - playerPaddle.speed);
            } else if (targetY > playerPaddle.y) {
                playerPaddle.y = Math.min(canvas.height - playerPaddle.height, playerPaddle.y + playerPaddle.speed);
            }
        }
        
        // AI paddle movement with difficulty-based behavior
        updateAI();
    }
    
    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Ball collision with walls
    if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.size, Math.min(canvas.height - ball.size, ball.y));
    }
    
    // Ball collision with paddles
    checkPaddleCollision();
    
    // Scoring
    if (ball.x - ball.size < 0) {
        player2Score++;
        updateScoreboard();
        resetBall();
    }
    
    if (ball.x + ball.size > canvas.width) {
        player1Score++;
        updateScoreboard();
        resetBall();
    }
}

function updateAI() {
    const config = gameState.currentConfig;
    const computerCenter = computerPaddle.y + computerPaddle.height / 2;
    const ballPredictedY = ball.y + (ball.dy * 20); // Predict ball position
    
    if (computerCenter < ballPredictedY - config.aiDeadZone) {
        computerPaddle.y = Math.min(canvas.height - computerPaddle.height, computerPaddle.y + computerPaddle.speed);
    } else if (computerCenter > ballPredictedY + config.aiDeadZone) {
        computerPaddle.y = Math.max(0, computerPaddle.y - computerPaddle.speed);
    }
}

function checkPaddleCollision() {
    const config = gameState.currentConfig;
    const MAX_DY = config.maxBallDy;
    
    // Player paddle collision
    if (
        ball.x - ball.size < playerPaddle.x + playerPaddle.width &&
        ball.y > playerPaddle.y &&
        ball.y < playerPaddle.y + playerPaddle.height
    ) {
        ball.dx = -ball.dx;
        ball.x = playerPaddle.x + playerPaddle.width + ball.size;
        
        const hitPos = (ball.y - playerPaddle.y) / playerPaddle.height - 0.5;
        ball.dy = Math.max(-MAX_DY, Math.min(MAX_DY, hitPos * 8));
        
        // Increase ball speed slightly
        ball.speed *= config.ballSpeedIncrease;
        ball.dx = (ball.dx > 0 ? 1 : -1) * Math.abs(ball.dx) * (ball.speed / ball.initialSpeed);
    }
    
    // Computer paddle collision
    if (
        ball.x + ball.size > computerPaddle.x &&
        ball.y > computerPaddle.y &&
        ball.y < computerPaddle.y + computerPaddle.height
    ) {
        ball.dx = -ball.dx;
        ball.x = computerPaddle.x - ball.size;
        
        const hitPos = (ball.y - computerPaddle.y) / computerPaddle.height - 0.5;
        ball.dy = Math.max(-MAX_DY, Math.min(MAX_DY, hitPos * 8));
        
        // Increase ball speed slightly
        ball.speed *= config.ballSpeedIncrease;
        ball.dx = (ball.dx > 0 ? 1 : -1) * Math.abs(ball.dx) * (ball.speed / ball.initialSpeed);
    }
}

// ============================================
// RENDERING
// ============================================

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.strokeStyle = '#00ff88';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height);
    ctx.fillRect(computerPaddle.x, computerPaddle.y, computerPaddle.width, computerPaddle.height);
    
    // Draw ball
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
}

// ============================================
// GAME STATE MANAGEMENT
// ============================================

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = ball.initialSpeed;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.initialSpeed;
    ball.dy = (Math.random() - 0.5) * ball.initialSpeed;
    
    // Ensure minimum vertical movement
    if (Math.abs(ball.dy) < 2) {
        ball.dy = Math.random() > 0.5 ? 2 : -2;
    }
}

function resetGame() {
    player1Score = 0;
    player2Score = 0;
    gameState.isRunning = false;
    gameState.isPaused = false;
    
    playerPaddle.y = canvas.height / 2 - paddleHeight / 2;
    computerPaddle.y = canvas.height / 2 - paddleHeight / 2;
    
    updateScoreboard();
    resetBall();
    updateGameStatus();
}

function togglePause() {
    if (gameState.isRunning) {
        gameState.isPaused = !gameState.isPaused;
        document.getElementById('pauseOverlay').style.display = gameState.isPaused ? 'flex' : 'none';
        updateGameStatus();
    }
}

function updateScoreboard() {
    document.getElementById('player1Score').textContent = player1Score;
    document.getElementById('player2Score').textContent = player2Score;
}

function updateGameStatus() {
    const statusEl = document.getElementById('gameStatus');
    if (!gameState.isRunning) {
        statusEl.textContent = 'Ready - Click Start';
    } else if (gameState.isPaused) {
        statusEl.textContent = 'Paused';
    } else {
        statusEl.textContent = 'Playing';
    }
}

// ============================================
// GAME LOOP
// ============================================

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize and start
gameLoop();
showScreen('menuScreen');