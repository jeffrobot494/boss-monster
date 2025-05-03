export class MultiplayerManager {
    constructor(scene) {
        this.scene = scene;
        this.isConnected = false;
        this.playerID = null;
        this.players = {};
        this.socket = null;
        
        // This is a mockup version for the prototype.
        // In a real implementation, this would connect to an actual socket server.
        this.mockSocket();
    }
    
    // Create a mock socket for demonstration purposes
    mockSocket() {
        // Create fake socket object
        this.socket = {
            id: 'local-' + Math.floor(Math.random() * 1000000),
            emit: (event, data) => {
                //console.log('Socket emit:', event, data);
                // Mock response for various events
                if (event === 'join') {
                    this.onConnect({ id: this.socket.id });
                }
                // Remove updateSecondPlayer call from here to prevent recursion
            },
            on: (event, callback) => {
                console.log('Socket on:', event);
                // Store callback functions (these would be event listeners in a real implementation)
                if (!this.callbacks) this.callbacks = {};
                this.callbacks[event] = callback;
            }
        };
        
        // Store player ID
        this.playerID = this.socket.id;
        
        // Create event callbacks
        this.setupCallbacks();
        
        // Auto-join for testing
        this.socket.emit('join', { name: 'Player 1' });
    }
    
    setupCallbacks() {
        this.callbacks = {
            'connect': this.onConnect.bind(this),
            'disconnect': this.onDisconnect.bind(this),
            'playerJoined': this.onPlayerJoined.bind(this),
            'playerLeft': this.onPlayerLeft.bind(this),
            'playerUpdate': this.onPlayerUpdate.bind(this),
            'bossUpdate': this.onBossUpdate.bind(this),
            'bossGenerated': this.onBossGenerated.bind(this)
        };
    }
    
    // Simulate a second player joining the game
    addSecondPlayer() {
        if (this.secondPlayer) return;
        
        const secondPlayerId = 'ai-' + Math.floor(Math.random() * 1000000);
        
        // Create the second player
        this.secondPlayer = new this.scene.player.constructor(this.scene, 500, 300);
        this.secondPlayer.setTint(0x00ff00); // Green tint to distinguish from player 1
        
        // Set up collisions with platforms
        this.scene.physics.add.collider(this.secondPlayer, this.scene.platforms);
        
        // Set up collisions with moving platforms
        if (this.scene.platformGenerator && this.scene.platformGenerator.movingPlatforms) {
            this.scene.platformGenerator.movingPlatforms.forEach(({ platform }) => {
                this.scene.physics.add.collider(this.secondPlayer, platform);
            });
        }
        
        // Set up collisions for second player's projectiles with platforms
        this.scene.physics.add.collider(this.secondPlayer.projectiles, this.scene.platforms, this.scene.hitPlatform, null, this.scene);
        
        // Set up collisions for second player with boss
        if (this.scene.bossGroup) {
            // Use overlap for projectiles so they can pass through boss parts
            this.scene.physics.add.overlap(this.secondPlayer.projectiles, this.scene.bossGroup, this.scene.hitBoss, null, this.scene);
            // Keep collider for player body
            this.scene.physics.add.collider(this.secondPlayer, this.scene.bossGroup, this.scene.playerHitBoss, null, this.scene);
        }
        
        // Store in players object
        this.players[secondPlayerId] = {
            id: secondPlayerId,
            player: this.secondPlayer,
            lastUpdate: Date.now()
        };
        
        // Notify about new player
        if (this.callbacks && this.callbacks.playerJoined) {
            this.callbacks.playerJoined({
                id: secondPlayerId,
                x: 500,
                y: 300,
                name: 'Player 2'
            });
        }
        
        // Add text to display player 2
        this.scene.add.text(500, 260, 'Player 2', {
            font: '16px Arial',
            fill: '#00ff00'
        }).setOrigin(0.5).setDepth(10);
        
        console.log('Second player added:', secondPlayerId);
    }
    
    // Simple AI for the second player
    updateSecondPlayer() {
        if (!this.secondPlayer || !this.scene.player) return;
        
        // Make the second player follow the first player and also target the boss
        const player1 = this.scene.player;
        const player2 = this.secondPlayer;
        
        // Simple AI: 
        // - Try to stay close to player 1 horizontally
        // - Jump when player 1 jumps
        // - Shoot at the boss occasionally
        
        // Horizontal movement to follow player 1
        const distanceToPlayer = player1.x - player2.x;
        const shouldMoveRight = distanceToPlayer > 100;
        const shouldMoveLeft = distanceToPlayer < -100;
        
        if (shouldMoveRight) {
            player2.setVelocityX(200);
            player2.anims.play('player_run', true);
            player2.flipX = false;
        } else if (shouldMoveLeft) {
            player2.setVelocityX(-200);
            player2.anims.play('player_run', true);
            player2.flipX = true;
        } else {
            player2.setVelocityX(0);
            player2.anims.play('player_idle', true);
        }
        
        // Jump if player 1 jumps or if stuck
        if ((player1.body.velocity.y < -300 || player2.body.blocked.left || player2.body.blocked.right) 
            && player2.body.touching.down) {
            player2.setVelocityY(-500);
        }
        
        // Shoot at boss occasionally
        if (this.scene.boss && Math.random() < 0.02) {
            // Find a boss part to target
            const bossParts = this.scene.bossGroup.getChildren();
            if (bossParts.length > 0) {
                const targetPart = Phaser.Utils.Array.GetRandom(bossParts);
                
                // Simulate mouse position at the boss part
                const fakeEvent = {
                    worldX: targetPart.x,
                    worldY: targetPart.y
                };
                
                // Create a fake shooting event instead of modifying the pointer
                // Note: We can't modify activePointer directly since it's read-only
                const shootPosition = {
                    x: targetPart.x,
                    y: targetPart.y
                };
                
                // Use a different approach to shoot
                player2.shootAt(shootPosition.x, shootPosition.y);
            }
        }
        
        // Swing sword occasionally
        if (this.scene.boss && Math.random() < 0.01) {
            // Find a boss part to target
            const bossParts = this.scene.bossGroup.getChildren();
            if (bossParts.length > 0) {
                const targetPart = Phaser.Utils.Array.GetRandom(bossParts);
                
                // Simulate mouse position at the boss part
                const fakeEvent = {
                    worldX: targetPart.x,
                    worldY: targetPart.y
                };
                
                // Create a fake position for sword swing
                const swordPosition = {
                    x: targetPart.x,
                    y: targetPart.y
                };
                
                // Use a different approach to swing sword
                player2.swingAt(swordPosition.x, swordPosition.y);
            }
        }
        
        // Broadcast update 
        this.sendPlayerUpdate(this.secondPlayer);
    }
    
    connect() {
        // In a real implementation, this would establish a connection to the server
        console.log('Connecting to server...');
        this.isConnected = true;
        
        // Simulate connection events
        this.onConnect({ id: this.socket.id });
    }
    
    onConnect(data) {
        console.log('Connected to server with ID:', data.id);
        this.playerID = data.id;
        this.isConnected = true;
        
        // Add local player to players list
        if (this.scene.player) {
            this.players[this.playerID] = {
                id: this.playerID,
                player: this.scene.player,
                lastUpdate: Date.now()
            };
        }
        
        // Simulate a second player joining after a delay
        this.scene.time.delayedCall(2000, () => {
            this.addSecondPlayer();
        });
    }
    
    onDisconnect() {
        console.log('Disconnected from server');
        this.isConnected = false;
    }
    
    onPlayerJoined(data) {
        console.log('Player joined:', data);
        
        // If it's our own player, no need to create a new sprite
        if (data.id === this.playerID) return;
        
        // Create a new player sprite for the remote player
        if (!this.players[data.id]) {
            // In a real implementation, this would create a new sprite for the remote player
            console.log('Creating remote player sprite for:', data.id);
            
            // The second player is already created by addSecondPlayer in this mock
        }
    }
    
    onPlayerLeft(data) {
        console.log('Player left:', data);
        
        // Remove player from the game
        if (this.players[data.id]) {
            if (this.players[data.id].player) {
                this.players[data.id].player.destroy();
            }
            delete this.players[data.id];
        }
    }
    
    onPlayerUpdate(data) {
        // Update remote player position and state
        if (data.id !== this.playerID && this.players[data.id]) {
            const remotePlayer = this.players[data.id].player;
            
            // Update position and other properties
            remotePlayer.x = data.x;
            remotePlayer.y = data.y;
            remotePlayer.flipX = data.flipX;
            
            // Update animation
            if (data.animation) {
                remotePlayer.anims.play(data.animation, true);
            }
            
            // Update last received time
            this.players[data.id].lastUpdate = Date.now();
        }
    }
    
    onBossUpdate(data) {
        // Update boss state based on server data
        if (this.scene.boss) {
            // In a real implementation, this would update the boss state
            console.log('Boss update received:', data);
        }
    }
    
    onBossGenerated(data) {
        // Receive boss data from server
        console.log('Boss data received from server:', data);
        
        // In a real implementation, this would create the boss using the data
    }
    
    sendPlayerUpdate(player = null) {
        // Send player position and state to the server
        if (!this.isConnected) return;
        
        const playerToUpdate = player || this.scene.player;
        
        if (playerToUpdate) {
            const data = {
                id: player ? 'player2' : this.playerID,
                x: playerToUpdate.x,
                y: playerToUpdate.y,
                velocityX: playerToUpdate.body.velocity.x,
                velocityY: playerToUpdate.body.velocity.y,
                flipX: playerToUpdate.flipX,
                animation: playerToUpdate.anims.currentAnim ? playerToUpdate.anims.currentAnim.key : 'player_idle',
                health: playerToUpdate.health
            };
            
            // In a real implementation, this would send data to the server
            // Only emit updates for the main player to avoid recursion
            if (!player) {
                this.socket.emit('playerUpdate', data);
            }
        }
    }
    
    sendBossUpdate() {
        // Send boss state to the server
        if (!this.isConnected || !this.scene.boss) return;
        
        const bossData = {
            health: this.scene.boss.getHealthPercent() * 100,
            stage: this.scene.boss.getCurrentStage(),
            partsRemaining: this.scene.bossGroup.getLength()
        };
        
        // In a real implementation, this would send data to the server
        this.socket.emit('bossUpdate', bossData);
    }
    
    update() {
        // Send regular updates about the local player
        if (this.scene.player) {
            this.sendPlayerUpdate();
        }
        
        // Update second player AI independently
        if (this.secondPlayer) {
            this.updateSecondPlayer();
        }
        
        // Send boss updates
        if (this.scene.boss && Math.random() < 0.1) {
            this.sendBossUpdate();
        }
    }
    
    disconnect() {
        if (this.socket) {
            // In a real implementation, this would disconnect from the server
            console.log('Disconnecting from server');
            this.isConnected = false;
        }
    }
}