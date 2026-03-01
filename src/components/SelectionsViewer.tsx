import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, Download, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface SelectionGroup {
  guest_name: string;
  guest_email: string;
  created_at: string;
  photos: { id: string; url: string; file_name: string | null }[];
  selection_id: string;
}

export function SelectionsViewer({ eventId }: { eventId: string }) {
  const [groups, setGroups] = useState<SelectionGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSelections = useCallback(async () => {
    setLoading(true);
    const { data: sels } = await (supabase.from('guest_selections' as any).select('*') as any)
      .eq('event_id', eventId).order('created_at', { ascending: false });
    if (!sels || (sels as any[]).length === 0) { setGroups([]); setLoading(false); return; }

    const result: SelectionGroup[] = [];
    for (const sel of sels as any[]) {
      const { data: links } = await (supabase.from('guest_selection_photos' as any).select('photo_id') as any)
        .eq('selection_id', sel.id);
      const photoIds = (links as any[] || []).map((l: any) => l.photo_id);
      let photos: any[] = [];
      if (photoIds.length > 0) {
        const { data: pd } = await (supabase.from('photos').select('id, url, file_name') as any).in('id', photoIds);
        if (pd) photos = pd as any[];
      }
      result.push({ guest_name: sel.guest_name, guest_email: sel.guest_email, created_at: sel.created_at, photos, selection_id: sel.id });
    }
    setGroups(result);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchSelections(); }, [fetchSelections]);

  const downloadSelection = async (g: SelectionGroup) => {
    if (g.photos.length === 0) return;
    const zip = new JSZip();
    const folder = zip.folder(`selection-${g.guest_name}`);
    for (let i = 0; i < g.photos.length; i++) {
      const p = g.photos[i];
      try {
        const res = await fetch(p.url);
        const blob = await res.blob();
        folder?.file(p.file_name || `photo-${i + 1}.jpg`, blob);
      } catch { /* skip */ }
    }
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `mirrorai-selection-${g.guest_name}.zip`);
    toast.success('Selection downloaded');
  };

  const exportCSV = (g: SelectionGroup) => {
    const rows = [['photo_id', 'filename', 'url', 'guest_name', 'guest_email', 'submitted_at']];
    g.photos.forEach(p => rows.push([p.id, p.file_name || '', p.url, g.guest_name, g.guest_email, g.created_at]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, `mirrorai-selection-${g.guest_name}.csv`);
    toast.success('CSV exported');
  };

  const exportAllCSV = () => {
    const rows = [['photo_id', 'filename', 'url', 'guest_name', 'guest_email', 'submitted_at']];
    groups.forEach(g => g.photos.forEach(p => rows.push([p.id, p.file_name || '', p.url, g.guest_name, g.guest_email, g.created_at])));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, `mirrorai-all-selections.csv`);
    toast.success('All selections exported');
  };

  const totalPhotos = groups.reduce((s, g) => s + g.photos.length, 0);
  const uniqueGuests = new Set(groups.map(g => g.guest_email)).size;

  if (loading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  if (groups.length === 0) {
    return (
      <div className="border border-dashed border-border/60 py-20 text-center rounded-xl">
        <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground/15" />
        <p className="mt-4 font-serif text-lg text-muted-foreground/60">No selections yet</p>
        <p className="mt-1 text-[11px] text-muted-foreground/40">Selection mode must be enabled for guests to submit selections. Enable it in Settings tab.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-[10px]">{groups.length} submissions</Badge>
          <Badge variant="secondary" className="text-[10px]">{totalPhotos} photos selected</Badge>
          <Badge variant="secondary" className="text-[10px]">{uniqueGuests} guests</Badge>
        </div>
        <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={exportAllCSV}>
          <Download className="mr-1 h-3 w-3" /> Download All CSV
        </Button>
      </div>

      <div className="space-y-3">
        {groups.map(g => {
          const reviewed = localStorage.getItem(`mirrorai_reviewed_${eventId}_${g.guest_email}`) === 'true';
          return (
            <div key={g.selection_id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-serif text-base text-foreground">{g.guest_name}</p>
                  <p className="text-xs text-muted-foreground">{g.guest_email}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">{format(new Date(g.created_at), 'MMM d, yyyy')} · {g.photos.length} photos</p>
                </div>
                <Button variant={reviewed ? 'secondary' : 'outline'} size="sm" className="text-[10px] h-7"
                  onClick={() => {
                    const key = `mirrorai_reviewed_${eventId}_${g.guest_email}`;
                    const next = !reviewed;
                    if (next) localStorage.setItem(key, 'true');
                    else localStorage.removeItem(key);
                    toast.success(next ? 'Marked as reviewed' : 'Unmarked');
                    // Force re-render
                    fetchSelections();
                  }}>
                  <CheckCircle className="mr-1 h-3 w-3" /> {reviewed ? 'Reviewed' : 'Mark Reviewed'}
                </Button>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-2">
                {g.photos.map(p => (
                  <img key={p.id} src={p.url} alt="" className="h-20 w-20 object-cover rounded-lg shrink-0" loading="lazy" />
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => downloadSelection(g)}>
                  <Download className="mr-1 h-3 w-3" /> Download ZIP
                </Button>
                <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => exportCSV(g)}>
                  <FileText className="mr-1 h-3 w-3" /> Export CSV
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
