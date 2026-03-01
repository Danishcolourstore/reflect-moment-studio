import { useState, useEffect, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

export default function AdminGate({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'checking' | 'admin' | 'denied' | 'unauthenticated'>('checking');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus('unauthenticated');
      return;
    }

    // Check admin role from user_roles table
    const checkRole = async () => {
      try {
        const { data, error } = await (supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin') as any)
          .maybeSingle();

        if (error || !data) {
          setStatus('denied');
        } else {
          setStatus('admin');
        }
      } catch {
        setStatus('denied');
      }
    };

    checkRole();
  }, [user, authLoading]);

  if (authLoading || status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'denied') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
