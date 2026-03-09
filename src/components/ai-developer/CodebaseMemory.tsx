import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search, Database, Server, Globe, Package, Lock, Cpu, Info,
  FolderTree, Layers, FileCode, Zap, Shield, BookOpen, ChevronRight,
  ChevronDown, File, FolderOpen, Filter, BarChart3, Users, Image,
  Bell, Upload, Share2, Palette, Layout, Brain, TestTube2, Code
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───
export interface MemoryEntry {
  feature: string;
  category: 'core' | 'gallery' | 'client' | 'content' | 'admin' | 'tools' | 'social';
  keywords: string[];
  pages: string[];
  components: string[];
  hooks: string[];
  apis: string[];
  dbTables: string[];
  edgeFunctions: string[];
  routes: string[];
  description: string;
  dependencies: string[];
}

interface FolderNode {
  name: string;
  type: 'folder' | 'file';
  children?: FolderNode[];
  path?: string;
}

// ─── Category Config ───
const CATEGORIES: Record<string, { label: string; icon: typeof Package; color: string }> = {
  core: { label: 'Core', icon: Shield, color: 'text-blue-500' },
  gallery: { label: 'Gallery', icon: Image, color: 'text-emerald-500' },
  client: { label: 'Client', icon: Users, color: 'text-violet-500' },
  content: { label: 'Content', icon: BookOpen, color: 'text-amber-500' },
  admin: { label: 'Admin', icon: Shield, color: 'text-red-500' },
  tools: { label: 'Tools', icon: Zap, color: 'text-cyan-500' },
  social: { label: 'Social', icon: Share2, color: 'text-pink-500' },
};

