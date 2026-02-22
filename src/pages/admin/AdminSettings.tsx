import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Settings, Shield } from 'lucide-react';

export default function AdminSettings() {
  const { toast } = useToast();
  const [platformName, setPlatformName] = useState('MirrorAI');
  const [defaultStorageLimit, setDefaultStorageLimit] = useState('5120');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await (supabase.from('platform_settings').select('key, value') as any);
    if (!data) return;
    const map: Record<string, string> = {};
    (data as any[]).forEach((r: any) => { map[r.key] = r.value; });
    if (map.platform_name) setPlatformName(map.platform_name);
    if (map.default_storage_limit_mb) setDefaultStorageLimit(map.default_storage_limit_mb);
    if (map.maintenance_mode) setMaintenanceMode(map.maintenance_mode === 'true');
  };

  const saveSetting = async (key: string, value: string) => {
    setSaving(true);
    const { error } = await (supabase.from('platform_settings').update({ value, updated_at: new Date().toISOString() }) as any).eq('key', key);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Saved' });
    setSaving(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[26px] font-semibold text-foreground tracking-tight">Platform Settings</h1>
        <p className="text-[11px] text-muted-foreground/50 mt-1">Configure global platform behavior</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Platform name */}
        <div className="bg-card border border-border p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-4 w-4 text-primary/60" />
            <h2 className="text-[12px] font-medium text-foreground uppercase tracking-[0.08em]">General</h2>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Platform Name</label>
            <div className="flex gap-2">
              <Input
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="h-9 text-[12px] bg-background border-border"
              />
              <Button
                size="sm"
                className="h-9 text-[11px] px-4"
                disabled={saving}
                onClick={() => saveSetting('platform_name', platformName)}
              >
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Storage defaults */}
        <div className="bg-card border border-border p-5 space-y-3">
          <h2 className="text-[12px] font-medium text-foreground uppercase tracking-[0.08em]">Storage</h2>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Default Storage Limit for New Photographers</label>
            <div className="flex gap-2">
              <Select value={defaultStorageLimit} onValueChange={setDefaultStorageLimit}>
                <SelectTrigger className="h-9 w-[140px] text-[12px] border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024">1 GB</SelectItem>
                  <SelectItem value="5120">5 GB</SelectItem>
                  <SelectItem value="10240">10 GB</SelectItem>
                  <SelectItem value="51200">50 GB</SelectItem>
                  <SelectItem value="102400">100 GB</SelectItem>
                  <SelectItem value="0">Unlimited</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-9 text-[11px] px-4"
                disabled={saving}
                onClick={() => saveSetting('default_storage_limit_mb', defaultStorageLimit)}
              >
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Maintenance mode */}
        <div className="bg-card border border-border p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-destructive/60" />
            <h2 className="text-[12px] font-medium text-foreground uppercase tracking-[0.08em]">Maintenance</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-foreground font-medium">Maintenance Mode</p>
              <p className="text-[10px] text-muted-foreground/50">Shows a maintenance page to all non-admin users</p>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={(checked) => {
                setMaintenanceMode(checked);
                saveSetting('maintenance_mode', String(checked));
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
