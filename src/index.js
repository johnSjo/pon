import PubSub from './PubSub';
import gameField from './gameField';
import renderer from './renderer';
import ui from './ui';

const pubsub = PubSub.create();

Promise.all([
    gameField.init(pubsub),
    renderer.init(pubsub),
    ui.init(pubsub)
])
    .then(() => {
        pubsub.publish('gameReady');
    });
