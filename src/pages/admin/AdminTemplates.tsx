import { useState } from 'react';
import { TEMPLATE_LIST, type TemplateConfig } from '@/lib/website-templates';
import { templatePreviews } from '@/assets/templates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Eye, Pencil, Palette, Type, Layout, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateState {
  enabled: boolean;
  overrideName?: string;
  overrideTagline?: string;
}

export default function AdminTemplates() {
  const [states, setStates] = useState<Record<string, TemplateState>>(() => {
    const saved = localStorage.getItem('admin_template_states');
    if (saved) return JSON.parse(saved);
    const init: Record<string, TemplateState> = {};
    TEMPLATE_LIST.forEach(t => { init[t.id] = { enabled: true }; });
    return init;
  });

  const [editingTemplate, setEditingTemplate] = useState<TemplateConfig | null>(null);
  const [editName, setEditName] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateConfig | null>(null);

  const persist = (next: Record<string, TemplateState>) => {
    setStates(next);
    localStorage.setItem('admin_template_states', JSON.stringify(next));
  };

  const toggleEnabled = (id: string) => {
    const next = { ...states, [id]: { ...states[id], enabled: !states[id]?.enabled } };
    persist(next);
    toast.success(next[id].enabled ? 'Template enabled' : 'Template disabled');
  };

  const openEdit = (tmpl: TemplateConfig) => {
    setEditingTemplate(tmpl);
    setEditName(states[tmpl.id]?.overrideName || tmpl.name);
    setEditTagline(states[tmpl.id]?.overrideTagline || tmpl.tagline);
  };

  const saveEdit = () => {
    if (!editingTemplate) return;
    const next = {
      ...states,
      [editingTemplate.id]: {
        ...states[editingTemplate.id],
        overrideName: editName !== editingTemplate.name ? editName : undefined,
        overrideTagline: editTagline !== editingTemplate.tagline ? editTagline : undefined,
      },
    };
    persist(next);
    setEditingTemplate(null);
    toast.success('Template updated');
  };

  const enabledCount = Object.values(states).filter(s => s.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
            Template Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enable, disable, and customise website templates available to photographers
          </p>
        </div>
        <Badge variant="outline" className="text-[11px] w-fit">
          {enabledCount} of {TEMPLATE_LIST.length} active
        </Badge>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {TEMPLATE_LIST.map((tmpl) => {
          const state = states[tmpl.id] || { enabled: true };
          const displayName = state.overrideName || tmpl.name;
          const displayTagline = state.overrideTagline || tmpl.tagline;

          return (
            <Card
              key={tmpl.id}
              className={`overflow-hidden transition-all ${
                !state.enabled ? 'opacity-50 grayscale' : ''
              }`}
            >
              {/* Preview thumbnail */}
              <div className="relative h-40 overflow-hidden" style={{ backgroundColor: tmpl.colors.bg }}>
                {templatePreviews[tmpl.id] ? (
                  <img
                    src={templatePreviews[tmpl.id]}
                    alt={`${displayName} preview`}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: tmpl.colors.bg }}
                  >
                    <p
                      className="text-lg font-light tracking-wide"
                      style={{ fontFamily: tmpl.fonts.display, color: tmpl.colors.text }}
                    >
                      {displayName}
                    </p>
                  </div>
                )}

                {/* Enabled badge */}
                {state.enabled && (
                  <div className="absolute top-2 right-2">
                    <Badge className="text-[9px] bg-primary/90 text-primary-foreground">
                      <Check className="h-2.5 w-2.5 mr-0.5" /> Active
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Info */}
                <div>
                  <p className="text-sm font-medium text-foreground">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground">{displayTagline}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 line-clamp-2">
                    {tmpl.description}
                  </p>
                </div>

                {/* Details chips */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[9px] gap-1">
                    <Layout className="h-2.5 w-2.5" /> {tmpl.sections.hero}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] gap-1">
                    <Palette className="h-2.5 w-2.5" /> {tmpl.colors.accent}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] gap-1">
                    <Type className="h-2.5 w-2.5" /> {tmpl.fonts.displayWeight}
                  </Badge>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={state.enabled}
                      onCheckedChange={() => toggleEnabled(tmpl.id)}
                      className="scale-90"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {state.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setPreviewTemplate(tmpl)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => openEdit(tmpl)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Edit Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Display Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Tagline</Label>
                <Input
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Section Layout</Label>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(editingTemplate.sections).map(([key, val]) => (
                    <div key={key} className="flex justify-between px-2 py-1.5 bg-secondary/50 rounded">
                      <span className="text-muted-foreground capitalize">{key}</span>
                      <span className="font-medium text-foreground">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Color Palette</Label>
                <div className="flex gap-2">
                  {[editingTemplate.colors.bg, editingTemplate.colors.text, editingTemplate.colors.accent, editingTemplate.colors.border].map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className="h-8 w-8 rounded-full border border-border"
                        style={{ backgroundColor: c }}
                      />
                      <span className="text-[9px] text-muted-foreground">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {previewTemplate?.name} Preview
            </DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              {templatePreviews[previewTemplate.id] ? (
                <img
                  src={templatePreviews[previewTemplate.id]}
                  alt={`${previewTemplate.name} full preview`}
                  className="w-full rounded-lg border border-border"
                />
              ) : (
                <div
                  className="h-64 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: previewTemplate.colors.bg }}
                >
                  <p
                    className="text-2xl"
                    style={{ fontFamily: previewTemplate.fonts.display, color: previewTemplate.colors.text }}
                  >
                    {previewTemplate.name}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <p className="font-medium text-foreground mb-1">Sections</p>
                  {Object.entries(previewTemplate.sections).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-0.5">
                      <span className="text-muted-foreground capitalize">{key}</span>
                      <span>{val}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Typography</p>
                  <p className="text-muted-foreground">Display: {previewTemplate.fonts.display}</p>
                  <p className="text-muted-foreground">Weight: {previewTemplate.fonts.displayWeight}</p>
                  <p className="text-muted-foreground">Style: {previewTemplate.fonts.displayStyle}</p>
                  <p className="text-muted-foreground mt-2">UI: {previewTemplate.fonts.ui}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
