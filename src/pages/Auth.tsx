import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

type AuthView = 'landing' | 'login' | 'signup';

const Auth = () => {
  const [view, setView] = useState<AuthView>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (view === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        navigate('/');
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { studio_name: studioName || 'My Studio' },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Check your email', description: 'We sent you a confirmation link.' });
      }
    }
    setLoading(false);
  };

  /* ── Landing Screen ── */
  if (view === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-xs text-center space-y-10">
          <div>
            <h1 className="font-serif text-4xl font-semibold text-gold tracking-tight">MirrorAI</h1>
            <p className="mt-2 text-[11px] text-muted-foreground/60 tracking-[0.2em] uppercase">
              Reflections of Your Moments
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setView('login')}
              className="w-full bg-primary hover:bg-gold-hover text-primary-foreground h-10 text-[12px] tracking-[0.1em] uppercase font-medium"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setView('signup')}
              variant="outline"
              className="w-full border-border hover:bg-secondary/50 text-foreground h-10 text-[12px] tracking-[0.1em] uppercase font-medium"
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Login / Signup Form ── */
  const isLogin = view === 'login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo block */}
        <div className="text-center">
          <h1 className="font-serif text-3xl font-semibold text-gold tracking-tight">MirrorAI</h1>
          <p className="mt-1 text-[10px] text-muted-foreground/60 tracking-[0.2em] uppercase">Reflections of Your Moments</p>
        </div>

        {/* Auth card */}
        <div className="bg-card border border-border p-7">
          <div className="flex items-center gap-2 mb-5">
            <button onClick={() => setView('landing')} className="text-muted-foreground/50 hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              {isLogin ? 'Sign In' : 'Create Your Studio'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Studio Name</Label>
                <Input
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="Your Studio Name"
                  className="bg-background h-9 text-[13px]"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-background h-9 text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-background h-9 text-[13px]"
              />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-gold-hover text-primary-foreground h-9 text-[12px] tracking-wide uppercase font-medium" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => setView(isLogin ? 'signup' : 'login')}
              className="text-[11px] text-gold hover:text-gold-hover transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
