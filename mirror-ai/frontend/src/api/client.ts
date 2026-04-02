import { env } from "../lib/env";
import type { ControlState, ImageItem, Preset } from "../types/domain";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.apiBase}/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getImages(): Promise<ImageItem[]> {
  const payload = await request<{ items: ImageItem[] }>("/images");
  return payload.items;
}

export async function getPresets(): Promise<Preset[]> {
  const payload = await request<{ items: Preset[] }>("/presets");
  return payload.items;
}

export async function getControl(): Promise<ControlState> {
  const payload = await request<{ control: ControlState }>("/control");
  return payload.control;
}

export async function patchControl(input: Partial<ControlState>): Promise<ControlState> {
  const payload = await request<{ control: ControlState }>("/control", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return payload.control;
}

export async function reprocessImage(imageId: string): Promise<void> {
  await request(`/control/reprocess/${imageId}`, {
    method: "POST",
  });
}

export async function batchApply(input: {
  imageIds: string[];
  presetId?: string;
  retouchIntensity?: number;
  category?: string;
}): Promise<void> {
  await request("/control/batch-apply", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
