import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const StudioSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studioName, setStudioName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  useEffect(() => {
    if (user) {
      (supabase.from('profiles').select('studio_name, mobile') as any).eq('user_id', user.id).single()
        .then(({ data }: any) => {
          if (data) {
            setStudioName(data.studio_name ?? '');
            setMobile(data.mobile ?? '');
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
