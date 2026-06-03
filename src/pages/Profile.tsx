import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useStorageUsage, formatBytes } from "@/hooks/use-storage-usage";
import { Upload, Loader2 } from "lucide-react";

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
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(17,17,17,0.15)",
  padding: "12px 0",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  fontWeight: 300,
  color: "var(--ink)",
  outline: "none",
  transition: "border-color 0.2s",
  borderRadius: 0,
};

const dividerStyle: React.CSSProperties = {
  height: 1,
  background: "rgba(17,17,17,0.1)",
  margin: "64px 0",
};

const Profile = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    setFullName(user.user_metadata?.full_name || "");
    (supabase.from("profiles").select("avatar_url, studio_name") as any)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setAvatarUrl(data.avatar_url);
          if (!fullName) setFullName(data.studio_name || "");
        }
        setLoading(false);
      });
  }, [user]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("event-covers").upload(path, file, { upsert: true });
    if (!error) {
      const url = supabase.storage.from("event-covers").getPublicUrl(path).data.publicUrl;
      await (supabase.from("profiles").update({ avatar_url: url } as any) as any).eq("user_id", user.id);
      setAvatarUrl(url);
      toast.success("Saved");
    }
    setAvatarUploading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.auth.updateUser({ data: { full_name: fullName } });
    toast.success("Saved");
    setSaving(false);
  };

  const savePassword = async () => {
    if (newPw !== confirmPw) { toast.error("Passwords don't match"); return; }
    if (newPw.length < 6) { toast.error("Use at least 6 characters"); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    }
    setPwSaving(false);
  };

  const pwStrength = () => {
    if (newPw.length === 0) return null;
    if (newPw.length < 6) return { label: "Weak", color: "#A8615B" };
    if (newPw.length < 10 || !/[A-Z]/.test(newPw) || !/\d/.test(newPw))
      return { label: "Fair", color: "#B8953F" };
    return { label: "Strong", color: "#7C9A6B" };
  };

  const storage = useStorageUsage();
  const storageUsed = storage.data?.used ?? 0;
  const storageLimit = storage.data?.limit ?? 0;
  const storagePct = storageLimit > 0 ? Math.min((storageUsed / storageLimit) * 100, 100) : 0;
  const strength = pwStrength();
  const initials = fullName.slice(0, 2).toUpperCase() || "U";

  const focusInput = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderBottomColor = "rgba(184,149,63,0.6)");
  const blurInput = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderBottomColor = "rgba(17,17,17,0.15)");

  const PrimaryButton = ({
    label, onClick, disabled,
  }: { label: string; onClick: () => void; disabled?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "transparent",
        color: "var(--ink)",
        border: "1px solid #B8953F",
        padding: "12px 32px",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        fontWeight: 300,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.2s",
        width: "100%",
      }}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-block" style={{ height: 120, marginBottom: 64 }} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32,
          fontWeight: 300,
          fontStyle: "italic",
          color: "var(--ink)",
          marginBottom: 40,
          letterSpacing: "-0.01em",
        }}>
          You
        </h1>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div
            onClick={() => avatarRef.current?.click()}
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: avatarUrl ? undefined : "var(--ink)",
              backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {!avatarUrl && (
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18,
                fontWeight: 300,
                fontStyle: "italic",
                color: "var(--ivory)",
              }}>
                {initials}
              </span>
            )}
          </div>
          <button
            onClick={() => avatarRef.current?.click()}
            disabled={avatarUploading}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 300,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--ink-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              minHeight: 44,
            }}
          >
            {avatarUploading
              ? <Loader2 size={14} className="animate-spin" />
              : <Upload size={14} strokeWidth={1.5} />}
            Change photo
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }}
          />
        </div>

        {/* Name */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={inputStyle}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </div>

        <div style={{ marginBottom: 40 }}>
          <label style={labelStyle}>Email</label>
          <input value={email} readOnly style={{ ...inputStyle, opacity: 0.4 }} />
        </div>

        <PrimaryButton label={saving ? "Saving…" : "Save"} onClick={saveProfile} disabled={saving} />

        <div style={dividerStyle} />

        {/* Password */}
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 24,
          fontWeight: 300,
          fontStyle: "italic",
          color: "var(--ink)",
          margin: "0 0 24px",
        }}>
          Password
        </h2>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Current</label>
          <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
            style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>New</label>
          <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
            style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
          {strength && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 300, color: strength.color, marginTop: 6 }}>
              {strength.label}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 40 }}>
          <label style={labelStyle}>Confirm</label>
          <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
            style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
          {confirmPw && confirmPw !== newPw && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 300, color: "#A8615B", marginTop: 6 }}>
              Passwords don't match
            </p>
          )}
        </div>

        <PrimaryButton
          label={pwSaving ? "Saving…" : "Update Password"}
          onClick={savePassword}
          disabled={pwSaving || !newPw || newPw !== confirmPw}
        />

        <div style={dividerStyle} />

        {/* Storage */}
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 24,
          fontWeight: 300,
          fontStyle: "italic",
          color: "var(--ink)",
          margin: "0 0 24px",
        }}>
          Storage
        </h2>

        <div style={{ marginBottom: 64 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 32,
            fontWeight: 300,
            fontStyle: "italic",
            color: "var(--ink)",
            margin: 0,
          }}>
            {formatBytes(storageUsed)}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 300, color: "var(--ink-muted)", marginTop: 4 }}>
            of {formatBytes(storageLimit)}
          </p>
          <div style={{ width: "100%", height: 2, background: "rgba(17,17,17,0.1)", marginTop: 16 }}>
            <div style={{
              height: "100%",
              background: "#B8953F",
              width: `${storagePct}%`,
              transition: "width 0.3s ease",
            }} />
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 300, color: "var(--ink-muted)" }}>
              Events: <span style={{ color: "var(--ink)" }}>{storage.data?.eventCount ?? 0}</span>
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 300, color: "var(--ink-muted)" }}>
              Photos: <span style={{ color: "var(--ink)" }}>{storage.data?.photoCount ?? 0}</span>
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Profile;
