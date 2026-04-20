import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { fonts } from "@/styles/design-tokens";
import { X, Image as ImageIcon } from "lucide-react";

interface PostData {
  id: string;
  title: string;
  caption: string | null;
  content: string | null;
  location: string | null;
  imageUrl: string | null;
  contentType: "post" | "blog";
  galleryImages: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostData | null;
  onSaved?: () => void;
}

export default function EditFeedPostModal({ open, onOpenChange, post, onSaved }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const [existingGallery, setExistingGallery] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const isBlog = post?.contentType === "blog";

  useEffect(() => {
    if (post) {
      setTitle(post.title || "");
      setCaption(post.caption || "");
      setContent(post.content || "");
      setLocation(post.location || "");
      setExistingGallery(post.galleryImages || []);
      setNewGalleryFiles([]);
      setNewGalleryPreviews([]);
    }
  }, [post]);

  const handleGalleryImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setNewGalleryFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setNewGalleryPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    if (!post || !user || !title.trim()) { toast.error("Title required"); return; }
    setSaving(true);

    // Upload new gallery images
    const newUrls: string[] = [];
    for (const file of newGalleryFiles) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/feed/blog/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage
        .from("studio-website-assets")
        .upload(path, file, { upsert: true });
      if (!error) {
        const { data: pub } = supabase.storage.from("studio-website-assets").getPublicUrl(path);
        newUrls.push(pub.publicUrl);
      }
    }

    const allGallery = [...existingGallery, ...newUrls];

    const { error } = await (supabase.from("feed_posts").update({
      title: title.trim(),
      caption: caption.trim() || null,
      content: isBlog ? content.trim() || null : null,
      location: location.trim() || null,
      gallery_images: allGallery,
    }) as any).eq("id", post.id);

    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Post updated");
    onOpenChange(false);
    onSaved?.();
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await (supabase.from("feed_posts").delete() as any).eq("id", post.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Post deleted");
    onOpenChange(false);
    onSaved?.();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", fontFamily: fonts.body, fontSize: 14,
    color: "#1A1A1A", background: "#FAFAFA", border: "1px solid #EEEEEE",
    outline: "none", borderRadius: 8,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: "#FFFFFF", border: "1px solid #F0F0F0", color: "#1A1A1A" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 400, color: "#1A1A1A" }}>
            Edit {isBlog ? "Blog Story" : "Post"}
          </DialogTitle>
        </DialogHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            placeholder="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ ...inputStyle, fontFamily: fonts.display, fontSize: 18, fontWeight: 400 }}
          />

          <textarea
            placeholder={isBlog ? "Excerpt / subtitle" : "Caption"}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" as const }}
          />

          {isBlog && (
            <textarea
              placeholder="Blog content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              style={{ ...inputStyle, resize: "vertical" as const, minHeight: 200, lineHeight: 1.8, fontSize: 15 }}
            />
          )}

          {isBlog && (
            <>
              {/* Existing gallery */}
              {existingGallery.length > 0 && (
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                  {existingGallery.map((url, i) => (
                    <div key={i} style={{ position: "relative", flexShrink: 0 }}>
                      <img src={url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 6 }} loading="lazy" decoding="async" />
                      <button
                        onClick={() => setExistingGallery((prev) => prev.filter((_, j) => j !== i))}
                        style={{
                          position: "absolute", top: -4, right: -4,
                          width: 20, height: 20, borderRadius: "50%",
                          background: "rgba(0,0,0,0.6)", color: "white",
                          border: "none", cursor: "pointer", fontSize: 11,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        aria-label="Remove image"
                      ><X size={12} strokeWidth={1.5} /></button>
                    </div>
                  ))}
                </div>
              )}
              <label style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px", fontFamily: fonts.body, fontSize: 12,
                fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const,
                color: "#666666", border: "1px dashed #DDDDDD", borderRadius: 8,
                cursor: "pointer", justifyContent: "center", background: "#FAFAFA",
              }}>
                <ImageIcon size={16} strokeWidth={1.5} /> Add More Images
                <input type="file" accept="image/*" multiple onChange={handleGalleryImages} style={{ display: "none" }} />
              </label>
            </>
          )}

          <input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={inputStyle}
          />

          <button onClick={handleSave} disabled={saving} style={{
            width: "100%", padding: "14px",
            fontFamily: fonts.body, fontSize: 13, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase" as const,
            background: "#1A1A1A", color: "white",
            border: "none", borderRadius: 8,
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button onClick={handleDelete} style={{
            width: "100%", padding: "12px",
            fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
            color: "#CC3333", background: "none",
            border: "1px solid #FFDDDD", borderRadius: 8,
            cursor: "pointer",
          }}>
            Delete Post
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
