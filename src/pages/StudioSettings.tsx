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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('studio_name').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setStudioName(data.studio_name); });
    }
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').update({ studio_name: studioName }).eq('user_id', user.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Settings saved' });
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <h1 className="font-serif text-3xl font-semibold text-foreground mb-8">Studio Settings</h1>
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Studio Name</Label>
          <Input value={studioName} onChange={(e) => setStudioName(e.target.value)} className="bg-card" />
        </div>
        <Button onClick={save} disabled={loading} className="bg-primary hover:bg-gold-hover text-primary-foreground">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default StudioSettings;
