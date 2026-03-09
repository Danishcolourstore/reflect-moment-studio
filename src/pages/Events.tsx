import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CreateEventModal } from '@/components/CreateEventModal';
import { ShareModal } from '@/components/ShareModal';
import { EventDuplicateModal } from '@/components/EventDuplicateModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Camera, Search, Eye, Share2, Pencil, Trash2, Copy, Archive, ArchiveRestore } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Event {
  id: string; name: string; slug: string; event_date: string; location: string | null;
  is_published: boolean; cover_url: string | null; gallery_pin: string | null; photo_count: number;
  is_archived?: boolean;
}

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [shareEvent, setShareEvent] = useState<Event | null>(null);
  const [duplicateEvent, setDuplicateEvent] = useState<Event | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveTab, setArchiveTab] = useState<'active' | 'archived'>('active');

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase.from('events').select('id, name, slug, event_date, location, is_published, cover_url, gallery_pin, is_archived, photos(count)') as any)
      .eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setEvents((data as any[]).map((e: any) => ({ ...e, photo_count: e.photos?.[0]?.count ?? 0, is_archived: e.is_archived ?? false })));
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

  const archiveEvent = async (evt: Event) => {
    await supabase.from('events').update({ is_archived: true } as any).eq('id', evt.id);
    toast.success('Event archived');
    fetchEvents();
  };

  const restoreEvent = async (evt: Event) => {
    await supabase.from('events').update({ is_archived: false } as any).eq('id', evt.id);
    toast.success('Event restored');
    fetchEvents();
  };

  const isArchived = archiveTab === 'archived';
  let filtered = events.filter(e => {
    if (isArchived ? !e.is_archived : e.is_archived) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === 'published' && !e.is_published) return false;
    if (statusFilter === 'draft' && e.is_published) return false;
    return true;
  });

  if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  else if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

  const renderEventCard = (evt: Event) => (
    <div key={evt.id} className="group relative">
      <div className="relative aspect-[3/2] overflow-hidden rounded-[14px] cursor-pointer" onClick={() => navigate(`/dashboard/events/${evt.id}`)}>
        {evt.cover_url ? (
          <img src={evt.cover_url} alt={evt.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary rounded-[14px]"><Camera className="h-8 w-8 text-muted-foreground/10" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(44,33,24,0.6)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/events/${evt.id}`); }} className="h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); window.open(`/event/${evt.slug}`, '_blank'); }} className="h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"><Eye className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setShareEvent(evt); }} className="h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"><Share2 className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDuplicateEvent(evt); }} className="h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"><Copy className="h-4 w-4" /></button>
          {!isArchived && (
            <button onClick={(e) => { e.stopPropagation(); archiveEvent(evt); }} className="h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"><Archive className="h-4 w-4" /></button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(evt.id); }} className="h-9 w-9 rounded-full bg-destructive/80 backdrop-blur-sm flex items-center justify-center text-destructive-foreground"><Trash2 className="h-4 w-4" /></button>
        </div>
        <Badge className="absolute bottom-3 left-3 bg-card/80 text-foreground text-[9px] backdrop-blur-sm border-0 tracking-wider uppercase">{evt.photo_count} photos</Badge>
      </div>
      <div className="pt-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg text-foreground truncate" style={{ fontWeight: 400 }}>{evt.name}</h3>
            <p className="text-[10px] text-muted-foreground/40 mt-1 tracking-wide uppercase">{format(new Date(evt.event_date), 'MMM d, yyyy')}{evt.location ? ` · ${evt.location}` : ''}</p>
          </div>
          {!isArchived ? (
            <div className="flex items-center gap-2 ml-3 shrink-0 mt-1">
              <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">{evt.is_published ? 'Live' : 'Draft'}</span>
              <Switch checked={evt.is_published} onCheckedChange={() => togglePublish(evt)} className="scale-75" />
            </div>
          ) : (
            <div className="flex gap-1 ml-2 shrink-0">
              <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => restoreEvent(evt)}><ArchiveRestore className="h-3 w-3 mr-1" />Restore</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {/* Header - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-10">
        <h1 className="font-serif text-2xl sm:text-3xl text-foreground" style={{ fontWeight: 300 }}>Events</h1>
        <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto min-h-[44px]">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New Event
        </Button>
      </div>

      <Tabs value={archiveTab} onValueChange={(v) => setArchiveTab(v as any)} className="mb-4 sm:mb-6">
        <TabsList className="bg-transparent border-b border-border/30 rounded-none w-full justify-start h-auto p-0 gap-0">
          <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 py-2.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40 data-[state=active]:text-foreground min-h-[44px]">Active</TabsTrigger>
          <TabsTrigger value="archived" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 py-2.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40 data-[state=active]:text-foreground min-h-[44px]">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters - responsive stack */}
      <div className="flex flex-col gap-3 mb-6 sm:mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..." className="pl-9 bg-card/50 h-11 sm:h-9 text-[13px] border-border/20" />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 sm:w-[140px] sm:flex-none h-11 sm:h-9 text-[11px] bg-card/50 border-border/20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 sm:w-[150px] sm:flex-none h-11 sm:h-9 text-[11px] bg-card/50 border-border/20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-60 sm:h-72 rounded-[14px]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 sm:py-28 text-center">
          {isArchived ? <Archive className="mx-auto h-10 w-10 text-muted-foreground/10" /> : <Camera className="mx-auto h-10 w-10 text-muted-foreground/10" />}
          <p className="mt-5 font-serif text-lg text-muted-foreground/40">{isArchived ? 'No archived events' : 'No events yet'}</p>
          <p className="mt-2 text-[10px] text-muted-foreground/30 tracking-wide px-4">{isArchived ? 'Archived events will appear here.' : 'Create your first event to start delivering photos.'}</p>
          {!isArchived && <Button onClick={() => setCreateOpen(true)} className="mt-6 min-h-[44px]">Create New Event</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {filtered.map(renderEventCard)}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-serif text-xl" style={{ fontWeight: 400 }}>Delete Event?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground/60 tracking-wide">This will permanently delete the event and all its photos. This action cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => navigate(`/dashboard/events/${id}`)} />
      {shareEvent && <ShareModal open={!!shareEvent} onOpenChange={() => setShareEvent(null)} eventSlug={shareEvent.slug} eventName={shareEvent.name} pin={shareEvent.gallery_pin} />}
      {duplicateEvent && <EventDuplicateModal open={!!duplicateEvent} onOpenChange={() => setDuplicateEvent(null)} event={duplicateEvent} />}
    </DashboardLayout>
  );
};

export default Events;
