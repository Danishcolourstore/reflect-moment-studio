import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  batchApplyMirror,
  fetchMirrorSnapshot,
  resolveMirrorMediaUrl,
  sortMirrorImages,
  updateMirrorControls,
} from "./api";
import { mirrorAiWsUrl } from "./config";
import type {
  MirrorControls,
  MirrorImage,
  MirrorPresetId,
  MirrorSnapshot,
  MirrorWsEvent,
} from "./types";

const normalizeImage = (image: MirrorImage): MirrorImage => ({
  ...image,
  originalUrl: resolveMirrorMediaUrl(image.originalUrl) || "",
  previewUrl: resolveMirrorMediaUrl(image.previewUrl),
  fullUrl: resolveMirrorMediaUrl(image.fullUrl),
  thumbnailUrl: resolveMirrorMediaUrl(image.thumbnailUrl),
});

const normalizeSnapshot = (snapshot: MirrorSnapshot): MirrorSnapshot => ({
  ...snapshot,
  images: sortMirrorImages(snapshot.images.map(normalizeImage)),
});

const upsertImage = (images: MirrorImage[], next: MirrorImage): MirrorImage[] => {
  const index = images.findIndex((item) => item.id === next.id);
  if (index === -1) {
    return sortMirrorImages([normalizeImage(next), ...images]);
  }
  const cloned = [...images];
  cloned[index] = normalizeImage(next);
  return sortMirrorImages(cloned);
};

export const useMirrorAIRealtime = () => {
  const queryClient = useQueryClient();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);

  const snapshotQuery = useQuery({
    queryKey: ["mirror-ai-snapshot"],
    queryFn: fetchMirrorSnapshot,
    select: normalizeSnapshot,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const socket = new WebSocket(mirrorAiWsUrl);

    socket.onopen = () => {
      setIsSocketConnected(true);
    };
    socket.onclose = () => {
      setIsSocketConnected(false);
    };
    socket.onerror = () => {
      setIsSocketConnected(false);
    };
    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as MirrorWsEvent;
        setLastEventAt(event.timestamp);
        queryClient.setQueryData<MirrorSnapshot | undefined>(
          ["mirror-ai-snapshot"],
          (previous) => {
            if (!previous) return previous;
            if (event.type === "snapshot") {
              return normalizeSnapshot(event.payload as MirrorSnapshot);
            }
            if (event.type === "controls:updated") {
              return {
                ...previous,
                controls: event.payload as MirrorControls,
              };
            }
            const imageEvent = event.payload as MirrorImage;
            return {
              ...previous,
              images: upsertImage(previous.images, imageEvent),
            };
          },
        );
      } catch {
        // Ignore malformed websocket payloads.
      }
    };

    return () => {
      socket.close();
    };
  }, [queryClient]);

  const controlsMutation = useMutation({
    mutationFn: (input: {
      defaultPreset?: MirrorPresetId;
      defaultRetouchIntensity?: number;
      defaultCategory?: string;
    }) => updateMirrorControls(input),
    onSuccess: (controls) => {
      queryClient.setQueryData<MirrorSnapshot | undefined>(
        ["mirror-ai-snapshot"],
        (previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            controls,
          };
        },
      );
      toast.success("Controls updated");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update controls");
    },
  });

  const batchMutation = useMutation({
    mutationFn: (input: {
      imageIds?: string[];
      preset?: MirrorPresetId;
      retouchIntensity?: number;
      category?: string;
    }) => batchApplyMirror(input),
    onSuccess: (result) => {
      toast.success(`Batch queued for ${result.updated} image(s)`);
      queryClient.invalidateQueries({ queryKey: ["mirror-ai-snapshot"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Batch operation failed");
    },
  });

  const snapshot = snapshotQuery.data;

  return useMemo(
    () => ({
      snapshot,
      images: snapshot?.images ?? [],
      presets: snapshot?.presets ?? [],
      controls: snapshot?.controls,
      isLoading: snapshotQuery.isLoading,
      isRefreshing: snapshotQuery.isRefetching,
      refetch: snapshotQuery.refetch,
      isSocketConnected,
      lastEventAt,
      updateControls: controlsMutation.mutateAsync,
      batchApply: batchMutation.mutateAsync,
      controlsPending: controlsMutation.isPending,
      batchPending: batchMutation.isPending,
    }),
    [
      snapshot,
      snapshotQuery.isLoading,
      snapshotQuery.isRefetching,
      snapshotQuery.refetch,
      isSocketConnected,
      lastEventAt,
      controlsMutation.mutateAsync,
      controlsMutation.isPending,
      batchMutation.mutateAsync,
      batchMutation.isPending,
    ],
  );
};
