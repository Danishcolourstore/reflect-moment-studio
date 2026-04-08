import { useEffect, useRef } from "react";
import type { AppEvent } from "@/types/mirror-ai";
import { mirrorWsUrl } from "@/lib/mirror-api";

export function useMirrorRealtime(onEvent: (event: AppEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;
    let attempts = 0;

    const connect = () => {
      if (closed) return;
      socket = new WebSocket(mirrorWsUrl());

      socket.onmessage = (message) => {
        try {
          const parsed = JSON.parse(message.data) as AppEvent;
          onEventRef.current(parsed);
        } catch (error) {
          console.warn("Mirror realtime payload parse failed", error);
        }
      };

      socket.onopen = () => {
        attempts = 0;
      };

      socket.onclose = () => {
        if (closed) return;
        attempts += 1;
        const delay = Math.min(15000, 300 * 2 ** attempts);
        retryTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);
}
