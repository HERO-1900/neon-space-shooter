/**
 * Neon Space Shooter - Game Engine
 * A modern HTML5 Canvas space shooter game
 */

// Canvas setup
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game state
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    HIGH_SCORES: 'high_scores'
};

let gameState = GAME_STATE.MENU;
let score = 0;
let lives = 3;
let level = 1;
let frames = 0;

// High Score Manager
class HighScoreManager {
    constructor(maxEntries = 10) {
        this.maxEntries = maxEntries;
        this.scores = this.load();
    }

    load() {
        try {
            const data = localStorage.getItem('neonSpaceShooter_highScores');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Failed to load high scores:', e);
            return [];
        }
    }

    save() {
        try {
            localStorage.setItem('neonSpaceShooter_highScores', JSON.stringify(this.scores));
        } catch (e) {
            console.warn('Failed to save high scores:', e);
        }
    }

    addScore(score, playerName = 'PLAYER', levelReached = 1) {
        const entry = {
            score: score,
            name: playerName.toUpperCase().slice(0, 10),
            date: new Date().toISOString().split('T')[0],
            level: levelReached
        };

        this.scores.push(entry);
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, this.maxEntries);
        this.save();

        return this.getRank(score);
    }

    getRank(score) {
        return this.scores.findIndex(entry => entry.score === score) + 1;
    }

    isHighScore(score) {
        if (this.scores.length < this.maxEntries) return true;
        return score > this.scores[this.scores.length - 1].score;
    }

    getTopScores(count = 5) {
        return this.scores.slice(0, count);
    }

    clear() {
        this.scores = [];
        try {
            localStorage.removeItem('neonSpaceShooter_highScores');
        } catch (e) {
            console.warn('Failed to clear high scores:', e);
        }
    }

    formatScore(score) {
        return score.toString().padStart(7, '0');
    }
}

const highScoreManager = new HighScoreManager();

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
});
document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Utility functions
function random(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Particle system for explosions
class Particle {
    constructor(x, y, color, speed = 3) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * speed * 2;
        this.vy = (Math.random() - 0.5) * speed * 2;
        this.life = 1.0;
        this.decay = random(0.02, 0.05);
        this.color = color;
        this.size = random(2, 5);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.98;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

let particles = [];

function createExplosion(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Player ship
class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.width = 40;
        this.height = 40;
        this.speed = 6;
        this.shootCooldown = 0;
        this.invulnerable = 0;
    }

    update() {
        // Movement
        if (keys['ArrowLeft'] && this.x > this.width / 2) {
            this.x -= this.speed;
        }
        if (keys['ArrowRight'] && this.x < canvas.width - this.width / 2) {
            this.x += this.speed;
        }
        if (keys['ArrowUp'] && this.y > this.height / 2) {
            this.y -= this.speed;
        }
        if (keys['ArrowDown'] && this.y < canvas.height - this.height / 2) {
            this.y += this.speed;
        }

        // Shooting
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (keys['Space'] && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = 10;
        }

        // Invulnerability
        if (this.invulnerable > 0) this.invulnerable--;
    }

    shoot() {
        bullets.push(new Bullet(this.x, this.y - 20, -10, 'player'));
        audio.playShoot();
        // Dual shot at higher levels
        if (level >= 3) {
            bullets.push(new Bullet(this.x - 15, this.y - 10, -10, 'player'));
            bullets.push(new Bullet(this.x + 15, this.y - 10, -10, 'player'));
        }
    }

    draw() {
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            return; // Flicker effect when invulnerable
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Ship glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ff88';
        
        // Ship body
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-15, 15);
        ctx.lineTo(0, 10);
        ctx.lineTo(15, 15);
        ctx.closePath();
        ctx.fill();
        
        // Engine flame
        ctx.shadowColor = '#ff6600';
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(-8, 15);
        ctx.lineTo(0, 25 + Math.random() * 10);
        ctx.lineTo(8, 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    hit() {
        if (this.invulnerable <= 0) {
            lives--;
            this.invulnerable = 120; // 2 seconds at 60fps
            createExplosion(this.x, this.y, '#00ff88', 20);
            audio.playHit();
            updateUI();
            
            if (lives <= 0) {
                gameOver();
            }
        }
    }
}

// Enemy types
const ENEMY_TYPES = {
    BASIC: { color: '#ff3366', hp: 1, speed: 2, score: 10, size: 20 },
    FAST: { color: '#ffcc00', hp: 1, speed: 4, score: 20, size: 15 },
    TANK: { color: '#9933ff', hp: 3, speed: 1, score: 50, size: 30 },
    BOSS: { color: '#ff0066', hp: 20, speed: 0.5, score: 500, size: 60 }
};

class Enemy {
    constructor(type = 'BASIC') {
        this.type = type;
        const config = ENEMY_TYPES[type];
        this.x = random(50, canvas.width - 50);
        this.y = -50;
        this.size = config.size;
        this.speed = config.speed + (level * 0.3);
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.score = config.score;
        this.color = config.color;
        this.shootCooldown = random(60, 120);
        this.angle = 0;
    }

    update() {
        this.y += this.speed;
        this.angle += 0.05;
        
        // Different movement patterns
        if (this.type === 'FAST') {
            this.x += Math.sin(this.angle) * 3;
        } else if (this.type === 'TANK') {
            this.x += Math.sin(this.angle * 0.5) * 1;
        }

        // Shooting
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.shootCooldown <= 0 && this.y > 0 && this.y < canvas.height - 200) {
            bullets.push(new Bullet(this.x, this.y + this.size, 5, 'enemy'));
            this.shootCooldown = random(60, 120);
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        if (this.type === 'BASIC') {
            ctx.beginPath();
            ctx.moveTo(0, this.size);
            ctx.lineTo(-this.size, -this.size);
            ctx.lineTo(this.size, -this.size);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'FAST') {
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size, this.size * 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'TANK') {
            ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
        } else if (this.type === 'BOSS') {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
            // HP bar
            ctx.fillStyle = '#333';
            ctx.fillRect(-this.size, -this.size - 10, this.size * 2, 5);
            ctx.fillStyle = '#ff3366';
            ctx.fillRect(-this.size, -this.size - 10, this.size * 2 * (this.hp / this.maxHp), 5);
        }

        ctx.restore();
    }

    hit() {
        this.hp--;
        createExplosion(this.x, this.y, this.color, 5);
        if (this.hp <= 0) {
            score += this.score;
            createExplosion(this.x, this.y, this.color, 25);
            audio.playExplosion(this.type === 'BOSS' ? 'large' : 'small');
            updateUI();
            return true;
        }
        return false;
    }
}

// Bullet class
class Bullet {
    constructor(x, y, speed, owner) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.owner = owner; // 'player' or 'enemy'
        this.width = 4;
        this.height = 12;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.owner === 'player' ? '#00ffff' : '#ff3366';
        ctx.fillStyle = this.owner === 'player' ? '#00ffff' : '#ff3366';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.restore();
    }
}

// Power-up class
class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.speed = 2;
        this.type = Math.random() < 0.5 ? 'health' : 'weapon';
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.type === 'health' ? '#00ff00' : '#ffaa00';
        ctx.fillStyle = this.type === 'health' ? '#00ff00' : '#ffaa00';
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type === 'health' ? '♥' : 'W', 0, 4);
        ctx.restore();
    }
}