// ─── Full Codebase Memory Index ───
export const CODEBASE_MEMORY: MemoryEntry[] = [
  {
    feature: 'Authentication',
    category: 'core',
    keywords: ['auth', 'login', 'signup', 'password', 'session', 'user', 'otp', 'verify', 'forgot password', 'reset password'],
    pages: ['Auth.tsx', 'ForgotPasswordPage.tsx', 'ResetPassword.tsx', 'VerifyOTP.tsx', 'VerifyAccess.tsx'],
    components: ['OtpInput.tsx'],
    hooks: [],
    apis: ['send-access-pin'],
    edgeFunctions: ['send-access-pin', 'admin-pin-reset'],
    routes: ['/auth', '/forgot-password', '/reset-password', '/verify-otp', '/verify-access'],
    dbTables: ['profiles', 'user_roles'],
    description: 'Email+password auth via Supabase. Roles in user_roles table with has_role() security definer function. Auth context in src/lib/auth.tsx. OTP verification for access control.',
    dependencies: ['@supabase/supabase-js'],
  },
  {
    feature: 'Gallery System',
    category: 'gallery',
    keywords: ['gallery', 'photo', 'image', 'lightbox', 'masonry', 'watermark', 'slideshow', 'editorial', 'collage', 'grid layout', 'chapter'],
    pages: ['EventGallery.tsx', 'PublicGallery.tsx', 'GalleryCover.tsx'],
    components: ['GalleryShell.tsx', 'PhotoLightbox.tsx', 'GalleryPasswordGate.tsx', 'PhotoSlideshow.tsx', 'ProgressiveImage.tsx', 'GalleryTextBlock.tsx', 'EditorialCollageGrid.tsx', 'PremiumGridLayouts.tsx', 'PhotoSectionSelect.tsx', 'CommentsViewer.tsx'],
    hooks: ['use-infinite-photos.ts', 'use-guest-favorites.ts', 'use-guest-session.ts'],
    apis: ['send-gallery-view-notification'],
    edgeFunctions: ['send-gallery-view-notification', 'send-comment-notification'],
    routes: ['/events/:slug', '/gallery/:slug'],
    dbTables: ['events', 'photos', 'favorites', 'guest_sessions', 'gallery_chapters', 'gallery_text_blocks', 'chapter_photos', 'event_analytics', 'event_views', 'photo_comments', 'photo_interactions', 'photo_faces'],
    description: 'Multi-layout gallery with masonry/grid/editorial/collage styles, password/PIN protection, guest favorites, chapters, text blocks, comments, analytics tracking, and face recognition.',
    dependencies: ['react-window'],
  },
  {
    feature: 'Event Management',
    category: 'gallery',
    keywords: ['event', 'wedding', 'create event', 'slug', 'publish', 'archive', 'event settings', 'duplicate event'],
    pages: ['Events.tsx', 'EventGallery.tsx'],
    components: ['EventCard.tsx', 'CreateEventModal.tsx', 'EventSettingsModal.tsx', 'EventDuplicateModal.tsx'],
    hooks: [],
    apis: [],
    edgeFunctions: [],
    routes: ['/events', '/events/:slug'],
    dbTables: ['events', 'photos', 'event_analytics'],
    description: 'CRUD for photo events with slug-based URLs, gallery settings, layout options, download controls, watermark toggle, and publishing. Supports archiving and duplication.',
    dependencies: [],
  },
  {
    feature: 'Client Management',
    category: 'client',
    keywords: ['client', 'invite', 'client portal', 'client dashboard', 'client favorites', 'client downloads'],
    pages: ['Clients.tsx', 'client/ClientDashboard.tsx', 'client/ClientEvents.tsx', 'client/ClientFavorites.tsx', 'client/ClientDownloads.tsx', 'client/ClientProfile.tsx', 'client/ClientEventView.tsx'],
    components: ['InviteClientModal.tsx', 'ClientDashboardLayout.tsx'],
    hooks: [],
    apis: ['invite-client'],
    edgeFunctions: ['invite-client', 'send-welcome-email'],
    routes: ['/clients', '/client/dashboard', '/client/events', '/client/favorites', '/client/downloads', '/client/profile'],
    dbTables: ['clients', 'client_events', 'client_favorites', 'client_downloads'],
    description: 'Client invitation via email, portal access with separate dashboard, favorites, downloads. Clients linked to photographers via photographer_id. RLS per photographer.',
    dependencies: [],
  },
  {
    feature: 'Dashboard',
    category: 'core',
    keywords: ['dashboard', 'overview', 'stats', 'widget', 'navigation', 'sidebar', 'quick actions'],
    pages: ['Dashboard.tsx'],
    components: ['DashboardLayout.tsx', 'AppSidebar.tsx', 'StatCard.tsx', 'NotificationBell.tsx'],
    hooks: ['use-analytics.ts', 'use-storage-usage.ts'],
    apis: [],
    edgeFunctions: [],
    routes: ['/dashboard'],
    dbTables: ['dashboard_widgets', 'dashboard_navigation', 'dashboard_modules', 'dashboard_settings', 'dashboard_layouts', 'dashboard_quick_actions'],
    description: 'Photographer dashboard with configurable widgets, navigation, and modules. Super Admin can customize layout via dashboard editor. Supports multiple layout profiles per role.',
    dependencies: ['recharts'],
  },
  {
    feature: 'Album Designer',
    category: 'content',
    keywords: ['album', 'album design', 'spread', 'page layout', 'print', 'album export', 'pdf'],
    pages: ['AlbumDesigner.tsx', 'AlbumEditorPage.tsx', 'AlbumPreviewPage.tsx'],
    components: ['album-designer/AlbumCanvas.tsx', 'album-designer/AlbumTimeline.tsx', 'album-designer/AlbumEditorToolbar.tsx', 'album-designer/AlbumPhotoPanel.tsx', 'album-designer/AlbumPreviewModal.tsx', 'album-designer/AlbumExportDialog.tsx', 'album-designer/NewAlbumWizard.tsx', 'album-designer/AlbumRightPanel.tsx', 'album-designer/AlbumAutoLayoutDialog.tsx'],
    hooks: [],
    apis: [],
    edgeFunctions: [],
    routes: ['/album-designer', '/album-editor/:id', '/album-preview/:id'],
    dbTables: ['albums', 'album_pages', 'album_layers', 'album_selections'],
    description: 'Visual album design tool with drag-drop layers, spreads, photo panels, auto-layout, and PDF/JSPDF export. Supports share tokens for client preview.',
    dependencies: ['jspdf'],
  },
  {
    feature: 'Website Builder',
    category: 'content',
    keywords: ['website', 'portfolio', 'studio website', 'website editor', 'template', 'seo', 'blog', 'contact form', 'inquiry'],
    pages: ['WebsiteEditor.tsx', 'TemplatePreview.tsx'],
    components: ['website/WebsiteHero.tsx', 'website/WebsiteAbout.tsx', 'website/WebsitePortfolio.tsx', 'website/WebsiteContact.tsx', 'website/WebsiteFooter.tsx', 'website/WebsiteTestimonials.tsx', 'website/WebsiteServices.tsx', 'website/WebsiteInquiryForm.tsx', 'website/WebsiteHeader.tsx', 'website/WebsiteFeatured.tsx', 'website/WebsiteInstagramGrid.tsx', 'website/WebsiteJournal.tsx', 'website/WebsiteNewsletter.tsx', 'website/WebsitePhotoShowcase.tsx', 'website/WebsiteCinematicFilms.tsx', 'website/WebsiteCinematicGallery.tsx'],
    hooks: ['use-website-templates.ts', 'use-portfolio-photos.ts', 'use-google-fonts.ts'],
    apis: [],
    edgeFunctions: [],
    routes: ['/website-editor', '/template-preview'],
    dbTables: ['studio_profiles', 'portfolio_albums', 'blog_posts', 'contact_inquiries'],
    description: 'Portfolio website builder with multiple templates (editorial, cinematic, minimal), section editors with drag reorder, blog, contact/inquiry forms, and Google Fonts integration.',
    dependencies: [],
  },
  {
    feature: 'Grid Builder',
    category: 'social',
    keywords: ['grid', 'instagram', 'carousel', 'collage', 'social media', 'caption', 'export', 'text overlay', 'logo overlay'],
    pages: ['BuilderTest.tsx'],
    components: ['grid-builder/GridBuilder.tsx', 'grid-builder/GridEditor.tsx', 'grid-builder/GridCell.tsx', 'grid-builder/TextOverlay.tsx', 'grid-builder/LogoOverlay.tsx', 'grid-builder/CarouselExporter.tsx', 'grid-builder/AICaptionGenerator.tsx', 'grid-builder/AILayoutSuggestions.tsx', 'grid-builder/BackgroundStyler.tsx', 'grid-builder/FontPicker.tsx', 'grid-builder/SafeAreaGuides.tsx', 'grid-builder/SmartFillUploader.tsx'],
    hooks: ['use-grid-templates.ts'],
    apis: ['generate-caption', 'analyze-grid-layout', 'suggest-layout'],
    edgeFunctions: ['generate-caption', 'analyze-grid-layout', 'suggest-layout'],
    routes: ['/builder-test'],
    dbTables: ['grid_templates'],
    description: 'Instagram grid/carousel builder with text overlays, logo placement, AI captions, AI layout suggestions, background styling, font picker, safe area guides, and multi-format export.',
    dependencies: ['html-to-image', 'html2canvas'],
  },
  {
    feature: 'Cheetah AI Culling',
    category: 'tools',
    keywords: ['cheetah', 'cull', 'culling', 'ai photo', 'photo analysis', 'best photo', 'sharpness', 'composition', 'burst'],
    pages: ['Cheetah.tsx', 'CheetahLive.tsx'],
    components: [],
    hooks: ['use-cheetah.ts'],
    apis: ['cheetah-analyze', 'cheetah-ingest'],
    edgeFunctions: ['cheetah-analyze', 'cheetah-ingest'],
    routes: ['/cheetah', '/cheetah-live'],
    dbTables: ['cheetah_sessions', 'cheetah_photos', 'culling_sessions', 'culled_photos'],
    description: 'AI-powered photo culling with sharpness/composition/exposure scoring, burst grouping, best-of selection, and live culling sessions.',
    dependencies: [],
  },
  {
    feature: 'Branding & Watermark',
    category: 'content',
    keywords: ['brand', 'logo', 'watermark', 'typography', 'studio profile', 'brand preset', 'accent color'],
    pages: ['Branding.tsx', 'BrandEditor.tsx'],
    components: ['brand/BrandAssets.tsx', 'brand/BrandTypography.tsx', 'brand/BrandWatermark.tsx', 'brand-editor/StudioLivePreview.tsx', 'brand-editor/WebsiteTemplateSelector.tsx', 'brand-editor/AlbumManagerDrawer.tsx'],
    hooks: [],
    apis: [],
    edgeFunctions: [],
    routes: ['/branding', '/brand-editor'],
    dbTables: ['studio_profiles', 'profiles'],
    description: 'Brand management with logo upload, watermark settings (position, opacity, text), typography, accent colors, brand presets, and live studio preview.',
    dependencies: [],
  },
  {
    feature: 'Analytics & Tracking',
    category: 'core',
    keywords: ['analytics', 'stats', 'views', 'downloads', 'tracking', 'chart', 'metrics', 'conversion'],
    pages: ['Analytics.tsx'],
    components: [],
    hooks: ['use-analytics.ts'],
    apis: [],
    edgeFunctions: [],
    routes: ['/analytics'],
    dbTables: ['event_analytics', 'event_views', 'photo_interactions'],
    description: 'Gallery analytics dashboard with views, downloads, favorites tracking, time-series charts via Recharts, and per-event metrics.',
    dependencies: ['recharts'],
  },
  {
    feature: 'Notifications',
    category: 'core',
    keywords: ['notification', 'alert', 'bell', 'notify', 'email notification', 'in-app'],
    pages: ['Notifications.tsx'],
    components: ['NotificationBell.tsx'],
    hooks: ['use-notifications.ts'],
    apis: ['send-comment-notification', 'send-favorites-notification', 'send-gallery-view-notification', 'send-selection-notification'],
    edgeFunctions: ['send-comment-notification', 'send-favorites-notification', 'send-gallery-view-notification', 'send-selection-notification'],
    routes: ['/notifications'],
    dbTables: ['notifications'],
    description: 'In-app notifications for gallery views, comments, selections, and client actions. Triggered via database triggers (notify_on_event_view, notify_on_comment, etc).',
    dependencies: [],
  },
  {
    feature: 'Guest Features',
    category: 'gallery',
    keywords: ['guest', 'selection', 'favorite', 'face recognition', 'selfie', 'qr', 'find my photos', 'pin', 'access'],
    pages: ['GuestFinder.tsx', 'VerifyAccess.tsx'],
    components: ['GuestSelectionMode.tsx', 'GuestSelectionsViewer.tsx', 'GuestFavoritesTab.tsx', 'FindMyPhotosModal.tsx', 'events/SmartQRAccess.tsx', 'SelectionsViewer.tsx', 'SendFavoritesDialog.tsx'],
    hooks: ['use-guest-favorites.ts', 'use-guest-session.ts', 'useGuestFinder.ts', 'useEventQR.ts'],
    apis: ['process-guest-selfie', 'send-access-pin'],
    edgeFunctions: ['process-guest-selfie', 'send-access-pin'],
    routes: ['/guest-finder', '/verify-access'],
    dbTables: ['guest_sessions', 'guest_selections', 'guest_selection_photos', 'guest_registrations', 'guest_selfies', 'event_qr_access', 'face_indexing_jobs', 'photo_faces'],
    description: 'Guest photo selection, favorites, face recognition (Find My Photos via Azure Face API), QR code access, PIN verification, and selfie matching.',
    dependencies: ['qrcode.react'],
  },
  {
    feature: 'Storybooks',
    category: 'content',
    keywords: ['storybook', 'story', 'narrative', 'storybook creator', 'otp gate'],
    pages: ['StorybookCreator.tsx'],
    components: ['StoryBookLayout.tsx', 'StorybookPreview.tsx', 'StorybookGate.tsx', 'StorybookInstallBanner.tsx'],
    hooks: [],
    apis: ['send-storybook-otp'],
    edgeFunctions: ['send-storybook-otp'],
    routes: ['/storybook-creator'],
    dbTables: ['storybooks', 'storybook_blocks', 'storybook_otp'],
    description: 'Visual storybook creator with blocks, slide-based layouts, OTP-gated sharing, and preview mode.',
    dependencies: [],
  },
  {
    feature: 'Admin Panel',
    category: 'admin',
    keywords: ['admin', 'moderation', 'platform', 'admin dashboard', 'admin settings', 'admin pin', 'bulk email'],
    pages: ['admin/AdminDashboard.tsx', 'admin/AdminPhotographers.tsx', 'admin/AdminSettings.tsx', 'admin/AdminActivity.tsx', 'admin/AdminEmails.tsx', 'admin/AdminEvents.tsx', 'admin/AdminRevenue.tsx', 'admin/AdminStorage.tsx', 'admin/AdminGate.tsx', 'admin/AdminPinGate.tsx'],
    components: [],
    hooks: [],
    apis: ['admin-pin-reset'],
    edgeFunctions: ['admin-pin-reset'],
    routes: ['/admin/dashboard', '/admin/photographers', '/admin/settings', '/admin/activity', '/admin/emails', '/admin/events', '/admin/revenue', '/admin/storage'],
    dbTables: ['admin_activity_log', 'admin_pin_attempts', 'platform_settings', 'platform_features', 'user_roles', 'bulk_emails'],
    description: 'Admin panel with user management, activity logs, platform settings, email tools, revenue tracking, storage monitoring, and PIN-gated access.',
    dependencies: [],
  },
  {
    feature: 'Super Admin',
    category: 'admin',
    keywords: ['super admin', 'ai developer', 'template builder', 'platform builder', 'dashboard editor', 'mirror ai'],
    pages: ['super-admin/SuperAdminOverview.tsx', 'super-admin/SuperAdminUsers.tsx', 'super-admin/SuperAdminAIDeveloper.tsx', 'super-admin/SuperAdminSettings.tsx', 'super-admin/SuperAdminTemplates.tsx', 'super-admin/SuperAdminGalleries.tsx', 'super-admin/SuperAdminGridManager.tsx', 'super-admin/SuperAdminStorybooks.tsx', 'super-admin/SuperAdminPlatformBuilder.tsx', 'super-admin/SuperAdminDashboardEditor.tsx', 'super-admin/SuperAdminMirrorAI.tsx'],
    components: ['ai-developer/AgentChat.tsx', 'ai-developer/CodebaseMemory.tsx'],
    hooks: ['use-platform-settings.ts'],
    apis: ['ai-chat', 'ai-developer'],
    edgeFunctions: ['ai-chat', 'ai-developer'],
    routes: ['/super-admin/overview', '/super-admin/users', '/super-admin/ai-developer', '/super-admin/settings', '/super-admin/templates', '/super-admin/galleries'],
    dbTables: ['ai_developer_prompts', 'dashboard_widgets', 'dashboard_navigation', 'dashboard_modules', 'dashboard_settings', 'dashboard_layouts', 'platform_features', 'platform_permissions', 'platform_layouts', 'platform_ui_settings'],
    description: 'Super Admin panel with AI developer console, template management, platform builder, dashboard editor, and codebase memory system.',
    dependencies: [],
  },
  {
    feature: 'Upload System',
    category: 'tools',
    keywords: ['upload', 'photo upload', 'zip', 'bulk upload', 'livesync', 'folder watcher', 'compression', 'progress'],
    pages: ['UploadPage.tsx'],
    components: ['UploadProgressPanel.tsx'],
    hooks: ['use-photo-upload.ts', 'use-zip-upload.ts', 'use-livesync.ts', 'use-folder-watcher.ts'],
    apis: [],
    edgeFunctions: [],
    routes: ['/upload'],
    dbTables: ['photos', 'events'],
    description: 'Multi-file and ZIP upload with progress tracking, browser-image-compression, livesync for real-time gallery updates, and folder watching.',
    dependencies: ['browser-image-compression', 'jszip'],
  },
  {
    feature: 'Sharing & Embed',
    category: 'social',
    keywords: ['share', 'embed', 'widget', 'link', 'share modal', 'qr code'],
    pages: ['WidgetPage.tsx'],
    components: ['ShareModal.tsx', 'PhotoShareSheet.tsx', 'GalleryEmbedWidget.tsx'],
    hooks: [],
    apis: [],
    edgeFunctions: [],
    routes: ['/widget'],
    dbTables: ['events'],
    description: 'Gallery sharing via links, embeddable gallery widgets, share sheets with social platforms, and QR code generation.',
    dependencies: ['qrcode.react'],
  },
  {
    feature: 'Instagram Feed Planner',
    category: 'social',
    keywords: ['instagram', 'feed planner', 'instagram grid', 'social planning', 'carousel'],
    pages: ['PhotographerFeed.tsx'],
    components: ['InstagramFeedPlanner.tsx', 'InstagramGridPlanner.tsx', 'InstagramPreview.tsx', 'CarouselDesigner.tsx'],
    hooks: [],
    apis: [],
    edgeFunctions: [],
    routes: ['/feed'],
    dbTables: [],
    description: 'Instagram feed visual planner with grid preview, carousel designer, and post scheduling layout.',
    dependencies: [],
  },
  {
    feature: 'Referrals & Billing',
    category: 'core',
    keywords: ['referral', 'billing', 'plan', 'subscription', 'pricing', 'payment'],
    pages: ['Billing.tsx'],
    components: [],
    hooks: [],
    apis: [],
    edgeFunctions: [],
    routes: ['/billing'],
    dbTables: ['referrals', 'profiles'],
    description: 'Billing page with plan management and referral tracking. Plans stored on profiles table.',
    dependencies: [],
  },
  {
    feature: 'Face Recognition',
    category: 'tools',
    keywords: ['face', 'face recognition', 'azure face', 'face++', 'selfie', 'face indexing', 'photo matching'],
    pages: ['GuestFinder.tsx'],
    components: ['FindMyPhotosModal.tsx'],
    hooks: ['useGuestFinder.ts'],
    apis: ['process-guest-selfie'],
    edgeFunctions: ['process-guest-selfie'],
    routes: ['/guest-finder'],
    dbTables: ['photo_faces', 'face_indexing_jobs', 'guest_selfies', 'guest_registrations'],
    description: 'Face recognition using Azure Face API and Face++ for guest photo matching. Includes indexing jobs, selfie processing, and photo-face embeddings.',
    dependencies: [],
  },
  {
    feature: 'Sneak Peeks',
    category: 'gallery',
    keywords: ['sneak peek', 'preview', 'teaser', 'early access'],
    pages: [],
    components: [],
    hooks: [],
    apis: [],
    edgeFunctions: [],
    routes: [],
    dbTables: ['sneak_peeks'],
    description: 'Sneak peek photo selection for early client previews before full gallery delivery.',
    dependencies: [],
  },
];

