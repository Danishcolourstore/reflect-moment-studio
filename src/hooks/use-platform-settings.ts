import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const PLATFORM_SETTINGS_KEY = ['platform-settings'];

export interface PlatformSettings {
  [key: string]: string;
}

/**
 * Public-safe keys that any visitor may read via the security-definer RPC.
 * Sensitive keys (admin_pin_hash, admin_reset_token) are never included.
 */
const PUBLIC_KEYS = [
  'gallery-admin-settings',
  'home-feature-cards',
  'platform-features',
  'landing-cards',
  'maintenance-mode',
  'announcement-banner',
];

async function fetchSettings(): Promise<PlatformSettings> {
  // Try the privileged path first (admins/super-admins succeed and get everything)
  const { data, error } = await supabase.from('platform_settings').select('key, value');
  if (!error && data && data.length > 0) {
    const map: PlatformSettings = {};
    data.forEach((s: any) => { map[s.key] = s.value; });
    return map;
  }

  // Fall back to public RPC for each known safe key
  const map: PlatformSettings = {};
  await Promise.all(
    PUBLIC_KEYS.map(async (key) => {
      const { data: v } = await (supabase.rpc as any)('get_public_platform_setting', { _key: key });
      if (typeof v === 'string') map[key] = v;
    })
  );
  return map;
}

export function usePlatformSettings() {
  return useQuery({
    queryKey: PLATFORM_SETTINGS_KEY,
    queryFn: fetchSettings,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useSettingFlag(key: string, defaultValue = true): boolean {
  const { data } = usePlatformSettings();
  if (!data || !(key in data)) return defaultValue;
  return data[key] === 'true' || data[key] === '1';
}

export function useInvalidateSettings() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: PLATFORM_SETTINGS_KEY });
}
