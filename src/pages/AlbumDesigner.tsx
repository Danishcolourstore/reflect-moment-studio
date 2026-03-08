import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import {
  Plus, BookOpen, Trash2, Copy, ExternalLink,
  MoreHorizontal, Calendar, Layers,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import NewAlbumWizard from '@/components/album-designer/NewAlbumWizard';
import type { Album, AlbumSize, CoverType } from '@/components/album-designer/types';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  print: 'bg-primary/10 text-primary',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  review: 'Sent for Review',
  approved: 'Approved',
  print: 'Sent to Print',
};

export default function AlbumDesigner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchAlbums = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase.from('albums' as any).select('*') as any)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (error) { toast.error('Failed to load albums'); console.error(error); }
    else setAlbums((data || []) as Album[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  const handleCreate = async (data: { name: string; size: AlbumSize; leafCount: number; coverType: CoverType }) => {
    if (!user) return;
    setCreating(true);
    const pageCount = data.leafCount * 2;

    // Create album
    const { data: album, error } = await (supabase.from('albums' as any).insert({
      user_id: user.id,
      name: data.name,
      size: data.size,
      cover_type: data.coverType,
      leaf_count: data.leafCount,
      page_count: pageCount,
    } as any).select().single() as any);

    if (error || !album) {
      toast.error('Failed to create album');
      setCreating(false);
      return;
    }

    // Pre-fill pages: cover (page 0) + all pages
    const pages = [];
    // Cover page
    pages.push({ album_id: album.id, page_number: 0, spread_index: 0 });
    // Content pages
    for (let i = 1; i <= pageCount; i++) {
      pages.push({
        album_id: album.id,
        page_number: i,
        spread_index: Math.ceil(i / 2),
      });
    }

    const { error: pagesError } = await (supabase.from('album_pages' as any).insert(pages as any) as any);
    if (pagesError) console.error('Failed to create pages:', pagesError);

    toast.success(`Album "${data.name}" created with ${data.leafCount} leaves`);
    setCreating(false);
    setWizardOpen(false);
    fetchAlbums();
  };

  const handleDuplicate = async (album: Album) => {
    if (!user) return;
    const { error } = await (supabase.from('albums' as any).insert({
      user_id: user.id,
      event_id: album.event_id,
      name: `${album.name} (Copy)`,
      size: album.size,
      cover_type: album.cover_type,
      leaf_count: album.leaf_count,
      page_count: album.page_count,
    } as any) as any);
    if (error) toast.error('Failed to duplicate');
    else { toast.success('Album duplicated'); fetchAlbums(); }
  };

  const handleDelete = async (album: Album) => {
    const { error } = await (supabase.from('albums' as any).delete().eq('id', album.id) as any);
    if (error) toast.error('Failed to delete');
    else { toast.success('Album deleted'); fetchAlbums(); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight">Album Designer</h1>
            <p className="text-sm text-muted-foreground mt-1">Design professional wedding albums and photobooks</p>
          </div>
          <Button onClick={() => setWizardOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Album
          </Button>
        </div>

        {/* Albums Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">Loading albums…</div>
        ) : albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No albums yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Create your first professional album to start designing spreads from your gallery photos.
            </p>
            <Button onClick={() => setWizardOpen(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Create First Album
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Album</TableHead>
                  <TableHead className="hidden sm:table-cell">Size</TableHead>
                  <TableHead className="hidden md:table-cell">Pages</TableHead>
                  <TableHead className="hidden md:table-cell">Cover</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Edited</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {albums.map((album) => (
                  <TableRow key={album.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Layers className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium truncate max-w-[200px]">{album.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{album.size}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {album.leaf_count} Leaf / {album.page_count} Pages
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground capitalize">{album.cover_type}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(album.updated_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_COLORS[album.status] || ''}>
                        {STATUS_LABELS[album.status] || album.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/album-designer/${album.id}/editor`)}>
                            <ExternalLink className="h-4 w-4 mr-2" /> Open Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(album)}>
                            <Copy className="h-4 w-4 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(album)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <NewAlbumWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          onCreate={handleCreate}
          loading={creating}
        />
      </div>
    </DashboardLayout>
  );
}
