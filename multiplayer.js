// Multiplayer functionality using WebsimSocket
class MultiplayerManager {
    constructor() {
        this.room = null;
        this.isHost = false;
        this.connected = false;
        this.roomCode = '';
        this.players = {};
    }

    async createRoom() {
        try {
            if (typeof WebsimSocket === 'undefined') {
                console.warn('WebsimSocket not available, running in single player mode');
                return false;
            }

            this.room = new WebsimSocket();
            await this.room.initialize();
            
            this.roomCode = this.generateRoomCode();
            this.isHost = true;
            this.connected = true;
            
            this.setupEventHandlers();
            this.initializeRoomState();
            
            return this.roomCode;
        } catch (error) {
            console.error('Failed to create room:', error);
            return false;
        }
    }

    async joinRoom(code) {
        try {
            if (typeof WebsimSocket === 'undefined') {
                console.warn('WebsimSocket not available, running in single player mode');
                return false;
            }

            this.room = new WebsimSocket();
            await this.room.initialize();
            
            this.roomCode = code;
            this.isHost = false;
            this.connected = true;
            
            this.setupEventHandlers();
            
            return true;
        } catch (error) {
            console.error('Failed to join room:', error);
            return false;
        }
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    setupEventHandlers() {
        if (!this.room) return;

        // Handle presence updates (player positions, health, etc.)
        this.room.subscribePresence((presence) => {
            this.updatePlayers(presence);
        });

        // Handle room state updates (shared game objects)
        this.room.subscribeRoomState((roomState) => {
            this.updateGameState(roomState);
        });

        // Handle custom events
        this.room.onmessage = (event) => {
            this.handleGameEvent(event.data);
        };

        // Handle presence update requests (damage, etc.)
        this.room.subscribePresenceUpdateRequests((updateRequest, fromClientId) => {
            this.handlePresenceUpdateRequest(updateRequest, fromClientId);
        });
    }

    initializeRoomState() {
        if (!this.room || !this.isHost) return;

        // Initialize shared game state
        this.room.updateRoomState({
            planets: this.serializePlanets(game.planets),
            enemies: this.serializeEnemies(game.enemies),
            dayCounter: game.dayCounter,
            dayStartTime: game.dayStartTime
        });
    }

    updatePlayerPosition(x, y, angle, health, energy, nitro) {
        if (!this.room || !this.connected) return;

        this.room.updatePresence({
            x: x,
            y: y,
            angle: angle,
            health: health,
            energy: energy,
            nitro: nitro,
            timestamp: Date.now()
        });
    }

    updatePlayers(presence) {
        this.players = {};
        
        for (const [clientId, playerData] of Object.entries(presence)) {
            if (clientId !== this.room.clientId) {
                this.players[clientId] = {
                    ...playerData,
                    peer: this.room.peers[clientId]
                };
            }
        }
    }

    updateGameState(roomState) {
        if (this.isHost) return; // Host manages game state

        // Update shared game objects from host
        if (roomState.planets) {
            this.updatePlanetsFromState(roomState.planets);
        }
        if (roomState.enemies) {
            this.updateEnemiesFromState(roomState.enemies);
        }
        if (roomState.dayCounter) {
            game.dayCounter = roomState.dayCounter;
        }
        if (roomState.dayStartTime) {
            game.dayStartTime = roomState.dayStartTime;
        }
    }

    handleGameEvent(eventData) {
        switch (eventData.type) {
            case 'connected':
                console.log(`Player ${eventData.username} connected`);
                break;
            case 'disconnected':
                console.log(`Player ${eventData.username} disconnected`);
                delete this.players[eventData.clientId];
                break;
            case 'projectile_fired':
                this.createProjectileFromEvent(eventData);
                break;
            case 'enemy_destroyed':
                this.removeEnemyFromEvent(eventData);
                break;
            case 'planet_discovered':
                this.markPlanetDiscovered(eventData.planetIndex);
                break;
        }
    }

    handlePresenceUpdateRequest(updateRequest, fromClientId) {
        if (!this.room) return;

        switch (updateRequest.type) {
            case 'damage':
                if (game.player && !game.player.isDead) {
                    game.player.takeDamage(updateRequest.amount);
                    
                    // Update own presence with new health
                    this.room.updatePresence({
                        health: game.health,
                        dead: game.player.isDead
                    });
                }
                break;
        }
    }

    sendProjectileFired(x, y, vx, vy, color) {
        if (!this.room) return;

        this.room.send({
            type: 'projectile_fired',
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            color: color,
            echo: false
        });
    }

    sendEnemyDestroyed(enemyIndex) {
        if (!this.room) return;

        this.room.send({
            type: 'enemy_destroyed',
            enemyIndex: enemyIndex,
            echo: false
        });
    }

    sendPlanetDiscovered(planetIndex) {
        if (!this.room) return;

        this.room.send({
            type: 'planet_discovered',
            planetIndex: planetIndex,
            echo: false
        });
    }

    requestDamagePlayer(targetClientId, amount) {
        if (!this.room) return;

        this.room.requestPresenceUpdate(targetClientId, {
            type: 'damage',
            amount: amount
        });
    }

    // Serialization helpers
    serializePlanets(planets) {
        return planets.map(planet => ({
            x: planet.x,
            y: planet.y,
            size: planet.size,
            color: planet.color,
            discovered: planet.discovered
        }));
    }

    serializeEnemies(enemies) {
        return enemies.map(enemy => ({
            x: enemy.x,
            y: enemy.y,
            type: enemy.type,
            health: enemy.health
        }));
    }

    updatePlanetsFromState(planetsData) {
        // Only update if we have fewer planets than the host
        if (game.planets.length < planetsData.length) {
            game.planets = planetsData.map(data => {
                const planet = new Planet(data.x, data.y);
                planet.size = data.size;
                planet.color = data.color;
                planet.discovered = data.discovered;
                return planet;
            });
        }
    }

    updateEnemiesFromState(enemiesData) {
        // Sync enemy states
        enemiesData.forEach((enemyData, index) => {
            if (game.enemies[index]) {
                game.enemies[index].x = enemyData.x;
                game.enemies[index].y = enemyData.y;
                game.enemies[index].health = enemyData.health;
            }
        });
    }

    createProjectileFromEvent(eventData) {
        game.projectiles.push(new Projectile(
            eventData.x,
            eventData.y,
            eventData.vx,
            eventData.vy,
            eventData.color,
            false
        ));
    }

    removeEnemyFromEvent(eventData) {
        if (eventData.enemyIndex < game.enemies.length) {
            game.enemies.splice(eventData.enemyIndex, 1);
        }
    }

    markPlanetDiscovered(planetIndex) {
        if (planetIndex < game.planets.length) {
            game.planets[planetIndex].discovered = true;
        }
    }

    drawOtherPlayers(ctx) {
        for (const [clientId, playerData] of Object.entries(this.players)) {
            if (playerData.x !== undefined && playerData.y !== undefined) {
                this.drawRemotePlayer(ctx, playerData);
            }
        }
    }

    drawRemotePlayer(ctx, playerData) {
        ctx.save();
        ctx.translate(playerData.x, playerData.y);
        ctx.rotate(playerData.angle || 0);
        
        // Draw other player's ship with different color
        ctx.fillStyle = '#ffff00'; // Yellow for other players
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-7.5, -7.5);
        ctx.lineTo(-4.5, 0);
        ctx.lineTo(-7.5, 7.5);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Draw player name
        if (playerData.peer && playerData.peer.username) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(playerData.peer.username, playerData.x, playerData.y - 25);
        }
    }

    disconnect() {
        if (this.room) {
            this.room = null;
        }
        this.connected = false;
        this.isHost = false;
        this.players = {};
    }
}

// Global multiplayer manager instance
const multiplayerManager = new MultiplayerManager();

