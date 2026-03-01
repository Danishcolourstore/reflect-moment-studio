import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CreateEventModal } from '@/components/CreateEventModal';
import { ShareModal } from '@/components/ShareModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Camera, Search, Eye, Share2, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Event {
  id: string; name: string; slug: string; event_date: string; location: string | null;
  is_published: boolean; cover_url: string | null; gallery_pin: string | null; photo_count: number;
}

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [shareEvent, setShareEvent] = useState<Event | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase.from('events').select('id, name, slug, event_date, location, is_published, cover_url, gallery_pin, photos(count)') as any)
      .eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setEvents((data as any[]).map((e: any) => ({ ...e, photo_count: e.photos?.[0]?.count ?? 0 })));
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [user]);

  const togglePublish = async (evt: Event) => {
    await supabase.from('events').update({ is_published: !evt.is_published } as any).eq('id', evt.id);
    toast.success(evt.is_published ? 'Gallery unpublished' : 'Gallery published');
    fetchEvents();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('photos').delete().eq('event_id', deleteId);
    await supabase.from('events').delete().eq('id', deleteId);
    toast.success('Event deleted');
    setDeleteId(null);
    fetchEvents();
  };

  let filtered = events.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === 'published' && !e.is_published) return false;
    if (statusFilter === 'draft' && e.is_published) return false;
    return true;
  });

  if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  else if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Events</h1>
        <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-gold-hover text-primary-foreground text-[11px] h-9 uppercase tracking-wider">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New Event
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..." className="pl-9 bg-card h-9 text-[13px]" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-[12px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px] h-9 text-[12px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border/60 py-24 text-center rounded-xl">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground/15" />
          <p className="mt-4 font-serif text-lg text-muted-foreground/60">No events yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground/40">Create your first event to start delivering photos.</p>
          <Button onClick={() => setCreateOpen(true)} className="mt-5 bg-primary text-primary-foreground text-[11px] uppercase tracking-wider">Create New Event</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((evt) => (
            <div key={evt.id} className="bg-card border border-border rounded-xl overflow-hidden group relative">
              <div className="relative aspect-[3/2] bg-secondary overflow-hidden cursor-pointer" onClick={() => navigate(`/dashboard/events/${evt.id}`)}>
                {evt.cover_url ? (
                  <img src={evt.cover_url} alt={evt.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Camera className="h-8 w-8 text-muted-foreground/15" /></div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/events/${evt.id}`); }} className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); window.open(`/event/${evt.slug}`, '_blank'); }} className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center"><Eye className="h-4 w-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setShareEvent(evt); }} className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center"><Share2 className="h-4 w-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(evt.id); }} className="h-9 w-9 rounded-full bg-destructive/90 backdrop-blur-sm flex items-center justify-center text-destructive-foreground"><Trash2 className="h-4 w-4" /></button>
                </div>
                <Badge className="absolute bottom-2 left-2 bg-card/90 text-foreground text-[10px] backdrop-blur-sm border-0">{evt.photo_count} photos</Badge>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-base font-semibold text-foreground truncate">{evt.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(evt.event_date), 'MMM d, yyyy')}{evt.location ? ` · ${evt.location}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{evt.is_published ? 'Live' : 'Draft'}</span>
                    <Switch checked={evt.is_published} onCheckedChange={() => togglePublish(evt)} className="scale-75" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-serif">Delete Event?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the event and all its photos. This action cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => navigate(`/dashboard/events/${id}`)} />
      {shareEvent && <ShareModal open={!!shareEvent} onOpenChange={() => setShareEvent(null)} eventSlug={shareEvent.slug} eventName={shareEvent.name} pin={shareEvent.gallery_pin} />}
    </DashboardLayout>
  );
};

export default Events;
