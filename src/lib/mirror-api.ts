import type { ControlState, MirrorImage, MirrorPreset, MirrorStats } from "@/types/mirror-ai";

const API_BASE = (import.meta.env.VITE_MIRROR_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:8787";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mirror API ${response.status}: ${text}`);
  }
  return (await response.json()) as T;
}

export async function fetchMirrorImages(limit = 80): Promise<MirrorImage[]> {
  const payload = await request<{ images: MirrorImage[] }>(`/api/images?limit=${limit}`);
  return payload.images;
}

export async function fetchMirrorPresets(): Promise<MirrorPreset[]> {
  const payload = await request<{ presets: MirrorPreset[] }>("/api/presets");
  return payload.presets;
}

export async function fetchMirrorControls(): Promise<ControlState> {
  const payload = await request<{ controls: ControlState }>("/api/controls");
  return payload.controls;
}

export async function updateMirrorControls(patch: Partial<ControlState>): Promise<ControlState> {
  const payload = await request<{ controls: ControlState }>("/api/controls", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return payload.controls;
}

export async function updateImageControls(
  imageId: string,
  patch: Partial<ControlState>,
): Promise<MirrorImage> {
  const payload = await request<{ image: MirrorImage }>(`/api/images/${imageId}/control`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return payload.image;
}

export async function batchApplyControls(ids: string[], patch: Partial<ControlState>): Promise<MirrorImage[]> {
  const payload = await request<{ images: MirrorImage[] }>("/api/batch/apply", {
    method: "POST",
    body: JSON.stringify({
      ids,
      ...patch,
    }),
  });
  return payload.images;
}

export async function fetchMirrorStats(): Promise<MirrorStats> {
  const payload = await request<{ stats: MirrorStats }>("/api/stats");
  return payload.stats;
}

export function mirrorWsUrl(): string {
  const direct = (import.meta.env.VITE_MIRROR_WS_URL as string | undefined)?.trim();
  if (direct) return direct;
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/^http/i, "ws") + "/ws";
  }
  return API_BASE.replace(/^http/i, "ws") + "/ws";
}
