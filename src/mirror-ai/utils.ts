export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatRelativeTime(value?: string): string {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function categoryLabel(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function resolvePrimaryImageUrl(image: { processedUrl: string | null; previewUrl: string | null; originalUrl: string }) {
  return image.processedUrl ?? image.previewUrl ?? image.originalUrl;
}

export function absoluteAssetUrl(url: string): string {
  if (!url.startsWith("/")) {
    return url;
  }
  const base = import.meta.env.VITE_MIRROR_API_BASE ?? "http://localhost:8787";
  return `${base}${url}`;
}
