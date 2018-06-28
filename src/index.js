import PubSub from './PubSub';
import gameField from './gameField';
import renderer from './renderer';

const pubsub = PubSub.create();

Promise.all([
    gameField.init(pubsub),
    renderer.init(pubsub)
])
    .then(() => {
        pubsub.publish('gameReady');
    });
