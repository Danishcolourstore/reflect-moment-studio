import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

import { Upload, FileArchive, Search, Check, Image as ImageIcon, Link2, X, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { getOptimizedUrl } from "@/lib/image-utils";
import JSZip from "jszip";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  /* ---------------- Load photos ---------------- */

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

      const { data } = await supabase.storage.from("gallery-photos").list(folder, { limit: 500 });

      if (!data) {
        setPhotos([]);
      } else {
        const list = data
          .filter((f) => IMAGE_RE.test(f.name))
          .map((f) => {
            const {
              data: { publicUrl },
            } = supabase.storage.from("gallery-photos").getPublicUrl(`${folder}/${f.name}`);

            return {
              id: f.name,
              url: publicUrl,
              file_name: f.name,
            };
          });

        setPhotos(list);
      }
    }

    setLoading(false);
  }, [user, albumId, eventId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  /* ---------------- Upload ---------------- */

  const uploadFiles = async (files: File[]) => {
    if (!user) return;

    setUploading(true);

    setUploadTotal(files.length);
    setUploadDone(0);

    let done = 0;

    for (const file of files) {
      try {
        const ext = file.name.split(".").pop() || "jpg";

        const path = eventId
          ? `${user.id}/${eventId}/${Date.now()}-${file.name}`
          : `${user.id}/${albumId}/${Date.now()}-${file.name}`;

        const { error } = await supabase.storage.from("gallery-photos").upload(path, file);

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

    toast.success("Upload complete");

    fetchPhotos();
  };

  /* ---------------- ZIP Upload ---------------- */

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const zip = await JSZip.loadAsync(file);

      const images = Object.values(zip.files).filter((f) => !f.dir && IMAGE_RE.test(f.name));

      const files: File[] = [];

      for (const entry of images) {
        const blob = await entry.async("blob");

        files.push(new File([blob], entry.name, { type: "image/jpeg" }));
      }

      uploadFiles(files);
    } catch (e) {
      console.error(e);
      toast.error("ZIP failed");
    }
  };

  /* ---------------- Link events ---------------- */

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
  };

  /* ---------------- Filtering ---------------- */

  const filtered = useMemo(() => {
    return photos.filter((p) => {
      if (filter === "unused" && placedPhotoUrls.has(p.url)) return false;

      if (search && p.file_name && !p.file_name.toLowerCase().includes(search.toLowerCase())) return false;

      return true;
    });
  }, [photos, filter, search, placedPhotoUrls]);

  const getPhotoCount = (p: Photo) => placedPhotoCounts.get(p.url) || 0;

  const thumb = (url: string) => getOptimizedUrl(url, "thumbnail");

  /* ---------------- UI ---------------- */

  return (
    <div className="w-64 xl:w-72 border-r border-border bg-card flex flex-col h-full">
      {/* Upload */}

      <div className="p-3 space-y-2 border-b">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-1" />
            Photos
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => zipRef.current?.click()}
            disabled={uploading}
          >
            <FileArchive className="h-4 w-4 mr-1" />
            ZIP
          </Button>
        </div>

        {uploading && <Progress value={(uploadDone / uploadTotal) * 100} />}

        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*"
          onChange={(e) => uploadFiles(Array.from(e.target.files || []))}
        />

        <input ref={zipRef} type="file" className="hidden" accept=".zip" onChange={handleZipUpload} />
      </div>

      {/* Search */}

      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />

          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-6 text-xs"
          />
        </div>
      </div>

      {/* Grid */}

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-10">No photos</div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {filtered.map((photo) => {
              const count = getPhotoCount(photo);

              return (
                <div
                  key={photo.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/album-photo", JSON.stringify(photo));
                    onDragStart(photo);
                  }}
                  className="relative aspect-square rounded-md overflow-hidden cursor-grab"
                >
                  <img src={thumb(photo.url)} className="w-full h-full object-cover" loading="lazy" />

                  {count > 0 && (
                    <div className="absolute top-1 right-1 bg-primary text-white text-[9px] px-1 rounded">{count}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Link Event */}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Gallery</DialogTitle>
          </DialogHeader>

          {events.map((ev) => (
            <button
              key={ev.id}
              onClick={() => handleLinkEvent(ev.id)}
              className="flex items-center gap-3 w-full p-2 border rounded"
            >
              <ImageIcon className="h-4 w-4" />
              {ev.name}
            </button>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
