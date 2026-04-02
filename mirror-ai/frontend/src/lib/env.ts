const fallbackApi = "http://localhost:4000";

export const env = {
  apiBase: import.meta.env.VITE_API_BASE_URL?.toString().trim() || fallbackApi,
};

export function wsUrlFromApi(apiBase: string): string {
  const url = new URL(apiBase);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = "";
  return url.toString();
}
