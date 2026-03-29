import { EventEmitter } from "node:events";
import type { BatchOperation, ImageRecord, RuntimeSettings } from "./types.js";

export type MirrorEvents = {
  imageCreated: (image: ImageRecord) => void;
  imageUpdated: (image: ImageRecord) => void;
  batchUpdated: (batch: BatchOperation) => void;
  settingsUpdated: (settings: RuntimeSettings) => void;
};

export class TypedEventBus {
  private readonly emitter = new EventEmitter();

  on<K extends keyof MirrorEvents>(event: K, handler: MirrorEvents[K]): void {
    this.emitter.on(event, handler as (...args: unknown[]) => void);
  }

  emit<K extends keyof MirrorEvents>(event: K, payload: Parameters<MirrorEvents[K]>[0]): void {
    this.emitter.emit(event, payload);
  }
}

export const bus = new TypedEventBus();
