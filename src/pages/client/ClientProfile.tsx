import { useState, useEffect } from 'react';
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ClientProfile = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    (supabase.from('clients').select('name, phone, email') as any).eq('user_id', user.id).single()
      .then(({ data }: any) => {
        if (data) {
          setName(data.name || '');
          setPhone(data.phone || '');
        }
        setLoading(false);
      });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await (supabase.from('clients').update({ name, phone } as any) as any).eq('user_id', user.id);
    toast.success('Profile updated');
    setSaving(false);
  };

  const savePassword = async () => {
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) toast.error(error.message);
    else { toast.success('Password updated'); setNewPw(''); setConfirmPw(''); }
    setPwSaving(false);
  };

  if (loading) return <ClientDashboardLayout><Skeleton className="h-96" /></ClientDashboardLayout>;

  return (
    <ClientDashboardLayout>
      <h1 className="font-serif text-2xl font-semibold text-foreground mb-8">Profile</h1>

      <div className="max-w-lg space-y-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-serif text-lg text-foreground mb-5">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-background" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Email</label>
              <Input value={email} readOnly className="mt-1 bg-background opacity-60" />
              <p className="text-[10px] text-muted-foreground/50 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 bg-background" placeholder="+1 (555) 123-4567" />
            </div>
          </div>
          <Button onClick={saveProfile} disabled={saving} className="mt-5 bg-primary text-primary-foreground text-[11px] uppercase tracking-wider">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-serif text-lg text-foreground mb-5">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">New Password</label>
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="mt-1 bg-background" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Confirm Password</label>
              <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="mt-1 bg-background" />
              {confirmPw && confirmPw !== newPw && <p className="text-[10px] text-destructive mt-1">Passwords do not match</p>}
            </div>
          </div>
          <Button onClick={savePassword} disabled={pwSaving || !newPw || newPw !== confirmPw} className="mt-5 bg-primary text-primary-foreground text-[11px] uppercase tracking-wider">
            {pwSaving ? 'Updating...' : 'Save Password'}
          </Button>
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientProfile;
