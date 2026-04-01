import type { MirrorWsEvent } from "./types";

export const mirrorWsUrl = (() => {
  const explicit = import.meta.env.VITE_MIRROR_WS_URL as string | undefined;
  if (explicit) return explicit;

  const api = (import.meta.env.VITE_MIRROR_API_URL as string | undefined) ?? "http://localhost:8787";
  if (api.startsWith("https://")) return api.replace("https://", "wss://") + "/ws";
  if (api.startsWith("http://")) return api.replace("http://", "ws://") + "/ws";
  return "ws://localhost:8787/ws";
})();

type EventHandler = (event: MirrorWsEvent) => void;

export const createMirrorSocketClient = () => {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let stopped = false;
  const handlers = new Set<EventHandler>();
  const statusListeners = new Set<(status: "connecting" | "connected" | "disconnected") => void>();

  const emitStatus = (status: "connecting" | "connected" | "disconnected") => {
    statusListeners.forEach((listener) => listener(status));
  };

  const emitEvent = (event: MirrorWsEvent) => {
    handlers.forEach((handler) => handler(event));
  };

  const clearReconnect = () => {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    clearReconnect();
    if (stopped) return;
    reconnectTimer = window.setTimeout(() => {
      connect();
    }, 1200);
  };

  const connect = () => {
    try {
      emitStatus("connecting");
      socket = new WebSocket(mirrorWsUrl);

      socket.addEventListener("open", () => {
        emitStatus("connected");
      });

      socket.addEventListener("message", (message) => {
        try {
          const event = JSON.parse(message.data) as MirrorWsEvent;
          emitEvent(event);
        } catch {
          // ignore malformed events
        }
      });

      socket.addEventListener("close", () => {
        emitStatus("disconnected");
        scheduleReconnect();
      });

      socket.addEventListener("error", () => {
        emitStatus("disconnected");
        socket?.close();
      });
    } catch {
      emitStatus("disconnected");
      scheduleReconnect();
    }
  };

  connect();

  return {
    onEvent(handler: EventHandler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    onStatus(handler: (status: "connecting" | "connected" | "disconnected") => void) {
      statusListeners.add(handler);
      return () => {
        statusListeners.delete(handler);
      };
    },
    disconnect() {
      stopped = true;
      clearReconnect();
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
      socket = null;
    },
  };
};
