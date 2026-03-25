/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MIRROR_AI_API_BASE?: string;
  readonly VITE_MIRROR_AI_WS_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
