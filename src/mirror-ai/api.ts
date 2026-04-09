import type { MirrorImage, MirrorSettings, PresetDefinition } from "./types";

const API_BASE = import.meta.env.VITE_MIRROR_API_BASE ?? "http://localhost:8787";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${input}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export const mirrorApi = {
  baseUrl: API_BASE,

  getImages() {
    return request<{ images: MirrorImage[] }>("/api/images");
  },

  getPresets() {
    return request<{ presets: PresetDefinition[] }>("/api/presets");
  },

  getSettings() {
    return request<{ settings: MirrorSettings }>("/api/settings");
  },

  updateSettings(patch: Partial<MirrorSettings>) {
    return request<{ settings: MirrorSettings }>("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  updateImage(imageId: string, patch: Record<string, unknown>) {
    return request<{ image: MirrorImage }>(`/api/images/${imageId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  batchApply(payload: {
    imageIds: string[];
    preset?: string;
    retouchIntensity?: number;
    category?: string;
  }) {
    return request<{ updatedCount: number; images: MirrorImage[] }>("/api/images/batch-apply", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

