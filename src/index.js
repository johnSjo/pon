import 'pixi.js';
import 'pixi-filters';

import PubSub from './PubSub';
import gameField from './gameField';
import renderer from './renderer';
import ui from './ui';
import background from './background';

const pubsub = PubSub.create();

Promise.all([
    background.init(),
    gameField.init(pubsub),
    renderer.init(pubsub),
    ui.init(pubsub)
])
    .then(() => {
        pubsub.publish('gameReady');
    });
