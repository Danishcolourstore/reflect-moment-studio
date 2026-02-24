import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  studioName: string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  studioName: 'My Studio',
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [studioName, setStudioName] = useState('My Studio');

  useEffect(() => {
    // 1. Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log('[Auth] State change:', _event, !!newSession);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    // 2. Then check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      console.log('[Auth] Initial session:', !!existingSession);
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch studio name when user changes
  useEffect(() => {
    if (!user) {
      setStudioName('My Studio');
      return;
    }

    (supabase
      .from('profiles')
      .select('studio_name')
      .eq('user_id', user.id)
      .single() as any)
      .then(({ data }: any) => {
        if (data?.studio_name) setStudioName(data.studio_name);
      })
      .catch(() => {});
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setStudioName('My Studio');
    sessionStorage.removeItem('redirectAfterLogin');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, studioName, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
