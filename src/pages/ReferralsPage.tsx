import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Copy, Gift, Users } from 'lucide-react';
import { format } from 'date-fns';

interface Referral {
  id: string;
  referred_email: string;
  status: string;
  reward_granted: boolean;
  created_at: string;
}

const ReferralsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => { document.title = 'MirrorAI — Referrals'; }, []);

  useEffect(() => {
    if (!user) return;
    (supabase.from('referrals' as any).select('*') as any)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }: any) => { if (data) setReferrals(data as Referral[]); });
  }, [user]);

  const code = user?.id?.substring(0, 8).toUpperCase() ?? '';
  const link = `https://mirrorai.app/register?ref=${code}`;

  return (
    <DashboardLayout>
      <div className="page-fade-in max-w-lg">
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Referrals</h1>
        <p className="text-[11px] text-muted-foreground/50 uppercase tracking-[0.12em] mb-8">Invite photographers and earn rewards</p>

        <div className="bg-card border border-border p-5 mb-6 space-y-3">
          <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium">Your Referral Code</p>
          <p className="font-mono text-xl font-bold text-primary tracking-wider">{code}</p>
          <div className="flex gap-2">
            <Input value={link} readOnly className="bg-background h-9 text-[11px] font-mono" />
            <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(link); toast({ title: 'Link copied!' }); }} className="h-9 w-9 shrink-0">
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {referrals.length === 0 ? (
          <div className="border border-dashed border-border/60 py-16 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground/15" />
            <p className="mt-4 font-serif text-sm text-muted-foreground/60">No referrals yet</p>
            <p className="mt-1 text-[10px] text-muted-foreground/40">Share your link to start earning rewards.</p>
          </div>
        ) : (
          <div className="border border-border overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Referred User</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Date</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Status</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Reward</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="px-4 py-3 text-[12px] text-foreground">{r.referred_email}</td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground/70">{format(new Date(r.created_at), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground/70 capitalize">{r.status}</td>
                    <td className="px-4 py-3">{r.reward_granted ? <Gift className="h-4 w-4 text-primary" /> : <span className="text-[10px] text-muted-foreground/40">Pending</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReferralsPage;
