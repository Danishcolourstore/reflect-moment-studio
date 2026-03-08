/**
 * Append a cache-busting query parameter to a URL.
 * Uses a global revision counter that increments each time
 * templates are invalidated via realtime sync.
 */
let _revision = Date.now();

export function bumpImageRevision() {
  _revision = Date.now();
}

export function cacheBust(url: string | null | undefined): string {
  if (!url) return '';
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}_v=${_revision}`;
}

export function cacheBustArray(urls: (string | null | undefined)[]): string[] {
  return urls.filter(Boolean).map((u) => cacheBust(u)!);
}
