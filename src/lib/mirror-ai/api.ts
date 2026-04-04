import { mirrorAiApiBase } from "./config";
import type { MirrorControls, MirrorImage, MirrorPresetId, MirrorSnapshot } from "./types";

const jsonHeaders = { "Content-Type": "application/json" };

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let details = "Request failed";
    try {
      const body = await response.json();
      details = body?.message || body?.error || details;
    } catch {
      // no-op
    }
    throw new Error(details);
  }
  return (await response.json()) as T;
};

export const fetchMirrorSnapshot = async (): Promise<MirrorSnapshot> => {
  const response = await fetch(`${mirrorAiApiBase}/api/mirror-ai/snapshot`);
  return parseResponse<MirrorSnapshot>(response);
};

export const updateMirrorControls = async (input: {
  defaultPreset?: MirrorPresetId;
  defaultRetouchIntensity?: number;
  defaultCategory?: string;
}): Promise<MirrorControls> => {
  const response = await fetch(`${mirrorAiApiBase}/api/mirror-ai/controls`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
  return parseResponse<MirrorControls>(response);
};

export const batchApplyMirror = async (input: {
  imageIds?: string[];
  preset?: MirrorPresetId;
  retouchIntensity?: number;
  category?: string;
}): Promise<{ updated: number; imageIds: string[] }> => {
  const response = await fetch(`${mirrorAiApiBase}/api/mirror-ai/batch-apply`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
  return parseResponse<{ updated: number; imageIds: string[] }>(response);
};

export const resolveMirrorMediaUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${mirrorAiApiBase}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const sortMirrorImages = (images: MirrorImage[]): MirrorImage[] =>
  [...images].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
