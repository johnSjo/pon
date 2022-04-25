import * as PIXI from 'pixi.js';
import { IAddOptions } from 'pixi.js';

export default {
  loadResources(assets: IAddOptions[]) {
    return new Promise<PIXI.utils.Dict<PIXI.LoaderResource>>((resolve) => {
      const loader = new PIXI.Loader();

      loader.add(assets);

      loader.load();

      loader.onComplete.once(() => resolve(loader.resources));
    });
  },
};
