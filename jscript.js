const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gameOverScreen = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const finalWaveDisplay = document.getElementById('final-wave');
const restartBtn = document.getElementById('restart-btn');
const level1Btn = document.getElementById('level1-btn');
const level2Btn = document.getElementById('level2-btn');
const quitBtn = document.getElementById('quit-btn');
const quitBtnGameOver = document.getElementById('quit-btn-gameover');
const menu = document.getElementById('menu');

let tokens = 100;
let health = 100;
let turrets = [];
let monsters = [];
let projectiles = [];
let particles = [];
let powerUps = [];
let gameActive = false;
let gameSpeed = 2;
let frameCount = 0;
let cloudOffset = 0;
let wave = 1;
let spawnRate = 0.02;
let shakeFrames = 0;
let currentLevel = 1;
let achievements = { wave5: false, tokens100: false };
let menuTurret = { x: 600, y: 450, cooldown: 0 };
let menuMonster = { x: 700, y: 450, alive: true };
let teslaCar = { 
    x: 200, // Near farm
    y: 650, // Ground level
    speedX: 1, // Subtle horizontal speed
    directionX: 1, 
    img: new Image() 
};

// Load Tesla car image
teslaCar.img.src = 'https://i.postimg.cc/tRdGW7mw/tesla.png'; // Replace with your Tesla car PNG URL

// Menu controls
level1Btn.addEventListener('click', () => {
    menu.classList.add('hidden');
    currentLevel = 1;
    startGame();
});
level2Btn.addEventListener('click', () => {
    menu.classList.add('hidden');
    currentLevel = 2;
    startGame();
});
quitBtn.addEventListener('click', () => {
    if (window.confirm('Are you sure you want to quit?')) {
        window.close();
        window.location.href = 'about:blank';
    }
});
quitBtnGameOver.addEventListener('click', () => {
    if (window.confirm('Are you sure you want to quit?')) {
        window.close();
        window.location.href = 'about:blank';
    }
});

// Click handling
canvas.addEventListener('click', (e) => {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check power-up collection
    powerUps = powerUps.filter(p => {
        if (Math.hypot(p.x - x, p.y - y) < 20) {
            if (p.type === 'tokens') tokens += 20;
            if (p.type === 'speed') turrets.forEach(t => t.cooldown /= 2);
            return false;
        }
        return true;
    });

    // Place turret or upgrade
    if (y < 50 && x > canvas.width - 400) {
        if (x > canvas.width - 150 && x < canvas.width - 100) upgradeTurrets('range');
        if (x > canvas.width - 80 && x < canvas.width - 30) upgradeTurrets('speed');
    } else if (tokens >= 20 && y < canvas.height - 120) {
        turrets.push({ x, y, range: 200, cooldown: 0, rangeLevel: 1, speedLevel: 1 });
        tokens -= 20;
    }
});

restartBtn.addEventListener('click', restartGame);

function spawnMonster() {
    const y = Math.random() * (canvas.height - 120);
    monsters.push({ x: canvas.width, y, speed: gameSpeed });
}

function spawnPowerUp() {
    if (Math.random() < 0.01) {
        const x = Math.random() * (canvas.width - 100) + 50;
        const y = Math.random() * (canvas.height - 200) + 50;
        const type = Math.random() < 0.5 ? 'tokens' : 'speed';
        powerUps.push({ x, y, type });
    }
}

function spawnParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x,
            y,
            radius: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 4,
            speedY: (Math.random() - 0.5) * 4,
            life: 30
        });
    }
}

function drawUI() {
    ctx.fillStyle = 'rgba(253, 245, 230, 0.9)';
    ctx.fillRect(canvas.width - 400, 10, 380, 30);
    ctx.fillStyle = '#5D8299';
    ctx.font = '14px Poppins';
    ctx.textAlign = 'left';
    ctx.fillText(`Tokens: ${tokens} | Health: ${health} | Wave: ${wave} | Range: ${turrets.length > 0 ? turrets[0].rangeLevel : 1} (50) | Speed: ${turrets.length > 0 ? turrets[0].speedLevel : 1} (50)${achievements.wave5 ? ' W5' : ''}${achievements.tokens100 ? ' T100' : ''}`, canvas.width - 390, 30);
}

function upgradeTurrets(type) {
    if (tokens >= 50 && turrets.length > 0) {
        tokens -= 50;
        if (type === 'range') {
            turrets.forEach(t => {
                t.rangeLevel++;
                t.range += 50;
            });
        } else if (type === 'speed') {
            turrets.forEach(t => {
                t.speedLevel++;
                t.cooldown = Math.max(5, t.cooldown - 5);
            });
        }
        drawUI();
    }
}

function checkGameOver() {
    if (health <= 0) {
        gameActive = false;
        finalScoreDisplay.textContent = tokens;
        finalWaveDisplay.textContent = wave;
        gameOverScreen.classList.remove('hidden');
    }
}

