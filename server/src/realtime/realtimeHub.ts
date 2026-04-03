import type { Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import type { QueueStats, RuntimeSettings, WsEvent } from "../types";
import { logger } from "../utils/logger";

let wss: WebSocketServer | null = null;

const sendAll = (event: WsEvent): void => {
  if (!wss) {
    return;
  }
  const payload = JSON.stringify(event);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
};

export const realtimeHub = {
  attach(server: HttpServer): void {
    wss = new WebSocketServer({ server, path: "/ws" });
    wss.on("connection", (socket) => {
      const hello: WsEvent = {
        type: "system:connected",
        payload: { connected: true, ts: Date.now() },
      };
      socket.send(JSON.stringify(hello));
    });
    wss.on("error", (error) => logger.error({ error }, "WebSocket server error"));
  },

  publishImageCreated(payload: unknown): void {
    sendAll({ type: "image:created", payload });
  },

  publishImageUpdated(payload: unknown): void {
    sendAll({ type: "image:updated", payload });
  },

  publishControl(settings: RuntimeSettings): void {
    sendAll({ type: "control:updated", payload: settings });
  },

  publishQueue(queue: QueueStats): void {
    sendAll({ type: "queue:stats", payload: queue });
  },

  publishBatch(payload: unknown): void {
    sendAll({ type: "batch:started", payload });
  },

  close(): void {
    if (!wss) {
      return;
    }
    wss.close();
    wss = null;
  },

  broadcastImageCreated(payload: unknown): void {
    sendAll({ type: "image:created", payload });
  },

  broadcastImageUpdated(payload: unknown): void {
    sendAll({ type: "image:updated", payload });
  },

  broadcastControlUpdated(settings: RuntimeSettings, queueStats?: QueueStats): void {
    sendAll({ type: "control:updated", payload: settings });
    if (queueStats) {
      sendAll({ type: "queue:stats", payload: queueStats });
    }
  },

  broadcastQueueStats(queue: QueueStats): void {
    sendAll({ type: "queue:stats", payload: queue });
  },

  broadcastBatchStarted(payload: unknown, queueStats?: QueueStats): void {
    sendAll({ type: "batch:started", payload });
    if (queueStats) {
      sendAll({ type: "queue:stats", payload: queueStats });
    }
  },
};
