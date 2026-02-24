import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import EventGallery from "./pages/EventGallery";
import UploadPage from "./pages/UploadPage";
import Analytics from "./pages/Analytics";
import StudioSettings from "./pages/StudioSettings";
import Billing from "./pages/Billing";
import ResetPassword from "./pages/ResetPassword";
import PublicGallery from "./pages/PublicGallery";
import GalleryCover from "./pages/GalleryCover";
import NotFound from "./pages/NotFound";
import GuestRegister from "./pages/GuestRegister";
import { GalleryShell } from "./components/GalleryShell";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPhotographers from "./pages/admin/AdminPhotographers";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminStorage from "./pages/admin/AdminStorage";
import AdminFaceRecognition from "./pages/admin/AdminFaceRecognition";
import AdminSettings from "./pages/admin/AdminSettings";


const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground font-serif text-lg">Loading...</p></div>;
  if (!user) {
    sessionStorage.setItem("redirectAfterLogin", location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <>{children}</>;

  const redirect = sessionStorage.getItem("redirectAfterLogin");
  sessionStorage.removeItem("redirectAfterLogin");
  return <Navigate to={redirect && redirect.startsWith('/dashboard') ? redirect : '/dashboard'} replace />;
}

const AppRoutes = () => (
  <Routes>
    {/* Auth routes */}
    <Route path="/login" element={<AuthRoute><Auth key="login" initialView="login" /></AuthRoute>} />
    <Route path="/register" element={<AuthRoute><Auth key="signup" initialView="signup" /></AuthRoute>} />
    <Route path="/forgot-password" element={<AuthRoute><Auth key="forgot" initialView="forgot" /></AuthRoute>} />
    <Route path="/reset-password" element={<ResetPassword />} />

    {/* Super Admin routes — completely separate layout */}
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<AdminDashboard />} />
      <Route path="photographers" element={<AdminPhotographers />} />
      <Route path="events" element={<AdminEvents />} />
      <Route path="storage" element={<AdminStorage />} />
      <Route path="face-recognition" element={<AdminFaceRecognition />} />
      <Route path="settings" element={<AdminSettings />} />
    </Route>

    {/* Photographer dashboard routes — all require auth */}
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/dashboard/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
    <Route path="/dashboard/events/:id" element={<ProtectedRoute><EventGallery /></ProtectedRoute>} />
    <Route path="/dashboard/events/:id/photos" element={<ProtectedRoute><EventGallery /></ProtectedRoute>} />
    <Route path="/dashboard/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
    <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
    <Route path="/dashboard/settings" element={<ProtectedRoute><StudioSettings /></ProtectedRoute>} />
    <Route path="/dashboard/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />

    {/* Guest gallery routes — completely public, no auth */}
    <Route path="/event/:slug" element={<GalleryShell><GalleryCover /></GalleryShell>} />
    <Route path="/event/:slug/gallery" element={<GalleryShell><PublicGallery /></GalleryShell>} />
    {/* Guest face registration */}
    <Route path="/gallery/:eventId/register" element={<GuestRegister />} />
    {/* Legacy gallery redirects */}
    <Route path="/gallery/:slug" element={<GalleryShell><GalleryCover /></GalleryShell>} />
    <Route path="/gallery/:slug/view" element={<GalleryShell><PublicGallery /></GalleryShell>} />

    {/* Legacy redirects */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/auth" element={<Navigate to="/login" replace />} />
    <Route path="/events" element={<Navigate to="/dashboard/events" replace />} />
    <Route path="/events/:id" element={<Navigate to="/dashboard/events/:id" replace />} />
    <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
    <Route path="/analytics" element={<Navigate to="/dashboard/analytics" replace />} />
    <Route path="/billing" element={<Navigate to="/dashboard/billing" replace />} />
    <Route path="/upload" element={<Navigate to="/dashboard/upload" replace />} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