function drawBackground() {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
    if (currentLevel === 1) {
        skyGradient.addColorStop(0, '#AED6F1');
        skyGradient.addColorStop(1, '#87CEEB');
    } else {
        skyGradient.addColorStop(0, '#B0C4DE');
        skyGradient.addColorStop(1, '#778899');
    }
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
    cloudOffset = (cloudOffset + (currentLevel === 1 ? 0.5 : 0.8)) % canvas.width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(200 + cloudOffset, 70, 40, 0, Math.PI * 2);
    ctx.arc(240 + cloudOffset, 90, 50, 0, Math.PI * 2);
    ctx.arc(280 + cloudOffset, 70, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(800 - cloudOffset, 100, 45, 0, Math.PI * 2);
    ctx.arc(850 - cloudOffset, 120, 55, 0, Math.PI * 2);
    ctx.arc(900 - cloudOffset, 100, 45, 0, Math.PI * 2);
    ctx.fill();
    const fieldGradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
    if (currentLevel === 1) {
        fieldGradient.addColorStop(0, '#A2D9CE');
        fieldGradient.addColorStop(1, '#76D7C4');
    } else {
        fieldGradient.addColorStop(0, '#8FBC8F');
        fieldGradient.addColorStop(1, '#556B2F');
    }
    ctx.fillStyle = fieldGradient;
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
    ctx.fillStyle = 'rgba(118, 215, 196, 0.3)';
    for (let i = 0; i < 12; i++) {
        ctx.fillRect(i * 120 + Math.sin(frameCount * 0.05 + i) * 30, canvas.height * 0.6, 100, canvas.height * 0.4);
    }
}

function drawFarm() {
    ctx.fillStyle = '#D2691E';
    ctx.fillRect(80, canvas.height - 240, 180, 160);
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(60, canvas.height - 240);
    ctx.lineTo(280, canvas.height - 240);
    ctx.lineTo(170, canvas.height - 320);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(150, canvas.height - 160, 40, 80);
    ctx.fillStyle = '#ADD8E6';
    ctx.fillRect(100, canvas.height - 280, 30, 30);
    ctx.fillRect(210, canvas.height - 280, 30, 30);
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, canvas.height - 280, 30, 30);
    ctx.strokeRect(210, canvas.height - 280, 30, 30);
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(260, canvas.height - 280, 40, 160);
    ctx.beginPath();
    ctx.arc(280, canvas.height - 280, 20, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#A9A9A9';
    ctx.beginPath();
    ctx.arc(280, canvas.height - 280, 15, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#F5F5DC';
    for (let i = 0; i < 12; i++) {
        ctx.fillRect(300 + i * 35, canvas.height - 80, 15, 80);
    }
    ctx.fillRect(300, canvas.height - 55, 385, 5);
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillRect(80, canvas.height - 240, 180, 160);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function drawTurret(x, y, isMenu = false) {
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x - 5, y - 20, 10, 20);
    const gradient = ctx.createRadialGradient(x, y - 30, 5, x, y - 30, 20);
    gradient.addColorStop(0, '#FFFF99');
    gradient.addColorStop(1, '#8FBC8F');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y - 30 + (isMenu ? Math.sin(frameCount * 0.1) * 2 : 0), 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#556B2F';
    ctx.beginPath();
    ctx.arc(x - 5, y - 35, 3, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 35, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function drawMonster(x, y) {
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x - 35, y - 25, 70, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 20, y - 15, 40, 30);
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('$', x, y + 10);
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillRect(x - 35, y - 25, 70, 50);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 20, y - 15, 40, 30);
    ctx.fillStyle = '#FF0000';
    ctx.fillText('$', x, y + 10);
}

function drawTeslaCar() {
    // Update position (horizontal only)
    teslaCar.x += teslaCar.speedX * teslaCar.directionX;

    // Bounce at horizontal boundaries (x: 50-1150)
    if (teslaCar.x < 50) {
        teslaCar.x = 50;
        teslaCar.directionX = 1;
    } else if (teslaCar.x > canvas.width - 50) {
        teslaCar.x = canvas.width - 50;
        teslaCar.directionX = -1;
    }

    // Draw Tesla car (fixed y at 650, 100x50px placeholder size)
    ctx.drawImage(teslaCar.img, teslaCar.x - 50, teslaCar.y - 25, 100, 50);
}

function drawParticles() {
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 215, 0, ${p.life / 30})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;
    });
}

function drawPowerUps() {
    powerUps.forEach(p => {
        ctx.fillStyle = p.type === 'tokens' ? '#FFD700' : '#FF69B4';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = '14px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText(p.type === 'tokens' ? '+20' : 'SPD', p.x, p.y + 5);
    });
}

