export class Splash extends Phaser.Scene {
    constructor() {
        super('Splash');
    }

    create() {
        // Add background
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');
        
        // Add logo
        this.logo = this.add.image(640, 200, 'logo');
        
        // Add title text
        this.title = this.add.text(640, 350, 'LLM BOSS BATTLE', {
            font: '64px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        this.subtitle = this.add.text(640, 420, 'A Cooperative Boss Battle Experience', {
            font: '32px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Add start game text
        this.startText = this.add.text(640, 540, 'Press SPACE to start', {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Add animated start text
        this.tweens.add({
            targets: this.startText,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
        });
        
        // Logo animation
        this.tweens.add({
            targets: this.logo,
            y: 240,
            duration: 1500,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
        
        // Add space key input
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        // Scroll background
        this.background.tilePositionX += 1;
        
        // Check for space key to start game
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.startGame();
        }
    }
    
    startGame() {
        // Fade out effect
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            // Start generating boss in the background (placeholder for now)
            this.generateBoss();
            
            // Start the game scene
            this.scene.start('Game', { boss: this.boss });
        });
    }
    
    generateBoss() {
        // Placeholder for LLM boss generation
        // This would eventually call out to an API or use pre-generated bosses
        this.boss = {
            name: 'Shadow Behemoth',
            epithet: 'The Void Watcher',
            description: 'A monstrous entity from the darkest dimensions',
            appearance: {
                baseShape: 'humanoid',
                primaryColor: '#330033',
                secondaryColor: '#660066',
                size: {
                    width: 800,
                    height: 600
                },
                specialFeatures: [
                    {
                        type: 'eyes',
                        count: 3,
                        placement: 'top',
                        description: 'Glowing purple eyes',
                        emissive: true
                    },
                    {
                        type: 'tentacles',
                        count: 4,
                        placement: 'sides',
                        description: 'Shadowy tendrils',
                        emissive: false
                    }
                ]
            },
            stats: {
                hitPoints: 150,
                aggressiveness: 7,
                movementSpeed: 5,
                difficultyRating: 6
            },
            planeElements: [
                {
                    id: 'hand_left',
                    type: 'hand',
                    shape: 'circle',
                    size: {
                        width: 120,
                        height: 120
                    },
                    position: {
                        x: 300,
                        y: 400
                    },
                    mobility: {
                        type: 'tracking',
                        speed: 3,
                        pattern: 'sine'
                    },
                    attackPatterns: ['slam', 'sweep'],
                    vulnerableDuring: ['slam_recovery'],
                    damageOnTouch: 1,
                    hitPoints: 40,
                    visualTell: 'Glows red before attacking'
                },
                {
                    id: 'hand_right',
                    type: 'hand',
                    shape: 'circle',
                    size: {
                        width: 120,
                        height: 120
                    },
                    position: {
                        x: 980,
                        y: 400
                    },
                    mobility: {
                        type: 'tracking',
                        speed: 3,
                        pattern: 'sine'
                    },
                    attackPatterns: ['slam', 'sweep'],
                    vulnerableDuring: ['slam_recovery'],
                    damageOnTouch: 1,
                    hitPoints: 40,
                    visualTell: 'Glows red before attacking'
                },
                {
                    id: 'eye',
                    type: 'eye',
                    shape: 'circle',
                    size: {
                        width: 80,
                        height: 80
                    },
                    position: {
                        x: 640,
                        y: 200
                    },
                    mobility: {
                        type: 'static',
                        speed: 0,
                        pattern: 'none'
                    },
                    attackPatterns: ['beam', 'pulse'],
                    vulnerableDuring: ['beam_recovery', 'pulse_recovery'],
                    damageOnTouch: 1,
                    hitPoints: 30,
                    visualTell: 'Dilates before firing beam'
                }
            ],
            stages: [
                {
                    threshold: 75,
                    entryAnimation: 'Roars and the arena darkens',
                    newAttacks: ['shadow_orbs', 'ground_spikes'],
                    speedModifier: 1.2,
                    appearanceChanges: {
                        colorShift: '#990099',
                        addedFeatures: ['aura']
                    },
                    powerUpDrop: 'dual_shot',
                    environmentEffects: ['platform_shift']
                },
                {
                    threshold: 35,
                    entryAnimation: 'Arena turns blood red, boss grows in size',
                    newAttacks: ['rain_of_terror', 'void_pull'],
                    speedModifier: 1.5,
                    appearanceChanges: {
                        colorShift: '#cc0099',
                        addedFeatures: ['wings', 'horns']
                    },
                    powerUpDrop: 'shield',
                    environmentEffects: ['lava_floor', 'falling_debris']
                }
            ],
            attacks: [
                {
                    id: 'slam',
                    name: 'Hand Slam',
                    description: 'Slams hand down on players',
                    executingPart: 'hand_left',
                    damageAmount: 1,
                    cooldown: 3,
                    duration: 0.5,
                    telegraphDuration: 1,
                    hitboxType: 'circle',
                    hitboxSize: {
                        width: 150,
                        height: 150
                    },
                    pattern: {
                        type: 'linear',
                        speed: 8,
                        angles: [90],
                        bounces: 0
                    },
                    visualEffect: {
                        type: 'impact',
                        color: '#ff0000',
                        particleDensity: 20
                    },
                    soundCue: 'slam',
                    vulnerabilityWindow: {
                        timing: 'after',
                        duration: 1.5
                    }
                },
                {
                    id: 'beam',
                    name: 'Eye Beam',
                    description: 'Fires a continuous beam',
                    executingPart: 'eye',
                    damageAmount: 2,
                    cooldown: 5,
                    duration: 2,
                    telegraphDuration: 1.5,
                    hitboxType: 'rectangle',
                    hitboxSize: {
                        width: 1000,
                        height: 40
                    },
                    pattern: {
                        type: 'tracking',
                        speed: 2,
                        angles: [0],
                        bounces: 0
                    },
                    visualEffect: {
                        type: 'beam',
                        color: '#ff00ff',
                        particleDensity: 10
                    },
                    soundCue: 'beam',
                    vulnerabilityWindow: {
                        timing: 'after',
                        duration: 2
                    }
                }
            ],
            powerUps: [
                {
                    id: 'dual_shot',
                    name: 'Dual Shot',
                    description: 'Fire two projectiles at once',
                    effect: {
                        type: 'weapon',
                        magnitude: 2,
                        duration: 0
                    },
                    visualEffect: 'blue glow'
                },
                {
                    id: 'shield',
                    name: 'Energy Shield',
                    description: 'Absorbs one hit',
                    effect: {
                        type: 'defense',
                        magnitude: 1,
                        duration: 0
                    },
                    visualEffect: 'yellow outline'
                }
            ],
            defeatSequence: {
                animation: 'Boss dissolves into shadow particles',
                finalWords: 'This realm... will never... be yours...',
                explosion: true,
                particleEffects: ['shadow_burst', 'light_rays']
            }
        };
    }
}