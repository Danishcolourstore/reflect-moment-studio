import { useCallback, useEffect, useMemo, useState } from "react";
import { mirrorApi } from "./api";
import type {
  BatchOperation,
  ImageRecord,
  MirrorSnapshot,
  RealtimeMessage,
  RuntimeSettings,
} from "./types";

const sortImages = (images: ImageRecord[]) =>
  [...images].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

const sortBatches = (batches: BatchOperation[]) =>
  [...batches].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

export const useMirrorRealtime = () => {
  const [snapshot, setSnapshot] = useState<MirrorSnapshot>({
    images: [],
    presets: [],
    settings: {
      activePresetId: "",
      retouchIntensity: 0.25,
      activeCategory: "portrait",
    },
    batches: [],
  });
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applySnapshot = useCallback((incoming: MirrorSnapshot) => {
    setSnapshot({
      images: sortImages(incoming.images),
      presets: incoming.presets,
      settings: incoming.settings,
      batches: sortBatches(incoming.batches),
    });
  }, []);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let cancelled = false;
    let reconnectHandle: number | null = null;

    const connect = () => {
      const wsBase = mirrorApi.baseUrl.replace(/^http/i, "ws");
      socket = new WebSocket(`${wsBase}/ws`);

      socket.onopen = () => {
        if (cancelled) return;
        setConnected(true);
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          const message = JSON.parse(event.data) as RealtimeMessage;
          if (message.type === "snapshot") {
            applySnapshot(message.payload);
            setLoading(false);
            setError(null);
            return;
          }
          if (message.type === "imageCreated" || message.type === "imageUpdated") {
            setSnapshot((current) => ({
              ...current,
              images: sortImages(
                current.images.some((img) => img.id === message.payload.id)
                  ? current.images.map((img) => (img.id === message.payload.id ? message.payload : img))
                  : [...current.images, message.payload],
              ),
            }));
            return;
          }
          if (message.type === "batchUpdated") {
            setSnapshot((current) => ({
              ...current,
              batches: sortBatches(
                current.batches.some((batch) => batch.id === message.payload.id)
                  ? current.batches.map((batch) => (batch.id === message.payload.id ? message.payload : batch))
                  : [...current.batches, message.payload],
              ),
            }));
            return;
          }
          if (message.type === "settingsUpdated") {
            setSnapshot((current) => ({
              ...current,
              settings: message.payload as RuntimeSettings,
            }));
          }
        } catch {
          // Ignore malformed message to keep stream alive.
        }
      };

      socket.onerror = () => {
        if (cancelled) return;
        setConnected(false);
      };

      socket.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        reconnectHandle = window.setTimeout(connect, 1200);
      };
    };

    mirrorApi
      .fetchSnapshot()
      .then((initial) => {
        if (cancelled) return;
        applySnapshot(initial);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError((err as Error).message || "Failed to load snapshot");
        setLoading(false);
      });

    connect();

    return () => {
      cancelled = true;
      if (reconnectHandle !== null) {
        window.clearTimeout(reconnectHandle);
      }
      socket?.close();
    };
  }, [applySnapshot]);

  const summary = useMemo(() => {
    const total = snapshot.images.length;
    const queued = snapshot.images.filter((image) => image.status === "queued").length;
    const processing = snapshot.images.filter((image) => image.status === "processing").length;
    const done = snapshot.images.filter((image) => image.status === "done").length;
    const errors = snapshot.images.filter((image) => image.status === "error").length;
    return { total, queued, processing, done, errors };
  }, [snapshot.images]);

  return {
    snapshot,
    setSnapshot,
    connected,
    loading,
    error,
    summary,
  };
};
