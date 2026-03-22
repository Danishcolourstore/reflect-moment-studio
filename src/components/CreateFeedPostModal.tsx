import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const mont = '"Montserrat", sans-serif';
const playfair = '"Playfair Display", serif';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export default function CreateFeedPostModal({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user || !title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/feed/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("studio-website-assets")
        .upload(path, imageFile, { upsert: true });
      if (!uploadErr) {
        const { data: pub } = supabase.storage.from("studio-website-assets").getPublicUrl(path);
        imageUrl = pub.publicUrl;
      }
    }

    const { error } = await (supabase.from("feed_posts").insert({
      user_id: user.id, title: title.trim(), caption: caption.trim() || null,
      image_url: imageUrl, location: location.trim() || null, post_type: "manual",
    }) as any);

    setSaving(false);
    if (error) { toast.error("Failed to create post"); return; }
    toast.success("Post created!");
    setTitle(""); setCaption(""); setLocation(""); setImageFile(null); setPreview(null);
    onOpenChange(false);
    onCreated?.();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", fontFamily: mont, fontSize: 13,
    color: "#000000", background: "#FAFAFA", border: "1px solid #E0E0E0",
    outline: "none", borderRadius: 0,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" style={{ background: "#FFFFFF", border: "1px solid #F0F0F0", color: "#000000" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: playfair, fontSize: 22, fontWeight: 700, color: "#000000" }}>
            Create Post
          </DialogTitle>
        </DialogHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
          <input placeholder="Post title *" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          <textarea placeholder="Write your story..." value={caption} onChange={e => setCaption(e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" as const }} />
          <input placeholder="Location (e.g. Calicut, Kerala)" value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />
          <div>
            <label style={{
              display: "inline-block", padding: "10px 20px", fontFamily: mont, fontSize: 11,
              letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#000000",
              border: "1px solid #E0E0E0", cursor: "pointer",
            }}>
              {imageFile ? "Change Image" : "Add Image"}
              <input type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
            </label>
          </div>
          {preview && <img src={preview} alt="Preview" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 0 }} />}
          <button onClick={handleSubmit} disabled={saving} style={{
            width: "100%", padding: "14px", fontFamily: mont, fontSize: 12, fontWeight: 600,
            letterSpacing: "0.15em", textTransform: "uppercase" as const, background: "#FFCC00",
            color: "#000000", border: "none", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1,
          }}>
            {saving ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
