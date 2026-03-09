/**
 * Studio URL utilities
 * Handles studio username, slug generation, and public URLs.
 * Always returns the clean production domain for user-facing links.
 */

const PRODUCTION_DOMAIN = "https://www.mirroraigallery.com";

/**
 * Generate a URL-safe slug from a studio name
 * Example:
 * "Colour Store Studio" -> "colour-store-studio"
 */
export function generateStudioSlug(name: string): string {
  if (!name) return "";

  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove special characters
    .replace(/\s+/g, "-") // convert spaces to hyphens
    .replace(/-+/g, "-") // remove duplicate hyphens
    .replace(/^-|-$/g, ""); // remove starting/ending hyphen
}

/**
 * Resolve a safe username
 * Priority:
 * 1. Provided username
 * 2. Email prefix
 * 3. Default fallback
 */
export function resolveUsername(username?: string, email?: string): string {
  if (username && username.trim().length > 0) {
    return generateStudioSlug(username);
  }

  if (email && email.includes("@")) {
    const emailPrefix = email.split("@")[0];
    return generateStudioSlug(emailPrefix);
  }

  return "studio";
}

/**
 * Get full public studio URL
 * Example:
 * https://www.mirroraigallery.com/studio/colourstore
 */
export function getStudioUrl(username?: string, email?: string): string {
  const safeUsername = resolveUsername(username, email);
  return `${PRODUCTION_DOMAIN}/studio/${safeUsername}`;
}

/**
 * Get display-friendly URL (without https)
 * Example:
 * www.mirroraigallery.com/studio/colourstore
 */
export function getStudioDisplayUrl(username?: string, email?: string): string {
  const safeUsername = resolveUsername(username, email);
  return `www.mirroraigallery.com/studio/${safeUsername}`;
}
