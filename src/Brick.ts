import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import gameConfig from './gameConfig.json';
import PubSub from './PubSub';

export enum BrickState {
  INACTIVE = 'inactive',
  IDLE = 'idle',
  SELECTED = 'selected',
  MOVING = 'moving',
  DYING = 'dying',
  KILLED = 'killed',
}

const BRICK_SIZE = gameConfig.brickSize;

const PADDING = gameConfig.brickPadding;

function initSprite(texture) {
  const sprite = new PIXI.Sprite(texture);

  sprite.scale.set(5, 5);
  sprite.tint = 0x888888;

  return sprite;
}

function initExplosion(texture) {
  const exp = new PIXI.AnimatedSprite(texture);

  exp.loop = false;
  exp.anchor.set(0.5, 0.5);
  exp.scale.set(5, 5);
  exp.animationSpeed = 0.2;
  exp.rotation = Math.random();
  exp.onComplete = () => exp.parent.removeChild(exp);

  return exp;
}

export default class Brick {
  private _type: string;
  private _sprite: PIXI.Sprite;
  private _explosion: PIXI.AnimatedSprite;
  private _state = BrickState.INACTIVE;

  constructor(type, resources) {
    const texture = resources[type].texture;
    const explosionTexture = Array(5)
      .fill(null)
      .map((na, frame) => {
        const { texture } = resources.explosion;
        const frameSize = {
          height: texture.height,
          width: texture.width / 5,
        };

        return new PIXI.Texture(
          texture,
          new PIXI.Rectangle(
            frame * frameSize.width,
            0,
            frameSize.width,
            frameSize.height
          )
        );
      });

    this._sprite = initSprite(texture);
    this._explosion = initExplosion(explosionTexture);
    this._type = type;
  }

  get sprite() {
    return this._sprite;
  }

  get type() {
    return this._type;
  }

  get state() {
    return this._state;
  }

  moveRight() {
    this.setState(BrickState.MOVING);

    return new Promise<void>((resolve) => {
      gsap.to(this._sprite, {
        duration: 0.3,
        x: `+=${BRICK_SIZE + PADDING}`,
        onComplete: () => {
          this.setState(BrickState.IDLE);
          resolve();
        },
      });
    });
  }

  moveLeft() {
    this.setState(BrickState.MOVING);

    return new Promise<void>((resolve) => {
      gsap.to(this._sprite, {
        duration: 0.3,
        x: `-=${BRICK_SIZE + PADDING}`,
        onComplete: () => {
          this.setState(BrickState.IDLE);
          resolve();
        },
      });
    });
  }

  moveDown(distans) {
    this.setState(BrickState.MOVING);

    return new Promise<void>((resolve) => {
      gsap.to(this._sprite, {
        duration: 0.3,
        y: `+=${(BRICK_SIZE + PADDING) * distans}`,
        onComplete: () => {
          this.setState(BrickState.IDLE);
          resolve();
        },
      });
    });
  }

  kill() {
    this.setState(BrickState.DYING);

    return new Promise<void>((resolve) => {
      const spritePos = this._sprite.getGlobalPosition();

      this.detonateExplotion();
      PubSub.publish('coinWin', {
        x: spritePos.x + this._sprite.width * 0.5,
        y: spritePos.y + this._sprite.height * 0.5,
      });

      gsap.to(this._sprite, {
        duration: 0.2,
        alpha: 0,
        onComplete: () => {
          this.setState(BrickState.KILLED);
          resolve();
        },
      });
    });
  }

  detonateExplotion() {
    // add to layer
    this._sprite.parent.addChild(this._explosion);

    this._explosion.x = this._sprite.x + this._sprite.width * 0.5;
    this._explosion.y = this._sprite.y + this._sprite.height * 0.5;

    this._explosion.play();
    PubSub.publish('sound/explosion');
  }

  destroy() {
    this._sprite.parent.removeChild(this._sprite);
    this._sprite.destroy();
  }

  setState(newState: BrickState) {
    this._state = newState;

    switch (this._state) {
      case BrickState.IDLE:
        this._sprite.tint = 0xffffff;
        this._sprite.interactive = true;
        break;
      case BrickState.SELECTED:
        this._sprite.tint = 0xff0000;
        break;
      case BrickState.MOVING:
        this._sprite.tint = 0xffffff;
        this._sprite.interactive = false;
        // animation
        break;
      case BrickState.DYING:
        this._sprite.interactive = false;
        // kill animation
        // destroy Brick object
        break;
      case BrickState.KILLED:
        this._sprite.visible = false;
        this._type = 'destroyed';
        break;
    }
  }
}
