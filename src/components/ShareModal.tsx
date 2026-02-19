import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  pin?: string | null;
}

export function ShareModal({ open, onOpenChange, eventId, eventName, pin }: ShareModalProps) {
  const { toast } = useToast();
  const galleryUrl = `${window.location.origin}/gallery/${eventId}`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`View the gallery for ${eventName}: ${galleryUrl}${pin ? ` (PIN: ${pin})` : ''}`)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Share Gallery</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Gallery Link</label>
            <div className="flex gap-2">
              <Input value={galleryUrl} readOnly className="bg-background text-sm" />
              <Button variant="outline" size="icon" onClick={() => copy(galleryUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {pin && (
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Link with PIN</label>
              <div className="flex gap-2">
                <Input value={`${galleryUrl}?pin=${pin}`} readOnly className="bg-background text-sm" />
                <Button variant="outline" size="icon" onClick={() => copy(`${galleryUrl}?pin=${pin}`)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <Button asChild className="w-full bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-primary-foreground">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              Share on WhatsApp
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
