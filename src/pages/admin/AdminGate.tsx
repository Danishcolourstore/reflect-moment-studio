import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

type AdminRole = 'super_admin' | 'admin' | null;

interface AdminContextType {
  adminRole: AdminRole;
  isSuperAdmin: boolean;
}

const AdminContext = createContext<AdminContextType>({ adminRole: null, isSuperAdmin: false });

export function useAdminRole() {
  return useContext(AdminContext);
}

export default function AdminGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [adminRole, setAdminRole] = useState<AdminRole | 'checking'>('checking');

  useEffect(() => {
    if (loading || !user) return;

    // Check for super_admin first, then admin
    Promise.all([
      supabase.rpc('has_role', { _user_id: user.id, _role: 'super_admin' as any }),
      supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' as any }),
    ]).then(([superRes, adminRes]) => {
      if (superRes.data === true) {
        setAdminRole('super_admin');
      } else if (adminRes.data === true) {
        setAdminRole('admin');
      } else {
        setAdminRole(null);
      }
    }).catch(() => setAdminRole(null));
  }, [user, loading]);

  if (loading || adminRole === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'Jost, sans-serif', letterSpacing: '2px', textTransform: 'uppercase' }}>Verifying access…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!adminRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AdminContext.Provider value={{ adminRole, isSuperAdmin: adminRole === 'super_admin' }}>
      {children}
    </AdminContext.Provider>
  );
}
