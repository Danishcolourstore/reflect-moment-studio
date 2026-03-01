import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

async function logActivity(action: string, target: string) {
  await (supabase.from('admin_activity_log' as any).insert({ action, performed_by: 'Admin', target } as any) as any);
}

export default function AdminEmails() {
  const [subject, setSubject] = useState('');
  const [target, setTarget] = useState('all');
  const [message, setMessage] = useState('');
  const [recipientCount, setRecipientCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [sentEmails, setSentEmails] = useState<any[]>([]);

  useEffect(() => {
    loadSentEmails();
  }, []);

  const loadSentEmails = async () => {
    const { data } = await (supabase.from('bulk_emails' as any).select('*').order('sent_at', { ascending: false }) as any);
    setSentEmails(data || []);
  };

  const getRecipientCount = async () => {
    let query = supabase.from('profiles').select('email', { count: 'exact', head: true }) as any;
    if (target === 'free') query = query.eq('plan', 'free');
    if (target === 'pro') query = query.eq('plan', 'pro');
    const { count } = await query;
    return count || 0;
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }
    const count = await getRecipientCount();
    setRecipientCount(count);
  };

  const confirmSend = async () => {
    setSending(true);
    try {
      // Fetch emails
      let query = supabase.from('profiles').select('email') as any;
      if (target === 'free') query = query.eq('plan', 'free');
      if (target === 'pro') query = query.eq('plan', 'pro');
      const { data: emails } = await query;
      const recipients = (emails || []).filter((e: any) => e.email);

      console.log('Bulk email payload:', { subject, target, message, recipients: recipients.map((e: any) => e.email) });

      // Log to bulk_emails table
      await (supabase.from('bulk_emails' as any).insert({
        subject,
        target: target === 'all' ? 'All Photographers' : target === 'free' ? 'Free Plan Only' : 'Pro Plan Only',
        recipients_count: recipients.length,
        message,
      } as any) as any);

      await logActivity('Bulk email sent', `${subject} to ${recipients.length} recipients`);

      toast.success(`Email sent to ${recipients.length} photographers`);
      setSubject('');
      setMessage('');
      setRecipientCount(0);
      loadSentEmails();
    } finally {
      setSending(false);
    }
  };

  const targetLabel = target === 'all' ? 'All Photographers' : target === 'free' ? 'Free Plan' : 'Pro Plan';

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl font-semibold text-foreground">Bulk Email</h1>

      <div className="max-w-xl space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" className="bg-background" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Target</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Photographers</SelectItem>
              <SelectItem value="free">Free Plan Only</SelectItem>
              <SelectItem value="pro">Pro Plan Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Message</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message…" className="bg-background min-h-[200px]" />
        </div>

        {recipientCount > 0 ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full">Confirm Send</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Send Email</AlertDialogTitle>
                <AlertDialogDescription>You are about to send an email to {recipientCount} photographers. Confirm?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setRecipientCount(0)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmSend} disabled={sending}>
                  {sending ? 'Sending…' : 'Send'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button onClick={handleSend} className="w-full">Send Email</Button>
        )}
      </div>

      {/* Sent emails log */}
      <div>
        <h3 className="font-serif text-base font-semibold mb-3">Sent Emails</h3>
        {sentEmails.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No emails sent yet</p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-[12px]">
              <thead className="bg-secondary/30">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Subject</th>
                  <th className="text-left px-4 py-2.5 font-medium">Target</th>
                  <th className="text-left px-4 py-2.5 font-medium">Recipients</th>
                  <th className="text-left px-4 py-2.5 font-medium">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sentEmails.map((e: any) => (
                  <tr key={e.id}>
                    <td className="px-4 py-2.5 font-medium">{e.subject}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{e.target}</td>
                    <td className="px-4 py-2.5">{e.recipients_count}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{format(new Date(e.sent_at), 'MMM d, yyyy HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
