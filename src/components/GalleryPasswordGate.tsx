import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GalleryPasswordGateProps {
  eventId: string;
  eventTitle: string;
  studioLogoUrl?: string | null;
  onUnlock: () => void;
}

export function GalleryPasswordGate({ eventId, eventTitle, studioLogoUrl, onUnlock }: GalleryPasswordGateProps) {
  const [input, setInput] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [shake, setShake] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checking || !input.trim()) return;

    setChecking(true);
    try {
      const { data, error } = await (supabase.rpc as any)("verify_gallery_password", {
        event_id: eventId,
        password_input: input,
      });

      if (error) throw error;

      if (data?.valid) {
        localStorage.setItem(`mirrorai_gallery_pw_verified_${eventId}`, "true");
        if (data?.token) localStorage.setItem(`gallery_token:${eventId}`, data.token);
        onUnlock();
      } else {
        toast.error("That didn't match. Try again.");
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8 text-center space-y-5 shadow-md">
        {studioLogoUrl ? (
          <img src={studioLogoUrl} alt="" className="h-12 mx-auto object-contain" loading="lazy" decoding="async" />
        ) : (
          <h2 className="font-serif italic text-xl text-foreground">MirrorAI</h2>
        )}
        <h1 className="font-serif text-2xl font-semibold text-foreground">{eventTitle}</h1>
        <p className="font-serif text-lg text-muted-foreground">Private gallery</p>
        <p className="text-sm text-muted-foreground">Enter the password to view</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className={`relative ${shake ? "skeleton-block" : ""}`}>
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input
              type={showPw ? "text" : "password"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter password"
              className="pl-9 pr-10 bg-background"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={checking}>
            {checking ? "Verifying…" : "View Gallery"}
          </Button>
        </form>
      </div>
    </div>
  );
}
