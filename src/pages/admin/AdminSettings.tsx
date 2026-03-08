import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformSettings, useInvalidateSettings } from '@/hooks/use-platform-settings';

export default function AdminSettings() {
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');

  const { data: settings = {} } = usePlatformSettings();
  const invalidateSettings = useInvalidateSettings();

  const allowRegistrations = (settings['allowRegistrations'] ?? 'true') !== 'false';
  const maintenanceMode = settings['maintenanceMode'] === 'true';
  const forceWatermark = settings['forceWatermark'] === 'true';

  useEffect(() => {
    const code = localStorage.getItem('mirrorai_admin_code') || '291294';
    setCurrentCode(code);
  }, []);

  const handleSaveCode = () => {
    if (!newCode || newCode.length < 4) {
      toast.error('Code must be at least 4 characters');
      return;
    }
    if (newCode !== confirmCode) {
      toast.error('Codes do not match');
      return;
    }
    localStorage.setItem('mirrorai_admin_code', newCode);
    setCurrentCode(newCode);
    setNewCode('');
    setConfirmCode('');
    toast.success('Access code updated');
  };

  const handleToggle = async (key: string, value: boolean) => {
    const newVal = value ? 'true' : 'false';
    const { error } = await supabase
      .from('platform_settings')
      .update({ value: newVal, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) {
      // Key doesn't exist yet — insert it
      await supabase.from('platform_settings').insert({ key, value: newVal });
    }
    invalidateSettings();
    toast.success('Setting updated');
  };

  const clearActivityLogs = async () => {
    await (supabase.from('admin_activity_log' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000') as any);
    toast.success('Activity logs cleared');
  };

  const resetSettings = async () => {
    const keys = ['allowRegistrations', 'maintenanceMode', 'forceWatermark'];
    for (const key of keys) {
      await supabase
        .from('platform_settings')
        .update({ value: key === 'allowRegistrations' ? 'true' : 'false', updated_at: new Date().toISOString() })
        .eq('key', key);
    }
    localStorage.removeItem('mirrorai_admin_code');
    setCurrentCode('291294');
    invalidateSettings();
    toast.success('Platform settings reset');
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="font-serif text-2xl font-semibold text-foreground">Admin Settings</h1>

      {/* Change Access Code */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-serif text-base font-semibold">Change Access Code</h3>
          <div className="space-y-1.5">
            <Label className="text-xs">Current Code</Label>
            <Input type="password" value={currentCode} disabled className="bg-secondary max-w-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">New Code</Label>
            <Input type="password" value={newCode} onChange={(e) => setNewCode(e.target.value)}
              placeholder="Enter new code" className="bg-background max-w-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Confirm Code</Label>
            <Input type="password" value={confirmCode} onChange={(e) => setConfirmCode(e.target.value)}
              placeholder="Confirm new code" className="bg-background max-w-xs" />
          </div>
          <Button onClick={handleSaveCode} size="sm">Save Code</Button>
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card>
        <CardContent className="p-5 space-y-5">
          <h3 className="font-serif text-base font-semibold">Platform Settings</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Allow New Registrations</p>
              <p className="text-[11px] text-muted-foreground">Enable or disable new photographer signups</p>
            </div>
            <Switch checked={allowRegistrations} onCheckedChange={(v) => handleToggle('allowRegistrations', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
              <p className="text-[11px] text-muted-foreground">Show maintenance banner on admin pages</p>
            </div>
            <Switch checked={maintenanceMode} onCheckedChange={(v) => handleToggle('maintenanceMode', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Force Watermark on Free Galleries</p>
              <p className="text-[11px] text-muted-foreground">Automatically apply watermark to all free plan galleries</p>
            </div>
            <Switch checked={forceWatermark} onCheckedChange={(v) => handleToggle('forceWatermark', v)} />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-serif text-base font-semibold text-destructive">Danger Zone</h3>
          <div className="flex gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30">Clear All Activity Logs</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Activity Logs</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete all admin activity logs. Continue?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearActivityLogs} className="bg-destructive text-destructive-foreground">Clear</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30">Reset Platform Settings</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Settings</AlertDialogTitle>
                  <AlertDialogDescription>This will reset all platform settings to defaults including the access code. Continue?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetSettings} className="bg-destructive text-destructive-foreground">Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
