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
        <div className="w-full max-w-xs text-center space-y-14">
          {/* Brand mark */}
          <div className="space-y-3">
            <h1 className="font-serif text-5xl font-semibold text-primary tracking-tight leading-none">
              MirrorAI
            </h1>
            <div className="w-8 h-px bg-primary/30 mx-auto" />
            <p className="text-[10px] text-muted-foreground/50 tracking-[0.25em] uppercase font-medium">
              Reflections of Your Moments
            </p>
          </div>

          {/* CTA buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => setView('login')}
              className="w-full bg-primary hover:bg-primary/85 text-primary-foreground h-11 text-[11px] tracking-[0.14em] uppercase font-medium transition-all duration-200"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setView('signup')}
              variant="outline"
              className="w-full border-border hover:bg-muted/50 text-foreground h-11 text-[11px] tracking-[0.14em] uppercase font-medium transition-all duration-200"
            >
              Create Account
            </Button>
          </div>

          <p className="text-[9px] text-muted-foreground/30 tracking-[0.08em] uppercase">
            Gallery delivery for photographers
          </p>
        </div>
      </div>
    );
  }

  /* ── Login / Signup Form ── */
  const isLogin = view === 'login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-10">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-semibold text-primary tracking-tight">MirrorAI</h1>
          <div className="w-6 h-px bg-primary/30 mx-auto" />
          <p className="text-[9px] text-muted-foreground/50 tracking-[0.2em] uppercase font-medium">
            Reflections of Your Moments
          </p>
        </div>

        {/* Auth card — borderless, editorial */}
        <div className="bg-card border border-border p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <button
              onClick={() => setView('landing')}
              className="text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              {isLogin ? 'Sign In' : 'Create Your Studio'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">
                  Studio Name
                </Label>
                <Input
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="Your Studio Name"
                  className="bg-background border-border h-10 text-[13px]"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-background border-border h-10 text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">
                Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-background border-border h-10 text-[13px]"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/85 text-primary-foreground h-10 text-[11px] tracking-[0.12em] uppercase font-medium mt-2 transition-all duration-200"
              disabled={loading}
            >
              {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setView(isLogin ? 'signup' : 'login')}
              className="text-[11px] text-primary hover:text-primary/80 transition-colors"
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
