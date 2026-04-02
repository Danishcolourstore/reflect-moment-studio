import { useEffect } from "react";
import { env, wsUrlFromApi } from "../lib/env";
import type { ImageItem, WsEnvelope } from "../types/domain";

interface SocketPayload {
  onImageUpsert: (image: ImageItem) => void;
  onControlUpdated: () => void;
}

export function useMirrorSocket({ onImageUpsert, onControlUpdated }: SocketPayload): void {
  useEffect(() => {
    const ws = new WebSocket(wsUrlFromApi(env.apiBase));

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as WsEnvelope<any>;
        if (payload.event === "image.created" || payload.event === "image.updated") {
          const image = payload.data?.image as ImageItem | undefined;
          if (image) {
            onImageUpsert(image);
          }
          return;
        }

        if (payload.event === "control.updated") {
          onControlUpdated();
        }
      } catch {
        // Ignore malformed websocket payloads.
      }
    };

    return () => {
      ws.close();
    };
  }, [onControlUpdated, onImageUpsert]);
}
