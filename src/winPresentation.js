
import loader from './assetsLoader';
import { getRenderLayer } from './renderer';
import { TimelineLite, Back } from 'gsap';
import gameConfig from './gameConfig.json';

const TO_POS = { x: gameConfig.gameSize.x * 0.5, y: gameConfig.gameSize.y - 200 };

function throwCoin (fromPos, layer, texture) {
    const coin = new PIXI.extras.AnimatedSprite(texture);
    const timeline = new TimelineLite();

    coin.loop = true;
    coin.anchor = new PIXI.Point(0.5, 0.5);
    coin.scale = new PIXI.Point(0, 0);
    coin.animationSpeed = 0.15;
    coin.x = fromPos.x;
    coin.y = fromPos.y;
    TweenLite.delayedCall(Math.random() * 0.3, () => {
        coin.play();
    });

    timeline.delay(Math.random() * 0.3 + 0.2)
        .to(coin.scale, 0.3, { x: 6, y: 6, ease: Back.easeOut.config(3) })
        .to(coin.scale, 1, { x: 4, y: 4 })
        .to(coin, 2, { x: TO_POS.x, y: TO_POS.y, onComplete: () => {
            layer.removeChild(coin);
            coin.destroy();
        } });

    layer.addChild(coin);
}

function init (pubsub, resources) {
    const layer = getRenderLayer('gameField');
    const coinTexture = Array(4).fill(null).map((na, frame) => {
        const { texture } = resources.coin;
        const frameSize = {
            height: texture.height,
            width: texture.width / 4
        };

        return new PIXI.Texture(texture, new PIXI.Rectangle(
            frame * frameSize.width, 0, frameSize.width, frameSize.height
        ));
    });

    pubsub.subscribe('coinWin', (data) => {
        throwCoin(data, layer, coinTexture);
    });
}

export default {

    init (pubsub) {

        const assets = [
            { name: 'coin', url: 'assets/coin.png' }
        ];

        return new Promise((resolve) => {
            loader.loadResources(assets).then((resources) => {
                init(pubsub, resources);
                resolve();
            });
        });
    }

};