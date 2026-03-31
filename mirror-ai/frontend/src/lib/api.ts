const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8787";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export const api = {
  base: API_BASE,
  async getImages() {
    return parseJson<{ items: import("../types").ImageRecord[] }>(
      await fetch(`${API_BASE}/api/images`),
    );
  },
  async getPresets() {
    return parseJson<{ items: import("../types").Preset[] }>(
      await fetch(`${API_BASE}/api/presets`),
    );
  },
  async getSettings() {
    return parseJson<import("../types").Settings>(
      await fetch(`${API_BASE}/api/settings`),
    );
  },
  async patchSettings(payload: Partial<import("../types").Settings>) {
    return parseJson<import("../types").Settings>(
      await fetch(`${API_BASE}/api/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  },
  async reprocessImage(id: string, payload: Partial<import("../types").Settings>) {
    return parseJson<{ ok: boolean; image: import("../types").ImageRecord }>(
      await fetch(`${API_BASE}/api/images/${id}/reprocess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  },
  async applyBatch(payload: {
    imageIds: string[];
    preset: import("../types").PresetKey;
    retouchIntensity: number;
    category?: import("../types").ShootCategory;
  }) {
    return parseJson<{ ok: boolean; queued: number; items: import("../types").ImageRecord[] }>(
      await fetch(`${API_BASE}/api/images/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  },
};
