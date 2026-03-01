import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2 } from 'lucide-react';

const StudioSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studioName, setStudioName] = useState('');
  const [mobile, setMobile] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'MirrorAI — Studio Settings';
  }, []);

  useEffect(() => {
    if (user) {
      (supabase.from('profiles').select('studio_name, mobile, studio_logo_url') as any).eq('user_id', user.id).single()
        .then(({ data }: any) => {
          if (data) {
            setStudioName(data.studio_name ?? '');
            setMobile(data.mobile ?? '');
            setLogoUrl(data.studio_logo_url ?? null);
          }
        });
    }
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await (supabase.from('profiles').update({ studio_name: studioName, mobile } as any) as any).eq('user_id', user.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Settings saved' });
    setLoading(false);
  };

  const updatePhone = async () => {
    if (!user || !mobile) return;
    setPhoneLoading(true);
    const { error } = await supabase.auth.updateUser({ phone: mobile });
    if (error) {
      toast({ title: 'Phone update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Phone number updated', description: 'Your phone number has been linked to your account.' });
    }
    setPhoneLoading(false);
  };

  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    setLogoUploading(true);
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `studio-logos/${user.id}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage.from('event-covers').upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setLogoUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('event-covers').getPublicUrl(path);
    await (supabase.from('profiles').update({ studio_logo_url: publicUrl } as any) as any).eq('user_id', user.id);
    setLogoUrl(publicUrl);
    toast({ title: 'Logo uploaded' });
    setLogoUploading(false);
  };

  const removeLogo = async () => {
    if (!user) return;
    await (supabase.from('profiles').update({ studio_logo_url: null } as any) as any).eq('user_id', user.id);
    setLogoUrl(null);
    toast({ title: 'Logo removed' });
  };

  return (
    <DashboardLayout>
      <h1 className="font-serif text-3xl font-semibold text-foreground mb-8">Studio Settings</h1>
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Studio Name</Label>
          <Input value={studioName} onChange={(e) => setStudioName(e.target.value)} className="bg-card" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mobile Number</Label>
          <Input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+91 9876543210"
            className="bg-card"
          />
          <p className="text-[10px] text-muted-foreground/50">Used for OTP login. Include country code.</p>
        </div>

        {/* Studio Branding */}
        <div className="pt-4 border-t border-border space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Studio Branding</Label>
          <p className="text-[10px] text-muted-foreground/50">Upload your logo to watermark photos in galleries with watermark enabled.</p>
          
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleLogoUpload(f);
              e.target.value = '';
            }}
          />

          {logoUrl ? (
            <div className="space-y-2">
              <div className="relative inline-block">
                <img src={logoUrl} alt="Studio logo" className="h-20 w-auto object-contain border border-border rounded p-2 bg-background" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={logoUploading}
                  className="text-[10px] h-7 uppercase tracking-[0.06em]">
                  {logoUploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
                  Replace Logo
                </Button>
                <Button variant="ghost" size="sm" onClick={removeLogo}
                  className="text-[10px] h-7 uppercase tracking-[0.06em] text-destructive hover:bg-destructive/10">
                  <X className="mr-1 h-3 w-3" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={logoUploading}
              className="text-[10px] h-8 uppercase tracking-[0.06em]">
              {logoUploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
              Upload Logo
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={save} disabled={loading} className="bg-primary hover:bg-gold-hover text-primary-foreground">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          {mobile && (
            <Button onClick={updatePhone} disabled={phoneLoading} variant="outline">
              {phoneLoading ? 'Linking…' : 'Link Phone to Account'}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudioSettings;