// Game objects
let player;
let enemies = [];
let bullets = [];
let powerups = [];
let enemySpawnTimer = 0;
let bossSpawned = false;

// Initialize game
function init() {
    player = new Player();
    enemies = [];
    bullets = [];
    particles = [];
    powerups = [];
    score = 0;
    lives = 3;
    level = 1;
    frames = 0;
    enemySpawnTimer = 0;
    bossSpawned = false;
    updateUI();
}

// Spawn enemies
function spawnEnemies() {
    enemySpawnTimer--;
    
    if (enemySpawnTimer <= 0) {
        const spawnRate = Math.max(30, 90 - level * 5);
        enemySpawnTimer = spawnRate;
        
        // Determine enemy type based on level and random chance
        let type = 'BASIC';
        const rand = Math.random();
        
        if (level >= 5 && rand < 0.1) {
            type = 'BOSS';
        } else if (level >= 3 && rand < 0.3) {
            type = 'TANK';
        } else if (level >= 2 && rand < 0.5) {
            type = 'FAST';
        }
        
        enemies.push(new Enemy(type));
    }

    // Level progression
    if (score > level * 500) {
        level++;
        updateUI();
    }
}

// Collision detection
function checkCollisions() {
    // Bullets hitting enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        if (bullet.owner === 'player') {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (distance(bullet.x, bullet.y, enemy.x, enemy.y) < enemy.size + 5) {
                    bullets.splice(i, 1);
                    if (enemy.hit()) {
                        // Drop power-up chance
                        if (Math.random() < 0.15) {
                            powerups.push(new PowerUp(enemy.x, enemy.y));
                        }
                        enemies.splice(j, 1);
                    }
                    break;
                }
            }
        } else {
            // Enemy bullets hitting player
            if (distance(bullet.x, bullet.y, player.x, player.y) < 20) {
                bullets.splice(i, 1);
                player.hit();
            }
        }
    }

    // Enemies colliding with player
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (distance(enemy.x, enemy.y, player.x, player.y) < enemy.size + 20) {
            enemies.splice(i, 1);
            createExplosion(enemy.x, enemy.y, enemy.color, 15);
            player.hit();
        }
    }

    // Power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        if (distance(powerup.x, powerup.y, player.x, player.y) < 25) {
            if (powerup.type === 'health' && lives < 5) {
                lives++;
            }
            // Weapon upgrade is automatic with level
            powerups.splice(i, 1);
            audio.playPowerUp();
            updateUI();
        }
    }
}

