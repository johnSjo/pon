import * as PIXI from 'pixi.js';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';
import { Back, gsap } from 'gsap';
import { getRenderLayer } from './renderer';
import loader from './assetsLoader';
import gameConfig from './gameConfig.json';
import { ITextStyle } from 'pixi.js';
import PubSub from './PubSub';

function initFrame(layer, resources) {
  const frame = new PIXI.Sprite(resources.frame.texture);

  frame.scale.set(5, 5);

  layer.addChild(frame);
}

function initScoreBoard(layer) {
  const style: Partial<ITextStyle> = {
    fontFamily: 'PressStart2P',
    fill: ['#ef2f22', '#de1f11'],
    fontSize: 50,
    align: 'center',
    lineJoin: 'miter',
    fontWeight: 'bold',
    stroke: '#580903',
    strokeThickness: 3,
    dropShadow: true,
    dropShadowAngle: Math.PI * 0.4,
    dropShadowColor: '#292121',
    dropShadowDistance: 2.5,
  };
  const numbersStyle = {
    ...style,
    fill: ['0xffcf40', '0xffbf00', '0xbf9b30'],
    fontSize: 70,
    stroke: '0xa67c00',
    dropShadow: false,
  };

  const string = new PIXI.Text('Score:', style);
  const score = new PIXI.Text('0', numbersStyle);

  score.anchor.set(0, 0.5);
  score.x = gameConfig.gameSize.x * 0.5;
  score.y = gameConfig.gameSize.y - 50;

  string.anchor.set(1, 0.5);
  string.x = gameConfig.gameSize.x * 0.5;
  string.y = gameConfig.gameSize.y - 50;

  layer.addChild(score, string);

  PubSub.subscribe('startNewGame', () => {
    // TODO: add animation
    score.text = '0';
  });

  PubSub.subscribe('coinCollected', (value) => {
    // TODO: add animation
    score.text = parseInt(score.text, 10) + value;
  });
}

function initStartButton(layer) {
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
    dropShadowDistance: 7.5,
  });

  button.interactive = true;
  button.buttonMode = true;
  button.anchor.set(0.5, 0.5);
  button.x = gameConfig.gameSize.x * 0.5;
  button.y = gameConfig.gameSize.y * 0.5;

  const bloom = new AdvancedBloomFilter();
  button.filters = [bloom];

  const bloomAnimation = gsap.timeline({ repeat: -1, yoyo: true });

  bloomAnimation.fromTo(
    bloom,
    { duration: 1, bloomScale: 0.5, brightness: 0.5 },
    { duration: 1, bloomScale: 1.1, brightness: 1.1 }
  );

  button.on('pointerup', () => {
    PubSub.publish('startNewGame');

    button.scale.set(1, 1);
    gsap.to(button, {
      duration: 0.5,
      x: '-=800',
      ease: Back.easeIn.config(1.7),
      onComplete: () => {
        button.visible = false;
        bloomAnimation.pause();
      },
    });
  });

  button.on('pointerupoutside', () => {
    button.scale.set(1, 1);
  });

  button.on('pointerover', () => {
    button.scale.set(1.1, 1.1);
  });

  button.on('pointerdown', () => {
    button.scale.set(0.9, 0.9);
  });

  button.on('pointerout', () => {
    button.scale.set(1, 1);
  });

  layer.addChild(button);

  PubSub.subscribe('gameOver/done', () => {
    button.visible = true;
    bloomAnimation.play();
    gsap.to(button, {
      duration: 0.5,
      x: '+=800',
      ease: Back.easeOut.config(1.7),
    });
  });
}

function initGameOverSign(layer) {
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
    dropShadowDistance: 7.5,
  });

  text.anchor.set(0.5, 0.5);
  text.scale.x = 0.8;
  text.x = gameConfig.gameSize.x * 0.5;
  text.y = -300;
  text.visible = false;

  layer.addChild(text);

  PubSub.subscribe('gameOver', () => {
    // show 'game over' sign
    text.visible = true;

    gsap.to(text, {
      duration: 2,
      y: gameConfig.gameSize.y * 0.75,
      onComplete: () => {
        PubSub.publish('gameOver/done');
      },
    });
  });

  PubSub.subscribe('startNewGame', () => {
    if (text.visible) {
      gsap.to(text, {
        duration: 1,
        y: gameConfig.gameSize.y * 1.2,
        onComplete: () => {
          text.visible = false;
          text.y = -300;
        },
      });
    }
  });
}

function init(resources: PIXI.utils.Dict<PIXI.LoaderResource>) {
  const layer = getRenderLayer('ui');

  initStartButton(layer);
  initGameOverSign(layer);
  initFrame(layer, resources);
  initScoreBoard(layer);
}

export default {
  init() {
    const assets = { name: 'frame', url: 'assets/images/frame.png' };

    return new Promise<void>((resolve) => {
      loader.loadResources([assets]).then((resources) => {
        init(resources);
        resolve();
      });
    });
  },
};
