/**
 * CheetahQRCard — shows a scannable QR + the short live URL so the photographer
 * can hold their phone up to guests at any point during the shoot.
 */
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function CheetahQRCard({ liveUrl, sessionCode }: { liveUrl: string; sessionCode: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-white border border-[var(--rule)] p-5 flex items-center gap-5">
      <div className="bg-white p-2 border border-[var(--rule)] shrink-0">
        <QRCodeSVG value={liveUrl} size={104} level="M" includeMargin={false} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] font-medium mb-1">Guests scan this</p>
        <p className="text-[12px] text-[var(--ink-muted)] leading-relaxed mb-2">
          Hold your phone up at the venue, or print this on a card. Photos appear live as you shoot.
        </p>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="truncate text-[var(--ink)]">{liveUrl}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(liveUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-[var(--wash-strong)] hover:bg-[var(--wash-strong)]/70 text-[var(--ink-muted)]"
            aria-label="Copy live URL"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
        <p className="text-[10px] text-[var(--ink-whisper)] tracking-wider mt-2">
          Code <span className="font-mono text-[var(--ink-muted)]">{sessionCode}</span>
        </p>
      </div>
    </div>
  );
}
