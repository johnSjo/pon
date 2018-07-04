import 'pixi.js';
import 'pixi-filters';

import PubSub from './PubSub';

import background from './background';
import gameField from './gameField';
import renderer from './renderer';
import ui from './ui';
import winPresentation from './winPresentation';

const pubsub = PubSub.create();

Promise.all([
    background.init(),
    gameField.init(pubsub),
    renderer.init(pubsub),
    ui.init(pubsub),
    winPresentation.init(pubsub)
])
    .then(() => {
        pubsub.publish('gameReady');
    });
