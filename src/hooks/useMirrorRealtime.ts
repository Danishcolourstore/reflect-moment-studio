import { useEffect, useMemo, useRef, useState } from "react";
import type { ImageRecord, QueueStats, RuntimeSettings, WsEvent } from "@/types/mirror";
import { api } from "@/lib/mirror-api";

type ConnectionState = "connecting" | "connected" | "disconnected";

type Options = {
  onImageCreated: (payload: ImageRecord) => void;
  onImageUpdated: (payload: ImageRecord) => void;
  onControlUpdated: (payload: RuntimeSettings) => void;
  onQueueStats: (payload: QueueStats) => void;
};

function toWsUrl(baseUrl: string): string {
  const base = new URL(baseUrl);
  const protocol = base.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${base.host}/ws`;
}

export function useMirrorRealtime(options: Options): { connectionState: ConnectionState } {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const wsUrl = useMemo(() => toWsUrl(api.baseUrl), []);

  useEffect(() => {
    let stopped = false;

    const connect = () => {
      if (stopped) {
        return;
      }

      setConnectionState("connecting");
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (stopped) {
          socket.close();
          return;
        }
        setConnectionState("connected");
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WsEvent;
          if (parsed.type === "image:created") {
            options.onImageCreated(parsed.payload);
          } else if (parsed.type === "image:updated") {
            options.onImageUpdated(parsed.payload);
          } else if (parsed.type === "control:updated") {
            options.onControlUpdated(parsed.payload);
          } else if (parsed.type === "queue:stats") {
            options.onQueueStats(parsed.payload);
          }
        } catch {
          // Ignore malformed websocket messages.
        }
      };

      socket.onerror = () => {
        setConnectionState("disconnected");
      };

      socket.onclose = () => {
        if (stopped) {
          return;
        }
        setConnectionState("disconnected");
        reconnectTimerRef.current = window.setTimeout(connect, 1200);
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
    };
  }, [options, wsUrl]);

  return { connectionState };
}
