import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Layers, Puzzle, Palette, Navigation, Shield, Settings,
  Plus, Trash2, Eye, EyeOff, Save, RefreshCw, ArrowUp, ArrowDown,
  GripVertical, Monitor, Smartphone, Tablet, Code, Zap, Layout,
  Camera, Image, BookOpen, BarChart3, Users, Globe, CheckSquare,
  Scan, RefreshCcw, Grid3X3, Book, Home, Bell, HardDrive,
  FileText, Calendar, Activity, Sparkles, Lock, Unlock, ArrowRight,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Camera, Image, BookOpen, BarChart3, Users, Globe, CheckSquare,
  Scan, RefreshCcw, Grid3X3, Book, Home, Bell, HardDrive,
  FileText, Calendar, Activity, Sparkles, Puzzle, Shield,
  Zap, Layout, Palette, Navigation, Layers, Settings, Code,
  Lock, Unlock, Eye, Plus,
};

const AVAILABLE_ICONS = [
  'Camera', 'Image', 'BookOpen', 'BarChart3', 'Users', 'Globe',
  'CheckSquare', 'Scan', 'Grid3X3', 'Book', 'Home', 'Bell',
  'HardDrive', 'FileText', 'Calendar', 'Activity', 'Sparkles',
  'Puzzle', 'Shield', 'Zap', 'Layout', 'Palette', 'Code',
];

const ROLES = ['super_admin', 'admin', 'photographer', 'studio_owner', 'client'];

interface PlatformFeature {
  id: string;
  feature_key: string;
  feature_name: string;
  feature_icon: string;
  feature_description: string | null;
  feature_route: string | null;
  feature_type: string;
  is_enabled: boolean;
  is_premium: boolean;
  allowed_roles: string[];
  sort_order: number;
  settings_json: any;
}

interface PlatformLayout {
  id: string;
  page_key: string;
  layout_name: string;
  layout_type: string;
  layout_config: any;
  is_active: boolean;
  target_roles: string[];
}

interface PlatformPermission {
  id: string;
  role: string;
  feature_key: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface UISetting {
  id: string;
  setting_category: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
}

export default function SuperAdminPlatformBuilder() {
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState('dashboard');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [newFeatureOpen, setNewFeatureOpen] = useState(false);
  const [newFeature, setNewFeature] = useState({
    feature_key: '',
    feature_name: '',
    feature_icon: 'Puzzle',
    feature_description: '',
    feature_route: '',
    feature_type: 'page',
    allowed_roles: ['photographer'],
  });

  // Fetch features
  const { data: features = [], isLoading: loadingFeatures } = useQuery({
    queryKey: ['platform-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_features')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as PlatformFeature[];
    },
  });

