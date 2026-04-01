import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mirrorApi } from "./api";
import { createMirrorSocketClient } from "./socket";
import type {
  MirrorConnectionStatus,
  MirrorImage,
  MirrorQueueStats,
  MirrorSettings,
  MirrorSettingsResponse,
  MirrorSnapshotPayload,
  MirrorWsEvent,
} from "./types";

const SETTINGS_KEY = ["mirror-ai", "settings"] as const;
const IMAGES_KEY = ["mirror-ai", "images"] as const;

const mergeImages = (existing: MirrorImage[] | undefined, incoming: MirrorImage) => {
  const prev = Array.isArray(existing) ? existing : [];
  const idx = prev.findIndex((item) => item.id === incoming.id);
  if (idx === -1) return [incoming, ...prev];
  const updated = [...prev];
  updated[idx] = incoming;
  return updated;
};

export const useMirrorAiSettings = () =>
  useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: mirrorApi.getSettings,
    refetchOnWindowFocus: false,
  });

export const useMirrorAiImages = () =>
  useQuery({
    queryKey: IMAGES_KEY,
    queryFn: mirrorApi.getImages,
    refetchOnWindowFocus: false,
  });

export const useMirrorAiRealtime = () => {
  const queryClient = useQueryClient();
  const socketRef = useRef<ReturnType<typeof createMirrorSocketClient> | null>(null);
  const [status, setStatus] = useState<MirrorConnectionStatus>("connecting");
  const [queue, setQueue] = useState<MirrorQueueStats | null>(null);

  useEffect(() => {
    const socket = createMirrorSocketClient();
    socketRef.current = socket;
    const offStatus = socket.onStatus((nextStatus) => setStatus(nextStatus));

    const handleEvent = (event: MirrorWsEvent) => {
      if (event.type === "state.snapshot" && event.payload) {
        const snapshot = event.payload as MirrorSnapshotPayload;
        queryClient.setQueryData(IMAGES_KEY, snapshot.images ?? []);
        queryClient.setQueryData(SETTINGS_KEY, {
          presets: snapshot.presets ?? [],
          settings: snapshot.settings ?? {},
          categories: snapshot.categories ?? [],
        } satisfies MirrorSettingsResponse);
        setQueue(snapshot.queue ?? null);
        return;
      }

      if (event.type === "image.updated" && event.payload) {
        queryClient.setQueryData(IMAGES_KEY, (old: MirrorImage[] | undefined) =>
          mergeImages(old, event.payload as MirrorImage),
        );
        return;
      }

      if (event.type === "image.queued" && event.payload) {
        queryClient.setQueryData(IMAGES_KEY, (old: MirrorImage[] | undefined) =>
          mergeImages(old, event.payload as MirrorImage),
        );
        return;
      }

      if (event.type === "settings.updated" && event.payload) {
        queryClient.setQueryData(SETTINGS_KEY, (old: MirrorSettingsResponse | undefined) => ({
          presets: old?.presets ?? [],
          settings: (event.payload as MirrorSettings) ?? old?.settings ?? {},
          categories: old?.categories ?? [],
        }));
        return;
      }

      if (event.type === "queue.active" || event.type === "queue.completed" || event.type === "queue.failed") {
        void queryClient.invalidateQueries({ queryKey: IMAGES_KEY });
      }
    };

    const offEvents = socket.onEvent(handleEvent);

    return () => {
      offEvents();
      offStatus();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);

  return { status, queue };
};

export const useMirrorAI = () => {
  const queryClient = useQueryClient();
  const imagesQuery = useMirrorAiImages();
  const settingsQuery = useMirrorAiSettings();
  const realtime = useMirrorAiRealtime();
  const [compareMode, setCompareMode] = useState(false);

  const images = imagesQuery.data?.images ?? [];
  const queue = realtime.queue ?? imagesQuery.data?.queue ?? null;
  const settings = settingsQuery.data?.settings ?? {
    activePresetId: "",
    retouchIntensity: 0.3,
    category: "portrait",
  };
  const presets = settingsQuery.data?.presets ?? [];
  const categories =
    settingsQuery.data?.categories?.length
      ? settingsQuery.data.categories
      : ["portrait", "wedding", "fashion", "events", "studio", "lifestyle", "night"];

  const patchSettings = async (payload: Partial<MirrorSettings>) => {
    await mirrorApi.updateSettings(payload);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY }),
      queryClient.invalidateQueries({ queryKey: IMAGES_KEY }),
    ]);
  };

  const reprocessImage = async (imageId: string) => {
    await mirrorApi.reprocessImage(imageId);
    await queryClient.invalidateQueries({ queryKey: IMAGES_KEY });
  };

  const batchReprocess = async () => {
    await mirrorApi.reprocessBatch();
    await queryClient.invalidateQueries({ queryKey: IMAGES_KEY });
  };

  const sortedImages = useMemo(
    () => [...images].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [images],
  );

  return {
    images: sortedImages,
    presets,
    categories,
    settings,
    queue,
    isLoading: imagesQuery.isLoading || settingsQuery.isLoading,
    isConnected: realtime.status === "connected",
    compareMode,
    setCompareMode,
    patchSettings,
    reprocessImage,
    batchReprocess,
  };
};

