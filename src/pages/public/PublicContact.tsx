import { useState, useEffect, useCallback } from "react";
import { useSiteContext } from "@/lib/SiteContext";
import { useSiteProfile } from "@/lib/SiteProfileContext";
import { SiteHead } from "@/components/SiteHead";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Instagram, Globe, Loader2, CheckCircle, MapPin, Phone, Mail,
  CalendarIcon, Camera,
} from "lucide-react";

const EVENT_TYPES = ["Wedding", "Pre-Wedding", "Engagement", "Reception", "Other"];
const REFERRAL_SOURCES = ["Instagram", "Google", "Referral", "Wedding Platform", "Other"];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10,}$/;

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  event_date: Date | undefined;
  event_type: string;
  referral_source: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export default function PublicContact() {
  const { siteOwnerId } = useSiteContext();
  const { profile: siteProfile } = useSiteProfile();
  const [studioProfile, setStudioProfile] = useState<any>(null);
  const [form, setForm] = useState<FormData>({
    name: "", email: "", phone: "", message: "",
    event_date: undefined, event_type: "", referral_source: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!siteOwnerId) return;
    Promise.all([
      supabase.from("profiles").select("studio_name, studio_logo_url, studio_accent_color, email").eq("user_id", siteOwnerId).maybeSingle() as any,
      supabase.from("studio_profiles").select("display_name, bio, instagram, website, whatsapp, footer_text, cover_url, username, heading_font, body_font, font_style").eq("user_id", siteOwnerId).maybeSingle() as any,
    ]).then(([profileRes, studioRes]: any[]) => {
      setStudioProfile({ ...profileRes.data, ...studioRes.data });
    });
  }, [siteOwnerId]);

  const validate = useCallback((): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!emailRegex.test(form.email)) e.email = "Please enter a valid email";
    if (form.phone && !phoneRegex.test(form.phone.replace(/\D/g, "")))
      e.phone = "Please enter at least 10 digits";
    if (!form.message.trim()) e.message = "Message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "");
    setForm(f => ({ ...f, phone: digits }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || sending) return;
    setSending(true);

    const { error } = await (supabase.from("contact_submissions").insert({
      site_owner_id: siteOwnerId,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone || null,
      message: form.message.trim(),
      event_date: form.event_date ? format(form.event_date, "yyyy-MM-dd") : null,
      event_type: form.event_type || null,
      referral_source: form.referral_source || null,
    }) as any);

    if (error) {
      setSending(false);
      return;
    }

    // Insert notification for photographer
    if (siteOwnerId) {
      const eventInfo = [
        form.event_type && `Event: ${form.event_type}`,
        form.event_date && `on ${format(form.event_date, "PPP")}`,
      ].filter(Boolean).join(" ");
      const bodyParts = [eventInfo, form.message.trim()].filter(Boolean).join(". Message: ");
      const truncatedBody = bodyParts.length > 200 ? bodyParts.slice(0, 197) + "..." : bodyParts;

      await (supabase.from("notifications").insert({
        user_id: siteOwnerId,
        type: "contact_form",
        title: `New inquiry from ${form.name.trim()}`,
        message: truncatedBody,
        is_read: false,
      }) as any);
    }

    setSending(false);
    setSent(true);
  };

  const studioName = studioProfile?.studio_name || studioProfile?.display_name || "Studio";
  const hasFieldError = (field: keyof FormErrors) => !!errors[field];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SiteHead title={`Contact ${studioName}`} ogTitle={`Contact ${studioName}`} />

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <h1
          className="text-3xl md:text-4xl text-[#1A1A1A] text-center mb-10"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Get in Touch
        </h1>

        <div className="flex flex-col md:flex-row gap-10 md:gap-14">
          {/* Right column on desktop — info — shown first on mobile */}
          <aside className="md:order-2 md:w-[40%] space-y-6">
            <PhotographerInfo profile={studioProfile} />
          </aside>

          {/* Left column — form */}
          <div className="md:order-1 md:w-[60%]">
            {sent ? <SuccessCard /> : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <FieldWrapper error={errors.name}>
                  <Input
                    placeholder="Your Name *"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={cn("border-[#E8E0D4] bg-white", hasFieldError("name") && "border-red-400")}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                </FieldWrapper>

                {/* Email */}
                <FieldWrapper error={errors.email}>
                  <Input
                    placeholder="Email *"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className={cn("border-[#E8E0D4] bg-white", hasFieldError("email") && "border-red-400")}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                </FieldWrapper>

                {/* Phone */}
                <FieldWrapper error={errors.phone}>
                  <Input
                    placeholder="Phone (optional)"
                    value={form.phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    className={cn("border-[#E8E0D4] bg-white", hasFieldError("phone") && "border-red-400")}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                </FieldWrapper>

                {/* Event Type + Event Date row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
                      <SelectTrigger className="border-[#E8E0D4] bg-white text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                        <SelectValue placeholder="Event Type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-[#E8E0D4] bg-white text-sm",
                            !form.event_date && "text-muted-foreground"
                          )}
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.event_date ? format(form.event_date, "PPP") : "Event Date (optional)"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.event_date}
                          onSelect={d => setForm(f => ({ ...f, event_date: d }))}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Referral source */}
                <Select value={form.referral_source} onValueChange={v => setForm(f => ({ ...f, referral_source: v }))}>
                  <SelectTrigger className="border-[#E8E0D4] bg-white text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                    <SelectValue placeholder="How did you find me? (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {REFERRAL_SOURCES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Message */}
                <FieldWrapper error={errors.message}>
                  <Textarea
                    placeholder="Your Message *"
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={5}
                    className={cn("border-[#E8E0D4] bg-white resize-none", hasFieldError("message") && "border-red-400")}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                </FieldWrapper>

                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-[#C9A96E] hover:bg-[#B8964E] text-white transition-colors duration-300"
                >
                  {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function FieldWrapper({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>{error}</p>}
    </div>
  );
}

function SuccessCard() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-in fade-in duration-500">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-500 animate-in zoom-in duration-300" />
      </div>
      <h2 className="text-2xl text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        Thank You!
      </h2>
      <p className="text-sm text-[#1A1A1A]/60 text-center max-w-sm" style={{ fontFamily: "Inter, sans-serif" }}>
        Your message has been sent. I'll get back to you within 24–48 hours.
      </p>
    </div>
  );
}

function PhotographerInfo({ profile }: { profile: any | null }) {
  if (!profile) return null;

  const name = profile.display_name || profile.studio_name || "Photographer";
  const bio = profile.bio;
  const location = profile.location;
  const phone = profile.phone || profile.mobile;
  const email = profile.email;
  const instagram = profile.instagram;
  const website = profile.website;
  const avatarUrl = profile.avatar_url || profile.cover_url;

  return (
    <div className="space-y-6">
      {/* Avatar / photo */}
      {avatarUrl ? (
        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#E8E0D4]">
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-full aspect-[4/3] rounded-lg bg-[#E8E0D4] flex items-center justify-center">
          <Camera className="w-12 h-12 text-[#C9A96E]/50" />
        </div>
      )}

      {/* Name & bio */}
      <div>
        <h2 className="text-2xl text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {name}
        </h2>
        {bio && (
          <p className="text-sm text-[#1A1A1A]/60 mt-2 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
            {bio}
          </p>
        )}
      </div>

      {/* Contact details */}
      <div className="space-y-3 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
        {location && (
          <div className="flex items-center gap-2 text-[#1A1A1A]/70">
            <MapPin className="w-4 h-4 text-[#C9A96E]" />
            {location}
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2 text-[#1A1A1A]/70">
            <Phone className="w-4 h-4 text-[#C9A96E]" />
            {phone}
          </div>
        )}
        {email && (
          <div className="flex items-center gap-2 text-[#1A1A1A]/70">
            <Mail className="w-4 h-4 text-[#C9A96E]" />
            {email}
          </div>
        )}
      </div>

      {/* Social links */}
      <div className="flex gap-3">
        {instagram && (
          <a
            href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full border border-[#E8E0D4] hover:bg-[#E8E0D4]/30 transition-colors duration-300"
          >
            <Instagram className="w-4 h-4 text-[#1A1A1A]/60" />
          </a>
        )}
        {website && (
          <a
            href={website.startsWith("http") ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full border border-[#E8E0D4] hover:bg-[#E8E0D4]/30 transition-colors duration-300"
          >
            <Globe className="w-4 h-4 text-[#1A1A1A]/60" />
          </a>
        )}
      </div>
    </div>
  );
}
