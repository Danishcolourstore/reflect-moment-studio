import { useState, useEffect } from "react";
import { useSiteContext } from "@/lib/SiteContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Instagram, Facebook, Globe, Loader2, CheckCircle } from "lucide-react";

export default function PublicContact() {
  const { siteOwnerId } = useSiteContext();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!siteOwnerId) return;
    (supabase.from("profiles").select("*").eq("user_id", siteOwnerId).maybeSingle() as any)
      .then(({ data }: any) => setProfile(data));
  }, [siteOwnerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await (supabase.from("contact_submissions").insert({
      site_owner_id: siteOwnerId, name: form.name, email: form.email,
      phone: form.phone || null, message: form.message,
    }) as any);
    setSending(false);
    if (error) {
      toast({ title: "Error sending message", variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  const studioName = profile?.studio_name || "Contact";

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Get in Touch
          </h1>
          <p className="text-[#1A1A1A]/60 mt-2 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            {studioName}
          </p>
        </div>

        {profile?.instagram_url || profile?.facebook_url || profile?.website_url ? (
          <div className="flex justify-center gap-3">
            {profile?.instagram_url && (
              <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-full border border-[#E8E0D4] hover:bg-[#E8E0D4]/30 transition-colors">
                <Instagram className="w-5 h-5 text-[#1A1A1A]/60" />
              </a>
            )}
            {profile?.facebook_url && (
              <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-full border border-[#E8E0D4] hover:bg-[#E8E0D4]/30 transition-colors">
                <Facebook className="w-5 h-5 text-[#1A1A1A]/60" />
              </a>
            )}
            {profile?.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-full border border-[#E8E0D4] hover:bg-[#E8E0D4]/30 transition-colors">
                <Globe className="w-5 h-5 text-[#1A1A1A]/60" />
              </a>
            )}
          </div>
        ) : null}

        {sent ? (
          <div className="text-center space-y-3 py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-xl text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Message Sent!
            </h2>
            <p className="text-sm text-[#1A1A1A]/60" style={{ fontFamily: "Inter, sans-serif" }}>
              The photographer will get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Your Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="border-[#E8E0D4] bg-white" style={{ fontFamily: "Inter, sans-serif" }} />
            <Input placeholder="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="border-[#E8E0D4] bg-white" style={{ fontFamily: "Inter, sans-serif" }} />
            <Input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="border-[#E8E0D4] bg-white" style={{ fontFamily: "Inter, sans-serif" }} />
            <Textarea placeholder="Your Message *" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={5} className="border-[#E8E0D4] bg-white resize-none" style={{ fontFamily: "Inter, sans-serif" }} />
            <Button type="submit" disabled={sending} className="w-full bg-[#C9A96E] hover:bg-[#b8985d] text-white">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send Message
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
