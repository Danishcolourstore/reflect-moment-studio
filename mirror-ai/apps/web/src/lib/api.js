const API_BASE = import.meta.env.VITE_MIRROR_API_BASE ?? "http://localhost:4100";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || payload.message || `Request failed (${response.status})`);
  }
  return response.json();
}

export const apiBase = API_BASE;

export async function getImages() {
  const data = await request("/api/images");
  return data.images || [];
}

export async function getPresets() {
  const data = await request("/api/presets");
  return data.presets || [];
}

export async function getControl() {
  const data = await request("/api/control");
  return data.control;
}

export async function patchControl(payload) {
  const data = await request("/api/control", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.control;
}

export async function reprocessImage(imageId, payload = {}) {
  const data = await request(`/api/images/${imageId}/reprocess`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.image;
}

export async function batchApply(payload) {
  return request("/api/batch/apply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
