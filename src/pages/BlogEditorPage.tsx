import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string | null;
  slug: string | null;
  content: string | null;
  cover_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean;
  created_at: string;
}

const BlogEditorPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [published, setPublished] = useState(false);

  useEffect(() => { document.title = 'MirrorAI — Blog'; }, []);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase.from('blog_posts' as any).select('*') as any)
      .eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setPosts(data as BlogPost[]);
  }, [user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openNew = () => {
    setEditId(null); setTitle(''); setSlug(''); setContent(''); setCoverUrl(''); setSeoTitle(''); setSeoDesc(''); setPublished(false);
    setEditorOpen(true);
  };

  const openEdit = (p: BlogPost) => {
    setEditId(p.id); setTitle(p.title ?? ''); setSlug(p.slug ?? ''); setContent(p.content ?? '');
    setCoverUrl(p.cover_url ?? ''); setSeoTitle(p.seo_title ?? ''); setSeoDesc(p.seo_description ?? '');
    setPublished(p.published);
    setEditorOpen(true);
  };

  const generateSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const row = { user_id: user.id, title, slug: slug || generateSlug(title), content, cover_url: coverUrl || null, seo_title: seoTitle || null, seo_description: seoDesc || null, published, updated_at: new Date().toISOString() } as any;
    if (editId) {
      await (supabase.from('blog_posts' as any).update(row) as any).eq('id', editId);
    } else {
      await (supabase.from('blog_posts' as any).insert(row) as any);
    }
    toast({ title: editId ? 'Post updated' : 'Post created' });
    setSaving(false);
    setEditorOpen(false);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    await (supabase.from('blog_posts' as any).delete() as any).eq('id', id);
    toast({ title: 'Post deleted' });
    setDeleteConfirm(null);
    fetchPosts();
  };

  return (
    <DashboardLayout>
      <div className="page-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-3xl font-semibold text-foreground">Blog</h1>
          <Button onClick={openNew} variant="ghost" size="sm" className="text-primary hover:bg-primary/10 text-[11px] h-7 px-3 uppercase tracking-wider">
            <Plus className="mr-1 h-3 w-3" /> New Post
          </Button>
        </div>

        {posts.length === 0 ? (
          <div className="border border-dashed border-border/60 py-20 text-center">
            <p className="font-serif text-sm text-muted-foreground/60">No blog posts yet</p>
            <p className="mt-1 text-[10px] text-muted-foreground/40">Create your first post to share with your audience.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-card border border-border px-4 py-3">
                <div>
                  <p className="font-serif text-[14px] font-medium text-foreground">{p.title || 'Untitled'}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                    {format(new Date(p.created_at), 'MMM d, yyyy')}
                    {p.published ? <Badge variant="secondary" className="ml-2 text-[9px] px-1.5 py-0">Published</Badge> : <Badge variant="outline" className="ml-2 text-[9px] px-1.5 py-0">Draft</Badge>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(p.id)} className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Editor modal */}
        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="sm:max-w-[560px] bg-card max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">{editId ? 'Edit Post' : 'New Post'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Title</Label>
                <Input value={title} onChange={e => { setTitle(e.target.value); if (!editId) setSlug(generateSlug(e.target.value)); }} className="bg-background h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Slug</Label>
                <Input value={slug} onChange={e => setSlug(e.target.value)} className="bg-background h-9 font-mono text-[12px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Content</Label>
                <Textarea value={content} onChange={e => setContent(e.target.value)} rows={10} className="bg-background text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Cover Image URL</Label>
                <Input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} className="bg-background h-9 text-[12px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/70">SEO Title</Label>
                <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className="bg-background h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/70">SEO Description</Label>
                <Textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} rows={2} className="bg-background text-[12px]" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[12px] text-foreground/80">Published</Label>
                <Switch checked={published} onCheckedChange={setPublished} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground text-[11px] uppercase tracking-wider">
                {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null} {editId ? 'Update Post' : 'Create Post'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-[360px] bg-card">
            <DialogHeader><DialogTitle className="font-serif text-lg">Delete Post?</DialogTitle></DialogHeader>
            <p className="text-[12px] text-muted-foreground/70">This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="text-[11px]">Cancel</Button>
              <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="text-[11px]">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default BlogEditorPage;
