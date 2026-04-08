import type { AppEvent, ControlState, ImageRecord } from "../types.js";

type Subscriber = (event: AppEvent) => void;

export interface AppEventBus {
  emit(event: AppEvent): void;
  emitImageReceived(image: ImageRecord): void;
  emitImageStatus(image: ImageRecord): void;
  emitControlState(controls: ControlState): void;
  subscribe(fn: Subscriber): () => void;
}

class InMemoryEventBus implements AppEventBus {
  private readonly subscribers = new Set<Subscriber>();

  emit(event: AppEvent): void {
    this.subscribers.forEach((subscriber) => {
      try {
        subscriber(event);
      } catch (error) {
        console.error("Event subscriber failed", error);
      }
    });
  }

  emitImageReceived(image: ImageRecord): void {
    this.emit({ type: "image.received", payload: { image } });
  }

  emitImageStatus(image: ImageRecord): void {
    this.emit({ type: "image.updated", payload: { image } });
  }

  emitControlState(controls: ControlState): void {
    this.emit({ type: "control.updated", payload: { controls } });
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }
}

export const eventBus: AppEventBus = new InMemoryEventBus();
