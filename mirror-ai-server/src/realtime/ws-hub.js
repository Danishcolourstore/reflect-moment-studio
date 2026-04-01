import { WebSocketServer } from "ws";

export class WebSocketHub {
  constructor({ server, path, logger, getSnapshot }) {
    this.logger = logger;
    this.getSnapshot = getSnapshot;
    this.wss = new WebSocketServer({ server, path });
    this.wss.on("connection", (socket) => {
      socket.send(JSON.stringify({ type: "system.connected", at: new Date().toISOString() }));
      if (this.getSnapshot) {
        socket.send(
          JSON.stringify({
            type: "state.snapshot",
            payload: this.getSnapshot(),
            at: new Date().toISOString(),
          }),
        );
      }
    });
  }

  broadcast(type, payload) {
    const message = JSON.stringify({ type, payload, at: new Date().toISOString() });
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  }

  notifySnapshot(snapshot) {
    this.broadcast("state.snapshot", snapshot);
  }

  notifyImageUpdated(image) {
    this.broadcast("image.updated", image);
  }

  notifySettingsUpdated(settings) {
    this.broadcast("settings.updated", settings);
  }

  notifyPresetApplied(payload) {
    this.broadcast("preset.applied", payload);
  }

  close() {
    this.wss.close();
    this.logger.info("WebSocket hub closed");
  }
}
