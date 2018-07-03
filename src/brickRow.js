import * as PIXI from 'pixi.js';
import Brick from './Brick';
import gameConfig from './gameConfig.json';

const BRICK_VARIATIONS = gameConfig.brickVariations;

const BRICK_SIZE = gameConfig.brickSize;

const PADDING = gameConfig.brickPadding;

const FIELD_WIDTH = gameConfig.bricksPerRow;

export default function makeNewRow (
    layer,
    resources,
    brickField,
    rowIndex,
    pubsub) {

    const currentLowestRow = brickField[0] ? brickField[0].brickRow : null;
    let lastTwoTypes = [];
    const brickRow = Array(FIELD_WIDTH).fill(null).map((na, index) => {
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

        const brick = new Brick(type, resources, pubsub);

        brick.sprite.x = index * (BRICK_SIZE + PADDING);
        brick.sprite.y = rowIndex * (BRICK_SIZE + PADDING);

        layer.addChild(brick.sprite);

        return brick;
    });

    const hitBoxRow = Array(FIELD_WIDTH - 1).fill(null).map((na, index) => {
        const hitBox = new PIXI.Graphics();
        const height = BRICK_SIZE + PADDING;
        const width = index === 0 || index === FIELD_WIDTH - 2
            ? height * 1.5
            : height;
        const xPos = index === 0 ? -PADDING * 0.5 : BRICK_SIZE * 0.5 - PADDING * 0.5;

        hitBox.beginFill(0xaaaaaa);

        hitBox.drawRect(0, 0, width, height);

        hitBox.renderable = false;
        hitBox.interactive = false;
        hitBox.buttonMode = true;

        hitBox.x = xPos + index * (BRICK_SIZE + PADDING);
        hitBox.y = rowIndex * (BRICK_SIZE + PADDING) - PADDING * 0.5;

        const arrow = new PIXI.Sprite(resources.arrow.texture);
        
        arrow.visible = false;
        arrow.scale = new PIXI.Point(4, 4);
        arrow.anchor = new PIXI.Point(0.5, 0.5);
        arrow.x = (BRICK_SIZE + PADDING) * index + BRICK_SIZE + PADDING * 0.5;
        arrow.y = hitBox.y + (BRICK_SIZE + PADDING) * 0.5;

        hitBox.on('pointerover', () => {
            arrow.visible = true;
        });
        
        hitBox.on('pointerout', () => {
            arrow.visible = false;
        });

        hitBox.on('pointertap', () => {
            if (brickRow[index] || brickRow[index + 1]) {
                pubsub.publish('swapBricks', { brickRow, index });
            }

        });

        layer.addChild(hitBox, arrow);

        return { hitBox, arrow };
    });

    const activateRow = () => {
        brickRow.forEach((brick) => brick.setState('idle'));
        hitBoxRow.forEach((slot) => (slot.hitBox.interactive = true));
    };
    
    const destroy = () => {
        brickRow.forEach((brick) => brick.destroy());
        hitBoxRow.forEach((slot) => {
            layer.removeChild(slot.hitBox, slot.arrow);
            slot.hitBox.destroy();
            slot.arrow.destroy();
        });
    };

    const row = { brickRow, hitBoxRow, activateRow, destroy };

    brickField.unshift(row);

}
