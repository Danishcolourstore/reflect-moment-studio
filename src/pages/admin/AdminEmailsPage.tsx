import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send } from 'lucide-react';

const AdminEmailsPage = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSend = () => {
    setConfirmOpen(false);
    toast({ title: 'Bulk email queued successfully' });
    setSubject('');
    setMessage('');
  };

  return (
    <div className="page-fade-in">
      <h1 className="font-serif text-2xl font-semibold text-foreground mb-6">Bulk Emails</h1>

      <div className="max-w-lg space-y-5">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Subject</Label>
          <Input value={subject} onChange={e => setSubject(e.target.value)} className="bg-card h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Message</Label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} className="bg-card text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Target Audience</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Photographers</SelectItem>
              <SelectItem value="suspended">Suspended Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setConfirmOpen(true)} disabled={!subject || !message} className="bg-primary text-primary-foreground h-10 text-[11px] uppercase tracking-wider">
          <Send className="mr-1.5 h-3.5 w-3.5" /> Send Bulk Email
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[380px] bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Confirm Send</DialogTitle>
          </DialogHeader>
          <p className="text-[12px] text-muted-foreground/70">
            Are you sure you want to send this email to <strong>{target === 'all' ? 'all photographers' : 'suspended photographers only'}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="text-[11px]">Cancel</Button>
            <Button onClick={handleSend} className="bg-primary text-primary-foreground text-[11px]">Confirm & Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmailsPage;
