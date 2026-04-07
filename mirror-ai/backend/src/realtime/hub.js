let ioServer = null;

export const registerSocketServer = (io) => {
  ioServer = io;
};

export const realtimeEvents = {
  imageIngested: "image:ingested",
  imageProcessing: "image:processing",
  imageProcessed: "image:processed",
  controlsUpdated: "controls:updated",
  presetUpdated: "preset:updated",
  batchQueued: "batch:queued",
  categoriesUpdated: "categories:updated",
};

export const publishEvent = (eventName, payload) => {
  if (!ioServer) {
    return;
  }
  ioServer.emit(eventName, payload);
};
