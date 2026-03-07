import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURE_TOGGLES = [
  { key: 'mirrorai_enabled', label: 'MirrorAI Galleries', desc: 'Enable or disable gallery creation and access for all users' },
  { key: 'storybook_enabled', label: 'Storybook System', desc: 'Enable or disable storybook creation for all users' },
  { key: 'uploads_enabled', label: 'Photo Uploads', desc: 'Enable or disable photo uploads platform-wide' },
  { key: 'new_user_registration', label: 'New User Registration', desc: 'Allow or block new user signups' },
];

export default function SuperAdminSettings() {
  const { user: me } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('platform_settings').select('key, value');
    const map: Record<string, string> = {};
    (data || []).forEach((s: any) => { map[s.key] = s.value; });
    setSettings(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (key: string) => {
    const current = settings[key] === 'true';
    const newVal = (!current).toString();
    setSaving(key);

    const { error } = await supabase
      .from('platform_settings')
      .update({ value: newVal, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) {
      // Try insert if not exists
      await supabase.from('platform_settings').insert({ key, value: newVal });
    }

    await supabase.from('admin_activity_log').insert({
      action: `toggle_${key}`, target: newVal,
      performed_by: me?.email || 'super_admin',
    });

    setSettings((prev) => ({ ...prev, [key]: newVal }));
    toast.success(`${key} set to ${newVal}`);
    setSaving(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Platform Settings</h1>
          <p className="text-sm text-muted-foreground">Feature toggles and global configuration</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <Settings className="h-4 w-4" /> Feature Toggles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            FEATURE_TOGGLES.map((f) => (
              <div key={f.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
                <Switch
                  checked={settings[f.key] === 'true'}
                  onCheckedChange={() => toggle(f.key)}
                  disabled={saving === f.key}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-serif">All Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(settings).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border/30">
                <code className="text-xs font-mono text-muted-foreground">{k}</code>
                <code className="text-xs font-mono text-foreground">{v}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
