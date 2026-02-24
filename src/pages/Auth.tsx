import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';

type AuthView = 'landing' | 'login' | 'signup' | 'forgot';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
];

interface AuthProps {
  initialView?: AuthView;
}

const Auth = ({ initialView }: AuthProps) => {
  const [view] = useState<AuthView>(initialView || 'landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const allRulesPass = PASSWORD_RULES.every((r) => r.test(password));

  const clearError = () => setFormError('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setFormError('');
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setFormError('Sign-in timed out. Please try again.');
    }, 10000);
    try {
      setLoading(false); // Reset before redirect to prevent stuck state
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      clearTimeout(timeoutId);
      if (error) {
        setFormError('Google sign-in failed. Please try again.');
      }
    } catch {
      clearTimeout(timeoutId);
      setFormError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /** After successful auth, redirect based on role */
  const redirectAfterAuth = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin');
        if (roles && roles.length > 0) {
          navigate('/admin');
          return;
        }
      }
    } catch (e) {
      console.error('[Auth] Role check failed:', e);
    }
    const saved = sessionStorage.getItem('redirectAfterLogin');
    sessionStorage.removeItem('redirectAfterLogin');
    navigate(saved?.startsWith('/dashboard') ? saved : '/dashboard');
  }, [navigate]);

  /** Friendly error message from Supabase error */
  const friendlyError = (raw: string): string => {
    const msg = raw.toLowerCase();
    if (msg.includes('invalid login') || msg.includes('invalid_credentials'))
      return 'Incorrect email or password. Please try again.';
    if (msg.includes('email not confirmed'))
      return 'Please verify your email address before signing in.';
    if (msg.includes('user not found'))
      return 'No account found with this email.';
    if (msg.includes('already registered') || msg.includes('already been registered'))
      return 'An account with this email already exists. Please sign in.';
    if (msg.includes('valid email'))
      return 'Please enter a valid email address.';
    if (msg.includes('weak') || msg.includes('password'))
      return 'Password does not meet the requirements.';
    return raw;
  };

  /* ═══════════ HANDLERS ═══════════ */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setFormError('Login timed out. Please check your connection and try again.');
    }, 10000);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      clearTimeout(timeoutId);
      console.log('[Auth] Login result:', { session: !!data?.session, error: error?.message });
      if (error) {
        setFormError(friendlyError(error.message));
      } else if (data?.session) {
        await redirectAfterAuth();
        return;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('[Auth] Login catch:', err);
      setFormError('Network error — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesPass) {
      setFormError('Please meet all password requirements.');
      return;
    }
    setLoading(true);
    setFormError('');
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setFormError('Signup timed out. Please check your connection and try again.');
    }, 10000);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { studio_name: studioName || 'My Studio', full_name: fullName || '' } },
      });
      clearTimeout(timeoutId);
      console.log('[Auth] Signup result:', { user: !!data?.user, session: !!data?.session, error: error?.message });
      if (error) {
        setFormError(friendlyError(error.message));
      } else if (data?.user?.identities?.length === 0) {
        setFormError('An account with this email already exists.');
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
      clearTimeout(timeoutId);
      console.error('[Auth] Signup catch:', err);
      setFormError('Network error — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setFormError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setFormError(error.message);
      else setResetSent(true);
    } catch {
      setFormError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ═══════════ VIEWS ═══════════ */

  // Landing
  if (view === 'landing') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-xs text-center space-y-14">
          <div className="space-y-3">
            <h1 className="font-display italic text-5xl font-semibold text-primary tracking-tight leading-none">MirrorAI</h1>
            <div className="w-8 h-px bg-primary/30 mx-auto" />
            <p className="text-[10px] text-muted-foreground/50 tracking-[0.25em] uppercase font-medium">Reflections of Your Moments</p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => navigate('/login')} className="w-full bg-primary hover:bg-primary/85 text-primary-foreground h-11 text-[11px] tracking-[0.14em] uppercase font-medium">Sign In</Button>
            <Button onClick={() => navigate('/register')} variant="outline" className="w-full border-border hover:bg-muted/50 text-foreground h-11 text-[11px] tracking-[0.14em] uppercase font-medium">Create Account</Button>
          </div>
          <p className="text-[9px] text-muted-foreground/30 tracking-[0.08em] uppercase">Gallery delivery for photographers</p>
        </div>
      </div>
    );
  }

  // Forgot password
  if (view === 'forgot') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-10">
          <BrandHeader />
          <div className="bg-card border border-border p-8">
            <BackTitle onBack={() => navigate('/login')} title="Reset Password" />
            {resetSent ? (
              <div className="text-center py-4 space-y-3">
                <p className="font-display text-sm text-foreground font-medium">Check your email</p>
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                  We sent a reset link to <span className="text-foreground/80 font-medium">{email}</span>
                </p>
                <button onClick={() => navigate('/login')} className="text-[11px] text-primary hover:text-primary/80 transition-colors mt-2">Back to Sign In</button>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-muted-foreground/60 mb-4 leading-relaxed">Enter your email and we'll send you a reset link.</p>
                {formError && <InlineError message={formError} />}
                <form onSubmit={handleForgot} className="space-y-4">
                  <FormField label="Email">
                    <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} placeholder="you@example.com" required autoComplete="email" className="bg-background border-border h-10 text-[13px]" />
                  </FormField>
                  <ActionButton loading={loading} label="Send Reset Link" />
                </form>
                <p className="mt-6 text-center"><button onClick={() => navigate('/login')} className="text-[11px] text-primary hover:text-primary/80 transition-colors">Back to Sign In</button></p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Login / Signup
  const isLogin = view === 'login';

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 pb-safe">
      <div className="w-full max-w-sm space-y-10">
        <BrandHeader />
        <div className="bg-card border border-border p-8">
          <BackTitle onBack={() => navigate('/')} title={isLogin ? 'Sign In' : 'Create Your Studio'} />

          {formError && <InlineError message={formError} />}

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <>
                <FormField label="Full Name">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your Name" className="bg-background border-border h-10 text-[13px]" />
                </FormField>
                <FormField label="Studio Name">
                  <Input value={studioName} onChange={(e) => setStudioName(e.target.value)} placeholder="Your Studio Name" className="bg-background border-border h-10 text-[13px]" />
                </FormField>
              </>
            )}

            <FormField label="Email">
              <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} placeholder="you@example.com" required autoComplete="email" className="bg-background border-border h-10 text-[13px]" />
            </FormField>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
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
                  <button type="button" onClick={() => navigate('/forgot-password')} className="text-[10px] text-muted-foreground/50 hover:text-primary transition-colors">Forgot password?</button>
                </div>
              )}

              {!isLogin && password.length > 0 && (
                <div className="space-y-1 pt-1">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password);
                    return (
                      <div key={rule.label} className="flex items-center gap-1.5">
                        {ok ? <Check className="h-3 w-3 text-primary" /> : <X className="h-3 w-3 text-muted-foreground/30" />}
                        <span className={`text-[10px] ${ok ? 'text-primary' : 'text-muted-foreground/40'}`}>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {!isLogin && (
              <FormField label={<>Mobile <span className="normal-case text-muted-foreground/40">(optional)</span></>}>
                <Input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 9876543210" className="bg-background border-border h-10 text-[13px]" />
              </FormField>
            )}

            <ActionButton loading={loading} label={isLogin ? 'Sign In' : 'Create Account'} disabled={!isLogin && !allRulesPass && password.length > 0} />
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.1em]">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-border hover:bg-muted/50 h-10 text-[11px] tracking-[0.08em] font-medium gap-2"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>



          <p className="mt-5 text-center">
            <button
              onClick={() => { navigate(isLogin ? '/register' : '/login'); setPassword(''); setShowPassword(false); clearError(); }}
              className="text-[11px] text-primary hover:text-primary/80 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

/* ═══════════ SHARED SUB-COMPONENTS ═══════════ */

function BrandHeader() {
  return (
    <div className="text-center space-y-2">
      <h1 className="font-display italic text-3xl font-semibold text-primary tracking-tight">MirrorAI</h1>
      <div className="w-6 h-px bg-primary/30 mx-auto" />
      <p className="text-[9px] text-muted-foreground/50 tracking-[0.2em] uppercase font-medium">Reflections of Your Moments</p>
    </div>
  );
}

function BackTitle({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-6">
      <button onClick={onBack} className="text-muted-foreground/40 hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
      </button>
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function FormField({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">{label}</Label>
      {children}
    </div>
  );
}

function ActionButton({ loading, label, disabled }: { loading: boolean; label: string; disabled?: boolean }) {
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

function InlineError({ message }: { message: string }) {
  return (
    <div className="mb-4 px-3 py-2.5 border border-destructive/30 bg-destructive/5 text-[12px] text-destructive leading-relaxed rounded">
      {message}
    </div>
  );
}

export default Auth;
