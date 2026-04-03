import type { DashboardResponse, ImageRecord, RuntimeSettings, WsEvent } from "@/types/mirror";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // ignore parse failures
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export const api = {
  baseUrl: API_BASE,
  async dashboard(): Promise<DashboardResponse> {
    const response = await fetch(`${API_BASE}/api/dashboard`);
    return parseJson<DashboardResponse>(response);
  },
  async listImages(): Promise<ImageRecord[]> {
    const response = await fetch(`${API_BASE}/api/images`);
    const payload = await parseJson<{ items: ImageRecord[] }>(response);
    return payload.items;
  },
  async listPresets() {
    const response = await fetch(`${API_BASE}/api/presets`);
    const payload = await parseJson<{ items: DashboardResponse["presets"] }>(response);
    return payload.items;
  },
  async getSettings(): Promise<RuntimeSettings> {
    const payload = await this.dashboard();
    return payload.settings;
  },
  async updateSettings(input: Partial<RuntimeSettings>): Promise<RuntimeSettings> {
    const response = await fetch(`${API_BASE}/api/control`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const payload = await parseJson<{ settings: RuntimeSettings }>(response);
    return payload.settings;
  },
  async batchApply(input: {
    imageIds: string[];
    activePresetId?: string;
    retouchIntensity?: number;
    category?: RuntimeSettings["category"];
  }): Promise<{ queued: number; imageIds: string[] }> {
    const response = await fetch(`${API_BASE}/api/batch/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseJson<{ queued: number; imageIds: string[] }>(response);
  },
  async upload(files: File[] | FileList): Promise<{ uploaded: number; items: ImageRecord[] }> {
    const list = Array.from(files);
    const form = new FormData();
    list.forEach((file) => form.append("images", file));
    const response = await fetch(`${API_BASE}/api/images/upload`, {
      method: "POST",
      body: form,
    });
    return parseJson<{ uploaded: number; items: ImageRecord[] }>(response);
  },
};

export function createSocket(onEvent: (event: WsEvent) => void): WebSocket {
  const base = new URL(API_BASE);
  const protocol = base.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${base.host}/ws`);
  socket.addEventListener("message", (message) => {
    try {
      onEvent(JSON.parse(message.data) as WsEvent);
    } catch {
      // ignore malformed events
    }
  });
  return socket;
}
