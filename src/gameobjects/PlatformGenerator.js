export class PlatformGenerator {
    constructor(scene) {
        this.scene = scene;
        this.platforms = null;
        this.movingPlatforms = [];
        this.temporaryPlatforms = [];
        this.hazardPlatforms = [];
    }
    
    generate(config = {}) {
        // Default configuration
        const defaultConfig = {
            floorHeight: 700,
            platformCount: {
                static: 5,
                moving: 2,
                temporary: 0,
                hazard: 0
            },
            platformHeight: {
                min: 200,
                max: 600
            },
            platformWidth: {
                min: 100,
                max: 200
            },
            platformDistribution: 'balanced' // Options: balanced, clustered, scattered
        };
        
        // Merge with provided config
        const finalConfig = { ...defaultConfig, ...config };
        
        // Create the platforms group
        this.platforms = this.scene.physics.add.staticGroup();
        
        // Create main floor platform
        this.createFloor(finalConfig.floorHeight);
        
        // Create static platforms
        this.createStaticPlatforms(finalConfig);
        
        // Create moving platforms
        this.createMovingPlatforms(finalConfig);
        
        // Create temporary platforms
        this.createTemporaryPlatforms(finalConfig);
        
        // Create hazard platforms
        this.createHazardPlatforms(finalConfig);
        
        return this.platforms;
    }
    
    createFloor(height) {
        // Create the main floor
        this.platforms.create(640, height, 'platform')
            .setScale(8, 1)
            .refreshBody()
            .setData('type', 'floor');
    }
    
    createStaticPlatforms(config) {
        const count = config.platformCount.static;
        const screenWidth = this.scene.sys.game.config.width;
        const screenHeight = this.scene.sys.game.config.height;
        
        // Determine platform distribution strategy
        if (config.platformDistribution === 'balanced') {
            // Divide the screen into sectors for a balanced distribution
            const sectorsX = 3;
            const sectorsY = 3;
            const sectorWidth = screenWidth / sectorsX;
            const sectorHeight = (config.floorHeight - 100) / sectorsY;
            
            // Create platforms in different screen sectors
            for (let i = 0; i < count; i++) {
                // Ensure good distribution by placing platforms in different sectors
                const sectorX = i % sectorsX;
                const sectorY = Math.floor(i / sectorsX) % sectorsY;
                
                // Calculate platform position within the sector
                const x = sectorX * sectorWidth + Phaser.Math.Between(100, sectorWidth - 100);
                const y = 100 + sectorY * sectorHeight + Phaser.Math.Between(50, sectorHeight - 50);
                
                // Create platform
                const width = Phaser.Math.Between(config.platformWidth.min, config.platformWidth.max);
                
                this.platforms.create(x, y, 'platform')
                    .setScale(width / 100, 0.5)
                    .refreshBody()
                    .setData('type', 'static');
            }
        } 
        else if (config.platformDistribution === 'clustered') {
            // Create clusters of platforms in 2-3 areas
            const clusterCount = Phaser.Math.Between(2, 3);
            const platformsPerCluster = Math.ceil(count / clusterCount);
            
            for (let c = 0; c < clusterCount; c++) {
                // Choose a cluster center
                const clusterX = Phaser.Math.Between(200, screenWidth - 200);
                const clusterY = Phaser.Math.Between(200, config.floorHeight - 200);
                
                for (let i = 0; i < platformsPerCluster; i++) {
                    if (c * platformsPerCluster + i >= count) break;
                    
                    // Position platform near the cluster center
                    const radius = Phaser.Math.Between(50, 150);
                    const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
                    const x = clusterX + Math.cos(angle) * radius;
                    const y = clusterY + Math.sin(angle) * radius;
                    
                    // Create platform
                    const width = Phaser.Math.Between(config.platformWidth.min, config.platformWidth.max);
                    
                    if (x > 50 && x < screenWidth - 50 && y > 100 && y < config.floorHeight - 50) {
                        this.platforms.create(x, y, 'platform')
                            .setScale(width / 100, 0.5)
                            .refreshBody()
                            .setData('type', 'static');
                    }
                }
            }
        }
        else { // scattered
            // Random distribution across the screen
            for (let i = 0; i < count; i++) {
                const x = Phaser.Math.Between(100, screenWidth - 100);
                const y = Phaser.Math.Between(150, config.floorHeight - 150);
                const width = Phaser.Math.Between(config.platformWidth.min, config.platformWidth.max);
                
                this.platforms.create(x, y, 'platform')
                    .setScale(width / 100, 0.5)
                    .refreshBody()
                    .setData('type', 'static');
            }
        }
    }
    
    createMovingPlatforms(config) {
        const count = config.platformCount.moving;
        const screenWidth = this.scene.sys.game.config.width;
        const screenHeight = this.scene.sys.game.config.height;
        
        for (let i = 0; i < count; i++) {
            // Create at varied heights
            const y = Phaser.Math.Between(config.platformHeight.min, config.platformHeight.max);
            
            // Alternate between horizontal and vertical moving platforms
            if (i % 2 === 0) {
                // Horizontal moving platform
                const x = Phaser.Math.Between(200, screenWidth - 200);
                const width = Phaser.Math.Between(config.platformWidth.min, config.platformWidth.max);
                
                const platform = this.scene.physics.add.sprite(x, y, 'platform');
                platform.setScale(width / 100, 0.5);
                platform.body.setImmovable(true);
                platform.body.allowGravity = false;
                platform.setData('type', 'moving');
                platform.setData('movementType', 'horizontal');
                
                // Create movement tween
                const distance = Phaser.Math.Between(100, 300);
                const speed = Phaser.Math.Between(3000, 6000);
                
                const tween = this.scene.tweens.add({
                    targets: platform,
                    x: x + distance,
                    duration: speed,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
                
                // Store platform and tween
                this.movingPlatforms.push({ platform, tween });
            } else {
                // Vertical moving platform
                const x = Phaser.Math.Between(200, screenWidth - 200);
                const width = Phaser.Math.Between(config.platformWidth.min, config.platformWidth.max);
                
                const platform = this.scene.physics.add.sprite(x, y, 'platform');
                platform.setScale(width / 100, 0.5);
                platform.body.setImmovable(true);
                platform.body.allowGravity = false;
                platform.setData('type', 'moving');
                platform.setData('movementType', 'vertical');
                
                // Create movement tween
                const distance = Phaser.Math.Between(50, 150);
                const speed = Phaser.Math.Between(3000, 6000);
                
                const tween = this.scene.tweens.add({
                    targets: platform,
                    y: y + distance,
                    duration: speed,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
                
                // Store platform and tween
                this.movingPlatforms.push({ platform, tween });
            }
        }
        
        // Set up collision between player and moving platforms
        if (this.scene.player) {
            this.movingPlatforms.forEach(({ platform }) => {
                this.scene.physics.add.collider(this.scene.player, platform, this.handlePlayerPlatformCollision, null, this);
            });
        }
    }
    
    createTemporaryPlatforms(config) {
        const count = config.platformCount.temporary;
        const screenWidth = this.scene.sys.game.config.width;
        
        for (let i = 0; i < count; i++) {
            // Create at varied positions
            const x = Phaser.Math.Between(200, screenWidth - 200);
            const y = Phaser.Math.Between(config.platformHeight.min, config.platformHeight.max);
            const width = Phaser.Math.Between(config.platformWidth.min, config.platformWidth.max);
            
            const platform = this.scene.physics.add.sprite(x, y, 'platform');
            platform.setScale(width / 100, 0.5);
            platform.body.setImmovable(true);
            platform.body.allowGravity = false;
            platform.setTint(0x00ffff);
            platform.setAlpha(0.7);
            platform.setData('type', 'temporary');
            platform.setData('timeToDisappear', Phaser.Math.Between(1000, 3000));
            platform.setData('active', false);
            
            // Create blinking effect
            const blinkTween = this.scene.tweens.add({
                targets: platform,
                alpha: 0.4,
                duration: 500,
                yoyo: true,
                repeat: -1,
                paused: true
            });
            
            // Store platform and tween
            this.temporaryPlatforms.push({ platform, blinkTween });
            
            // Set up collision
            if (this.scene.player) {
                this.scene.physics.add.collider(
                    this.scene.player, 
                    platform, 
                    () => this.handleTemporaryPlatformCollision(platform, blinkTween), 
                    null, 
                    this
                );
            }
        }
    }
    
    createHazardPlatforms(config) {
        const count = config.platformCount.hazard;
        const screenWidth = this.scene.sys.game.config.width;
        
        for (let i = 0; i < count; i++) {
            // Create at varied positions
            const x = Phaser.Math.Between(200, screenWidth - 200);
            const y = Phaser.Math.Between(config.platformHeight.min, config.platformHeight.max);
            const width = Phaser.Math.Between(config.platformWidth.min, config.platformWidth.max);
            
            const platform = this.scene.physics.add.sprite(x, y, 'platform');
            platform.setScale(width / 100, 0.5);
            platform.body.setImmovable(true);
            platform.body.allowGravity = false;
            platform.setTint(0xff0000);
            platform.setData('type', 'hazard');
            platform.setData('damage', 1);
            
            // Create effect
            const glowTween = this.scene.tweens.add({
                targets: platform,
                alpha: 0.7,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
            
            // Create simple visual effect instead of particles
            const glow = this.scene.add.graphics();
            glow.fillStyle(0xff0000, 0.5);
            glow.fillCircle(platform.x, platform.y, 30);
            
            // Add pulsing effect
            this.scene.tweens.add({
                targets: glow,
                alpha: 0.2,
                yoyo: true,
                repeat: -1,
                duration: 500
            });
            
            // Store platform and effects
            this.hazardPlatforms.push({ platform, glowTween, glow });
            
            // Set up overlap for damage
            if (this.scene.player) {
                this.scene.physics.add.overlap(
                    this.scene.player, 
                    platform, 
                    this.handleHazardPlatformCollision, 
                    null, 
                    this
                );
            }
        }
    }
    
    handlePlayerPlatformCollision(player, platform) {
        // Ensure player can stand on the moving platform
        if (player.body.touching.down && platform.body.touching.up) {
            // Adjust player Y position to perfectly align with platform
            player.y = platform.y - platform.displayHeight/2 - player.displayHeight/2 + 5;
            
            // Apply platform's velocity to player when standing on it
            if (platform.getData('movementType') === 'horizontal') {
                const platformVelocityX = platform.body.velocity.x || 0;
                player.x += platformVelocityX * (this.scene.sys.game.loop.delta / 1000);
            }
        }
    }
    
    handleTemporaryPlatformCollision(platform, blinkTween) {
        if (!platform.getData('active')) {
            platform.setData('active', true);
            
            // Start blinking effect
            blinkTween.resume();
            
            // Destroy platform after timeout
            this.scene.time.delayedCall(platform.getData('timeToDisappear'), () => {
                blinkTween.stop();
                
                // Fade out effect
                this.scene.tweens.add({
                    targets: platform,
                    alpha: 0,
                    y: platform.y + 50,
                    duration: 500,
                    onComplete: () => {
                        platform.active = false;
                        platform.visible = false;
                        
                        // Respawn platform after delay
                        this.scene.time.delayedCall(Phaser.Math.Between(3000, 6000), () => {
                            platform.setPosition(
                                Phaser.Math.Between(200, this.scene.sys.game.config.width - 200),
                                Phaser.Math.Between(150, 500)
                            );
                            platform.setAlpha(0.7);
                            platform.setData('active', false);
                            platform.active = true;
                            platform.visible = true;
                        });
                    }
                });
            });
        }
    }
    
    handleHazardPlatformCollision(player, platform) {
        // Only damage player when stepping on platform from above
        if (player.body.touching.down && platform.body.touching.up) {
            player.damage(platform.getData('damage'));
            
            // Jump effect to push player away
            player.setVelocityY(-300);
            
            // Visual effect
            this.scene.cameras.main.shake(200, 0.01);
        }
    }
    
    shufflePlatforms() {
        // Shuffle static platforms
        this.platforms.getChildren().forEach(platform => {
            if (platform.getData('type') === 'static') {
                const screenWidth = this.scene.sys.game.config.width;
                const screenHeight = this.scene.sys.game.config.height;
                
                // Animate platform to new position
                this.scene.tweens.add({
                    targets: platform,
                    x: Phaser.Math.Between(100, screenWidth - 100),
                    y: Phaser.Math.Between(150, 600),
                    duration: 1000,
                    ease: 'Power2'
                });
            }
        });
        
        // Change direction of moving platforms
        this.movingPlatforms.forEach(({ platform, tween }) => {
            tween.timeScale = Phaser.Math.FloatBetween(0.5, 2);
            tween.yoyo = !tween.yoyo;
        });
    }
    
    activateHazards() {
        // Make all platforms hazardous temporarily
        this.platforms.getChildren().forEach(platform => {
            if (platform.getData('type') === 'static') {
                platform.setTint(0xff0000);
                platform.setData('originalType', platform.getData('type'));
                platform.setData('type', 'hazard');
                platform.setData('damage', 1);
                platform.setData('hazardTimer', 5000);
                
                // Create glowing effect
                const glow = this.scene.add.graphics();
                glow.fillStyle(0xff0000, 0.5);
                glow.fillCircle(platform.x, platform.y, 30);
                
                // Add pulsing effect
                this.scene.tweens.add({
                    targets: glow,
                    alpha: 0.2,
                    scale: 1.5,
                    yoyo: true,
                    repeat: -1,
                    duration: 500
                });
                
                platform.setData('hazardGlow', glow);
                
                // Set up player damage overlap
                if (this.scene.player) {
                    const collider = this.scene.physics.add.overlap(
                        this.scene.player, 
                        platform, 
                        this.handleHazardPlatformCollision, 
                        null, 
                        this
                    );
                    platform.setData('hazardCollider', collider);
                }
                
                // Reset platform after timer
                this.scene.time.delayedCall(platform.getData('hazardTimer'), () => {
                    platform.clearTint();
                    platform.setData('type', platform.getData('originalType'));
                    
                    // Remove hazard glow
                    const glow = platform.getData('hazardGlow');
                    if (glow) glow.destroy();
                    
                    // Remove collider
                    const collider = platform.getData('hazardCollider');
                    if (collider) this.scene.physics.world.removeCollider(collider);
                });
            }
        });
    }
    
    createTemporaryFloatingPlatform(x, y, width = 100, duration = 3000) {
        // Create a temporary platform at the specified location
        const platform = this.scene.physics.add.sprite(x, y, 'platform');
        platform.setScale(width / 100, 0.5);
        platform.body.setImmovable(true);
        platform.body.allowGravity = false;
        platform.setTint(0x00ffff);
        platform.setAlpha(0);
        platform.setData('type', 'temporary');
        
        // Fade in
        this.scene.tweens.add({
            targets: platform,
            alpha: 0.7,
            duration: 300
        });
        
        // Blink towards the end
        this.scene.time.delayedCall(duration - 1000, () => {
            this.scene.tweens.add({
                targets: platform,
                alpha: 0.3,
                duration: 200,
                yoyo: true,
                repeat: 4
            });
        });
        
        // Set up collision
        if (this.scene.player) {
            const collider = this.scene.physics.add.collider(this.scene.player, platform);
            platform.setData('collider', collider);
        }
        
        // Destroy after duration
        this.scene.time.delayedCall(duration, () => {
            // Remove collider
            const collider = platform.getData('collider');
            if (collider) this.scene.physics.world.removeCollider(collider);
            
            // Fade out and destroy
            this.scene.tweens.add({
                targets: platform,
                alpha: 0,
                y: platform.y + 50,
                duration: 300,
                onComplete: () => {
                    platform.destroy();
                }
            });
        });
        
        return platform;
    }
    
    update() {
        // Update temporary platforms status
        this.temporaryPlatforms.forEach(({ platform, blinkTween }) => {
            if (platform.active && platform.getData('active')) {
                // Update particle effects or other dynamic elements
            }
        });
        
        // Update hazard platforms
        this.hazardPlatforms.forEach(({ platform, glow }) => {
            if (platform.active && glow) {
                // Update glow position
                glow.x = platform.x;
                glow.y = platform.y;
            }
        });
    }
}