// ─── DB Tables Extended Index ───
const DB_TABLES_INDEX = [
  { name: 'profiles', columns: 17, desc: 'User profiles, studio settings, plan', category: 'core' },
  { name: 'user_roles', columns: 3, desc: 'RBAC roles (admin, moderator, user, super_admin)', category: 'core' },
  { name: 'events', columns: 30, desc: 'Photo events/galleries with all settings', category: 'gallery' },
  { name: 'photos', columns: 10, desc: 'Individual photos linked to events', category: 'gallery' },
  { name: 'favorites', columns: 5, desc: 'Guest favorites per session', category: 'gallery' },
  { name: 'guest_sessions', columns: 5, desc: 'Anonymous guest sessions', category: 'gallery' },
  { name: 'gallery_chapters', columns: 6, desc: 'Gallery section/chapter grouping', category: 'gallery' },
  { name: 'chapter_photos', columns: 4, desc: 'Photos within chapters', category: 'gallery' },
  { name: 'gallery_text_blocks', columns: 16, desc: 'Rich text blocks in galleries', category: 'gallery' },
  { name: 'photo_comments', columns: 7, desc: 'Guest comments on photos', category: 'gallery' },
  { name: 'photo_interactions', columns: 6, desc: 'Photo view/download tracking', category: 'gallery' },
  { name: 'photo_faces', columns: 7, desc: 'Face embeddings per photo', category: 'gallery' },
  { name: 'event_analytics', columns: 6, desc: 'Aggregated event analytics', category: 'gallery' },
  { name: 'event_views', columns: 4, desc: 'Individual view records', category: 'gallery' },
  { name: 'event_qr_access', columns: 6, desc: 'QR code access tokens', category: 'gallery' },
  { name: 'clients', columns: 8, desc: 'Client records per photographer', category: 'client' },
  { name: 'client_events', columns: 5, desc: 'Client-event access mapping', category: 'client' },
  { name: 'client_favorites', columns: 4, desc: 'Client favorite photos', category: 'client' },
  { name: 'client_downloads', columns: 4, desc: 'Client download history', category: 'client' },
  { name: 'albums', columns: 12, desc: 'Album projects with share tokens', category: 'content' },
  { name: 'album_pages', columns: 7, desc: 'Album page/spread data', category: 'content' },
  { name: 'album_layers', columns: 13, desc: 'Album layer elements (photo, text)', category: 'content' },
  { name: 'album_selections', columns: 5, desc: 'Guest album photo selections', category: 'content' },
  { name: 'storybooks', columns: 9, desc: 'Storybook projects', category: 'content' },
  { name: 'storybook_blocks', columns: 8, desc: 'Storybook content blocks', category: 'content' },
  { name: 'storybook_otp', columns: 6, desc: 'OTP codes for storybook access', category: 'content' },
  { name: 'studio_profiles', columns: 35, desc: 'Public website data & brand', category: 'content' },
  { name: 'portfolio_albums', columns: 11, desc: 'Portfolio album collections', category: 'content' },
  { name: 'blog_posts', columns: 11, desc: 'Blog posts with SEO fields', category: 'content' },
  { name: 'contact_inquiries', columns: 7, desc: 'Website contact form submissions', category: 'content' },
  { name: 'grid_templates', columns: 17, desc: 'Instagram grid templates', category: 'social' },
  { name: 'notifications', columns: 9, desc: 'In-app notification records', category: 'core' },
  { name: 'admin_activity_log', columns: 5, desc: 'Admin action audit trail', category: 'admin' },
  { name: 'admin_pin_attempts', columns: 6, desc: 'Admin PIN verification tracking', category: 'admin' },
  { name: 'platform_settings', columns: 4, desc: 'Global platform key-value settings', category: 'admin' },
  { name: 'platform_features', columns: 13, desc: 'Feature flags & permissions', category: 'admin' },
  { name: 'platform_permissions', columns: 9, desc: 'Role-feature permission matrix', category: 'admin' },
  { name: 'platform_layouts', columns: 10, desc: 'Page layout configurations', category: 'admin' },
  { name: 'platform_ui_settings', columns: 6, desc: 'UI theme/setting overrides', category: 'admin' },
  { name: 'dashboard_widgets', columns: 12, desc: 'Configurable dashboard widgets', category: 'admin' },
  { name: 'dashboard_navigation', columns: 10, desc: 'Dynamic sidebar navigation', category: 'admin' },
  { name: 'dashboard_modules', columns: 8, desc: 'Dashboard feature modules', category: 'admin' },
  { name: 'dashboard_settings', columns: 5, desc: 'Dashboard display settings', category: 'admin' },
  { name: 'dashboard_layouts', columns: 7, desc: 'Dashboard layout profiles', category: 'admin' },
  { name: 'dashboard_quick_actions', columns: 10, desc: 'Dashboard quick action buttons', category: 'admin' },
  { name: 'ai_developer_prompts', columns: 11, desc: 'AI dev console prompt history', category: 'admin' },
  { name: 'bulk_emails', columns: 6, desc: 'Bulk email campaign records', category: 'admin' },
  { name: 'beta_feedback', columns: 6, desc: 'Beta user feedback submissions', category: 'core' },
  { name: 'referrals', columns: 6, desc: 'Referral tracking', category: 'core' },
  { name: 'cheetah_sessions', columns: 8, desc: 'AI culling sessions', category: 'tools' },
  { name: 'cheetah_photos', columns: 21, desc: 'Photos in culling sessions', category: 'tools' },
  { name: 'culling_sessions', columns: 8, desc: 'Legacy culling sessions', category: 'tools' },
  { name: 'culled_photos', columns: 12, desc: 'Legacy culled photo results', category: 'tools' },
  { name: 'guest_selections', columns: 5, desc: 'Named guest photo selections', category: 'gallery' },
  { name: 'guest_selection_photos', columns: 4, desc: 'Photos in guest selections', category: 'gallery' },
  { name: 'guest_registrations', columns: 8, desc: 'Face recognition guest registrations', category: 'gallery' },
  { name: 'guest_selfies', columns: 7, desc: 'Guest selfie uploads for matching', category: 'gallery' },
  { name: 'face_indexing_jobs', columns: 8, desc: 'Face indexing job queue', category: 'tools' },
  { name: 'sneak_peeks', columns: 4, desc: 'Sneak peek photo selections', category: 'gallery' },
];

