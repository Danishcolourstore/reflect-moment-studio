import { EventEmitter } from "node:events";
import type { ImageRecord, MirrorSettings } from "./types";

interface MirrorEvents {
  imageQueued: [ImageRecord];
  imageUpdated: [ImageRecord];
  settingsUpdated: [MirrorSettings];
}

export class TypedEventBus extends EventEmitter {
  override on<T extends keyof MirrorEvents>(event: T, listener: (...args: MirrorEvents[T]) => void): this {
    return super.on(event, listener);
  }

  override emit<T extends keyof MirrorEvents>(event: T, ...args: MirrorEvents[T]): boolean {
    return super.emit(event, ...args);
  }
}

export const eventBus = new TypedEventBus();
