import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Pin, PinOff, Save, X, Loader2,
  Megaphone, Gift, ShoppingBag, Lightbulb, Star, Smile, ArrowLeft,
} from 'lucide-react';

interface ReflectionPost {
  id: string;
  title: string;
  body: string | null;
  description: string | null;
  image_url: string | null;
  card_type: string;
  content_type: string;
  tag: string | null;
  cta_label: string | null;
  cta_text: string | null;
  cta_action: string | null;
  cta_route: string | null;
  cta_link: string | null;
  tab: string;
  is_today: boolean;
  is_active: boolean;
  is_published: boolean;
  is_pinned: boolean;
  sort_order: number;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

const CONTENT_TYPES = [
  { value: 'announcement', label: 'Announcement', icon: Megaphone },
  { value: 'offer', label: 'Offer', icon: Gift },
  { value: 'product', label: 'Product', icon: ShoppingBag },
  { value: 'tip', label: 'Tip', icon: Lightbulb },
  { value: 'inspiration', label: 'Inspiration', icon: Star },
  { value: 'fun', label: 'Fun', icon: Smile },
];

const TABS = [
  { value: 'for_you', label: 'For You' },
  { value: 'latest', label: 'Latest' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'learn', label: 'Learn' },
];

const EMPTY_FORM: Partial<ReflectionPost> = {
  title: '',
  body: '',
  description: '',
  image_url: '',
  content_type: 'announcement',
  card_type: 'announcements',
  tag: 'new',
  tab: 'for_you',
  cta_label: '',
  cta_text: '',
  cta_action: 'route',
  cta_route: '',
  cta_link: '',
  is_published: false,
  is_pinned: false,
  is_today: false,
  sort_order: 0,
  scheduled_at: null,
};

// Map content_type to card_type for feed compatibility
function contentTypeToCardType(ct: string): string {
  const map: Record<string, string> = {
    announcement: 'announcements',
    offer: 'offers',
    product: 'products',
    tip: 'tips',
    inspiration: 'inspiration',
    fun: 'fun',
  };
  return map[ct] || ct;
}

export default function SuperAdminReflections() {
  const [posts, setPosts] = useState<ReflectionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<ReflectionPost> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase.from('reflections_posts' as any).select('*') as any)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load posts');
    setPosts((data || []) as ReflectionPost[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleNew = () => {
    setEditingPost({ ...EMPTY_FORM });
    setIsNew(true);
  };

  const handleEdit = (post: ReflectionPost) => {
    setEditingPost({ ...post });
    setIsNew(false);
  };

  const handleCancel = () => {
    setEditingPost(null);
    setIsNew(false);
  };

  const handleSave = async (publish: boolean) => {
    if (!editingPost?.title?.trim()) { toast.error('Title is required'); return; }
    setSaving(true);

    const payload = {
      title: editingPost.title,
      body: editingPost.body || null,
      description: editingPost.description || editingPost.body || null,
      image_url: editingPost.image_url || null,
      content_type: editingPost.content_type || 'announcement',
      card_type: contentTypeToCardType(editingPost.content_type || 'announcement'),
      tag: editingPost.tag || 'new',
      tab: editingPost.tab || 'for_you',
      cta_label: editingPost.cta_text || editingPost.cta_label || null,
      cta_text: editingPost.cta_text || null,
      cta_action: editingPost.cta_link ? 'route' : (editingPost.cta_action || null),
      cta_route: editingPost.cta_link || editingPost.cta_route || null,
      cta_link: editingPost.cta_link || null,
      is_published: publish,
      is_active: publish,
      is_pinned: editingPost.is_pinned || false,
      is_today: editingPost.is_today || false,
      sort_order: editingPost.sort_order || 0,
      scheduled_at: editingPost.scheduled_at || null,
    };

    let error;
    if (isNew) {
      ({ error } = await (supabase.from('reflections_posts' as any).insert(payload) as any));
    } else {
      ({ error } = await (supabase.from('reflections_posts' as any).update(payload) as any).eq('id', editingPost.id));
    }

    setSaving(false);
    if (error) { toast.error('Failed to save: ' + error.message); return; }
    toast.success(publish ? 'Published!' : 'Draft saved');
    setEditingPost(null);
    setIsNew(false);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await (supabase.from('reflections_posts' as any).delete() as any).eq('id', id);
    toast.success('Post deleted');
    fetchPosts();
  };

  const handleTogglePublish = async (post: ReflectionPost) => {
    const next = !post.is_published;
    await (supabase.from('reflections_posts' as any).update({
      is_published: next,
      is_active: next,
    }) as any).eq('id', post.id);
    toast.success(next ? 'Published' : 'Unpublished');
    fetchPosts();
  };

  const handleTogglePin = async (post: ReflectionPost) => {
    await (supabase.from('reflections_posts' as any).update({
      is_pinned: !post.is_pinned,
    }) as any).eq('id', post.id);
    toast.success(post.is_pinned ? 'Unpinned' : 'Pinned');
    fetchPosts();
  };

  // ─── Editor Form ───
  if (editingPost) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">
            {isNew ? 'Create Post' : 'Edit Post'}
          </h2>
        </div>

        <div className="grid gap-5 max-w-2xl">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              value={editingPost.title || ''}
              onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
              placeholder="Post title"
            />
          </div>

          {/* Description / Body */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={editingPost.body || editingPost.description || ''}
              onChange={(e) => setEditingPost({ ...editingPost, body: e.target.value, description: e.target.value })}
              placeholder="Post content..."
              rows={4}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label>Image URL</Label>
            <Input
              value={editingPost.image_url || ''}
              onChange={(e) => setEditingPost({ ...editingPost, image_url: e.target.value })}
              placeholder="https://..."
            />
            {editingPost.image_url && (
              <img src={editingPost.image_url} alt="Preview" className="mt-2 h-32 w-auto rounded-lg object-cover" loading="lazy" decoding="async" />
            )}
          </div>

          {/* Content Type + Tab */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Content Type</Label>
              <Select
                value={editingPost.content_type || 'announcement'}
                onValueChange={(v) => setEditingPost({ ...editingPost, content_type: v, card_type: contentTypeToCardType(v) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Feed Tab</Label>
              <Select
                value={editingPost.tab || 'for_you'}
                onValueChange={(v) => setEditingPost({ ...editingPost, tab: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TABS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>CTA Text</Label>
              <Input
                value={editingPost.cta_text || editingPost.cta_label || ''}
                onChange={(e) => setEditingPost({ ...editingPost, cta_text: e.target.value, cta_label: e.target.value })}
                placeholder="e.g. Try Now"
              />
            </div>
            <div className="space-y-1.5">
              <Label>CTA Link / Route</Label>
              <Input
                value={editingPost.cta_link || editingPost.cta_route || ''}
                onChange={(e) => setEditingPost({ ...editingPost, cta_link: e.target.value, cta_route: e.target.value })}
                placeholder="/dashboard/feature or https://..."
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={editingPost.is_pinned || false}
                onCheckedChange={(v) => setEditingPost({ ...editingPost, is_pinned: v })}
              />
              <Label>Pinned</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editingPost.is_today || false}
                onCheckedChange={(v) => setEditingPost({ ...editingPost, is_today: v })}
              />
              <Label>Show in "Today"</Label>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-1.5">
            <Label>Schedule (optional)</Label>
            <Input
              type="datetime-local"
              value={editingPost.scheduled_at ? new Date(editingPost.scheduled_at).toISOString().slice(0, 16) : ''}
              onChange={(e) => setEditingPost({ ...editingPost, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
            </Button>
            <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
              Publish
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Posts List ───
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reflections Manager</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage community feed content</p>
        </div>
        <Button onClick={handleNew} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Post
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl bg-muted skeleton-block" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-24 text-center">
          <h2 className="font-serif text-[28px] font-light text-foreground leading-tight">No content.</h2>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => {
            const typeConfig = CONTENT_TYPES.find(c => c.value === post.content_type) || CONTENT_TYPES[0];
            const TypeIcon = typeConfig.icon;

            return (
              <Card key={post.id} className="hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.is_pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                        <h3 className="text-sm font-medium text-foreground truncate">{post.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[9px] gap-1">
                          <TypeIcon className="h-2.5 w-2.5" /> {typeConfig.label}
                        </Badge>
                        <Badge variant={post.is_published ? 'default' : 'secondary'} className="text-[9px]">
                          {post.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {post.is_today && <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">Today</Badge>}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTogglePin(post)} title={post.is_pinned ? 'Unpin' : 'Pin'}>
                        {post.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTogglePublish(post)} title={post.is_published ? 'Unpublish' : 'Publish'}>
                        {post.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(post)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
