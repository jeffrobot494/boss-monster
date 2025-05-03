export class Bootloader extends Phaser.Scene {
    constructor() {
        super('Bootloader');
    }

    preload() {
        // Create loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(640 - 160, 360 - 25, 320, 50);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        const percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);
        
        // Update loading bar as assets are loaded
        this.load.on('progress', function (value) {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(640 - 150, 360 - 15, 300 * value, 30);
        });
        
        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });
        
        // Load assets
        this.load.image('background', 'assets/space.png');
        this.load.image('logo', 'assets/phaser.png');
        this.load.spritesheet('player', 'assets/spaceship.png', { frameWidth: 176, frameHeight: 96 });
        
        // Create a platform image using graphics
        const graphics = this.add.graphics();
        graphics.fillStyle(0x888888);
        graphics.fillRect(0, 0, 100, 20);
        graphics.generateTexture('platform', 100, 20);
        graphics.clear();
        
        console.log("Created platform texture");
        
        // Audio assets would go here
        // this.load.audio('jump', 'assets/sounds/jump.mp3');
        // this.load.audio('shoot', 'assets/sounds/shoot.mp3');
        
        // Load font
        // this.load.bitmapFont('pixelFont', 'assets/fonts/font.png', 'assets/fonts/font.xml');
    }

    create() {
        // Initialize any game data
        this.registry.set('score', 0);
        this.registry.set('lives', 3);
        
        // Go to splash screen
        this.scene.start('Splash');
    }
}