import { EventEmitter } from "node:events";
import type { WsEvent } from "../types.js";

export const pipelineEvents = new EventEmitter();

export const emitPipelineEvent = <T>(event: WsEvent<T>): void => {
  pipelineEvents.emit("event", event);
};
