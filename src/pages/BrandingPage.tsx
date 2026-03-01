import { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, X } from 'lucide-react';

const BrandingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState('#8B6914');
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(20);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = 'MirrorAI — Branding'; }, []);

  useEffect(() => {
    if (!user) return;
    (supabase.from('profiles').select('studio_logo_url, studio_accent_color, watermark_text, watermark_position, watermark_opacity, studio_name') as any)
      .eq('user_id', user.id).single()
      .then(({ data }: any) => {
        if (data) {
          setLogoUrl(data.studio_logo_url ?? null);
          setAccentColor(data.studio_accent_color ?? '#8B6914');
          setWatermarkText(data.watermark_text ?? data.studio_name ?? '');
          setWatermarkPosition(data.watermark_position ?? 'bottom-right');
          setWatermarkOpacity(data.watermark_opacity ?? 20);
        }
      });
  }, [user]);

  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `studio-logos/${user.id}/logo.${ext}`;
    await supabase.storage.from('event-covers').upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('event-covers').getPublicUrl(path);
    setLogoUrl(publicUrl);
    setUploading(false);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await (supabase.from('profiles').update({
      studio_logo_url: logoUrl,
      studio_accent_color: accentColor,
      watermark_text: watermarkText,
      watermark_position: watermarkPosition,
      watermark_opacity: watermarkOpacity,
    } as any) as any).eq('user_id', user.id);
    toast({ title: 'Branding saved' });
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="page-fade-in max-w-md">
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Branding</h1>
        <p className="text-[11px] text-muted-foreground/50 uppercase tracking-[0.12em] mb-8">Customize your studio identity</p>

        <div className="space-y-6">
          {/* Logo */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Studio Logo</Label>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }} />
            {logoUrl ? (
              <div className="flex items-center gap-3">
                <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain border border-border rounded p-1 bg-background" />
                <Button variant="ghost" size="sm" onClick={() => setLogoUrl(null)} className="text-destructive text-[10px]"><X className="mr-1 h-3 w-3" />Remove</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={uploading} className="text-[10px] h-8 uppercase tracking-wider">
                {uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} Upload Logo
              </Button>
            )}
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Studio Accent Color</Label>
            <div className="flex items-center gap-3">
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="h-9 w-12 rounded border border-border cursor-pointer" />
              <Input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="bg-card h-9 w-28 text-[12px] font-mono" />
            </div>
          </div>

          {/* Watermark */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Watermark Text</Label>
            <Input value={watermarkText} onChange={e => setWatermarkText(e.target.value)} placeholder="Your Studio Name" className="bg-card h-9" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Watermark Position</Label>
            <Select value={watermarkPosition} onValueChange={setWatermarkPosition}>
              <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="diagonal">Diagonal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Watermark Opacity: {watermarkOpacity}%</Label>
            <Slider value={[watermarkOpacity]} onValueChange={v => setWatermarkOpacity(v[0])} min={10} max={50} step={5} />
          </div>

          <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 text-[11px] uppercase tracking-wider w-full">
            {saving ? 'Saving...' : 'Save Branding'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BrandingPage;
