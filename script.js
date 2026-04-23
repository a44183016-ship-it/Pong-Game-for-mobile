// Game variables
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size responsively
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game objects
const paddleWidth = 10;
const paddleHeight = 80;
const ballSize = 8;

const playerPaddle = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 6
};

const computerPaddle = {
    x: canvas.width - 20,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 4.5
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: 5,
    dy: 5,
    size: ballSize,
    speed: 5
};

let playerScore = 0;
let computerScore = 0;
let gameRunning = false;
let mouseY = canvas.height / 2;

// Input handling
const keys = {};
const touches = {};

// Keyboard input
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Mouse input
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

// Touch input
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

// Mobile button controls
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

// Mouse button controls (for testing on desktop)
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

// Button controls
document.getElementById('startBtn').addEventListener('click', () => {
    gameRunning = true;
});

document.getElementById('resetBtn').addEventListener('click', resetGame);

// Update game state
function update() {
    if (!gameRunning) return;

    // Player paddle movement with keyboard, mouse, or touch buttons
    if (keys['ArrowUp'] || touches['up']) {
        if (playerPaddle.y > 0) {
            playerPaddle.y -= playerPaddle.speed;
        }
    } else if (keys['ArrowDown'] || touches['down']) {
        if (playerPaddle.y < canvas.height - playerPaddle.height) {
            playerPaddle.y += playerPaddle.speed;
        }
    } else {
        // Use mouse/touch Y position
        const paddleCenter = playerPaddle.height / 2;
        const targetY = mouseY - paddleCenter;
        
        if (targetY < playerPaddle.y) {
            playerPaddle.y = Math.max(0, playerPaddle.y - playerPaddle.speed);
        } else if (targetY > playerPaddle.y) {
            playerPaddle.y = Math.min(canvas.height - playerPaddle.height, playerPaddle.y + playerPaddle.speed);
        }
    }

    // Computer paddle AI
    const computerCenter = computerPaddle.y + computerPaddle.height / 2;
    if (computerCenter < ball.y - 35) {
        computerPaddle.y = Math.min(canvas.height - computerPaddle.height, computerPaddle.y + computerPaddle.speed);
    } else if (computerCenter > ball.y + 35) {
        computerPaddle.y = Math.max(0, computerPaddle.y - computerPaddle.speed);
    }

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom walls
    if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.size, Math.min(canvas.height - ball.size, ball.y));
    }

    // Ball collision with paddles
    if (
        ball.x - ball.size < playerPaddle.x + playerPaddle.width &&
        ball.y > playerPaddle.y &&
        ball.y < playerPaddle.y + playerPaddle.height
    ) {
        ball.dx = -ball.dx;
        ball.x = playerPaddle.x + playerPaddle.width + ball.size;
        
        // Add spin based on where ball hits paddle
        const hitPos = (ball.y - playerPaddle.y) / playerPaddle.height - 0.5;
        ball.dy = hitPos * 8;
    }

    if (
        ball.x + ball.size > computerPaddle.x &&
        ball.y > computerPaddle.y &&
        ball.y < computerPaddle.y + computerPaddle.height
    ) {
        ball.dx = -ball.dx;
        ball.x = computerPaddle.x - ball.size;
        
        // Add spin based on where ball hits paddle
        const hitPos = (ball.y - computerPaddle.y) / computerPaddle.height - 0.5;
        ball.dy = hitPos * 8;
    }

    // Score points and reset ball
    if (ball.x - ball.size < 0) {
        computerScore++;
        document.getElementById('computerScore').textContent = computerScore;
        resetBall();
    }

    if (ball.x + ball.size > canvas.width) {
        playerScore++;
        document.getElementById('playerScore').textContent = playerScore;
        resetBall();
    }
}

// Draw game
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

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = (Math.random() - 0.5) * ball.speed;
}

function resetGame() {
    playerScore = 0;
    computerScore = 0;
    gameRunning = false;
    
    playerPaddle.y = canvas.height / 2 - paddleHeight / 2;
    computerPaddle.y = canvas.height / 2 - paddleHeight / 2;
    
    document.getElementById('playerScore').textContent = '0';
    document.getElementById('computerScore').textContent = '0';
    
    resetBall();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