const EDGE_FUNCTIONS = [
  { name: 'ai-chat', desc: 'AI chat streaming endpoint', category: 'admin' },
  { name: 'ai-developer', desc: 'AI code generation endpoint', category: 'admin' },
  { name: 'cheetah-analyze', desc: 'AI photo analysis scoring', category: 'tools' },
  { name: 'cheetah-ingest', desc: 'Batch photo ingestion', category: 'tools' },
  { name: 'generate-caption', desc: 'AI caption generation', category: 'social' },
  { name: 'analyze-grid-layout', desc: 'AI grid layout analysis', category: 'social' },
  { name: 'suggest-layout', desc: 'AI layout suggestions', category: 'social' },
  { name: 'invite-client', desc: 'Client invitation email', category: 'client' },
  { name: 'send-welcome-email', desc: 'Welcome email on signup', category: 'core' },
  { name: 'send-access-pin', desc: 'Gallery access PIN email', category: 'gallery' },
  { name: 'send-storybook-otp', desc: 'Storybook OTP email', category: 'content' },
  { name: 'send-comment-notification', desc: 'Photo comment notification', category: 'gallery' },
  { name: 'send-favorites-notification', desc: 'Favorites notification', category: 'gallery' },
  { name: 'send-gallery-view-notification', desc: 'Gallery view notification', category: 'gallery' },
  { name: 'send-selection-notification', desc: 'Selection notification', category: 'gallery' },
  { name: 'process-guest-selfie', desc: 'Face matching for guest selfie', category: 'tools' },
  { name: 'admin-pin-reset', desc: 'Admin PIN reset flow', category: 'admin' },
];

