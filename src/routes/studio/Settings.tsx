import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { StudioLayout } from "@/components/studio/StudioLayout";
import { ScrollableTabBar } from "@/components/studio/ScrollableTabBar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

type SettingsTab = "profile" | "gallery" | "notifications";

const TABS = [
  { id: "profile", label: "Studio Profile" },
  { id: "gallery", label: "Gallery Defaults" },
  { id: "notifications", label: "Noti" },
] as const;

const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 11,
  fontWeight: 300,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "var(--ink-muted)",
  display: "block",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 0,
  border: "1px solid var(--border-default)",
  background: "var(--bg-surface)",
  padding: "12px 14px",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  fontWeight: 300,
  color: "var(--ink)",
  outline: "none",
};

function SaveChangesButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  const isDark =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 20px",
        borderRadius: 0,
        border: "none",
        cursor: saving ? "not-allowed" : "pointer",
        opacity: saving ? 0.6 : 1,
        background: isDark ? "#FFFFFF" : "#000000",
        color: isDark ? "#000000" : "#FFFFFF",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      <Check size={14} strokeWidth={2} />
      {saving ? "Saving…" : "Save changes"}
    </button>
  );
}

export default function StudioSettings() {
  const { user } = useAuth();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [studioName, setStudioName] = useState("");
  const [galleryLayout, setGalleryLayout] = useState("masonry");
  const [notifyFavorites, setNotifyFavorites] = useState(true);
  const [notifyDownloads, setNotifyDownloads] = useState(true);

  useEffect(() => {
    if (!user) return;
    (supabase.from("profiles").select("studio_name") as any)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.studio_name) setStudioName(data.studio_name);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (tab === "profile") {
        await (supabase.from("profiles").update({ studio_name: studioName.trim() } as any) as any).eq(
          "user_id",
          user.id,
        );
      }
      toast.success("Saved");
    } catch {
      toast.error("Could not save — try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudioLayout>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(26px, 6vw, 32px)",
            fontWeight: 300,
            color: "var(--ink)",
            margin: "0 0 24px",
          }}
        >
          Settings
        </h1>

        <ScrollableTabBar tabs={[...TABS]} activeId={tab} onChange={(id) => setTab(id as SettingsTab)} />

        <div style={{ marginTop: 32 }}>
          {tab === "profile" && (
            <div>
              <label style={labelStyle}>Studio name</label>
              <input
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          {tab === "gallery" && (
            <div>
              <label style={labelStyle}>Default layout</label>
              <select
                value={galleryLayout}
                onChange={(e) => setGalleryLayout(e.target.value)}
                style={inputStyle}
              >
                <option value="masonry">Masonry</option>
                <option value="grid">Grid</option>
                <option value="editorial">Editorial</option>
              </select>
            </div>
          )}

          {tab === "notifications" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "var(--ink)",
                }}
              >
                <input
                  type="checkbox"
                  checked={notifyFavorites}
                  onChange={(e) => setNotifyFavorites(e.target.checked)}
                />
                Email when guests submit favorites
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "var(--ink)",
                }}
              >
                <input
                  type="checkbox"
                  checked={notifyDownloads}
                  onChange={(e) => setNotifyDownloads(e.target.checked)}
                />
                Email when clients download photos
              </label>
            </div>
          )}
        </div>

        <div style={{ marginTop: 40 }}>
          <SaveChangesButton saving={saving} onClick={handleSave} />
        </div>
      </div>
    </StudioLayout>
  );
}
