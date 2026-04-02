import { WebSocketServer, type WebSocket } from "ws";
import type { Server } from "node:http";
import type { WebSocketEvent } from "../types/domain.js";

export class RealtimeGateway {
  private readonly wss: WebSocketServer;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (socket) => {
      this.send(socket, "connection.ready", { connected: true });
    });
  }

  send(socket: WebSocket, event: string, data: unknown): void {
    const message: WebSocketEvent = {
      event,
      data,
      at: new Date().toISOString(),
    };
    socket.send(JSON.stringify(message));
  }

  broadcast<T>(event: string, data: T): void {
    const message: WebSocketEvent<T> = {
      event,
      data,
      at: new Date().toISOString(),
    };

    const payload = JSON.stringify(message);

    for (const client of this.wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
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

let gateway: RealtimeGateway | null = null;

export function setupWebSocketServer(server: Server): RealtimeGateway {
  gateway = new RealtimeGateway(server);
  return gateway;
}

export function broadcast(event: string, data: unknown): void {
  gateway?.broadcast(event, data);
}
