import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, MessageCircle, Download, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventSlug: string;
  eventName: string;
  pin?: string | null;
}

export function ShareModal({ open, onOpenChange, eventSlug, eventName, pin }: ShareModalProps) {
  const { toast } = useToast();
  const galleryUrl = `${window.location.origin}/event/${eventSlug}`;
  const fullUrl = pin ? `${galleryUrl}?pin=${pin}` : galleryUrl;
  const [copied, setCopied] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const copyWithFeedback = useCallback((text: string, isPinLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isPinLink) {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    toast({ title: 'Link copied' });
  }, [toast]);

  const downloadQR = useCallback(() => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(img, 0, 0, 512, 512);
      }
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = 'mirrorai-event-qr.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const whatsappMessage = `View photos from ${eventName} here: ${fullUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border p-6">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold">Share</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-2 py-3">
            <div ref={qrRef} className="bg-white p-3 rounded">
              <QRCodeSVG
                value={fullUrl}
                size={140}
                level="M"
                bgColor="#ffffff"
                fgColor="#1a1612"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={downloadQR}
              className="text-[10px] uppercase tracking-[0.08em] text-primary hover:bg-primary/10 h-7 px-3">
              <Download className="mr-1 h-3 w-3" /> Download QR Code
            </Button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Gallery Link</label>
            <div className="flex gap-1.5">
              <Input value={galleryUrl} readOnly className="bg-background h-9 text-[12px] font-mono" />
              <Button variant="outline" size="icon" onClick={() => copyWithFeedback(galleryUrl, false)} className="h-9 w-9 shrink-0">
                {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          {pin && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Link with PIN</label>
              <div className="flex gap-1.5">
                <Input value={`${galleryUrl}?pin=${pin}`} readOnly className="bg-background h-9 text-[12px] font-mono" />
                <Button variant="outline" size="icon" onClick={() => copyWithFeedback(`${galleryUrl}?pin=${pin}`, true)} className="h-9 w-9 shrink-0">
                  {copiedPin ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
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
