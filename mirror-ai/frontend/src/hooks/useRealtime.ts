import { useEffect } from 'react';
import type { RealtimeEvent } from '../types/mirror';
import { env } from '../utils/env';

export const useRealtime = (
  onEvent: (event: RealtimeEvent) => void,
  onStateChange: (state: 'connecting' | 'connected' | 'disconnected') => void,
): void => {
  useEffect(() => {
    let active = true;
    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;

    const connect = () => {
      if (!active) return;
      onStateChange('connecting');
      socket = new WebSocket(env.wsBaseUrl);

      socket.onopen = () => {
        if (!active) return;
        onStateChange('connected');
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as RealtimeEvent;
          onEvent(parsed);
        } catch {
          // Ignore malformed messages.
        }
      };

      socket.onclose = () => {
        if (!active) return;
        onStateChange('disconnected');
        retryTimer = window.setTimeout(connect, 1200);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      active = false;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      socket?.close();
    };
  }, [onEvent, onStateChange]);
};
