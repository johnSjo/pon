

// Things it need to do:
    // move everything up
    // keep track of where the bricks are
        // if a row is empty -> remove it
    // when a position becomes empty ->
        // check if there are any bricks above that need to fall down

import loader from './assetsLoader';
import { getRenderLayer } from './renderer';
import makeNewRow from './brickRow';

const BRICK_VARIATIONS = ['box', 'crate', 'ice', 'green', 'blue'];

function checkPatterns (brickField, rowIndex, colIndex) {
    return Promise.resolve();
}

function swapBricks (brickRow, index, brickField) {
    const leftBrick = brickRow[index];
    const rightBrick = brickRow[index + 1];
    const waitForSwap = [];

    [brickRow[index], brickRow[index + 1]] = [brickRow[index + 1], brickRow[index]];

    return new Promise((resolve) => {
        if (leftBrick) {
            waitForSwap.push(new Promise((resolve) => {
                leftBrick.moveRight().then(() => resolve());
            }));
        }
        
        if (rightBrick) {
            waitForSwap.push(new Promise((resolve) => {
                rightBrick.moveLeft().then(() => resolve());
            }));
        }
    
        Promise.all(waitForSwap).then(() => {
            checkPatterns(
                brickField,
                brickField.findIndex((row) => row.brickRow === brickRow),
                index
            )
                .then(() => resolve());
        });

    });
}

function init (pubsub, resources) {
    const layer = getRenderLayer('gameField');
    const brickField = [];
    let gameIdle = true;

    // lets make 5 temp rows
    Array(15).fill(null).map((na, index) => makeNewRow(
        layer,
        resources,
        brickField,
        index,
        pubsub
    ));

    // lets activate three rows
    brickField.forEach((row, index) => {
        if (index > 1) {
            row.brickRow.forEach((brick) => brick.setState('idle'));
        }
    });

    layer.y = 710 - 850;

    pubsub.subscribe('swapBricks', ({ brickRow, index }) => {
        if (gameIdle) {
            gameIdle = false;
            swapBricks(brickRow, index, brickField).then(() => (gameIdle = true));
        }
    });
}

export default {

    init (pubsub) {

        const assets = BRICK_VARIATIONS.map((type, index) => {
            return {
                name: type,
                url: `assets/brick${index}.png`
            };
        });

        assets.push({ name: 'arrow', url: 'assets/arrow.png' });

        return new Promise((resolve) => {
            loader.loadResources(assets).then((resources) => {
                init(pubsub, resources);
                resolve();
            });
        });
    }

};