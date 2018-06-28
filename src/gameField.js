

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

const BRICK_VARIATIONS = ['box', 'crate', 'ice', 'green', 'blue'];

const BRICK_SIZE = 80;

const PADDING = 5;

const FIELD_WIDTH = 8;

function makeNewRow (layer, resources, brickField, rowIndex) {
    const currentLowestRow = brickField[0];
    let lastTwoTypes = [];
    const row = Array(FIELD_WIDTH).fill(null).map((na, index) => {
        const bricksToUse = BRICK_VARIATIONS.filter((type) => {
            // check above brick
            if (currentLowestRow 
                && currentLowestRow[index]
                && currentLowestRow[index].type === type) {
                return false;
            }

            // check we don't have three in a row
            if (lastTwoTypes.length > 1 && lastTwoTypes.every((t) => t === type)) {
                return false;
            }

            return true;
        });
        const type = bricksToUse[Math.floor(Math.random() * bricksToUse.length)];

        if (lastTwoTypes.length > 1) {
            lastTwoTypes.shift();
        }
        lastTwoTypes.push(type);

        const brick = new Brick(type, resources[type].texture);

        brick.sprite.x = index * (BRICK_SIZE + PADDING);
        brick.sprite.y = rowIndex * (BRICK_SIZE + PADDING)

        layer.addChild(brick.sprite);

        return brick;
    });

    brickField.unshift(row);

}

function init (pubsub, resources) {
    const layer = getRenderLayer('gameField');
    const brickField = [];

    // lets make 5 temp rows
    Array(5).fill(null).map((na, index) => makeNewRow(
        layer,
        resources,
        brickField,
        index
    ));
}

export default {

    init (pubsub) {

        const assets = BRICK_VARIATIONS.map((type, index) => {
            return {
                name: type,
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