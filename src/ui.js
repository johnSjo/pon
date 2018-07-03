import * as PIXI from 'pixi.js';
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

function init (pubsub, resources) {
    const layer = getRenderLayer('ui');

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