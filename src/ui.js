import * as PIXI from 'pixi.js';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';
import { TimelineMax, Back } from 'gsap';
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
        fill: ['#4866c5', '#429ad7'],
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
        TweenLite.to(button, 0.5, { x: '-=800', ease: Back.easeIn.config(1.7), onComplete: () => {
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

    pubsub.subscribe('gameOver/done', () => {
        button.visible = true;
        button.bloomAnimation.play();
        TweenLite.to(button, 0.5, { x: '+=800', ease: Back.easeOut.config(1.7) });
    });

}

function initGameOverSign (layer, pubsub) {
    const text = new PIXI.Text('GAME OVER', {
        fontFamily: 'PressStart2P',
        fill: ['#ef2f22', '#de1f11'],
        fontSize: 80,
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

    text.anchor = new PIXI.Point(0.5, 0.5);
    text.scale.x = 0.8;
    text.x = gameConfig.gameSize.x * 0.5;
    text.y = -300;
    text.visible = false;

    layer.addChild(text);

    pubsub.subscribe('gameOver', () => {
        // show 'game over' sign
        text.visible = true;

        TweenLite.to(text, 2, { y: gameConfig.gameSize.y * 0.75, onComplete: () => {
            pubsub.publish('gameOver/done');
        } });

    });

    pubsub.subscribe('startNewGame', () => {
        if (text.visible) {
            TweenLite.to(text, 1, { y: gameConfig.gameSize.y * 1.2, onComplete: () => {
                text.visible = false;
                text.y = -300;
            } });
        }
    });
}

function init (pubsub, resources) {
    const layer = getRenderLayer('ui');

    initStartButton(layer, pubsub);
    initGameOverSign(layer, pubsub);
    initFrame(layer, resources);
    initScoreBoard(layer);
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