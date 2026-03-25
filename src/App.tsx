import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense } from "react";
import AppRoutes from "./AppRoutes"; // ✅ keep your routes in separate file

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

const App = () => {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />

            <BrowserRouter>
              <AuthProvider>
                <ErrorBoundary>
                  {/* ✅ GLOBAL ROOT LAYOUT (SCROLL FIXED) */}
                  <div className="h-[100dvh] flex flex-col overflow-hidden bg-background text-foreground">
                    {/* OPTIONAL HEADER */}
                    {/* <header className="shrink-0 border-b border-border p-3">
                      Mirror AI
                    </header> */}

                    {/* ✅ ONLY SCROLLABLE AREA */}
                    <main className="flex-1 overflow-y-auto">
                      <Suspense fallback={<PageLoader />}>
                        <AppRoutes />
                      </Suspense>
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
};

export default App;
