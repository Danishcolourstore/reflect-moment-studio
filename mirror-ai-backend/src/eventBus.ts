import { EventEmitter } from "node:events";
import type { MirrorEvent } from "./types.js";

export class EventBus {
  private readonly emitter = new EventEmitter();

  public publish(event: MirrorEvent): void {
    this.emitter.emit("mirror:event", event);
  }

  public subscribe(listener: (event: MirrorEvent) => void): () => void {
    this.emitter.on("mirror:event", listener);
    return () => this.emitter.off("mirror:event", listener);
  }
}
