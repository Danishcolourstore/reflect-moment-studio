import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateEventModal({ open, onOpenChange, onCreated }: CreateEventModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('Wedding');
  const [pin, setPin] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [allowFullDownload, setAllowFullDownload] = useState(true);
  const [allowFavoritesDownload, setAllowFavoritesDownload] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    let coverUrl: string | null = null;

    if (coverFile) {
      const ext = coverFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('event-covers').upload(path, coverFile);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('event-covers').getPublicUrl(path);
        coverUrl = publicUrl;
      }
    }

    const { error } = await supabase.from('events').insert({
      user_id: user.id,
      name,
      event_date: date,
      event_type: type,
      cover_url: coverUrl,
      gallery_pin: pin || null,
      allow_full_download: allowFullDownload,
      allow_favorites_download: allowFavoritesDownload,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Event created' });
      setName(''); setDate(''); setType('Wedding'); setPin(''); setCoverFile(null);
      setAllowFullDownload(true); setAllowFavoritesDownload(true);
      onOpenChange(false);
      onCreated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border p-6">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold">Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3.5 mt-1">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Event Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Aisha & Rahul Wedding" className="bg-background h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Event Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="bg-background h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Event Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-background h-9 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Wedding', 'Pre-Wedding', 'Portrait', 'Corporate', 'Other'].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Cover Photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="bg-background h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Gallery PIN (Optional)</Label>
            <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4-digit PIN" maxLength={6} className="bg-background h-9 text-[13px]" />
          </div>

          {/* Download permissions */}
          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Guest Download Permissions</p>
            <div className="flex items-center justify-between">
              <Label className="text-[12px] text-foreground/80 font-normal">Allow full gallery download</Label>
              <Switch checked={allowFullDownload} onCheckedChange={setAllowFullDownload} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[12px] text-foreground/80 font-normal">Allow favorites download</Label>
              <Switch checked={allowFavoritesDownload} onCheckedChange={setAllowFavoritesDownload} />
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-gold-hover text-primary-foreground h-9 text-[12px] tracking-wide uppercase font-medium mt-1" disabled={loading}>
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
