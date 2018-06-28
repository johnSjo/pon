import * as PIXI from 'pixi.js';

export default class Brick {

    constructor (type, texture) {

        const sprite = new PIXI.Sprite(texture);

        sprite.scale = new PIXI.Point(5, 5);

        this.sprite = sprite;
        this.type = type;

    }
};