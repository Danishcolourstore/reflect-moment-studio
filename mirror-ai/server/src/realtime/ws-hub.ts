import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import type { Server } from "node:http";
import type { MirrorState, WsEvent } from "../types.js";

export class WsHub {
  private readonly wss: WebSocketServer;

  constructor(server: Server, onConnection?: (client: WebSocket) => void) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    if (onConnection) {
      this.wss.on("connection", onConnection);
    }
  }

  sendSnapshot(state: MirrorState): void {
    this.broadcast({
      type: "snapshot",
      payload: state,
      timestamp: new Date().toISOString(),
    });
  }

  broadcast(event: WsEvent): void {
    const serialized = JSON.stringify(event);
    for (const client of this.wss.clients) {
      if (client.readyState === 1) {
        client.send(serialized);
      }
    }
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.wss.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}
