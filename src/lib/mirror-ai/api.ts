import type {
  MirrorImage,
  MirrorImagesResponse,
  MirrorSettings,
  MirrorSettingsResponse,
} from "./types";

const baseUrl = import.meta.env.VITE_MIRROR_API_URL ?? "http://localhost:8787";

const request = async <T>(input: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${baseUrl}${input}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const mirrorApi = {
  async getImages() {
    return request<MirrorImagesResponse>("/api/images");
  },

  async getSettings() {
    return request<MirrorSettingsResponse>("/api/settings");
  },

  async updateSettings(payload: Partial<MirrorSettings>) {
    return request<{ settings: MirrorSettings }>("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async reprocessImage(imageId: string) {
    return request<{ ok: boolean; image: MirrorImage }>(`/api/images/${imageId}/reprocess`, {
      method: "POST",
    });
  },

  async reprocessBatch() {
    return request<{ ok: boolean; queued: number }>("/api/batch/reprocess", {
      method: "POST",
    });
  },
};

export const mirrorApiBaseUrl = baseUrl;
