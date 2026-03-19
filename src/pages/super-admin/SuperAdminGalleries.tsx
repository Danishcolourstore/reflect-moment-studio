import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Image,
  Settings,
  Layout,
  Shield,
  Palette,
  BarChart3,
  Heart,
  Save,
  Eye,
  Download,
  Lock,
  Grid3X3,
  Rows3,
  Columns3,
  Maximize,
  BookOpen,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const SETTINGS_PREFIX = "gallery_";
const ALL_LAYOUT_IDS = ["masonry", "grid", "justified", "editorial", "cinematic", "collage", "timeline", "story"];
const ALL_TEMPLATE_IDS = ["wedding", "pre-wedding", "birthday", "portfolio", "proofing"];

function useGallerySettings() {
  return useQuery({
    queryKey: ["gallery-admin-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("platform_settings").select("key, value");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => {
        if (r.key.startsWith(SETTINGS_PREFIX)) map[r.key] = r.value;
      });
      return map;
    },
  });
}

function useUpsertSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data: existing } = await supabase.from("platform_settings").select("id").eq("key", key).maybeSingle();
      if (existing) {
        await supabase.from("platform_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
      } else {
        await supabase.from("platform_settings").insert({ key, value });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery-admin-settings"] }),
    onError: () => toast.error("Failed to save setting"),
  });
}

function useGalleryAnalytics() {
  return useQuery({
    queryKey: ["gallery-global-analytics"],
    queryFn: async () => {
      const [events, photos, analytics] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("photos").select("id", { count: "exact", head: true }),
        supabase.from("event_analytics" as any).select("gallery_views, downloads_count, favorites_count") as any,
      ]);
      const rows: any[] = analytics.data ?? [];
      return {
        totalGalleries: events.count ?? 0,
        totalPhotos: photos.count ?? 0,
        totalViews: rows.reduce((s: number, r: any) => s + (r.gallery_views ?? 0), 0),
        totalDownloads: rows.reduce((s: number, r: any) => s + (r.downloads_count ?? 0), 0),
        totalFavorites: rows.reduce((s: number, r: any) => s + (r.favorites_count ?? 0), 0),
      };
    },
    staleTime: 30_000,
  });
}

