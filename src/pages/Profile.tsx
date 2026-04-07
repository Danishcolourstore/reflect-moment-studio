import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useStorageUsage, formatBytes } from "@/hooks/use-storage-usage";

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
      toast.success("Avatar updated");
    }
    setAvatarUploading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.auth.updateUser({ data: { full_name: fullName } });
    toast.success("Profile updated");
    setSaving(false);
  };

  const savePassword = async () => {
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    if (newPw.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
    setPwSaving(false);
  };

  const pwStrength = () => {
    if (newPw.length === 0) return null;
    if (newPw.length < 6) return { label: "Weak", color: "#E85D5D" };
    if (newPw.length < 10 || !/[A-Z]/.test(newPw) || !/\d/.test(newPw)) return { label: "Fair", color: "#C8A97E" };
    return { label: "Strong", color: "#5CB85C" };
  };

  const storage = useStorageUsage();
  const storageUsed = storage.data?.used ?? 0;
  const storageLimit = storage.data?.limit ?? 0;
  const storagePct = storageLimit > 0 ? Math.min((storageUsed / storageLimit) * 100, 100) : 0;
  const strength = pwStrength();
  const initials = fullName.slice(0, 2).toUpperCase() || "U";

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 120, background: "#F5F3F0", borderRadius: 12, marginBottom: 16, animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  const fieldLabel = (text: string) => (
    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#AAAAAA", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
      {text}
    </label>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#F5F4F2",
    border: "none",
    borderRadius: 10,
    padding: "12px 14px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "#1C1C1E",
    outline: "none",
  };

  const ghostButton = (label: string, onClick: () => void, disabled?: boolean) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: 44,
        background: "none",
        border: "1px solid #C8A97E",
        borderRadius: 10,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        color: "#C8A97E",
        letterSpacing: "0.08em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = "#C8A97E"; e.currentTarget.style.color = "#FFFFFF"; } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#C8A97E"; }}
    >
      {label}
    </button>
  );

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, color: "#1C1C1E", marginBottom: 32 }}>
          Profile
        </h1>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div
            onClick={() => avatarRef.current?.click()}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: avatarUrl ? undefined : "#C8A97E",
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
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#FFFFFF", fontWeight: 400 }}>
                {initials}
              </span>
            )}
          </div>
          <button
            onClick={() => avatarRef.current?.click()}
            disabled={avatarUploading}
            style={{
              background: "none",
              border: "1px solid #E8E4DE",
              borderRadius: 8,
              padding: "6px 14px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "#999999",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {avatarUploading ? <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} /> : <Upload style={{ width: 12, height: 12 }} />}
            Change Avatar
          </button>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
        </div>

        {/* Personal Info */}
        <div style={{ background: "#FFFFFF", border: "1px solid #F0EDE8", borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "#1C1C1E", marginBottom: 20 }}>
            Personal Information
          </h2>
          <div style={{ marginBottom: 16 }}>
            {fieldLabel("Full Name")}
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            {fieldLabel("Email")}
            <input value={email} readOnly style={{ ...inputStyle, opacity: 0.6 }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontStyle: "italic", color: "#BBBBBB", marginTop: 4 }}>
              Email cannot be changed
            </p>
          </div>
          {ghostButton(saving ? "Saving..." : "Save Changes", saveProfile, saving)}
        </div>

        {/* Password */}
        <div style={{ background: "#FFFFFF", border: "1px solid #F0EDE8", borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "#1C1C1E", marginBottom: 20 }}>
            Change Password
          </h2>
          <div style={{ marginBottom: 16 }}>
            {fieldLabel("Current Password")}
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            {fieldLabel("New Password")}
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={inputStyle} />
            {strength && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: strength.color, marginTop: 4 }}>{strength.label}</p>}
          </div>
          <div style={{ marginBottom: 20 }}>
            {fieldLabel("Confirm Password")}
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} style={inputStyle} />
            {confirmPw && confirmPw !== newPw && <p style={{ fontSize: 10, color: "#E85D5D", marginTop: 4 }}>Passwords do not match</p>}
          </div>
          {ghostButton(pwSaving ? "Updating..." : "Save Password", savePassword, pwSaving || !newPw || newPw !== confirmPw)}
        </div>

        {/* Storage */}
        <div style={{ background: "#FFFFFF", border: "1px solid #F0EDE8", borderRadius: 16, padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "#1C1C1E", marginBottom: 16 }}>
            Storage
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#1C1C1E", fontWeight: 400 }}>{formatBytes(storageUsed)}</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#AAAAAA", marginTop: 2 }}>of {formatBytes(storageLimit)}</p>
          <Progress value={storagePct} className="mt-3 h-1.5" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#AAAAAA" }}>Events: <span style={{ color: "#1C1C1E" }}>{storage.data?.eventCount ?? 0}</span></p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#AAAAAA" }}>Photos: <span style={{ color: "#1C1C1E" }}>{storage.data?.photoCount ?? 0}</span></p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
