import { useState } from 'react';
import { InstagramSnapshot } from '@/hooks/use-instagram-intelligence';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, Eye, Heart, Bookmark, Share2, MessageCircle, Users, MousePointerClick } from 'lucide-react';
import { format } from 'date-fns';

interface PerformanceTrackerProps {
  snapshots: InstagramSnapshot[];
  onAddSnapshot: (data: Partial<InstagramSnapshot>) => void;
}

export function PerformanceTracker({ snapshots, onAddSnapshot }: PerformanceTrackerProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    period: 'weekly',
    followers: 0, followers_gained: 0, reach: 0, profile_visits: 0,
    likes: 0, saves: 0, shares: 0, comments: 0, link_clicks: 0,
    reels_count: 0, posts_count: 0, stories_count: 0,
    snapshot_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = () => {
    onAddSnapshot(form);
    setAddOpen(false);
    setForm({
      period: 'weekly', followers: 0, followers_gained: 0, reach: 0, profile_visits: 0,
      likes: 0, saves: 0, shares: 0, comments: 0, link_clicks: 0,
      reels_count: 0, posts_count: 0, stories_count: 0,
      snapshot_date: new Date().toISOString().split('T')[0],
    });
  };

  const latest = snapshots[0] || null;
  const prev = snapshots.length > 1 ? snapshots[1] : null;

  const getChange = (current: number, previous: number | undefined) => {
    if (!previous || previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  };

  const MetricCard = ({ label, value, prevValue, icon }: { label: string; value: number; prevValue?: number; icon: React.ReactNode }) => {
    const change = getChange(value, prevValue);
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-muted-foreground/30">{icon}</span>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
        <p className="text-[24px] leading-none font-serif text-foreground" style={{ fontWeight: 300 }}>
          {value.toLocaleString()}
        </p>
        {change !== null && (
          <div className="flex items-center gap-1 mt-1">
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
            <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {latest ? `Last updated: ${format(new Date(latest.snapshot_date), 'dd MMM yyyy')}` : 'No data.'}
        </p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Log Snapshot
        </Button>
      </div>

      {!latest ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <p className="mt-3 font-serif text-lg text-foreground">Track Your Instagram</p>
          <p className="text-sm text-muted-foreground">Log your weekly metrics from Instagram Insights</p>
          <Button className="mt-3" size="sm" onClick={() => setAddOpen(true)}>Add First Snapshot</Button>
        </div>
      ) : (
        <>
          {/* Summary */}
          {prev && (
            <div className="bg-card border border-primary/20 rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wider text-primary mb-2">Weekly Summary</p>
              <div className="space-y-1">
                {(() => {
                  const reachChange = getChange(latest.reach, prev.reach);
                  const engChange = getChange(
                    latest.likes + latest.saves + latest.shares,
                    prev.likes + prev.saves + prev.shares,
                  );
                  return (
                    <>
                      {reachChange !== null && (
                        <p className="text-sm text-foreground">
                          {reachChange >= 0 ? '📈' : '📉'} Reach {reachChange >= 0 ? 'increased' : 'decreased'} by {Math.abs(reachChange)}%
                        </p>
                      )}
                      {engChange !== null && (
                        <p className="text-sm text-foreground">
                          {engChange >= 0 ? '🔥' : '⚠️'} Engagement {engChange >= 0 ? 'up' : 'down'} by {Math.abs(engChange)}%
                        </p>
                      )}
                      <p className="text-sm text-foreground">
                        👥 {latest.followers_gained >= 0 ? '+' : ''}{latest.followers_gained} followers this period
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Reach" value={latest.reach} prevValue={prev?.reach} icon={<Eye className="h-4 w-4" />} />
            <MetricCard label="Followers" value={latest.followers} prevValue={prev?.followers} icon={<Users className="h-4 w-4" />} />
            <MetricCard label="Likes" value={latest.likes} prevValue={prev?.likes} icon={<Heart className="h-4 w-4" />} />
            <MetricCard label="Saves" value={latest.saves} prevValue={prev?.saves} icon={<Bookmark className="h-4 w-4" />} />
            <MetricCard label="Shares" value={latest.shares} prevValue={prev?.shares} icon={<Share2 className="h-4 w-4" />} />
            <MetricCard label="Comments" value={latest.comments} prevValue={prev?.comments} icon={<MessageCircle className="h-4 w-4" />} />
            <MetricCard label="Profile Visits" value={latest.profile_visits} prevValue={prev?.profile_visits} icon={<MousePointerClick className="h-4 w-4" />} />
            <MetricCard label="Link Clicks" value={latest.link_clicks} prevValue={prev?.link_clicks} icon={<MousePointerClick className="h-4 w-4" />} />
          </div>

          {/* Content Mix */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Content Mix</p>
            <div className="flex gap-3">
              <Badge variant="secondary" className="text-xs px-3 py-1">🎬 {latest.reels_count} Reels</Badge>
              <Badge variant="secondary" className="text-xs px-3 py-1">📸 {latest.posts_count} Posts</Badge>
              <Badge variant="secondary" className="text-xs px-3 py-1">📱 {latest.stories_count} Stories</Badge>
            </div>
          </div>
        </>
      )}

      {/* Add Snapshot Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Log Instagram Snapshot</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">Enter your metrics from Instagram Insights</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.period} onValueChange={v => setForm(p => ({ ...p, period: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={form.snapshot_date} onChange={e => setForm(p => ({ ...p, snapshot_date: e.target.value }))} />
            </div>

            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-2">Audience</p>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Total Followers" value={form.followers || ''} onChange={e => setForm(p => ({ ...p, followers: Number(e.target.value) }))} />
              <Input type="number" placeholder="Followers Gained" value={form.followers_gained || ''} onChange={e => setForm(p => ({ ...p, followers_gained: Number(e.target.value) }))} />
            </div>

            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Reach & Visits</p>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Reach" value={form.reach || ''} onChange={e => setForm(p => ({ ...p, reach: Number(e.target.value) }))} />
              <Input type="number" placeholder="Profile Visits" value={form.profile_visits || ''} onChange={e => setForm(p => ({ ...p, profile_visits: Number(e.target.value) }))} />
              <Input type="number" placeholder="Link Clicks" value={form.link_clicks || ''} onChange={e => setForm(p => ({ ...p, link_clicks: Number(e.target.value) }))} />
            </div>

            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Engagement</p>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Likes" value={form.likes || ''} onChange={e => setForm(p => ({ ...p, likes: Number(e.target.value) }))} />
              <Input type="number" placeholder="Saves" value={form.saves || ''} onChange={e => setForm(p => ({ ...p, saves: Number(e.target.value) }))} />
              <Input type="number" placeholder="Shares" value={form.shares || ''} onChange={e => setForm(p => ({ ...p, shares: Number(e.target.value) }))} />
              <Input type="number" placeholder="Comments" value={form.comments || ''} onChange={e => setForm(p => ({ ...p, comments: Number(e.target.value) }))} />
            </div>

            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Content Posted</p>
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" placeholder="Reels" value={form.reels_count || ''} onChange={e => setForm(p => ({ ...p, reels_count: Number(e.target.value) }))} />
              <Input type="number" placeholder="Posts" value={form.posts_count || ''} onChange={e => setForm(p => ({ ...p, posts_count: Number(e.target.value) }))} />
              <Input type="number" placeholder="Stories" value={form.stories_count || ''} onChange={e => setForm(p => ({ ...p, stories_count: Number(e.target.value) }))} />
            </div>

            <Button onClick={handleSubmit} className="w-full">Save Snapshot</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
