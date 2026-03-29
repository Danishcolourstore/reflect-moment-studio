import type { BatchOperation, ImageRecord, MirrorSnapshot, RuntimeSettings } from "./types";

const API_BASE = import.meta.env.VITE_MIRROR_API_URL ?? "http://localhost:4000";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
};

export const mirrorApi = {
  baseUrl: API_BASE,
  fetchSnapshot: (): Promise<MirrorSnapshot> => request("/api/snapshot"),
  updateSettings: (payload: Partial<RuntimeSettings>): Promise<RuntimeSettings> =>
    request("/api/settings", { method: "POST", body: JSON.stringify(payload) }),
  reprocessImage: (
    imageId: string,
    payload: { presetId?: string; retouchIntensity?: number },
  ): Promise<ImageRecord> =>
    request(`/api/images/${imageId}/reprocess`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  reprocessBatch: (payload: {
    imageIds: string[];
    presetId?: string;
    retouchIntensity?: number;
  }): Promise<BatchOperation> =>
    request("/api/batches/reprocess", { method: "POST", body: JSON.stringify(payload) }),
};
