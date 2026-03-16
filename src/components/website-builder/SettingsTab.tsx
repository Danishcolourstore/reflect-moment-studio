import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WebsiteProfile } from '@/pages/WebsiteBuilder';

interface Props {
  websiteId: string;
  profile: WebsiteProfile;
  userId: string;
}

export function SettingsTab({ websiteId, profile, userId }: Props) {
  const [studioName, setStudioName] = useState(profile.studioName);
  const [tagline, setTagline] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [accentColor, setAccentColor] = useState('#D4AF37');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await (supabase.from('photographer_websites').update({
      studio_name: studioName,
      tagline,
      email,
      phone,
      whatsapp,
      accent_color: accentColor,
      theme_mode: themeMode,
      updated_at: new Date().toISOString(),
    } as any).eq('id', websiteId) as any);
    setSaving(false);
    toast.success('Settings saved!');
  };

  const fields = [
    { label: 'Studio Name', value: studioName, onChange: setStudioName, placeholder: 'Your Studio' },
    { label: 'Tagline', value: tagline, onChange: setTagline, placeholder: 'Capturing moments that last forever' },
    { label: 'Email', value: email, onChange: setEmail, placeholder: 'hello@studio.com', type: 'email' },
    { label: 'Phone', value: phone, onChange: setPhone, placeholder: '+91 98765 43210' },
    { label: 'WhatsApp Number', value: whatsapp, onChange: setWhatsapp, placeholder: '+91 98765 43210' },
  ];

  return (
    <div className="max-w-lg animate-in fade-in duration-500">
      <h2 className="font-display text-lg text-foreground mb-6">Website Settings</h2>

      <div className="space-y-5">
        {fields.map(field => (
          <div key={field.label}>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium block mb-2">
              {field.label}
            </label>
            <Input
              type={field.type || 'text'}
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              className="bg-secondary/50 border-border/50 h-11 text-foreground placeholder:text-muted-foreground/40"
            />
          </div>
        ))}

        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium block mb-2">
            Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              className="h-10 w-14 rounded-md border border-border/30 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-muted-foreground font-mono">{accentColor}</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium block mb-2">
            Website Theme
          </label>
          <div className="flex gap-2">
            {(['dark', 'light'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setThemeMode(mode)}
                className={`px-5 py-2 rounded-md text-xs font-medium capitalize transition-all ${
                  themeMode === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground border border-border/30 hover:text-foreground'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
