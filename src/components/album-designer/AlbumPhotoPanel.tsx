import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileArchive,
  Search,
  Image as ImageIcon,
  Link2,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getOptimizedUrl } from "@/lib/image-utils";
import JSZip from "jszip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Photo {
  id: string;
  url: string;
  file_name: string | null;
}

interface Props {
  albumId: string;
  eventId: string | null;
  onEventLinked: (eventId: string) => void;
  placedPhotoUrls: Set<string>;
  placedPhotoCounts: Map<string, number>;
  onDragStart: (photo: Photo) => void;
}

type Filter = "all" | "unused";

interface EventOption {
  id: string;
  name: string;
  photo_count: number;
  cover_url: string | null;
}

const IMAGE_RE = /\.(jpg|jpeg|png|webp)$/i;

export default function AlbumPhotoPanel({
  albumId,
  eventId,
  onEventLinked,
  placedPhotoUrls,
  placedPhotoCounts,
  onDragStart,
}: Props) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadDone, setUploadDone] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [events, setEvents] = useState<EventOption[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  /* ─── Load Photos ─── */

  const fetchPhotos = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    if (eventId) {
      const { data } = await supabase
        .from("photos")
        .select("id,url,file_name")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      setPhotos(data || []);
    } else {
      const folder = `${user.id}/${albumId}`;
      const { data } = await supabase.storage
        .from("gallery-photos")
        .list(folder, { limit: 500 });

      if (!data) {
        setPhotos([]);
      } else {
        const list = data
          .filter((f) => IMAGE_RE.test(f.name))
          .map((f) => {
            const {
              data: { publicUrl },
            } = supabase.storage
              .from("gallery-photos")
              .getPublicUrl(`${folder}/${f.name}`);
            return { id: f.name, url: publicUrl, file_name: f.name };
          });
        setPhotos(list);
      }
    }
    setLoading(false);
  }, [user, albumId, eventId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  /* ─── Upload ─── */

  const uploadFiles = async (files: File[]) => {
    if (!user) return;
    setUploading(true);
    setUploadTotal(files.length);
    setUploadDone(0);
    let done = 0;

    for (const file of files) {
      try {
        const path = eventId
          ? `${user.id}/${eventId}/${Date.now()}-${file.name}`
          : `${user.id}/${albumId}/${Date.now()}-${file.name}`;

        const { error } = await supabase.storage
          .from("gallery-photos")
          .upload(path, file);
        if (error) throw error;

        if (eventId) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("gallery-photos").getPublicUrl(path);

          await supabase.from("photos").insert({
            event_id: eventId,
            user_id: user.id,
            url: publicUrl,
            file_name: file.name,
          });
        }
      } catch (e) {
        console.error("Upload error", e);
      }
      done++;
      setUploadDone(done);
    }

    setUploading(false);
    toast.success(`${done} photos uploaded`);
    fetchPhotos();
  };

  /* ─── ZIP Upload ─── */

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const zip = await JSZip.loadAsync(file);
      const images = Object.values(zip.files).filter(
        (f) => !f.dir && IMAGE_RE.test(f.name)
      );
      const files: File[] = [];
      for (const entry of images) {
        const blob = await entry.async("blob");
        files.push(new File([blob], entry.name, { type: "image/jpeg" }));
      }
      uploadFiles(files);
    } catch (e) {
      console.error(e);
      toast.error("Failed to process ZIP");
    }
  };

  /* ─── Link Event ─── */

  const loadEvents = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("events")
      .select("id,name,photo_count,cover_url")
      .eq("user_id", user.id)
      .order("event_date", { ascending: false });
    setEvents(data || []);
  };

  const handleLinkEvent = async (id: string) => {
    await supabase.from("albums").update({ event_id: id }).eq("id", albumId);
    onEventLinked(id);
    setLinkOpen(false);
    toast.success("Gallery linked");
  };

  /* ─── Filtering ─── */

  const filtered = useMemo(() => {
    return photos.filter((p) => {
      if (filter === "unused" && placedPhotoUrls.has(p.url)) return false;
      if (
        search &&
        p.file_name &&
        !p.file_name.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [photos, filter, search, placedPhotoUrls]);

  const getPhotoCount = (p: Photo) => placedPhotoCounts.get(p.url) || 0;
  const thumb = (url: string) => getOptimizedUrl(url, "thumbnail");

  /* ─── UI ─── */

  return (
    <div className="w-64 xl:w-72 border-r border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Photos
          </h3>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {filtered.length} / {photos.length}
          </span>
        </div>

        {/* Upload buttons */}
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => zipRef.current?.click()}
            disabled={uploading}
          >
            <FileArchive className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              loadEvents();
              setLinkOpen(true);
            }}
          >
            <Link2 className="h-3 w-3" />
          </Button>
        </div>

        {uploading && (
          <Progress value={(uploadDone / uploadTotal) * 100} className="h-1" />
        )}

        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*"
          onChange={(e) => uploadFiles(Array.from(e.target.files || []))}
        />
        <input
          ref={zipRef}
          type="file"
          className="hidden"
          accept=".zip"
          onChange={handleZipUpload}
        />
      </div>

      {/* Photo Progress Summary */}
      {photos.length > 0 && (
        <div className="px-3 py-2 border-b">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>
              {placedPhotoUrls.size} of {photos.length} placed (
              {Math.round((placedPhotoUrls.size / photos.length) * 100)}%)
            </span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{
                width: `${(placedPhotoUrls.size / photos.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="p-2 border-b flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-6 h-6 text-[11px]"
          />
        </div>
        <Button
          variant={filter === "unused" ? "default" : "ghost"}
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={() => setFilter(filter === "all" ? "unused" : "all")}
        >
          <Filter className="h-2.5 w-2.5 mr-1" />
          Unused
        </Button>
      </div>

      {/* Photos Grid */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground">
                {photos.length === 0 ? "Upload photos or link a gallery" : "No matching photos"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {filtered.map((photo) => {
                const count = getPhotoCount(photo);
                return (
                  <div
                    key={photo.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/album-photo",
                        JSON.stringify(photo)
                      );
                      onDragStart(photo);
                    }}
                    className={cn(
                      "relative aspect-square rounded overflow-hidden cursor-grab active:cursor-grabbing transition-all",
                      "hover:ring-2 hover:ring-primary/50 hover:scale-[1.02]",
                      count > 0 && "opacity-60"
                    )}
                  >
                    <img
                      src={thumb(photo.url)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      alt=""
                    />
                    {count > 0 && (
                      <div className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-[8px] font-bold px-1 rounded-sm">
                        {count}×
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Link Event Dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Link Gallery Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No events found
              </p>
            ) : (
              events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => handleLinkEvent(ev.id)}
                  className="flex items-center gap-3 w-full p-3 border rounded-lg hover:bg-accent/50 transition-colors text-left"
                >
                  {ev.cover_url ? (
                    <img
                      src={ev.cover_url}
                      className="h-10 w-10 rounded object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{ev.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {ev.photo_count} photos
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
