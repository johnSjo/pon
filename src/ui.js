import * as PIXI from 'pixi.js';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';
import { TimelineMax } from 'gsap';
import { getRenderLayer } from './renderer';
import loader from './assetsLoader';
import gameConfig from './gameConfig.json';

function initFrame (layer, resources) {
    const frame = new PIXI.Sprite(resources.frame.texture);

    frame.scale = new PIXI.Point(5, 5);

    layer.addChild(frame);
}

function initScoreBoard (layer) {

}

function initStartButton (layer, pubsub) {
    const button = new PIXI.Text('Start', {
        fontFamily: 'PressStart2P',
        fill: ['#ef2f22', '#de1f11'],
        fontSize: 60,
        align: 'center',
        lineJoin: 'miter',
        fontWeight: 'bold',
        stroke: '#580903',
        strokeThickness: 9,
        dropShadow: true,
        dropShadowAngle: Math.PI * 0.4,
        dropShadowColor: '#292121',
        dropShadowDistance: 7.5
    });

    button.interactive = true;
    button.buttonMode = true;
    button.anchor = new PIXI.Point(0.5, 0.5);
    button.x = gameConfig.gameSize.x * 0.5;
    button.y = gameConfig.gameSize.y * 0.5;

    const bloom = new AdvancedBloomFilter();
    button.filters = [bloom];

    const bloomAnimation = new TimelineMax({ repeat: -1, yoyo: true });

    bloomAnimation.fromTo(bloom, 1, { bloomScale: 0.5, brightness: 0.5 }, { bloomScale: 1.1, brightness: 1.1 });

    button.on('pointerup', () => {
        pubsub.publish('startNewGame');

        button.scale = { x: 1, y: 1 };
        TweenLite.to(button, 0.5, { x: '-=800', onComplete: () => {
            button.visible = false;
            bloomAnimation.pause();
        } });
    });

    button.on('pointerupoutside', () => {
        button.scale = { x: 1, y: 1 };
    });

    button.on('pointerover', () => {
        button.scale = { x: 1.1, y: 1.1 };
    });
    
    button.on('pointerdown', () => {
        button.scale = { x: 0.9, y: 0.9 };
    });
    
    button.on('pointerout', () => {
        button.scale = { x: 1, y: 1 };
    });

    layer.addChild(button);

    button.bloomAnimation = bloomAnimation;

    return button;

}

function init (pubsub, resources) {
    const layer = getRenderLayer('ui');

    const startButton = initStartButton(layer, pubsub);

    initFrame(layer, resources);
    
    initScoreBoard(layer);

    pubsub.subscribe('gameOver/done', () => {
        startButton.visible = true;
        startButton.bloomAnimation.play();
        TweenLite.to(startButton, 0.5, { x: '+=800' });
    });
}

export default {

    init (pubsub) {
        const assets = { name: 'frame', url: 'assets/frame.png' };

        return new Promise((resolve) => {
            loader.loadResources(assets).then((resources) => {
                init(pubsub, resources);
                resolve();
            });
        });
    }

};