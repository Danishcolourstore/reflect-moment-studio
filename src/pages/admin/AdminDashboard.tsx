import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, Camera, Users, HardDrive } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    photographers: 0,
    events: 0,
    photos: 0,
    storageMB: '0 MB',
  });

  useEffect(() => {
    Promise.all([
      (supabase.from('profiles').select('id', { count: 'exact', head: true }) as any),
      (supabase.from('events').select('id', { count: 'exact', head: true }) as any),
      (supabase.from('photos').select('id', { count: 'exact', head: true }) as any),
    ]).then(([p, e, ph]) => {
      const photoCount = (ph as any).count ?? 0;
      const estimated = photoCount * 2;
      const storageLabel = estimated >= 1024
        ? `${(estimated / 1024).toFixed(1)} GB`
        : `${estimated} MB`;

      setStats({
        photographers: (p as any).count ?? 0,
        events: (e as any).count ?? 0,
        photos: photoCount,
        storageMB: storageLabel,
      });
    });
  }, []);

  const cards = [
    { label: 'Photographers', value: stats.photographers, icon: <Users className="h-4 w-4" /> },
    { label: 'Events', value: stats.events, icon: <CalendarDays className="h-4 w-4" /> },
    { label: 'Photos', value: stats.photos, icon: <Camera className="h-4 w-4" /> },
    { label: 'Storage', value: stats.storageMB, icon: <HardDrive className="h-4 w-4" /> },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display italic text-[24px] font-medium text-foreground tracking-tight">Platform Overview</h1>
        <div className="w-10 h-[1.5px] bg-primary mt-2" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 border border-border divide-x divide-y lg:divide-y-0 divide-border overflow-hidden">
        {cards.map((c) => (
          <div key={c.label} className="bg-card px-5 py-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60 font-medium">{c.label}</p>
              <span className="text-muted-foreground/15">{c.icon}</span>
            </div>
            <p className="font-serif text-[28px] font-semibold text-foreground leading-none tracking-tight">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
