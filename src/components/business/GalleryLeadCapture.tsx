import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, X } from 'lucide-react';

interface GalleryLeadCaptureProps {
  photographerId: string;
  eventId: string;
  eventName: string;
  onComplete?: () => void;
  trigger?: 'download' | 'cta';
}

export function GalleryLeadCapture({ photographerId, eventId, eventName, onComplete, trigger = 'cta' }: GalleryLeadCaptureProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from('leads').insert({
      photographer_id: photographerId,
      name: name.trim(),
      phone: phone.trim() || null,
      source_type: 'gallery',
      source_event_id: eventId,
      source_event_name: eventName,
      status: 'new',
    } as any);

    setSubmitting(false);

    if (!error) {
      toast.success('Thank you for your interest!');
      setOpen(false);
      onComplete?.();
    }
  };

  if (trigger === 'download') {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-xs">
          Download
        </Button>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Get your photos</DialogTitle>
            <DialogDescription>Enter your details to download</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            <Input placeholder="WhatsApp number" value={phone} onChange={e => setPhone(e.target.value)} />
            <Button onClick={handleSubmit} disabled={!name.trim() || submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Continue to Download'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2"
        size="sm"
      >
        <Camera className="h-4 w-4" />
        Book This Photographer
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Interested in booking?</DialogTitle>
            <DialogDescription>Share your details and we'll get in touch</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Your name *" value={name} onChange={e => setName(e.target.value)} />
            <Input placeholder="WhatsApp number" value={phone} onChange={e => setPhone(e.target.value)} />
            <Button onClick={handleSubmit} disabled={!name.trim() || submitting} className="w-full">
              {submitting ? 'Sending...' : 'Send Inquiry'}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">We'll respond within 24 hours</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
