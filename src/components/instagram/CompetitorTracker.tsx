import { useState } from 'react';
import { InstagramCompetitor, InstagramSnapshot } from '@/hooks/use-instagram-intelligence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users, Heart, MessageCircle, Film, RefreshCw, ArrowUp, ArrowDown, Zap } from 'lucide-react';

interface CompetitorTrackerProps {
  competitors: InstagramCompetitor[];
  latestSnapshot: InstagramSnapshot | null;
  onAddCompetitor: (data: Partial<InstagramCompetitor>) => void;
  onUpdateCompetitor: (id: string, data: Partial<InstagramCompetitor>) => void;
  onRemoveCompetitor: (id: string) => void;
}

export function CompetitorTracker({ competitors, latestSnapshot, onAddCompetitor, onUpdateCompetitor, onRemoveCompetitor }: CompetitorTrackerProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: '', display_name: '', followers: 0, avg_likes: 0,
    avg_comments: 0, posts_per_week: 0, reels_percentage: 0, content_focus: 'mixed',
  });

  const handleAdd = () => {
    if (!form.username.trim()) return;
    onAddCompetitor(form);
    resetForm();
    setAddOpen(false);
  };

  const handleUpdate = () => {
    if (!editId) return;
    onUpdateCompetitor(editId, form);
    resetForm();
    setEditId(null);
  };

  const openEdit = (c: InstagramCompetitor) => {
    setForm({
      username: c.username, display_name: c.display_name || '',
      followers: c.followers, avg_likes: c.avg_likes, avg_comments: c.avg_comments,
      posts_per_week: c.posts_per_week, reels_percentage: c.reels_percentage,
      content_focus: c.content_focus || 'mixed',
    });
    setEditId(c.id);
  };

  const resetForm = () => {
    setForm({ username: '', display_name: '', followers: 0, avg_likes: 0, avg_comments: 0, posts_per_week: 0, reels_percentage: 0, content_focus: 'mixed' });
  };

  // Gap analysis
  const gaps: string[] = [];
  if (latestSnapshot && competitors.length > 0) {
    const avgCompPosts = competitors.reduce((s, c) => s + c.posts_per_week, 0) / competitors.length;
    const userPosts = latestSnapshot.reels_count + latestSnapshot.posts_count;
    const userPostsWeekly = latestSnapshot.period === 'weekly' ? userPosts : userPosts / 4;

    if (avgCompPosts > userPostsWeekly * 1.3) gaps.push(`You post ~${userPostsWeekly.toFixed(0)}/week vs competitor avg ${avgCompPosts.toFixed(0)}/week`);

    const avgReelsPct = competitors.reduce((s, c) => s + c.reels_percentage, 0) / competitors.length;
    const userReelsPct = userPosts > 0 ? (latestSnapshot.reels_count / userPosts) * 100 : 0;
    if (avgReelsPct > userReelsPct + 20) gaps.push(`Competitors use ${avgReelsPct.toFixed(0)}% reels — you use ${userReelsPct.toFixed(0)}%`);

    const avgCompFollowers = competitors.reduce((s, c) => s + c.followers, 0) / competitors.length;
    if (avgCompFollowers > latestSnapshot.followers * 1.5) gaps.push(`Average competitor has ${avgCompFollowers.toLocaleString()} followers vs your ${latestSnapshot.followers.toLocaleString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{competitors.length} competitor{competitors.length !== 1 ? 's' : ''} tracked</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Competitor
        </Button>
      </div>

      {competitors.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <p className="mt-3 font-serif text-lg text-foreground">Track Competitors</p>
          <p className="text-sm text-muted-foreground">Add competitor Instagram profiles to compare</p>
        </div>
      ) : (
        <>
          {/* Competitor Cards */}
          <div className="space-y-3">
            {competitors.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">@{c.username}</p>
                    {c.display_name && <p className="text-xs text-muted-foreground">{c.display_name}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}>
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onRemoveCompetitor(c.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Users className="h-3 w-3" />Followers</p>
                    <p className="text-sm font-medium text-foreground">{c.followers.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Heart className="h-3 w-3" />Avg Likes</p>
                    <p className="text-sm font-medium text-foreground">{c.avg_likes.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><MessageCircle className="h-3 w-3" />Comments</p>
                    <p className="text-sm font-medium text-foreground">{c.avg_comments}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Film className="h-3 w-3" />Reels</p>
                    <p className="text-sm font-medium text-foreground">{c.reels_percentage}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-[10px]">{c.posts_per_week} posts/week</Badge>
                  {c.content_focus && <Badge variant="outline" className="text-[10px]">{c.content_focus}</Badge>}
                </div>

                {/* Comparison */}
                {latestSnapshot && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">vs You</p>
                    <div className="flex gap-3 text-xs">
                      <span className={`inline-flex items-center gap-1 ${c.followers > latestSnapshot.followers ? 'text-destructive' : 'text-green-600'}`}>
                        {c.followers > latestSnapshot.followers ? <ArrowUp size={12} strokeWidth={1.5} /> : <ArrowDown size={12} strokeWidth={1.5} />}
                        {Math.abs(c.followers - latestSnapshot.followers).toLocaleString()} followers
                      </span>
                      <span className={`inline-flex items-center gap-1 ${c.avg_likes > latestSnapshot.likes ? 'text-destructive' : 'text-green-600'}`}>
                        {c.avg_likes > latestSnapshot.likes ? <ArrowUp size={12} strokeWidth={1.5} /> : <ArrowDown size={12} strokeWidth={1.5} />}
                        {Math.abs(c.avg_likes - latestSnapshot.likes)} avg likes
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Gap Analysis */}
          {gaps.length > 0 && (
            <div className="bg-card border border-yellow-500/20 rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wider text-yellow-600 mb-2 inline-flex items-center gap-1.5"><Zap size={12} strokeWidth={1.5} /> Gap Analysis</p>
              <div className="space-y-1.5">
                {gaps.map((g, i) => (
                  <p key={i} className="text-sm text-foreground">• {g}</p>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen || !!editId} onOpenChange={v => { if (!v) { setAddOpen(false); setEditId(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{editId ? 'Update Competitor' : 'Add Competitor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Instagram username *" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.replace('@', '') }))} disabled={!!editId} />
            <Input placeholder="Display name" value={form.display_name} onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Followers" value={form.followers || ''} onChange={e => setForm(p => ({ ...p, followers: Number(e.target.value) }))} />
              <Input type="number" placeholder="Avg Likes/Post" value={form.avg_likes || ''} onChange={e => setForm(p => ({ ...p, avg_likes: Number(e.target.value) }))} />
              <Input type="number" placeholder="Avg Comments" value={form.avg_comments || ''} onChange={e => setForm(p => ({ ...p, avg_comments: Number(e.target.value) }))} />
              <Input type="number" placeholder="Posts/Week" value={form.posts_per_week || ''} onChange={e => setForm(p => ({ ...p, posts_per_week: Number(e.target.value) }))} />
              <Input type="number" placeholder="Reels %" value={form.reels_percentage || ''} onChange={e => setForm(p => ({ ...p, reels_percentage: Number(e.target.value) }))} />
              <Select value={form.content_focus} onValueChange={v => setForm(p => ({ ...p, content_focus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="weddings">Weddings</SelectItem>
                  <SelectItem value="portraits">Portraits</SelectItem>
                  <SelectItem value="reels-heavy">Reels Heavy</SelectItem>
                  <SelectItem value="candid">Candid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={editId ? handleUpdate : handleAdd} disabled={!editId && !form.username.trim()} className="w-full">
              {editId ? 'Update' : 'Add Competitor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
