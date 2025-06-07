// Main application controller
class App {
    constructor() {
        this.currentScreen = 'intro';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Menu buttons
        document.getElementById('singlePlayerBtn').addEventListener('click', () => {
            this.startSinglePlayer();
        });

        document.getElementById('multiPlayerBtn').addEventListener('click', () => {
            this.showMultiplayerOptions();
        });

        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.createMultiplayerRoom();
        });

        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            this.showJoinRoomInput();
        });

        document.getElementById('confirmJoinBtn').addEventListener('click', () => {
            this.joinMultiplayerRoom();
        });

        // Game buttons
        document.getElementById('respawnBtn').addEventListener('click', () => {
            this.respawnPlayer();
        });

        // Upgrade shop buttons
        document.getElementById('batteryUpgrade').addEventListener('click', () => {
            this.purchaseUpgrade('battery');
        });

        document.getElementById('thrusterUpgrade').addEventListener('click', () => {
            this.purchaseUpgrade('thruster');
        });

        document.getElementById('radarUpgrade').addEventListener('click', () => {
            this.purchaseUpgrade('radar');
        });

        document.getElementById('closeShop').addEventListener('click', () => {
            this.closeUpgradeShop();
        });

        // Room code input
        document.getElementById('roomCodeInput').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    async init() {
        // Start intro sequence
        await introSequence.start();
    }

    startSinglePlayer() {
        game.start(false);
        this.currentScreen = 'game';
    }

    showMultiplayerOptions() {
        document.getElementById('singlePlayerBtn').classList.add('hidden');
        document.getElementById('multiPlayerBtn').classList.add('hidden');
        document.getElementById('createRoomBtn').classList.remove('hidden');
        document.getElementById('joinRoomBtn').classList.remove('hidden');
    }

    async createMultiplayerRoom() {
        const roomCode = await multiplayerManager.createRoom();
        if (roomCode) {
            document.getElementById('roomCode').textContent = roomCode;
            document.getElementById('roomCodeDisplay').classList.remove('hidden');
            
            // Start game after short delay
            setTimeout(() => {
                game.start(true);
                this.currentScreen = 'game';
            }, 2000);
        } else {
            alert('Failed to create room. Starting single player mode.');
            this.startSinglePlayer();
        }
    }

    showJoinRoomInput() {
        document.getElementById('createRoomBtn').classList.add('hidden');
        document.getElementById('joinRoomBtn').classList.add('hidden');
        document.getElementById('roomCodeInput').classList.remove('hidden');
        document.getElementById('confirmJoinBtn').classList.remove('hidden');
    }

    async joinMultiplayerRoom() {
        const roomCode = document.getElementById('roomCodeInput').value.trim();
        if (roomCode.length !== 5) {
            alert('Please enter a valid 5-digit room code.');
            return;
        }

        const success = await multiplayerManager.joinRoom(roomCode);
        if (success) {
            game.start(true);
            this.currentScreen = 'game';
        } else {
            alert('Failed to join room. Please check the room code.');
        }
    }

    respawnPlayer() {
        // Reset player
        game.player = new Player(game.canvas.width / 2, game.canvas.height / 2);
        game.health = 100;
        game.energy = 100;
        
        // Hide death screen
        document.getElementById('deathScreen').classList.add('hidden');
    }

    purchaseUpgrade(type) {
        const costs = {
            battery: 500,
            thruster: 750,
            radar: 1000
        };

        const cost = costs[type];
        if (game.credits >= cost) {
            game.credits -= cost;
            game.upgrades[type]++;
            
            // Apply upgrade effects
            this.applyUpgradeEffects(type);
            
            // Update button text to show next level cost
            this.updateUpgradeButtons();
        } else {
            // Flash insufficient funds
            const button = document.getElementById(`${type}Upgrade`);
            button.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
            setTimeout(() => {
                button.style.backgroundColor = '';
            }, 500);
        }
    }

    applyUpgradeEffects(type) {
        switch (type) {
            case 'battery':
                game.energy = Math.min(100 + (game.upgrades.battery * 15), game.energy + 15);
                break;
            case 'thruster':
                // Speed increase is applied in player update
                break;
            case 'radar':
                // Range increase is applied in planet discovery
                break;
        }
    }

    updateUpgradeButtons() {
        const costs = {
            battery: 500,
            thruster: 750,
            radar: 1000
        };

        Object.entries(costs).forEach(([type, baseCost]) => {
            const level = game.upgrades[type];
            const cost = baseCost * (level + 1);
            const button = document.getElementById(`${type}Upgrade`);
            
            const names = {
                battery: 'BATTERY CORE',
                thruster: 'THRUSTER SYSTEM',
                radar: 'RADAR ENHANCEMENT'
            };

            const effects = {
                battery: `(+15 Energy, Slower Usage) Level ${level}`,
                thruster: `(+25% Speed) Level ${level}`,
                radar: `(+250m Range) Level ${level}`
            };

            button.textContent = `${names[type]} ${effects[type]} - ${cost} Credits`;
        });
    }

    closeUpgradeShop() {
        document.getElementById('upgradeShop').classList.add('hidden');
    }
}

