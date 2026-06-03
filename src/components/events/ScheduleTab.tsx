import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  SneakPeekDrawer,
  SneakPeekScheduledCard,
  type SneakPeekPhoto,
  type SneakPeekRecord,
} from "@/components/events/SneakPeekDrawer";
import { toast } from "sonner";

interface Props {
  eventId: string;
  ceremonyEndTime: string | null;
  sneakPeekDelayHours: number;
  photos: SneakPeekPhoto[];
}

export default function ScheduleTab({
  eventId,
  ceremonyEndTime,
  sneakPeekDelayHours,
  photos,
}: Props) {
  const [peeks, setPeeks] = useState<SneakPeekRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastWhatsappUrl, setLastWhatsappUrl] = useState<string | null>(null);

  const loadPeeks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from("sneak_peeks" as any)
      .select("*")
      .eq("event_id", eventId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }) as any);

    if (error) {
      toast.error("Could not load sneak peeks");
      setPeeks([]);
    } else {
      setPeeks((data as SneakPeekRecord[]) || []);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    void loadPeeks();
  }, [loadPeeks]);

  const photoMap = useMemo(() => new Map(photos.map((p) => [p.id, p.url])), [photos]);

  const activePeek = peeks.find((p) => p.status === "scheduled" || p.status === "failed");
  const sentPeeks = peeks.filter((p) => p.status === "sent");

  const sendNow = async (sneakPeekId: string) => {
    const { data, error } = await supabase.functions.invoke("send-sneak-peek", {
      body: { sneakPeekId },
    });
    if (error || data?.error) {
      toast.error("Send failed");
      void loadPeeks();
      return;
    }
    if (data?.whatsappUrl) setLastWhatsappUrl(data.whatsappUrl);
    toast.success("Sneak peek sent");
    void loadPeeks();
  };

  const cancelPeek = async (id: string) => {
    await (supabase.from("sneak_peeks" as any).update({ status: "cancelled" } as any).eq("id", id) as any);
    toast.success("Sneak peek cancelled");
    void loadPeeks();
  };

  if (loading) {
    return <div className="skeleton-block" style={{ height: 120 }} />;
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink, #1A1917)",
            margin: "0 0 8px",
          }}
        >
          Sneak Peek
        </h3>
        {!activePeek && sentPeeks.length === 0 && (
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 300,
              color: "var(--ink-muted, #6E6E6E)",
              margin: "0 0 16px",
            }}
          >
            Send a first look to the couple after the ceremony
          </p>
        )}
      </div>

      {!activePeek && sentPeeks.length === 0 && (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          style={{
            border: "1px solid #333",
            background: "transparent",
            color: "#888",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "12px 20px",
            cursor: "pointer",
            borderRadius: 0,
          }}
        >
          Schedule Sneak Peek
        </button>
      )}

      {activePeek && (
        <SneakPeekScheduledCard
          peek={activePeek}
          photoMap={photoMap}
          onSendNow={sendNow}
          onCancel={cancelPeek}
        />
      )}

      {sentPeeks.map((peek) => (
        <div key={peek.id} style={{ marginTop: 16 }}>
          <SneakPeekScheduledCard
            peek={peek}
            photoMap={photoMap}
            onSendNow={sendNow}
            onCancel={cancelPeek}
            whatsappUrl={lastWhatsappUrl}
          />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            style={{
              marginTop: 12,
              background: "none",
              border: "none",
              color: "#888",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Schedule another
          </button>
        </div>
      ))}

      <SneakPeekDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        eventId={eventId}
        ceremonyEndTime={ceremonyEndTime}
        defaultDelayHours={sneakPeekDelayHours}
        photos={photos}
        onScheduled={loadPeeks}
      />
    </div>
  );
}
