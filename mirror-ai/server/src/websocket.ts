import type { Server as HttpServer } from "node:http";
import path from "node:path";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config";
import { eventBus } from "./events";
import type { ImageRecord } from "./types";

function mapImageForClient(image: ImageRecord) {
  return {
    ...image,
    originalUrl: `/assets/originals/${path.basename(image.originalPath)}`,
    previewUrl: image.previewPath ? `/assets/previews/${path.basename(image.previewPath)}` : null,
    processedUrl: image.processedPath ? `/assets/processed/${path.basename(image.processedPath)}` : null,
  };
}

export function attachWebsocket(server: HttpServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: config.api.corsOrigin === "*" ? true : config.api.corsOrigin,
    },
  });

  io.on("connection", (socket) => {
    socket.emit("mirror:connected", { connectedAt: new Date().toISOString() });
  });

  eventBus.on("imageQueued", (image) => {
    io.emit("mirror:image-queued", mapImageForClient(image));
  });

  eventBus.on("imageUpdated", (image) => {
    io.emit("mirror:image-updated", mapImageForClient(image));
  });

  eventBus.on("settingsUpdated", (settings) => {
    io.emit("mirror:settings-updated", settings);
  });

  return io;
}