const PROJECT_TREE: FolderNode[] = [
  { name: 'src', type: 'folder', children: [
    { name: 'pages', type: 'folder', children: [
      { name: 'Auth.tsx', type: 'file', path: 'src/pages/Auth.tsx' },
      { name: 'Dashboard.tsx', type: 'file', path: 'src/pages/Dashboard.tsx' },
      { name: 'Events.tsx', type: 'file', path: 'src/pages/Events.tsx' },
      { name: 'EventGallery.tsx', type: 'file', path: 'src/pages/EventGallery.tsx' },
      { name: 'PublicGallery.tsx', type: 'file', path: 'src/pages/PublicGallery.tsx' },
      { name: 'Analytics.tsx', type: 'file', path: 'src/pages/Analytics.tsx' },
      { name: 'Clients.tsx', type: 'file', path: 'src/pages/Clients.tsx' },
      { name: 'Branding.tsx', type: 'file', path: 'src/pages/Branding.tsx' },
      { name: 'WebsiteEditor.tsx', type: 'file', path: 'src/pages/WebsiteEditor.tsx' },
      { name: 'AlbumDesigner.tsx', type: 'file', path: 'src/pages/AlbumDesigner.tsx' },
      { name: 'Cheetah.tsx', type: 'file', path: 'src/pages/Cheetah.tsx' },
      { name: 'StorybookCreator.tsx', type: 'file', path: 'src/pages/StorybookCreator.tsx' },
      { name: 'UploadPage.tsx', type: 'file', path: 'src/pages/UploadPage.tsx' },
      { name: 'Notifications.tsx', type: 'file', path: 'src/pages/Notifications.tsx' },
      { name: 'Billing.tsx', type: 'file', path: 'src/pages/Billing.tsx' },
      { name: 'admin/', type: 'folder', children: [
        { name: 'AdminDashboard.tsx', type: 'file', path: 'src/pages/admin/AdminDashboard.tsx' },
        { name: 'AdminPhotographers.tsx', type: 'file', path: 'src/pages/admin/AdminPhotographers.tsx' },
        { name: 'AdminSettings.tsx', type: 'file', path: 'src/pages/admin/AdminSettings.tsx' },
        { name: 'AdminActivity.tsx', type: 'file', path: 'src/pages/admin/AdminActivity.tsx' },
        { name: 'AdminEmails.tsx', type: 'file', path: 'src/pages/admin/AdminEmails.tsx' },
        { name: 'AdminEvents.tsx', type: 'file', path: 'src/pages/admin/AdminEvents.tsx' },
        { name: 'AdminRevenue.tsx', type: 'file', path: 'src/pages/admin/AdminRevenue.tsx' },
        { name: 'AdminStorage.tsx', type: 'file', path: 'src/pages/admin/AdminStorage.tsx' },
      ]},
      { name: 'super-admin/', type: 'folder', children: [
        { name: 'SuperAdminOverview.tsx', type: 'file', path: 'src/pages/super-admin/SuperAdminOverview.tsx' },
        { name: 'SuperAdminUsers.tsx', type: 'file', path: 'src/pages/super-admin/SuperAdminUsers.tsx' },
        { name: 'SuperAdminAIDeveloper.tsx', type: 'file', path: 'src/pages/super-admin/SuperAdminAIDeveloper.tsx' },
        { name: 'SuperAdminSettings.tsx', type: 'file', path: 'src/pages/super-admin/SuperAdminSettings.tsx' },
        { name: 'SuperAdminTemplates.tsx', type: 'file', path: 'src/pages/super-admin/SuperAdminTemplates.tsx' },
        { name: 'SuperAdminGalleries.tsx', type: 'file', path: 'src/pages/super-admin/SuperAdminGalleries.tsx' },
      ]},
      { name: 'client/', type: 'folder', children: [
        { name: 'ClientDashboard.tsx', type: 'file', path: 'src/pages/client/ClientDashboard.tsx' },
        { name: 'ClientEvents.tsx', type: 'file', path: 'src/pages/client/ClientEvents.tsx' },
        { name: 'ClientFavorites.tsx', type: 'file', path: 'src/pages/client/ClientFavorites.tsx' },
        { name: 'ClientDownloads.tsx', type: 'file', path: 'src/pages/client/ClientDownloads.tsx' },
      ]},
    ]},
    { name: 'components', type: 'folder', children: [
      { name: 'ui/', type: 'folder', children: [{ name: '45+ shadcn/ui primitives', type: 'file' }] },
      { name: 'website/', type: 'folder', children: [{ name: '28 website sections', type: 'file' }] },
      { name: 'album-designer/', type: 'folder', children: [{ name: '9 album components', type: 'file' }] },
      { name: 'grid-builder/', type: 'folder', children: [{ name: '18 grid tools', type: 'file' }] },
      { name: 'brand-editor/', type: 'folder', children: [{ name: '3 brand tools', type: 'file' }] },
      { name: 'ai-developer/', type: 'folder', children: [
        { name: 'AgentChat.tsx', type: 'file', path: 'src/components/ai-developer/AgentChat.tsx' },
        { name: 'CodebaseMemory.tsx', type: 'file', path: 'src/components/ai-developer/CodebaseMemory.tsx' },
      ]},
      { name: 'events/', type: 'folder', children: [{ name: 'SmartQRAccess.tsx', type: 'file' }] },
    ]},
    { name: 'hooks', type: 'folder', children: [
      { name: 'use-analytics.ts', type: 'file' }, { name: 'use-photo-upload.ts', type: 'file' },
      { name: 'use-guest-favorites.ts', type: 'file' }, { name: 'use-realtime-sync.ts', type: 'file' },
      { name: 'use-storage-usage.ts', type: 'file' }, { name: 'use-website-templates.ts', type: 'file' },
      { name: 'use-google-fonts.ts', type: 'file' }, { name: 'use-cheetah.ts', type: 'file' },
      { name: 'use-livesync.ts', type: 'file' }, { name: 'use-zip-upload.ts', type: 'file' },
      { name: 'use-notifications.ts', type: 'file' }, { name: 'use-platform-settings.ts', type: 'file' },
    ]},
    { name: 'lib', type: 'folder', children: [
      { name: 'auth.tsx', type: 'file' }, { name: 'AuthContext.tsx', type: 'file' },
      { name: 'utils.ts', type: 'file' }, { name: 'gallery-styles.ts', type: 'file' },
      { name: 'image-utils.ts', type: 'file' }, { name: 'studio-url.ts', type: 'file' },
      { name: 'website-templates.ts', type: 'file' }, { name: 'realtime-status.ts', type: 'file' },
    ]},
    { name: 'services', type: 'folder', children: [
      { name: 'face-recognition/', type: 'folder', children: [
        { name: 'FaceRecognitionService.ts', type: 'file' },
        { name: 'AzureFaceRecognitionService.ts', type: 'file' },
        { name: 'MockFaceRecognitionService.ts', type: 'file' },
      ]},
    ]},
    { name: 'integrations', type: 'folder', children: [
      { name: 'supabase/client.ts', type: 'file' }, { name: 'supabase/types.ts', type: 'file' },
      { name: 'lovable/index.ts', type: 'file' },
    ]},
  ]},
  { name: 'supabase', type: 'folder', children: [
    { name: 'functions/', type: 'folder', children: EDGE_FUNCTIONS.map(fn => ({
      name: `${fn.name}/`, type: 'folder' as const, children: [{ name: 'index.ts', type: 'file' as const }]
    }))},
    { name: 'config.toml', type: 'file' },
  ]},
];

