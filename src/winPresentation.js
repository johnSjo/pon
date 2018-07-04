
import loader from './assetsLoader';
import { getRenderLayer } from './renderer';
import { TimelineLite, TweenLite, Power4 } from 'gsap';
import gameConfig from './gameConfig.json';


function init (pubsub, resources) {
    const layer = getRenderLayer('gameField');
    const coinTexture = Array(4).fill(null).map((na, frame) => {
        const { texture } = resources.coin;
        const frameSize = {
            height: texture.height,
            width: texture.width / 5
        };

        return new PIXI.Texture(texture, new PIXI.Rectangle(
            frame * frameSize.width, 0, frameSize.width, frameSize.height
        ));
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