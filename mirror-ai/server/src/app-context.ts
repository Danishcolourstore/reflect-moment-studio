import { StateStore } from "./lib/state-store.js";
import { MirrorService } from "./services/mirror-service.js";

export interface AppContext {
  store: StateStore;
  mirrorService: MirrorService;
}

export const createAppContext = (): AppContext => {
  const store = new StateStore();
  const mirrorService = new MirrorService(store);
  return { store, mirrorService };
};
