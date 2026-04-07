import type { BatchCategoryResponse, Category, Controls, MirrorImage, Preset } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.toString().replace(/\/$/, "") ?? "http://localhost:4000";
const API_ROOT = `${API_BASE_URL}/api`;

export const toAbsoluteAssetUrl = (input: string | null) => {
  if (!input) {
    return null;
  }
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input;
  }
  return `${API_BASE_URL}${input.startsWith("/") ? input : `/${input}`}`;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const errorBody = await response.json();
      message = JSON.stringify(errorBody);
    } catch {
      // Keep generic message when response body is not JSON.
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
};

const request = async <T>(path: string, options?: RequestInit) =>
  handleResponse<T>(
    await fetch(`${API_ROOT}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
      ...options,
    }),
  );

type ImagesPayload = { images: MirrorImage[] };
type ControlsPayload = { controls: Controls; categories: Category[] };
type PresetsPayload = { presets: Preset[] };
type BatchPayload = { queued: number };

export const api = {
  baseUrl: API_BASE_URL,
  getImages: (category = "all") =>
    request<ImagesPayload>(`/images?category=${encodeURIComponent(category)}`),
  getControls: () => request<ControlsPayload>("/controls"),
  updateControls: (payload: Partial<Controls>) =>
    request<{ controls: Controls }>("/controls", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getPresets: () => request<PresetsPayload>("/presets"),
  updatePreset: (presetId: string, payload: Partial<Preset>) =>
    request<{ preset: Preset }>(`/presets/${presetId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  batchApply: (payload: { imageIds: string[]; presetId?: string; retouchIntensity?: number }) =>
    request<BatchPayload>("/batch/apply", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  batchCategory: (payload: { imageIds: string[]; categoryId: string }) =>
    request<BatchCategoryResponse>("/batch/category", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
