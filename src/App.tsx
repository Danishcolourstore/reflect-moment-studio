import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { BetaFeedbackButton } from "@/components/BetaFeedbackButton";
import { StorybookGate } from "@/components/StorybookGate";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import EventGallery from "./pages/EventGallery";
import UploadPage from "./pages/UploadPage";
import Analytics from "./pages/Analytics";
import StudioSettings from "./pages/StudioSettings";
import Billing from "./pages/Billing";
import Clients from "./pages/Clients";
import Cheetah from "./pages/Cheetah";
import CheetahLive from "./pages/CheetahLive";
import Branding from "./pages/Branding";
import MorePage from "./pages/MorePage";
import BrandEditor from "./pages/BrandEditor";
import WebsiteEditor from "./pages/WebsiteEditor";
import TemplatePreview from "./pages/TemplatePreview";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Onboarding from "./pages/Onboarding";
import PublicGallery from "./pages/PublicGallery";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientEvents from "./pages/client/ClientEvents";
import ClientEventView from "./pages/client/ClientEventView";
import ClientFavorites from "./pages/client/ClientFavorites";
import ClientDownloads from "./pages/client/ClientDownloads";
import ClientProfile from "./pages/client/ClientProfile";
import WidgetPage from "./pages/WidgetPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import GalleryCover from "./pages/GalleryCover";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import BuilderTest from "./pages/BuilderTest";
import { GalleryShell } from "./components/GalleryShell";
import LandingPage from "./pages/LandingPage";
import GuestFinder from "./pages/GuestFinder";
import PhotographerFeed from "./pages/PhotographerFeed";
import StorybookCreator from "./pages/StorybookCreator";
import AlbumDesigner from "./pages/AlbumDesigner";
import AlbumEditorPage from "./pages/AlbumEditorPage";
import AlbumPreviewPage from "./pages/AlbumPreviewPage";
import VerifyAccess from "./pages/VerifyAccess";
import VerifyOTP from "./pages/VerifyOTP";
import AdminGate from "./pages/admin/AdminGate";
import AdminLayout from "./pages/admin/AdminLayout";
import SuperAdminGate from "./pages/SuperAdminGate";
import SuperAdminLayout from "./pages/super-admin/SuperAdminLayout";
import SuperAdminOverview from "./pages/super-admin/SuperAdminOverview";
import SuperAdminUsers from "./pages/super-admin/SuperAdminUsers";
import SuperAdminTemplates from "./pages/super-admin/SuperAdminTemplates";
import SuperAdminMirrorAI from "./pages/super-admin/SuperAdminMirrorAI";
import SuperAdminStorybooks from "./pages/super-admin/SuperAdminStorybooks";
import SuperAdminSettings from "./pages/super-admin/SuperAdminSettings";
import TemplateBuilder from "./pages/super-admin/TemplateBuilder";
import SuperAdminGridManager from "./pages/super-admin/SuperAdminGridManager";
import SuperAdminGalleries from "./pages/super-admin/SuperAdminGalleries";
import SuperAdminDashboardEditor from "./pages/super-admin/SuperAdminDashboardEditor";
import SuperAdminPlatformBuilder from "./pages/super-admin/SuperAdminPlatformBuilder";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPhotographers from "./pages/admin/AdminPhotographers";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminStorage from "./pages/admin/AdminStorage";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminEmails from "./pages/admin/AdminEmails";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminSettings from "./pages/admin/AdminSettings";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [suspended, setSuspended] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const loadProfileFlags = async () => {
      const { data, error } = await (supabase.from('profiles').select('suspended') as any)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!mounted) return;
      if (error || !data) {
        setSuspended(false);
        return;
      }
      setSuspended(data.suspended ?? false);
    };

    loadProfileFlags();

    const channel = supabase
      .channel(`profile-live-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, (payload: any) => {
        const nextSuspended = payload?.new?.suspended;
        if (typeof nextSuspended === 'boolean') setSuspended(nextSuspended);
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

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

  // PIN verification removed from dashboard routes — photographers access freely after login

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [checked, setChecked] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    // Check for super_admin role by user ID only (no email check)
    const rolePromise = supabase.from('user_roles').select('role').eq('user_id', user.id);
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000));
    Promise.race([rolePromise, timeout])
      .then((result: any) => {
        const roles = (result?.data || []).map((r: any) => r.role);

        if (roles.includes('super_admin')) {
          setRedirectTo('/super-admin');
          setChecked(true);
          return;
        }

        if (roles.includes('client')) {
          setRedirectTo('/client');
        } else {
          const redirect = sessionStorage.getItem("redirectAfterLogin");
          if (redirect && redirect.startsWith("/dashboard")) {
            sessionStorage.removeItem("redirectAfterLogin");
            setRedirectTo(redirect);
          } else {
            sessionStorage.removeItem("redirectAfterLogin");
            setRedirectTo("/dashboard");
          }
        }
        setChecked(true);
      })
      .catch(() => {
        sessionStorage.removeItem("redirectAfterLogin");
        setRedirectTo("/dashboard");
        setChecked(true);
      });
  }, [user, loading]);

  if (loading) return null;
  if (!user) return <>{children}</>;
  if (!checked) return null;
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}

const LegacyEventRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/dashboard/events/${id}` : '/dashboard/events'} replace />;
};

const AppRoutes = () => {
  useRealtimeSync(true);
  return (
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
        path="/super-admin"
        element={
          <SuperAdminGate>
            <SuperAdminLayout />
          </SuperAdminGate>
        }
      >
        <Route index element={<SuperAdminOverview />} />
        <Route path="users" element={<SuperAdminUsers />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="storage" element={<AdminStorage />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="templates" element={<SuperAdminTemplates />} />
        <Route path="emails" element={<AdminEmails />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="mirrorai" element={<SuperAdminMirrorAI />} />
        <Route path="storybooks" element={<SuperAdminStorybooks />} />
        <Route path="settings" element={<SuperAdminSettings />} />
        <Route path="template-builder" element={<TemplateBuilder />} />
        <Route path="grid-manager" element={<SuperAdminGridManager />} />
        <Route path="galleries" element={<SuperAdminGalleries />} />
        <Route path="dashboard-editor" element={<SuperAdminDashboardEditor />} />
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

      <Route path="/find/:token" element={<GuestFinder />} />
      <Route path="/album-preview/:shareToken" element={<AlbumPreviewPage />} />
      <Route path="/studio/:username" element={<PhotographerFeed />} />
      <Route path="/p/:username" element={<PhotographerFeed />} />
      <Route
        path="/storybook"
        element={
          <StorybookGate>
            <StorybookCreator standalone />
          </StorybookGate>
        }
      />

      <Route
        path="/"
        element={
          <AuthRoute>
            <Auth key="landing" initialView="login" />
          </AuthRoute>
        }
      />
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/events" element={<Navigate to="/dashboard/events" replace />} />
      <Route path="/events/:id" element={<LegacyEventRedirect />} />
      <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
      <Route path="/analytics" element={<Navigate to="/dashboard/analytics" replace />} />
      <Route path="/billing" element={<Navigate to="/dashboard/billing" replace />} />
      <Route path="/upload" element={<Navigate to="/dashboard/upload" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <BetaFeedbackButton />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
