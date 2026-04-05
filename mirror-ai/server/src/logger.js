const LEVELS = ["debug", "info", "warn", "error"];

function shouldLog(currentLevel, messageLevel) {
  const currentIdx = LEVELS.indexOf(currentLevel);
  const messageIdx = LEVELS.indexOf(messageLevel);
  if (currentIdx === -1 || messageIdx === -1) return true;
  return messageIdx >= currentIdx;
}

function serialize(data) {
  if (data === undefined || data === null) return "";
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data);
  } catch (_error) {
    return String(data);
  }
}

export function createLogger(level = "info") {
  function log(messageLevel, message, data) {
    if (!shouldLog(level, messageLevel)) return;
    const ts = new Date().toISOString();
    const extra = serialize(data);
    const out = `[${ts}] [${messageLevel.toUpperCase()}] ${message}${extra ? ` ${extra}` : ""}`;
    if (messageLevel === "error") console.error(out);
    else if (messageLevel === "warn") console.warn(out);
    else console.log(out);
  }

  return {
    debug: (message, data) => log("debug", message, data),
    info: (message, data) => log("info", message, data),
    warn: (message, data) => log("warn", message, data),
    error: (message, data) => log("error", message, data),
  };
}
