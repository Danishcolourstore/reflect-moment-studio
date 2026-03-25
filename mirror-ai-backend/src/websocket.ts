import type { Server as HttpServer } from "node:http";
import { WebSocketServer } from "ws";
import type { EventBus } from "./eventBus.js";
import type { MirrorRepository } from "./repository.js";
import { logger } from "./logger.js";

export function setupWebSocket(
  server: HttpServer,
  bus: EventBus,
  repository: MirrorRepository,
): void {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket) => {
    socket.send(
      JSON.stringify({
        type: "system.connected",
        at: new Date().toISOString(),
      }),
    );

    socket.send(
      JSON.stringify({
        type: "bootstrap",
        queue: { queued: 0, processing: 0 },
        controls: repository.getControls(),
        images: repository.listImages({ limit: 100 }),
      }),
    );
  });

  bus.subscribe((event) => {
    const payload = JSON.stringify(event);
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  });

  logger.info("WebSocket endpoint ready", { path: "/ws" });
}
