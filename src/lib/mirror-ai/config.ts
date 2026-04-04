const defaultApiBase = "http://localhost:8787";

export const mirrorAiApiBase =
  (import.meta.env.VITE_MIRROR_AI_API_BASE as string | undefined)?.replace(/\/$/, "") ||
  defaultApiBase;

export const mirrorAiWsUrl =
  (import.meta.env.VITE_MIRROR_AI_WS_URL as string | undefined) ||
  mirrorAiApiBase.replace(/^http/i, "ws") + "/ws";
