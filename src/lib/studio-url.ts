/**
 * Studio URL utilities.
 * Always returns the clean production domain for user-facing links.
 */

const PRODUCTION_DOMAIN = 'https://reflect-moment-studio.lovable.app';

/** Generate a URL-safe slug from a studio name */
export function generateStudioSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '')
    .replace(/-+/g, '-');
}

/** Get the full public studio URL (always production domain) */
export function getStudioUrl(username: string): string {
  return `${PRODUCTION_DOMAIN}/studio/${username}`;
}

/** Get just the display-friendly domain + path (no protocol) */
export function getStudioDisplayUrl(username: string): string {
  return `reflect-moment-studio.lovable.app/studio/${username}`;
}
