import * as PIXI from 'pixi.js';
import { TweenLite } from 'gsap';

const STATES = [
    'inactive',
    'idle',
    'selected',
    'moving',
    'dying',
    'killed'
];

const BRICK_SIZE = 80;

const PADDING = 5;

function initSprite (texture) {
    const sprite = new PIXI.Sprite(texture);

    sprite.scale = new PIXI.Point(5, 5);
    sprite.tint = '0x888888';

    return sprite;
}
export default class Brick {

    constructor (type, texture, pubsub) {

        this.sprite = initSprite(texture);
        this.type = type;
        this.state = STATES[0];
        this.pubsub = pubsub;

    }

    moveRight () {
        this.setState('moving');

        return new Promise((resolve) => {
            TweenLite.to(this.sprite, 0.3, { x: `+=${BRICK_SIZE + PADDING}`, onComplete: () => {
                this.setState('idle');
                resolve();
            } });
        });
    }

    moveLeft () {
        this.setState('moving');

        return new Promise((resolve) => {
            TweenLite.to(this.sprite, 0.3, { x: `-=${BRICK_SIZE + PADDING}`, onComplete: () => {
                this.setState('idle');
                resolve();
            } });
        });
    }
  
    moveDown (distans) {
        this.setState('moving');
        
        return new Promise((resolve) => {
            TweenLite.to(this.sprite, 0.3, { y: `+=${(BRICK_SIZE + PADDING) * distans}`, onComplete: () => {
                this.setState('idle');
                resolve();
            } });
        });
    }
    
    kill () {
        this.setState('dying');

        return new Promise((resolve) => {
            TweenLite.to(this.sprite, 0.3, { alpha: 0, onComplete: () => {
                this.setState('killed');
                resolve();
            } });
        });
    }

    destroy () {
        this.sprite.parent.removeChild(this.sprite);
        this.sprite.destroy();
        this.pubsub = null;
    }

    setState (newState) {
        if (STATES.includes(newState)) {
            const { sprite } = this;

            this.state = newState;

            switch (newState) {
                case 'idle':
                    sprite.tint = '0xffffff';
                    sprite.interactive = true;
                    break;
                case 'selected':
                    sprite.tint = '0xff0000';
                    break;
                case 'moving':
                    sprite.tint = '0xffffff';
                    sprite.interactive = false;
                    // animation
                    break;
                case 'dying':
                    sprite.interactive = false;
                    // kill animation
                    // destroy Brick object
                    break;
                case 'killed':
                    sprite.visible = false;
                    this.type = 'destroyed';
                    break;
            }

        } else {
            console.warn(`Trying to set the onexisting state: ${newState} on a Brick.`);
        }
    }

};