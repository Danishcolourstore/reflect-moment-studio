import { WebSocketServer } from "ws";

export function createRealtimeHub({ path = "/ws", onClientInit } = {}) {
  let wss = null;

  function attach(server) {
    wss = new WebSocketServer({
      server,
      path,
    });

    wss.on("connection", (socket) => {
      socket.send(
        JSON.stringify({
          type: "hello",
          payload: { message: "Mirror AI realtime connected" },
          at: new Date().toISOString(),
        }),
      );

      if (typeof onClientInit === "function") {
        try {
          const initialPayload = onClientInit();
          socket.send(
            JSON.stringify({
              type: "snapshot",
              payload: initialPayload,
              at: new Date().toISOString(),
            }),
          );
        } catch {
          // Keep the websocket alive even if initialization fails.
        }
      }
    });
  }

  function broadcast(type, payload) {
    if (!wss) return;
    const message = JSON.stringify({ type, payload, at: new Date().toISOString() });
    for (const client of wss.clients) {
      if (client.readyState === 1) {
        client.send(message);
      }
    }
  }

  async function close() {
    if (!wss) return;
    for (const client of wss.clients) {
      client.close(1000, "server-shutdown");
    }
    await new Promise((resolve) => {
      wss.close(() => resolve());
    });
    wss = null;
  }

  return {
    attach,
    broadcast,
    close,
  };
}