// Update game objects
function update() {
    if (gameState !== GAME_STATE.PLAYING) return;

    frames++;
    player.update();
    
    spawnEnemies();
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();
        if (enemies[i].y > canvas.height + 50) {
            enemies.splice(i, 1);
        }
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (bullets[i].y < -20 || bullets[i].y > canvas.height + 20) {
            bullets.splice(i, 1);
        }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // Update power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].update();
        if (powerups[i].y > canvas.height + 50) {
            powerups.splice(i, 1);
        }
    }
    
    checkCollisions();
}

// Draw everything
function draw() {
    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(10, 10, 10, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw starfield
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
        const x = (frames * 0.5 + i * 73) % canvas.width;
        const y = (frames * 0.3 + i * 37) % canvas.height;
        const size = (i % 3) + 1;
        ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
    
    // Draw game objects
    powerups.forEach(p => p.draw());
    bullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
    particles.forEach(p => p.draw());
    
    if (gameState === GAME_STATE.PLAYING || gameState === GAME_STATE.PAUSED) {
        player.draw();
    }
}

// Game loop
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// UI updates
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
    
    // Update high score display
    const topScores = highScoreManager.getTopScores(1);
    const highScore = topScores.length > 0 ? topScores[0].score : 0;
    document.getElementById('high-score').textContent = highScoreManager.formatScore(highScore);
}

// Game state functions
function startGame() {
    audio.init();
    audio.startBGM();
    document.getElementById('start-screen').style.display = 'none';
    init();
    gameState = GAME_STATE.PLAYING;
}

function gameOver() {
    gameState = GAME_STATE.GAME_OVER;
    audio.playGameOver();
    audio.stopBGM();
    
    // Check if high score
    if (highScoreManager.isHighScore(score)) {
        showHighScoreEntry();
    } else {
        document.getElementById('final-score').textContent = score;
        document.getElementById('game-over').style.display = 'block';
    }
}

function showHighScoreEntry() {
    document.getElementById('high-score-entry').style.display = 'block';
    document.getElementById('new-high-score').textContent = score;
    document.getElementById('player-name-input').value = 'PLAYER';
    document.getElementById('player-name-input').focus();
    document.getElementById('player-name-input').select();
}

function submitHighScore() {
    const nameInput = document.getElementById('player-name-input');
    const playerName = nameInput.value.trim() || 'PLAYER';
    const rank = highScoreManager.addScore(score, playerName, level);
    
    document.getElementById('high-score-entry').style.display = 'none';
    showHighScores(rank);
}

function showHighScores(highlightRank = null) {
    gameState = GAME_STATE.HIGH_SCORES;
    const container = document.getElementById('high-scores');
    const listEl = document.getElementById('high-scores-list');
    
    // Build high scores table
    const topScores = highScoreManager.getTopScores(10);
    let html = '';
    
    if (topScores.length === 0) {
        html = '<div class="no-scores">No high scores yet. Be the first!</div>';
    } else {
        html = '<table class="high-scores-table">';
        html += '<tr><th>RANK</th><th>SCORE</th><th>NAME</th><th>LVL</th><th>DATE</th></tr>';
        
        topScores.forEach((entry, index) => {
            const rank = index + 1;
            const isHighlighted = rank === highlightRank;
            const rowClass = isHighlighted ? 'highlight' : '';
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            
            html += `<tr class="${rowClass}">`;
            html += `<td class="rank">${rankEmoji}</td>`;
            html += `<td class="score">${highScoreManager.formatScore(entry.score)}</td>`;
            html += `<td class="name">${entry.name}</td>`;
            html += `<td class="level">${entry.level}</td>`;
            html += `<td class="date">${entry.date}</td>`;
            html += '</tr>';
        });
        
        html += '</table>';
    }
    
    listEl.innerHTML = html;
    container.style.display = 'block';
}

function hideHighScores() {
    document.getElementById('high-scores').style.display = 'none';
    document.getElementById('game-over').style.display = 'block';
}

function restartGame() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('high-scores').style.display = 'none';
    audio.startBGM();
    init();
    gameState = GAME_STATE.PLAYING;
}

// Audio toggle function
function toggleAudio() {
    const isEnabled = audio.toggle();
    const btn = document.getElementById('mute-btn');
    if (isEnabled) {
        btn.textContent = '🔊 AUDIO ON';
        btn.classList.remove('muted');
    } else {
        btn.textContent = '🔇 AUDIO OFF';
        btn.classList.add('muted');
    }
}

// Start the game loop
loop();

// Pause on tab visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState === GAME_STATE.PLAYING) {
        gameState = GAME_STATE.PAUSED;
    } else if (!document.hidden && gameState === GAME_STATE.PAUSED) {
        gameState = GAME_STATE.PLAYING;
    }
});

// Handle Enter key for high score name input
document.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' && document.getElementById('high-score-entry').style.display === 'block') {
        const input = document.getElementById('player-name-input');
        if (document.activeElement === input) {
            submitHighScore();
        }
    }
});
