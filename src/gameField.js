

// Things it need to do:
    // move everything up
    // keep track of where the bricks are
        // if a row is empty -> remove it
    // when a position becomes empty ->
        // check if there are any bricks above that need to fall down

import loader from './assetsLoader';
import { getRenderLayer } from './renderer';
import makeNewRow from './brickRow';
import { TimelineLite } from 'gsap';

const BRICK_VARIATIONS = ['box', 'crate', 'ice'];//, 'green', 'blue'];

const ROW_HEIGHT = 85;

const FIELD_START_POS = 710;

function findMatches (brickField, result) {
    const promises = [];
    const matches = [];
    const check = (bricks) => {
        const matches = bricks.reduce((acc, brick) => {
            if (acc.length === 0) {
                acc.push([brick]);
            } else {
                const latestMatch = acc[acc.length - 1];

                if (latestMatch[0].type === brick.type
                    && latestMatch[0].state === brick.state) {

                    latestMatch.push(brick);
                } else {
                    acc.push([brick]);
                }
            }

            return acc;
        }, []);

        return matches.reduce((acc, match) => {
            if (match.length >= 3
                && match[0].type !== 'destroyed'
                && match[0].state === 'idle') {

                result.matches = true;

                return acc.concat(match);
            }

            return acc;
        }, []);

    };

    // horizontally
    brickField.forEach((row) => {
        matches.splice(0, 0, ...check(row.brickRow));
    });

    // vertically
    brickField[0].brickRow.forEach((na, colIndex) => {
        const colum = brickField.map((row) => row.brickRow[colIndex]);

        matches.splice(0, 0, ...check(colum));
    });

    matches.forEach((brick) => {
        promises.push(brick.kill());
    });

    return Promise.all(promises);
}

function findFalling (brickField, result) {
    const promises = [];

    brickField[0].brickRow.forEach((na, colIndex) => {
        const colum = brickField.map((row) => row.brickRow[colIndex]);

        colum.forEach((brick, rowIndex) => {
            if (brick.type === 'destroyed') {
                // check if we have any alive bricks above, and how fallPromies
                const aboveBrickIndex = colum.findIndex((brick, index) => {
                    return index > rowIndex && brick.type !== 'destroyed';
                });

                if (aboveBrickIndex !== -1) {
                    const aboveBrick = colum[aboveBrickIndex];

                    [colum[aboveBrickIndex], colum[rowIndex]] = [colum[rowIndex], colum[aboveBrickIndex]];
                    [brickField[rowIndex].brickRow[colIndex], brickField[aboveBrickIndex].brickRow[colIndex]] = [brickField[aboveBrickIndex].brickRow[colIndex], brickField[rowIndex].brickRow[colIndex]];

                    promises.push(aboveBrick.moveDown(aboveBrickIndex - rowIndex));
                    result.falls = true;
                }
            }
        });
    });

    if (result.falls) {
        // TODO: check if we should remove any rows
    }

    return Promise.all(promises);
}

function checkField (brickField) {
    const result = {
        matches: false,
        falls: false
    };

    // find all matches
    const matchPromies = findMatches(brickField, result);
    // find all bricks that will fall
    const fallPromies = findFalling(brickField, result);

    return new Promise((resolve) => {
        Promise.all([
            matchPromies,
            fallPromies
        ]).then(() => {
            // if we had any matches or falls run checkField again
            if (result.matches || result.falls) {
                checkField(brickField).then(resolve);
            } else {
                resolve();
            }
        });
    });
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
            checkField(brickField).then(() => resolve());
        });

    });
}

function moveGameField (layer, { field }, pubsub) {
    const newTarget = field.targetPos - (field.newRowAtEvery / field.clicksPerRow);

    field.timeLine.clear().to(layer, 1, { y: newTarget, onUpdate: () => {
        //check if we should insert a new row
        const diff = Math.floor(-(layer.y - FIELD_START_POS) / ROW_HEIGHT);

        if (diff > field.addedRows) {
            pubsub.publish('makeNewRow');
            pubsub.publish('activateRow');
            field.addedRows = diff;
        }
    } });

    field.targetPos = newTarget;
}

function init (pubsub, resources) {
    const layer = getRenderLayer('gameField');
    const brickField = [];
    const game = {
        idle: true,
        field: {
            targetPos: FIELD_START_POS,
            newRowAtEvery: ROW_HEIGHT,
            addedRows: 0,
            clicksPerRow: 5,
            timeLine: new TimelineLite()
        }
    };

    // lets make some initial rows
    Array(5).fill(null).map((na, index) => makeNewRow(
        layer,
        resources,
        brickField,
        index,
        pubsub
    ));

    // lets activate all but two rows
    brickField.forEach((row, index) => {
        if (index > 1) {
            row.activateRow();
        }
    });

    layer.y = game.field.targetPos;

    pubsub.subscribe('makeNewRow', () => {
        makeNewRow(layer, resources, brickField, brickField.length, pubsub);
    });
    
    pubsub.subscribe('activateRow', () => {
        brickField[2].activateRow();
    });

    pubsub.subscribe('swapBricks', ({ brickRow, index }) => {
        if (game.idle) {
            game.idle = false;
            swapBricks(brickRow, index, brickField).then(() => (game.idle = true));
            moveGameField(layer, game, pubsub);
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