import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { HardDrive, AlertTriangle } from 'lucide-react';

interface StorageUser {
  user_id: string;
  studio_name: string;
  storage_used_mb: number;
  storage_limit_mb: number | null;
  photo_count: number;
}

function formatMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

export default function AdminStorage() {
  const [users, setUsers] = useState<StorageUser[]>([]);
  const [totalMB, setTotalMB] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [profRes, photoRes] = await Promise.all([
      supabase.from('profiles').select('user_id, studio_name, storage_limit_mb') as any,
      supabase.from('photos').select('user_id, file_size') as any,
    ]);

    const profiles = (profRes.data || []) as any[];
    const photos = (photoRes.data || []) as any[];

    const storageMBMap: Record<string, number> = {};
    const photoCountMap: Record<string, number> = {};
    let total = 0;
    photos.forEach((p: any) => {
      const mb = (p.file_size ?? 0) / (1024 * 1024);
      storageMBMap[p.user_id] = (storageMBMap[p.user_id] || 0) + mb;
      photoCountMap[p.user_id] = (photoCountMap[p.user_id] || 0) + 1;
      total += mb;
    });

    setTotalMB(total);
    setTotalPhotos(photos.length);

    const sorted = profiles
      .map((p: any) => ({
        user_id: p.user_id,
        studio_name: p.studio_name,
        storage_used_mb: storageMBMap[p.user_id] || 0,
        storage_limit_mb: p.storage_limit_mb,
        photo_count: photoCountMap[p.user_id] || 0,
      }))
      .sort((a: StorageUser, b: StorageUser) => b.storage_used_mb - a.storage_used_mb);

    setUsers(sorted);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[26px] font-semibold text-foreground tracking-tight">Storage Management</h1>
        <p className="text-[11px] text-muted-foreground/50 mt-1">Monitor platform-wide storage usage</p>
      </div>

      {/* Platform total */}
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        <div className="bg-card border border-border px-5 py-4">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-1">Total Storage</p>
          <p className="font-serif text-[24px] font-semibold text-foreground leading-none">{formatMB(totalMB)}</p>
        </div>
        <div className="bg-card border border-border px-5 py-4">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-1">Total Photos</p>
          <p className="font-serif text-[24px] font-semibold text-foreground leading-none">{totalPhotos.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border px-5 py-4">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-1">Photographers</p>
          <p className="font-serif text-[24px] font-semibold text-foreground leading-none">{users.length}</p>
        </div>
      </div>

      {/* Per-user storage bars */}
      <div className="bg-card border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-primary/60" />
          <h2 className="text-[12px] font-medium text-foreground uppercase tracking-[0.08em]">Storage per Photographer</h2>
        </div>
        <div className="divide-y divide-border/50">
          {users.map(u => {
            const limit = u.storage_limit_mb && u.storage_limit_mb > 0 ? u.storage_limit_mb : null;
            const pct = limit ? Math.min(100, Math.round((u.storage_used_mb / limit) * 100)) : 0;
            const isWarning = pct >= 80;
            const isFull = pct >= 100;

            return (
              <div key={u.user_id} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-medium text-foreground">{u.studio_name}</p>
                    <p className="text-[10px] text-muted-foreground/50">{u.photo_count} photos</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    {isWarning && (
                      <AlertTriangle className={`h-3.5 w-3.5 ${isFull ? 'text-destructive' : 'text-amber-500'}`} />
                    )}
                    <span className={`text-[11px] font-medium ${isFull ? 'text-destructive' : isWarning ? 'text-amber-600' : 'text-foreground'}`}>
                      {formatMB(u.storage_used_mb)}
                      {limit ? ` / ${formatMB(limit)}` : ' / ∞'}
                    </span>
                  </div>
                </div>
                {limit && (
                  <Progress
                    value={pct}
                    className={`h-1.5 ${isFull ? '[&>div]:bg-destructive' : isWarning ? '[&>div]:bg-amber-500' : ''}`}
                  />
                )}
              </div>
            );
          })}
          {users.length === 0 && (
            <p className="py-8 text-center text-[11px] text-muted-foreground/40">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}
