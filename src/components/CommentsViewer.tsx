import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MessageCircle, Trash2, Search, CornerDownRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  guest_name: string | null;
  comment: string;
  photo_id: string;
  created_at: string;
  photo_url?: string;
  photo_filename?: string;
  guest_session_id?: string | null;
}

export function CommentsViewer({ eventId }: { eventId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase
      .from('photo_comments')
      .select('*, photos(url, file_name)') as any)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    if (data) {
      setComments((data as any[]).map((c: any) => ({
        id: c.id,
        guest_name: c.guest_name,
        comment: c.comment,
        photo_id: c.photo_id,
        created_at: c.created_at,
        guest_session_id: c.guest_session_id,
        photo_url: c.photos?.url,
        photo_filename: c.photos?.file_name,
      })));
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('photo_comments').delete().eq('id', deleteId);
    toast.success('Comment deleted');
    setDeleteId(null);
    fetchComments();
  };

  const filtered = comments.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.guest_name?.toLowerCase().includes(q)) || c.comment.toLowerCase().includes(q);
  });

  if (loading) return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  if (comments.length === 0) {
    return (
      <div className="py-24 text-center">
        <h2 className="font-serif text-[28px] font-light text-foreground leading-tight">No comments.</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Badge variant="secondary" className="text-[10px]">{comments.length} comments</Badge>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search comments..." className="pl-8 h-8 text-[12px] bg-card" />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="bg-card border border-border rounded-lg p-3 flex gap-3">
            {c.photo_url && (
              <img src={c.photo_url} alt="" className="h-16 w-16 object-cover rounded-lg shrink-0" loading="lazy" decoding="async" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm font-medium text-foreground">{c.guest_name || 'Guest'}</p>
              <p className="text-sm text-foreground mt-0.5">{c.comment}</p>
              <div className="flex items-center gap-2 mt-1">
                {c.photo_filename && <p className="text-[10px] text-muted-foreground/50">{c.photo_filename}</p>}
                <p className="text-[10px] text-muted-foreground/50">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
              </div>
            </div>
            <div className="flex items-start gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  if (c.guest_session_id) {
                    navigator.clipboard.writeText(c.guest_session_id);
                    toast.success('Guest ID copied');
                  }
                }}>
                <CornerDownRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive"
                onClick={() => setDeleteId(c.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="font-serif">Delete Comment?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
