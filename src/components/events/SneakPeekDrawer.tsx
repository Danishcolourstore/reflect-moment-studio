import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--ink-muted, #6E6E6E)",
  display: "block",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 0,
  border: "1px solid var(--border-default, #333)",
  background: "var(--bg-surface, #111)",
  padding: "12px 14px",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  color: "var(--ink, #FAFAF8)",
  outline: "none",
};

export interface SneakPeekPhoto {
  id: string;
  url: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  ceremonyEndTime: string | null;
  defaultDelayHours: number;
  photos: SneakPeekPhoto[];
  onScheduled: () => void;
}

const DELAY_OPTIONS = [1, 2, 4] as const;

function computeScheduledAt(
  afterCeremony: boolean,
  ceremonyEnd: string | null,
  delayHours: number,
  customDatetime: string,
): string | null {
  if (afterCeremony) {
    if (!ceremonyEnd) return null;
    const d = new Date(ceremonyEnd);
    d.setHours(d.getHours() + delayHours);
    return d.toISOString();
  }
  if (!customDatetime) return null;
  return new Date(customDatetime).toISOString();
}

export function SneakPeekDrawer({
  open,
  onOpenChange,
  eventId,
  ceremonyEndTime,
  defaultDelayHours,
  photos,
  onScheduled,
}: Props) {
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [recipientName, setRecipientName] = useState("");
  const [recipientWhatsApp, setRecipientWhatsApp] = useState("");
  const [afterCeremony, setAfterCeremony] = useState(true);
  const [delayHours, setDelayHours] = useState(defaultDelayHours || 2);
  const [customDatetime, setCustomDatetime] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedIds([]);
    setRecipientName("");
    setRecipientWhatsApp("");
    setAfterCeremony(true);
    setDelayHours(defaultDelayHours || 2);
    setCustomDatetime("");
    setMessage("");
  }, [open, defaultDelayHours]);

  const togglePhoto = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 10) return prev;
      return [...prev, id];
    });
  };

  const canSchedule =
    recipientName.trim().length > 0 &&
    recipientWhatsApp.trim().length > 0 &&
    selectedIds.length >= 1 &&
    computeScheduledAt(afterCeremony, ceremonyEndTime, delayHours, customDatetime) !== null;

  const handleSchedule = async () => {
    if (!user || !canSchedule) return;
    const scheduledAt = computeScheduledAt(
      afterCeremony,
      ceremonyEndTime,
      delayHours,
      customDatetime,
    );
    if (!scheduledAt) {
      toast.error("Set ceremony end time or pick a send date");
      return;
    }

    setSaving(true);
    const { error } = await (supabase.from("sneak_peeks" as any).insert({
      event_id: eventId,
      studio_id: user.id,
      scheduled_at: scheduledAt,
      photo_ids: selectedIds,
      recipient_name: recipientName.trim(),
      recipient_whatsapp: recipientWhatsApp.trim(),
      message: message.trim() || null,
      status: "scheduled",
    } as any) as any);

    setSaving(false);
    if (error) {
      toast.error("Could not schedule sneak peek");
      return;
    }
    toast.success("Sneak peek scheduled");
    onOpenChange(false);
    onScheduled();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-none border-t border-[#333] bg-[#0a0a0a] text-[#FAFAF8]"
      >
        <SheetHeader className="text-left">
          <SheetTitle
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 300,
              fontStyle: "italic",
            }}
          >
            Schedule Sneak Peek
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-8 pb-8">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <span style={labelStyle}>Photos</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#888" }}>
                {selectedIds.length} of 10 selected
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => {
                const selected = selectedIds.includes(photo.id);
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => togglePhoto(photo.id)}
                    className="relative aspect-square overflow-hidden"
                    style={{
                      border: selected ? "2px solid #B8953F" : "1px solid #333",
                    }}
                  >
                    <img src={photo.url} alt="" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <label style={labelStyle}>Recipient name</label>
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                style={inputStyle}
                placeholder="Priya & Arjun"
              />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp number</label>
              <input
                value={recipientWhatsApp}
                onChange={(e) => setRecipientWhatsApp(e.target.value)}
                style={inputStyle}
                placeholder="+91 98765 43210"
              />
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#888" }}>
                Send after ceremony ends
              </span>
              <Switch checked={afterCeremony} onCheckedChange={setAfterCeremony} />
            </div>
            {afterCeremony ? (
              <div className="flex gap-2">
                {DELAY_OPTIONS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDelayHours(h)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 999,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      border: delayHours === h ? "none" : "1px solid #444",
                      background: delayHours === h ? "#FFFFFF" : "transparent",
                      color: delayHours === h ? "#000000" : "#888",
                      cursor: "pointer",
                    }}
                  >
                    {h} hr
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="datetime-local"
                value={customDatetime}
                onChange={(e) => setCustomDatetime(e.target.value)}
                style={inputStyle}
              />
            )}
            {afterCeremony && !ceremonyEndTime && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#A8615B", marginTop: 8 }}>
                Set ceremony end time on the event to use this option.
              </p>
            )}
          </section>

          <section>
            <label style={labelStyle}>Personal note (optional)</label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 300))}
                rows={3}
                placeholder="Add a message for the couple..."
                style={{ ...inputStyle, resize: "vertical", minHeight: 88 }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 8,
                  bottom: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  color: "#666",
                }}
              >
                {message.length}/300
              </span>
            </div>
          </section>

          <button
            type="button"
            disabled={!canSchedule || saving}
            onClick={handleSchedule}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: 0,
              border: "none",
              background: canSchedule ? "#FFFFFF" : "#333",
              color: canSchedule ? "#000000" : "#666",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: canSchedule && !saving ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Scheduling…" : "Schedule sneak peek"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export interface SneakPeekRecord {
  id: string;
  event_id: string;
  scheduled_at: string;
  sent_at: string | null;
  photo_ids: string[];
  recipient_name: string;
  recipient_whatsapp: string;
  message: string | null;
  status: string;
}

