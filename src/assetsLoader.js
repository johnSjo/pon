import * as PIXI from 'pixi.js';

export default {
  loadResources(assets) {
    return new Promise((resolve) => {
      const loader = new PIXI.Loader();

      loader.add(assets);

      loader.load();

      loader.onComplete.once(() => resolve(loader.resources));
    });
  },
};