  // Fetch layouts
  const { data: layouts = [] } = useQuery({
    queryKey: ['platform-layouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_layouts')
        .select('*')
        .order('page_key');
      if (error) throw error;
      return data as PlatformLayout[];
    },
  });

  // Fetch UI settings
  const { data: uiSettings = [] } = useQuery({
    queryKey: ['platform-ui-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_ui_settings')
        .select('*')
        .order('setting_category');
      if (error) throw error;
      return data as UISetting[];
    },
  });

  // Fetch permissions
  const { data: permissions = [] } = useQuery({
    queryKey: ['platform-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_permissions')
        .select('*')
        .order('role');
      if (error) throw error;
      return data as PlatformPermission[];
    },
  });

  // Fetch modules from dashboard_modules
  const { data: modules = [] } = useQuery({
    queryKey: ['dashboard-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_modules')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch navigation
  const { data: navigation = [] } = useQuery({
    queryKey: ['dashboard-navigation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_navigation')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Toggle feature
  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('platform_features')
        .update({ is_enabled, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-features'] });
      toast.success('Feature updated');
    },
  });

  // Create feature
  const createFeatureMutation = useMutation({
    mutationFn: async (feature: typeof newFeature) => {
      const { error } = await supabase
        .from('platform_features')
        .insert({
          ...feature,
          sort_order: features.length + 1,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-features'] });
      toast.success('Feature created');
      setNewFeatureOpen(false);
      setNewFeature({
        feature_key: '',
        feature_name: '',
        feature_icon: 'Puzzle',
        feature_description: '',
        feature_route: '',
        feature_type: 'page',
        allowed_roles: ['photographer'],
      });
    },
  });

  // Toggle module
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

  // Toggle navigation
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

  // Update UI setting
  const updateUISettingMutation = useMutation({
    mutationFn: async ({ id, setting_value }: { id: string; setting_value: any }) => {
      const { error } = await supabase
        .from('platform_ui_settings')
        .update({ setting_value, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-ui-settings'] });
      toast.success('Setting updated');
    },
  });

  // Update permission
  const updatePermissionMutation = useMutation({
    mutationFn: async (perm: Partial<PlatformPermission> & { id: string }) => {
      const { error } = await supabase
        .from('platform_permissions')
        .update(perm)
        .eq('id', perm.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-permissions'] });
      toast.success('Permission updated');
    },
  });

  // Reorder items
  const reorderMutation = useMutation({
    mutationFn: async ({ table, id, direction, items }: { table: string; id: string; direction: 'up' | 'down'; items: any[] }) => {
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
      queryClient.invalidateQueries({ queryKey: ['platform-features'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-navigation'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-modules'] });
    },
  });

  const getSettingsByCategory = (category: string) => 
    uiSettings.filter(s => s.setting_category === category);

  const getPermissionsForRole = (role: string) =>
    permissions.filter(p => p.role === role);

  const currentLayout = layouts.find(l => l.page_key === selectedPage && l.is_active);

  const PAGES = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'gallery', label: 'Gallery', icon: Camera },
    { key: 'grid_builder', label: 'Grid Builder', icon: Grid3X3 },
    { key: 'storybook', label: 'Storybook', icon: BookOpen },
    { key: 'studio', label: 'Studio', icon: Palette },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Code className="h-6 w-6 text-amber-500" />
            Platform Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Full control over the entire platform — edit UI, create features, manage permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="layout" className="space-y-6">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="layout" className="gap-1 text-xs">
            <Layout className="h-4 w-4" /> Layouts
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-1 text-xs">
            <Puzzle className="h-4 w-4" /> Features
          </TabsTrigger>
          <TabsTrigger value="navigation" className="gap-1 text-xs">
            <Navigation className="h-4 w-4" /> Navigation
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-1 text-xs">
            <Layers className="h-4 w-4" /> Modules
          </TabsTrigger>
          <TabsTrigger value="ui" className="gap-1 text-xs">
            <Palette className="h-4 w-4" /> UI/UX
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1 text-xs">
            <Shield className="h-4 w-4" /> Permissions
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1 text-xs">
            <FileText className="h-4 w-4" /> Templates
          </TabsTrigger>
        </TabsList>

        {/* Layout Editor Tab */}
        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    App Layout Editor
                  </CardTitle>
                  <CardDescription>
                    Visually edit the layout of any page in the application
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setPreviewDevice('desktop')}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewDevice === 'tablet' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setPreviewDevice('tablet')}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setPreviewDevice('mobile')}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-6">
                {/* Page Selector */}
                <div className="col-span-3 space-y-3">
                  <Label className="text-sm font-medium">Select Page</Label>
                  <div className="space-y-1">
                    {PAGES.map((page) => {
                      const IconComp = page.icon;
                      return (
                        <button
                          key={page.key}
                          onClick={() => setSelectedPage(page.key)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedPage === page.key
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          <IconComp className="h-4 w-4" />
                          {page.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Layout Preview */}
                <div className="col-span-9 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {PAGES.find(p => p.key === selectedPage)?.label} Layout
                    </Label>
                    {currentLayout && (
                      <Badge variant="secondary">{currentLayout.layout_type}</Badge>
                    )}
                  </div>
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-4 min-h-[400px] bg-muted/20"
                    style={{ 
                      maxWidth: previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : '100%',
                      margin: previewDevice !== 'desktop' ? '0 auto' : undefined,
                    }}
                  >
                    {currentLayout ? (
                      <div className="space-y-4">
                        <div className="text-center text-muted-foreground py-8">
                          <Layout className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">{currentLayout.layout_name}</p>
                          <p className="text-xs mt-1">Drag components here to edit layout</p>
                        </div>
                        {Array.isArray(currentLayout.layout_config) && currentLayout.layout_config.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="border border-amber-500/30 rounded-lg p-4 bg-card flex items-center gap-3"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            <span className="text-sm">{item.id || `Section ${idx + 1}`}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No layout configured for this page
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Builder Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Puzzle className="h-5 w-5" />
                    Feature Builder
                  </CardTitle>
                  <CardDescription>
                    Create and manage platform features
                  </CardDescription>
                </div>
                <Dialog open={newFeatureOpen} onOpenChange={setNewFeatureOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" /> New Feature
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create New Feature</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Feature Key</Label>
                          <Input
                            value={newFeature.feature_key}
                            onChange={(e) => setNewFeature({ ...newFeature, feature_key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                            placeholder="e.g. booking_manager"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Feature Name</Label>
                          <Input
                            value={newFeature.feature_name}
                            onChange={(e) => setNewFeature({ ...newFeature, feature_name: e.target.value })}
                            placeholder="e.g. Booking Manager"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Icon</Label>
                          <Select value={newFeature.feature_icon} onValueChange={(v) => setNewFeature({ ...newFeature, feature_icon: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_ICONS.map(icon => (
                                <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select value={newFeature.feature_type} onValueChange={(v) => setNewFeature({ ...newFeature, feature_type: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="page">Page</SelectItem>
                              <SelectItem value="tool">Tool</SelectItem>
                              <SelectItem value="widget">Widget</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Route (for pages)</Label>
                        <Input
                          value={newFeature.feature_route}
                          onChange={(e) => setNewFeature({ ...newFeature, feature_route: e.target.value })}
                          placeholder="/dashboard/feature-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newFeature.feature_description}
                          onChange={(e) => setNewFeature({ ...newFeature, feature_description: e.target.value })}
                          placeholder="What does this feature do?"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Allowed Roles</Label>
                        <div className="flex flex-wrap gap-2">
                          {['photographer', 'studio_owner', 'client'].map(role => (
                            <label key={role} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={newFeature.allowed_roles.includes(role)}
                                onCheckedChange={(checked) => {
                                  setNewFeature({
                                    ...newFeature,
                                    allowed_roles: checked
                                      ? [...newFeature.allowed_roles, role]
                                      : newFeature.allowed_roles.filter(r => r !== role)
                                  });
                                }}
                              />
                              {role}
                            </label>
                          ))}
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => createFeatureMutation.mutate(newFeature)}
                        disabled={!newFeature.feature_key || !newFeature.feature_name}
                      >
                        Create Feature
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {loadingFeatures ? (
                  <p className="text-muted-foreground">Loading features...</p>
                ) : (
                  features.map((feature, idx) => {
                    const IconComp = ICON_MAP[feature.feature_icon] || Puzzle;
                    return (
                      <div
                        key={feature.id}
                        className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={idx === 0}
                            onClick={() => reorderMutation.mutate({ table: 'platform_features', id: feature.id, direction: 'up', items: features })}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={idx === features.length - 1}
                            onClick={() => reorderMutation.mutate({ table: 'platform_features', id: feature.id, direction: 'down', items: features })}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <IconComp className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{feature.feature_name}</p>
                            <Badge variant="outline" className="text-[10px]">{feature.feature_type}</Badge>
                            {feature.is_premium && <Badge className="text-[10px] bg-amber-500">Premium</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{feature.feature_description || feature.feature_route}</p>
                        </div>
                        <div className="flex gap-1">
                          {feature.allowed_roles.slice(0, 2).map(role => (
                            <Badge key={role} variant="secondary" className="text-[10px]">{role}</Badge>
                          ))}
                          {feature.allowed_roles.length > 2 && (
                            <Badge variant="secondary" className="text-[10px]">+{feature.allowed_roles.length - 2}</Badge>
                          )}
                        </div>
                        <Switch
                          checked={feature.is_enabled}
                          onCheckedChange={(checked) => toggleFeatureMutation.mutate({ id: feature.id, is_enabled: checked })}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Navigation Builder Tab */}
        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Navigation Builder
              </CardTitle>
              <CardDescription>
                Control the entire app navigation structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Main Navigation</Label>
                  <div className="space-y-2">
                    {navigation.map((nav: any, idx: number) => {
                      const IconComp = ICON_MAP[nav.nav_icon] || Home;
                      return (
                        <div
                          key={nav.id}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                        >
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={idx === 0}
                              onClick={() => reorderMutation.mutate({ table: 'dashboard_navigation', id: nav.id, direction: 'up', items: navigation })}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={idx === navigation.length - 1}
                              onClick={() => reorderMutation.mutate({ table: 'dashboard_navigation', id: nav.id, direction: 'down', items: navigation })}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{nav.nav_label}</p>
                            <p className="text-xs text-muted-foreground">{nav.nav_route}</p>
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
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Navigation Preview</Label>
                  <div className="border rounded-lg p-4 bg-muted/30 space-y-1">
                    {navigation.filter((n: any) => n.is_visible).map((nav: any) => {
                      const IconComp = ICON_MAP[nav.nav_icon] || Home;
                      return (
                        <div key={nav.id} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted">
                          <IconComp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{nav.nav_label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module Manager Tab */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Module Manager
              </CardTitle>
              <CardDescription>
                Enable or disable platform modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {modules.map((module: any) => (
                  <div
                    key={module.id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{module.module_name}</p>
                      <p className="text-xs text-muted-foreground">{module.module_description}</p>
                    </div>
                    <div className="flex gap-1">
                      {module.roles?.slice(0, 2).map((role: string) => (
                        <Badge key={role} variant="outline" className="text-[10px]">{role}</Badge>
                      ))}
                    </div>
                    <Switch
                      checked={module.is_enabled}
                      onCheckedChange={(checked) => toggleModuleMutation.mutate({ id: module.id, is_enabled: checked })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UI/UX Editor Tab */}
        <TabsContent value="ui" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Colors</CardTitle>
                <CardDescription>Platform color scheme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('colors').map(setting => (
                  <div key={setting.id} className="space-y-2">
                    <Label className="text-xs capitalize">{setting.setting_key.replace('_', ' ')}</Label>
                    <div className="flex gap-2">
                      <div
                        className="h-8 w-8 rounded border"
                        style={{ backgroundColor: setting.setting_value.light || setting.setting_value }}
                      />
                      <Input
                        value={setting.setting_value.light || setting.setting_value}
                        className="flex-1 h-8 text-xs"
                        onChange={(e) => updateUISettingMutation.mutate({
                          id: setting.id,
                          setting_value: { ...setting.setting_value, light: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Typography */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Typography</CardTitle>
                <CardDescription>Font settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('typography').map(setting => (
                  <div key={setting.id} className="space-y-2">
                    <Label className="text-xs capitalize">{setting.setting_key.replace('_', ' ')}</Label>
                    {setting.setting_key.includes('font') ? (
                      <Select
                        value={setting.setting_value.family || 'DM Sans'}
                        onValueChange={(v) => updateUISettingMutation.mutate({
                          id: setting.id,
                          setting_value: { ...setting.setting_value, family: v }
                        })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cormorant Garamond">Cormorant Garamond</SelectItem>
                          <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                          <SelectItem value="DM Sans">DM Sans</SelectItem>
                          <SelectItem value="Jost">Jost</SelectItem>
                          <SelectItem value="Inter">Inter</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-xs text-muted-foreground">{JSON.stringify(setting.setting_value)}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Spacing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Spacing</CardTitle>
                <CardDescription>Layout spacing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('spacing').map(setting => (
                  <div key={setting.id} className="space-y-2">
                    <Label className="text-xs capitalize">{setting.setting_key}</Label>
                    <p className="text-xs text-muted-foreground">{JSON.stringify(setting.setting_value)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cards</CardTitle>
                <CardDescription>Card styling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('cards').map(setting => (
                  <div key={setting.id} className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Border Radius</Label>
                      <Slider
                        defaultValue={[parseInt(setting.setting_value.borderRadius) || 12]}
                        max={24}
                        step={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Shadow</Label>
                      <Select defaultValue={setting.setting_value.shadow || 'sm'}>
                        <SelectTrigger className="h-8 text-xs">
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
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Animations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Animations</CardTitle>
                <CardDescription>Motion settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('animations').map(setting => (
                  <div key={setting.id} className="space-y-3">
                    {setting.setting_key === 'hover' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Scale on Hover</Label>
                          <Switch defaultChecked={setting.setting_value.scale > 1} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Shadow on Hover</Label>
                          <Switch defaultChecked={setting.setting_value.shadow} />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-xs">Duration (ms)</Label>
                        <Slider defaultValue={[setting.setting_value.duration || 200]} max={500} step={50} />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Theme */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Theme</CardTitle>
                <CardDescription>Dark/Light mode</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('theme').map(setting => (
                  <div key={setting.id} className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Default Mode</Label>
                      <Select defaultValue={setting.setting_value.mode || 'dark'}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Allow User Switch</Label>
                      <Switch defaultChecked={setting.setting_value.allowSwitch} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Permission Manager Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permission Manager
              </CardTitle>
              <CardDescription>
                Control feature access for each role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="photographer">
                <TabsList className="mb-4">
                  {ROLES.filter(r => r !== 'super_admin').map(role => (
                    <TabsTrigger key={role} value={role} className="capitalize">
                      {role.replace('_', ' ')}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {ROLES.filter(r => r !== 'super_admin').map(role => (
                  <TabsContent key={role} value={role}>
                    <div className="grid gap-3">
                      {getPermissionsForRole(role).map(perm => (
                        <div key={perm.id} className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                          <div className="flex-1">
                            <p className="font-medium capitalize">{perm.feature_key.replace('_', ' ')}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs">
                              <Checkbox
                                checked={perm.can_view}
                                onCheckedChange={(checked) => updatePermissionMutation.mutate({ id: perm.id, can_view: !!checked })}
                              />
                              View
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <Checkbox
                                checked={perm.can_create}
                                onCheckedChange={(checked) => updatePermissionMutation.mutate({ id: perm.id, can_create: !!checked })}
                              />
                              Create
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <Checkbox
                                checked={perm.can_edit}
                                onCheckedChange={(checked) => updatePermissionMutation.mutate({ id: perm.id, can_edit: !!checked })}
                              />
                              Edit
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <Checkbox
                                checked={perm.can_delete}
                                onCheckedChange={(checked) => updatePermissionMutation.mutate({ id: perm.id, can_delete: !!checked })}
                              />
                              Delete
                            </label>
                          </div>
                        </div>
                      ))}
                      {getPermissionsForRole(role).length === 0 && (
                        <p className="text-muted-foreground text-center py-8">No permissions configured for this role</p>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template System Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dashboard Templates</CardTitle>
                <CardDescription>Pre-built dashboard layouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {layouts.filter(l => l.page_key === 'dashboard').map(layout => (
                    <div key={layout.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Layout className="h-5 w-5 text-amber-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{layout.layout_name}</p>
                        <p className="text-xs text-muted-foreground">{layout.layout_type}</p>
                      </div>
                      {layout.is_active && <Badge className="bg-green-500/10 text-green-500">Active</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gallery Templates</CardTitle>
                <CardDescription>Gallery layout presets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {layouts.filter(l => l.page_key === 'gallery').map(layout => (
                    <div key={layout.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Camera className="h-5 w-5 text-amber-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{layout.layout_name}</p>
                        <p className="text-xs text-muted-foreground">{layout.layout_type}</p>
                      </div>
                      {layout.is_active && <Badge className="bg-green-500/10 text-green-500">Active</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Grid Templates</CardTitle>
                <CardDescription>Instagram grid presets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                  <Grid3X3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Manage via Grid Builder Manager</p>
                  <Button variant="link" size="sm" className="mt-2 gap-1" onClick={() => window.location.href = '/super-admin/grid-manager'}>
                    Open Grid Manager <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Website Templates</CardTitle>
                <CardDescription>Portfolio website presets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Manage via Templates page</p>
                  <Button variant="link" size="sm" className="mt-2 gap-1" onClick={() => window.location.href = '/super-admin/templates'}>
                    Open Templates <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
