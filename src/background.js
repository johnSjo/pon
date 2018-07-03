import * as PIXI from 'pixi.js';
import { TimelineMax } from 'gsap';
import { getRenderLayer } from './renderer';
import loader from './assetsLoader';

function init (resources) {
    const layer = getRenderLayer('background');

    const backgrounds = Array(4).fill(null).map((na, index) => {
        const bg = new PIXI.Sprite(resources[`background${index}`].texture);
        
        bg.scale = new PIXI.Point(5, 5);
        bg.x = 40;
        bg.y = 40;

        layer.addChild(bg);

        return bg;
    });
    
    backgrounds.forEach((bg, index) => {
        const animation = new TimelineMax({ repeat: -1, yoyo: true });

        animation.fromTo(bg, 200, { x: 40 }, { x: -425 - index * 100 });

    });
    

}

export default {

    init () {
        const assets = [
            { name: 'background0', url: 'assets/background0.png' },
            { name: 'background1', url: 'assets/background1.png' },
            { name: 'background2', url: 'assets/background2.png' },
            { name: 'background3', url: 'assets/background3.png' }
        ];

        return new Promise((resolve) => {
            loader.loadResources(assets).then((resources) => {
                init(resources);
                resolve();
            });
        });
    }

};