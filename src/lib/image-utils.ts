/**
 * Responsive image URL generation using Supabase Storage Image Transformations.
 *
 * Supabase public URLs:
 *   /storage/v1/object/public/bucket/path
 * Transform URLs:
 *   /storage/v1/render/image/public/bucket/path?width=X&quality=Y
 *
 * If transforms aren't available (free tier), the render endpoint
 * gracefully falls back to the original image — no breakage.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

/** Image size presets */
export type ImageSize = 'thumbnail' | 'medium' | 'full';

interface SizeConfig {
  width: number;
  quality: number;
}

const SIZE_CONFIG: Record<Exclude<ImageSize, 'full'>, SizeConfig> = {
  thumbnail: { width: 400, quality: 60 },
  medium: { width: 1200, quality: 80 },
};

/**
 * Check if a URL is a Supabase storage public URL that can be transformed.
 */
function isSupabaseStorageUrl(url: string): boolean {
  if (!SUPABASE_URL) return false;
  return url.startsWith(SUPABASE_URL) && url.includes('/storage/v1/object/public/');
}

/**
 * Convert a Supabase public storage URL to a render/transform URL.
 * Non-Supabase URLs are returned as-is (external CDNs, etc.)
 */
export function getOptimizedUrl(originalUrl: string, size: ImageSize): string {
  if (size === 'full' || !isSupabaseStorageUrl(originalUrl)) {
    return originalUrl;
  }

  const config = SIZE_CONFIG[size];
  // Replace /object/public/ with /render/image/public/ and append params
  const transformUrl = originalUrl.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/',
  );
  const separator = transformUrl.includes('?') ? '&' : '?';
  return `${transformUrl}${separator}width=${config.width}&quality=${config.quality}&resize=contain`;
}

/**
 * Generate srcSet for responsive images.
 * Returns a srcSet string for use in <img srcSet="...">
 */
export function getImageSrcSet(originalUrl: string): string | undefined {
  if (!isSupabaseStorageUrl(originalUrl)) return undefined;

  const thumbUrl = getOptimizedUrl(originalUrl, 'thumbnail');
  const mediumUrl = getOptimizedUrl(originalUrl, 'medium');

  return `${thumbUrl} 400w, ${mediumUrl} 1200w, ${originalUrl} 4096w`;
}

/**
 * Get the sizes attribute for responsive images based on layout context.
 */
export function getImageSizes(layout: 'grid' | 'lightbox' | 'hero'): string {
  switch (layout) {
    case 'grid':
      // Grid photos: small on mobile, ~25-33% on desktop
      return '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';
    case 'hero':
      return '100vw';
    case 'lightbox':
      return '95vw';
    default:
      return '50vw';
  }
}
