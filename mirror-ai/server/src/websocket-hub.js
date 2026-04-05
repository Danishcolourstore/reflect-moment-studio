import { WebSocketServer } from "ws";

export function createWebSocketHub(httpServer, logger) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const clients = new Set();

  wss.on("connection", (socket) => {
    clients.add(socket);
    socket.send(JSON.stringify({ type: "system:connected", payload: { ts: Date.now() } }));

    socket.on("close", () => clients.delete(socket));
    socket.on("error", (error) => {
      logger.warn("WebSocket client error", { error: error?.message || String(error) });
      clients.delete(socket);
    });
  });

  function broadcast(type, payload) {
    const data = JSON.stringify({ type, payload, ts: Date.now() });
    for (const client of clients) {
      if (client.readyState === 1) {
        client.send(data);
      }
    }
  }

  return {
    broadcast,
    close: () => wss.close(),
    getClientCount: () => clients.size,
  };
}
