export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics properties
        this.setBounce(0.1);
        this.setCollideWorldBounds(true);
        this.body.setSize(60, 80);
        
        // Player state
        this.health = 3;
        this.maxHealth = 3;
        this.invulnerable = false;
        this.powerUp = null;
        this.doubleJumped = false;
        this.canWallJump = false;
        this.touchingWall = false;
        this.wallSliding = false;
        this.facing = 'right';
        
        // Weapon cooldowns
        this.lastGunFired = 0;
        this.gunCooldown = 500; // 0.5 seconds
        
        this.lastSwordSwing = 0;
        this.swordCooldown = 700; // 0.7 seconds
        
        this.lastDodge = 0;
        this.dodgeCooldown = 2000; // 2 seconds
        
        // Create animations
        this.createAnimations();
        
        // Set up input
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyShift = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        
        // Mouse input for aiming
        this.scene = scene;
        
        // Projectile group
        this.projectiles = scene.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: 10,
            collideWorldBounds: false
        });
    }

    createAnimations() {
        // Only create animations if they don't exist yet
        if (!this.scene.anims.exists('player_idle')) {
            this.scene.anims.create({
                key: 'player_idle',
                frames: this.scene.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
                frameRate: 10,
                repeat: -1
            });
            
            this.scene.anims.create({
                key: 'player_run',
                frames: this.scene.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
            
            this.scene.anims.create({
                key: 'player_jump',
                frames: this.scene.anims.generateFrameNumbers('player', { start: 1, end: 1 }),
                frameRate: 1,
                repeat: -1
            });
            
            this.scene.anims.create({
                key: 'player_wall',
                frames: this.scene.anims.generateFrameNumbers('player', { start: 2, end: 2 }),
                frameRate: 1,
                repeat: -1
            });
        }
    }

    update(time) {
        if (this.body) {
            this.handleMovement();
            this.handleJumping();
            this.handleWallSliding();
            this.handleShooting(time);
            this.handleMeleeAttack(time);
            this.handleDodge(time);
            this.updateAnimation();
        }
    }

    handleMovement() {
        // Horizontal movement
        if (this.keyA.isDown || this.cursors.left.isDown) {
            this.setVelocityX(-300);
            this.facing = 'left';
            this.flipX = true;
        } else if (this.keyD.isDown || this.cursors.right.isDown) {
            this.setVelocityX(300);
            this.facing = 'right';
            this.flipX = false;
        } else {
            this.setVelocityX(0);
        }
    }

    handleJumping() {
        // Normal jump
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keyW) || 
                            Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                            Phaser.Input.Keyboard.JustDown(this.keySpace);
        
        if (jumpPressed && this.body.touching.down) {
            this.doubleJumped = false;
            this.setVelocityY(-500);
        }
        
        // Double jump
        else if (jumpPressed && !this.body.touching.down && !this.doubleJumped && !this.wallSliding) {
            this.doubleJumped = true;
            this.setVelocityY(-400);
            
            // Visual effect for double jump
            const jumpEffect = this.scene.add.graphics();
            jumpEffect.fillStyle(0x88ff88, 0.7);
            jumpEffect.fillCircle(this.x, this.y + 30, 20);
            
            // Add fade effect
            this.scene.tweens.add({
                targets: jumpEffect,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => {
                    jumpEffect.destroy();
                }
            });
        }
        
        // Wall jump
        else if (jumpPressed && this.wallSliding) {
            this.setVelocityY(-500);
            
            // Push away from wall
            const pushDirection = this.body.touching.left ? 1 : -1;
            this.setVelocityX(300 * pushDirection);
            
            // Reset double jump after wall jump
            this.doubleJumped = false;
            this.wallSliding = false;
            
            // Visual effect for wall jump
            const jumpEffect = this.scene.add.graphics();
            jumpEffect.fillStyle(0xaaaaff, 0.7);
            jumpEffect.fillCircle(
                this.body.touching.left ? this.x - 20 : this.x + 20, 
                this.y, 
                20
            );
            
            // Add fade effect with direction
            this.scene.tweens.add({
                targets: jumpEffect,
                alpha: 0,
                x: this.body.touching.left ? jumpEffect.x + 50 : jumpEffect.x - 50,
                scale: 2,
                duration: 300,
                onComplete: () => {
                    jumpEffect.destroy();
                }
            });
        }
    }

    handleWallSliding() {
        // Reset wall sliding state
        this.wallSliding = false;
        
        // Check for wall slide conditions
        if (!this.body.touching.down && (this.body.touching.left || this.body.touching.right)) {
            // If moving towards the wall or not pressing away
            if ((this.body.touching.left && this.keyA.isDown) || 
                (this.body.touching.right && this.keyD.isDown) ||
                (!this.keyA.isDown && !this.keyD.isDown)) {
                
                this.wallSliding = true;
                
                // Reduce falling speed while wall sliding
                if (this.body.velocity.y > 50) {
                    this.setVelocityY(50);
                }
                
                // Wall slide dust effect
                if (Math.random() > 0.8) {
                    const x = this.body.touching.left ? this.x - 20 : this.x + 20;
                    const y = this.y + Phaser.Math.Between(-20, 20);
                    
                    // Create a small dust graphic
                    const dust = this.scene.add.graphics();
                    dust.fillStyle(0xeeeeee, 0.6);
                    dust.fillCircle(x, y, 3);
                    
                    // Create fade effect
                    this.scene.tweens.add({
                        targets: dust,
                        alpha: 0,
                        scale: 2,
                        x: this.body.touching.left ? x + 10 : x - 10,
                        y: y + 5,
                        duration: 300,
                        onComplete: () => {
                            dust.destroy();
                        }
                    });
                }
            }
        }
    }

    handleShooting(time) {
        // Gun shooting (left mouse button)
        if (this.scene.input.activePointer.leftButtonDown() && 
            time > this.lastGunFired + this.gunCooldown) {
            
            this.lastGunFired = time;
            this.shootGun();
        }
    }

    // Method to shoot at specific coordinates (for AI)
    shootAt(targetX, targetY) {
        // Calculate direction vector
        const dirX = targetX - this.x;
        const dirY = targetY - this.y;
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        const normalizedDirX = dirX / length;
        const normalizedDirY = dirY / length;
        
        // Create and configure projectile similar to the regular shooting
        this._createProjectile(normalizedDirX, normalizedDirY);
    }
    
    shootGun() {
        // Get target direction from mouse position
        const pointer = this.scene.input.activePointer;
        const targetX = pointer.worldX;
        const targetY = pointer.worldY;
        
        // Calculate direction vector
        const dirX = targetX - this.x;
        const dirY = targetY - this.y;
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        const normalizedDirX = dirX / length;
        const normalizedDirY = dirY / length;
        
        // Create projectile using the helper method
        this._createProjectile(normalizedDirX, normalizedDirY);
    }
    
    // Helper method to create projectile with given direction
    _createProjectile(normalizedDirX, normalizedDirY) {
        
        // Create projectile
        const projectile = this.projectiles.get(this.x, this.y, 'platform');
        if (projectile) {
            projectile.setActive(true);
            projectile.setVisible(true);
            projectile.setScale(0.3);
            projectile.setTint(0x00ff00);
            
            // Debug message
            console.log("Creating projectile:", projectile);
            
            // Reset physics body
            if (projectile.body) {
                projectile.body.reset(this.x, this.y);
                projectile.body.setCircle(10);
                projectile.body.allowGravity = false;
                projectile.body.setImmovable(false); // Allow it to be affected by collisions
                projectile.body.enable = true; // Make sure physics body is enabled
            } else {
                console.warn("Projectile has no physics body!");
            }
            
            // Set projectile velocity
            const speed = 600;
            projectile.setVelocity(normalizedDirX * speed, normalizedDirY * speed);
            
            // Rotate projectile to face direction of travel
            projectile.rotation = Math.atan2(normalizedDirY, normalizedDirX);
            
            // Auto-destroy after 2 seconds
            this.scene.time.delayedCall(2000, () => {
                projectile.setActive(false);
                projectile.setVisible(false);
                if (projectile.body) {
                    projectile.body.stop();
                }
            });
            
            // Multi-shot if player has power-up
            if (this.powerUp && this.powerUp.type === 'weapon') {
                const magnitude = this.powerUp.magnitude;
                
                for (let i = 1; i < magnitude; i++) {
                    // Calculate spread angle
                    const spread = 15 * i * (i % 2 === 0 ? 1 : -1);
                    const angle = Math.atan2(normalizedDirY, normalizedDirX) + (spread * Math.PI / 180);
                    
                    // Get new direction
                    const spreadDirX = Math.cos(angle);
                    const spreadDirY = Math.sin(angle);
                    
                    // Create additional projectile
                    const spreadProjectile = this.projectiles.get(this.x, this.y, 'platform');
                    if (spreadProjectile) {
                        spreadProjectile.setActive(true);
                        spreadProjectile.setVisible(true);
                        spreadProjectile.setScale(0.3);
                        spreadProjectile.setTint(0x00ff00);
                        if (spreadProjectile.body) {
                            spreadProjectile.body.setCircle(10);
                            spreadProjectile.body.allowGravity = false;
                            spreadProjectile.body.setImmovable(true);
                        }
                        
                        // Set velocity
                        spreadProjectile.setVelocity(spreadDirX * speed, spreadDirY * speed);
                        
                        // Rotate
                        spreadProjectile.rotation = angle;
                        
                        // Auto-destroy
                        this.scene.time.delayedCall(2000, () => {
                            spreadProjectile.setActive(false);
                            spreadProjectile.setVisible(false);
                            if (spreadProjectile.body) {
                                spreadProjectile.body.stop();
                            }
                        });
                    }
                }
            }
            
            // Visual muzzle flash
            const flash = this.scene.add.graphics();
            flash.fillStyle(0xffff00, 0.8);
            flash.fillCircle(this.x + normalizedDirX * 40, this.y + normalizedDirY * 40, 15);
            
            this.scene.time.delayedCall(100, () => {
                flash.destroy();
            });
        }
    }

    handleMeleeAttack(time) {
        // Sword attack (right mouse button)
        if (this.scene.input.activePointer.rightButtonDown() && 
            time > this.lastSwordSwing + this.swordCooldown) {
            
            this.lastSwordSwing = time;
            this.swingSword();
        }
    }

    // Method to swing at specific coordinates (for AI)
    swingAt(targetX, targetY) {
        // Calculate direction
        const dirX = targetX - this.x;
        const dirY = targetY - this.y;
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        const normalizedDirX = dirX / length;
        const normalizedDirY = dirY / length;
        
        // Create sword hitbox and effect
        this._createSwordHitbox(normalizedDirX, normalizedDirY);
    }
    
    swingSword() {
        // Get target direction from mouse position
        const pointer = this.scene.input.activePointer;
        const targetX = pointer.worldX;
        const targetY = pointer.worldY;
        
        // Calculate direction
        const dirX = targetX - this.x;
        const dirY = targetY - this.y;
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        const normalizedDirX = dirX / length;
        const normalizedDirY = dirY / length;
        
        // Create sword hitbox and effect
        this._createSwordHitbox(normalizedDirX, normalizedDirY);
    }
    
    // Helper method to create sword hitbox with given direction
    _createSwordHitbox(normalizedDirX, normalizedDirY) {
        
        // Create melee hitbox in the direction of the mouse
        const hitbox = this.scene.physics.add.sprite(
            this.x + normalizedDirX * 60, 
            this.y + normalizedDirY * 60, 
            'platform'
        );
        
        hitbox.setScale(1.2);
        hitbox.setSize(100, 100);
        hitbox.setOffset(-50, -50);
        hitbox.setVisible(false);
        
        if (hitbox.body) {
            hitbox.body.allowGravity = false;
        }
        
        hitbox.setData('damage', 2);
        hitbox.setData('type', 'melee');
        
        // Add to scene's sword hitboxes group if it exists
        if (this.scene.swordHitboxes) {
            this.scene.swordHitboxes.add(hitbox);
        }
        
        // Create visual effect for sword swing
        const arc = this.scene.add.graphics();
        arc.fillStyle(0xffffaa, 0.8);
        
        // Draw sword arc based on direction (120° arc)
        const arcStart = Math.atan2(normalizedDirY, normalizedDirX) - Math.PI / 3; // -60 degrees
        const arcEnd = Math.atan2(normalizedDirY, normalizedDirX) + Math.PI / 3;   // +60 degrees
        
        arc.beginPath();
        arc.moveTo(this.x, this.y);
        arc.arc(this.x, this.y, 80, arcStart, arcEnd);
        arc.closePath();
        arc.fill();
        
        // Remove visual effect and hitbox after short delay
        this.scene.time.delayedCall(200, () => {
            arc.destroy();
            hitbox.destroy();
        });
    }

    handleDodge(time) {
        // Dodge/dive on Shift
        if (Phaser.Input.Keyboard.JustDown(this.keyShift) && 
            time > this.lastDodge + this.dodgeCooldown) {
            
            this.lastDodge = time;
            this.dodge();
        }
    }

    dodge() {
        // Make player invulnerable
        this.invulnerable = true;
        this.alpha = 0.5;
        
        // Apply dodge velocity in current movement direction
        let dodgeVelocityX = 0;
        let dodgeVelocityY = 0;
        
        // Use momentum or key direction
        if (Math.abs(this.body.velocity.x) > 50) {
            // Use momentum direction
            dodgeVelocityX = this.body.velocity.x > 0 ? 500 : -500;
        } else if (this.keyA.isDown || this.cursors.left.isDown) {
            dodgeVelocityX = -500;
        } else if (this.keyD.isDown || this.cursors.right.isDown) {
            dodgeVelocityX = 500;
        }
        
        // For vertical movement, dodge slightly upwards if jumping, more downwards if falling
        if (this.body.velocity.y < 0) {
            dodgeVelocityY = -300; // Dodging while jumping gives slight upward boost
        } else if (this.body.velocity.y > 0) {
            dodgeVelocityY = 200;  // Dodging while falling dives faster
        }
        
        // If no direction pressed, dodge in facing direction
        if (dodgeVelocityX === 0) {
            dodgeVelocityX = this.facing === 'right' ? 500 : -500;
        }
        
        // Apply dodge velocity
        this.setVelocity(dodgeVelocityX, dodgeVelocityY);
        
        // Create afterimages
        const createAfterimage = () => {
            const afterimage = this.scene.add.image(this.x, this.y, 'player', 0);
            afterimage.flipX = this.flipX;
            afterimage.setAlpha(0.3);
            afterimage.setTint(0x88ccff);
            
            this.scene.tweens.add({
                targets: afterimage,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    afterimage.destroy();
                }
            });
        };
        
        // Create multiple afterimages during dodge
        createAfterimage();
        this.scene.time.delayedCall(50, createAfterimage);
        this.scene.time.delayedCall(100, createAfterimage);
        this.scene.time.delayedCall(150, createAfterimage);
        
        // End invulnerability after delay
        this.scene.time.delayedCall(300, () => {
            this.invulnerable = false;
            this.alpha = 1;
        });
    }

    updateAnimation() {
        // Set animation based on state
        if (this.wallSliding) {
            this.anims.play('player_wall', true);
        } else if (!this.body.touching.down) {
            this.anims.play('player_jump', true);
        } else if (this.body.velocity.x !== 0) {
            this.anims.play('player_run', true);
        } else {
            this.anims.play('player_idle', true);
        }
    }

    damage(amount) {
        // Skip if invulnerable
        if (this.invulnerable) return;
        
        // Check for shield power-up
        if (this.powerUp && this.powerUp.type === 'defense') {
            // Use up the shield
            this.powerUp = null;
            
            // Visual feedback
            const text = this.scene.add.text(this.x, this.y - 50, 'SHIELD ABSORBED!', {
                font: '18px Arial',
                fill: '#ffff00'
            }).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: text,
                y: text.y - 50,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    text.destroy();
                }
            });
            
            // Make player invulnerable briefly
            this.invulnerable = true;
            this.scene.time.delayedCall(1000, () => {
                this.invulnerable = false;
            });
            
            return;
        }
        
        // Apply damage
        this.health -= amount;
        
        // Visual feedback
        this.setTint(0xff0000);
        this.scene.cameras.main.shake(200, 0.01);
        
        // Damage number text
        const damageText = this.scene.add.text(this.x, this.y - 40, `-${amount}`, {
            font: '24px Arial',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                damageText.destroy();
            }
        });
        
        // Make player invulnerable briefly
        this.invulnerable = true;
        this.scene.time.delayedCall(1000, () => {
            this.setTint(0xffffff);
            this.invulnerable = false;
        });
        
        // Check if player is dead
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Stop player control
        this.body.setVelocity(0);
        this.setTint(0xff0000);
        this.disableBody();
        
        // Death effect
        const explosion = this.scene.add.graphics();
        explosion.fillStyle(0xff0000, 1);
        explosion.fillCircle(this.x, this.y, 50);
        
        // Screen effects
        this.scene.cameras.main.shake(500, 0.05);
        this.scene.cameras.main.flash(1000, 255, 0, 0);
        
        // Tween the explosion
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 2,
            duration: 1000,
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Trigger game over after delay
        this.scene.time.delayedCall(2000, () => {
            this.scene.gameOver(false);
        });
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        
        // Visual healing effect
        const healText = this.scene.add.text(this.x, this.y - 40, `+${amount}`, {
            font: '24px Arial',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: healText,
            y: healText.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                healText.destroy();
            }
        });
        
        // Healing effect
        const healingEffect = this.scene.add.graphics();
        healingEffect.fillStyle(0x00ff00, 0.6);
        healingEffect.fillCircle(this.x, this.y, 30);
        
        // Add pulse effect
        this.scene.tweens.add({
            targets: healingEffect,
            alpha: 0,
            scale: 2,
            duration: 800,
            onComplete: () => {
                healingEffect.destroy();
            }
        });
    }

    applyPowerUp(type, magnitude, duration = null) {
        this.powerUp = {
            type,
            magnitude,
            duration,
            startTime: this.scene.time.now
        };
        
        // Visual effect
        this.setPowerUpVisuals();
        
        // Start duration timer if applicable
        if (duration !== null) {
            this.scene.time.delayedCall(duration, () => {
                this.powerUp = null;
                this.clearPowerUpVisuals();
            });
        }
    }

    setPowerUpVisuals() {
        // Different visual effect based on power-up type
        if (!this.powerUp) return;
        
        if (this.powerUpEffect) {
            this.powerUpEffect.destroy();
        }
        
        this.powerUpEffect = this.scene.add.graphics();
        
        if (this.powerUp.type === 'weapon') {
            this.powerUpEffect.fillStyle(0x0088ff, 0.3);
        } else if (this.powerUp.type === 'defense') {
            this.powerUpEffect.fillStyle(0xffff00, 0.3);
        } else if (this.powerUp.type === 'speed') {
            this.powerUpEffect.fillStyle(0x00ff88, 0.3);
        }
        
        // Draw circle around player
        this.powerUpEffect.fillCircle(0, 0, 40);
        
        // Add to player container
        this.powerUpEffect.setPosition(this.x, this.y);
        
        // Animate
        this.scene.tweens.add({
            targets: this.powerUpEffect,
            alpha: 0.1,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    clearPowerUpVisuals() {
        if (this.powerUpEffect) {
            this.powerUpEffect.destroy();
            this.powerUpEffect = null;
        }
    }

    updatePowerUpVisuals() {
        if (this.powerUpEffect) {
            this.powerUpEffect.setPosition(this.x, this.y);
        }
    }
}