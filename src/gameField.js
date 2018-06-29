

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

function init (pubsub, resources) {
    const layer = getRenderLayer('gameField');
    const brickField = [];
    let gameIdle = true;

    const temp = 10;

    // lets make some temp rows
    Array(temp).fill(null).map((na, index) => makeNewRow(
        layer,
        resources,
        brickField,
        index,
        pubsub
    ));

    // lets activate all but two rows
    brickField.forEach((row, index) => {
        if (index > 1) {
            row.brickRow.forEach((brick) => brick.setState('idle'));
        }
    });

    layer.y = 710 - 5 * 85;

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