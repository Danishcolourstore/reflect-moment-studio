import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

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
  const fullUrl = pin ? `${galleryUrl}?pin=${pin}` : galleryUrl;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`View the gallery for ${eventName}: ${fullUrl}`)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border p-6">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold">Share Gallery</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          {/* QR Code */}
          <div className="flex justify-center py-3">
            <div className="bg-white p-3 rounded">
              <QRCodeSVG
                value={fullUrl}
                size={140}
                level="M"
                bgColor="#ffffff"
                fgColor="#1a1612"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Gallery Link</label>
            <div className="flex gap-1.5">
              <Input value={galleryUrl} readOnly className="bg-background h-9 text-[12px] font-mono" />
              <Button variant="outline" size="icon" onClick={() => copy(galleryUrl)} className="h-9 w-9 shrink-0">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {pin && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Link with PIN</label>
              <div className="flex gap-1.5">
                <Input value={`${galleryUrl}?pin=${pin}`} readOnly className="bg-background h-9 text-[12px] font-mono" />
                <Button variant="outline" size="icon" onClick={() => copy(`${galleryUrl}?pin=${pin}`)} className="h-9 w-9 shrink-0">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
          <Button asChild className="w-full bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-primary-foreground h-9 text-[12px] tracking-wide uppercase font-medium">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              Share on WhatsApp
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
