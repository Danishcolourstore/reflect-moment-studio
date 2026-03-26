import type { ControlDefaults, ImageRecord, PresetDefinition } from '../types/mirror';
import { env } from './env';

interface ApiEnvelope<T> {
  data: T;
  error?: string;
}

const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const api = {
  async getImages(): Promise<ImageRecord[]> {
    const result = await parseJson<ApiEnvelope<ImageRecord[]>>(
      await fetch(`${env.apiBaseUrl}/api/images`),
    );
    return result.data;
  },

  async getPresets(): Promise<PresetDefinition[]> {
    const result = await parseJson<ApiEnvelope<PresetDefinition[]>>(
      await fetch(`${env.apiBaseUrl}/api/presets`),
    );
    return result.data;
  },

  async getDefaults(): Promise<ControlDefaults> {
    const result = await parseJson<ApiEnvelope<ControlDefaults>>(
      await fetch(`${env.apiBaseUrl}/api/control/defaults`),
    );
    return result.data;
  },

  async updateDefaults(payload: Partial<ControlDefaults>): Promise<ControlDefaults> {
    const result = await parseJson<ApiEnvelope<ControlDefaults>>(
      await fetch(`${env.apiBaseUrl}/api/control/defaults`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    return result.data;
  },

  async updateImageControl(
    imageId: string,
    payload: Partial<ControlDefaults>,
  ): Promise<ImageRecord> {
    const result = await parseJson<ApiEnvelope<ImageRecord>>(
      await fetch(`${env.apiBaseUrl}/api/images/${imageId}/control`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    return result.data;
  },

  async batchApply(payload: {
    ids: string[];
    presetId?: string;
    retouchIntensity?: number;
  }): Promise<ImageRecord[]> {
    const result = await parseJson<ApiEnvelope<ImageRecord[]>>(
      await fetch(`${env.apiBaseUrl}/api/images/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    return result.data;
  },

  imageUrl(imageId: string, type: 'original' | 'preview' | 'processed' = 'preview'): string {
    const query = new URLSearchParams({ type }).toString();
    return `${env.apiBaseUrl}/api/images/${imageId}/file?${query}`;
  },
};
