import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect, Suspense } from "react";

// 👉 KEEP YOUR EXISTING IMPORTS (pages etc.)
import Dashboard from "./pages/Dashboard";
import MirrorAI from "./pages/MirrorAI";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <p className="text-muted-foreground font-serif text-lg animate-pulse">Loading…</p>
    </div>
  );
}

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return null;
};

const AppRoutes = () => {
  return (
    <>
      <ScrollToTop />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* 👉 SAMPLE ROUTES (KEEP YOUR ORIGINAL ROUTES HERE) */}

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mirror-ai" element={<MirrorAI />} />

          {/* ADD ALL YOUR OTHER ROUTES BELOW (unchanged) */}
        </Routes>
      </Suspense>
    </>
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
                {/* ✅ GLOBAL SCROLL FIX */}
                <div className="h-[100dvh] flex flex-col overflow-hidden bg-background text-foreground">
                  {/* ✅ ONLY SCROLLABLE AREA */}
                  <main className="flex-1 overflow-y-auto">
                    <AppRoutes />
                  </main>
                </div>
              </ErrorBoundary>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