// Game utility functions that need to be accessible globally
Object.assign(game, {
    updateGameTime() {
        const elapsed = Date.now() - this.dayStartTime;
        const dayProgress = elapsed / this.dayDuration;
        
        // Convert to game time (starts at 06:00)
        const totalMinutes = (6 * 60) + (dayProgress * 24 * 60);
        this.gameTime.hours = Math.floor(totalMinutes / 60) % 24;
        this.gameTime.minutes = Math.floor(totalMinutes % 60);
    },

    updateHUD() {
        document.getElementById('credits').textContent = this.credits;
        document.getElementById('salary').textContent = this.salary;
        document.getElementById('planetsFound').textContent = this.planetsFound;
        document.getElementById('health').textContent = Math.max(0, this.health);
        document.getElementById('energy').textContent = Math.max(0, this.energy);
        document.getElementById('nitro').textContent = Math.max(0, Math.round(this.nitro));
        document.getElementById('dayCounter').textContent = this.dayCounter;
        document.getElementById('gameTime').textContent = 
            `${this.gameTime.hours.toString().padStart(2, '0')}:${this.gameTime.minutes.toString().padStart(2, '0')}`;
    },

    generatePlanets() {
        this.planets = [];
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * (this.canvas.width - 100) + 50;
            const y = Math.random() * (this.canvas.height - 100) + 50;
            this.planets.push(new Planet(x, y));
        }
    },

    generateEnemies() {
        this.enemies = [];
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.enemies.push(new Enemy(x, y));
        }
    },

    consumeEnergy() {
        const baseConsumption = 0.1;
        const batteryEfficiency = 1 - (this.upgrades.battery * 0.2);
        
        if (this.player && this.player.nitroActive) {
            this.nitro -= 0.5;
            this.energy -= baseConsumption * batteryEfficiency * 2;
        } else {
            this.energy -= baseConsumption * batteryEfficiency;
            if (this.nitro < 100) {
                this.nitro += 0.1; // Nitro regenerates when not in use
            }
        }
        
        this.energy = Math.max(0, this.energy);
        this.nitro = Math.max(0, Math.min(100, this.nitro));
    },

    activateNitro() {
        if (this.nitro >= 25 && this.player) {
            this.player.nitroActive = true;
        }
    },

    deactivateNitro() {
        if (this.player) {
            this.player.nitroActive = false;
        }
    },

    shootProjectile() {
        if (!this.player || this.player.isDead) return;
        
        const speed = 10;
        const dx = Math.cos(this.player.angle) * speed;
        const dy = Math.sin(this.player.angle) * speed;
        
        this.projectiles.push(new Projectile(
            this.player.x,
            this.player.y,
            dx,
            dy,
            '#00ffff',
            true
        ));
        
        // Send to multiplayer if connected
        if (multiplayerManager.connected) {
            multiplayerManager.sendProjectileFired(this.player.x, this.player.y, dx, dy, '#00ffff');
        }
    },

    openUpgradeShop() {
        document.getElementById('upgradeShop').classList.remove('hidden');
        app.updateUpgradeButtons();
    },

    updateEnemies() {
        this.enemies.forEach(enemy => {
            enemy.update(this.canvas);
        });
    },

    updateProjectiles() {
        this.projectiles = this.projectiles.filter(projectile => {
            return !projectile.update(this.canvas);
        });
    },

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            return !particle.update();
        });
    },

    updateBoss() {
        if (this.boss) {
            this.boss.update(this.canvas);
        }
    },

    checkCollisions() {
        // Player-enemy collisions
        if (this.player && !this.player.isDead) {
            this.enemies.forEach(enemy => {
                const distance = Math.sqrt(
                    (this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2
                );
                if (distance < this.player.size + enemy.size) {
                    this.player.takeDamage(20);
                }
            });
        }

        // Projectile-enemy collisions
        this.projectiles.forEach((projectile, pIndex) => {
            if (projectile.isPlayerProjectile) {
                this.enemies.forEach((enemy, eIndex) => {
                    const distance = Math.sqrt(
                        (projectile.x - enemy.x) ** 2 + (projectile.y - enemy.y) ** 2
                    );
                    if (distance < projectile.size + enemy.size) {
                        if (enemy.takeDamage(25)) {
                            this.enemies.splice(eIndex, 1);
                            this.credits += 50;
                            
                            if (multiplayerManager.connected) {
                                multiplayerManager.sendEnemyDestroyed(eIndex);
                            }
                        }
                        this.projectiles.splice(pIndex, 1);
                    }
                });
            }
        });

        // Planet discovery
        if (this.player && !this.player.isDead) {
            this.planets.forEach((planet, index) => {
                if (planet.checkDiscovery(this.player.x, this.player.y)) {
                    if (multiplayerManager.connected) {
                        multiplayerManager.sendPlanetDiscovered(index);
                    }
                }
            });
        }
    },

    checkDayCompletion() {
        const elapsed = Date.now() - this.dayStartTime;
        if (elapsed >= this.dayDuration) {
            // New day
            this.dayCounter++;
            this.salary = this.planetsFound * 100;
            this.credits += this.salary;
            this.planetsFound = 0;
            this.dayStartTime = Date.now();
            
            // Generate new content
            this.generatePlanets();
            this.generateEnemies();
        }
    },

    drawStars() {
        // Simple star field
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 61) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    },

    drawPlanets() {
        this.planets.forEach(planet => {
            planet.update();
            planet.draw(this.ctx);
        });
    },

    drawEnemies() {
        this.enemies.forEach(enemy => {
            enemy.draw(this.ctx);
        });
    },

    drawProjectiles() {
        this.projectiles.forEach(projectile => {
            projectile.draw(this.ctx);
        });
    },

    drawParticles() {
        this.particles.forEach(particle => {
            particle.draw(this.ctx);
        });
    },

    drawPlayer() {
        if (this.player) {
            this.player.draw(this.ctx);
            
            // Update multiplayer position
            if (multiplayerManager.connected && !this.player.isDead) {
                multiplayerManager.updatePlayerPosition(
                    this.player.x,
                    this.player.y,
                    this.player.angle,
                    this.health,
                    this.energy,
                    this.nitro
                );
            }
        }
        
        // Draw other players in multiplayer
        if (multiplayerManager.connected) {
            multiplayerManager.drawOtherPlayers(this.ctx);
        }
    },

    drawBoss() {
        if (this.boss) {
            this.boss.draw(this.ctx);
        }
    },

    drawRadar() {
        if (!this.player || this.player.isDead) return;
        
        const radarRange = 100 + (this.upgrades.radar * 250);
        
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, radarRange, 0, Math.PI * 2);
        this.ctx.stroke();
    }
});

// Initialize application
const app = new App();

// Start the application when page loads
window.addEventListener('load', () => {
    app.init();
});

// Handle page visibility for audio
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        audioManager.setMusicVolume(0);
    } else {
        audioManager.setMusicVolume(0.3);
    }
});

