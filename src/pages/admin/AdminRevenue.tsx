import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { format, subMonths } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, Users, TrendingUp } from 'lucide-react';

const MONTHLY_PRICE = 999;

export default function AdminRevenue() {
  const [proCount, setProCount] = useState(0);
  const [proUsers, setProUsers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase.from('profiles').select('*').eq('plan', 'pro') as any);
      const pros = data || [];
      setProCount(pros.length);
      setProUsers(pros);

      // Build 12-month chart (estimated)
      const months: any[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const label = format(d, 'MMM yyyy');
        const subsAtThatTime = pros.filter((p: any) => new Date(p.created_at) <= d).length;
        months.push({ month: label, revenue: subsAtThatTime * MONTHLY_PRICE });
      }
      setChartData(months);
    };
    load();
  }, []);

  const totalRevenue = proCount * MONTHLY_PRICE;
  const mrr = totalRevenue;

  const stats = [
    { label: 'Total Revenue (est.)', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign },
    { label: 'Monthly Recurring Revenue', value: `₹${mrr.toLocaleString()}`, icon: TrendingUp },
    { label: 'Pro Subscribers', value: proCount, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl font-semibold text-foreground">Revenue Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <s.icon className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="font-serif text-4xl font-semibold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pro subscribers table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Email</th>
                <th className="text-left px-4 py-2.5 font-medium">Since</th>
                <th className="text-left px-4 py-2.5 font-medium">Monthly</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {proUsers.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-4 py-2.5 font-medium">{p.studio_name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.email || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{format(new Date(p.created_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-2.5">₹{MONTHLY_PRICE}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary">Active</span>
                  </td>
                </tr>
              ))}
              {proUsers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No pro subscribers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue chart */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-serif text-base font-semibold mb-4">Estimated Monthly Revenue (Last 12 Months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => `₹${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Note card */}
      <Card className="bg-muted border-border">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Note:</strong> Payment gateway integration coming soon. Actual transaction data will appear here after Razorpay integration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
