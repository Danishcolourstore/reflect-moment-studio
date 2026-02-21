import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckSquare, Mail, User, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface SelectionRow {
  id: string;
  guest_name: string;
  guest_email: string;
  created_at: string;
  photos: { id: string; url: string }[];
}

interface GuestSelectionsViewerProps {
  eventId: string;
}

export function GuestSelectionsViewer({ eventId }: GuestSelectionsViewerProps) {
  const [selections, setSelections] = useState<SelectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    // Get all guest selections for this event
    const { data: selData } = await (supabase
      .from('guest_selections' as any)
      .select('*') as any)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (!selData || (selData as any[]).length === 0) {
      setSelections([]);
      setLoading(false);
      return;
    }

    const rows: SelectionRow[] = [];
    for (const sel of selData as any[]) {
      // Get photo IDs for this selection
      const { data: photoLinks } = await (supabase
        .from('guest_selection_photos' as any)
        .select('photo_id') as any)
        .eq('selection_id', sel.id);

      const photoIds = (photoLinks as any[] || []).map((r: any) => r.photo_id);

      // Get photo URLs
      let photos: { id: string; url: string }[] = [];
      if (photoIds.length > 0) {
        const { data: photoData } = await (supabase
          .from('photos')
          .select('id, url') as any)
          .in('id', photoIds);
        if (photoData) photos = photoData as any[];
      }

      rows.push({
        id: sel.id,
        guest_name: sel.guest_name,
        guest_email: sel.guest_email,
        created_at: sel.created_at,
        photos,
      });
    }

    setSelections(rows);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-[11px] text-muted-foreground/50 uppercase tracking-widest">Loading selections…</p>
      </div>
    );
  }

  if (selections.length === 0) {
    return (
      <div className="py-8 text-center">
        <CheckSquare className="mx-auto h-6 w-6 text-muted-foreground/15 mb-2" />
        <p className="text-[12px] text-muted-foreground/50">No guest selections yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium mb-3">
        Guest Selections ({selections.length})
      </h3>
      {selections.map(sel => {
        const isExpanded = expanded === sel.id;
        return (
          <div key={sel.id} className="border border-border bg-card/50">
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : sel.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-[12px] font-medium text-foreground truncate">{sel.guest_name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-[11px] text-muted-foreground/60 truncate">{sel.guest_email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-muted-foreground/50">
                  {sel.photos.length} photos · {format(new Date(sel.created_at), 'MMM d')}
                </span>
                {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground/50" /> : <ChevronDown className="h-3 w-3 text-muted-foreground/50" />}
              </div>
            </button>
            {isExpanded && (
              <div className="px-3 pb-3 border-t border-border/50">
                <div className="flex flex-wrap gap-1 mt-2">
                  {sel.photos.map(p => (
                    <img key={p.id} src={p.url} alt="" className="h-16 w-16 object-cover rounded-sm" loading="lazy" />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
