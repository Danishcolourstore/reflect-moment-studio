import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const mont = '"Montserrat", sans-serif';
const playfair = '"Playfair Display", serif';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: { id: string; title: string; caption: string | null; location: string | null; imageUrl: string | null } | null;
  onSaved?: () => void;
}

export default function EditFeedPostModal({ open, onOpenChange, post, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (post) { setTitle(post.title || ""); setCaption(post.caption || ""); setLocation(post.location || ""); }
  }, [post]);

  const handleSave = async () => {
    if (!post || !title.trim()) { toast.error("Title required"); return; }
    setSaving(true);
    const { error } = await (supabase.from("feed_posts").update({
      title: title.trim(), caption: caption.trim() || null, location: location.trim() || null,
    }) as any).eq("id", post.id);
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Post updated");
    onOpenChange(false);
    onSaved?.();
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
            Edit Post
          </DialogTitle>
        </DialogHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
          <input placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          <textarea placeholder="Caption" value={caption} onChange={e => setCaption(e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" as const }} />
          <input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />
          <button onClick={handleSave} disabled={saving} style={{
            width: "100%", padding: "14px", fontFamily: mont, fontSize: 12, fontWeight: 600,
            letterSpacing: "0.15em", textTransform: "uppercase" as const, background: "#FFCC00",
            color: "#000000", border: "none", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1,
          }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