export default function SuperAdminGalleries() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold font-serif text-foreground">Client Gallery Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Control gallery behavior, layouts, templates, security, and analytics across the platform.
        </p>
      </div>
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50">
          <TabsTrigger value="settings" className="gap-1.5 text-xs">
            <Settings className="h-3.5 w-3.5" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="layouts" className="gap-1.5 text-xs">
            <Layout className="h-3.5 w-3.5" />
            Layouts
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5 text-xs">
            <BookOpen className="h-3.5 w-3.5" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="selection" className="gap-1.5 text-xs">
            <Heart className="h-3.5 w-3.5" />
            Selection
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5 text-xs">
            <Palette className="h-3.5 w-3.5" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 text-xs">
            <Shield className="h-3.5 w-3.5" />
            Security
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="settings">
          <GlobalSettingsTab />
        </TabsContent>
        <TabsContent value="layouts">
          <LayoutsTab />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>
        <TabsContent value="selection">
          <SelectionTab />
        </TabsContent>
        <TabsContent value="branding">
          <BrandingTab />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GlobalSettingsTab() {
  const { data: settings, isLoading } = useGallerySettings();
  const upsert = useUpsertSetting();
  const g = (key: string, fallback = "") => settings?.[`${SETTINGS_PREFIX}${key}`] ?? fallback;

  const [defaultLayout, setDefaultLayout] = useState("masonry");
  const [thumbSize, setThumbSize] = useState("medium");
  const [defaultWatermark, setDefaultWatermark] = useState(false);
  const [defaultDownload, setDefaultDownload] = useState("web");
  const [defaultPrivacy, setDefaultPrivacy] = useState("public");
  const [expiryDays, setExpiryDays] = useState("0");
  const [coverStyle, setCoverStyle] = useState("first-photo");

  useEffect(() => {
    if (!settings) return;
    setDefaultLayout(g("default_layout", "masonry"));
    setThumbSize(g("thumb_size", "medium"));
    setDefaultWatermark(g("default_watermark", "false") === "true");
    setDefaultDownload(g("default_download", "web"));
    setDefaultPrivacy(g("default_privacy", "public"));
    setExpiryDays(g("expiry_days", "0"));
    setCoverStyle(g("cover_style", "first-photo"));
  }, [settings]);

  const save = async () => {
    const pairs: [string, string][] = [
      ["default_layout", defaultLayout],
      ["thumb_size", thumbSize],
      ["default_watermark", String(defaultWatermark)],
      ["default_download", defaultDownload],
      ["default_privacy", defaultPrivacy],
      ["expiry_days", expiryDays],
      ["cover_style", coverStyle],
    ];
    await Promise.all(pairs.map(([k, v]) => upsert.mutateAsync({ key: `${SETTINGS_PREFIX}${k}`, value: v })));
    toast.success("Global gallery settings saved");
  };

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Global Gallery Defaults</CardTitle>
        <CardDescription>Applied to all newly created galleries.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Default Layout">
            <Select value={defaultLayout} onValueChange={setDefaultLayout}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["masonry", "grid", "justified", "editorial", "cinematic", "collage", "timeline", "story"].map((v) => (
                  <SelectItem key={v} value={v} className="capitalize">
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Thumbnail Size">
            <Select value={thumbSize} onValueChange={setThumbSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Download Resolution">
            <Select value={defaultDownload} onValueChange={setDefaultDownload}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Resolution</SelectItem>
                <SelectItem value="web">Web Resolution</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Default Privacy">
            <Select value={defaultPrivacy} onValueChange={setDefaultPrivacy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="password">Password Protected</SelectItem>
                <SelectItem value="pin">PIN Protected</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Gallery Cover Style">
            <Select value={coverStyle} onValueChange={setCoverStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first-photo">First Photo</SelectItem>
                <SelectItem value="collage">Collage</SelectItem>
                <SelectItem value="hero-banner">Hero Banner</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Auto-Expiry (days, 0 = never)">
            <Input
              type="number"
              min={0}
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              className="bg-background"
            />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={defaultWatermark} onCheckedChange={setDefaultWatermark} />
          <Label>Enable watermark by default</Label>
        </div>
        <Button onClick={save} disabled={upsert.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}

const LAYOUT_PRESETS = [
  { id: "masonry", name: "Masonry Grid", icon: Grid3X3, desc: "Staggered Pinterest-style layout" },
  { id: "grid", name: "Square Grid", icon: Columns3, desc: "Uniform square thumbnails" },
  { id: "justified", name: "Justified Rows", icon: Rows3, desc: "Fixed-height row layout" },
  { id: "editorial", name: "Editorial", icon: Layout, desc: "Magazine-style mixed sizes" },
  { id: "cinematic", name: "Cinematic", icon: Maximize, desc: "Widescreen theatrical" },
  { id: "collage", name: "Collage", icon: Image, desc: "Artistic overlapping" },
  { id: "timeline", name: "Timeline", icon: BookOpen, desc: "Chronological story" },
  { id: "story", name: "Story Viewer", icon: Eye, desc: "Full-screen swipe" },
];

function LayoutsTab() {
  const { data: settings, isLoading } = useGallerySettings();
  const upsert = useUpsertSetting();

  // FIX: default to ALL enabled when no setting saved yet
  const enabledLayouts: string[] = (() => {
    const raw = settings?.[`${SETTINGS_PREFIX}enabled_layouts`];
    if (!raw) return ALL_LAYOUT_IDS;
    try {
      const parsed = JSON.parse(raw);
      return parsed.length === 0 ? ALL_LAYOUT_IDS : parsed;
    } catch (err) {
      console.error('Gallery operation failed:', err);
      return ALL_LAYOUT_IDS;
    }
  })();

  const toggle = async (id: string) => {
    const isOn = enabledLayouts.includes(id);
    const next = isOn ? enabledLayouts.filter((l) => l !== id) : [...enabledLayouts, id];
    // FIX: never save empty array — keep at least one
    if (next.length === 0) {
      toast.error("At least one layout must be enabled");
      return;
    }
    await upsert.mutateAsync({ key: `${SETTINGS_PREFIX}enabled_layouts`, value: JSON.stringify(next) });
    toast.success(`Layout ${isOn ? "disabled" : "enabled"}`);
  };

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gallery Layout Management</CardTitle>
          <CardDescription>Enable or disable layouts available to photographers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {LAYOUT_PRESETS.map((l) => {
              const on = enabledLayouts.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => toggle(l.id)}
                  className={cn(
                    "relative p-4 rounded-lg border text-left transition-all hover:opacity-90",
                    on ? "border-primary/40 bg-primary/5" : "border-border bg-card opacity-50",
                  )}
                >
                  <l.icon className="h-5 w-5 text-primary mb-2" />
                  <p className="text-sm font-medium text-foreground">{l.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{l.desc}</p>
                  <Badge
                    className={cn(
                      "absolute top-2 right-2 text-[9px]",
                      on ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {on ? "Active" : "Off"}
                  </Badge>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Layout Spacing Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingSlider settingsKey="layout_gap" label="Grid Gap (px)" min={0} max={32} defaultVal={8} />
          <SettingSlider settingsKey="layout_padding" label="Container Padding (px)" min={0} max={48} defaultVal={16} />
          <SettingSlider
            settingsKey="layout_border_radius"
            label="Thumbnail Radius (px)"
            min={0}
            max={24}
            defaultVal={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}

const GALLERY_TEMPLATE_PRESETS = [
  {
    id: "wedding",
    name: "Wedding Gallery",
    style: "timeless-wedding",
    layout: "masonry",
    download: "web",
    selection: true,
  },
  {
    id: "pre-wedding",
    name: "Pre Wedding Gallery",
    style: "vogue-editorial",
    layout: "editorial",
    download: "web",
    selection: true,
  },
  {
    id: "birthday",
    name: "Birthday Event",
    style: "vogue-editorial",
    layout: "grid",
    download: "full",
    selection: false,
  },
  {
    id: "portfolio",
    name: "Portfolio Gallery",
    style: "andhakar",
    layout: "cinematic",
    download: "disabled",
    selection: false,
  },
  {
    id: "proofing",
    name: "Client Proofing",
    style: "vogue-editorial",
    layout: "justified",
    download: "web",
    selection: true,
  },
];

function TemplatesTab() {
  const { data: settings, isLoading } = useGallerySettings();
  const upsert = useUpsertSetting();

  // FIX: default to ALL enabled when no setting saved yet
  const enabledTemplates: string[] = (() => {
    const raw = settings?.[`${SETTINGS_PREFIX}enabled_templates`];
    if (!raw) return ALL_TEMPLATE_IDS;
    try {
      const parsed = JSON.parse(raw);
      return parsed.length === 0 ? ALL_TEMPLATE_IDS : parsed;
    } catch (err) {
      console.error('Gallery operation failed:', err);
      return ALL_TEMPLATE_IDS;
    }
  })();

  const toggle = async (id: string) => {
    const isOn = enabledTemplates.includes(id);
    const next = isOn ? enabledTemplates.filter((t) => t !== id) : [...enabledTemplates, id];
    await upsert.mutateAsync({ key: `${SETTINGS_PREFIX}enabled_templates`, value: JSON.stringify(next) });
    toast.success(`Template ${isOn ? "disabled" : "enabled"}`);
  };

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Gallery Template Library</CardTitle>
        <CardDescription>Toggle templates available to photographers when creating galleries.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {GALLERY_TEMPLATE_PRESETS.map((t) => {
            const on = enabledTemplates.includes(t.id);
            return (
              <div
                key={t.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all",
                  on ? "border-primary/30 bg-primary/5" : "border-border bg-card opacity-60",
                )}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t.style} • {t.layout} • Download: {t.download} • Selection: {t.selection ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
                <Switch checked={on} onCheckedChange={() => toggle(t.id)} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SelectionTab() {
  const { data: settings, isLoading } = useGallerySettings();
  const upsert = useUpsertSetting();

  const features = [
    { key: "sel_favorites", label: "Heart / Favorite System", desc: "Guests can favorite photos" },
    { key: "sel_shortlist", label: "Shortlist Images", desc: "Photographers can shortlist for clients" },
    { key: "sel_album_selection", label: "Album Selection Mode", desc: "Clients pick photos for album" },
    { key: "sel_compare", label: "Compare Images", desc: "Side-by-side comparison tool" },
    { key: "sel_comments", label: "Comment on Photos", desc: "Guests leave comments" },
  ];

  const isOn = (key: string) => (settings?.[`${SETTINGS_PREFIX}${key}`] ?? "true") === "true";

  const toggle = async (key: string, label: string) => {
    const next = !isOn(key);
    await upsert.mutateAsync({ key: `${SETTINGS_PREFIX}${key}`, value: String(next) });
    toast.success(`${label} ${next ? "enabled" : "disabled"}`);
  };

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Client Selection System</CardTitle>
        <CardDescription>Enable or disable selection features globally.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {features.map((f) => (
          <div key={f.key} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div>
              <p className="text-sm font-medium text-foreground">{f.label}</p>
              <p className="text-[11px] text-muted-foreground">{f.desc}</p>
            </div>
            <Switch checked={isOn(f.key)} onCheckedChange={() => toggle(f.key, f.label)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function BrandingTab() {
  const { data: settings, isLoading } = useGallerySettings();
  const upsert = useUpsertSetting();

  const options = [
    { key: "brand_show_logo", label: "Show Studio Logo", desc: "Display logo in gallery header" },
    { key: "brand_show_name", label: "Show Photographer Name", desc: "Display photographer name" },
    { key: "brand_custom_colors", label: "Allow Custom Color Themes", desc: "Photographers can set brand colors" },
    { key: "brand_custom_bg", label: "Allow Custom Backgrounds", desc: "Background pattern / gradient control" },
  ];

  const isOn = (key: string) => (settings?.[`${SETTINGS_PREFIX}${key}`] ?? "true") === "true";
  const toggle = async (key: string, label: string) => {
    const next = !isOn(key);
    await upsert.mutateAsync({ key: `${SETTINGS_PREFIX}${key}`, value: String(next) });
    toast.success(`${label} ${next ? "enabled" : "disabled"}`);
  };

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gallery Branding Controls</CardTitle>
          <CardDescription>Control what branding options photographers can use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {options.map((o) => (
            <div key={o.key} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div>
                <p className="text-sm font-medium text-foreground">{o.label}</p>
                <p className="text-[11px] text-muted-foreground">{o.desc}</p>
              </div>
              <Switch checked={isOn(o.key)} onCheckedChange={() => toggle(o.key, o.label)} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gallery Header Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingSelect
            settingsKey="brand_header_layout"
            label="Header Style"
            options={[
              { value: "minimal", label: "Minimal" },
              { value: "centered", label: "Centered Logo" },
              { value: "full", label: "Full Header Bar" },
            ]}
            defaultVal="minimal"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityTab() {
  const { data: settings, isLoading } = useGallerySettings();
  const upsert = useUpsertSetting();

  const features = [
    { key: "sec_password", label: "Password Protection", desc: "Allow gallery password gate" },
    { key: "sec_otp", label: "OTP Access", desc: "One-time PIN via email/SMS" },
    { key: "sec_watermark", label: "Watermark Protection", desc: "Apply watermark on gallery photos" },
    { key: "sec_no_screenshot", label: "Disable Screenshot (experimental)", desc: "CSS-based screenshot prevention" },
    { key: "sec_download_restrict", label: "Download Restrictions", desc: "Allow per-gallery download control" },
  ];

  const isOn = (key: string) => (settings?.[`${SETTINGS_PREFIX}${key}`] ?? "true") === "true";
  const toggle = async (key: string, label: string) => {
    const next = !isOn(key);
    await upsert.mutateAsync({ key: `${SETTINGS_PREFIX}${key}`, value: String(next) });
    toast.success(`${label} ${next ? "enabled" : "disabled"}`);
  };

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Gallery Security & Downloads</CardTitle>
        <CardDescription>Configure protection options available to photographers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {features.map((f) => (
          <div key={f.key} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div>
              <p className="text-sm font-medium text-foreground">{f.label}</p>
              <p className="text-[11px] text-muted-foreground">{f.desc}</p>
            </div>
            <Switch checked={isOn(f.key)} onCheckedChange={() => toggle(f.key, f.label)} />
          </div>
        ))}
        <Separator className="my-4" />
        <SettingSelect
          settingsKey="sec_default_download_mode"
          label="Default Download Mode"
          options={[
            { value: "full", label: "Full Resolution" },
            { value: "web", label: "Web Resolution" },
            { value: "disabled", label: "Disabled" },
          ]}
          defaultVal="web"
        />
      </CardContent>
    </Card>
  );
}

function AnalyticsTab() {
  const { data, isLoading } = useGalleryAnalytics();
  const stats = [
    { label: "Total Galleries", value: data?.totalGalleries ?? 0, icon: Image, color: "text-primary" },
    { label: "Total Photos", value: data?.totalPhotos ?? 0, icon: Grid3X3, color: "text-primary" },
    { label: "Gallery Views", value: data?.totalViews ?? 0, icon: Eye, color: "text-amber-500" },
    { label: "Downloads", value: data?.totalDownloads ?? 0, icon: Download, color: "text-emerald-500" },
    { label: "Favorites", value: data?.totalFavorites ?? 0, icon: Heart, color: "text-rose-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.color)} />
              <p className="text-2xl font-bold text-foreground">{isLoading ? "…" : s.value.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Gallery Health</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Analytics are aggregated from all photographer galleries in real-time via the event analytics system. Detailed
          per-gallery breakdowns are available in each photographer's dashboard.
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SettingSlider({
  settingsKey,
  label,
  min,
  max,
  defaultVal,
}: {
  settingsKey: string;
  label: string;
  min: number;
  max: number;
  defaultVal: number;
}) {
  const { data: settings } = useGallerySettings();
  const upsert = useUpsertSetting();
  const [localVal, setLocalVal] = useState(defaultVal);

  // FIX: sync local state when settings load
  useEffect(() => {
    const stored = settings?.[`${SETTINGS_PREFIX}${settingsKey}`];
    if (stored !== undefined) setLocalVal(parseInt(stored, 10));
  }, [settings, settingsKey]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs font-mono text-foreground">{localVal}px</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[localVal]}
        onValueChange={([v]) => setLocalVal(v)}
        onValueCommit={([v]) => {
          upsert.mutate({ key: `${SETTINGS_PREFIX}${settingsKey}`, value: String(v) });
          toast.success(`${label} saved`);
        }}
      />
    </div>
  );
}

function SettingSelect({
  settingsKey,
  label,
  options,
  defaultVal,
}: {
  settingsKey: string;
  label: string;
  options: { value: string; label: string }[];
  defaultVal: string;
}) {
  const { data: settings } = useGallerySettings();
  const upsert = useUpsertSetting();
  const val = settings?.[`${SETTINGS_PREFIX}${settingsKey}`] ?? defaultVal;

  return (
    <Field label={label}>
      <Select
        value={val}
        onValueChange={(v) => {
          upsert.mutate({ key: `${SETTINGS_PREFIX}${settingsKey}`, value: v });
          toast.success(`${label} updated`);
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
