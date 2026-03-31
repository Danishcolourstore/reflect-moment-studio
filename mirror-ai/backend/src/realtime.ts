import { WebSocketServer } from "ws";
import type { Server } from "node:http";
import type { RealtimeEvent } from "./types.js";
import { logger } from "./logger.js";

export class RealtimeHub {
  private readonly wss: WebSocketServer;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (socket) => {
      socket.send(
        JSON.stringify({
          type: "system:ready",
          payload: { connected: true },
          timestamp: new Date().toISOString(),
        }),
      );
    });
    this.wss.on("error", (error) => {
      logger.error({ err: error }, "websocket server error");
    });
  }

  broadcast<T>(event: RealtimeEvent<T>) {
    const payload = JSON.stringify(event);
    for (const client of this.wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  }
}

