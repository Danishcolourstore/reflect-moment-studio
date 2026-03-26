const readEnv = (key: string, fallback: string): string => {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
};

export const env = {
  apiBaseUrl: readEnv('VITE_API_BASE_URL', 'http://localhost:8080'),
  wsBaseUrl: readEnv('VITE_WS_BASE_URL', 'ws://localhost:8080/ws'),
};
