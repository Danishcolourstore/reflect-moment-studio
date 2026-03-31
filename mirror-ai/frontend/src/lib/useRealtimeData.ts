import { useEffect, useMemo, useState } from "react";
import type { ImageRecord, Settings } from "../types";
import { api } from "./api";

type EventMessage =
  | { type: "image:uploaded" | "image:processing" | "image:done" | "image:failed"; payload: ImageRecord }
  | { type: "settings:updated"; payload: Settings }
  | { type: string; payload?: unknown };

export function useRealtimeData() {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [connectionState, setConnectionState] = useState<"connecting" | "live" | "offline">("connecting");

  useEffect(() => {
    const load = async () => {
      try {
        const [imagesRes, settingsRes] = await Promise.all([api.getImages(), api.getSettings()]);
        setImages(imagesRes.items);
        setSettings(settingsRes);
      } catch (error) {
        console.error(error);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const wsBase = api.base.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsBase}/ws`);

    ws.onopen = () => setConnectionState("live");
    ws.onclose = () => setConnectionState("offline");
    ws.onerror = () => setConnectionState("offline");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as EventMessage;
        if (data.type === "settings:updated") {
          setSettings(data.payload);
          return;
        }

        if (
          data.type === "image:uploaded" ||
          data.type === "image:processing" ||
          data.type === "image:done" ||
          data.type === "image:failed"
        ) {
          setImages((prev) => {
            const idx = prev.findIndex((x) => x.id === data.payload.id);
            if (idx === -1) {
              return [data.payload, ...prev];
            }
            const next = [...prev];
            next[idx] = data.payload;
            return next;
          });
        }
      } catch (error) {
        console.error("Invalid ws payload", error);
      }
    };

    return () => ws.close();
  }, []);

  const stats = useMemo(() => {
    const processing = images.filter((i) => i.status === "processing").length;
    const done = images.filter((i) => i.status === "done").length;
    const failed = images.filter((i) => i.status === "failed").length;
    return {
      total: images.length,
      processing,
      done,
      failed,
    };
  }, [images]);

  return {
    images,
    setImages,
    settings,
    setSettings,
    connectionState,
    stats,
  };
}
