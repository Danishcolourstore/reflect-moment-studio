import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  LayoutDashboard, Puzzle, Palette, Navigation, Zap, Users,
  GripVertical, Eye, EyeOff, Save, RefreshCw, Plus, Trash2,
  Settings, Monitor, Smartphone, Tablet, ArrowUp, ArrowDown,
  Camera, Image, Download, Upload, Home, BookOpen, BarChart3,
  HardDrive, Activity, Calendar, Bell, CheckSquare, FolderOpen,
  Sparkles, Grid3X3, Layers,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Camera, Image, Download, Upload, Home, BookOpen, BarChart3,
  HardDrive, Activity, Calendar, Bell, CheckSquare, FolderOpen,
  Sparkles, Grid3X3, Layers, Eye, Zap, Users, Puzzle, Navigation,
  LayoutDashboard, Settings, Palette, Plus, GripVertical,
};

interface DashboardWidget {
  id: string;
  widget_key: string;
  widget_name: string;
  widget_description: string | null;
  widget_icon: string;
  default_width: number;
  default_height: number;
  is_active: boolean;
  sort_order: number;
}

interface DashboardModule {
  id: string;
  module_key: string;
  module_name: string;
  module_description: string | null;
  is_enabled: boolean;
  roles: string[];
  sort_order: number;
}

interface DashboardNavItem {
  id: string;
  nav_key: string;
  nav_label: string;
  nav_icon: string;
  nav_route: string;
  is_visible: boolean;
  roles: string[];
  sort_order: number;
}

interface QuickAction {
  id: string;
  action_key: string;
  action_label: string;
  action_icon: string;
  action_route: string | null;
  action_type: string;
  is_visible: boolean;
  roles: string[];
  sort_order: number;
}

interface DashboardLayout {
  id: string;
  role: string;
  layout_name: string;
  layout_config: any[];
  is_active: boolean;
}

