import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useEventQR } from '@/hooks/useEventQR';
import { Copy, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const SmartQRAccess = ({ eventId }: { eventId: string }) => {
  const [enabled, setEnabled] = useState(false);
  const [faceEnabled, setFaceEnabled] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [expiry, setExpiry] = useState('7');
  const { generateQRToken, disableQR, loading } = useEventQR(eventId);
  const guestUrl = token ? `${window.location.origin}/find/${token}` : null;

  useEffect(() => {
    (supabase
      .from('events')
      .select('qr_token, qr_enabled, guest_face_enabled')
      .eq('id', eventId)
      .single() as any)
      .then(({ data }: any) => {
        if (data) {
          setEnabled(data.qr_enabled || false);
          setFaceEnabled(data.guest_face_enabled || false);
          setToken(data.qr_token || null);
        }
      });
  }, [eventId]);

  const handleToggle = async (val: boolean) => {
    setEnabled(val);
    if (val) {
      const t = await generateQRToken(parseInt(expiry));
      if (t) setToken(t);
    } else {
      await disableQR();
      setToken(null);
    }
  };

  const handleFaceToggle = async (val: boolean) => {
    setFaceEnabled(val);
    await (supabase
      .from('events')
      .update({ guest_face_enabled: val } as any)
      .eq('id', eventId) as any);
  };

  const downloadQR = () => {
    const svg = document.getElementById('event-qr-code');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'guest-qr.svg';
    a.click();
  };

  return (
    <div className="space-y-4 pt-2 border-t border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <div>
            <Label className="text-[12px] text-foreground/80 font-normal">Smart QR Access</Label>
            <p className="text-[10px] text-muted-foreground/50">Guests scan to find their photos instantly</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} disabled={loading} />
      </div>

      {enabled && (
        <div className="space-y-4 pl-6">
          {guestUrl && (
            <div className="space-y-3">
              <div className="flex justify-center">
                <QRCodeSVG
                  id="event-qr-code"
                  value={guestUrl}
                  size={160}
                  bgColor="transparent"
                  fgColor="currentColor"
                  className="text-foreground"
                />
              </div>
              <p className="text-[10px] text-center text-muted-foreground font-mono break-all">{guestUrl}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(guestUrl);
                    toast.success('Link copied');
                  }}
                  className="flex-1 gap-1.5 text-[11px]"
                >
                  <Copy className="h-3 w-3" /> Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadQR}
                  className="flex-1 gap-1.5 text-[11px]"
                >
                  <Download className="h-3 w-3" /> Download QR
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Link Expiry</Label>
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger className="h-9 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">24 Hours</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="365">1 Year</SelectItem>
                <SelectItem value="0">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[12px] text-foreground/80 font-normal flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> AI Face Matching
              </Label>
              <p className="text-[10px] text-muted-foreground/50">Guests upload a selfie — AI finds their photos</p>
            </div>
            <Switch checked={faceEnabled} onCheckedChange={handleFaceToggle} />
          </div>
        </div>
      )}
    </div>
  );
};
