const timestamp = () => new Date().toISOString();

const toMetaString = (meta) => {
  if (meta === undefined || meta === null) return "";
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [unserializable-meta]";
  }
};

export const createLogger = (scope = "mirror-ai") => {
  const write = (level, message, meta) => {
    const text = `[${timestamp()}] [${scope}] [${level.toUpperCase()}] ${message}${toMetaString(meta)}`;
    if (level === "error") {
      // eslint-disable-next-line no-console
      console.error(text);
      return;
    }
    if (level === "warn") {
      // eslint-disable-next-line no-console
      console.warn(text);
      return;
    }
    // eslint-disable-next-line no-console
    console.log(text);
  };

  return {
    info(message, meta) {
      write("info", message, meta);
    },
    warn(message, meta) {
      write("warn", message, meta);
    },
    error(message, meta) {
      write("error", message, meta);
    },
  };
};

