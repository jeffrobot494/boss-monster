import { Bootloader } from './scenes/Bootloader.js';
import { Splash } from './scenes/Splash.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';

const config = {
    type: Phaser.AUTO,
    title: 'LLM Boss Battle',
    description: 'Cooperative platformer with LLM-generated boss battles',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: true  // Enable physics debugging to see hitboxes
        }
    },
    scene: [
        Bootloader,
        Splash,
        Game,
        GameOver
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);