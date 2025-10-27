// Pac-Man: The Core Chase - Simple Implementation
const canvas = document.getElementById('gameCanvas');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const messageEl = document.getElementById('message');
let ctx;

// Maze layout: 0 = empty, 1 = wall, 2 = dot
// 12x12 more twisty map
const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,1,2,2,2,1,2,2,1],
    [1,2,1,2,1,2,1,2,1,2,1,1],
    [1,2,1,2,2,2,2,2,1,2,2,1],
    [1,2,1,1,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,2,1,1,1,2,1],
    [1,2,2,1,2,2,2,2,2,1,2,1],
    [1,2,1,1,1,1,1,1,2,1,2,1],
    [1,2,2,2,2,2,2,1,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1]
];
const rows = maze.length;
const cols = maze[0].length;
let tileSize;

let score = 0;
let lives = 3;
let gameOver = false;
let win = false;

// Pac-Man
let pacman = { x: 1, y: 1, dir: 'right', nextDir: 'right' };
// Ghosts: red, pink, cyan, orange
let ghosts = [
    { x: cols-2, y: rows-2, color: '#ff0000', name: 'red' },
    { x: cols-2, y: 1, color: '#ffb8ff', name: 'pink' },
    { x: 1, y: rows-2, color: '#00ffff', name: 'cyan' },
    { x: Math.floor(cols/2), y: Math.floor(rows/2), color: '#ffb852', name: 'orange' }
];

function drawMaze() {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (maze[y][x] === 1) {
                ctx.fillStyle = '#2222cc'; // Pac-Man wall blue
                ctx.fillRect(Math.floor(x * tileSize), Math.floor(y * tileSize), Math.ceil(tileSize), Math.ceil(tileSize));
            } else {
                ctx.fillStyle = '#000'; // Pac-Man background black
                ctx.fillRect(Math.floor(x * tileSize), Math.floor(y * tileSize), Math.ceil(tileSize), Math.ceil(tileSize));
                if (maze[y][x] === 2) {
                    // draw pixel-style dot (small square)
                    const ds = Math.max(2, Math.floor(tileSize / 6));
                    const dx = Math.floor(x * tileSize + (tileSize - ds) / 2);
                    const dy = Math.floor(y * tileSize + (tileSize - ds) / 2);
                    ctx.fillStyle = '#fff'; // Pac-Man dot white
                    ctx.fillRect(dx, dy, ds, ds);
                }
            }
        }
    }
}

function drawPacman() {
    // Animate mouth open/close
    const now = Date.now();
    const mouthOpen = Math.abs(Math.sin(now / 150)) * 0.35 + 0.15;
    let startAngle = mouthOpen;
    let endAngle = 2 * Math.PI - mouthOpen;
    // Rotate mouth based on direction
    let rotation = 0;
    switch (pacman.dir) {
        case 'right': rotation = 0; break;
        case 'down': rotation = Math.PI / 2; break;
        case 'left': rotation = Math.PI; break;
        case 'up': rotation = -Math.PI / 2; break;
    }
    ctx.save();
    ctx.translate(pacman.x * tileSize + tileSize/2, pacman.y * tileSize + tileSize/2);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.arc(0, 0, tileSize/2 - 2, startAngle, endAngle);
    ctx.lineTo(0, 0);
    ctx.fillStyle = '#ffe800';
    ctx.fill();
    ctx.restore();
}

function drawGhost(ghost) {
    ctx.beginPath();
    ctx.arc(ghost.x * tileSize + tileSize/2, ghost.y * tileSize + tileSize/2, tileSize/2 - 2, Math.PI, 2 * Math.PI);
    ctx.lineTo(ghost.x * tileSize + tileSize/2 + tileSize/2 - 2, ghost.y * tileSize + tileSize/2 + tileSize/4);
    ctx.lineTo(ghost.x * tileSize + tileSize/2 - tileSize/2 + 2, ghost.y * tileSize + tileSize/2 + tileSize/4);
    ctx.closePath();
    ctx.fillStyle = ghost.color;
    ctx.fill();
    // Eyes
    ctx.beginPath();
    ctx.arc(ghost.x * tileSize + tileSize/2 - tileSize/6, ghost.y * tileSize + tileSize/2 - tileSize/8, tileSize/8, 0, Math.PI*2);
    ctx.arc(ghost.x * tileSize + tileSize/2 + tileSize/6, ghost.y * tileSize + tileSize/2 - tileSize/8, tileSize/8, 0, Math.PI*2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ghost.x * tileSize + tileSize/2 - tileSize/6, ghost.y * tileSize + tileSize/2 - tileSize/8, tileSize/16, 0, Math.PI*2);
    ctx.arc(ghost.x * tileSize + tileSize/2 + tileSize/6, ghost.y * tileSize + tileSize/2 - tileSize/8, tileSize/16, 0, Math.PI*2);
    ctx.fillStyle = '#2222cc';
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze();
    drawPacman();
    ghosts.forEach(drawGhost);
}

function movePacman(dir) {
    let dx = 0, dy = 0;
    switch(dir) {
        case 'up': dy = -1; break;
        case 'down': dy = 1; break;
        case 'left': dx = -1; break;
        case 'right': dx = 1; break;
    }
    const nx = pacman.x + dx;
    const ny = pacman.y + dy;
    if (maze[ny][nx] !== 1) {
        pacman.x = nx;
        pacman.y = ny;
        eatDot();
        pacman.dir = dir;
    }
}

