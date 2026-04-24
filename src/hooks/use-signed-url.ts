import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StorageRef {
  bucket: string;
  path: string;
  /** Optional event id for guest-scoped authorization on gallery-photos */
  eventId?: string;
}

const SIGNED_URLS_ENABLED = import.meta.env.VITE_SIGNED_URLS_ENABLED === 'true';
const STALE_TIME = 55 * 60 * 1000; // 55 minutes (signed URL is 60min)

/**
 * Read the gallery access token for a given event id from localStorage.
 * Set by the gallery password/PIN gate after successful verification.
 */
function getGalleryToken(eventId?: string): string | undefined {
  if (!eventId || typeof window === 'undefined') return undefined;
  try {
    return window.localStorage.getItem(`gallery_token:${eventId}`) || undefined;
  } catch {
    return undefined;
  }
}

async function fetchSignedUrl(ref: StorageRef): Promise<string> {
  const token = getGalleryToken(ref.eventId);
  const { data, error } = await supabase.functions.invoke('get-signed-url', {
    body: {
      bucket: ref.bucket,
      path: ref.path,
      eventId: ref.eventId,
      token,
    },
  });
  if (error) throw error;
  if (!data?.signedUrl) throw new Error('No signed URL returned');
  return data.signedUrl as string;
}

/**
 * Resolve a storage reference to a usable URL.
 *
 * - If feature flag VITE_SIGNED_URLS_ENABLED is OFF → falls back to public URL.
 * - If ON → fetches signed URL via edge function, cached 55 min via TanStack Query.
 * - Pass a plain string URL to bypass entirely.
 */
export function useStorageUrl(input: string | StorageRef | null | undefined) {
  const isStringUrl = typeof input === 'string';
  const ref = !isStringUrl && input ? (input as StorageRef) : null;

  const enabled = !!ref && SIGNED_URLS_ENABLED;

  const query = useQuery({
    queryKey: ['signed-url', ref?.bucket, ref?.path, ref?.eventId],
    queryFn: () => fetchSignedUrl(ref!),
    enabled,
    staleTime: STALE_TIME,
    gcTime: STALE_TIME + 5 * 60 * 1000,
    retry: 1,
  });

  // Fast path: plain string
  if (isStringUrl) return { url: input as string, isLoading: false, error: null };

  // Feature flag off: fall back to public URL
  if (ref && !SIGNED_URLS_ENABLED) {
    const publicUrl = supabase.storage.from(ref.bucket).getPublicUrl(ref.path).data.publicUrl;
    return { url: publicUrl, isLoading: false, error: null };
  }

  return {
    url: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export const SIGNED_URLS_ENABLED_FLAG = SIGNED_URLS_ENABLED;
