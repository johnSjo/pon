import * as PIXI from 'pixi.js';
import { TweenLite } from 'gsap';
import gameConfig from './gameConfig.json';

const STATES = [
    'inactive',
    'idle',
    'selected',
    'moving',
    'dying',
    'killed'
];

const BRICK_SIZE = gameConfig.brickSize;

const PADDING = gameConfig.brickPadding;

function initSprite (texture) {
    const sprite = new PIXI.Sprite(texture);

    sprite.scale = new PIXI.Point(5, 5);
    sprite.tint = '0x888888';

    return sprite;
}

function initExplosion (texture) {
    const exp = new PIXI.extras.AnimatedSprite(texture);

    exp.loop = false;
    exp.anchor = new PIXI.Point(0.5, 0.5);
    exp.scale = new PIXI.Point(5, 5);
    exp.animationSpeed = 0.2;
    exp.rotation = Math.random();
    exp.onComplete = () => exp.parent.removeChild(exp);

    return exp;
}
export default class Brick {

    constructor (type, resources, pubsub) {

        const texture = resources[type].texture;
        const explosionTexture = Array(5).fill(null).map((na, frame) => {
            const { texture } = resources.explosion;
            const frameSize = {
                height: texture.height,
                width: texture.width / 5
            };

            return new PIXI.Texture(texture, new PIXI.Rectangle(
                frame * frameSize.width, 0, frameSize.width, frameSize.height
            ));
        });

        this.sprite = initSprite(texture);
        this.explosion = initExplosion(explosionTexture);
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
            const { sprite } = this;
            const spritePos = sprite.getGlobalPosition();

            this.detonateExplotion();
            this.pubsub.publish('coinWin', {
                x: spritePos.x + sprite.width * 0.5,
                y: spritePos.y + sprite.height * 0.5
            });

            TweenLite.to(sprite, 0.2, { alpha: 0, onComplete: () => {
                this.setState('killed');
                resolve();
            } });
        });
    }

    detonateExplotion () {
        // add to layer
        this.sprite.parent.addChild(this.explosion);

        this.explosion.x = this.sprite.x + this.sprite.width * 0.5;
        this.explosion.y = this.sprite.y + this.sprite.height * 0.5;

        this.explosion.play();
        this.pubsub.publish('sound/explosion');
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