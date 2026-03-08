import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Trash2, Image as ImageIcon, FileImage, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BrandAsset {
  id: string;
  name: string;
  url: string;
  type: 'logo' | 'watermark' | 'texture' | 'other';
  uploaded_at: string;
}

interface Props {
  userId: string;
  assets: BrandAsset[];
  onAssetsChange: (assets: BrandAsset[]) => void;
}

const ASSET_TYPES = [
  { value: 'logo', label: 'Logos', icon: ImageIcon },
  { value: 'watermark', label: 'Watermarks', icon: FileImage },
  { value: 'texture', label: 'Textures', icon: FileImage },
];

const BrandAssets = ({ userId, assets, onAssetsChange }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activeType, setActiveType] = useState<string>('logo');

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `brand-assets/${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('event-covers').upload(path, file, { upsert: false });
      if (error) throw error;
      const url = supabase.storage.from('event-covers').getPublicUrl(path).data.publicUrl;
      const newAsset: BrandAsset = {
        id: crypto.randomUUID(),
        name: file.name,
        url,
        type: activeType as BrandAsset['type'],
        uploaded_at: new Date().toISOString(),
      };
      onAssetsChange([...assets, newAsset]);
      toast.success('Asset uploaded');
    } catch (e: any) {
      toast.error(e.message);
    }
    setUploading(false);
  };

  const removeAsset = (id: string) => {
    onAssetsChange(assets.filter(a => a.id !== id));
    toast.success('Asset removed');
  };

  const filtered = assets.filter(a => a.type === activeType);

  return (
    <div className="space-y-5">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />

      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-3">ASSET TYPE</p>
        <div className="flex gap-1.5">
          {ASSET_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setActiveType(t.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                activeType === t.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map(asset => (
            <div key={asset.id} className="group relative border border-border rounded-lg overflow-hidden bg-card aspect-square">
              <img src={asset.url} alt={asset.name} className="h-full w-full object-contain p-2" />
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <a href={asset.url} download className="h-7 w-7 rounded-full bg-card border border-border flex items-center justify-center">
                  <Download className="h-3 w-3 text-foreground" />
                </a>
                <button onClick={() => removeAsset(asset.id)} className="h-7 w-7 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
              <p className="absolute bottom-0 left-0 right-0 bg-background/70 px-1.5 py-0.5 text-[8px] text-muted-foreground truncate">{asset.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-xl p-8 text-center">
          <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground/20 mb-2" />
          <p className="text-[11px] text-muted-foreground/50">No {activeType}s uploaded yet</p>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full text-[10px] h-8">
        {uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
        Upload {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
      </Button>
    </div>
  );
};

export default BrandAssets;
