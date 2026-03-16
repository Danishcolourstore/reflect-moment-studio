import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Plus, BookOpen, Trash2, Copy, ExternalLink, MoreHorizontal, Calendar, Layers,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import NewAlbumWizard from "@/components/album-designer/NewAlbumWizard";
import type { AlbumSize, CoverType } from "@/components/album-designer/types";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  print: "bg-primary/10 text-primary",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  review: "In Review",
  approved: "Approved",
  print: "Sent to Print",
};

interface AlbumRow {
  id: string;
  name: string;
  size: string;
  cover_type: string;
  leaf_count: number;
  page_count: number;
  status: string;
  event_id: string | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export default function AlbumDesigner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchAlbums = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("albums").select("*").eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) { toast.error("Failed to load albums"); console.error(error); }
    else { setAlbums((data || []) as AlbumRow[]); }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  // Bug 2 fix: cover page at spread_index 0, content pages start at spread_index 1
  const handleCreate = async (data: {
    name: string; size: AlbumSize; leafCount: number; coverType: CoverType;
  }) => {
    if (!user) return;
    setCreating(true);
    const pageCount = data.leafCount * 2;

    const { data: album, error } = await supabase
      .from("albums")
      .insert({
        user_id: user.id, name: data.name, size: data.size,
        cover_type: data.coverType, leaf_count: data.leafCount, page_count: pageCount,
      })
      .select().single();

    if (error || !album) {
      toast.error("Failed to create album");
      setCreating(false);
      return;
    }

    // Pre-fill pages — cover at spread_index 0, content starts at 1
    const pages = [];
    pages.push({ album_id: album.id, page_number: 0, spread_index: 0 }); // Cover
    for (let i = 1; i <= pageCount; i++) {
      pages.push({
        album_id: album.id,
        page_number: i,
        spread_index: Math.ceil(i / 2), // 1,1 → 2,2 → 3,3 etc. No overlap with cover
      });
    }

    const { error: pagesError } = await supabase.from("album_pages").insert(pages);
    if (pagesError) console.error("Failed to create pages:", pagesError);

    toast.success(`Album "${data.name}" created with ${data.leafCount} leaves`);
    setCreating(false);
    setWizardOpen(false);
    fetchAlbums();
  };

  const handleDuplicate = async (album: AlbumRow) => {
    if (!user) return;
    const { error } = await supabase.from("albums").insert({
      user_id: user.id, event_id: album.event_id, name: `${album.name} (Copy)`,
      size: album.size, cover_type: album.cover_type,
      leaf_count: album.leaf_count, page_count: album.page_count,
    });
    if (error) toast.error("Failed to duplicate");
    else { toast.success("Album duplicated"); fetchAlbums(); }
  };

  const handleDelete = async (album: AlbumRow) => {
    const { error } = await supabase.from("albums").delete().eq("id", album.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Album deleted"); fetchAlbums(); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight">Album Designer</h1>
            <p className="text-sm text-muted-foreground mt-1">Design professional wedding albums and photobooks</p>
          </div>
          <Button onClick={() => setWizardOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Album
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <BookOpen className="h-10 w-10 text-muted-foreground/30" />
            </div>
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
                  <TableRow key={album.id} className="group cursor-pointer" onClick={() => navigate(`/dashboard/album-designer/${album.id}/editor`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Layers className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium truncate max-w-[200px]">{album.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{album.size}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{album.leaf_count} Leaf / {album.page_count} Pages</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground capitalize">{album.cover_type}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(album.updated_at), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_COLORS[album.status] || ""}>{STATUS_LABELS[album.status] || album.status}</Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
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

        <NewAlbumWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreate={handleCreate} loading={creating} />
      </div>
    </DashboardLayout>
  );
}
