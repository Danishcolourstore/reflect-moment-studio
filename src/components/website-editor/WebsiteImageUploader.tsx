import { useRef, useState, useCallback } from "react";
import { Upload, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import browserImageCompression from "browser-image-compression";

/* ========================= SINGLE IMAGE ========================= */

interface WebsiteImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  userId: string;
  folder?: string;
  label?: string;
  aspectClass?: string;
  compact?: boolean;
}

export function WebsiteImageUploader({
  value,
  onChange,
  userId,
  folder = "general",
  label = "Image",
  aspectClass = "aspect-video",
  compact = false,
}: WebsiteImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setUploading(true);
      try {
        const compressed = await browserImageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2400,
          useWebWorker: true,
          fileType: "image/webp",
        });

        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
        const path = `${userId}/${folder}/${fileName}`;

        const { error } = await supabase.storage
          .from("studio-website-assets")
          .upload(path, compressed, { upsert: true, contentType: "image/webp" });

        if (error) throw error;

        let url = supabase.storage.from("studio-website-assets").getPublicUrl(path).data.publicUrl;
        url = `${url}?t=${Date.now()}`;

        onChange(url);
        toast.success("Image uploaded");
      } catch (e: any) {
        toast.error(e.message || "Upload failed");
      }
      setUploading(false);
    },
    [userId, folder, onChange],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadFile(f);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) uploadFile(f);
  };

  const displayUrl = value ? `${value}${value.includes("?") ? "&" : "?"}v=${Date.now()}` : null;

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {displayUrl ? (
        <div className="mt-1 space-y-2">
          <img src={displayUrl} alt="" className={`w-full ${aspectClass} object-cover rounded-lg border`} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
              Replace
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
              <Trash2 className="h-3 w-3 mr-1" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`mt-1 cursor-pointer rounded-lg border-2 border-dashed p-6 flex flex-col items-center gap-2 ${
            dragOver ? "border-primary bg-primary/5" : ""
          }`}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span className="text-xs">Upload</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ========================= GRID ========================= */

interface WebsiteImageGridUploaderProps {
  values: string[];
  onChange: (urls: string[]) => void;
  userId: string;
  folder?: string;
  label?: string;
  maxImages?: number;
}

export function WebsiteImageGridUploader({
  values,
  onChange,
  userId,
  folder = "portfolio",
}: WebsiteImageGridUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMultiple = async (files: File[]) => {
    const urls: string[] = [];

    for (const file of files) {
      const compressed = await browserImageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2400,
        useWebWorker: true,
        fileType: "image/webp",
      });

      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const path = `${userId}/${folder}/${fileName}`;

      await supabase.storage.from("studio-website-assets").upload(path, compressed, { upsert: true });

      let url = supabase.storage.from("studio-website-assets").getPublicUrl(path).data.publicUrl;
      url = `${url}?t=${Date.now()}`;
      urls.push(url);
    }

    onChange([...values, ...urls]);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          uploadMultiple(files);
        }}
      />

      <div className="grid grid-cols-2 gap-2">
        {values.map((url, i) => (
          <img key={i} src={`${url}?v=${Date.now()}`} className="w-full aspect-square object-cover rounded" />
        ))}

        <button
          onClick={() => inputRef.current?.click()}
          className="aspect-square border-2 border-dashed flex items-center justify-center"
        >
          <Upload className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