function maskWhatsApp(num: string) {
  const digits = num.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  return `•••• ${digits.slice(-4)}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    scheduled: { bg: "rgba(184,149,63,0.15)", color: "#B8953F", label: "Scheduled" },
    sent: { bg: "rgba(124,154,107,0.15)", color: "#7C9A6B", label: "Sent" },
    failed: { bg: "rgba(168,97,91,0.15)", color: "#A8615B", label: "Failed" },
  };
  const s = styles[status] || styles.scheduled;
  return (
    <span
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 9,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        padding: "4px 8px",
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

function Countdown({ target }: { target: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return <span>Sends soon</span>;
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return <span>Sends in {hours}h {minutes}m</span>;
}

export function SneakPeekScheduledCard({
  peek,
  photoMap,
  onSendNow,
  onCancel,
  whatsappUrl,
}: {
  peek: SneakPeekRecord;
  photoMap: Map<string, string>;
  onSendNow: (id: string) => void;
  onCancel: (id: string) => void;
  whatsappUrl?: string | null;
}) {
  const thumbs = peek.photo_ids.slice(0, 4);
  const extra = peek.photo_ids.length - 4;

  if (peek.status === "sent") {
    return (
      <div style={{ border: "1px solid #333", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="flex items-center gap-2">
          <Check size={16} style={{ color: "#7C9A6B" }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#888" }}>
            Sent {peek.sent_at ? formatDistanceToNow(new Date(peek.sent_at), { addSuffix: true }) : ""}
          </span>
          <StatusBadge status="sent" />
        </div>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              padding: "10px 16px",
              border: "1px solid #444",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#FAFAF8",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Open WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #333", padding: 16 }}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {thumbs.map((id) => (
          <img
            key={id}
            src={photoMap.get(id)}
            alt=""
            style={{ width: 40, height: 40, objectFit: "cover" }}
          />
        ))}
        {extra > 0 && (
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#888", padding: "4px 8px", border: "1px solid #333" }}>
            +{extra} more
          </span>
        )}
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#FAFAF8", margin: "0 0 4px" }}>
        {peek.recipient_name} · {maskWhatsApp(peek.recipient_whatsapp)}
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#888", margin: "0 0 12px" }}>
        {peek.status === "scheduled" ? <Countdown target={peek.scheduled_at} /> : peek.status}
      </p>
      <div className="flex items-center gap-3">
        <StatusBadge status={peek.status} />
        {peek.status === "scheduled" && (
          <button
            type="button"
            onClick={() => onSendNow(peek.id)}
            style={{
              padding: "8px 14px",
              border: "1px solid #444",
              background: "transparent",
              color: "#FAFAF8",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Send now
          </button>
        )}
        {peek.status !== "sent" && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Cancel this sneak peek?")) onCancel(peek.id);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
