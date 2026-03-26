import { Server } from 'ws';

export type RealtimeEventType = 'image:new' | 'image:processing' | 'image:done' | 'image:error' | 'control:updated';

export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType;
  payload: T;
  timestamp: string;
}

export class RealtimeHub {
  constructor(private readonly server: Server) {}

  broadcast<T>(type: RealtimeEventType, payload: T): void {
    const message: RealtimeEvent<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    const encoded = JSON.stringify(message);
    for (const client of this.server.clients) {
      if (client.readyState === client.OPEN) {
        client.send(encoded);
      }
    }
  }
}
