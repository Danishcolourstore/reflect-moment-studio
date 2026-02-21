import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    photographers: 0,
    events: 0,
    photos: 0,
    guests: 0,
    favorites: 0,
  });

  useEffect(() => {
    Promise.all([
      (supabase.from('profiles').select('id', { count: 'exact', head: true }) as any),
      (supabase.from('events').select('id', { count: 'exact', head: true }) as any),
      (supabase.from('photos').select('id', { count: 'exact', head: true }) as any),
      (supabase.from('guest_sessions').select('id', { count: 'exact', head: true }) as any),
      (supabase.from('favorites').select('id', { count: 'exact', head: true }) as any),
    ]).then(([p, e, ph, g, f]) => {
      setStats({
        photographers: (p as any).count ?? 0,
        events: (e as any).count ?? 0,
        photos: (ph as any).count ?? 0,
        guests: (g as any).count ?? 0,
        favorites: (f as any).count ?? 0,
      });
    });
  }, []);

  const cards = [
    { label: 'Photographers', value: stats.photographers },
    { label: 'Events', value: stats.events },
    { label: 'Photos', value: stats.photos },
    { label: 'Guest Sessions', value: stats.guests },
    { label: 'Favorites', value: stats.favorites },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Platform Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="border border-border rounded-lg p-4 bg-card">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