function eatDot() {
    if (maze[pacman.y][pacman.x] === 2) {
        maze[pacman.y][pacman.x] = 0;
        score += 10;
        scoreEl.textContent = score;
        if (isWin()) {
            win = true;
            messageEl.textContent = 'You Win!';
        }
    }
}

function isWin() {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (maze[y][x] === 2) return false;
        }
    }
    return true;
}

function moveGhosts() {
    ghosts.forEach(ghost => {
        // More realistic: ghosts sometimes move randomly, sometimes chase
        let chase = Math.random() > 0.3; // 70% chase, 30% random
        let dx = 0, dy = 0;
        if (chase) {
            if (ghost.x < pacman.x) dx = 1;
            else if (ghost.x > pacman.x) dx = -1;
            if (ghost.y < pacman.y) dy = 1;
            else if (ghost.y > pacman.y) dy = -1;
        } else {
            // Random direction
            const dirs = [
                {dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1}
            ];
            const valid = dirs.filter(d => maze[ghost.y + d.dy][ghost.x + d.dx] !== 1);
            if (valid.length > 0) {
                const pick = valid[Math.floor(Math.random() * valid.length)];
                dx = pick.dx; dy = pick.dy;
            }
        }
        // Try to move in x direction first
        if (dx !== 0 && maze[ghost.y][ghost.x + dx] !== 1) ghost.x += dx;
        else if (dy !== 0 && maze[ghost.y + dy][ghost.x] !== 1) ghost.y += dy;
    });
}

function checkCollision() {
    // More realistic: collision if Pac-Man overlaps ghost center
    let hit = ghosts.some(ghost => {
        let px = pacman.x * tileSize + tileSize/2;
        let py = pacman.y * tileSize + tileSize/2;
        let gx = ghost.x * tileSize + tileSize/2;
        let gy = ghost.y * tileSize + tileSize/2;
        let dist = Math.sqrt((px-gx)*(px-gx) + (py-gy)*(py-gy));
        return dist < tileSize/2;
    });
    if (hit) {
        lives--;
        livesEl.textContent = lives;
        if (lives <= 0) {
            gameOver = true;
            messageEl.textContent = 'Game Over!';
        } else {
            // Reset positions
            pacman.x = 1; pacman.y = 1;
            ghosts[0].x = cols-2; ghosts[0].y = rows-2;
            ghosts[1].x = cols-2; ghosts[1].y = 1;
            ghosts[2].x = 1; ghosts[2].y = rows-2;
            ghosts[3].x = Math.floor(cols/2); ghosts[3].y = Math.floor(rows/2);
        }
    }
}

let lastGhostMove = 0;
const ghostMoveInterval = 300; // ms, slows down the game

function gameLoop(ts) {
    if (!ctx) return;
    if (!gameOver && !win) {
        if (!lastGhostMove) lastGhostMove = ts;
        if (ts - lastGhostMove > ghostMoveInterval) {
            moveGhosts();
            checkCollision();
            lastGhostMove = ts;
        }
        draw();
        requestAnimationFrame(gameLoop);
    } else {
        draw();
    }
}

document.addEventListener('keydown', (e) => {
    if (gameOver || win) return;
    switch(e.key) {
        case 'ArrowUp': pacman.nextDir = 'up'; break;
        case 'ArrowDown': pacman.nextDir = 'down'; break;
        case 'ArrowLeft': pacman.nextDir = 'left'; break;
        case 'ArrowRight': pacman.nextDir = 'right'; break;
    }
});
let lastPacmanMove = 0;
const pacmanMoveInterval = 150; // ms, controls Pac-Man speed

function gameLoop(ts) {
    if (!ctx) return;
    if (!gameOver && !win) {
        if (!lastPacmanMove) lastPacmanMove = ts;
        if (ts - lastPacmanMove > pacmanMoveInterval) {
            // Try to move in nextDir, else keep moving in current dir
            let dx = 0, dy = 0;
            switch(pacman.nextDir) {
                case 'up': dy = -1; break;
                case 'down': dy = 1; break;
                case 'left': dx = -1; break;
                case 'right': dx = 1; break;
            }
            const nx = pacman.x + dx;
            const ny = pacman.y + dy;
            if (maze[ny][nx] !== 1) {
                movePacman(pacman.nextDir);
            } else {
                movePacman(pacman.dir);
            }
            lastPacmanMove = ts;
        }
        if (!lastGhostMove) lastGhostMove = ts;
        if (ts - lastGhostMove > ghostMoveInterval) {
            moveGhosts();
            checkCollision();
            lastGhostMove = ts;
        }
        draw();
        requestAnimationFrame(gameLoop);
    } else {
        draw();
    }
}

function resizeCanvas() {
    // Fit canvas to parent
    const wrapper = document.getElementById('canvas-wrapper');
    const w = wrapper.offsetWidth;
    const h = wrapper.offsetHeight;
    canvas.width = w;
    canvas.height = h;
    tileSize = Math.min(w / cols, h / rows);
    ctx = canvas.getContext('2d');
    // Prefer crisp, pixelated rendering
    if (ctx) ctx.imageSmoothingEnabled = false;
    draw();
}

window.addEventListener('resize', resizeCanvas);
document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    draw();
    requestAnimationFrame(gameLoop);
});
