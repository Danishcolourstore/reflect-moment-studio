import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';

type AuthView = 'landing' | 'login' | 'signup' | 'forgot';

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
];

interface AuthProps {
  initialView?: AuthView;
}

const Auth = ({ initialView }: AuthProps) => {
  const [view, setView] = useState<AuthView>(initialView || 'landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const allPasswordRulesPass = passwordRules.every((r) => r.test(password));

  const redirectAfterAuth = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .eq('role', 'admin');

        if (roles && roles.length > 0) {
          navigate('/admin');
          return;
        }
      }
    } catch (e) {
      console.error('[Auth] Role check failed:', e);
    }

    const redirect = sessionStorage.getItem('redirectAfterLogin');
    sessionStorage.removeItem('redirectAfterLogin');
    if (redirect && redirect.startsWith('/dashboard')) {
      navigate(redirect);
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  /* ── Sign In ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      console.log('[Auth] signInWithPassword response:', { data: !!data?.session, error });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login') || msg.includes('invalid_credentials')) {
          setAuthError('Incorrect email or password.');
        } else if (msg.includes('email not confirmed')) {
          setAuthError('Please verify your email before signing in.');
        } else {
          setAuthError(error.message);
        }
      } else if (data?.session) {
        await redirectAfterAuth();
        return;
      }
    } catch (err: any) {
      console.error('[Auth] Login network error:', err);
      setAuthError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Sign Up ── */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allPasswordRulesPass) {
      setAuthError('Please meet all password requirements.');
      return;
    }
    setLoading(true);
    setAuthError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { studio_name: studioName || 'My Studio', full_name: fullName || '' },
        },
      });

      console.log('[Auth] signUp response:', { user: !!data?.user, session: !!data?.session, error });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already been registered')) {
          setAuthError('An account with this email already exists. Please sign in.');
        } else {
          setAuthError(error.message);
        }
      } else if (data?.user?.identities?.length === 0) {
        setAuthError('An account with this email already exists.');
      } else if (data?.session) {
        if (mobile && data.user) {
          await (supabase.from('profiles').update({ mobile } as any) as any).eq('user_id', data.user.id);
        }
        toast({ title: 'Welcome to MirrorAI', description: 'Your studio has been created.' });
        navigate('/dashboard');
        return;
      } else {
        toast({ title: 'Check your email', description: 'We sent a confirmation link to verify your address.' });
      }
    } catch (err: any) {
      console.error('[Auth] Signup network error:', err);
      setAuthError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Forgot Password ── */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setAuthError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setResetSent(true);
      }
    } catch (err: any) {
      setAuthError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════════════════════════════════════
     VIEWS
     ══════════════════════════════════════════════ */

  /* ── Landing ── */
  if (view === 'landing') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-xs text-center space-y-14">
          <div className="space-y-3">
            <h1 className="font-display italic text-5xl font-semibold text-primary tracking-tight leading-none">
              MirrorAI
            </h1>
            <div className="w-8 h-px bg-primary/30 mx-auto" />
            <p className="text-[10px] text-muted-foreground/50 tracking-[0.25em] uppercase font-medium">
              Reflections of Your Moments
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-primary hover:bg-primary/85 text-primary-foreground h-11 text-[11px] tracking-[0.14em] uppercase font-medium"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/register')}
              variant="outline"
              className="w-full border-border hover:bg-muted/50 text-foreground h-11 text-[11px] tracking-[0.14em] uppercase font-medium"
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

  /* ── Forgot Password ── */
  if (view === 'forgot') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-10">
          <Logo />
          <div className="bg-card border border-border p-8">
            <div className="flex items-center gap-2.5 mb-6">
              <button onClick={() => navigate('/login')} className="text-muted-foreground/40 hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="font-display text-xl font-semibold text-foreground">Reset Password</h2>
            </div>

            {resetSent ? (
              <div className="text-center py-4 space-y-3">
                <p className="font-display text-sm text-foreground font-medium">Check your email</p>
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                  We sent a reset link to <span className="text-foreground/80 font-medium">{email}</span>
                </p>
                <button onClick={() => { navigate('/login'); setResetSent(false); }} className="text-[11px] text-primary hover:text-primary/80 transition-colors mt-2">
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-muted-foreground/60 mb-4 leading-relaxed">
                  Enter your email and we'll send you a reset link.
                </p>
                {authError && <ErrorBanner message={authError} />}
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <Field label="Email">
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" className="bg-background border-border h-10 text-[13px]" />
                  </Field>
                  <SubmitButton loading={loading} label="Send Reset Link" />
                </form>
                <div className="mt-6 text-center">
                  <button onClick={() => navigate('/login')} className="text-[11px] text-primary hover:text-primary/80 transition-colors">Back to Sign In</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Login / Signup ── */
  const isLogin = view === 'login';

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 pb-safe">
      <div className="w-full max-w-sm space-y-10">
        <Logo />
        <div className="bg-card border border-border p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <button onClick={() => navigate('/')} className="text-muted-foreground/40 hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {isLogin ? 'Sign In' : 'Create Your Studio'}
            </h2>
          </div>

          {authError && <ErrorBanner message={authError} />}

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <>
                <Field label="Full Name">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your Name" className="bg-background border-border h-10 text-[13px]" />
                </Field>
                <Field label="Studio Name">
                  <Input value={studioName} onChange={(e) => setStudioName(e.target.value)} placeholder="Your Studio Name" className="bg-background border-border h-10 text-[13px]" />
                </Field>
              </>
            )}

            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setAuthError(''); }} placeholder="you@example.com" required autoComplete="email" className="bg-background border-border h-10 text-[13px]" />
            </Field>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                  placeholder="••••••••"
                  required
                  minLength={isLogin ? 6 : 8}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className="bg-background border-border h-10 text-[13px] pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {isLogin && (
                <div className="text-right">
                  <button type="button" onClick={() => { navigate('/forgot-password'); setResetSent(false); }} className="text-[10px] text-muted-foreground/50 hover:text-primary transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              {!isLogin && password.length > 0 && (
                <div className="space-y-1 pt-1">
                  {passwordRules.map((rule) => {
                    const passes = rule.test(password);
                    return (
                      <div key={rule.label} className="flex items-center gap-1.5">
                        {passes ? <Check className="h-3 w-3 text-primary" /> : <X className="h-3 w-3 text-muted-foreground/30" />}
                        <span className={`text-[10px] ${passes ? 'text-primary' : 'text-muted-foreground/40'}`}>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {!isLogin && (
              <Field label={<>Mobile Number <span className="normal-case text-muted-foreground/40">(optional)</span></>}>
                <Input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 9876543210" className="bg-background border-border h-10 text-[13px]" />
              </Field>
            )}

            <SubmitButton loading={loading} label={isLogin ? 'Sign In' : 'Create Account'} disabled={!isLogin && !allPasswordRulesPass && password.length > 0} />
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { navigate(isLogin ? '/register' : '/login'); setPassword(''); setShowPassword(false); setAuthError(''); }}
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

/* ── Shared sub-components ── */

function Logo() {
  return (
    <div className="text-center space-y-2">
      <h1 className="font-display italic text-3xl font-semibold text-primary tracking-tight">MirrorAI</h1>
      <div className="w-6 h-px bg-primary/30 mx-auto" />
      <p className="text-[9px] text-muted-foreground/50 tracking-[0.2em] uppercase font-medium">Reflections of Your Moments</p>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">{label}</Label>
      {children}
    </div>
  );
}

function SubmitButton({ loading, label, disabled }: { loading: boolean; label: string; disabled?: boolean }) {
  return (
    <Button
      type="submit"
      className="w-full bg-primary hover:bg-primary/85 text-primary-foreground h-10 text-[11px] tracking-[0.12em] uppercase font-medium mt-2 transition-all duration-200"
      disabled={loading || disabled}
    >
      {loading ? 'Please wait…' : label}
    </Button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 px-3 py-2.5 border border-destructive/30 bg-destructive/5 text-[12px] text-destructive leading-relaxed rounded">
      {message}
    </div>
  );
}

export default Auth;
