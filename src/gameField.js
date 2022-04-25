import loader from './assetsLoader';
import { getRenderLayer } from './renderer';
import makeNewRow from './brickRow';
import { Power4, gsap } from 'gsap';
import gameConfig from './gameConfig.json';

const BRICK_VARIATIONS = gameConfig.brickVariations;

const ROW_HEIGHT = gameConfig.brickSize + gameConfig.brickPadding;

const NR_OF_START_ROWS = 5;

const CLICKS_PER_ROW = 5;

const FIELD_START_POS = 560 + ROW_HEIGHT / CLICKS_PER_ROW;

const FIELD_X_POS = 50;

function findMatches(brickField, result) {
  const promises = [];
  const matches = [];
  const check = (bricks) => {
    const matches = bricks.reduce((acc, brick) => {
      if (acc.length === 0) {
        acc.push([brick]);
      } else {
        const latestMatch = acc[acc.length - 1];

        if (
          latestMatch[0].type === brick.type &&
          latestMatch[0].state === brick.state
        ) {
          latestMatch.push(brick);
        } else {
          acc.push([brick]);
        }
      }

      return acc;
    }, []);

    return matches.reduce((acc, match) => {
      if (
        match.length >= 3 &&
        match[0].type !== 'destroyed' &&
        match[0].state === 'idle'
      ) {
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
    if (brick.state === 'idle') {
      promises.push(brick.kill());
    }
  });

  return Promise.all(promises);
}

function findFalling(brickField, result = { falls: false }) {
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

          [colum[aboveBrickIndex], colum[rowIndex]] = [
            colum[rowIndex],
            colum[aboveBrickIndex],
          ];
          [
            brickField[rowIndex].brickRow[colIndex],
            brickField[aboveBrickIndex].brickRow[colIndex],
          ] = [
            brickField[aboveBrickIndex].brickRow[colIndex],
            brickField[rowIndex].brickRow[colIndex],
          ];

          promises.push(aboveBrick.moveDown(aboveBrickIndex - rowIndex));
          result.falls = true;
        }
      }
    });
  });

  return Promise.all(promises);
}

function checkEmptyRows(brickField) {
  const rowsForDel = brickField.reduce((acc, row) => {
    const remove = row.brickRow.every((brick) => brick.type === 'destroyed');

    if (remove) {
      acc.push(row);
    }

    return acc;
  }, []);

  rowsForDel.forEach((row) => {
    brickField.splice(brickField.indexOf(row), 1);
    row.destroy();
  });
}

function checkField(brickField) {
  const result = {
    matches: false,
    falls: false,
  };

  // find all matches
  const matchPromies = findMatches(brickField, result);
  // find all bricks that will fall
  const fallPromies = findFalling(brickField, result);

  return new Promise((resolve) => {
    Promise.all([matchPromies, fallPromies]).then(() => {
      // if we had any matches or falls run checkField again
      if (result.matches || result.falls) {
        checkField(brickField).then(resolve);
      } else {
        checkEmptyRows(brickField);
        resolve();
      }
    });
  });
}

function swapBricks(brickRow, index, brickField, pubsub) {
  const leftBrick = brickRow[index];
  const rightBrick = brickRow[index + 1];
  const waitForSwap = [];

  [brickRow[index], brickRow[index + 1]] = [
    brickRow[index + 1],
    brickRow[index],
  ];

  return new Promise((resolve) => {
    if (leftBrick) {
      waitForSwap.push(
        new Promise((resolve) => {
          leftBrick.moveRight().then(() => resolve());
        })
      );
    }

    if (rightBrick) {
      waitForSwap.push(
        new Promise((resolve) => {
          rightBrick.moveLeft().then(() => resolve());
        })
      );
    }

    Promise.all(waitForSwap).then(() => {
      // we have an extra findFalling() here so we don't match a hanging brick
      findFalling(brickField).then(() => {
        checkField(brickField).then(() => {
          // check if game over
          const brick = brickField[brickField.length - 1].brickRow.find(
            (brick) => brick.type !== 'destroyed'
          );

          if (brick && brick.sprite.getGlobalPosition().y < 45) {
            pubsub.publish('gameOver');
          }

          resolve();
        });
      });
    });
  });
}

