import { Player } from '../gameobjects/Player.js';
import { Boss } from '../gameobjects/Boss.js';
import { PlatformGenerator } from '../gameobjects/PlatformGenerator.js';
import { MultiplayerManager } from '../gameobjects/MultiplayerManager.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.player = null;
        this.platforms = null;
        this.boss = null;
        this.bossGroup = null;
        this.bossHealthBar = null;
        this.bossHealthText = null;
        this.powerUps = null;
        this.score = 0;
    }

    init(data) {
        // Get boss data passed from splash scene
        this.bossData = data.boss;
    }

    create() {
        // Initialize everything one by one with proper error checks
        
        // Add background
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');
        
        // Setup UI first
        this.setupBasicUI();
        
        // Generate platforms
        this.platformGenerator = new PlatformGenerator(this);
        this.platforms = this.platformGenerator.generate({
            platformCount: {
                static: 5,
                moving: 3,
                temporary: 2,
                hazard: 1
            },
            platformDistribution: 'balanced'
        });
        
        // Create player
        this.player = new Player(this, 640, 300);
        
        // Update player health UI
        this.playerHealthText = this.add.text(100, 50, `Health: ${this.player.health}`, {
            font: '24px Arial',
            fill: '#ffffff'
        });
        
        // Create sword hitboxes group (for collision detection)
        this.swordHitboxes = this.physics.add.group();
        
        // Create boss
        try {
            this.createBoss();
        } catch (error) {
            console.error("Error creating boss:", error);
            // Create a dummy boss if there's an error
            this.bossGroup = this.physics.add.group();
        }
        
        // Create power-up group
        this.powerUps = this.physics.add.group();
        
        // Setup collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player.projectiles, this.platforms, this.hitPlatform, null, this);
        
        // Set up collisions specifically for moving platforms
        // We need to make sure we add colliders for both players with moving platforms
        // This will get the actual moving platform sprites from the platformGenerator
        if (this.platformGenerator && this.platformGenerator.movingPlatforms) {
            this.platformGenerator.movingPlatforms.forEach(({ platform }) => {
                this.physics.add.collider(this.player, platform);
            });
        }
        
        if (this.bossGroup) {
            // Create debug text to show collision groups are active
            console.log("Setting up boss collisions. Boss group has " + this.bossGroup.getChildren().length + " children");
            
            // Enable debug rendering of hitboxes if needed
            if (this.physics.config.debug) {
                this.bossGroup.getChildren().forEach(part => {
                    // Add a visual indicator for collision shapes
                    const circle = this.add.circle(part.x, part.y, part.body.radius || 30, 0xff0000, 0.3);
                    this.time.addEvent({
                        delay: 100,
                        loop: true,
                        callback: () => {
                            if (part.active) {
                                circle.x = part.x;
                                circle.y = part.y;
                                circle.visible = true;
                            } else {
                                circle.visible = false;
                            }
                        }
                    });
                });
            }
            
            // Use overlap instead of collider for projectiles - projectiles should pass through boss parts
            const projectileOverlap = this.physics.add.overlap(
                this.player.projectiles, 
                this.bossGroup, 
                this.hitBoss, 
                null, 
                this
            );
            
            console.log("Projectile overlap set up:", projectileOverlap);
            
            // Add sword hitbox overlap
            this.physics.add.overlap(this.swordHitboxes, this.bossGroup, this.hitBoss, null, this);
            
            // Keep collider for player body interactions
            this.physics.add.collider(this.player, this.bossGroup, this.playerHitBoss, null, this);
        }
        
        this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, null, this);
        
        // Initialize multiplayer
        this.multiplayerManager = new MultiplayerManager(this);
    }

    createBoss() {
        // Create boss instance
        this.boss = new Boss(this, this.bossData);
        
        // Get boss group for collisions
        this.bossGroup = this.boss.getBossGroup();
        
        // Create health bar graphics if it doesn't exist
        if (!this.bossHealthBar) {
            this.bossHealthBar = this.add.graphics();
        }
        
        // Update the health display
        this.updateBossHealthBar();
    }

    createBossPart(partData) {
        // Create physical boss part
        let part;
        
        if (partData.shape === 'circle') {
            part = this.physics.add.sprite(partData.position.x, partData.position.y, 'platform')
                .setCircle(partData.size.width / 2)
                .setTint(0xff00ff);
        } else {
            part = this.physics.add.sprite(partData.position.x, partData.position.y, 'platform')
                .setSize(partData.size.width, partData.size.height)
                .setTint(0xff00ff);
        }
        
        // Set part properties
        part.setData('id', partData.id);
        part.setData('type', partData.type);
        part.setData('hitPoints', partData.hitPoints);
        part.setData('maxHitPoints', partData.hitPoints);
        part.setData('damageOnTouch', partData.damageOnTouch);
        part.setData('vulnerable', false);
        part.setData('mobility', partData.mobility);
        part.setData('attackPatterns', partData.attackPatterns);
        part.setData('vulnerableDuring', partData.vulnerableDuring);
        
        // Add to boss group
        this.bossGroup.add(part);
        
        // Setup mobility
        if (partData.mobility.type === 'patrol') {
            this.tweens.add({
                targets: part,
                x: part.x + 200,
                duration: 2000,
                ease: 'Sine.inOut',
                yoyo: true,
                repeat: -1
            });
        }
        
        return part;
    }

    setupBasicUI() {
        // Setup simple UI elements
        // Add score display
        this.scoreText = this.add.text(100, 80, 'Score: 0', {
            font: '24px Arial',
            fill: '#ffffff'
        });
        
        // Create boss health bar graphics
        this.bossHealthBar = this.add.graphics();
        
        // Add boss health text
        this.bossHealthText = this.add.text(640, 50, 'Boss: 100%', {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }

    updateBossHealthBar() {
        // Check if boss exists
        if (!this.boss) {
            console.warn("Cannot update health bar: Boss does not exist");
            return;
        }
        
        // Create health bar if needed
        if (!this.bossHealthBar) {
            this.bossHealthBar = this.add.graphics();
        }
        
        // Force recalculation of health
        this.boss.calculateHealth();
        
        // Get health percent from boss
        const healthPercent = this.boss.getHealthPercent();
        //console.log("Updating health bar. Health percent: " + healthPercent);
        
        // Draw health bar
        this.bossHealthBar.clear();
        this.bossHealthBar.fillStyle(0x666666);
        this.bossHealthBar.fillRect(440, 70, 400, 20);
        this.bossHealthBar.fillStyle(0xff0000);
        this.bossHealthBar.fillRect(440, 70, 400 * healthPercent, 20);
        
        // Update text if it exists
        if (this.bossHealthText) {
            const bossName = this.bossData ? this.bossData.name : 'Boss';
            this.bossHealthText.setText(`${bossName}: ${Math.floor(healthPercent * 100)}%`);
        }
    }

    transitionToStageTwo() {
        this.stageTwo = true;
        
        // Add visual effect
        this.cameras.main.flash(1000, 255, 0, 255);
        this.cameras.main.shake(500, 0.01);
        
        // Change boss appearance
        // In a full implementation, this would do more
        
        // Drop power-up
        this.dropPowerUp(this.bossData.stages[0].powerUpDrop);
        
        // Shuffle platforms to increase difficulty
        if (this.platformGenerator) {
            this.platformGenerator.shufflePlatforms();
        }
        
        // Add new attacks
        // This would be implemented in the full version
    }

    transitionToStageThree() {
        this.stageThree = true;
        
        // Add more dramatic visual effect
        this.cameras.main.flash(1500, 255, 0, 0);
        this.cameras.main.shake(1000, 0.02);
        
        // Change boss appearance
        // In a full implementation, this would do more
        
        // Drop power-up
        this.dropPowerUp(this.bossData.stages[1].powerUpDrop);
        
        // Make platforms hazardous for a limited time
        if (this.platformGenerator) {
            this.platformGenerator.activateHazards();
        }
        
        // Add new attacks and increase speed
        // This would be implemented in the full version
    }

    dropPowerUp(powerUpId) {
        // Find the power-up data
        const powerUpData = this.bossData.powerUps.find(p => p.id === powerUpId);
        
        if (!powerUpData) return;
        
        // Create power-up at random location
        const x = Phaser.Math.Between(200, 1000);
        const y = Phaser.Math.Between(100, 200);
        
        const powerUp = this.powerUps.create(x, y, 'platform');
        powerUp.setTint(0x00ffff);
        powerUp.setCircle(20);
        powerUp.setBounce(0.8);
        powerUp.setCollideWorldBounds(true);
        powerUp.setData('id', powerUpData.id);
        powerUp.setData('name', powerUpData.name);
        powerUp.setData('effect', powerUpData.effect);
        
        // Add physics
        this.physics.add.collider(powerUp, this.platforms);
        
        // Add text label
        const text = this.add.text(x, y - 30, powerUpData.name, {
            font: '16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Create link between power-up and its text
        powerUp.setData('text', text);
        
        // Add glow effect
        this.tweens.add({
            targets: powerUp,
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    collectPowerUp(player, powerUp) {
        // Add safety checks
        if (!powerUp || !powerUp.active) {
            console.warn("Tried to collect an invalid power-up");
            return;
        }
        
        // Get power-up data
        const text = powerUp.getData('text');
        const name = powerUp.getData('name') || "Power-Up";
        const effect = powerUp.getData('effect');
        
        // Clean up text if it exists
        if (text) {
            text.destroy();
        }
        
        // Apply power-up effect using the Player class method
        if (effect && typeof effect === 'object' && effect.type) {
            console.log("Applying power-up:", effect);
            player.applyPowerUp(
                effect.type,
                effect.magnitude || 1,
                effect.duration === 0 ? null : (effect.duration || 10000) // Default 10 seconds if not specified
            );
        } else {
            console.warn("Power-up has invalid effect data:", effect);
            // Apply default effect (weapon boost) if effect data is missing
            player.applyPowerUp('weapon', 2, 10000);
        }
        
        // Show effect text
        const acquiredText = this.add.text(player.x, player.y - 50, `${name} acquired!`, {
            font: '18px Arial',
            fill: '#00ffff'
        }).setOrigin(0.5).setDepth(1);
        
        // Animate the text
        this.tweens.add({
            targets: acquiredText,
            y: acquiredText.y - 50,
            alpha: 0,
            duration: 1500,
            onComplete: () => {
                acquiredText.destroy();
            }
        });
        
        // Add to score
        this.score += 50;
        this.scoreText.setText(`Score: ${this.score}`);
        
        // Destroy power-up last to avoid null references
        powerUp.destroy();
    }

    shoot() {
        // Create projectile
        const projectile = this.playerProjectiles.create(this.player.x, this.player.y, 'platform');
        projectile.setScale(0.5);
        projectile.setTint(0x00ff00);
        projectile.setCircle(10);
        
        // Set projectile properties based on power-ups
        const magnitude = this.player.powerUp && this.player.powerUp.type === 'weapon' ? 
            this.player.powerUp.magnitude : 1;
        
        // Determine direction based on player input
        let velocityX = 0;
        let velocityY = -400; // Default is shooting upward
        
        if (this.cursors.left.isDown) {
            velocityX = -400;
        } else if (this.cursors.right.isDown) {
            velocityX = 400;
        }
        
        // Single shot or multiple shots based on power-up
        if (magnitude === 1) {
            projectile.setVelocity(velocityX, velocityY);
        } else {
            // Spread shots if have power-up
            projectile.setVelocity(velocityX, velocityY);
            
            // Create additional projectiles
            for (let i = 1; i < magnitude; i++) {
                const angle = 20 * i;
                const spreadProjectile = this.playerProjectiles.create(this.player.x, this.player.y, 'platform');
                spreadProjectile.setScale(0.5);
                spreadProjectile.setTint(0x00ff00);
                spreadProjectile.setCircle(10);
                
                // Calculate spread velocity
                const rad = angle * Math.PI / 180;
                const spreadX = velocityX * Math.cos(rad) - velocityY * Math.sin(rad);
                const spreadY = velocityX * Math.sin(rad) + velocityY * Math.cos(rad);
                
                spreadProjectile.setVelocity(spreadX, spreadY);
            }
        }
        
        // Set timeout to destroy projectiles
        this.time.delayedCall(2000, () => {
            projectile.destroy();
        });
    }

    melee() {
        // Create melee hitbox
        const hitbox = this.playerProjectiles.create(this.player.x, this.player.y - 50, 'platform');
        hitbox.setVisible(false);
        hitbox.setScale(1.5);
        hitbox.body.setSize(100, 60);
        hitbox.setImmovable(true);
        hitbox.setData('melee', true);
        
        // Destroy after a short time
        this.time.delayedCall(200, () => {
            hitbox.destroy();
        });
        
        // Visual effect for slash
        const slash = this.add.graphics();
        slash.fillStyle(0xffff00, 0.8);
        slash.fillCircle(this.player.x, this.player.y - 40, 50);
        
        // Remove visual effect
        this.time.delayedCall(200, () => {
            slash.destroy();
        });
    }

    hitPlatform(projectile) {
        // Simple destroy on platform hit
        projectile.setActive(false);
        projectile.setVisible(false);
    }

    hitBoss(projectile, bossPart) {
        console.log("Hit boss detected! Projectile:", projectile, "Boss part:", bossPart);
        
        // Debug visualization to confirm overlap is working
        const hitMarker = this.add.circle(projectile.x, projectile.y, 10, 0xff0000);
        this.time.delayedCall(300, () => hitMarker.destroy());
        
        // Check if part is vulnerable
        if (!bossPart.getData('vulnerable') && 
            !bossPart.getData('vulnerableDuring').includes('always')) {
            
            // Visual feedback that part isn't vulnerable
            this.add.text(projectile.x, projectile.y, 'IMMUNE', {
                font: '16px Arial',
                fill: '#ffff00'
            }).setOrigin(0.5);
            
            // Destroy projectile
            projectile.setActive(false);
            projectile.setVisible(false);
            return;
        }
        
        // Damage calculation
        let damage = 1;
        if (projectile.getData('type') === 'melee' || projectile.getData('damage')) {
            damage = projectile.getData('damage') || 2; // Melee does more damage
        }
        
        // Apply damage
        const currentHP = bossPart.getData('hitPoints');
        bossPart.setData('hitPoints', Math.max(0, currentHP - damage));
        
        // Visual feedback
        bossPart.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            bossPart.setTint(0xff00ff);
        });
        
        // Show damage number
        const damageText = this.add.text(bossPart.x, bossPart.y, `-${damage}`, {
            font: '20px Arial',
            fill: '#ff0000'
        }).setOrigin(0.5).setDepth(1);
        
        this.tweens.add({
            targets: damageText,
            y: damageText.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                damageText.destroy();
            }
        });
        
        // Make sure boss instance recalculates its health
        if (this.boss) {
            this.boss.calculateHealth();
            console.log("Boss hit! New health: " + this.boss.totalHealth + "/" + this.boss.maxHealth);
        } else {
            console.warn("Boss reference is missing!");
        }
        
        // Update boss health display
        this.updateBossHealthBar();
        
        // Update score
        this.score += 10 * damage;
        this.scoreText.setText(`Score: ${this.score}`);
        
        // Check if part is destroyed
        if (bossPart.getData('hitPoints') <= 0) {
            this.destroyBossPart(bossPart);
        }
        
        // Destroy projectile
        projectile.setActive(false);
        projectile.setVisible(false);
    }

    destroyBossPart(part) {
        // Visual effect for destroyed part
        const explosion = this.add.graphics();
        explosion.fillStyle(0xff0000, 1);
        explosion.fillCircle(part.x, part.y, 50);
        
        // Tween the explosion
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Clean up associated indicators/references
        const indicator = part.getData('vulnerableIndicator');
        if (indicator) {
            indicator.destroy();
        }
        
        // Remove part from game
        part.destroy();
        
        // Make sure boss recalculates its health
        if (this.boss) {
            this.boss.calculateHealth();
            this.updateBossHealthBar();
        }
        
        // Update score for destroying a part
        this.score += 100;
        this.scoreText.setText(`Score: ${this.score}`);
        
        // Check if all parts are destroyed
        if (this.bossGroup.getChildren().length === 0) {
            this.bossDeath();
        }
    }

    playerHitBoss(player, bossPart) {
        // Get damage amount and apply to player using Player class methods
        const damage = bossPart.getData('damageOnTouch');
        player.damage(damage);
    }

    playerDeath() {
        // Game over after delay
        this.time.delayedCall(2000, () => {
            this.gameOver(false);
        });
    }

    bossDeath() {
        // Visual effects
        this.cameras.main.shake(1000, 0.05);
        this.cameras.main.flash(1000, 255, 255, 255);
        
        // Show defeat message
        const text = this.add.text(640, 300, `${this.bossData.name} DEFEATED!`, {
            font: '48px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Fade out background
        this.tweens.add({
            targets: this.background,
            alpha: 0.3,
            duration: 2000
        });
        
        // Go to game over scene after delay
        this.time.delayedCall(4000, () => {
            this.scene.start('GameOver', { win: true, score: this.score });
        });
    }

    update(time, delta) {
        // Update player
        if (this.player) {
            this.player.update(time);
            
            // Update player power-up visuals if applicable
            this.player.updatePowerUpVisuals();
        }
        
        // Update boss
        if (this.boss) {
            this.boss.update(time, delta);
        }
        
        // Update power-up texts to follow their power-ups
        this.powerUps.getChildren().forEach(powerUp => {
            const text = powerUp.getData('text');
            if (text) {
                text.x = powerUp.x;
                text.y = powerUp.y - 30;
            }
        });
        
        // Scroll background
        this.background.tilePositionX += 0.5;
        
        // Update UI
        if (this.player) {
            this.playerHealthText.setText(`Health: ${this.player.health}`);
        }
        
        // Update boss health bar
        this.updateBossHealthBar();
        
        // Update platform generator
        if (this.platformGenerator) {
            this.platformGenerator.update();
        }
        
        // Update multiplayer
        if (this.multiplayerManager) {
            this.multiplayerManager.update();
        }
    }
    
    gameOver(win) {
        // Clean up multiplayer connection
        if (this.multiplayerManager) {
            this.multiplayerManager.disconnect();
        }
        
        this.scene.start('GameOver', { win, score: this.score });
    }
}