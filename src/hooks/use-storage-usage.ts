import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export const PLAN_LIMITS = {
  free: 5 * 1024 * 1024 * 1024, // 5 GB
  pro: 100 * 1024 * 1024 * 1024, // 100 GB
};

export function useStorageUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['storage-usage', user?.id],
    queryFn: async () => {
      if (!user) return { used: 0, limit: PLAN_LIMITS.free, plan: 'free', photoCount: 0, eventCount: 0 };

      const { data: profile } = await (supabase.from('profiles').select('plan') as any)
        .eq('user_id', user.id).single();
      const plan = profile?.plan || 'free';
      const limit = plan === 'pro' ? PLAN_LIMITS.pro : PLAN_LIMITS.free;

      const { data: photos } = await (supabase.from('photos').select('file_size') as any)
        .eq('user_id', user.id);
      const used = (photos || []).reduce((s: number, p: any) => s + (p.file_size || 0), 0);
      const photoCount = (photos || []).length;

      const { count: eventCount } = await supabase.from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return { used, limit, plan, photoCount, eventCount: eventCount || 0 };
    },
    enabled: !!user,
    staleTime: 60000,
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
