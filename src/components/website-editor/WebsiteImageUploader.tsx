import { useRef, useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import browserImageCompression from 'browser-image-compression';

interface WebsiteImageUploaderProps {
  /** Current image URL (or null) */
  value: string | null;
  /** Called with the new public URL after upload, or null on remove */
  onChange: (url: string | null) => void;
  /** User ID for storage path */
  userId: string;
  /** Sub-folder name for organization, e.g. "hero", "about", "portfolio" */
  folder?: string;
  /** Display label */
  label?: string;
  /** Aspect ratio class for preview, e.g. "aspect-video", "aspect-square" */
  aspectClass?: string;
  /** Whether the component is compact (for grid use) */
  compact?: boolean;
}

export function WebsiteImageUploader({
  value,
  onChange,
  userId,
  folder = 'general',
  label = 'Image',
  aspectClass = 'aspect-video',
  compact = false,
}: WebsiteImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      // Compress image for web performance
      const compressed = await browserImageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2400,
        useWebWorker: true,
        fileType: 'image/webp',
      });

      const ext = 'webp';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `${userId}/${folder}/${fileName}`;

      const { error } = await supabase.storage
        .from('studio-website-assets')
        .upload(path, compressed, { upsert: true, contentType: 'image/webp' });

      if (error) throw error;

      const url = supabase.storage
        .from('studio-website-assets')
        .getPublicUrl(path).data.publicUrl;

      onChange(url);
      toast.success('Image uploaded');
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    }
    setUploading(false);
  }, [userId, folder, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadFile(f);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) uploadFile(f);
  };

  const handleRemove = () => {
    onChange(null);
  };

  if (compact) {
    return (
      <div className="relative group">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {value ? (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img src={value} alt="" className={`w-full ${aspectClass} object-cover`} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button
                variant="secondary"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                Replace
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-[10px]"
                onClick={handleRemove}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            disabled={uploading}
            className={`w-full ${aspectClass} rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
            }`}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                <span className="text-[9px] text-muted-foreground/40">Upload</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">{label}</label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {value ? (
        <div className="mt-1 space-y-2">
          <img src={value} alt="" className={`w-full ${aspectClass} object-cover rounded-lg border border-border`} />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] h-7"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
              Replace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] h-7 text-destructive hover:text-destructive"
              onClick={handleRemove}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-1 cursor-pointer rounded-lg border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
          }`}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground/40" />
              <span className="text-[10px] text-muted-foreground/50">Click or drag to upload</span>
              <span className="text-[8px] text-muted-foreground/30">Images auto-optimized for web</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

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
  folder = 'portfolio',
  label = 'Images',
  maxImages = 20,
}: WebsiteImageGridUploaderProps) {
  const handleAdd = (url: string | null) => {
    if (url) onChange([...values, url]);
  };

  const handleReplace = (index: number, url: string | null) => {
    if (url) {
      const next = [...values];
      next[index] = url;
      onChange(next);
    } else {
      onChange(values.filter((_, i) => i !== index));
    }
  };

  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">{label}</label>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {values.map((url, i) => (
          <WebsiteImageUploader
            key={`${url}-${i}`}
            value={url}
            onChange={(newUrl) => handleReplace(i, newUrl)}
            userId={userId}
            folder={folder}
            aspectClass="aspect-square"
            compact
          />
        ))}
        {values.length < maxImages && (
          <WebsiteImageUploader
            value={null}
            onChange={handleAdd}
            userId={userId}
            folder={folder}
            aspectClass="aspect-square"
            compact
          />
        )}
      </div>
      <p className="text-[8px] text-muted-foreground/30 mt-1">{values.length}/{maxImages} images</p>
    </div>
  );
}
