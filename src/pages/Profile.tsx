import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { useStorageUsage, formatBytes } from '@/hooks/use-storage-usage';

const Profile = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    setFullName(user.user_metadata?.full_name || '');
    (supabase.from('profiles').select('avatar_url, studio_name') as any).eq('user_id', user.id).maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setAvatarUrl(data.avatar_url);
          if (!fullName) setFullName(data.studio_name || '');
        }
        setLoading(false);
      });
  }, [user]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setAvatarUploading(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('event-covers').upload(path, file, { upsert: true });
    if (!error) {
      const url = supabase.storage.from('event-covers').getPublicUrl(path).data.publicUrl;
      await (supabase.from('profiles').update({ avatar_url: url } as any) as any).eq('user_id', user.id);
      setAvatarUrl(url);
      toast.success('Avatar updated');
    }
    setAvatarUploading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.auth.updateUser({ data: { full_name: fullName } });
    toast.success('Profile updated');
    setSaving(false);
  };

  const savePassword = async () => {
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) toast.error(error.message);
    else { toast.success('Password updated'); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }
    setPwSaving(false);
  };

  const pwStrength = () => {
    if (newPw.length === 0) return null;
    if (newPw.length < 6) return { label: 'Weak', color: 'text-destructive' };
    if (newPw.length < 10 || !/[A-Z]/.test(newPw) || !/\d/.test(newPw)) return { label: 'Fair', color: 'text-yellow-500' };
    return { label: 'Strong', color: 'text-green-500' };
  };

  const storage = useStorageUsage();

  if (loading) return <DashboardLayout><Skeleton className="h-96" /></DashboardLayout>;

  const strength = pwStrength();
  const storageUsed = storage.data?.used ?? 0;
  const storageLimit = storage.data?.limit ?? 0;
  const storagePct = storageLimit > 0 ? Math.min((storageUsed / storageLimit) * 100, 100) : 0;

  return (
    <DashboardLayout>
      <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-6 sm:mb-8">Profile Settings</h1>

      <div className="max-w-lg space-y-6 sm:space-y-8">
        {/* Personal Info */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <h2 className="font-serif text-lg text-foreground mb-5">Personal Information</h2>
          <div className="flex items-center gap-4 mb-5">
            <Avatar className="h-16 w-16 cursor-pointer" onClick={() => avatarRef.current?.click()}>
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-secondary text-lg font-serif">{fullName.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => avatarRef.current?.click()} disabled={avatarUploading}>
                {avatarUploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} Change Avatar
              </Button>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Full Name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 bg-background text-base" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Email</label>
              <Input value={email} readOnly className="mt-1 bg-background opacity-60 text-base" />
              <p className="text-[10px] text-muted-foreground/50 mt-1">Email cannot be changed</p>
            </div>
          </div>
          <Button onClick={saveProfile} disabled={saving} className="mt-5 bg-primary text-primary-foreground text-[11px] uppercase tracking-wider">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* Change Password */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <h2 className="font-serif text-lg text-foreground mb-5">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Current Password</label>
              <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="mt-1 bg-background text-base" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">New Password</label>
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="mt-1 bg-background text-base" />
              {strength && <p className={`text-[10px] mt-1 ${strength.color}`}>{strength.label}</p>}
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Confirm New Password</label>
              <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="mt-1 bg-background text-base" />
              {confirmPw && confirmPw !== newPw && <p className="text-[10px] text-destructive mt-1">Passwords do not match</p>}
              {confirmPw && confirmPw === newPw && newPw.length >= 6 && <p className="text-[10px] text-green-500 mt-1">Passwords match</p>}
            </div>
          </div>
          <Button onClick={savePassword} disabled={pwSaving || !newPw || newPw !== confirmPw} className="mt-5 bg-primary text-primary-foreground text-[11px] uppercase tracking-wider">
            {pwSaving ? 'Updating...' : 'Save Password'}
          </Button>
        </div>

        {/* Appearance / Theme */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <h2 className="font-serif text-lg text-foreground mb-5">Appearance</h2>
          <p className="text-[11px] text-muted-foreground mb-4">Choose your dashboard theme</p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: 'dark', label: 'Dark', emoji: '🌙', desc: 'Cinematic dark' },
              { key: 'classic', label: 'Classic', emoji: '✦', desc: 'Clean white' },
            ] as const).map(({ key, label, emoji, desc }) => {
              const currentTheme = localStorage.getItem('mirrorai-theme') || 'dark';
              const isActive = currentTheme === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    document.documentElement.classList.remove('dark', 'editorial', 'classic');
                    document.documentElement.classList.add(key);
                    localStorage.setItem('mirrorai-theme', key);
                    localStorage.setItem('theme', key);
                    if (user) {
                      (supabase.from('profiles').update({ theme_preference: key } as any) as any).eq('user_id', user.id);
                    }
                    toast.success(`${label} theme activated`);
                    window.dispatchEvent(new Event('storage'));
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    isActive ? 'border-accent bg-accent/10' : 'border-border hover:border-foreground/20'
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-[12px] font-medium text-foreground">{label}</span>
                  <span className="text-[10px] text-muted-foreground">{desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Storage Usage */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <h2 className="font-serif text-lg text-foreground mb-5">Storage Usage</h2>
          <p className="font-serif text-3xl font-bold text-foreground">{formatBytes(storageUsed)}</p>
          <p className="text-sm text-muted-foreground mt-1">of {formatBytes(storageLimit)}</p>
          <Progress value={storagePct} className="mt-3 h-2" />
          <div className="grid grid-cols-2 gap-4 mt-4 text-[12px]">
            <div><span className="text-muted-foreground/60">Events:</span> <span className="font-medium">{storage.data?.eventCount ?? 0}</span></div>
            <div><span className="text-muted-foreground/60">Photos:</span> <span className="font-medium">{storage.data?.photoCount ?? 0}</span></div>
          </div>
          {storage.data?.plan !== 'pro' && (
            <div className="mt-4 bg-secondary rounded-lg p-4">
              <p className="font-serif text-sm font-semibold text-foreground">Upgrade to Pro</p>
              <p className="text-[11px] text-muted-foreground mt-1">Get 100 GB storage, unlimited events, and priority support.</p>
              <Button size="sm" className="mt-3 bg-primary text-primary-foreground text-[10px] uppercase tracking-wider">Upgrade Now</Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
