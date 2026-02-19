import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, MessageCircle, Instagram, Facebook, ExternalLink } from 'lucide-react';

interface PhotoShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoUrl: string;
  photoName?: string | null;
  eventName?: string;
  canDownload?: boolean;
}

export function PhotoShareSheet({
  open,
  onOpenChange,
  photoUrl,
  photoName,
  eventName,
  canDownload = true,
}: PhotoShareSheetProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareUrl = photoUrl;
  const shareText = eventName ? `Check out this photo from ${eventName}` : 'Check out this photo';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: 'Share link copied', description: 'Link has been copied to your clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`, '_blank');
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleInstagram = () => {
    // Instagram doesn't support direct URL sharing — guide user to download & share
    if (canDownload) {
      const a = document.createElement('a');
      a.href = photoUrl;
      a.download = photoName ?? 'photo.jpg';
      a.click();
      toast({
        title: 'Photo downloaded',
        description: 'Open Instagram and share from your camera roll.',
      });
    } else {
      toast({
        title: 'Download restricted',
        description: 'Contact the photographer for the original file.',
      });
    }
  };

  const handleDownloadShare = () => {
    if (!canDownload) {
      toast({ title: 'Download restricted', description: 'Downloads are disabled for this gallery.' });
      return;
    }
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = photoName ?? 'photo.jpg';
    a.click();
    toast({ title: 'Photo downloaded', description: 'Share it on any platform.' });
  };

  const shareOptions = [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      onClick: handleWhatsApp,
    },
    {
      label: 'Instagram Story',
      icon: Instagram,
      onClick: handleInstagram,
      hint: canDownload ? 'Download & share to story' : 'Restricted',
    },
    {
      label: 'Facebook',
      icon: Facebook,
      onClick: handleFacebook,
    },
    {
      label: 'Copy Link',
      icon: Copy,
      onClick: handleCopyLink,
      hint: copied ? 'Copied!' : undefined,
    },
    {
      label: 'Download & Share',
      icon: Download,
      onClick: handleDownloadShare,
      disabled: !canDownload,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-background border-border p-0 gap-0">
        {/* Preview */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={photoUrl}
            alt=""
            className={`h-full w-full object-cover ${!canDownload ? 'blur-[1px] opacity-80' : ''}`}
          />
          {!canDownload && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-serif text-card/40 text-2xl rotate-[-20deg] select-none tracking-[0.15em] drop-shadow-sm">
                PREVIEW
              </span>
            </div>
          )}
        </div>

        <DialogHeader className="px-5 pt-4 pb-2">
          <DialogTitle className="font-serif text-base font-medium text-foreground">Share Photo</DialogTitle>
          {eventName && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">{eventName}</p>
          )}
        </DialogHeader>

        {/* Share options */}
        <div className="px-5 pb-5 space-y-1.5">
          {shareOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.onClick}
              disabled={opt.disabled}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                <opt.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[12px] font-medium text-foreground">{opt.label}</span>
                {opt.hint && (
                  <p className="text-[9px] text-muted-foreground/50 mt-px">{opt.hint}</p>
                )}
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground/30 flex-shrink-0" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
