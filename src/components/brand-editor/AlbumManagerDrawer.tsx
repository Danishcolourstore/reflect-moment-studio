import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Plus, Trash2, Upload, Loader2, X, Image as ImageIcon, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PortfolioAlbum } from '@/components/website/WebsiteAlbums';

interface AlbumManagerDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

const CATEGORIES = ['Weddings', 'Pre-Wedding', 'Engagement', 'Fashion', 'Portraits', 'Events', 'Other'];

export function AlbumManagerDrawer({ open, onClose, userId }: AlbumManagerDrawerProps) {
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAlbum, setEditingAlbum] = useState<PortfolioAlbum | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAlbums = async () => {
    const { data } = await (supabase.from('portfolio_albums').select('*') as any)
      .eq('user_id', userId).order('sort_order', { ascending: true });
    setAlbums((data || []) as unknown as PortfolioAlbum[]);
    setLoading(false);
  };

  useEffect(() => { if (open && userId) loadAlbums(); }, [open, userId]);

  const createAlbum = async () => {
    const { data, error } = await (supabase.from('portfolio_albums').insert({
      user_id: userId, title: 'New Album', category: 'Weddings', photo_urls: [],
    } as any).select() as any);
    if (error) { toast.error(error.message); return; }
    const newAlbum = (data as any)?.[0] as PortfolioAlbum;
    setAlbums(prev => [...prev, newAlbum]);
    setEditingAlbum(newAlbum);
  };

  const updateAlbum = async (album: PortfolioAlbum) => {
    await (supabase.from('portfolio_albums').update({
      title: album.title, description: album.description,
      category: album.category, cover_url: album.cover_url,
      photo_urls: album.photo_urls,
    } as any) as any).eq('id', album.id);
    setAlbums(prev => prev.map(a => a.id === album.id ? album : a));
  };

  const deleteAlbum = async (id: string) => {
    await (supabase.from('portfolio_albums').delete() as any).eq('id', id);
    setAlbums(prev => prev.filter(a => a.id !== id));
    if (editingAlbum?.id === id) setEditingAlbum(null);
    toast.success('Album deleted');
  };

  const uploadPhotos = async (files: FileList) => {
    if (!editingAlbum) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `portfolio/${userId}/${editingAlbum.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('gallery-photos').upload(path, file, { upsert: true });
      if (!error) {
        const url = supabase.storage.from('gallery-photos').getPublicUrl(path).data.publicUrl;
        newUrls.push(url);
      }
    }
    const updated = {
      ...editingAlbum,
      photo_urls: [...(editingAlbum.photo_urls || []), ...newUrls],
      cover_url: editingAlbum.cover_url || newUrls[0] || null,
    };
    setEditingAlbum(updated);
    await updateAlbum(updated);
    setUploading(false);
    toast.success(`${newUrls.length} photo(s) added`);
  };

  const removePhoto = async (url: string) => {
    if (!editingAlbum) return;
    const updated = {
      ...editingAlbum,
      photo_urls: (editingAlbum.photo_urls || []).filter(u => u !== url),
      cover_url: editingAlbum.cover_url === url ? null : editingAlbum.cover_url,
    };
    setEditingAlbum(updated);
    await updateAlbum(updated);
  };

  const setCover = async (url: string) => {
    if (!editingAlbum) return;
    const updated = { ...editingAlbum, cover_url: url };
    setEditingAlbum(updated);
    await updateAlbum(updated);
    toast.success('Cover updated');
  };

  // ── Album list view ──
  if (!editingAlbum) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="max-h-[88dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base">Portfolio Albums</DrawerTitle>
            <DrawerDescription>Create and manage album categories</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-3 overflow-y-auto">
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { if (e.target.files) uploadPhotos(e.target.files); e.target.value = ''; }} />

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : albums.length === 0 ? (
              <p className="text-sm text-muted-foreground/50 text-center py-8">No albums yet. Create one to organize your portfolio.</p>
            ) : (
              albums.map(album => (
                <div key={album.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                  <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-muted/30 flex items-center justify-center">
                    {album.cover_url ? (
                      <img src={album.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                    )}
                  </div>
                  <button className="flex-1 text-left min-w-0" onClick={() => setEditingAlbum(album)}>
                    <p className="text-sm font-medium truncate text-foreground">{album.title}</p>
                    <p className="text-[10px] text-muted-foreground/50">{album.category} · {album.photo_urls?.length || 0} photos</p>
                  </button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => deleteAlbum(album.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))
            )}

            <Button variant="outline" onClick={createAlbum} className="w-full h-12 border-dashed text-[12px]">
              <Plus className="mr-1.5 h-4 w-4" /> Create Album
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // ── Album edit view ──
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[88dvh]">
        <DrawerHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-[11px]" onClick={() => { updateAlbum(editingAlbum); setEditingAlbum(null); }}>
              ← Back
            </Button>
            <DrawerTitle className="text-base truncate">{editingAlbum.title}</DrawerTitle>
          </div>
          <DrawerDescription>Edit album details and manage photos</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-5 overflow-y-auto">
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { if (e.target.files) uploadPhotos(e.target.files); e.target.value = ''; }} />

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Album Title</label>
            <Input value={editingAlbum.title} onChange={e => setEditingAlbum({ ...editingAlbum, title: e.target.value })}
              onBlur={() => updateAlbum(editingAlbum)} className="h-11" />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { const u = { ...editingAlbum, category: cat }; setEditingAlbum(u); updateAlbum(u); }}
                  className={`px-3 py-1.5 rounded-full text-[11px] border transition-colors ${
                    editingAlbum.category === cat ? 'border-foreground/30 bg-foreground/10 text-foreground' : 'border-border text-muted-foreground'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Description</label>
            <Textarea value={editingAlbum.description || ''} onChange={e => setEditingAlbum({ ...editingAlbum, description: e.target.value })}
              onBlur={() => updateAlbum(editingAlbum)} placeholder="Brief album description..." className="min-h-[60px]" />
          </div>

          {/* Photos Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                Photos ({editingAlbum.photo_urls?.length || 0})
              </label>
              <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} Add Photos
              </Button>
            </div>

            {editingAlbum.photo_urls && editingAlbum.photo_urls.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {editingAlbum.photo_urls.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-muted/30">
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button onClick={() => setCover(url)} className="h-7 px-2 text-[9px] uppercase bg-white/20 text-white rounded hover:bg-white/30 transition-colors">
                        Cover
                      </button>
                      <button onClick={() => removePhoto(url)} className="h-7 w-7 flex items-center justify-center bg-red-500/80 text-white rounded hover:bg-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {editingAlbum.cover_url === url && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[8px] uppercase tracking-wider rounded">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full h-20 border-dashed text-[12px] flex flex-col gap-1">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                <span>Upload Photos</span>
              </Button>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
