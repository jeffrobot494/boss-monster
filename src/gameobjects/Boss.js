export class Boss {
    constructor(scene, bossData) {
        this.scene = scene;
        this.data = bossData;
        this.currentStage = 0;
        this.container = null;
        this.parts = [];
        this.attackTimers = [];
        this.totalHealth = 0;
        this.maxHealth = 0;
        
        // Initialize the boss
        this.create();
    }
    
    create() {
        // Create boss container
        this.container = this.scene.add.container(640, 200);
        
        // Create the boss group for physical parts with physics enabled
        this.bossGroup = this.scene.physics.add.group({
            allowGravity: false,
            immovable: true,
            collideWorldBounds: false
        });
        
        // Create visual backdrop (non-interactive part)
        this.createBackdrop();
        
        // Create boss parts
        this.createParts();
        
        // Calculate initial total and max health
        this.calculateHealth();
        
        // Set up attack patterns
        this.setupAttacks();
    }
    
    createBackdrop() {
        // Create a backdrop based on boss appearance data
        const appearance = this.data.appearance;
        
        // Create backdrop graphics
        const backdrop = this.scene.add.graphics();
        
        // Draw based on base shape
        if (appearance.baseShape === 'humanoid') {
            // Draw a humanoid silhouette
            backdrop.fillStyle(parseInt(appearance.primaryColor.replace('#', '0x')), 0.7);
            
            // Head
            backdrop.fillCircle(0, -200, 100);
            
            // Body
            backdrop.fillRect(-120, -100, 240, 300);
            
            // Arms
            backdrop.fillRect(-170, -100, 50, 200);
            backdrop.fillRect(120, -100, 50, 200);
            
            // Special features
            appearance.specialFeatures.forEach(feature => {
                if (feature.type === 'eyes') {
                    const eyeColor = feature.emissive ? 0xffaaff : 0xaaaaaa;
                    backdrop.fillStyle(eyeColor, 0.9);
                    
                    // Draw eyes based on count
                    if (feature.count === 1) {
                        backdrop.fillCircle(0, -200, 30);
                    } else if (feature.count === 2) {
                        backdrop.fillCircle(-40, -210, 20);
                        backdrop.fillCircle(40, -210, 20);
                    } else if (feature.count === 3) {
                        backdrop.fillCircle(-40, -210, 15);
                        backdrop.fillCircle(0, -180, 15);
                        backdrop.fillCircle(40, -210, 15);
                    }
                }
                
                if (feature.type === 'tentacles' || feature.type === 'horns') {
                    backdrop.fillStyle(parseInt(appearance.secondaryColor.replace('#', '0x')), 0.8);
                    
                    // Draw tentacles or horns
                    const count = feature.count;
                    for (let i = 0; i < count; i++) {
                        const angle = (i / count) * Math.PI;
                        const x = Math.cos(angle) * 300;
                        const y = Math.sin(angle) * 250 - 100;
                        
                        // Draw a simpler shape for tentacles
                        backdrop.fillRect(-10, -50, 20, 50);
                        backdrop.fillCircle(x, y, 20);
                    }
                }
            });
        } 
        else if (appearance.baseShape === 'amorphous') {
            // Draw a simpler amorphous blob (just a circle with varying sizes)
            backdrop.fillStyle(parseInt(appearance.primaryColor.replace('#', '0x')), 0.7);
            
            // Main blob
            backdrop.fillCircle(0, 0, 250);
            
            // Add some smaller circles around for blobby effect
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const distance = 200;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                backdrop.fillCircle(x, y, 80);
            }
            
            // Special features
            appearance.specialFeatures.forEach(feature => {
                if (feature.type === 'eyes') {
                    const eyeColor = feature.emissive ? 0xffaaff : 0xaaaaaa;
                    backdrop.fillStyle(eyeColor, 0.9);
                    
                    // Randomly place eyes
                    for (let i = 0; i < feature.count; i++) {
                        const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
                        const distance = Phaser.Math.Between(50, 150);
                        const x = Math.cos(angle) * distance;
                        const y = Math.sin(angle) * distance;
                        const size = Phaser.Math.Between(10, 30);
                        
                        backdrop.fillCircle(x, y, size);
                    }
                }
            });
        }
        else {
            // Default circular shape
            backdrop.fillStyle(parseInt(appearance.primaryColor.replace('#', '0x')), 0.7);
            backdrop.fillCircle(0, 0, 250);
            
            // Add secondary color accents
            backdrop.fillStyle(parseInt(appearance.secondaryColor.replace('#', '0x')), 0.8);
            backdrop.fillCircle(0, 0, 200);
            
            // Special features
            appearance.specialFeatures.forEach(feature => {
                if (feature.type === 'eyes') {
                    const eyeColor = feature.emissive ? 0xffaaff : 0xaaaaaa;
                    backdrop.fillStyle(eyeColor, 0.9);
                    
                    // Draw eyes in a circle
                    for (let i = 0; i < feature.count; i++) {
                        const angle = (i / feature.count) * Math.PI * 2;
                        const x = Math.cos(angle) * 100;
                        const y = Math.sin(angle) * 100;
                        
                        backdrop.fillCircle(x, y, 30);
                    }
                }
            });
        }
        
        // Add ambient effects
        if (this.data.appearance.ambientEffects) {
            this.data.appearance.ambientEffects.forEach(effect => {
                if (effect.type === 'aura' || effect.type === 'energy aura') {
                    // Create aura effect with graphics
                    const aura = this.scene.add.graphics();
                    aura.fillStyle(parseInt(effect.color?.replace('#', '0x') || '0xffffff'), 0.3);
                    aura.fillCircle(0, 0, 300);
                    
                    // Add pulsing effect
                    this.scene.tweens.add({
                        targets: aura,
                        alpha: 0.1,
                        scale: 1.1,
                        duration: 2000,
                        yoyo: true,
                        repeat: -1
                    });
                    
                    this.container.add(aura);
                }
            });
        }
        
        // Add boss name text
        const nameText = this.scene.add.text(0, -300, `${this.data.name}, ${this.data.epithet}`, {
            font: '32px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Add to container
        this.container.add(backdrop);
        this.container.add(nameText);
    }
    
    createParts() {
        // Create interactive boss parts from bossData
        this.data.planeElements.forEach(partData => {
            const part = this.createPart(partData);
            this.parts.push(part);
        });
    }
    
    createPart(partData) {
        // Create physical boss part
        let part;
        
        if (partData.shape === 'circle') {
            part = this.scene.physics.add.sprite(partData.position.x, partData.position.y, 'platform')
                .setTint(0xff00ff);
                
            // Enable physics and set up circle body
            if (part.body) {
                part.body.setCircle(partData.size.width / 2);
                part.body.setOffset((part.width - partData.size.width) / 2, (part.height - partData.size.width) / 2);
            }
            
            // Debug message
            console.log("Created circle boss part:", part);
        } else {
            part = this.scene.physics.add.sprite(partData.position.x, partData.position.y, 'platform')
                .setTint(0xff00ff);
                
            // Enable physics and set up rectangle body
            if (part.body) {
                part.body.setSize(partData.size.width, partData.size.height);
            }
            
            // Debug message
            console.log("Created rectangle boss part:", part);
        }
        
        // Ensure physics body is enabled
        if (part.body) {
            part.body.enable = true;
            part.body.allowGravity = false;
            part.body.setImmovable(true);
        } else {
            console.warn("Boss part has no physics body!");
        }
        
        // Set part properties
        part.setData('id', partData.id);
        part.setData('type', partData.type);
        part.setData('hitPoints', partData.hitPoints);
        part.setData('maxHitPoints', partData.hitPoints);
        part.setData('damageOnTouch', partData.damageOnTouch);
        
        // For testing purposes, make all parts vulnerable by default
        // In a real implementation, this would be set according to boss logic
        part.setData('vulnerable', true);
        
        // Store original vulnerability settings for reference
        const vulnerableDuring = partData.vulnerableDuring || ['always'];
        part.setData('vulnerableDuring', vulnerableDuring);
        
        // Add visual indicator for vulnerable parts
        const vulnerableIndicator = this.scene.add.graphics();
        vulnerableIndicator.lineStyle(4, 0x00ff00, 1);
        vulnerableIndicator.strokeCircle(0, 0, part.width/2 + 10);
        
        // Position it at the part and make it follow the part
        this.scene.events.on('update', () => {
            if (part.active && vulnerableIndicator.active) {
                vulnerableIndicator.x = part.x;
                vulnerableIndicator.y = part.y;
                vulnerableIndicator.visible = part.getData('vulnerable');
            }
        });
        
        // Store reference to the indicator
        part.setData('vulnerableIndicator', vulnerableIndicator);
        
        part.setData('mobility', partData.mobility);
        part.setData('attackPatterns', partData.attackPatterns);
        part.setData('visualTell', partData.visualTell);
        
        // Add to boss group
        this.bossGroup.add(part);
        
        // Setup mobility
        this.setupPartMobility(part, partData.mobility);
        
        return part;
    }
    
    setupPartMobility(part, mobilityData) {
        if (mobilityData.type === 'static') {
            // No movement needed
            return;
        }
        
        if (mobilityData.type === 'patrol') {
            // Create patrol pattern
            const patrolDistance = 200;
            const startX = part.x;
            const startY = part.y;
            
            let destX = startX;
            let destY = startY;
            
            if (mobilityData.pattern === 'horizontal') {
                destX = startX + patrolDistance;
            } else if (mobilityData.pattern === 'vertical') {
                destY = startY + patrolDistance;
            } else if (mobilityData.pattern === 'diagonal') {
                destX = startX + patrolDistance;
                destY = startY + patrolDistance;
            } else if (mobilityData.pattern === 'circle') {
                // Circle pattern will be handled differently
                this.scene.tweens.add({
                    targets: part,
                    angle: 360,
                    x: startX,
                    y: startY,
                    duration: 5000 / mobilityData.speed,
                    ease: 'Sine.easeInOut',
                    repeat: -1,
                    callbackScope: this,
                    onUpdate: function(tween, target) {
                        const angle = target.angle * Math.PI / 180;
                        target.x = startX + Math.cos(angle) * patrolDistance;
                        target.y = startY + Math.sin(angle) * patrolDistance;
                    }
                });
                return;
            } else if (mobilityData.pattern === 'sine') {
                // Sine wave pattern
                this.scene.tweens.add({
                    targets: part,
                    x: {
                        value: {
                            getEnd: function (target, key, value) {
                                return startX + patrolDistance;
                            },
                            getStart: function (target, key, value) {
                                return startX - patrolDistance;
                            }
                        },
                        duration: 4000 / mobilityData.speed,
                        ease: 'Sine.easeInOut',
                        yoyo: true,
                        repeat: -1
                    },
                    y: {
                        value: function (t, target, key, value) {
                            return startY + Math.sin(t * 10) * 80;
                        },
                        duration: 4000 / mobilityData.speed,
                        yoyo: true,
                        repeat: -1
                    }
                });
                return;
            }
            
            // Basic tween for standard patterns
            this.scene.tweens.add({
                targets: part,
                x: destX,
                y: destY,
                duration: 2000 / mobilityData.speed,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
        
        if (mobilityData.type === 'tracking') {
            // Will track the player during update
            part.setData('tracking', true);
            part.setData('trackingSpeed', mobilityData.speed);
        }
    }
    
    calculateHealth() {
        // Calculate total and max health from all parts
        this.totalHealth = 0;
        this.maxHealth = 0;
        
        // Check if parts exist
        if (!this.parts || this.parts.length === 0) {
            console.warn("No boss parts exist to calculate health from");
            return;
        }
        
        this.parts.forEach(part => {
            if (part && part.active) {
                const hitPoints = part.getData('hitPoints');
                const maxHitPoints = part.getData('maxHitPoints');
                
                if (hitPoints !== undefined && maxHitPoints !== undefined) {
                    this.totalHealth += hitPoints;
                    this.maxHealth += maxHitPoints;
                } else {
                    console.warn("Part missing hitPoints or maxHitPoints data:", part);
                }
            }
        });
        
        //console.log(`Boss health recalculated: ${this.totalHealth}/${this.maxHealth}`);
    }
    
    setupAttacks() {
        // Find all attack patterns the boss can use
        const attackPatterns = this.data.attacks;
        
        // Set up attack timers for each part
        this.parts.forEach(part => {
            const partId = part.getData('id');
            
            // Get attacks for this part
            const partAttackIds = part.getData('attackPatterns');
            const partAttacks = attackPatterns.filter(attack => 
                partAttackIds.includes(attack.id) && attack.executingPart === partId
            );
            
            // Set up timers for each attack
            partAttacks.forEach(attack => {
                // Initial delay before first attack
                const initialDelay = Phaser.Math.Between(1000, 5000);
                
                // Create timer for this attack
                const timer = this.scene.time.addEvent({
                    delay: initialDelay,
                    callback: () => this.executeAttack(attack, part),
                    callbackScope: this,
                    loop: false
                });
                
                this.attackTimers.push({ timer, attack, part });
            });
        });
    }
    
    executeAttack(attackData, part) {
        // Check if part still exists
        if (!part.active) return;
        
        // First show the tell (visual warning)
        this.showTell(attackData, part);
        
        // Execute actual attack after telegraph duration
        this.scene.time.delayedCall(attackData.telegraphDuration * 1000, () => {
            // Check again if part still exists
            if (!part.active) return;
            
            // Execute the actual attack
            this.createAttackHitbox(attackData, part);
            
            // Set up vulnerability window if applicable
            if (attackData.vulnerabilityWindow) {
                const timing = attackData.vulnerabilityWindow.timing;
                const duration = attackData.vulnerabilityWindow.duration;
                
                if (timing === 'during' || timing === 'both') {
                    part.setData('vulnerable', true);
                }
                
                // Set vulnerable after attack if specified
                if (timing === 'after' || timing === 'both') {
                    this.scene.time.delayedCall(attackData.duration * 1000, () => {
                        if (!part.active) return;
                        
                        part.setData('vulnerable', true);
                        
                        // Show vulnerable cue
                        const vulnerableCue = this.scene.add.graphics();
                        vulnerableCue.lineStyle(4, 0x00ff00, 1);
                        vulnerableCue.strokeCircle(0, 0, part.width/2 + 10);
                        
                        // Attach to part
                        vulnerableCue.x = part.x;
                        vulnerableCue.y = part.y;
                        
                        // Animate
                        this.scene.tweens.add({
                            targets: vulnerableCue,
                            alpha: { from: 1, to: 0.3 },
                            scale: { from: 0.8, to: 1.2 },
                            duration: 500,
                            yoyo: true,
                            repeat: duration ? Math.floor(duration * 2) - 1 : 0
                        });
                        
                        // End vulnerability
                        this.scene.time.delayedCall(duration * 1000, () => {
                            if (!part.active) return;
                            part.setData('vulnerable', false);
                            vulnerableCue.destroy();
                        });
                    });
                }
            }
            
            // Schedule next attack after cooldown
            this.scene.time.delayedCall(attackData.cooldown * 1000, () => {
                // Find this attack timer
                const timerObj = this.attackTimers.find(t => t.attack.id === attackData.id && t.part === part);
                
                if (timerObj) {
                    // Reset timer
                    timerObj.timer = this.scene.time.addEvent({
                        delay: attackData.cooldown * 1000,
                        callback: () => this.executeAttack(attackData, part),
                        callbackScope: this,
                        loop: false
                    });
                }
            });
        });
    }
    
    showTell(attackData, part) {
        // Visual telegraph for attack
        const tell = this.scene.add.graphics();
        
        // Different visuals based on attack type
        if (attackData.pattern.type === 'linear' || attackData.pattern.type === 'tracking') {
            // Directional attack - show direction indicator
            tell.lineStyle(4, 0xff0000, 1);
            
            // Get target (player) position if tracking
            let targetX = 640;
            let targetY = 500;
            
            if (attackData.pattern.type === 'tracking' && this.scene.player) {
                targetX = this.scene.player.x;
                targetY = this.scene.player.y;
            }
            
            // Calculate direction
            const dx = targetX - part.x;
            const dy = targetY - part.y;
            const angle = Math.atan2(dy, dx);
            
            // Draw direction arrow
            tell.beginPath();
            tell.moveTo(part.x, part.y);
            tell.lineTo(
                part.x + Math.cos(angle) * 200,
                part.y + Math.sin(angle) * 200
            );
            tell.closePath();
            tell.stroke();
            
            // Add arrowhead
            const arrowLength = 20;
            const arrowAngle = 0.5;
            tell.lineTo(
                part.x + Math.cos(angle) * 200 - Math.cos(angle + arrowAngle) * arrowLength,
                part.y + Math.sin(angle) * 200 - Math.sin(angle + arrowAngle) * arrowLength
            );
            tell.moveTo(
                part.x + Math.cos(angle) * 200,
                part.y + Math.sin(angle) * 200
            );
            tell.lineTo(
                part.x + Math.cos(angle) * 200 - Math.cos(angle - arrowAngle) * arrowLength,
                part.y + Math.sin(angle) * 200 - Math.sin(angle - arrowAngle) * arrowLength
            );
            tell.stroke();
        } 
        else if (attackData.pattern.type === 'area' || attackData.pattern.type === 'pulse') {
            // Area attack - show radius
            tell.lineStyle(4, 0xff0000, 1);
            tell.strokeCircle(part.x, part.y, attackData.hitboxSize.width);
            
            // Pulse animation
            this.scene.tweens.add({
                targets: tell,
                alpha: 0,
                scale: 1.5,
                duration: attackData.telegraphDuration * 1000,
                onComplete: () => {
                    tell.destroy();
                }
            });
        }
        else if (attackData.pattern.type === 'beam') {
            // Beam attack - show line
            tell.lineStyle(attackData.hitboxSize.height, 0xff0000, 0.5);
            
            // Get target position
            let targetX = 640;
            let targetY = 500;
            
            if (this.scene.player) {
                targetX = this.scene.player.x;
                targetY = this.scene.player.y;
            }
            
            // Calculate direction
            const dx = targetX - part.x;
            const dy = targetY - part.y;
            const angle = Math.atan2(dy, dx);
            
            // Draw beam
            tell.beginPath();
            tell.moveTo(part.x, part.y);
            tell.lineTo(
                part.x + Math.cos(angle) * 1000,
                part.y + Math.sin(angle) * 1000
            );
            tell.closePath();
            tell.stroke();
            
            // Flash animation
            this.scene.tweens.add({
                targets: tell,
                alpha: { from: 0.2, to: 0.8 },
                yoyo: true,
                repeat: Math.floor(attackData.telegraphDuration * 2),
                duration: 300,
                onComplete: () => {
                    tell.destroy();
                }
            });
        }
        
        // Generic flash on the part itself
        part.setTint(0xff0000);
        
        // Flash tint animation
        this.scene.tweens.add({
            targets: part,
            alpha: 0.7,
            duration: 200,
            yoyo: true,
            repeat: Math.floor(attackData.telegraphDuration * 5),
            onComplete: () => {
                part.clearTint();
                part.setAlpha(1);
            }
        });
    }
    
    createAttackHitbox(attackData, part) {
        // Create attack hitbox
        let hitbox;
        
        if (attackData.hitboxType === 'circle') {
            hitbox = this.scene.physics.add.sprite(part.x, part.y, 'platform');
            hitbox.setCircle(attackData.hitboxSize.width / 2);
        } 
        else {
            hitbox = this.scene.physics.add.sprite(part.x, part.y, 'platform');
            hitbox.setSize(attackData.hitboxSize.width, attackData.hitboxSize.height);
        }
        
        // Set hitbox properties
        hitbox.setAlpha(0.5);
        hitbox.setTint(0xff0000);
        hitbox.setData('damage', attackData.damageAmount);
        hitbox.setData('attackId', attackData.id);
        hitbox.body.setAllowGravity(false);
        
        // Create attack visual effect
        const visualEffect = this.createAttackVisual(attackData, part, hitbox);
        
        // Set up movement pattern
        this.setupAttackMovement(attackData, part, hitbox);
        
        // Add collision with player
        this.scene.physics.add.overlap(this.scene.player, hitbox, this.playerHitByAttack, null, this);
        
        // Destroy after duration
        this.scene.time.delayedCall(attackData.duration * 1000, () => {
            hitbox.destroy();
            if (visualEffect) visualEffect.destroy();
        });
    }
    
    createAttackVisual(attackData, part, hitbox) {
        if (!attackData.visualEffect) return null;
        
        const visual = this.scene.add.graphics();
        
        // Draw visual based on effect type
        if (attackData.visualEffect.type === 'impact') {
            visual.fillStyle(parseInt(attackData.visualEffect.color?.replace('#', '0x') || '0xff0000'), 0.7);
            visual.fillCircle(0, 0, attackData.hitboxSize.width / 2);
            
            // Create simple circle effect
            const effectCircle = this.scene.add.graphics();
            effectCircle.fillStyle(parseInt(attackData.visualEffect.color?.replace('#', '0x') || '0xff0000'), 0.7);
            effectCircle.fillCircle(0, 0, 30);
            
            // Update position to follow hitbox
            this.scene.events.on('update', () => {
                if (hitbox.active && effectCircle.active) {
                    effectCircle.x = hitbox.x;
                    effectCircle.y = hitbox.y;
                }
            });
            
            // Add pulsing effect
            this.scene.tweens.add({
                targets: effectCircle,
                alpha: 0.3,
                duration: 300,
                yoyo: true,
                repeat: -1
            });
            
            // Destroy with hitbox
            hitbox.on('destroy', () => {
                effectCircle.destroy();
            });
            
            // Animate
            this.scene.tweens.add({
                targets: visual,
                alpha: { from: 0.7, to: 0.3 },
                scale: { from: 0.8, to: 1.2 },
                duration: 300,
                yoyo: true,
                repeat: -1
            });
        }
        else if (attackData.visualEffect.type === 'beam') {
            visual.fillStyle(parseInt(attackData.visualEffect.color?.replace('#', '0x') || '0xff00ff'), 0.7);
            
            if (attackData.hitboxType === 'rectangle') {
                visual.fillRect(
                    -attackData.hitboxSize.width / 2,
                    -attackData.hitboxSize.height / 2,
                    attackData.hitboxSize.width,
                    attackData.hitboxSize.height
                );
            } else {
                visual.fillCircle(0, 0, attackData.hitboxSize.width / 2);
            }
            
            // Beam trail effect
            const beamTrail = this.scene.add.graphics();
            beamTrail.fillStyle(parseInt(attackData.visualEffect.color?.replace('#', '0x') || '0xff00ff'), 0.7);
            beamTrail.fillCircle(0, 0, 15);
            
            // Update position to follow hitbox
            this.scene.events.on('update', () => {
                if (hitbox.active && beamTrail.active) {
                    beamTrail.x = hitbox.x;
                    beamTrail.y = hitbox.y;
                }
            });
            
            // Add beam effect
            this.scene.tweens.add({
                targets: beamTrail,
                alpha: 0.3,
                duration: 200,
                yoyo: true,
                repeat: -1
            });
            
            // Destroy with hitbox
            hitbox.on('destroy', () => {
                beamTrail.destroy();
            });
            
            // Add glow effect
            visual.lineStyle(5, parseInt(attackData.visualEffect.color?.replace('#', '0x') || '0xff00ff'), 0.5);
            
            if (attackData.hitboxType === 'rectangle') {
                visual.strokeRect(
                    -attackData.hitboxSize.width / 2,
                    -attackData.hitboxSize.height / 2,
                    attackData.hitboxSize.width,
                    attackData.hitboxSize.height
                );
            } else {
                visual.strokeCircle(0, 0, attackData.hitboxSize.width / 2);
            }
        }
        
        // Attach visual to hitbox
        visual.x = hitbox.x;
        visual.y = hitbox.y;
        
        // Update visual position with hitbox
        this.scene.events.on('update', () => {
            if (visual.active && hitbox.active) {
                visual.x = hitbox.x;
                visual.y = hitbox.y;
                visual.rotation = hitbox.rotation;
            }
        });
        
        return visual;
    }
    
    setupAttackMovement(attackData, part, hitbox) {
        const pattern = attackData.pattern;
        
        if (pattern.type === 'linear') {
            // Linear movement in specified direction(s)
            const angles = pattern.angles || [0];
            const speed = pattern.speed * 100;
            
            // Apply velocity in each direction
            angles.forEach(angleDegrees => {
                const angleRad = angleDegrees * Math.PI / 180;
                const velocityX = Math.cos(angleRad) * speed;
                const velocityY = Math.sin(angleRad) * speed;
                
                hitbox.setVelocity(velocityX, velocityY);
            });
            
            // If multiple angles specified, create additional hitboxes
            if (angles.length > 1) {
                for (let i = 1; i < angles.length; i++) {
                    const angle = angles[i] * Math.PI / 180;
                    const newHitbox = this.scene.physics.add.sprite(part.x, part.y, 'platform');
                    
                    if (attackData.hitboxType === 'circle') {
                        newHitbox.setCircle(attackData.hitboxSize.width / 2);
                    } else {
                        newHitbox.setSize(attackData.hitboxSize.width, attackData.hitboxSize.height);
                    }
                    
                    newHitbox.setAlpha(0.5);
                    newHitbox.setTint(0xff0000);
                    newHitbox.setData('damage', attackData.damageAmount);
                    newHitbox.setData('attackId', attackData.id);
                    newHitbox.body.setAllowGravity(false);
                    
                    // Set velocity
                    const velocityX = Math.cos(angle) * speed;
                    const velocityY = Math.sin(angle) * speed;
                    newHitbox.setVelocity(velocityX, velocityY);
                    
                    // Create visual
                    this.createAttackVisual(attackData, part, newHitbox);
                    
                    // Add collision
                    this.scene.physics.add.overlap(this.scene.player, newHitbox, this.playerHitByAttack, null, this);
                    
                    // Destroy after duration
                    this.scene.time.delayedCall(attackData.duration * 1000, () => {
                        newHitbox.destroy();
                    });
                }
            }
        }
        else if (pattern.type === 'tracking') {
            // Track the player
            if (this.scene.player) {
                const speed = pattern.speed * 100;
                
                // Get direction to player
                const dx = this.scene.player.x - part.x;
                const dy = this.scene.player.y - part.y;
                const angle = Math.atan2(dy, dx);
                
                // Calculate velocity
                const velocityX = Math.cos(angle) * speed;
                const velocityY = Math.sin(angle) * speed;
                
                // Apply velocity
                hitbox.setVelocity(velocityX, velocityY);
                
                // Rotate hitbox to face direction of travel
                hitbox.rotation = angle;
            }
        }
        else if (pattern.type === 'pulse') {
            // Pulse attack - starts at part and expands outward
            hitbox.setScale(0.1);
            
            // Expansion animation
            this.scene.tweens.add({
                targets: hitbox,
                scale: { from: 0.1, to: 3 },
                alpha: { from: 0.7, to: 0 },
                duration: attackData.duration * 1000,
                ease: 'Sine.Out'
            });
        }
    }
    
    playerHitByAttack(player, hitbox) {
        // Apply damage to player
        const damage = hitbox.getData('damage');
        
        // Only damage player once per attack instance
        if (!hitbox.getData('hasHitPlayer')) {
            player.damage(damage);
            hitbox.setData('hasHitPlayer', true);
            
            // Visual feedback
            this.scene.cameras.main.shake(100, 0.01);
            
            // If attack bounces, disable the attack-player collision
            if (hitbox.getData('attackId') && this.scene.player) {
                const attack = this.data.attacks.find(a => a.id === hitbox.getData('attackId'));
                
                if (attack && attack.pattern.bounces > 0) {
                    // Disable collision between this attack and player
                    this.scene.physics.world.removeCollider(
                        this.scene.physics.world.colliders.getActive().find(
                            c => c.object1 === this.scene.player && c.object2 === hitbox
                        )
                    );
                }
            }
        }
    }
    
    update(time, delta) {
        // Update parts with tracking behavior
        this.parts.forEach(part => {
            if (part.getData('tracking') && this.scene.player) {
                const trackingSpeed = part.getData('trackingSpeed') * 100 * (delta / 1000);
                
                // Get direction to player
                const dx = this.scene.player.x - part.x;
                const dy = this.scene.player.y - part.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate new position (don't get too close)
                if (distance > 100) {
                    const moveX = (dx / distance) * trackingSpeed;
                    const moveY = (dy / distance) * trackingSpeed;
                    
                    part.x += moveX;
                    part.y += moveY;
                }
            }
        });
        
        // Check health for stage transitions
        const healthPercent = this.totalHealth / this.maxHealth;
        
        // Stage transitions
        if (this.data.stages) {
            // Check for stage transitions
            for (let i = 0; i < this.data.stages.length; i++) {
                const stageData = this.data.stages[i];
                
                if (healthPercent <= stageData.threshold / 100 && this.currentStage < i + 1) {
                    this.transitionToStage(i + 1, stageData);
                    break;
                }
            }
        }
    }
    
    transitionToStage(stageIndex, stageData) {
        // Set current stage
        this.currentStage = stageIndex;
        
        // Visual effects
        this.scene.cameras.main.flash(1000, 255, 0, 255);
        this.scene.cameras.main.shake(500, 0.01);
        
        // Play transition animation
        // This would be more sophisticated in a full implementation
        
        // Apply speed modifiers to attacks
        if (stageData.speedModifier) {
            this.attackTimers.forEach(timerObj => {
                timerObj.attack.cooldown /= stageData.speedModifier;
                timerObj.attack.duration /= stageData.speedModifier;
                timerObj.attack.pattern.speed *= stageData.speedModifier;
            });
        }
        
        // Add new attacks
        if (stageData.newAttacks) {
            this.setupNewAttacks(stageData.newAttacks);
        }
        
        // Apply appearance changes
        if (stageData.appearanceChanges) {
            this.applyAppearanceChanges(stageData.appearanceChanges);
        }
        
        // Drop power-up
        if (stageData.powerUpDrop) {
            this.dropPowerUp(stageData.powerUpDrop);
        }
        
        // Apply environmental effects
        if (stageData.environmentEffects) {
            this.applyEnvironmentEffects(stageData.environmentEffects);
        }
    }
    
    setupNewAttacks(newAttackIds) {
        // Add new attacks to the boss's arsenal
        const attackPatterns = this.data.attacks.filter(attack => newAttackIds.includes(attack.id));
        
        // Set up attack timers for each part
        this.parts.forEach(part => {
            const partId = part.getData('id');
            
            // Get new attacks for this part
            const partAttacks = attackPatterns.filter(attack => attack.executingPart === partId);
            
            // Set up timers for each attack
            partAttacks.forEach(attack => {
                // Initial delay before first attack
                const initialDelay = Phaser.Math.Between(1000, 3000);
                
                // Create timer for this attack
                const timer = this.scene.time.addEvent({
                    delay: initialDelay,
                    callback: () => this.executeAttack(attack, part),
                    callbackScope: this,
                    loop: false
                });
                
                this.attackTimers.push({ timer, attack, part });
            });
        });
    }
    
    applyAppearanceChanges(changes) {
        // Apply color changes to boss parts
        if (changes.colorShift) {
            const newColor = parseInt(changes.colorShift.replace('#', '0x'));
            
            this.parts.forEach(part => {
                part.setTint(newColor);
                
                // Flash effect
                this.scene.tweens.add({
                    targets: part,
                    alpha: 0.5,
                    duration: 100,
                    yoyo: true,
                    repeat: 5,
                    onComplete: () => {
                        part.setAlpha(1);
                    }
                });
            });
        }
        
        // Add new visual features
        if (changes.addedFeatures) {
            changes.addedFeatures.forEach(feature => {
                if (feature === 'aura') {
                    // Create aura effect with graphics instead of particles
                    // since createEmitter has been removed in newer Phaser versions
                    const auraEffect = this.scene.add.graphics();
                    auraEffect.fillStyle(0xff00ff, 0.3);
                    auraEffect.fillCircle(0, 0, 150);
                    auraEffect.x = 640;
                    auraEffect.y = 200;
                    
                    // Add pulsing effect
                    this.scene.tweens.add({
                        targets: auraEffect,
                        alpha: 0.1,
                        scale: 1.2,
                        duration: 1000,
                        yoyo: true,
                        repeat: -1
                    });
                    
                    // Create multiple small circles that move outward for particle-like effect
                    for (let i = 0; i < 5; i++) {
                        const createParticle = () => {
                            // Random angle
                            const angle = Math.random() * Math.PI * 2;
                            // Start near center
                            const startRadius = 30;
                            const x = 640 + Math.cos(angle) * startRadius;
                            const y = 200 + Math.sin(angle) * startRadius;
                            
                            // Create particle
                            const particle = this.scene.add.circle(x, y, 5, 0xff00ff, 0.7);
                            
                            // Animate particle moving outward
                            this.scene.tweens.add({
                                targets: particle,
                                x: 640 + Math.cos(angle) * 150,
                                y: 200 + Math.sin(angle) * 150,
                                alpha: 0,
                                scale: 0.5,
                                duration: 1500,
                                onComplete: () => {
                                    particle.destroy();
                                }
                            });
                        };
                        
                        // Create initial particles
                        createParticle();
                        
                        // Create continuous particle effect with timer
                        this.scene.time.addEvent({
                            delay: 500,
                            callback: createParticle,
                            callbackScope: this,
                            loop: true
                        });
                    }
                    
                    this.container.add(auraEffect);
                }
                else if (feature === 'wings' || feature === 'horns') {
                    // Add wings or horns visual
                    const wings = this.scene.add.graphics();
                    wings.fillStyle(0xff00ff, 0.7);
                    
                    // Draw wings or horns shape
                    if (feature === 'wings') {
                        wings.beginPath();
                        wings.moveTo(0, 0);
                        wings.lineTo(-200, -150);
                        wings.lineTo(-300, 0);
                        wings.lineTo(-200, 150);
                        wings.lineTo(0, 50);
                        wings.closePath();
                        wings.fill();
                        
                        wings.beginPath();
                        wings.moveTo(0, 0);
                        wings.lineTo(200, -150);
                        wings.lineTo(300, 0);
                        wings.lineTo(200, 150);
                        wings.lineTo(0, 50);
                        wings.closePath();
                        wings.fill();
                    } 
                    else if (feature === 'horns') {
                        wings.beginPath();
                        wings.moveTo(-50, -200);
                        wings.lineTo(-150, -350);
                        wings.lineTo(-100, -400);
                        wings.lineTo(0, -250);
                        wings.closePath();
                        wings.fill();
                        
                        wings.beginPath();
                        wings.moveTo(50, -200);
                        wings.lineTo(150, -350);
                        wings.lineTo(100, -400);
                        wings.lineTo(0, -250);
                        wings.closePath();
                        wings.fill();
                    }
                    
                    // Add to container
                    wings.x = 640;
                    wings.y = 200;
                    this.container.add(wings);
                    
                    // Animate
                    this.scene.tweens.add({
                        targets: wings,
                        scaleX: 1.1,
                        duration: 1000,
                        yoyo: true,
                        repeat: -1
                    });
                }
            });
        }
    }
    
    dropPowerUp(powerUpId) {
        console.log("Attempting to drop power-up with ID:", powerUpId);
        
        // Find the power-up data
        const powerUpData = this.data.powerUps.find(p => p.id === powerUpId);
        
        if (!powerUpData) {
            console.warn("Power-up not found with ID:", powerUpId);
            // Drop a default power-up instead
            this.dropDefaultPowerUp();
            return;
        }
        
        console.log("Found power-up data:", powerUpData);
        
        // Validate the effect data
        if (!powerUpData.effect || !powerUpData.effect.type) {
            console.warn("Power-up has invalid effect data:", powerUpData.effect);
            // Drop a default power-up instead
            this.dropDefaultPowerUp();
            return;
        }
        
        // Create power-up at random location
        const x = Phaser.Math.Between(200, 1000);
        const y = Phaser.Math.Between(100, 200);
        
        const powerUp = this.scene.powerUps.create(x, y, 'platform');
        powerUp.setTint(0x00ffff);
        powerUp.setCircle(20);
        powerUp.setBounce(0.8);
        powerUp.setCollideWorldBounds(true);
        
        // Store power-up data as custom properties
        powerUp.setData('id', powerUpData.id);
        powerUp.setData('name', powerUpData.name);
        
        // Make a deep copy of the effect to avoid reference issues
        const effectCopy = {
            type: powerUpData.effect.type,
            magnitude: powerUpData.effect.magnitude || 1,
            duration: powerUpData.effect.duration || 0
        };
        powerUp.setData('effect', effectCopy);
        
        console.log("Created power-up with effect:", effectCopy);
        
        // Add physics
        this.scene.physics.add.collider(powerUp, this.scene.platforms);
        
        // Add text label
        const text = this.scene.add.text(x, y - 30, powerUpData.name, {
            font: '16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Create link between power-up and its text
        powerUp.setData('text', text);
        
        // Add glow effect
        this.scene.tweens.add({
            targets: powerUp,
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
    
    // Fallback method to drop a default power-up if the specified one is invalid
    dropDefaultPowerUp() {
        const x = Phaser.Math.Between(200, 1000);
        const y = Phaser.Math.Between(100, 200);
        
        const powerUp = this.scene.powerUps.create(x, y, 'platform');
        powerUp.setTint(0x00ffff);
        powerUp.setCircle(20);
        powerUp.setBounce(0.8);
        powerUp.setCollideWorldBounds(true);
        
        // Set default power-up data
        powerUp.setData('id', 'default_powerup');
        powerUp.setData('name', 'Power Boost');
        powerUp.setData('effect', {
            type: 'weapon',
            magnitude: 2,
            duration: 15000
        });
        
        // Add physics
        this.scene.physics.add.collider(powerUp, this.scene.platforms);
        
        // Add text label
        const text = this.scene.add.text(x, y - 30, 'Power Boost', {
            font: '16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Create link between power-up and its text
        powerUp.setData('text', text);
        
        // Add glow effect
        this.scene.tweens.add({
            targets: powerUp,
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
    
    applyEnvironmentEffects(effects) {
        effects.forEach(effect => {
            if (effect === 'platform_shift') {
                // Move platforms to new positions
                this.scene.platforms.getChildren().forEach(platform => {
                    if (platform.y < 650) { // Don't move the ground
                        this.scene.tweens.add({
                            targets: platform,
                            x: Phaser.Math.Between(200, 1000),
                            y: Phaser.Math.Between(200, 600),
                            duration: 1000,
                            ease: 'Power2'
                        });
                    }
                });
            }
            else if (effect === 'lava_floor') {
                // Add danger zone at the bottom
                const lavaZone = this.scene.add.rectangle(640, 680, 1280, 80, 0xff4400, 0.7);
                
                // Create lava particles using graphics and tweens instead of particle emitter
                // Add lava bubble effect with small rising circles
                const createLavaBubble = () => {
                    // Random position along the width
                    const x = Phaser.Math.Between(100, 1180);
                    
                    // Create bubble
                    const bubble = this.scene.add.circle(x, 720, Phaser.Math.Between(5, 15), 0xff8800, 0.8);
                    
                    // Animate bubble rising
                    this.scene.tweens.add({
                        targets: bubble,
                        y: 680 - Phaser.Math.Between(20, 60),
                        alpha: 0,
                        scale: { from: 1, to: 0.5 },
                        duration: Phaser.Math.Between(800, 1500),
                        onComplete: () => {
                            bubble.destroy();
                        }
                    });
                };
                
                // Create continuous lava bubble effect with timer
                this.scene.time.addEvent({
                    delay: 100,
                    callback: createLavaBubble,
                    callbackScope: this,
                    loop: true,
                    repeat: 100
                });
                
                // Create danger zone that damages player
                const damageZone = this.scene.add.zone(640, 680, 1280, 80);
                this.scene.physics.world.enable(damageZone);
                damageZone.body.setAllowGravity(false);
                damageZone.body.setImmovable(true);
                
                // Add overlap with player
                this.scene.physics.add.overlap(this.scene.player, damageZone, () => {
                    if (this.scene.player.body.touching.down && !this.scene.player.invulnerable) {
                        this.scene.player.damage(1);
                    }
                });
            }
            else if (effect === 'falling_debris') {
                // Periodically spawn falling debris
                this.scene.time.addEvent({
                    delay: 2000,
                    loop: true,
                    callback: () => {
                        // Create debris at random x position at top
                        const x = Phaser.Math.Between(100, 1180);
                        const debris = this.scene.physics.add.sprite(x, 0, 'platform');
                        
                        debris.setTint(0x888888);
                        debris.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
                        debris.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(300, 500));
                        debris.setAngularVelocity(Phaser.Math.Between(-100, 100));
                        debris.setBounce(0.5);
                        debris.setData('damage', 1);
                        
                        // Add collision with platforms
                        this.scene.physics.add.collider(debris, this.scene.platforms);
                        
                        // Add collision with player
                        this.scene.physics.add.overlap(this.scene.player, debris, (player, debris) => {
                            if (!player.invulnerable) {
                                player.damage(debris.getData('damage'));
                                debris.destroy();
                            }
                        });
                        
                        // Destroy after a while
                        this.scene.time.delayedCall(5000, () => {
                            if (debris.active) {
                                debris.destroy();
                            }
                        });
                    }
                });
            }
        });
    }
    
    takeDamage(partId, amount) {
        // Find the part
        const part = this.parts.find(p => p.getData('id') === partId);
        
        if (part) {
            // Apply damage
            const currentHP = part.getData('hitPoints');
            part.setData('hitPoints', Math.max(0, currentHP - amount));
            
            // Update total health
            this.calculateHealth();
            
            // Check if part is destroyed
            if (part.getData('hitPoints') <= 0) {
                this.destroyPart(part);
            }
            
            return true;
        }
        
        return false;
    }
    
    destroyPart(part) {
        // Visual effect for destroyed part
        const explosion = this.scene.add.graphics();
        explosion.fillStyle(0xff0000, 1);
        explosion.fillCircle(part.x, part.y, 50);
        
        // Tween the explosion
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Remove part from game
        const partIndex = this.parts.findIndex(p => p === part);
        if (partIndex >= 0) {
            this.parts.splice(partIndex, 1);
        }
        
        // Remove related attack timers
        this.attackTimers = this.attackTimers.filter(timer => timer.part !== part);
        
        part.destroy();
        
        // Check if all parts are destroyed
        if (this.parts.length === 0) {
            this.die();
        }
    }
    
    die() {
        // Execute death sequence
        const deathSequence = this.data.defeatSequence;
        
        // Visual effects
        this.scene.cameras.main.shake(1000, 0.05);
        this.scene.cameras.main.flash(1000, 255, 255, 255);
        
        // Final words
        if (deathSequence.finalWords) {
            const finalWords = this.scene.add.text(640, 200, deathSequence.finalWords, {
                font: '32px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: finalWords,
                alpha: 0,
                y: 150,
                duration: 3000,
                delay: 1000
            });
        }
        
        // Explosion effect
        if (deathSequence.explosion) {
            const explosion = this.scene.add.circle(640, 200, 50, 0xffffff);
            
            this.scene.tweens.add({
                targets: explosion,
                radius: 500,
                alpha: 0,
                duration: 2000
            });
        }
        
        // Particle effects
        if (deathSequence.particleEffects) {
            deathSequence.particleEffects.forEach(effect => {
                if (effect === 'shadow_burst') {
                    // Create multiple shadow particles with graphics
                    const createParticle = () => {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = Phaser.Math.Between(50, 300);
                        const x = 640 + Math.cos(angle) * distance;
                        const y = 200 + Math.sin(angle) * distance;
                        const size = Phaser.Math.Between(5, 20);
                        
                        const shadowPart = this.scene.add.graphics();
                        shadowPart.fillStyle(0x330033, 0.7);
                        shadowPart.fillCircle(0, 0, size);
                        shadowPart.x = 640;
                        shadowPart.y = 200;
                        
                        // Add movement and fade tween
                        this.scene.tweens.add({
                            targets: shadowPart,
                            x: x,
                            y: y,
                            alpha: 0,
                            scale: 0.1,
                            duration: Phaser.Math.Between(1000, 2000),
                            onComplete: () => {
                                shadowPart.destroy();
                            }
                        });
                    };
                    
                    // Create initial burst of particles
                    for (let i = 0; i < 20; i++) {
                        createParticle();
                    }
                }
                else if (effect === 'light_rays') {
                    for (let i = 0; i < 12; i++) {
                        const angle = (i / 12) * Math.PI * 2;
                        const ray = this.scene.add.rectangle(
                            640 + Math.cos(angle) * 50,
                            200 + Math.sin(angle) * 50,
                            20,
                            200,
                            0xffffaa
                        );
                        ray.rotation = angle;
                        ray.setOrigin(0.5, 0);
                        
                        this.scene.tweens.add({
                            targets: ray,
                            scaleY: 5,
                            alpha: 0,
                            duration: 1500,
                            delay: i * 100
                        });
                    }
                }
            });
        }
        
        // Trigger victory after delay
        this.scene.time.delayedCall(4000, () => {
            if (this.scene.gameOver) {
                this.scene.gameOver(true);
            }
        });
    }
    
    getHealthPercent() {
        // Recalculate health to ensure accuracy
        this.calculateHealth();
        
        // Prevent division by zero
        if (this.maxHealth <= 0) {
            console.warn("Invalid maxHealth value (", this.maxHealth, ")");
            return 1; // Return full health by default to prevent errors
        }
        
        const percent = this.totalHealth / this.maxHealth;
        //console.log(`Health percent: ${percent} (${this.totalHealth}/${this.maxHealth})`);
        return percent;
    }
    
    getCurrentStage() {
        return this.currentStage;
    }
    
    getBossGroup() {
        return this.bossGroup;
    }
}