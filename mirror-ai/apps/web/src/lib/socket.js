import { io } from "socket.io-client";
import { apiBase } from "./api";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(apiBase, {
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socket;
}
