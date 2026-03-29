import type { Server as HttpServer } from "node:http";
import { WebSocketServer } from "ws";
import { db } from "./database.js";
import type { TypedEventBus } from "./events.js";

export const createWebsocketServer = (server: HttpServer, events: TypedEventBus) => {
  const wss = new WebSocketServer({ server, path: "/ws" });

  const broadcast = (payload: unknown) => {
    const body = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(body);
      }
    }
  };

  wss.on("connection", async (socket) => {
    try {
      const snapshot = await db.getSnapshot();
      socket.send(JSON.stringify({ type: "snapshot", payload: snapshot }));
    } catch {
      socket.send(JSON.stringify({ type: "error", payload: { message: "Unable to load snapshot" } }));
    }
  });

  events.on("imageCreated", (image) => broadcast({ type: "imageCreated", payload: image }));
  events.on("imageUpdated", (image) => broadcast({ type: "imageUpdated", payload: image }));
  events.on("batchUpdated", (batch) => broadcast({ type: "batchUpdated", payload: batch }));
  events.on("settingsUpdated", (settings) => broadcast({ type: "settingsUpdated", payload: settings }));

  return {
    close: async () => {
      wss.clients.forEach((client) => client.close());
      await new Promise<void>((resolve) => {
        wss.close(() => resolve());
      });
    },
  };
};