function drawMenuAnimation() {
    drawTurret(menuTurret.x, menuTurret.y, true);
    if (menuMonster.alive) {
        drawMonster(menuMonster.x, menuMonster.y);
        menuMonster.x -= 1;
        if (menuTurret.cooldown <= 0 && menuMonster.x < menuTurret.x + 200) {
            projectiles.push({
                x: menuTurret.x,
                y: menuTurret.y - 30,
                target: menuMonster,
                speed: 6
            });
            menuTurret.cooldown = 60;
        }
    }
    if (menuMonster.x < 500) menuMonster.alive = false;
}

function gameLoop() {
    frameCount++;

    ctx.save();
    if (shakeFrames > 0) {
        const shakeX = (Math.random() - 0.5) * 5;
        const shakeY = (Math.random() - 0.5) * 5;
        ctx.translate(shakeX, shakeY);
        shakeFrames--;
    }

    drawBackground();
    if (!gameActive) drawMenuAnimation();

    if (gameActive) {
        drawFarm();
        drawTeslaCar(); // Draw Tesla car on ground near farm

        turrets.forEach(turret => {
            drawTurret(turret.x, turret.y);

            if (turret.cooldown <= 0) {
                let target = null;
                let minDist = turret.range;
                monsters.forEach(monster => {
                    const dist = Math.hypot(monster.x - turret.x, monster.y - turret.y);
                    if (dist < minDist) {
                        minDist = dist;
                        target = monster;
                    }
                });
                if (target) {
                    projectiles.push({
                        x: turret.x,
                        y: turret.y - 30,
                        target,
                        speed: 6
                    });
                    turret.cooldown = 30 / turret.speedLevel;
                }
            } else {
                turret.cooldown--;
            }
        });

        monsters = monsters.filter(monster => {
            monster.x -= monster.speed;
            drawMonster(monster.x, monster.y);

            if (monster.x < 340) {
                health -= 10;
                shakeFrames = 10;
                drawUI();
                checkGameOver();
                return false;
            }
            return true;
        });

        projectiles = projectiles.filter(proj => {
            const dx = proj.target.x - proj.x;
            const dy = proj.target.y - proj.y;
            const dist = Math.hypot(dx, dy);
            if (dist < proj.speed) {
                tokens += Math.random() < 0.2 ? 10 : 5;
                spawnParticles(proj.target.x, proj.target.y);
                drawUI();
                monsters = monsters.filter(m => m !== proj.target);
                return false;
            }
            proj.x += (dx / dist) * proj.speed;
            proj.y += (dy / dist) * proj.speed;
            const gradient = ctx.createRadialGradient(proj.x, proj.y, 2, proj.x, proj.y, 10);
            gradient.addColorStop(0, '#FFFF99');
            gradient.addColorStop(1, '#FF6F61');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 111, 97, 0.5)';
            ctx.beginPath();
            ctx.arc(proj.x - 7, proj.y - 7, 8, 0, Math.PI * 2);
            ctx.fill();
            return true;
        });

        if (frameCount % 600 === 0) {
            wave++;
            gameSpeed += currentLevel === 1 ? 0.5 : 0.8;
            spawnRate += currentLevel === 1 ? 0.005 : 0.008;
            if (wave >= 5) achievements.wave5 = true;
            drawUI();
        }

        if (tokens >= 100) achievements.tokens100 = true;

        if (Math.random() < spawnRate) spawnMonster();
        spawnPowerUp();
        drawPowerUps();
    }

    drawParticles();
    if (gameActive) drawUI();

    ctx.restore();

    requestAnimationFrame(gameLoop);
}

function restartGame() {
    tokens = 100;
    health = 100;
    turrets = [];
    monsters = [];
    projectiles = [];
    particles = [];
    powerUps = [];
    gameSpeed = currentLevel === 1 ? 2 : 3;
    wave = 1;
    spawnRate = currentLevel === 1 ? 0.02 : 0.03;
    gameActive = true;
    teslaCar.x = 200; // Reset Tesla near farm
    teslaCar.y = 650; // Fixed ground level
    teslaCar.directionX = 1;
    gameOverScreen.classList.add('hidden');
    gameLoop();
}

function startGame() {
    tokens = 100;
    health = 100;
    turrets = [];
    monsters = [];
    projectiles = [];
    particles = [];
    powerUps = [];
    gameSpeed = currentLevel === 1 ? 2 : 3;
    wave = 1;
    spawnRate = currentLevel === 1 ? 0.02 : 0.03;
    gameActive = true;
    teslaCar.x = 200; // Start Tesla near farm
    teslaCar.y = 650; // Fixed ground level
    teslaCar.directionX = 1;
    gameOverScreen.classList.add('hidden');
    menuMonster = { x: 700, y: 450, alive: true };
    gameLoop();
}

// Initial render for menu animation
gameLoop();