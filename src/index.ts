import 'pixi.js';
import 'pixi-filters';

import PubSub from './PubSub';

import audio from './audio';
import background from './background';
import gameField from './gameField';
import renderer from './renderer';
import ui from './ui';
import winPresentation from './winPresentation';

Promise.all([
  audio.init(),
  background.init(),
  gameField.init(),
  renderer.init(),
  ui.init(),
  winPresentation.init(),
]).then(() => {
  PubSub.publish('gameReady');
});
