import { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';

const StudioProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = 'MirrorAI — Studio Profile'; }, []);

  useEffect(() => {
    if (!user) return;
    (supabase.from('studio_profiles' as any).select('*') as any)
      .eq('user_id', user.id).maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setExistingId(data.id);
          setDisplayName(data.display_name ?? '');
          setUsername(data.username ?? '');
          setBio(data.bio ?? '');
          setWebsite(data.website ?? '');
          setInstagram(data.instagram ?? '');
          setCoverUrl(data.cover_url ?? null);
        }
      });
  }, [user]);

  const handleCoverUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `studio-covers/${user.id}/cover.${ext}`;
    await supabase.storage.from('event-covers').upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('event-covers').getPublicUrl(path);
    setCoverUrl(publicUrl);
    setUploading(false);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const row = { user_id: user.id, display_name: displayName, username: username.toLowerCase().replace(/[^a-z0-9_-]/g, ''), bio, website, instagram, cover_url: coverUrl } as any;
    if (existingId) {
      await (supabase.from('studio_profiles' as any).update(row) as any).eq('id', existingId);
    } else {
      const { data } = await (supabase.from('studio_profiles' as any).insert(row).select('id').single() as any);
      if (data) setExistingId((data as any).id);
    }
    toast({ title: 'Studio profile saved' });
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="page-fade-in max-w-md">
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Studio Profile</h1>
        <p className="text-[11px] text-muted-foreground/50 uppercase tracking-[0.12em] mb-8">Your public portfolio page</p>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Display Name</Label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-card h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
            <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="yourstudio" className="bg-card h-9" />
            <p className="text-[10px] text-muted-foreground/50">Your portfolio URL: mirrorai.app/studio/{username || 'yourstudio'}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bio</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="bg-card text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Website URL</Label>
            <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" className="bg-card h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Instagram Handle</Label>
            <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="yourstudio" className="bg-card h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cover Photo</Label>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ''; }} />
            {coverUrl && <img src={coverUrl} alt="" className="w-full h-32 object-cover rounded border border-border" />}
            <Button variant="outline" size="sm" onClick={() => coverRef.current?.click()} disabled={uploading} className="text-[10px] h-8 uppercase tracking-wider">
              {uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} {coverUrl ? 'Replace Cover' : 'Upload Cover'}
            </Button>
          </div>

          <Button onClick={save} disabled={saving} className="w-full bg-primary text-primary-foreground h-10 text-[11px] uppercase tracking-wider">
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudioProfilePage;
