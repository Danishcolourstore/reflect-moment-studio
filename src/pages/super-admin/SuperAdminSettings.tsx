import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { RefreshCw, Settings } from "lucide-react";

type SettingsMap = Record<string, string>;

const FEATURE_TOGGLES = [
  {
    key: "mirrorai_enabled",
    label: "MirrorAI Galleries",
    desc: "Enable or disable gallery creation and access for all users",
  },
  {
    key: "storybook_enabled",
    label: "Storybook System",
    desc: "Enable or disable storybook creation for all users",
  },
  {
    key: "uploads_enabled",
    label: "Photo Uploads",
    desc: "Enable or disable photo uploads platform-wide",
  },
  {
    key: "new_user_registration",
    label: "New User Registration",
    desc: "Allow or block new user signups",
  },
];

export default function SuperAdminSettings() {
  const { user: me } = useAuth();

  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  /* -----------------------------
     Load settings from database
  ----------------------------- */

  const loadSettings = async () => {
    setLoading(true);

    const { data, error } = await supabase.from("platform_settings").select("key, value");

    if (error) {
      toast.error("Failed to load platform settings");
      setLoading(false);
      return;
    }

    const map: SettingsMap = {};

    (data || []).forEach((item: any) => {
      map[item.key] = item.value;
    });

    setSettings(map);
    setLoading(false);
  };

  /* -----------------------------
     Initial load
  ----------------------------- */

  useEffect(() => {
    loadSettings();
  }, []);

  /* -----------------------------
     Realtime updates
  ----------------------------- */

  useEffect(() => {
    const channel = supabase
      .channel("platform-settings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "platform_settings",
        },
        () => {
          loadSettings();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* -----------------------------
     Toggle feature
  ----------------------------- */

  const toggleFeature = async (key: string) => {
    if (saving) return;

    const current = settings[key] === "true";
    const newValue = (!current).toString();

    setSaving(key);

    try {
      const { error } = await supabase.from("platform_settings").upsert({
        key: key,
        value: newValue,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      await supabase.from("admin_activity_log").insert({
        action: `toggle_${key}`,
        target: newValue,
        performed_by: me?.email || "super_admin",
      });

      setSettings((prev) => ({
        ...prev,
        [key]: newValue,
      }));

      toast.success(`${key} updated`);
    } catch (err) {
      toast.error("Failed to update setting");
    }

    setSaving(null);
  };

  /* -----------------------------
     UI
  ----------------------------- */

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Platform Settings</h1>
          <p className="text-sm text-muted-foreground">Feature toggles and global configuration</p>
        </div>

        <Button variant="outline" size="sm" onClick={loadSettings} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* FEATURE TOGGLES */}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Feature Toggles
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          ) : (
            FEATURE_TOGGLES.map((feature) => (
              <div
                key={feature.key}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>

                <Switch
                  checked={settings[feature.key] === "true"}
                  onCheckedChange={() => toggleFeature(feature.key)}
                  disabled={saving === feature.key}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ALL SETTINGS LIST */}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-serif">All Settings</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            {Object.entries(settings).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border/30"
              >
                <code className="text-xs font-mono text-muted-foreground">{key}</code>

                <code className="text-xs font-mono text-foreground">{value}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