// ─── Smart Search Engine ───
export function searchMemory(query: string): {
  features: MemoryEntry[];
  tables: typeof DB_TABLES_INDEX;
  edgeFunctions: typeof EDGE_FUNCTIONS;
  totalMatches: number;
} {
  if (!query.trim()) return { features: CODEBASE_MEMORY, tables: DB_TABLES_INDEX, edgeFunctions: EDGE_FUNCTIONS, totalMatches: 0 };

  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scoreEntry = (entry: MemoryEntry): number => {
    let score = 0;
    const all = [
      entry.feature, entry.description,
      ...entry.keywords, ...entry.pages, ...entry.components,
      ...entry.hooks, ...entry.apis, ...entry.dbTables, ...entry.routes
    ].map(s => s.toLowerCase());
    for (const token of tokens) {
      if (entry.feature.toLowerCase().includes(token)) score += 10;
      if (entry.keywords.some(k => k.includes(token))) score += 8;
      if (entry.dbTables.some(t => t.includes(token))) score += 6;
      if (entry.description.toLowerCase().includes(token)) score += 4;
      if (entry.components.some(c => c.toLowerCase().includes(token))) score += 3;
      if (entry.pages.some(p => p.toLowerCase().includes(token))) score += 3;
      if (entry.hooks.some(h => h.toLowerCase().includes(token))) score += 2;
      if (entry.apis.some(a => a.includes(token))) score += 2;
    }
    return score;
  };

  const scoredFeatures = CODEBASE_MEMORY.map(m => ({ entry: m, score: scoreEntry(m) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.entry);

  const tables = DB_TABLES_INDEX.filter(t =>
    tokens.some(tok => t.name.includes(tok) || t.desc.toLowerCase().includes(tok) || t.category.includes(tok))
  );

  const fns = EDGE_FUNCTIONS.filter(f =>
    tokens.some(tok => f.name.includes(tok) || f.desc.toLowerCase().includes(tok) || f.category.includes(tok))
  );

  return {
    features: scoredFeatures,
    tables,
    edgeFunctions: fns,
    totalMatches: scoredFeatures.length + tables.length + fns.length,
  };
}

// ─── Context Injection for AI ───
export function getRelevantContext(promptText: string): string {
  const { features, tables, edgeFunctions } = searchMemory(promptText);
  if (features.length === 0 && tables.length === 0) return '';

  let ctx = '\n## Relevant Codebase Context (auto-injected)\n';
  features.slice(0, 5).forEach(m => {
    ctx += `\n### ${m.feature}\n`;
    ctx += `${m.description}\n`;
    if (m.pages.length) ctx += `Pages: ${m.pages.join(', ')}\n`;
    if (m.components.length) ctx += `Components: ${m.components.join(', ')}\n`;
    if (m.hooks.length) ctx += `Hooks: ${m.hooks.join(', ')}\n`;
    if (m.apis.length) ctx += `APIs: ${m.apis.join(', ')}\n`;
    if (m.edgeFunctions.length) ctx += `Edge Functions: ${m.edgeFunctions.join(', ')}\n`;
    if (m.dbTables.length) ctx += `DB Tables: ${m.dbTables.join(', ')}\n`;
    if (m.routes.length) ctx += `Routes: ${m.routes.join(', ')}\n`;
    if (m.dependencies.length) ctx += `Dependencies: ${m.dependencies.join(', ')}\n`;
  });

  const extraTables = tables.filter(t => !features.some(f => f.dbTables.includes(t.name)));
  if (extraTables.length > 0) {
    ctx += `\n### Additional Matching Tables\n`;
    extraTables.forEach(t => ctx += `- ${t.name}: ${t.desc} (${t.columns} cols)\n`);
  }

  const extraFns = edgeFunctions.filter(f => !features.some(fe => fe.edgeFunctions.includes(f.name)));
  if (extraFns.length > 0) {
    ctx += `\n### Additional Edge Functions\n`;
    extraFns.forEach(f => ctx += `- ${f.name}: ${f.desc}\n`);
  }

  return ctx;
}

// ─── Tree Node Component ───
function TreeNode({ node, depth = 0, searchFilter }: { node: FolderNode; depth?: number; searchFilter?: string }) {
  const isFolder = node.type === 'folder';
  const matchesSearch = searchFilter ? node.name.toLowerCase().includes(searchFilter.toLowerCase()) : true;
  const childMatches = searchFilter && isFolder && node.children?.some(c =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.children?.some(gc => gc.name.toLowerCase().includes(searchFilter.toLowerCase())))
  );
  const [open, setOpen] = useState(depth < 1 || !!(searchFilter && childMatches));

  // Auto-expand when search matches children
  const shouldAutoExpand = !!(searchFilter && childMatches);
  useEffect(() => {
    if (shouldAutoExpand) setOpen(true);
  }, [shouldAutoExpand]);

  if (searchFilter && !matchesSearch && !childMatches) return null;

  return (
    <div>
      <button
        onClick={() => isFolder && setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 w-full text-left py-0.5 px-1 rounded text-[11px] hover:bg-muted/50 transition-colors',
          isFolder ? 'text-foreground font-medium' : 'text-muted-foreground',
          searchFilter && matchesSearch && 'bg-primary/5 text-primary'
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {isFolder ? (open ? <ChevronDown className="h-3 w-3 flex-shrink-0" /> : <ChevronRight className="h-3 w-3 flex-shrink-0" />) : <File className="h-3 w-3 flex-shrink-0 text-blue-400" />}
        {isFolder ? <FolderOpen className="h-3 w-3 flex-shrink-0 text-amber-500" /> : null}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && open && node.children?.map((child, i) => (
        <TreeNode key={i} node={child} depth={depth + 1} searchFilter={searchFilter} />
      ))}
    </div>
  );
}

// ─── Main Component ───
export default function CodebaseMemory() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [activeSection, setActiveSection] = useState<'features' | 'tables' | 'functions' | 'routes' | 'tree'>('features');

  const results = useMemo(() => searchMemory(search), [search]);

  const filteredFeatures = useMemo(() => {
    const features = search ? results.features : CODEBASE_MEMORY;
    if (activeCategory === 'all') return features;
    return features.filter(f => f.category === activeCategory);
  }, [results.features, activeCategory, search]);

  const filteredTables = useMemo(() => {
    const tables = search ? results.tables : DB_TABLES_INDEX;
    if (activeCategory === 'all') return tables;
    return tables.filter(t => t.category === activeCategory);
  }, [results.tables, activeCategory, search]);

  const filteredFunctions = useMemo(() => {
    const fns = search ? results.edgeFunctions : EDGE_FUNCTIONS;
    if (activeCategory === 'all') return fns;
    return fns.filter(f => f.category === activeCategory);
  }, [results.edgeFunctions, activeCategory, search]);

  const allRoutes = useMemo(() => {
    const routes: { path: string; feature: string }[] = [];
    CODEBASE_MEMORY.forEach(m => m.routes.forEach(r => routes.push({ path: r, feature: m.feature })));
    if (!search) return routes;
    const tokens = search.toLowerCase().split(/\s+/);
    return routes.filter(r => tokens.some(t => r.path.includes(t) || r.feature.toLowerCase().includes(t)));
  }, [search]);

  const stats = {
    features: CODEBASE_MEMORY.length,
    tables: DB_TABLES_INDEX.length,
    functions: EDGE_FUNCTIONS.length,
    routes: CODEBASE_MEMORY.reduce((acc, m) => acc + m.routes.length, 0),
    components: CODEBASE_MEMORY.reduce((acc, m) => acc + m.components.length, 0),
    hooks: CODEBASE_MEMORY.reduce((acc, m) => acc + m.hooks.length, 0),
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left — Project Tree */}
      <div className="w-72 border-r border-border flex flex-col">
        <div className="p-2.5 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Project Structure</span>
          </div>
          <div className="relative">
            <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search features, tables, components..."
              className="w-full text-[10px] pl-6 pr-2 py-1.5 rounded bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
        <ScrollArea className="flex-1 p-1.5">
          {PROJECT_TREE.map((node, i) => <TreeNode key={i} node={node} searchFilter={search || undefined} />)}
        </ScrollArea>
      </div>

      {/* Right — Memory Index */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />Codebase Memory & Smart Search
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {stats.features} features • {stats.tables} tables • {stats.functions} functions • {stats.routes} routes • Read-only intelligence
              </p>
            </div>
            <Badge variant="outline" className="gap-1 text-[9px]">
              <Lock className="h-2.5 w-2.5" />Read-Only
            </Badge>
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn('text-[9px] px-2 py-1 rounded-full border transition-colors',
                activeCategory === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}
            >
              All
            </button>
            {Object.entries(CATEGORIES).map(([key, { label, icon: Icon, color }]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={cn('text-[9px] px-2 py-1 rounded-full border transition-colors flex items-center gap-1',
                  activeCategory === key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}
              >
                <Icon className={cn('h-2.5 w-2.5', activeCategory === key ? '' : color)} />
                {label}
              </button>
            ))}
          </div>

          {/* Search results indicator */}
          {search && (
            <div className="mt-2 flex items-center gap-2 text-[10px]">
              <Search className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">
                Found <span className="text-foreground font-medium">{results.totalMatches}</span> matches for "<span className="text-primary">{search}</span>"
              </span>
            </div>
          )}
        </div>

        {/* Section tabs */}
        <div className="border-b border-border px-3">
          <div className="flex gap-0">
            {[
              { key: 'features', label: 'Features', icon: Package, count: filteredFeatures.length },
              { key: 'tables', label: 'Database', icon: Database, count: filteredTables.length },
              { key: 'functions', label: 'Functions', icon: Server, count: filteredFunctions.length },
              { key: 'routes', label: 'Routes', icon: Globe, count: allRoutes.length },
              { key: 'tree', label: 'Context Preview', icon: Info, count: 0 },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key as any)}
                className={cn(
                  'flex items-center gap-1 px-3 py-2 text-[10px] border-b-2 transition-colors',
                  activeSection === tab.key
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="h-3 w-3" />
                {tab.label}
                {tab.count > 0 && <Badge variant="secondary" className="text-[7px] h-3.5 px-1 ml-0.5">{tab.count}</Badge>}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-3">
            {/* Features Section */}
            {activeSection === 'features' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {filteredFeatures.map(m => {
                  const cat = CATEGORIES[m.category];
                  return (
                    <div key={m.feature} className="p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {cat && <cat.icon className={cn('h-3.5 w-3.5', cat.color)} />}
                          <span className="text-[11px] font-semibold text-foreground">{m.feature}</span>
                        </div>
                        <div className="flex gap-1">
                          {m.pages.length > 0 && <Badge variant="secondary" className="text-[7px] px-1 h-3.5">{m.pages.length} pages</Badge>}
                          {m.components.length > 0 && <Badge variant="secondary" className="text-[7px] px-1 h-3.5">{m.components.length} comp</Badge>}
                          {m.dbTables.length > 0 && <Badge variant="secondary" className="text-[7px] px-1 h-3.5">{m.dbTables.length} tables</Badge>}
                        </div>
                      </div>
                      <p className="text-[9px] text-muted-foreground mb-2">{m.description}</p>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {m.keywords.map(kw => (
                          <span key={kw} className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{kw}</span>
                        ))}
                      </div>
                      {m.dbTables.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {m.dbTables.map(t => (
                            <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      )}
                      {m.edgeFunctions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {m.edgeFunctions.map(a => (
                            <span key={a} className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/10 font-mono text-green-600">{a}</span>
                          ))}
                        </div>
                      )}
                      {m.routes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {m.routes.map(r => (
                            <span key={r} className="text-[8px] px-1.5 py-0.5 rounded bg-violet-500/10 font-mono text-violet-600">{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredFeatures.length === 0 && (
                  <p className="text-xs text-muted-foreground col-span-2 text-center py-8">No features match your search.</p>
                )}
              </div>
            )}

            {/* Database Section */}
            {activeSection === 'tables' && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredTables.map(table => {
                  const cat = CATEGORIES[table.category];
                  return (
                    <div key={table.name} className="p-2.5 rounded-lg border border-border bg-card/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Database className="h-3 w-3 text-blue-500" />
                        <span className="text-[11px] font-medium font-mono">{table.name}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mb-1">{table.desc}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[8px]">{table.columns} cols</Badge>
                        {cat && <Badge variant="secondary" className={cn('text-[7px]', cat.color)}>{cat.label}</Badge>}
                      </div>
                    </div>
                  );
                })}
                {filteredTables.length === 0 && (
                  <p className="text-xs text-muted-foreground col-span-3 text-center py-8">No tables match your search.</p>
                )}
              </div>
            )}

            {/* Edge Functions Section */}
            {activeSection === 'functions' && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredFunctions.map(fn => {
                  const cat = CATEGORIES[fn.category];
                  return (
                    <div key={fn.name} className="p-2.5 rounded-lg border border-border bg-card/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Server className="h-3 w-3 text-green-500" />
                        <span className="text-[11px] font-medium font-mono">{fn.name}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mb-1">{fn.desc}</p>
                      {cat && <Badge variant="secondary" className={cn('text-[7px]', cat.color)}>{cat.label}</Badge>}
                    </div>
                  );
                })}
                {filteredFunctions.length === 0 && (
                  <p className="text-xs text-muted-foreground col-span-3 text-center py-8">No functions match your search.</p>
                )}
              </div>
            )}

            {/* Routes Section */}
            {activeSection === 'routes' && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5">
                {allRoutes.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 p-2 rounded-lg border border-border bg-card/50">
                    <Globe className="h-2.5 w-2.5 text-violet-500 flex-shrink-0" />
                    <span className="text-[10px] font-mono text-foreground">{r.path}</span>
                    <Badge variant="secondary" className="text-[7px] ml-auto">{r.feature}</Badge>
                  </div>
                ))}
                {allRoutes.length === 0 && (
                  <p className="text-xs text-muted-foreground col-span-3 text-center py-8">No routes match your search.</p>
                )}
              </div>
            )}

            {/* Context Preview Section */}
            {activeSection === 'tree' && (
              <div>
                <h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
                  <Info className="h-3.5 w-3.5 text-amber-500" />Context Injection Preview
                </h4>
                <p className="text-[9px] text-muted-foreground mb-3">
                  Type a prompt keyword in the search box to preview what context the AI agent receives automatically when you chat.
                </p>
                {search ? (
                  <pre className="text-[9px] font-mono bg-muted/30 rounded-lg p-3 max-h-96 overflow-auto text-muted-foreground whitespace-pre-wrap border border-border">
                    {getRelevantContext(search) || '(No matching features found for this keyword)'}
                  </pre>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground">Try searching for:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['gallery', 'booking', 'client', 'album', 'upload', 'face recognition', 'admin', 'instagram'].map(term => (
                        <button
                          key={term}
                          onClick={() => setSearch(term)}
                          className="text-[9px] px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
