import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { RefreshCw, Trash2, BookOpen } from 'lucide-react';

interface StorybookRow {
  id: string;
  title: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  ownerEmail?: string;
}

export default function SuperAdminStorybooks() {
  const { user: me } = useAuth();
  const [books, setBooks] = useState<StorybookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<StorybookRow | null>(null);

  const load = async () => {
    setLoading(true);
    const [booksRes, profilesRes] = await Promise.all([
      supabase.from('storybooks').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, email'),
    ]);

    const emailMap: Record<string, string> = {};
    (profilesRes.data || []).forEach((p: any) => { emailMap[p.user_id] = p.email; });

    setBooks((booksRes.data || []).map((b: any) => ({
      ...b,
      ownerEmail: emailMap[b.user_id] || 'Unknown',
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteStorybook = async (b: StorybookRow) => {
    await supabase.from('storybook_blocks').delete().eq('storybook_id', b.id);
    await supabase.from('storybooks').delete().eq('id', b.id);
    await supabase.from('admin_activity_log').insert({
      action: 'delete_storybook', target: b.title,
      performed_by: me?.email || 'super_admin',
    });
    toast.success('Storybook deleted');
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Storybook Control</h1>
          <p className="text-sm text-muted-foreground">{books.length} total storybooks</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Owner</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Created</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Updated</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : books.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No storybooks found</td></tr>
                ) : books.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="p-3 font-medium">{b.title}</td>
                    <td className="p-3 text-xs font-mono">{b.ownerEmail}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-[10px] ${b.status === 'published' ? 'border-green-500/40 text-green-500' : 'border-muted-foreground/40'}`}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(b.updated_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(b)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Storybook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}" and all its blocks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteStorybook(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
