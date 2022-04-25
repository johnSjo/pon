import { Howl } from 'howler';
import PubSub from './PubSub';

const baseURL = './assets/audio/';

function createFxHowls() {
  const explosions = Array(9)
    .fill(null)
    .map((na, index) => {
      return {
        name: `explosion${index}`,
        url: `${baseURL}/explosions/explosion0${index + 1}.wav`,
        config: { volume: 0.3, rate: 2 },
      };
    });

  const soundConfigs = [
    ...explosions,
    {
      name: 'coinCollect',
      url: `${baseURL}gold.wav`,
      config: { volume: 0.4, rate: 1 },
    },
    {
      name: 'brickMove0',
      url: `${baseURL}click_1.wav`,
      config: { volume: 0.4, rate: 1 },
    },
    {
      name: 'brickMove1',
      url: `${baseURL}click_2.wav`,
      config: { volume: 0.4, rate: 1 },
    },
    {
      name: 'coinAppear',
      url: `${baseURL}Decline.wav`,
      config: { volume: 0.1, rate: 1 },
    },
  ];

  const sounds = soundConfigs.map(({ config, name, url }) => ({
    name,
    howl: new Howl({ ...config, src: url }),
  }));

  return sounds;
}

function createMusicHowl() {
  const config = { volume: 0.2 };

  return new Howl(
    Object.assign({}, config, {
      src: baseURL + 'Zander Noriega - Perpetual Tension.mp3',
      loop: true,
      autoplay: true,
      preload: false,
    })
  );
}

function initFxHandlers(fxHowls) {
  PubSub.subscribe('sound/explosion', () => {
    const soundToPlay = `explosion${Math.floor(Math.random() * 9)}`;

    fxHowls.find((sound) => sound.name === soundToPlay).howl.play();
  });

  PubSub.subscribe('sound/swapBricks', () => {
    const soundToPlay = `brickMove${Math.floor(Math.random() * 2)}`;

    fxHowls.find((sound) => sound.name === soundToPlay).howl.play();
  });

  PubSub.subscribe('coinCollected', () => {
    // const soundToPlay = `brickMove${Math.floor(Math.random() * 2)}`;

    fxHowls.find((sound) => sound.name === 'coinCollect').howl.play();
  });

  PubSub.subscribe('sound/coinAppear', () => {
    fxHowls.find((sound) => sound.name === 'coinAppear').howl.play();
  });
}

export default {
  init() {
    const musicHowl = createMusicHowl();
    const fxHowls = createFxHowls();

    initFxHandlers(fxHowls);

    PubSub.subscribeOnce('gameReady', () => {
      musicHowl.load();

      fxHowls.forEach((sound) => {
        sound.howl.load();
      });
    });
  },
};
