
import { Howl } from 'howler';

const baseURL = './assets/audio/';

function createFxHowls () {

    const sounds = Array(9).fill(null).map((na, index) => {
        return { 
            name: `explosion${index}`,
            url: `${baseURL}/explosions/explosion0${index + 1}.wav`,
            config: { volume: 0.3, rate: 2 }
        };
    });

    sounds.splice(0, 0, ...[
        {
            name: 'coinCollect',
            url: `${baseURL}gold.wav`,
            config: { volume: 0.4, rate: 1 }
        },
        {
            name: 'brickMove0',
            url: `${baseURL}click_1.wav`,
            config: { volume: 0.4, rate: 1 }
        },
        {
            name: 'brickMove1',
            url: `${baseURL}click_2.wav`,
            config: { volume: 0.4, rate: 1 }
        },
        {
            name: 'coinAppear',
            url: `${baseURL}Decline.wav`,
            config: { volume: 0.1, rate: 1 }
        }
    ]);

    sounds.forEach((sound) => {
        const config = sound.config || {};

        sound.howl = new Howl(Object.assign({}, config, { src: sound.url }));
    });

    return sounds;

}

function createMusicHowl () {

    const config = { volume: 0.2 };

    return new Howl(Object.assign({}, config, {
        src: baseURL + 'Zander Noriega - Perpetual Tension.mp3',
        loop: true,
        autoplay: true,
        preload: false
    }));

}

function initFxHandlers (pubsub, fxHowls) {

    pubsub.subscribe('sound/explosion', () => {
        const soundToPlay = `explosion${Math.floor(Math.random() * 9)}`;

        fxHowls.find((sound) => sound.name === soundToPlay).howl.play();
    });

    pubsub.subscribe('sound/swapBricks', () => {
        const soundToPlay = `brickMove${Math.floor(Math.random() * 2)}`;

        fxHowls.find((sound) => sound.name === soundToPlay).howl.play();
    });

    pubsub.subscribe('coinCollected', () => {
        // const soundToPlay = `brickMove${Math.floor(Math.random() * 2)}`;

        fxHowls.find((sound) => sound.name === 'coinCollect').howl.play();
    });

    pubsub.subscribe('sound/coinAppear', () => {

        fxHowls.find((sound) => sound.name === 'coinAppear').howl.play();
    });


}

export default {
    init (pubsub) {

        const musicHowl = createMusicHowl();
        const fxHowls = createFxHowls();
    
        initFxHandlers(pubsub, fxHowls);

        pubsub.subscribeOnce('gameReady', () => {
            musicHowl.load();

            fxHowls.forEach((sound) => {
                sound.howl.load();
            });
        });
    
    }
};
