import * as PIXI from 'pixi.js';
import loader from './assetsLoader';
import { getRenderLayer } from './renderer';
import { gsap, Back } from 'gsap';
import gameConfig from './gameConfig.json';
import PubSub from './PubSub';

const TO_POS = {
  x: gameConfig.gameSize.x * 0.5,
  y: gameConfig.gameSize.y - 50,
};

function throwCoin(fromPos, layer, texture) {
  const coin = new PIXI.AnimatedSprite(texture);
  const timeline = gsap.timeline();

  coin.loop = true;
  coin.anchor.set(0.5, 0.5);
  coin.scale.set(0, 0);
  coin.animationSpeed = 0.15;
  coin.x = fromPos.x;
  coin.y = fromPos.y;
  gsap.delayedCall(Math.random() * 0.3, () => {
    coin.play();
  });

  timeline
    .delay(Math.random() * 0.3 + 0.2)
    .to(coin.scale, {
      x: 6,
      y: 6,
      duration: 0.3,
      ease: Back.easeOut.config(3),
      onStart: () => {
        PubSub.publish('sound/coinAppear');
      },
    })
    .to(coin.scale, { duration: 1, x: 4, y: 4 })
    .to(coin, {
      duration: 0.5,
      x: TO_POS.x,
      y: TO_POS.y,
      onComplete: () => {
        layer.removeChild(coin);
        coin.destroy();
        PubSub.publish('coinCollected', 1);
      },
    });

  layer.addChild(coin);
}

function init(resources) {
  const layer = getRenderLayer('winPresentation');
  const coinTexture = Array(4)
    .fill(null)
    .map((na, frame) => {
      const { texture } = resources.coin;
      const frameSize = {
        height: texture.height,
        width: texture.width / 4,
      };

      return new PIXI.Texture(
        texture,
        new PIXI.Rectangle(
          frame * frameSize.width,
          0,
          frameSize.width,
          frameSize.height
        )
      );
    });

  PubSub.subscribe('coinWin', (data) => {
    throwCoin(data, layer, coinTexture);
  });
}

export default {
  init() {
    const assets = [{ name: 'coin', url: 'assets/images/coin.png' }];

    return new Promise<void>((resolve) => {
      loader.loadResources(assets).then((resources) => {
        init(resources);
        resolve();
      });
    });
  },
};
