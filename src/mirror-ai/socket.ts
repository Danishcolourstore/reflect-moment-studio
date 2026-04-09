import { io, type Socket } from "socket.io-client";
import type { MirrorImage, MirrorSettings } from "./types";

const base = import.meta.env.VITE_MIRROR_API_URL ?? "http://localhost:8787";

export interface MirrorSocketEvents {
  onConnected?: (payload: { connectedAt: string }) => void;
  onImageQueued?: (image: MirrorImage) => void;
  onImageUpdated?: (image: MirrorImage) => void;
  onSettingsUpdated?: (settings: MirrorSettings) => void;
}

export function connectMirrorSocket(events: MirrorSocketEvents): Socket {
  const socket = io(base, {
    transports: ["websocket"],
  });

  socket.on("mirror:connected", (payload) => events.onConnected?.(payload));
  socket.on("mirror:image-queued", (image) => events.onImageQueued?.(image));
  socket.on("mirror:image-updated", (image) => events.onImageUpdated?.(image));
  socket.on("mirror:settings-updated", (settings) => events.onSettingsUpdated?.(settings));

  return socket;
}
