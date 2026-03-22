import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { BetaFeedbackButton } from "@/components/BetaFeedbackButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StorybookGate } from "@/components/StorybookGate";
import { GalleryShell } from "./components/GalleryShell";
import { useEffect, useState, lazy, Suspense, createContext, useContext } from "react";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { SUPER_ADMIN_ROUTES } from "@/config/super-admin-routes";
import Dashboard from "./pages/Dashboard";

// ─── Lazy-loaded pages ───
const Auth = lazy(() => import("./pages/Auth").then((m) => ({ default: m.default })));
const Events = lazy(() => import("./pages/Events"));
const EventGallery = lazy(() => import("./pages/EventGallery"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const Analytics = lazy(() => import("./pages/Analytics"));
const StudioSettings = lazy(() => import("./pages/StudioSettings"));
const Billing = lazy(() => import("./pages/Billing"));
const Clients = lazy(() => import("./pages/Clients"));
const Cheetah = lazy(() => import("./pages/Cheetah"));
const CheetahLive = lazy(() => import("./pages/CheetahLive"));
const Branding = lazy(() => import("./pages/Branding"));
const MorePage = lazy(() => import("./pages/MorePage"));
const BrandEditor = lazy(() => import("./pages/BrandEditor"));
const WebsiteEditor = lazy(() => import("./pages/WebsiteEditor"));
const TemplatePreview = lazy(() => import("./pages/TemplatePreview"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const PublicGallery = lazy(() => import("./pages/PublicGallery"));
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const ClientEvents = lazy(() => import("./pages/client/ClientEvents"));
const ClientEventView = lazy(() => import("./pages/client/ClientEventView"));
const ClientFavorites = lazy(() => import("./pages/client/ClientFavorites"));
const ClientDownloads = lazy(() => import("./pages/client/ClientDownloads"));
const ClientProfile = lazy(() => import("./pages/client/ClientProfile"));
const WidgetPage = lazy(() => import("./pages/WidgetPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const GalleryCover = lazy(() => import("./pages/GalleryCover"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BuilderTest = lazy(() => import("./pages/BuilderTest"));
const GuestFinder = lazy(() => import("./pages/GuestFinder"));
const PhotographerFeed = lazy(() => import("./pages/PhotographerFeed"));
const PublicFeed = lazy(() => import("./pages/PublicFeed"));
const StorybookCreator = lazy(() => import("./pages/StorybookCreator"));
const AlbumDesigner = lazy(() => import("./pages/AlbumDesigner"));
const AlbumEditorPage = lazy(() => import("./pages/AlbumEditorPage"));
const AlbumPreviewPage = lazy(() => import("./pages/AlbumPreviewPage"));
const AIAlbumBuilder = lazy(() => import("./pages/AIAlbumBuilder"));
const Refyn = lazy(() => import("./pages/Refyn"));
const ColourStore = lazy(() => import("./pages/ColourStore"));
const IntelligenceHome = lazy(() => import("./pages/IntelligenceHome"));
const LandingGate = lazy(() => import("./pages/LandingGate"));
const RetouchLogin = lazy(() => import("./pages/RetouchLogin"));
const ClientPreview = lazy(() => import("./pages/ClientPreview"));
const DomainSettings = lazy(() => import("./pages/DomainSettings"));
const BusinessSuite = lazy(() => import("./pages/BusinessSuite"));
const WebsiteBuilder = lazy(() => import("./pages/WebsiteBuilder"));
const Reflections = lazy(() => import("./pages/Reflections"));
const EntiranBusiness = lazy(() => import("./pages/EntiranBusiness"));
const PublicGalleryView = lazy(() => import("./pages/public/PublicGalleryView"));
const VerifyAccess = lazy(() => import("./pages/VerifyAccess"));
const VerifyOTP = lazy(() => import("./pages/VerifyOTP"));
const AdminGate = lazy(() => import("./pages/admin/AdminGate"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const SuperAdminGate = lazy(() => import("./pages/SuperAdminGate"));
const SuperAdminLayout = lazy(() => import("./pages/super-admin/SuperAdminLayout"));
const SuperAdminOverview = lazy(() => import("./pages/super-admin/SuperAdminOverview"));
const SuperAdminAnalytics = lazy(() => import("./pages/super-admin/SuperAdminAnalytics"));
const SuperAdminUsers = lazy(() => import("./pages/super-admin/SuperAdminUsers"));
const SuperAdminTemplates = lazy(() => import("./pages/super-admin/SuperAdminTemplates"));
const SuperAdminMirrorAI = lazy(() => import("./pages/super-admin/SuperAdminMirrorAI"));
const SuperAdminStorybooks = lazy(() => import("./pages/super-admin/SuperAdminStorybooks"));
const SuperAdminSettings = lazy(() => import("./pages/super-admin/SuperAdminSettings"));
const TemplateBuilder = lazy(() => import("./pages/super-admin/TemplateBuilder"));
const SuperAdminGridManager = lazy(() => import("./pages/super-admin/SuperAdminGridManager"));
const SuperAdminGalleries = lazy(() => import("./pages/super-admin/SuperAdminGalleries"));
const SuperAdminDashboardEditor = lazy(() => import("./pages/super-admin/SuperAdminDashboardEditor"));
const SuperAdminPlatformBuilder = lazy(() => import("./pages/super-admin/SuperAdminPlatformBuilder"));
const SuperAdminAIDeveloper = lazy(() => import("./pages/super-admin/SuperAdminAIDeveloper"));
const SuperAdminReflections = lazy(() => import("./pages/super-admin/SuperAdminReflections"));
const SuperAdminArtGallery = lazy(() => import("./pages/super-admin/SuperAdminArtGallery"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPhotographers = lazy(() => import("./pages/admin/AdminPhotographers"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminStorage = lazy(() => import("./pages/admin/AdminStorage"));
const AdminRevenue = lazy(() => import("./pages/admin/AdminRevenue"));
const AdminEmails = lazy(() => import("./pages/admin/AdminEmails"));
const AdminActivity = lazy(() => import("./pages/admin/AdminActivity"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const SUPER_ADMIN_ROUTE_MAP: Record<string, React.LazyExoticComponent<any>> = {
  overview: SuperAdminOverview,
  users: SuperAdminUsers,
  events: AdminEvents,
  storage: AdminStorage,
  revenue: AdminRevenue,
  analytics: SuperAdminAnalytics,
  templates: SuperAdminTemplates,
  emails: AdminEmails,
  activity: AdminActivity,
  mirrorai: SuperAdminMirrorAI,
  storybooks: SuperAdminStorybooks,
  settings: SuperAdminSettings,
  "studio-templates": TemplateBuilder,
  "grid-manager": SuperAdminGridManager,
  galleries: SuperAdminGalleries,
  "dashboard-editor": SuperAdminDashboardEditor,
  "platform-builder": SuperAdminPlatformBuilder,
  "ai-developer": SuperAdminAIDeveloper,
  reflections: SuperAdminReflections,
  "art-gallery": SuperAdminArtGallery,
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground font-serif text-lg animate-pulse">Loading…</p>
    </div>
  );
}

const SuspendedContext = createContext<boolean | null>(null);

function SuspendedProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [suspended, setSuspended] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setSuspended(null);
      return;
    }
    let mounted = true;

    (async () => {
      const { data } = await (supabase.from("profiles").select("suspended") as any)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!mounted) return;
      setSuspended(data?.suspended ?? false);
    })();

    const channel = supabase
      .channel(`profile-live-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          const v = payload?.new?.suspended;
          if (typeof v === "boolean") setSuspended(v);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return <SuspendedContext.Provider value={suspended}>{children}</SuspendedContext.Provider>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const suspended = useContext(SuspendedContext);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground font-serif text-lg">Loading...</p>
      </div>
    );

  if (!user) {
    sessionStorage.setItem("redirectAfterLogin", location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  if (suspended === null)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );

  if (suspended) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-foreground mb-2">Account Suspended</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Your account has been suspended. Please contact support for assistance.
          </p>
          <button
            onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/login"))}
            className="text-sm underline text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [checked, setChecked] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    // Always clear any stale redirect
    sessionStorage.removeItem("redirectAfterLogin");

    const rolePromise = supabase.from("user_roles").select("role").eq("user_id", user.id);
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000));

    Promise.race([rolePromise, timeout])
      .then((result: any) => {
        const roles = (result?.data || []).map((r: any) => r.role);
        if (roles.includes("super_admin")) {
          setRedirectTo("/super-admin");
        } else if (roles.includes("client")) {
          setRedirectTo("/client");
        } else {
          setRedirectTo("/home");
        }
        setChecked(true);
      })
      .catch(() => {
        setRedirectTo("/home");
        setChecked(true);
      });
  }, [user, loading]);

  if (loading) return <PageLoader />;
  if (!user) return <>{children}</>;
  if (!checked) return <PageLoader />;
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}

const LegacyEventRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/dashboard/events/${id}` : "/dashboard/events"} replace />;
};

const RealtimeSyncWrapper = ({ enabled }: { enabled: boolean }) => {
  useRealtimeSync(enabled);
  return null;
};

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return null;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <SuspendedProvider>
      <ScrollToTop />
      <RealtimeSyncWrapper enabled={!!user} />
      <Suspense fallback={<PageLoader />}>
        <PageTransition>
          <Routes>
            <Route
              path="/login"
              element={
                <AuthRoute>
                  <Auth key="login" initialView="login" />
                </AuthRoute>
              }
            />
            <Route
              path="/register"
              element={
                <AuthRoute>
                  <Auth key="signup" initialView="signup" />
                </AuthRoute>
              }
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-access" element={<VerifyAccess />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/builder-test" element={<BuilderTest />} />
            <Route
              path="/refyn"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Refyn />
                </Suspense>
              }
            />
            <Route
              path="/colour-store"
              element={
                <ProtectedRoute>
                  <ColourStore />
                </ProtectedRoute>
              }
            />
            <Route path="/retouch-login" element={<RetouchLogin />} />
            <Route path="/preview/:previewId" element={<ClientPreview />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <LandingGate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/art-gallery"
              element={
                <ProtectedRoute>
                  <IntelligenceHome />
                </ProtectedRoute>
              }
            />

            <Route
              path="/super-admin"
              element={
                <SuperAdminGate>
                  <SuperAdminLayout />
                </SuperAdminGate>
              }
            >
              {SUPER_ADMIN_ROUTES.map((route) => {
                const Component = SUPER_ADMIN_ROUTE_MAP[route.key];
                if (!Component) return null;
                if (route.path === "") return <Route key={route.key} index element={<Component />} />;
                return <Route key={route.key} path={route.path} element={<Component />} />;
              })}
            </Route>

            <Route
              path="/admin"
              element={
                <AdminGate>
                  <AdminLayout />
                </AdminGate>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="photographers" element={<AdminPhotographers />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="storage" element={<AdminStorage />} />
              <Route path="revenue" element={<AdminRevenue />} />
              <Route path="emails" element={<AdminEmails />} />
              <Route path="activity" element={<AdminActivity />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route
              path="/client"
              element={
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/events"
              element={
                <ProtectedRoute>
                  <ClientEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/events/:id"
              element={
                <ProtectedRoute>
                  <ClientEventView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/favorites"
              element={
                <ProtectedRoute>
                  <ClientFavorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/downloads"
              element={
                <ProtectedRoute>
                  <ClientDownloads />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/profile"
              element={
                <ProtectedRoute>
                  <ClientProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/events"
              element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/events/:id"
              element={
                <ProtectedRoute>
                  <EventGallery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/events/:id/photos"
              element={
                <ProtectedRoute>
                  <EventGallery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/storybook"
              element={
                <ProtectedRoute>
                  <StorybookCreator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/album-designer"
              element={
                <ProtectedRoute>
                  <AlbumDesigner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/album-designer/:albumId/editor"
              element={
                <ProtectedRoute>
                  <AlbumEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/ai-album"
              element={
                <ProtectedRoute>
                  <AIAlbumBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/clients"
              element={
                <ProtectedRoute>
                  <Clients />
                </ProtectedRoute>
              }
            />
             <Route
              path="/dashboard/cheetah"
              element={
                <ProtectedRoute>
                  <CheetahLive />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/cheetah-monitor"
              element={
                <ProtectedRoute>
                  <Cheetah />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/cheetah-live"
              element={
                <ProtectedRoute>
                  <CheetahLive />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/more"
              element={
                <ProtectedRoute>
                  <MorePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <StudioSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/branding"
              element={
                <ProtectedRoute>
                  <Branding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/branding/editor"
              element={
                <ProtectedRoute>
                  <BrandEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/website-editor"
              element={
                <ProtectedRoute>
                  <WebsiteEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/domains"
              element={
                <ProtectedRoute>
                  <DomainSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/template-preview"
              element={
                <ProtectedRoute>
                  <TemplatePreview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/business"
              element={
                <ProtectedRoute>
                  <BusinessSuite />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/reflections"
              element={
                <ProtectedRoute>
                  <Reflections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/entiran-business"
              element={
                <ProtectedRoute>
                  <EntiranBusiness />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/website-builder"
              element={
                <ProtectedRoute>
                  <WebsiteBuilder />
                </ProtectedRoute>
              }
            />

            <Route
              path="/event/:slug"
              element={
                <GalleryShell>
                  <GalleryCover />
                </GalleryShell>
              }
            />
            <Route
              path="/event/:slug/gallery"
              element={
                <GalleryShell>
                  <PublicGallery />
                </GalleryShell>
              }
            />
            <Route path="/widget/:slug" element={<WidgetPage />} />
            <Route
              path="/gallery/:slug"
              element={
                <GalleryShell>
                  <GalleryCover />
                </GalleryShell>
              }
            />
            <Route
              path="/gallery/:slug/view"
              element={
                <GalleryShell>
                  <PublicGallery />
                </GalleryShell>
              }
            />
            <Route path="/gallery-view/:id" element={<PublicGalleryView />} />
            <Route path="/find/:token" element={<GuestFinder />} />
            <Route path="/album-preview/:shareToken" element={<AlbumPreviewPage />} />
            <Route path="/studio/:username" element={<PhotographerFeed />} />
            <Route path="/p/:username" element={<PhotographerFeed />} />
            <Route path="/feed/:username" element={<PublicFeed />} />

            <Route
              path="/storybook"
              element={
                <StorybookGate>
                  <StorybookCreator standalone />
                </StorybookGate>
              }
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/events" element={<Navigate to="/dashboard/events" replace />} />
            <Route path="/events/:id" element={<LegacyEventRedirect />} />
            <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
            <Route path="/analytics" element={<Navigate to="/dashboard/analytics" replace />} />
            <Route path="/billing" element={<Navigate to="/dashboard/billing" replace />} />
            <Route path="/upload" element={<Navigate to="/dashboard/upload" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </Suspense>
    </SuspendedProvider>
  );
};

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
              <BetaFeedbackButton />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
