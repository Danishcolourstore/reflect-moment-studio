import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminActivity() {
  const [logs, setLogs] = useState<any[]>([]);

  const load = async () => {
    const { data } = await (supabase.from('admin_activity_log' as any).select('*').order('created_at', { ascending: false }) as any);
    setLogs(data || []);
  };

  useEffect(() => { load(); }, []);

  const clearLog = async () => {
    // Delete all rows
    await (supabase.from('admin_activity_log' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000') as any);
    toast.success('Activity log cleared');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Activity Log</h1>
        {logs.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">Clear Log</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Activity Log</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete all activity log entries. Continue?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearLog} className="bg-destructive text-destructive-foreground">Clear All</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">No activity recorded yet</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Action</th>
                <th className="text-left px-4 py-2.5 font-medium">Performed By</th>
                <th className="text-left px-4 py-2.5 font-medium">Target</th>
                <th className="text-left px-4 py-2.5 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((l: any) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5 font-medium">{l.action}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{l.performed_by}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{l.target || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{format(new Date(l.created_at), 'MMM d, yyyy HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
