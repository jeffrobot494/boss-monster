export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.win = data.win;
        this.score = data.score;
    }

    create() {
        // Add background
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');
        this.background.setTint(this.win ? 0x004400 : 0x440000);
        
        // Add title text based on win/lose condition
        const title = this.win ? 'VICTORY!' : 'GAME OVER';
        const titleText = this.add.text(640, 200, title, {
            font: '64px Arial',
            fill: this.win ? '#00ff00' : '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Add score text
        this.add.text(640, 300, `Score: ${this.score}`, {
            font: '48px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Add retry text
        this.retryText = this.add.text(640, 500, 'Press SPACE to fight another boss', {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Add animated retry text
        this.tweens.add({
            targets: this.retryText,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
        });
        
        // Add space key input
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        // Scroll background
        this.background.tilePositionX += 1;
        
        // Check for space key to restart
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            // Fade out
            this.cameras.main.fadeOut(1000, 0, 0, 0);
            
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                // Go back to splash screen to generate a new boss
                this.scene.start('Splash');
            });
        }
    }
}