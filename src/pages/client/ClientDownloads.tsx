import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

const ClientDownloads = () => {
  const { user } = useAuth();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: client } = await (supabase.from('clients').select('id') as any).eq('user_id', user.id).single();
      if (!client) { setLoading(false); return; }

      const { data: dls } = await (supabase.from('client_downloads').select('id, photo_id, downloaded_at') as any)
        .eq('client_id', client.id).order('downloaded_at', { ascending: false });
      if (dls && dls.length > 0) {
        const photoIds = [...new Set(dls.map((d: any) => d.photo_id))];
        const { data: ph } = await (supabase.from('photos').select('id, url, file_name') as any).in('id', photoIds);
        const photoMap = new Map((ph || []).map((p: any) => [p.id, p]));
        setDownloads(dls.map((d: any) => ({ ...d, photo: photoMap.get(d.photo_id) })));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <ClientDashboardLayout>
      <h1 className="font-serif text-2xl font-semibold text-foreground mb-6">Download History</h1>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : downloads.length === 0 ? (
        <div className="border border-dashed border-border/60 py-24 text-center rounded-xl">
          <Download className="mx-auto h-12 w-12 text-muted-foreground/15" />
          <p className="mt-4 font-serif text-lg text-muted-foreground/60">No downloads yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground/40">Photos you download will appear here.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Photo</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium hidden sm:table-cell">File Name</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Downloaded</th>
              </tr>
            </thead>
            <tbody>
              {downloads.map((dl) => (
                <tr key={dl.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    {dl.photo ? (
                      <img src={dl.photo.url} alt="" className="h-10 w-14 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-14 rounded bg-secondary" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-foreground hidden sm:table-cell">{dl.photo?.file_name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(dl.downloaded_at), { addSuffix: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ClientDashboardLayout>
  );
};

export default ClientDownloads;
