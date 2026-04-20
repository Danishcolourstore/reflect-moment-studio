import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Plus, Search, Grid3X3, Pencil, Trash2, Copy, Eye, EyeOff,
  Upload, ArrowUpDown, Sparkles, Settings2, GripVertical, X,
  LayoutGrid, Image as ImageIcon, Type, Square, Frame, Sticker,
  Save, RotateCcw,
} from 'lucide-react';

/* ─── Types ─── */
interface GridTemplate {
  id: string;
  name: string;
  category: string;
  grid_type: string;
  columns: number;
  rows: number;
  spacing: number;
  padding: number;
  border_radius: number;
  background_color: string;
  layout_config: any;
  frame_style: string | null;
  preview_image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface GridCell {
  id: string;
  rowStart: number;
  colStart: number;
  rowEnd: number;
  colEnd: number;
}

const CATEGORIES = ['basic', 'instagram', 'creative', 'single'];

const GRID_TYPES = ['basic', 'instagram', 'creative', 'single', 'custom'];

const DEFAULT_TEMPLATE: Partial<GridTemplate> = {
  name: '',
  category: 'basic',
  grid_type: 'basic',
  columns: 3,
  rows: 3,
  spacing: 4,
  padding: 0,
  border_radius: 0,
  background_color: '#ffffff',
  layout_config: { cells: [], canvasRatio: 1 },
  frame_style: null,
  is_active: true,
  sort_order: 0,
};

/* ─── UI Config Panel ─── */
interface UIConfig {
  textTool: boolean;
  shapeTool: boolean;
  imageTool: boolean;
  frameTool: boolean;
  stickerTool: boolean;
  gridSnapping: boolean;
  defaultFont: string;
  defaultSpacing: number;
}

const DEFAULT_UI_CONFIG: UIConfig = {
  textTool: true,
  shapeTool: true,
  imageTool: true,
  frameTool: true,
  stickerTool: true,
  gridSnapping: true,
  defaultFont: 'Jost',
  defaultSpacing: 4,
};

/* ─── Main Component ─── */
export default function SuperAdminGridManager() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<GridTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('templates');

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<GridTemplate>>(DEFAULT_TEMPLATE);
  const [editorCells, setEditorCells] = useState<GridCell[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // UI Config state
  const [uiConfig, setUiConfig] = useState<UIConfig>(DEFAULT_UI_CONFIG);

  /* ─── Fetch Templates ─── */
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('grid_templates')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setTemplates(data as GridTemplate[]);
    if (error) toast.error('Failed to load templates');
    setLoading(false);
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // Load UI config from platform_settings
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'grid_builder_ui_config')
        .maybeSingle();
      if (data?.value) {
        try { setUiConfig(JSON.parse(data.value)); } catch {}
      }
    })();
  }, []);

  /* ─── Grid cell generation ─── */
  const generateCells = (cols: number, rows: number): GridCell[] => {
    const cells: GridCell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({
          id: `${r}-${c}`,
          rowStart: r + 1,
          colStart: c + 1,
          rowEnd: r + 2,
          colEnd: c + 2,
        });
      }
    }
    return cells;
  };

  /* ─── CRUD ─── */
  const openNewTemplate = () => {
    const t = { ...DEFAULT_TEMPLATE };
    setEditingTemplate(t);
    setEditorCells(generateCells(t.columns!, t.rows!));
    setEditorOpen(true);
  };

  const openEditTemplate = (tmpl: GridTemplate) => {
    setEditingTemplate({ ...tmpl });
    const config = tmpl.layout_config as any;
    if (config?.cells?.length) {
      setEditorCells(config.cells.map((c: number[], i: number) => ({
        id: String(i),
        rowStart: c[0], colStart: c[1], rowEnd: c[2], colEnd: c[3],
      })));
    } else {
      setEditorCells(generateCells(tmpl.columns, tmpl.rows));
    }
    setEditorOpen(true);
  };

  const saveTemplate = async () => {
    if (!editingTemplate.name?.trim()) {
      toast.error('Template name is required');
      return;
    }
    setSaving(true);

    const layoutConfig = {
      cells: editorCells.map(c => [c.rowStart, c.colStart, c.rowEnd, c.colEnd]),
      canvasRatio: 1,
    };

    const payload = {
      name: editingTemplate.name,
      category: editingTemplate.category || 'basic',
      grid_type: editingTemplate.grid_type || 'basic',
      columns: editingTemplate.columns || 3,
      rows: editingTemplate.rows || 3,
      spacing: editingTemplate.spacing || 4,
      padding: editingTemplate.padding || 0,
      border_radius: editingTemplate.border_radius || 0,
      background_color: editingTemplate.background_color || '#ffffff',
      layout_config: layoutConfig,
      frame_style: editingTemplate.frame_style || null,
      is_active: editingTemplate.is_active ?? true,
      sort_order: editingTemplate.sort_order || 0,
    };

    let error;
    if (editingTemplate.id) {
      ({ error } = await supabase.from('grid_templates').update(payload).eq('id', editingTemplate.id));
    } else {
      ({ error } = await supabase.from('grid_templates').insert(payload));
    }

    if (error) {
      toast.error('Failed to save template');
    } else {
      toast.success(editingTemplate.id ? 'Template updated' : 'Template created');
      setEditorOpen(false);
      fetchTemplates();
    }
    setSaving(false);
  };

  const duplicateTemplate = async (tmpl: GridTemplate) => {
    const { id, created_at, updated_at, ...rest } = tmpl;
    const { error } = await supabase.from('grid_templates').insert({ ...rest, name: `${rest.name} (Copy)` });
    if (error) toast.error('Failed to duplicate');
    else { toast.success('Template duplicated'); fetchTemplates(); }
  };

  const toggleActive = async (tmpl: GridTemplate) => {
    await supabase.from('grid_templates').update({ is_active: !tmpl.is_active }).eq('id', tmpl.id);
    toast.success(tmpl.is_active ? 'Template deactivated' : 'Template activated');
    fetchTemplates();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('grid_templates').delete().eq('id', deleteId);
    toast.success('Template deleted');
    setDeleteId(null);
    fetchTemplates();
  };

  const saveUIConfig = async () => {
    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        key: 'grid_builder_ui_config',
        value: JSON.stringify(uiConfig),
      }, { onConflict: 'key' });
    if (error) toast.error('Failed to save UI config');
    else toast.success('UI configuration saved — changes sync instantly');
  };

  /* ─── Filtering ─── */
  const filtered = templates.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const usedCategories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Grid3X3 className="h-6 w-6 text-amber-500" />
            Grid Builder Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create, manage, and push grid templates to all users instantly</p>
        </div>
        <Button onClick={openNewTemplate} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2">
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="templates" className="gap-1.5 data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-500">
            <LayoutGrid className="h-3.5 w-3.5" /> Templates
          </TabsTrigger>
          <TabsTrigger value="ui-config" className="gap-1.5 data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-500">
            <Settings2 className="h-3.5 w-3.5" /> UI/UX Config
          </TabsTrigger>
          <TabsTrigger value="inspire" className="gap-1.5 data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-500">
            <Sparkles className="h-3.5 w-3.5" /> Inspire Import
          </TabsTrigger>
        </TabsList>

        {/* ─── TEMPLATES TAB ─── */}
        <TabsContent value="templates" className="mt-6">
          {/* Search & filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="pl-9 bg-card h-10" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-10 bg-card">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Templates', value: templates.length, color: 'text-foreground' },
              { label: 'Active', value: templates.filter(t => t.is_active).length, color: 'text-emerald-500' },
              { label: 'Inactive', value: templates.filter(t => !t.is_active).length, color: 'text-muted-foreground' },
              { label: 'Categories', value: usedCategories.length, color: 'text-amber-500' },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Template List */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border rounded-xl">
              <Grid3X3 className="mx-auto h-12 w-12 text-muted-foreground/20" />
              <p className="mt-4 text-muted-foreground">No templates found</p>
              <Button onClick={openNewTemplate} className="mt-4 bg-amber-500 hover:bg-amber-600 text-black">
                <Plus className="h-4 w-4 mr-1.5" /> Create First Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(tmpl => (
                <div key={tmpl.id} className="bg-card border border-border rounded-xl overflow-hidden group hover:border-amber-500/30 transition-all">
                  {/* Preview */}
                  <div className="aspect-square bg-muted/20 relative p-3">
                    <GridPreview template={tmpl} />
                    {!tmpl.is_active && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      </div>
                    )}
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => openEditTemplate(tmpl)} className="h-9 w-9 rounded-full bg-amber-500/20 flex items-center justify-center hover:bg-amber-500/30">
                        <Pencil className="h-4 w-4 text-amber-500" />
                      </button>
                      <button onClick={() => duplicateTemplate(tmpl)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button onClick={() => toggleActive(tmpl)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                        {tmpl.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => setDeleteId(tmpl.id)} className="h-9 w-9 rounded-full bg-destructive/20 flex items-center justify-center hover:bg-destructive/30">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 border-t border-border">
                    <p className="text-sm font-medium text-foreground truncate">{tmpl.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{tmpl.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">{tmpl.columns}×{tmpl.rows}</span>
                      {tmpl.is_active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-auto" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── UI/UX CONFIG TAB ─── */}
        <TabsContent value="ui-config" className="mt-6">
          <div className="max-w-2xl">
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Tool Visibility</h3>
                <p className="text-xs text-muted-foreground mb-4">Enable or disable tools available to photographers in Grid Builder</p>
                <div className="space-y-3">
                  {[
                    { key: 'textTool' as const, icon: Type, label: 'Text Tool', desc: 'Add text overlays to grids' },
                    { key: 'shapeTool' as const, icon: Square, label: 'Shape Tool', desc: 'Add shapes and decorations' },
                    { key: 'imageTool' as const, icon: ImageIcon, label: 'Image Tool', desc: 'Upload and place images' },
                    { key: 'frameTool' as const, icon: Frame, label: 'Frame Tool', desc: 'Apply frame styles to photos' },
                    { key: 'stickerTool' as const, icon: Sticker, label: 'Sticker Tool', desc: 'Add stickers and badges' },
                  ].map(tool => (
                    <div key={tool.key} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <tool.icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{tool.label}</p>
                          <p className="text-[11px] text-muted-foreground">{tool.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={uiConfig[tool.key]}
                        onCheckedChange={v => setUiConfig(prev => ({ ...prev, [tool.key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border" />

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Canvas Settings</h3>
                <p className="text-xs text-muted-foreground mb-4">Default settings for the Grid Builder canvas</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">Grid Snapping</p>
                      <p className="text-[11px] text-muted-foreground">Snap elements to grid lines</p>
                    </div>
                    <Switch
                      checked={uiConfig.gridSnapping}
                      onCheckedChange={v => setUiConfig(prev => ({ ...prev, gridSnapping: v }))}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Default Font</Label>
                    <Select value={uiConfig.defaultFont} onValueChange={v => setUiConfig(prev => ({ ...prev, defaultFont: v }))}>
                      <SelectTrigger className="mt-1 bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Jost', 'Cormorant Garamond', 'Playfair Display', 'DM Sans', 'Inter'].map(f => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Default Spacing: {uiConfig.defaultSpacing}px</Label>
                    <Slider
                      value={[uiConfig.defaultSpacing]}
                      onValueChange={([v]) => setUiConfig(prev => ({ ...prev, defaultSpacing: v }))}
                      min={0} max={20} step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={saveUIConfig} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2">
                <Save className="h-4 w-4" /> Save UI Configuration
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ─── INSPIRE IMPORT TAB ─── */}
        <TabsContent value="inspire" className="mt-6">
          <InspireImportPanel onTemplateCreated={fetchTemplates} />
        </TabsContent>
      </Tabs>

      {/* ─── Template Editor Dialog ─── */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-amber-500" />
              {editingTemplate.id ? 'Edit Template' : 'New Template'}
            </DialogTitle>
            <DialogDescription>Design a grid template layout. Changes sync to all users instantly.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Left: Settings */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Template Name</Label>
                <Input
                  value={editingTemplate.name || ''}
                  onChange={e => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Modern 3×3 Grid"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={editingTemplate.category || 'Instagram Grid'}
                    onValueChange={v => setEditingTemplate(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Grid Type</Label>
                  <Select
                    value={editingTemplate.grid_type || 'basic'}
                    onValueChange={v => setEditingTemplate(prev => ({ ...prev, grid_type: v }))}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GRID_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Columns: {editingTemplate.columns}</Label>
                  <Slider
                    value={[editingTemplate.columns || 3]}
                    onValueChange={([v]) => {
                      setEditingTemplate(prev => ({ ...prev, columns: v }));
                      setEditorCells(generateCells(v, editingTemplate.rows || 3));
                    }}
                    min={1} max={6} step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-xs">Rows: {editingTemplate.rows}</Label>
                  <Slider
                    value={[editingTemplate.rows || 3]}
                    onValueChange={([v]) => {
                      setEditingTemplate(prev => ({ ...prev, rows: v }));
                      setEditorCells(generateCells(editingTemplate.columns || 3, v));
                    }}
                    min={1} max={6} step={1}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Spacing: {editingTemplate.spacing}px</Label>
                  <Slider
                    value={[editingTemplate.spacing || 0]}
                    onValueChange={([v]) => setEditingTemplate(prev => ({ ...prev, spacing: v }))}
                    min={0} max={20} step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-xs">Padding: {editingTemplate.padding}px</Label>
                  <Slider
                    value={[editingTemplate.padding || 0]}
                    onValueChange={([v]) => setEditingTemplate(prev => ({ ...prev, padding: v }))}
                    min={0} max={40} step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-xs">Radius: {editingTemplate.border_radius}px</Label>
                  <Slider
                    value={[editingTemplate.border_radius || 0]}
                    onValueChange={([v]) => setEditingTemplate(prev => ({ ...prev, border_radius: v }))}
                    min={0} max={24} step={1}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Background Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={editingTemplate.background_color || '#ffffff'}
                    onChange={e => setEditingTemplate(prev => ({ ...prev, background_color: e.target.value }))}
                    className="h-9 w-12 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={editingTemplate.background_color || '#ffffff'}
                    onChange={e => setEditingTemplate(prev => ({ ...prev, background_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Active</p>
                  <p className="text-[10px] text-muted-foreground">Visible to photographers</p>
                </div>
                <Switch
                  checked={editingTemplate.is_active ?? true}
                  onCheckedChange={v => setEditingTemplate(prev => ({ ...prev, is_active: v }))}
                />
              </div>

              <div>
                <Label className="text-xs">Sort Order</Label>
                <Input
                  type="number"
                  value={editingTemplate.sort_order || 0}
                  onChange={e => setEditingTemplate(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Right: Visual Preview */}
            <div>
              <Label className="text-xs mb-2 block">Live Preview</Label>
              <div
                className="aspect-square rounded-xl border border-border overflow-hidden"
                style={{
                  backgroundColor: editingTemplate.background_color || '#ffffff',
                  padding: `${editingTemplate.padding || 0}px`,
                }}
              >
                <div
                  className="w-full h-full grid"
                  style={{
                    gridTemplateColumns: `repeat(${editingTemplate.columns || 3}, 1fr)`,
                    gridTemplateRows: `repeat(${editingTemplate.rows || 3}, 1fr)`,
                    gap: `${editingTemplate.spacing || 0}px`,
                  }}
                >
                  {editorCells.map(cell => (
                    <div
                      key={cell.id}
                      className="bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/40 transition-colors cursor-pointer flex items-center justify-center"
                      style={{
                        gridColumn: `${cell.colStart} / ${cell.colEnd}`,
                        gridRow: `${cell.rowStart} / ${cell.rowEnd}`,
                        borderRadius: `${editingTemplate.border_radius || 0}px`,
                      }}
                    >
                      <ImageIcon className="h-5 w-5 text-amber-500/40" />
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                {editorCells.length} cells · {editingTemplate.columns}×{editingTemplate.rows} grid
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={saveTemplate} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2">
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Template?</DialogTitle>
            <DialogDescription>This will permanently remove this grid template from the library. Users will no longer see it.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Grid Preview Component ─── */
function GridPreview({ template }: { template: GridTemplate }) {
  const config = template.layout_config as any;
  const cells = config?.cells?.length
    ? config.cells.map((c: number[], i: number) => ({ id: String(i), rowStart: c[0], colStart: c[1], rowEnd: c[2], colEnd: c[3] }))
    : Array.from({ length: template.columns * template.rows }, (_, i) => ({
        id: String(i),
        rowStart: Math.floor(i / template.columns) + 1,
        colStart: (i % template.columns) + 1,
        rowEnd: Math.floor(i / template.columns) + 2,
        colEnd: (i % template.columns) + 2,
      }));

  return (
    <div
      className="w-full h-full grid"
      style={{
        gridTemplateColumns: `repeat(${template.columns}, 1fr)`,
        gridTemplateRows: `repeat(${template.rows}, 1fr)`,
        gap: `${Math.min(template.spacing, 6)}px`,
        padding: `${Math.min(template.padding, 8)}px`,
        backgroundColor: template.background_color,
        borderRadius: `${template.border_radius}px`,
      }}
    >
      {cells.map((cell: any) => (
        <div
          key={cell.id}
          className="bg-foreground/10 rounded-sm"
          style={{
            gridColumn: `${cell.colStart} / ${cell.colEnd}`,
            gridRow: `${cell.rowStart} / ${cell.rowEnd}`,
            borderRadius: `${Math.min(template.border_radius, 4)}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Inspire Import Panel ─── */
function InspireImportPanel({ onTemplateCreated }: { onTemplateCreated: () => void }) {
  const [image, setImage] = useState<string | null>(null);
  const [gridOverlay, setGridOverlay] = useState<{ cols: number; rows: number }>({ cols: 3, rows: 3 });
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('Instagram Grid');
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const createFromInspiration = async () => {
    if (!templateName.trim()) {
      toast.error('Template name is required');
      return;
    }
    setSaving(true);

    const cells: number[][] = [];
    for (let r = 0; r < gridOverlay.rows; r++) {
      for (let c = 0; c < gridOverlay.cols; c++) {
        cells.push([r + 1, c + 1, r + 2, c + 2]);
      }
    }

    const { error } = await supabase.from('grid_templates').insert({
      name: templateName,
      category,
      grid_type: 'custom',
      columns: gridOverlay.cols,
      rows: gridOverlay.rows,
      spacing: 4,
      padding: 0,
      border_radius: 0,
      background_color: '#ffffff',
      layout_config: { cells, canvasRatio: 1, inspiredFrom: true },
      is_active: true,
      sort_order: 99,
    });

    if (error) toast.error('Failed to create template');
    else {
      toast.success('Template created from inspiration!');
      setImage(null);
      setTemplateName('');
      onTemplateCreated();
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Import from Inspiration
        </h3>
        <p className="text-xs text-muted-foreground mb-6">Upload a screenshot or reference design. Draw a grid overlay and convert it into a usable template.</p>

        {!image ? (
          <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-amber-500/40 transition-colors">
            <Upload className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Click to upload inspiration image</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">PNG, JPG up to 10MB</p>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        ) : (
          <div className="space-y-4">
            {/* Image with grid overlay */}
            <div className="relative aspect-square rounded-xl overflow-hidden border border-border">
              <img src={image} alt="Inspiration" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              {/* Grid overlay */}
              <div
                className="absolute inset-0 grid pointer-events-none"
                style={{
                  gridTemplateColumns: `repeat(${gridOverlay.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${gridOverlay.rows}, 1fr)`,
                }}
              >
                {Array.from({ length: gridOverlay.cols * gridOverlay.rows }).map((_, i) => (
                  <div key={i} className="border border-amber-500/60" />
                ))}
              </div>
              <button onClick={() => setImage(null)} className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Grid controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Columns: {gridOverlay.cols}</Label>
                <Slider
                  value={[gridOverlay.cols]}
                  onValueChange={([v]) => setGridOverlay(prev => ({ ...prev, cols: v }))}
                  min={1} max={6} step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-xs">Rows: {gridOverlay.rows}</Label>
                <Slider
                  value={[gridOverlay.rows]}
                  onValueChange={([v]) => setGridOverlay(prev => ({ ...prev, rows: v }))}
                  min={1} max={6} step={1}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Template info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Template Name</Label>
                <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. Inspired Grid" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={createFromInspiration} disabled={saving} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2">
              <Sparkles className="h-4 w-4" /> {saving ? 'Creating...' : 'Create Template from Inspiration'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