function moveGameField(layer, field, pubsub, brickField) {
  const newTarget = field.targetPos - field.newRowAtEvery / CLICKS_PER_ROW;

  field.timeLine.clear().to(layer, 1, {
    y: newTarget,
    onUpdate: () => {
      //check if we should insert a new row
      const diff = Math.floor(-(layer.y - FIELD_START_POS) / ROW_HEIGHT);

      if (diff > field.addedRows) {
        pubsub.publish('makeNewRow');
        pubsub.publish('activateRow');
        field.addedRows = diff;

        checkField(brickField);
      }
    },
  });

  field.targetPos = newTarget;
}

function initField({ layer, resources, brickField, pubsub, field }) {
  const killPromises = [];

  // remove any old rows
  if (brickField.length > 0) {
    brickField[0].brickRow.forEach((na, colIndex) => {
      const colum = brickField.map((row) => row.brickRow[colIndex]);

      colum.forEach((brick, index) => {
        if (brick.type !== 'destroyed') {
          killPromises.push(
            new Promise((resolve) => {
              gsap.to(brick.sprite, {
                duration: 0.5,
                y: `+=${80 + index * 80}`,
                ease: Power4.easeIn,
                delay: index * 0.1 + colIndex * 0.1,
                onComplete: resolve,
              });
            })
          );
        }
      });
    });
  }

  Promise.all(killPromises).then(() => {
    brickField.forEach((row) => {
      row.destroy();
    });

    brickField.length = 0;

    // lets make some initial rows
    Array(NR_OF_START_ROWS)
      .fill(null)
      .map((na, index) =>
        makeNewRow(layer, resources, brickField, index, pubsub)
      );

    // lets activate all but two rows
    brickField.forEach((row, index) => {
      if (index > 1) {
        row.activateRow();
      }
    });

    // reset field position
    layer.y = FIELD_START_POS + 700;
    layer.x = FIELD_X_POS;

    // reset field data
    field.targetPos = FIELD_START_POS;
    field.newRowAtEvery = ROW_HEIGHT;
    field.addedRows = 0;
    field.timeLine = gsap.timeline();

    // move into position
    moveGameField(layer, field, pubsub, brickField);
  });
}

function gameOver(brickField) {
  brickField.reverse().forEach((row, index) => {
    row.hitBoxRow.forEach((slot) => {
      slot.hitBox.interactive = false;
      slot.arrow.visible = false;
    });

    const yTarget = brickField.length * 15 - index * 15;

    row.brickRow.forEach((brick) => {
      gsap.to(brick.sprite, {
        duration: 0.3,
        rotation: 0.05 - Math.random() * 0.1,
        y: `+=${yTarget}`,
        delay: index * 0.1,
        onStart: () => {
          brick.detonateExplotion();
        },
      });
    });
  });

  brickField.reverse();
}

function init(pubsub, resources) {
  const layer = getRenderLayer('gameField');
  const brickField = [];
  const game = {
    idle: true,
    layer,
    resources,
    brickField,
    pubsub,
    field: {},
  };

  pubsub.subscribe('makeNewRow', () => {
    makeNewRow(
      layer,
      resources,
      brickField,
      NR_OF_START_ROWS + game.field.addedRows,
      pubsub
    );
  });

  pubsub.subscribe('activateRow', () => {
    brickField[2].activateRow();
  });

  pubsub.subscribe('startNewGame', () => {
    initField(game);
  });

  pubsub.subscribe('gameOver', () => {
    gameOver(brickField);
  });

  pubsub.subscribe('swapBricks', ({ brickRow, index }) => {
    if (game.idle) {
      pubsub.publish('sound/swapBricks');
      game.idle = false;
      swapBricks(brickRow, index, brickField, pubsub).then(
        () => (game.idle = true)
      );
      moveGameField(layer, game.field, pubsub, brickField);
    }
  });
}

export default {
  init(pubsub) {
    const assets = BRICK_VARIATIONS.map((type, index) => {
      return {
        name: type,
        url: `assets/images/brick${index}.png`,
      };
    });

    assets.splice(0, 0, [
      { name: 'arrow', url: 'assets/images/arrow.png' },
      { name: 'explosion', url: 'assets/images/explosion.png' },
    ]);

    return new Promise((resolve) => {
      loader.loadResources(assets).then((resources) => {
        init(pubsub, resources);
        resolve();
      });
    });
  },
};
