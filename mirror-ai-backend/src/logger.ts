export type LogPayload = Record<string, unknown>;

function toLine(level: "INFO" | "WARN" | "ERROR", message: string, payload?: LogPayload) {
  const base = {
    ts: new Date().toISOString(),
    level,
    message,
  };
  return JSON.stringify(payload ? { ...base, ...payload } : base);
}

export function logInfo(message: string, payload?: LogPayload) {
  console.log(toLine("INFO", message, payload));
}

export function logWarn(message: string, payload?: LogPayload) {
  console.warn(toLine("WARN", message, payload));
}

export function logError(message: string, payload?: LogPayload) {
  console.error(toLine("ERROR", message, payload));
}

export const logger = {
  info: logInfo,
  warn: logWarn,
  error: logError,
};
