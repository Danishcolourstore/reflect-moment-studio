import { EventEmitter } from "node:events";
import type { ImageRecord, MirrorControlState } from "./types/models.js";

type MirrorEvents = {
  "image.updated": (image: ImageRecord) => void;
  "control.updated": (control: MirrorControlState) => void;
};

class TypedMirrorEvents extends EventEmitter {
  override on<K extends keyof MirrorEvents>(eventName: K, listener: MirrorEvents[K]): this {
    return super.on(eventName, listener);
  }

  override emit<K extends keyof MirrorEvents>(
    eventName: K,
    ...args: Parameters<MirrorEvents[K]>
  ): boolean {
    return super.emit(eventName, ...args);
  }
}

export const mirrorEvents = new TypedMirrorEvents();
