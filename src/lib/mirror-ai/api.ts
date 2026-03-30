import type { MirrorControlState, MirrorImage, MirrorPreset } from "./types";

const baseApiUrl = (import.meta.env.VITE_MIRROR_API_URL as string | undefined) ?? "http://localhost:8787";

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // Keep fallback message when body is not JSON.
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export const mirrorApi = {
  getBaseUrl(): string {
    return baseApiUrl;
  },

  async getImages(limit = 100): Promise<MirrorImage[]> {
    const response = await fetch(`${baseApiUrl}/api/images?limit=${limit}`);
    const data = await parseJsonOrThrow<{ images: MirrorImage[] }>(response);
    return data.images;
  },

  async getControl(): Promise<MirrorControlState> {
    const response = await fetch(`${baseApiUrl}/api/control`);
    const data = await parseJsonOrThrow<{ control: MirrorControlState }>(response);
    return data.control;
  },

  async updateControl(payload: Partial<MirrorControlState>): Promise<MirrorControlState> {
    const response = await fetch(`${baseApiUrl}/api/control`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonOrThrow<{ control: MirrorControlState }>(response);
    return data.control;
  },

  async getPresets(): Promise<MirrorPreset[]> {
    const response = await fetch(`${baseApiUrl}/api/presets`);
    const data = await parseJsonOrThrow<{ presets: MirrorPreset[] }>(response);
    return data.presets;
  },

  async batchUpdateImages(payload: {
    ids: string[];
    presetId?: string;
    retouchIntensity?: number;
    shootCategory?: string;
    reprocess?: boolean;
  }): Promise<{ updated: MirrorImage[]; updatedCount: number }> {
    const response = await fetch(`${baseApiUrl}/api/images/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return parseJsonOrThrow<{ updated: MirrorImage[]; updatedCount: number }>(response);
  },
};
