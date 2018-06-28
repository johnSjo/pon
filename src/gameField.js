

// Things it need to do:
    // make new row with bricks
    // move everything up
    // keep track of where the bricks are
        // if a row is empty -> remove it
    // swap bricks
    // when a position becomes empty ->
        // check if there are any bricks above that need to fall down

import Brick from './Brick';
import loader from './assetsLoader'
import { getRenderLayer } from './renderer'

const BRICK_VARIATIONS = 5;

const BRICK_SIZE = 80;

const PADDING = 5;

const FIELD_WIDTH = 5;

function makeNewRow (layer, resources, brickField) {

}

function init (pubsub, resources) {
    const layer = getRenderLayer('gameField');
    const brickField = [];

    Array()
}

export default {

    init (pubsub) {

        const assets = Array(BRICK_VARIATIONS).fill(null).map((na, index) => {
            return {
                name: `brick${index}`,
                url: `assets/brick${index}.png`
            }
        });

        return new Promise((resolve) => {
            loader.loadResources(assets).then((resources) => {
                init(pubsub, resources);
                resolve();
            });
        });
    }

};