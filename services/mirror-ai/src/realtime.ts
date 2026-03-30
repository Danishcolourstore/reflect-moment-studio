import { WebSocketServer, type WebSocket } from "ws";
import type { Server } from "node:http";
import type { ImageRecord, MirrorControlState } from "./types/models.js";
import { logger } from "./logger.js";

interface WsEnvelope<T = unknown> {
  type: string;
  payload: T;
}

const clients = new Set<WebSocket>();

function send(ws: WebSocket, data: WsEnvelope): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export function attachRealtime(server: Server, wsPath: string): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: wsPath,
  });

  wss.on("connection", (ws) => {
    clients.add(ws);
    logger.debug({ clients: clients.size }, "WebSocket client connected");

    ws.on("close", () => {
      clients.delete(ws);
      logger.debug({ clients: clients.size }, "WebSocket client disconnected");
    });
  });

  return wss;
}

function broadcast<T>(message: WsEnvelope<T>): void {
  for (const client of clients) {
    send(client, message);
  }
}

export function broadcastImageUpdate(image: ImageRecord): void {
  broadcast({ type: "image.updated", payload: image });
}

export function broadcastControlUpdate(control: MirrorControlState): void {
  broadcast({ type: "control.updated", payload: control });
}

