import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function formatBytes(bytes: number) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

const PLATFORM_LIMIT_BYTES = 1000 * 1e9; // 1000 GB

export default function AdminStorage() {
  const [totalBytes, setTotalBytes] = useState(0);
  const [photographers, setPhotographers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: photos } = await (supabase.from('photos').select('user_id, file_size') as any);
      const { data: profiles } = await (supabase.from('profiles').select('user_id, studio_name, email, plan') as any);
      const { data: events } = await (supabase.from('events').select('user_id') as any);

      const sizeMap: Record<string, number> = {};
      const countMap: Record<string, number> = {};
      let total = 0;
      (photos || []).forEach((p: any) => {
        const size = p.file_size || 0;
        sizeMap[p.user_id] = (sizeMap[p.user_id] || 0) + size;
        countMap[p.user_id] = (countMap[p.user_id] || 0) + 1;
        total += size;
      });
      setTotalBytes(total);

      const evMap: Record<string, number> = {};
      (events || []).forEach((e: any) => { evMap[e.user_id] = (evMap[e.user_id] || 0) + 1; });

      const nameMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p; });

      const list = Object.entries(sizeMap)
        .map(([uid, bytes]) => ({
          user_id: uid,
          name: nameMap[uid]?.studio_name || 'Unknown',
          email: nameMap[uid]?.email || '',
          plan: nameMap[uid]?.plan || 'free',
          events: evMap[uid] || 0,
          photos: countMap[uid] || 0,
          bytes,
          pct: total > 0 ? ((bytes / total) * 100).toFixed(1) : '0',
        }))
        .sort((a, b) => b.bytes - a.bytes);
      setPhotographers(list);
    };
    load();
  }, []);

  const usedPct = (totalBytes / PLATFORM_LIMIT_BYTES) * 100;
  const top10 = photographers.slice(0, 10);
  const top20 = photographers.slice(0, 20);

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl font-semibold text-foreground">Storage Overview</h1>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Storage Used</span>
            <span className="font-serif text-2xl font-semibold">{formatBytes(totalBytes)} / 1000 GB</span>
          </div>
          <Progress value={usedPct} className="h-2" />
          <p className="text-[11px] text-muted-foreground">{usedPct.toFixed(2)}% used</p>
        </CardContent>
      </Card>

      {/* Bar chart */}
      {top10.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-serif text-base font-semibold mb-4">Top 10 by Storage</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatBytes(v)} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => formatBytes(v)} />
                  <Bar dataKey="bytes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Email</th>
                <th className="text-left px-4 py-2.5 font-medium">Plan</th>
                <th className="text-left px-4 py-2.5 font-medium">Events</th>
                <th className="text-left px-4 py-2.5 font-medium">Photos</th>
                <th className="text-left px-4 py-2.5 font-medium">Storage</th>
                <th className="text-left px-4 py-2.5 font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {top20.map((p) => (
                <tr key={p.user_id}>
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${p.plan === 'pro' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                      {p.plan}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{p.events}</td>
                  <td className="px-4 py-2.5">{p.photos}</td>
                  <td className="px-4 py-2.5">{formatBytes(p.bytes)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
