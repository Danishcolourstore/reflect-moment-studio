export type SuperAdminModuleKey =
  | 'overview'
  | 'platform-builder'
  | 'ai-developer'
  | 'dashboard-editor'
  | 'users'
  | 'events'
  | 'storage'
  | 'revenue'
  | 'analytics'
  | 'templates'
  | 'studio-templates'
  | 'grid-manager'
  | 'galleries'
  | 'mirrorai'
  | 'storybooks'
  | 'reflections'
  | 'art-gallery'
  | 'emails'
  | 'activity'
  | 'settings';

export type SuperAdminRouteConfig = {
  key: SuperAdminModuleKey;
  path: string;
  label: string;
  icon: string;
  end?: boolean;
  nav: boolean;
};

export const SUPER_ADMIN_ROUTES: SuperAdminRouteConfig[] = [
  { key: 'overview', path: '', label: 'Dashboard', icon: 'Home', end: true, nav: true },
  { key: 'platform-builder', path: 'platform-builder', label: 'Platform Builder', icon: 'Code', nav: true },
  { key: 'ai-developer', path: 'ai-developer', label: 'AI Developer Console', icon: 'Bot', nav: true },
  { key: 'dashboard-editor', path: 'dashboard-editor', label: 'Dashboard Editor', icon: 'LayoutDashboard', nav: true },
  { key: 'users', path: 'users', label: 'Users', icon: 'Users', nav: true },
  { key: 'events', path: 'events', label: 'Events', icon: 'Camera', nav: true },
  { key: 'storage', path: 'storage', label: 'Storage', icon: 'HardDrive', nav: true },
  { key: 'revenue', path: 'revenue', label: 'Revenue', icon: 'DollarSign', nav: true },
  { key: 'analytics', path: 'analytics', label: 'Analytics', icon: 'BarChart3', nav: true },
  { key: 'templates', path: 'templates', label: 'Templates', icon: 'Layout', nav: true },
  { key: 'studio-templates', path: 'template-builder', label: 'Studio Templates', icon: 'BookOpen', nav: true },
  { key: 'grid-manager', path: 'grid-manager', label: 'Grid Builder', icon: 'Grid3X3', nav: true },
  { key: 'galleries', path: 'galleries', label: 'Client Galleries', icon: 'Images', nav: true },
  { key: 'mirrorai', path: 'mirrorai', label: 'MirrorAI', icon: 'Shield', nav: true },
  { key: 'storybooks', path: 'storybooks', label: 'Storybooks', icon: 'BookOpen', nav: true },
  { key: 'reflections', path: 'reflections', label: 'Reflections', icon: 'Compass', nav: true },
  { key: 'emails', path: 'emails', label: 'Bulk Email', icon: 'Mail', nav: true },
  { key: 'activity', path: 'activity', label: 'Activity Log', icon: 'Activity', nav: true },
  { key: 'settings', path: 'settings', label: 'Settings', icon: 'Settings', nav: true },
];
