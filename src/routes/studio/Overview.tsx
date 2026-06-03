import { useCallback, useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { StudioLayout } from "@/components/studio/StudioLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const CreateEventModal = lazy(() =>
  import("@/components/CreateEventModal").then((m) => ({ default: m.CreateEventModal })),
);

export default function StudioOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadCount = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    setEventCount(count ?? 0);
  }, [user]);

  useEffect(() => {
    void loadCount();
  }, [loadCount]);

  if (eventCount === null) {
    return (
      <StudioLayout>
        <div className="skeleton-block" style={{ height: 160, marginTop: "15vh" }} />
      </StudioLayout>
    );
  }

  if (eventCount > 0) {
    return (
      <StudioLayout>
        <div style={{ marginTop: "15vh", maxWidth: 480 }}>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(28px, 7vw, 36px)",
              fontWeight: 300,
              color: "var(--ink)",
              margin: "0 0 12px",
            }}
          >
            Overview
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 300,
              color: "var(--ink-muted)",
              margin: "0 0 24px",
            }}
          >
            {eventCount} {eventCount === 1 ? "wedding" : "weddings"} in your studio.
          </p>
          <button
            type="button"
            onClick={() => navigate("/studio/weddings")}
            style={{
              padding: "10px 20px",
              borderRadius: 0,
              border: "1px solid var(--border-default)",
              background: "transparent",
              color: "var(--ink)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            View weddings
          </button>
        </div>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout>
      <div style={{ marginTop: "15vh", display: "flex", justifyContent: "center", padding: "0 16px" }}>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          style={{
            width: "100%",
            maxWidth: 360,
            padding: "32px 28px",
            textAlign: "left",
            border: "1px solid var(--border-default)",
            background: "var(--bg-surface)",
            cursor: "pointer",
            borderRadius: 0,
          }}
        >
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 26,
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--ink)",
              margin: "0 0 8px",
            }}
          >
            Begin →
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 300,
              color: "var(--ink-muted)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Create your first wedding gallery and share it with clients.
          </p>
        </button>
      </div>

      {createOpen && (
        <Suspense fallback={null}>
          <CreateEventModal
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={(id) => navigate(`/studio/weddings/${id}`)}
          />
        </Suspense>
      )}
    </StudioLayout>
  );
}