export default function SuperAdminDashboardEditor() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState('photographer');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Fetch widgets
  const { data: widgets = [], isLoading: loadingWidgets } = useQuery({
    queryKey: ['dashboard-widgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as DashboardWidget[];
    },
  });

  // Fetch modules
  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ['dashboard-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_modules')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as DashboardModule[];
    },
  });

  // Fetch navigation
  const { data: navItems = [], isLoading: loadingNav } = useQuery({
    queryKey: ['dashboard-navigation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_navigation')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as DashboardNavItem[];
    },
  });

  // Fetch quick actions
  const { data: quickActions = [], isLoading: loadingActions } = useQuery({
    queryKey: ['dashboard-quick-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_quick_actions')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as QuickAction[];
    },
  });

  // Fetch layouts
  const { data: layouts = [], isLoading: loadingLayouts } = useQuery({
    queryKey: ['dashboard-layouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .order('role');
      if (error) throw error;
      return data as DashboardLayout[];
    },
  });

  // Fetch settings
  const { data: settings = [] } = useQuery({
    queryKey: ['dashboard-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_settings')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  // Toggle widget mutation
  const toggleWidgetMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('dashboard_widgets')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
      toast.success('Widget updated');
    },
  });

  // Toggle module mutation
  const toggleModuleMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('dashboard_modules')
        .update({ is_enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-modules'] });
      toast.success('Module updated');
    },
  });

  // Toggle nav item mutation
  const toggleNavMutation = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase
        .from('dashboard_navigation')
        .update({ is_visible })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-navigation'] });
      toast.success('Navigation updated');
    },
  });

  // Toggle quick action mutation
  const toggleActionMutation = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase
        .from('dashboard_quick_actions')
        .update({ is_visible })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-quick-actions'] });
      toast.success('Quick action updated');
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ table, id, direction }: { table: string; id: string; direction: 'up' | 'down' }) => {
      const items = table === 'dashboard_widgets' ? widgets :
                    table === 'dashboard_modules' ? modules :
                    table === 'dashboard_navigation' ? navItems : quickActions;
      const sortKey = table === 'dashboard_widgets' ? 'sort_order' :
                      table === 'dashboard_modules' ? 'sort_order' :
                      table === 'dashboard_navigation' ? 'sort_order' : 'sort_order';
      
      const idx = items.findIndex((i: any) => i.id === id);
      if (idx < 0) return;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= items.length) return;

      const current = items[idx];
      const swap = items[swapIdx];
      
      await supabase.from(table as any).update({ sort_order: swap.sort_order }).eq('id', current.id);
      await supabase.from(table as any).update({ sort_order: current.sort_order }).eq('id', swap.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-modules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-navigation'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-quick-actions'] });
    },
  });

  const getSettingValue = (key: string) => {
    const setting = settings.find((s: any) => s.setting_key === key);
    return setting?.setting_value || {};
  };

  const currentLayout = layouts.find(l => l.role === selectedRole && l.is_active);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-amber-500" />
            Photographer Dashboard Editor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control the entire photographer dashboard experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Role Selector */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label>Dashboard Role:</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photographer">Photographer</SelectItem>
                  <SelectItem value="studio_owner">Studio Owner</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setPreviewMode('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="layout" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="layout" className="gap-1">
            <Layers className="h-4 w-4" /> Layout
          </TabsTrigger>
          <TabsTrigger value="widgets" className="gap-1">
            <Puzzle className="h-4 w-4" /> Widgets
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-1">
            <Settings className="h-4 w-4" /> Modules
          </TabsTrigger>
          <TabsTrigger value="navigation" className="gap-1">
            <Navigation className="h-4 w-4" /> Navigation
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-1">
            <Zap className="h-4 w-4" /> Quick Actions
          </TabsTrigger>
          <TabsTrigger value="ui" className="gap-1">
            <Palette className="h-4 w-4" /> UI/UX
          </TabsTrigger>
        </TabsList>

        {/* Layout Builder Tab */}
        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Visual Layout Builder
              </CardTitle>
              <CardDescription>
                Drag and drop widgets to design the {selectedRole} dashboard layout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Widget Library */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Available Widgets</Label>
                  <div className="border rounded-lg p-3 space-y-2 max-h-96 overflow-y-auto">
                    {widgets.filter(w => w.is_active).map((widget) => {
                      const IconComp = ICON_MAP[widget.widget_icon] || Puzzle;
                      return (
                        <div
                          key={widget.id}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 cursor-grab"
                          draggable
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <IconComp className="h-4 w-4 text-amber-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{widget.widget_name}</p>
                            <p className="text-xs text-muted-foreground">{widget.default_width}×{widget.default_height}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Layout Preview */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Current Layout Preview</Label>
                  <div
                    className="border rounded-lg p-4 min-h-96 bg-muted/30"
                    style={{ maxWidth: previewMode === 'mobile' ? '320px' : previewMode === 'tablet' ? '768px' : '100%' }}
                  >
                    {currentLayout ? (
                      <div className="grid grid-cols-4 gap-2">
                        {currentLayout.layout_config.map((item: any, idx: number) => {
                          const widget = widgets.find(w => w.widget_key === item.id);
                          const IconComp = widget ? (ICON_MAP[widget.widget_icon] || Puzzle) : Puzzle;
                          return (
                            <div
                              key={idx}
                              className="border-2 border-dashed border-amber-500/30 rounded-lg p-3 bg-card flex flex-col items-center justify-center"
                              style={{
                                gridColumn: `span ${item.w}`,
                                gridRow: `span ${item.h}`,
                                minHeight: `${item.h * 60}px`,
                              }}
                            >
                              <IconComp className="h-5 w-5 text-amber-500 mb-1" />
                              <p className="text-xs text-center">{widget?.widget_name || item.id}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No layout configured for this role
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Widgets Tab */}
        <TabsContent value="widgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Puzzle className="h-5 w-5" />
                Dashboard Widgets Library
              </CardTitle>
              <CardDescription>
                Enable or disable widgets available for dashboard layouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {loadingWidgets ? (
                  <p className="text-muted-foreground">Loading widgets...</p>
                ) : (
                  widgets.map((widget, idx) => {
                    const IconComp = ICON_MAP[widget.widget_icon] || Puzzle;
                    return (
                      <div
                        key={widget.id}
                        className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={idx === 0}
                            onClick={() => reorderMutation.mutate({ table: 'dashboard_widgets', id: widget.id, direction: 'up' })}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={idx === widgets.length - 1}
                            onClick={() => reorderMutation.mutate({ table: 'dashboard_widgets', id: widget.id, direction: 'down' })}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <IconComp className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{widget.widget_name}</p>
                          <p className="text-xs text-muted-foreground">{widget.widget_description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {widget.default_width}×{widget.default_height}
                        </Badge>
                        <Switch
                          checked={widget.is_active}
                          onCheckedChange={(checked) => toggleWidgetMutation.mutate({ id: widget.id, is_active: checked })}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Dashboard Modules
              </CardTitle>
              <CardDescription>
                Control which features are available to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {loadingModules ? (
                  <p className="text-muted-foreground">Loading modules...</p>
                ) : (
                  modules.map((module, idx) => (
                    <div
                      key={module.id}
                      className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                    >
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === 0}
                          onClick={() => reorderMutation.mutate({ table: 'dashboard_modules', id: module.id, direction: 'up' })}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === modules.length - 1}
                          onClick={() => reorderMutation.mutate({ table: 'dashboard_modules', id: module.id, direction: 'down' })}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{module.module_name}</p>
                        <p className="text-xs text-muted-foreground">{module.module_description}</p>
                      </div>
                      <div className="flex gap-1">
                        {module.roles.map(role => (
                          <Badge key={role} variant="secondary" className="text-[10px]">
                            {role}
                          </Badge>
                        ))}
                      </div>
                      <Switch
                        checked={module.is_enabled}
                        onCheckedChange={(checked) => toggleModuleMutation.mutate({ id: module.id, is_enabled: checked })}
                      />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Navigation Tab */}
        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Navigation Configuration
              </CardTitle>
              <CardDescription>
                Configure the main navigation menu items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {loadingNav ? (
                  <p className="text-muted-foreground">Loading navigation...</p>
                ) : (
                  navItems.map((nav, idx) => {
                    const IconComp = ICON_MAP[nav.nav_icon] || Home;
                    return (
                      <div
                        key={nav.id}
                        className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={idx === 0}
                            onClick={() => reorderMutation.mutate({ table: 'dashboard_navigation', id: nav.id, direction: 'up' })}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={idx === navItems.length - 1}
                            onClick={() => reorderMutation.mutate({ table: 'dashboard_navigation', id: nav.id, direction: 'down' })}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{nav.nav_label}</p>
                          <p className="text-xs text-muted-foreground">{nav.nav_route}</p>
                        </div>
                        <div className="flex gap-1">
                          {nav.roles.map(role => (
                            <Badge key={role} variant="outline" className="text-[10px]">
                              {role}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleNavMutation.mutate({ id: nav.id, is_visible: !nav.is_visible })}
                        >
                          {nav.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions Builder
              </CardTitle>
              <CardDescription>
                Configure dashboard quick action buttons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {loadingActions ? (
                  <p className="text-muted-foreground">Loading actions...</p>
                ) : (
                  quickActions.map((action, idx) => {
                    const IconComp = ICON_MAP[action.action_icon] || Zap;
                    return (
                      <div
                        key={action.id}
                        className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={idx === 0}
                            onClick={() => reorderMutation.mutate({ table: 'dashboard_quick_actions', id: action.id, direction: 'up' })}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={idx === quickActions.length - 1}
                            onClick={() => reorderMutation.mutate({ table: 'dashboard_quick_actions', id: action.id, direction: 'down' })}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IconComp className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{action.action_label}</p>
                          <p className="text-xs text-muted-foreground">{action.action_route || action.action_type}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {action.action_type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActionMutation.mutate({ id: action.id, is_visible: !action.is_visible })}
                        >
                          {action.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UI/UX Tab */}
        <TabsContent value="ui" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Styling</CardTitle>
                <CardDescription>Configure dashboard card appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Border Radius</Label>
                  <Slider defaultValue={[12]} max={24} step={2} />
                </div>
                <div className="space-y-2">
                  <Label>Shadow</Label>
                  <Select defaultValue="sm">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spacing</CardTitle>
                <CardDescription>Control layout spacing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Grid Gap</Label>
                  <Slider defaultValue={[16]} max={32} step={4} />
                </div>
                <div className="space-y-2">
                  <Label>Padding</Label>
                  <Slider defaultValue={[16]} max={32} step={4} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Font settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Select defaultValue="cormorant">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cormorant">Cormorant Garamond</SelectItem>
                      <SelectItem value="playfair">Playfair Display</SelectItem>
                      <SelectItem value="dm-serif">DM Serif Display</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <Select defaultValue="dm-sans">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dm-sans">DM Sans</SelectItem>
                      <SelectItem value="jost">Jost</SelectItem>
                      <SelectItem value="inter">Inter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Animations</CardTitle>
                <CardDescription>Motion and effects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Hover Effects</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Scale on Click</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Smooth Transitions</Label>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
