let ioRef = null;

export function attachSocket(serverIo) {
  ioRef = serverIo;
}

export function broadcast(event, payload) {
  if (!ioRef) {
    return;
  }
  ioRef.emit(event, payload);
}
