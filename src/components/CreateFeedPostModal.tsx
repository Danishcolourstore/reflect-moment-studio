import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { fonts } from "@/styles/design-tokens";
import { Camera, Image as ImageIcon, X, FileText } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

type PostMode = "post" | "blog";

export default function CreateFeedPostModal({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<PostMode>("post");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGalleryImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setGalleryFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setGalleryPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (idx: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== idx));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const reset = () => {
    setTitle(""); setCaption(""); setContent(""); setLocation("");
    setImageFile(null); setPreview(null);
    setGalleryFiles([]); setGalleryPreviews([]);
    setMode("post");
  };

  const handleSubmit = async () => {
    if (!user || !title.trim()) { toast.error("Title is required"); return; }
    if (mode === "blog" && !content.trim()) { toast.error("Blog content is required"); return; }
    setSaving(true);

    // Upload cover image
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

    // Upload gallery images for blog
    const galleryUrls: string[] = [];
    if (mode === "blog" && galleryFiles.length > 0) {
      for (const file of galleryFiles) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/feed/blog/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("studio-website-assets")
          .upload(path, file, { upsert: true });
        if (!uploadErr) {
          const { data: pub } = supabase.storage.from("studio-website-assets").getPublicUrl(path);
          galleryUrls.push(pub.publicUrl);
        }
      }
    }

    const { error } = await (supabase.from("feed_posts").insert({
      user_id: user.id,
      title: title.trim(),
      caption: caption.trim() || null,
      content: mode === "blog" ? content.trim() : null,
      image_url: imageUrl,
      gallery_images: galleryUrls.length > 0 ? galleryUrls : [],
      location: location.trim() || null,
      post_type: "manual",
      content_type: mode,
    }) as any);

    setSaving(false);
    if (error) { toast.error("Failed to create post"); return; }
    toast.success(mode === "blog" ? "Blog published!" : "Post created!");
    reset();
    onOpenChange(false);
    onCreated?.();
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
            Create {mode === "blog" ? "Blog Story" : "Post"}
          </DialogTitle>
        </DialogHeader>

        {/* ── Mode Toggle ── */}
        <div style={{ display: "flex", gap: 0, borderRadius: 10, overflow: "hidden", border: "1px solid #EEEEEE", marginBottom: 4 }}>
          {(["post", "blog"] as PostMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: "10px 0",
                fontFamily: fonts.body, fontSize: 13, fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                background: mode === m ? "#1A1A1A" : "white",
                color: mode === m ? "white" : "#999999",
                border: "none", cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {m === "post" ? <Camera size={14} strokeWidth={1.5} /> : <FileText size={14} strokeWidth={1.5} />}
                {m === "post" ? "Photo Post" : "Blog Story"}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            placeholder={mode === "blog" ? "Blog title *" : "Post title *"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ ...inputStyle, fontFamily: fonts.display, fontSize: 18, fontWeight: 400, padding: "14px" }}
          />

          {/* Cover image */}
          <div>
            <label style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px", fontFamily: fonts.body, fontSize: 12,
              fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const,
              color: "#666666", border: "1px dashed #DDDDDD", borderRadius: 8,
              cursor: "pointer", justifyContent: "center",
              background: "#FAFAFA",
            }}>
              <Camera size={16} strokeWidth={1.5} /> {imageFile ? "Change Cover" : "Add Cover Image"}
              <input type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
            </label>
          </div>
          {preview && (
            <div style={{ position: "relative" }}>
              <img src={preview} alt="Cover" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8 }} loading="lazy" decoding="async" />
              <button
                onClick={() => { setImageFile(null); setPreview(null); }}
                style={{
                  position: "absolute", top: 6, right: 6,
                  width: 28, height: 28, borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)", color: "white",
                  border: "none", cursor: "pointer", fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                aria-label="Remove cover"
              ><X size={14} strokeWidth={1.5} /></button>
            </div>
          )}

          <textarea
            placeholder={mode === "blog" ? "Short excerpt or subtitle..." : "Write a caption..."}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" as const }}
          />

          {/* Blog-only: rich content area */}
          {mode === "blog" && (
            <>
              <div style={{ position: "relative" }}>
                <textarea
                  placeholder="Write your story... &#10;&#10;Use paragraphs to structure your narrative. Share the couple's story, the venue details, and the beautiful moments you captured."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  style={{
                    ...inputStyle,
                    resize: "vertical" as const,
                    minHeight: 200,
                    lineHeight: 1.8,
                    fontSize: 15,
                  }}
                />
                <span style={{
                  position: "absolute", bottom: 8, right: 12,
                  fontSize: 11, color: "#CCCCCC", fontFamily: fonts.body,
                }}>
                  {content.length} chars
                </span>
              </div>

              {/* Gallery images for blog */}
              <div>
                <label style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 16px", fontFamily: fonts.body, fontSize: 12,
                  fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const,
                  color: "#666666", border: "1px dashed #DDDDDD", borderRadius: 8,
                  cursor: "pointer", justifyContent: "center",
                  background: "#FAFAFA",
                }}>
                  <ImageIcon size={16} strokeWidth={1.5} /> Add Story Images ({galleryPreviews.length})
                  <input type="file" accept="image/*" multiple onChange={handleGalleryImages} style={{ display: "none" }} />
                </label>
              </div>
              {galleryPreviews.length > 0 && (
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                  {galleryPreviews.map((p, i) => (
                    <div key={i} style={{ position: "relative", flexShrink: 0 }}>
                      <img src={p} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 6 }} loading="lazy" decoding="async" />
                      <button
                        onClick={() => removeGalleryImage(i)}
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
            </>
          )}

          <input
            placeholder="Location (e.g., Udaipur, Rajasthan)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              width: "100%", padding: "14px",
              fontFamily: fonts.body, fontSize: 13, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase" as const,
              background: "#1A1A1A", color: "white",
              border: "none", borderRadius: 8,
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.6 : 1,
              transition: "opacity 0.2s ease",
            }}
          >
            {saving
              ? (mode === "blog" ? "Publishing Story..." : "Publishing...")
              : (mode === "blog" ? "Publish Blog Story" : "Publish Post")
            }
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
