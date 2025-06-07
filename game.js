// Main Game Logic
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.isMultiplayer = false;
        
        // Game state
        this.player = null;
        this.enemies = [];
        this.planets = [];
        this.projectiles = [];
        this.particles = [];
        this.boss = null;
        
        // Game stats
        this.credits = 0;
        this.health = 100;
        this.energy = 100;
        this.nitro = 100;
        this.planetsFound = 0;
        this.salary = 0;
        this.dayCounter = 1;
        
        // Time system (6 minutes = 1 day)
        this.dayDuration = 6 * 60 * 1000; // 6 minutes in milliseconds
        this.dayStartTime = Date.now();
        this.gameTime = { hours: 6, minutes: 0 };
        
        // Upgrades
        this.upgrades = {
            battery: 0,
            thruster: 0,
            radar: 0
        };
        
        // Input handling
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        
        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth - 40;
        this.canvas.height = window.innerHeight - 120;
    }

    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Special keys
            if (e.code === 'KeyE') this.openUpgradeShop();
            if (e.code === 'Space') {
                e.preventDefault();
                this.shootProjectile();
            }
            if (e.code === 'ShiftLeft') this.activateNitro();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'ShiftLeft') this.deactivateNitro();
        });

        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('click', (e) => {
            this.shootProjectile();
        });

        // Resize handler
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
    }

    start(isMultiplayer = false) {
        this.isMultiplayer = isMultiplayer;
        this.isRunning = true;
        
        // Initialize player
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        
        // Generate initial content
        this.generatePlanets();
        this.generateEnemies();
        
        // Start game loop
        this.gameLoop();
        
        // Start day timer
        this.dayStartTime = Date.now();
        this.updateGameTime();
        
        // Show game screen
        document.getElementById('introScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
        
        console.log('Game started - Multiplayer:', isMultiplayer);
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Update time
        this.updateGameTime();
        
        // Update player
        if (this.player && !this.player.isDead) {
            this.player.update(this.keys, this.mousePos, this.canvas);
            
            // Energy consumption
            this.consumeEnergy();
        }
        
        // Update game objects
        this.updateEnemies();
        this.updateProjectiles();
        this.updateParticles();
        this.updateBoss();
        
        // Check collisions
        this.checkCollisions();
        
        // Check day completion
        this.checkDayCompletion();
        
        // Update UI
        this.updateHUD();
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.drawStars();
        
        // Draw game objects
        this.drawPlanets();
        this.drawEnemies();
        this.drawProjectiles();
        this.drawParticles();
        this.drawPlayer();
        this.drawBoss();
        
        // Draw radar
        this.drawRadar();
    }

    // Player class
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.speed = 5;
        this.angle = 0;
        this.isDead = false;
        this.nitroActive = false;
        this.trail = [];
    }

    update(keys, mousePos, canvas) {
        if (this.isDead) return;
        
        // Calculate angle to mouse
        this.angle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
        
        // Movement
        let moveSpeed = this.speed * (1 + game.upgrades.thruster * 0.25);
        if (this.nitroActive && game.nitro > 0) {
            moveSpeed *= 2;
        }
        
        if (keys['KeyW'] || keys['ArrowUp']) {
            this.y -= moveSpeed;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
            this.y += moveSpeed;
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
            this.x -= moveSpeed;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            this.x += moveSpeed;
        }
        
        // Keep player in bounds
        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));
        
        // Update trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) this.trail.shift();
    }

    draw(ctx) {
        if (this.isDead) return;
        
        // Draw trail
        this.trail.forEach((point, index) => {
            const alpha = index / this.trail.length * 0.3;
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw player ship
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Ship body
        ctx.fillStyle = this.nitroActive ? '#00ffff' : '#ffffff';
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size * 0.5, -this.size * 0.5);
        ctx.lineTo(-this.size * 0.3, 0);
        ctx.lineTo(-this.size * 0.5, this.size * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // Nitro effect
        if (this.nitroActive) {
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.3, -this.size * 0.3);
            ctx.lineTo(-this.size * 1.2, 0);
            ctx.lineTo(-this.size * 0.3, this.size * 0.3);
            ctx.fill();
        }
        
        ctx.restore();
    }

    takeDamage(amount) {
        game.health -= amount;
        if (game.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        audioManager.playSound('death');
        
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            game.particles.push(new Particle(
                this.x + (Math.random() - 0.5) * 20,
                this.y + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                '#ff6600',
                60
            ));
        }
        
        // Show death screen
        setTimeout(() => {
            document.getElementById('deathScreen').classList.remove('hidden');
        }, 1000);
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = type === 'basic' ? 8 : 12;
        this.speed = type === 'basic' ? 2 : 1.5;
        this.health = type === 'basic' ? 30 : 50;
        this.color = type === 'basic' ? '#ff0000' : '#ff6600';
        this.angle = Math.random() * Math.PI * 2;
        this.shootTimer = 0;
    }

    update(canvas) {
        // Simple AI - move toward player
        if (game.player && !game.player.isDead) {
            const dx = game.player.x - this.x;
            const dy = game.player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
                this.angle = Math.atan2(dy, dx);
            }
            
            // Shoot at player
            this.shootTimer++;
            if (this.shootTimer > 120) { // Every 2 seconds at 60fps
                this.shoot();
                this.shootTimer = 0;
            }
        }
    }

    shoot() {
        if (!game.player || game.player.isDead) return;
        
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        game.projectiles.push(new Projectile(
            this.x,
            this.y,
            (dx / distance) * 6,
            (dy / distance) * 6,
            '#ff0000',
            false
        ));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw spikes
        for (let i = 0; i < 6; i++) {
            const spikeAngle = (Math.PI * 2 / 6) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(
                Math.cos(spikeAngle) * this.size * 1.5,
                Math.sin(spikeAngle) * this.size * 1.5
            );
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.restore();
    }

    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }
}

// Projectile class
class Projectile {
    constructor(x, y, vx, vy, color, isPlayerProjectile) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.isPlayerProjectile = isPlayerProjectile;
        this.size = 3;
        this.life = 180; // 3 seconds at 60fps
    }

    update(canvas) {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        
        // Remove if out of bounds or life expired
        return this.x < 0 || this.x > canvas.width || 
               this.y < 0 || this.y > canvas.height || 
               this.life <= 0;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Particle class
class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 3 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life--;
        
        return this.life <= 0;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Planet class
class Planet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 20 + 15;
        this.color = this.generatePlanetColor();
        this.discovered = false;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }

    generatePlanetColor() {
        const colors = [
            '#4a90e2', '#7b68ee', '#ff6b6b', '#4ecdc4',
            '#45b7d1', '#96ceb4', '#ffc93c', '#ff9999'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.angle += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Planet body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Planet details
        ctx.fillStyle = this.adjustColor(this.color, -20);
        ctx.beginPath();
        ctx.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.size * 0.2, this.size * 0.4, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Discovery indicator
        if (this.discovered) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    adjustColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    checkDiscovery(playerX, playerY) {
        const distance = Math.sqrt((playerX - this.x) ** 2 + (playerY - this.y) ** 2);
        const radarRange = 100 + (game.upgrades.radar * 250);
        
        if (distance < radarRange && !this.discovered) {
            this.discovered = true;
            game.planetsFound++;
            game.credits += 100;
            return true;
        }
        return false;
    }
}

// Initialize global game instance
const game = new Game();

