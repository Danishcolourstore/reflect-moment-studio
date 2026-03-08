import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const PLATFORM_SETTINGS_KEY = ['platform-settings'];

export interface PlatformSettings {
  [key: string]: string;
}

async function fetchSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase.from('platform_settings').select('key, value');
  if (error || !data) return {};
  const map: PlatformSettings = {};
  data.forEach((s: any) => { map[s.key] = s.value; });
  return map;
}

/**
 * Fetches platform settings from the database via React Query.
 * Automatically refreshed via realtime subscriptions.
 */
export function usePlatformSettings() {
  return useQuery({
    queryKey: PLATFORM_SETTINGS_KEY,
    queryFn: fetchSettings,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

/**
 * Helper to check a boolean setting with a default value.
 */
export function useSettingFlag(key: string, defaultValue = true): boolean {
  const { data } = usePlatformSettings();
  if (!data || !(key in data)) return defaultValue;
  return data[key] === 'true' || data[key] === '1';
}

/** Invalidate settings cache */
export function useInvalidateSettings() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: PLATFORM_SETTINGS_KEY });
}
