import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Copy, Plus, Globe, Check, Trash2, Loader2, Lightbulb, Info, ExternalLink, Lock, ShieldCheck, Link, Search } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "api", "admin", "dashboard", "mail", "ftp", "staging",
  "dev", "test", "beta", "support", "help", "docs", "blog", "status",
]);

function formatRelativeTime(date: string | null) {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? "s" : ""} ago`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="relative ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-[#E8E0D4]/50 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-[#1A1A1A]/50" />}
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs bg-[#1A1A1A] text-white px-2 py-0.5 rounded whitespace-nowrap z-10">
          Copied!
        </span>
      )}
    </button>
  );
}

function PulsingDot() {
  return (
    <span className="relative flex h-2 w-2 ml-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
    </span>
  );
}

interface DomainRow {
  id: string;
  user_id: string;
  subdomain: string;
  custom_domain: string | null;
  is_primary: boolean;
  verification_status: string;
  verified_at: string | null;
  updated_at: string;
}

function cleanDomain(raw: string): string {
  return raw
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .trim()
    .toLowerCase();
}

function DomainOnboardingSvg() {
  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[200px] mx-auto">
      {/* Browser frame */}
      <rect x="20" y="10" width="160" height="100" rx="8" stroke="#C9A96E" strokeWidth="1.5" fill="none" />
      <line x1="20" y1="30" x2="180" y2="30" stroke="#C9A96E" strokeWidth="1" opacity="0.5" />
      {/* Dots */}
      <circle cx="34" cy="20" r="3" fill="#E8E0D4" />
      <circle cx="44" cy="20" r="3" fill="#E8E0D4" />
      <circle cx="54" cy="20" r="3" fill="#E8E0D4" />
      {/* URL bar */}
      <rect x="65" y="15" width="100" height="10" rx="5" fill="#FDFBF7" stroke="#E8E0D4" strokeWidth="0.8" />
      <text x="80" y="23" fill="#C9A96E" fontSize="6" fontFamily="Inter, sans-serif" fontWeight="500">yourdomain.com</text>
      {/* Content lines */}
      <rect x="40" y="45" width="120" height="6" rx="3" fill="#E8E0D4" opacity="0.6" />
      <rect x="55" y="58" width="90" height="6" rx="3" fill="#E8E0D4" opacity="0.4" />
      <rect x="70" y="71" width="60" height="6" rx="3" fill="#E8E0D4" opacity="0.3" />
      {/* Lock icon */}
      <rect x="88" y="84" width="24" height="18" rx="4" stroke="#C9A96E" strokeWidth="1.2" fill="none" />
      <path d="M94 84V79a6 6 0 0 1 12 0v5" stroke="#C9A96E" strokeWidth="1.2" fill="none" />
      <circle cx="100" cy="93" r="2" fill="#C9A96E" />
    </svg>
  );
}

export default function DomainSettings() {
  const { user } = useAuth();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyAttempt, setVerifyAttempt] = useState(0);
  const [verifyMaxAttempts, setVerifyMaxAttempts] = useState(0);
  const [onboardingStarted, setOnboardingStarted] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);

  const fetchDomains = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase.from("domains").select("*").eq("user_id", user.id) as any);
    if (mountedRef.current) {
      setDomains((data || []) as DomainRow[]);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchDomains(); }, [fetchDomains]);

  const subdomainRow = domains.find(d => !d.custom_domain);
  const customRow = domains.find(d => !!d.custom_domain);
  const subdomain = subdomainRow?.subdomain || "";
  const onboardingSeen = !!customRow || localStorage.getItem("mirrorai_domain_onboarding_seen") === "true";
  const showOnboarding = !onboardingSeen && !onboardingStarted;
  // Background polling for pending domains
  useEffect(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (!customRow || customRow.verification_status !== "pending" || !user) return;

    pollingRef.current = setInterval(async () => {
      if (verifying) return; // don't poll during active verification
      try {
        const { data } = await supabase.functions.invoke("verify-domain", {
          body: { domain: customRow.custom_domain, user_id: user.id },
        });
        if (data?.success && mountedRef.current) {
          toast({ title: "Domain verified!", description: "Your custom domain is now connected." });
          fetchDomains();
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch {}
    }, 60_000);

    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [customRow?.verification_status, customRow?.custom_domain, user, verifying, fetchDomains]);

  const validateDomainInput = (raw: string): string | null => {
    const cleaned = cleanDomain(raw);
    if (!cleaned) return "Enter a domain name";
    if (!cleaned.includes(".")) return "Enter a valid domain like www.example.com";
    if (/\s/.test(cleaned)) return "Domain cannot contain spaces";

    // Check reserved subdomain
    const firstPart = cleaned.split(".")[0];
    if (cleaned.endsWith(".mirroraigallery.com") && RESERVED_SUBDOMAINS.has(firstPart)) {
      return "This subdomain is reserved";
    }
    return null;
  };

  const handleAddCustom = async () => {
    const cleaned = cleanDomain(customInput);
    const err = validateDomainInput(customInput);
    if (err) { setInputError(err); return; }

    setSaving(true);
    setInputError("");

    // Check duplicate across all users
    const { data: existing } = await (supabase.from("domains").select("id").eq("custom_domain", cleaned).limit(1) as any);
    if (existing && existing.length > 0) {
      setInputError("This domain is already connected to another account");
      setSaving(false);
      return;
    }

    const { error } = await (supabase.from("domains").insert({
      user_id: user!.id,
      subdomain: subdomain + "-custom",
      custom_domain: cleaned,
      verification_status: "pending",
    }) as any);
    setSaving(false);
    if (error) {
      if (error.message?.includes("duplicate") || error.code === "23505") {
        setInputError("This domain is already connected to another account");
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      localStorage.setItem("mirrorai_domain_onboarding_seen", "true");
      toast({ title: "Domain added", description: "Now configure your DNS records below." });
      setShowAddForm(false);
      setCustomInput("");
      setInputError("");
      fetchDomains();
    }
  };

  const runVerification = useCallback(async (): Promise<boolean> => {
    if (!customRow || !user) return false;
    try {
      const { data, error } = await supabase.functions.invoke("verify-domain", {
        body: { domain: customRow.custom_domain, user_id: user.id },
      });
      if (error) throw error;
      return !!data?.success;
    } catch {
      return false;
    }
  }, [customRow, user]);

  const handleVerify = async () => {
    if (!customRow) return;
    setVerifying(true);
    setVerifyMaxAttempts(3);

    for (let attempt = 1; attempt <= 3; attempt++) {
      if (!mountedRef.current) break;
      setVerifyAttempt(attempt);

      const success = await runVerification();
      if (success) {
        toast({ title: "Domain verified!", description: "Your custom domain is now connected." });
        setVerifying(false);
        setVerifyAttempt(0);
        setVerifyMaxAttempts(0);
        fetchDomains();
        return;
      }

      if (attempt < 3) {
        // Wait 10 seconds before retry
        await new Promise<void>(resolve => {
          retryRef.current = setTimeout(resolve, 10_000);
        });
      }
    }

    if (mountedRef.current) {
      toast({
        title: "Verification failed",
        description: "DNS records not detected yet. Please check your configuration and try again.",
        variant: "destructive",
      });
      setVerifying(false);
      setVerifyAttempt(0);
      setVerifyMaxAttempts(0);
      fetchDomains();
    }
  };

  const handleRemove = async () => {
    if (!customRow) return;
    await (supabase.from("domains").delete().eq("id", customRow.id) as any);
    toast({ title: "Domain removed" });
    fetchDomains();
  };

  const handleSetPrimary = async (id: string) => {
    if (!user) return;
    await (supabase.from("domains").update({ is_primary: false }).eq("user_id", user.id) as any);
    await (supabase.from("domains").update({ is_primary: true }).eq("id", id) as any);
    toast({ title: "Primary domain updated" });
    fetchDomains();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Website Domains
        </h1>
        <p className="text-sm text-[#1A1A1A]/60 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
          Manage your subdomain and connect a custom domain
        </p>
      </div>

      {/* Onboarding Card */}
      {showOnboarding && (
        <Card className="border-[#E8E0D4] bg-white shadow-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center space-y-5">
            <DomainOnboardingSvg />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Connect Your Own Domain
              </h2>
              <p className="text-sm text-[#1A1A1A]/60 max-w-md" style={{ fontFamily: "Inter, sans-serif" }}>
                Give your photography website a professional address. Your clients will see your brand, not ours.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FDFBF7] border border-[#E8E0D4] text-xs font-medium text-[#1A1A1A]/70" style={{ fontFamily: "Inter, sans-serif" }}>
                <Link className="w-3.5 h-3.5 text-[#C9A96E]" /> Custom URL
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FDFBF7] border border-[#E8E0D4] text-xs font-medium text-[#1A1A1A]/70" style={{ fontFamily: "Inter, sans-serif" }}>
                <Lock className="w-3.5 h-3.5 text-[#C9A96E]" /> Free SSL
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FDFBF7] border border-[#E8E0D4] text-xs font-medium text-[#1A1A1A]/70" style={{ fontFamily: "Inter, sans-serif" }}>
                <Search className="w-3.5 h-3.5 text-[#C9A96E]" /> SEO Friendly
              </span>
            </div>
            <Button
              onClick={() => { setOnboardingStarted(true); setShowAddForm(true); }}
              className="min-h-[44px] px-8 text-white font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#C9A96E", fontFamily: "Inter, sans-serif" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#B8964E")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#C9A96E")}
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Section 1: Subdomain */}
      <Card className="border-[#E8E0D4] bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Your MirrorAI Subdomain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://${subdomain}.mirroraigallery.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C9A96E] hover:underline font-medium flex items-center gap-1 break-all"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {subdomain}.mirroraigallery.com
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
            <CopyButton text={`${subdomain}.mirroraigallery.com`} />
            <Badge className="ml-auto bg-green-50 text-green-700 border-green-200 hover:bg-green-50">Active</Badge>
          </div>
          <a
            href={`https://${subdomain}.mirroraigallery.com`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#C9A96E] hover:underline"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <Globe className="w-3.5 h-3.5" /> Preview Site
          </a>
        </CardContent>
      </Card>

      {/* Section 2: Custom Domain */}
      <Card className="border-[#E8E0D4] bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Custom Domain
          </CardTitle>
          <CardDescription style={{ fontFamily: "Inter, sans-serif" }}>
            Connect your own domain for a fully branded experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!customRow && !showAddForm && (
            <Button
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="border-[#E8E0D4] text-[#1A1A1A] hover:bg-[#FDFBF7] min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Custom Domain
            </Button>
          )}

          {showAddForm && !customRow && (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="www.yourdomain.com"
                  value={customInput}
                  onChange={e => { setCustomInput(e.target.value); setInputError(""); }}
                  className={`border-[#E8E0D4] bg-[#FDFBF7] min-h-[44px] ${inputError ? "border-red-400" : ""}`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddCustom} disabled={saving} className="bg-[#C9A96E] hover:bg-[#b8985d] text-white min-h-[44px] whitespace-nowrap">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect Domain"}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowAddForm(false); setCustomInput(""); setInputError(""); }} className="min-h-[44px]">
                    Cancel
                  </Button>
                </div>
              </div>
              {inputError && (
                <p className="text-xs text-red-500" style={{ fontFamily: "Inter, sans-serif" }}>{inputError}</p>
              )}
            </div>
          )}

          {customRow && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Globe className="w-4 h-4 text-[#C9A96E] shrink-0" />
                  <span className="font-medium text-[#1A1A1A] break-all" style={{ fontFamily: "Inter, sans-serif" }}>
                    {customRow.custom_domain}
                  </span>
                  <div className="flex items-center">
                    <Badge className={
                      customRow.verification_status === "verified"
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
                        : customRow.verification_status === "error"
                        ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"
                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"
                    }>
                      {customRow.verification_status === "verified" ? "Connected" : customRow.verification_status === "error" ? "Error" : "Pending"}
                    </Badge>
                    {customRow.verification_status === "pending" && <PulsingDot />}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={handleVerify} disabled={verifying} className="border-[#E8E0D4] min-h-[44px]">
                    {verifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        Attempt {verifyAttempt}/{verifyMaxAttempts}
                      </>
                    ) : "Verify Domain"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 min-h-[44px]">
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Custom Domain?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will disconnect {customRow.custom_domain} from your website. You can re-add it later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemove} className="bg-red-500 hover:bg-red-600">Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {verifying && (
                <p className="text-xs text-[#C9A96E] animate-pulse" style={{ fontFamily: "Inter, sans-serif" }}>
                  Checking DNS... Attempt {verifyAttempt} of {verifyMaxAttempts}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs text-[#1A1A1A]/40" style={{ fontFamily: "Inter, sans-serif" }}>
                  Last checked: {formatRelativeTime(customRow.updated_at)}
                </p>
                {customRow.verification_status === "verified" && (
                  <a
                    href={`https://${customRow.custom_domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#C9A96E] hover:underline"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <Globe className="w-3.5 h-3.5" /> Preview Site
                  </a>
                )}
              </div>

              {/* SSL Certificate Status */}
              <div className="flex items-center gap-2 p-3 rounded-lg border border-[#E8E0D4] bg-[#FDFBF7]" style={{ fontFamily: "Inter, sans-serif" }}>
                {(() => {
                  const vs = customRow.verification_status;
                  const verifiedAt = customRow.verified_at;
                  let sslStatus: "waiting" | "provisioning" | "active" = "waiting";
                  if (vs === "verified" && verifiedAt) {
                    const minsAgo = (Date.now() - new Date(verifiedAt).getTime()) / 60000;
                    sslStatus = minsAgo > 5 ? "active" : "provisioning";
                  }

                  if (sslStatus === "waiting") {
                    return (
                      <>
                        <Lock className="w-4 h-4 shrink-0" style={{ color: "#9CA3AF" }} />
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#9CA3AF" }}>SSL Certificate</p>
                          <p className="text-xs" style={{ color: "#9CA3AF" }}>Waiting for domain verification</p>
                        </div>
                      </>
                    );
                  }
                  if (sslStatus === "provisioning") {
                    return (
                      <>
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin" style={{ color: "#C9A96E" }} />
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">SSL Certificate</p>
                          <p className="text-xs text-[#1A1A1A]/60">SSL provisioning... this may take a few minutes</p>
                        </div>
                      </>
                    );
                  }
                  return (
                    <>
                      <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: "#22C55E" }} />
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">SSL Certificate</p>
                        <p className="text-xs" style={{ color: "#22C55E" }}>SSL Active — HTTPS enabled</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DNS Instructions */}
      {customRow && customRow.verification_status !== "verified" && (
        <Card className="border-[#E8E0D4] bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Configure Your DNS
            </CardTitle>
            <CardDescription style={{ fontFamily: "Inter, sans-serif" }}>
              Add one of the following records at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="cname">
              <TabsList className="bg-[#FDFBF7] border border-[#E8E0D4] w-full sm:w-auto">
                <TabsTrigger value="cname" className="data-[state=active]:bg-white data-[state=active]:text-[#C9A96E] text-xs sm:text-sm">
                  CNAME (Recommended)
                </TabsTrigger>
                <TabsTrigger value="a" className="data-[state=active]:bg-white data-[state=active]:text-[#C9A96E] text-xs sm:text-sm">
                  A Record (Root)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cname" className="mt-4">
                <div className="rounded-lg border border-[#E8E0D4] overflow-x-auto" style={{ fontFamily: "Inter, sans-serif" }}>
                  <table className="w-full text-sm min-w-[320px]">
                    <thead className="bg-[#FDFBF7]">
                      <tr>
                        <th className="text-left p-3 font-medium text-[#1A1A1A]/60 whitespace-nowrap">Field</th>
                        <th className="text-left p-3 font-medium text-[#1A1A1A]/60 whitespace-nowrap">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[#E8E0D4]">
                        <td className="p-3 text-[#1A1A1A]/70 whitespace-nowrap">Type</td>
                        <td className="p-3 font-mono text-sm">CNAME</td>
                      </tr>
                      <tr className="border-t border-[#E8E0D4]">
                        <td className="p-3 text-[#1A1A1A]/70 whitespace-nowrap">Host</td>
                        <td className="p-3 flex items-center font-mono text-sm">www <CopyButton text="www" /></td>
                      </tr>
                      <tr className="border-t border-[#E8E0D4]">
                        <td className="p-3 text-[#1A1A1A]/70 whitespace-nowrap">Value</td>
                        <td className="p-3 flex items-center font-mono text-sm break-all">mirroraigallery.com <CopyButton text="mirroraigallery.com" /></td>
                      </tr>
                      <tr className="border-t border-[#E8E0D4]">
                        <td className="p-3 text-[#1A1A1A]/70 whitespace-nowrap">TTL</td>
                        <td className="p-3 font-mono text-sm">Auto or 3600</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="a" className="mt-4">
                <div className="rounded-lg border border-[#E8E0D4] overflow-x-auto" style={{ fontFamily: "Inter, sans-serif" }}>
                  <table className="w-full text-sm min-w-[320px]">
                    <thead className="bg-[#FDFBF7]">
                      <tr>
                        <th className="text-left p-3 font-medium text-[#1A1A1A]/60 whitespace-nowrap">Field</th>
                        <th className="text-left p-3 font-medium text-[#1A1A1A]/60 whitespace-nowrap">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[#E8E0D4]">
                        <td className="p-3 text-[#1A1A1A]/70 whitespace-nowrap">Type</td>
                        <td className="p-3 font-mono text-sm">A</td>
                      </tr>
                      <tr className="border-t border-[#E8E0D4]">
                        <td className="p-3 text-[#1A1A1A]/70 whitespace-nowrap">Host</td>
                        <td className="p-3 flex items-center font-mono text-sm">@ <CopyButton text="@" /></td>
                      </tr>
                      <tr className="border-t border-[#E8E0D4]">
                        <td className="p-3 text-[#1A1A1A]/70 whitespace-nowrap">Value</td>
                        <td className="p-3 flex items-center font-mono text-sm">76.76.21.21 <CopyButton text="76.76.21.21" /></td>
                      </tr>
                      <tr className="border-t border-[#E8E0D4]">
                        <td className="p-3 text-[#1A1A1A]/70 whitespace-nowrap">TTL</td>
                        <td className="p-3 font-mono text-sm">Auto or 3600</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#f0f4f8] text-sm text-[#1A1A1A]/70" style={{ fontFamily: "Inter, sans-serif" }}>
              <Info className="w-4 h-4 mt-0.5 text-[#6b7d93] shrink-0" />
              <span>DNS changes can take up to 48 hours to propagate. Click "Verify Domain" once your records are set.</span>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#fef9ec] text-sm text-[#1A1A1A]/70" style={{ fontFamily: "Inter, sans-serif" }}>
              <Lightbulb className="w-4 h-4 mt-0.5 text-[#C9A96E] shrink-0" />
              <span>Pro tip: If you're using Cloudflare, set the proxy status to "DNS only" (grey cloud) for the CNAME record.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Domain Selector */}
      {customRow?.verification_status === "verified" && subdomainRow && (
        <Card className="border-[#E8E0D4] bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Primary Domain
            </CardTitle>
            <CardDescription style={{ fontFamily: "Inter, sans-serif" }}>
              Choose which domain visitors see as your main website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[subdomainRow, customRow].map(d => (
              <button
                key={d.id}
                onClick={() => handleSetPrimary(d.id)}
                className={`w-full flex items-center justify-between p-3 min-h-[48px] rounded-lg border transition-colors ${
                  d.is_primary ? "border-[#C9A96E] bg-[#C9A96E]/5" : "border-[#E8E0D4] hover:bg-[#FDFBF7]"
                }`}
              >
                <span className="text-sm font-medium text-[#1A1A1A] break-all text-left" style={{ fontFamily: "Inter, sans-serif" }}>
                  {d.custom_domain || `${d.subdomain}.mirroraigallery.com`}
                </span>
                {d.is_primary && <Check className="w-4 h-4 text-[#C9A96E] shrink-0 ml-2" />}
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
