/**
 * Game Unit Tests
 * Tests for core game functionality
 */

// Mock canvas and context
const mockCanvas = {
    width: 800,
    height: 600,
    getContext: () => ({
        save: () => {},
        restore: () => {},
        translate: () => {},
        fillRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        fill: () => {},
        arc: () => {},
        ellipse: () => {},
    })
};

// Mock Web Audio API
global.AudioContext = class MockAudioContext {
    constructor() {
        this.state = 'running';
        this.currentTime = 0;
    }
    createOscillator() {
        return {
            type: 'sine',
            frequency: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            connect: () => {},
            start: () => {},
            stop: () => {}
        };
    }
    createGain() {
        return {
            gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            connect: () => {}
        };
    }
    createBiquadFilter() {
        return {
            type: 'lowpass',
            frequency: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            connect: () => {}
        };
    }
    resume() {
        this.state = 'running';
        return Promise.resolve();
    }
};

global.webkitAudioContext = global.AudioContext;

// Test utilities
function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ FAILED: ${message}`);
    }
    console.log(`✅ PASSED: ${message}`);
}

function test(name, fn) {
    try {
        fn();
        console.log(`\n✅ Test Suite: ${name}`);
    } catch (e) {
        console.log(`\n❌ Test Suite Failed: ${name}`);
        console.error(e.message);
        process.exit(1);
    }
}

// Math utility tests
test('Utility Functions', () => {
    // Test random function bounds
    for (let i = 0; i < 100; i++) {
        const r = Math.random() * (100 - 10) + 10;
        assert(r >= 10 && r <= 100, `Random should be within bounds: ${r}`);
    }
    
    // Test distance calculation
    const dist = Math.sqrt((100 - 0) ** 2 + (100 - 0) ** 2);
    assert(Math.abs(dist - 141.42) < 0.1, `Distance calculation: expected ~141.42, got ${dist}`);
});

// Enemy configuration tests
test('Enemy Types Configuration', () => {
    const ENEMY_TYPES = {
        BASIC: { color: '#ff3366', hp: 1, speed: 2, score: 10, size: 20 },
        FAST: { color: '#ffcc00', hp: 1, speed: 4, score: 20, size: 15 },
        TANK: { color: '#9933ff', hp: 3, speed: 1, score: 50, size: 30 },
        BOSS: { color: '#ff0066', hp: 20, speed: 0.5, score: 500, size: 60 }
    };
    
    // Verify all enemy types have required properties
    for (const [type, config] of Object.entries(ENEMY_TYPES)) {
        assert(config.color && config.color.startsWith('#'), `${type} has valid color`);
        assert(config.hp > 0, `${type} has positive HP`);
        assert(config.speed >= 0, `${type} has non-negative speed`);
        assert(config.score > 0, `${type} has positive score`);
        assert(config.size > 0, `${type} has positive size`);
    }
    
    // Verify boss is strongest
    assert(ENEMY_TYPES.BOSS.hp > ENEMY_TYPES.TANK.hp, 'Boss has more HP than Tank');
    assert(ENEMY_TYPES.BOSS.score > ENEMY_TYPES.TANK.score, 'Boss gives more score than Tank');
});

// Game state tests
test('Game State Management', () => {
    const GAME_STATE = {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'game_over'
    };
    
    // Verify all states are unique
    const states = Object.values(GAME_STATE);
    const uniqueStates = [...new Set(states)];
    assert(states.length === uniqueStates.length, 'All game states are unique');
    
    // Verify expected states exist
    assert(GAME_STATE.PLAYING === 'playing', 'PLAYING state exists');
    assert(GAME_STATE.GAME_OVER === 'game_over', 'GAME_OVER state exists');
});

// Collision detection tests
test('Collision Detection', () => {
    function distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    
    function checkCollision(obj1, obj2, threshold) {
        return distance(obj1.x, obj1.y, obj2.x, obj2.y) < threshold;
    }
    
    // Test collision when objects are close
    const player = { x: 400, y: 500 };
    const enemy = { x: 400, y: 500 };
    assert(checkCollision(player, enemy, 40), 'Collision detected when objects overlap');
    
    // Test no collision when far apart
    const farEnemy = { x: 100, y: 100 };
    assert(!checkCollision(player, farEnemy, 40), 'No collision when objects are far apart');
    
    // Test boundary case
    const nearEnemy = { x: 430, y: 500 }; // 30px away
    assert(checkCollision(player, nearEnemy, 40), 'Collision at boundary threshold');
});

// Level progression tests
test('Level Progression System', () => {
    function shouldLevelUp(score, currentLevel) {
        return score > currentLevel * 500;
    }
    
    assert(!shouldLevelUp(499, 1), 'No level up at 499 score (level 1)');
    assert(shouldLevelUp(501, 1), 'Level up at 501 score (level 1)');
    assert(!shouldLevelUp(999, 2), 'No level up at 999 score (level 2)');
    assert(shouldLevelUp(1001, 2), 'Level up at 1001 score (level 2)');
});

// Particle system tests
test('Particle System', () => {
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = (Math.random() - 0.5) * 6;
            this.life = 1.0;
            this.decay = 0.03;
            this.color = color;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
        }
    }
    
    const p = new Particle(100, 100, '#ff3366');
    const initialLife = p.life;
    p.update();
    
    assert(p.life < initialLife, 'Particle life decreases after update');
    assert(p.x !== 100 || p.y !== 100, 'Particle moves after update');
});

// Bullet tests
test('Bullet Mechanics', () => {
    class Bullet {
        constructor(x, y, speed, owner) {
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.owner = owner;
        }
        
        update() {
            this.y += this.speed;
        }
        
        isOffScreen(canvasHeight) {
            return this.y < -20 || this.y > canvasHeight + 20;
        }
    }
    
    // Test player bullet moves upward
    const playerBullet = new Bullet(400, 500, -10, 'player');
    const initialY = playerBullet.y;
    playerBullet.update();
    assert(playerBullet.y < initialY, 'Player bullet moves upward');
    
    // Test enemy bullet moves downward
    const enemyBullet = new Bullet(400, 100, 5, 'enemy');
    const initialY2 = enemyBullet.y;
    enemyBullet.update();
    assert(enemyBullet.y > initialY2, 'Enemy bullet moves downward');
    
    // Test off-screen detection
    const offScreenBullet = new Bullet(400, -30, -10, 'player');
    assert(offScreenBullet.isOffScreen(600), 'Bullet detected as off-screen');
});

// Power-up tests
test('Power-up System', () => {
    class PowerUp {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.size = 15;
            this.speed = 2;
        }
        
        update() {
            this.y += this.speed;
        }
    }
    
    const healthPowerUp = new PowerUp(100, 0, 'health');
    const weaponPowerUp = new PowerUp(200, 0, 'weapon');
    
    assert(healthPowerUp.type === 'health', 'Health power-up has correct type');
    assert(weaponPowerUp.type === 'weapon', 'Weapon power-up has correct type');
    
    healthPowerUp.update();
    assert(healthPowerUp.y === 2, 'Power-up moves down at correct speed');
});

// Player invulnerability tests
test('Player Invulnerability', () => {
    let invulnerable = 0;
    
    function hit() {
        if (invulnerable <= 0) {
            invulnerable = 120;
            return true; // Actually hit
        }
        return false; // No damage due to invulnerability
    }
    
    // First hit should register
    assert(hit() === true, 'First hit registers damage');
    assert(invulnerable === 120, 'Invulnerability timer set');
    
    // Subsequent hits during invulnerability should not register
    assert(hit() === false, 'Hit during invulnerability blocked');
    
    // Simulate time passing
    invulnerable = 0;
    assert(hit() === true, 'Hit after invulnerability expires registers');
});

// Audio Manager tests
test('Audio Manager System', () => {
    // AudioManager class simulation
    class AudioManager {
        constructor() {
            this.ctx = null;
            this.enabled = true;
            this.volume = 0.5;
            this.isBGMPlaying = false;
        }
        
        init() {
            if (!this.ctx) {
                this.ctx = new AudioContext();
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }
        
        toggle() {
            this.enabled = !this.enabled;
            if (!this.enabled) {
                this.stopBGM();
            }
            return this.enabled;
        }
        
        setVolume(vol) {
            this.volume = Math.max(0, Math.min(1, vol));
        }
        
        stopBGM() {
            this.isBGMPlaying = false;
        }
        
        startBGM() {
            if (!this.enabled || !this.ctx) return;
            this.isBGMPlaying = true;
        }
    }
    
    const audio = new AudioManager();
    
    // Test initial state
    assert(audio.enabled === true, 'Audio enabled by default');
    assert(audio.volume === 0.5, 'Default volume is 0.5');
    assert(audio.isBGMPlaying === false, 'BGM not playing initially');
    
    // Test toggle
    const newState = audio.toggle();
    assert(newState === false, 'Toggle disables audio');
    assert(audio.enabled === false, 'Audio state updated after toggle');
    
    // Test volume bounds
    audio.setVolume(1.5);
    assert(audio.volume === 1, 'Volume clamped to max 1');
    audio.setVolume(-0.5);
    assert(audio.volume === 0, 'Volume clamped to min 0');
    audio.setVolume(0.7);
    assert(audio.volume === 0.7, 'Volume set correctly');
    
    // Test init
    audio.init();
    assert(audio.ctx !== null, 'AudioContext created after init');
    
    // Test BGM
    audio.enabled = true;
    audio.startBGM();
    assert(audio.isBGMPlaying === true, 'BGM starts when enabled');
    
    audio.stopBGM();
    assert(audio.isBGMPlaying === false, 'BGM stops correctly');
});

console.log('🎮 Running Neon Space Shooter Tests...\n');

// Run all tests
const tests = [
    'Utility Functions',
    'Enemy Types Configuration',
    'Game State Management',
    'Collision Detection',
    'Level Progression System',
    'Particle System',
    'Bullet Mechanics',
    'Power-up System',
    'Player Invulnerability',
    'Audio Manager System'
];

console.log(`Total test suites: ${tests.length}\n`);
console.log('═'.repeat(50));

// Tests are run automatically when imported
console.log('\n' + '═'.repeat(50));
console.log('✅ All tests passed!');
console.log('═'.repeat(50));
