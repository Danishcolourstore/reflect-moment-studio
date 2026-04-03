import type { RuntimeSettings } from "../types";
import { imageRepository } from "../storage/imageRepository";

export const settingsService = {
  get(): RuntimeSettings {
    return imageRepository.getSettings();
  },
  update(input: Partial<RuntimeSettings>): RuntimeSettings {
    return imageRepository.setSettings(input);
  },
};
