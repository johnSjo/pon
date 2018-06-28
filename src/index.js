import PubSub from './PubSub';
import renderer from './renderer';

const pubsub = PubSub.create();

Promise.all([
    renderer.init(pubsub)
])
    .then(() => {
        pubsub.publish('gameReady')
    });
