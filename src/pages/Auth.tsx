import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye, EyeOff, Check, X, Phone, Mail } from 'lucide-react';
import { OtpInput } from '@/components/OtpInput';

type AuthView = 'landing' | 'login' | 'signup' | 'forgot';
type LoginMethod = 'email' | 'mobile';

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
];

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+61', label: '🇦🇺 +61' },
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+81', label: '🇯🇵 +81' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+86', label: '🇨🇳 +86' },
];

interface AuthProps {
  initialView?: AuthView;
}

const Auth = ({ initialView }: AuthProps) => {
  const [view, setView] = useState<AuthView>(initialView || 'landing');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const allPasswordRulesPass = passwordRules.every((r) => r.test(password));

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const redirectAfterAuth = useCallback(async () => {
    try {
      // Check if user has admin role
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .eq('role', 'admin');

        if (!rolesError && roles && roles.length > 0) {
          sessionStorage.removeItem('redirectAfterLogin');
          navigate('/admin');
          return;
        }
      }

      const redirect = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      if (redirect && redirect.startsWith('/dashboard')) {
        navigate(redirect);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Unexpected redirect error:', error);
      sessionStorage.removeItem('redirectAfterLogin');
      navigate('/dashboard');
    }
  }, [navigate]);

  /* ── Phone OTP: Send code ── */
  const sendOtp = async () => {
    const fullPhone = `${countryCode}${phoneNumber}`;
    if (phoneNumber.length < 7) {
      toast({ title: 'Invalid number', description: 'Please enter a valid phone number.', variant: 'destructive' });
      return;
    }

    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) {
        toast({ title: 'Failed to send OTP', description: error.message, variant: 'destructive' });
      } else {
        setOtpSent(true);
        setResendTimer(30);
        toast({ title: 'OTP sent', description: `Verification code sent to ${fullPhone}` });
      }
    } catch (error) {
      console.error('Unexpected OTP send error:', error);
      toast({ title: 'Failed to send OTP', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setOtpLoading(false);
    }
  };

  /* ── Phone OTP: Verify code ── */
  const verifyOtp = async (otpCode: string) => {
    const fullPhone = `${countryCode}${phoneNumber}`;
    setOtpLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otpCode, type: 'sms' });
      if (error) {
        toast({ title: 'Verification failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Signed in successfully' });
        await redirectAfterAuth();
      }
    } catch (error) {
      console.error('Unexpected OTP verification error:', error);
      toast({ title: 'Verification failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setOtpLoading(false);
    }
  };

  /* ── Email/password submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Track whether we already showed an error (prevents double-toast from timeout race)
    let handled = false;

    // Safety timeout — if auth takes too long, reset and show error
    const timeout = setTimeout(() => {
      if (!handled) {
        handled = true;
        setLoading(false);
        toast({ title: 'Login timed out', description: 'The request is taking too long. Please check your connection and try again.', variant: 'destructive' });
      }
    }, 8000);

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (handled) return; // timeout already fired
        if (error) {
          let msg = error.message;
          if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid_credentials')) {
            msg = 'Incorrect email or password. Please try again.';
          } else if (msg.toLowerCase().includes('email not confirmed')) {
            msg = 'Please verify your email address before signing in.';
          } else if (msg.toLowerCase().includes('user not found')) {
            msg = 'No account found with this email. Please sign up first.';
          } else if (msg.toLowerCase().includes('valid email')) {
            msg = 'Please enter a valid email address.';
          }
          toast({ title: 'Sign in failed', description: msg, variant: 'destructive' });
        } else {
          await redirectAfterAuth();
        }
      } else {
        if (!allPasswordRulesPass) {
          toast({ title: 'Weak password', description: 'Please meet all password requirements.', variant: 'destructive' });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { studio_name: studioName || 'My Studio', full_name: fullName || '' },
          },
        });

        if (handled) return; // timeout already fired
        if (error) {
          let msg = error.message;
          if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
            msg = 'An account with this email already exists. Please sign in instead.';
          } else if (msg.toLowerCase().includes('valid email')) {
            msg = 'Please enter a valid email address.';
          } else if (msg.toLowerCase().includes('password')) {
            msg = 'Password does not meet the requirements.';
          }
          toast({ title: 'Signup failed', description: msg, variant: 'destructive' });
        } else if (data?.user?.identities?.length === 0) {
          toast({ title: 'Account exists', description: 'An account with this email already exists. Please sign in.', variant: 'destructive' });
        } else if (data?.session) {
          if (mobile && data.user) {
            await (supabase.from('profiles').update({ mobile } as any) as any).eq('user_id', data.user.id);
          }
          toast({ title: 'Welcome to MirrorAI', description: 'Your studio has been created.' });
          navigate('/dashboard');
        } else {
          toast({ title: 'Check your email', description: 'We sent you a confirmation link to verify your address.' });
        }
      }
    } catch (error: any) {
      if (handled) return; // timeout already fired
      handled = true;
      console.error('Unexpected auth submit error:', error);
      const isNetwork = error?.message?.toLowerCase()?.includes('failed to fetch') || error?.message?.toLowerCase()?.includes('networkerror');
      toast({
        title: isNetwork ? 'Network error' : 'Authentication failed',
        description: isNetwork
          ? 'Could not reach the server. Please check your internet connection and try again.'
          : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setResetSent(true);
      }
    } catch (error) {
      console.error('Unexpected forgot password error:', error);
      toast({ title: 'Error', description: 'Unable to send reset link. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Landing Screen ── */
  if (view === 'landing') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-xs text-center space-y-14">
          <div className="space-y-3">
            <h1 className="font-serif text-5xl font-semibold text-primary tracking-tight leading-none">
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
              className="w-full bg-primary hover:bg-primary/85 text-primary-foreground h-11 text-[11px] tracking-[0.14em] uppercase font-medium transition-all duration-200"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/register')}
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

  /* ── Forgot Password Screen ── */
  if (view === 'forgot') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-10">
          <div className="text-center space-y-2">
            <h1 className="font-serif text-3xl font-semibold text-primary tracking-tight">MirrorAI</h1>
            <div className="w-6 h-px bg-primary/30 mx-auto" />
            <p className="text-[9px] text-muted-foreground/50 tracking-[0.2em] uppercase font-medium">
              Reflections of Your Moments
            </p>
          </div>

          <div className="bg-card border border-border p-8">
            <div className="flex items-center gap-2.5 mb-6">
              <button
                onClick={() => navigate('/login')}
                className="text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="font-serif text-xl font-semibold text-foreground">Reset Password</h2>
            </div>

            {resetSent ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-serif text-sm text-foreground font-medium">Check your email</p>
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                  We sent a password reset link to<br />
                  <span className="text-foreground/80 font-medium">{email}</span>
                </p>
                <button
                  onClick={() => { navigate('/login'); setResetSent(false); }}
                  className="text-[11px] text-primary hover:text-primary/80 transition-colors mt-2"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-muted-foreground/60 mb-4 leading-relaxed">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
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
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/85 text-primary-foreground h-10 text-[11px] tracking-[0.12em] uppercase font-medium transition-all duration-200"
                    disabled={loading}
                  >
                    {loading ? 'Please wait…' : 'Send Reset Link'}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-[11px] text-primary hover:text-primary/80 transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Login / Signup Form ── */
  const isLogin = view === 'login';

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 pb-safe">
      <div className="w-full max-w-sm space-y-10">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-semibold text-primary tracking-tight">MirrorAI</h1>
          <div className="w-6 h-px bg-primary/30 mx-auto" />
          <p className="text-[9px] text-muted-foreground/50 tracking-[0.2em] uppercase font-medium">
            Reflections of Your Moments
          </p>
        </div>

        <div className="bg-card border border-border p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <button
              onClick={() => navigate('/login')}
              className="text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              {isLogin ? 'Sign In' : 'Create Your Studio'}
            </h2>
          </div>

          {/* Login method toggle — only on login view */}
          {isLogin && (
            <div className="flex items-center border border-border mb-6">
              <button
                type="button"
                onClick={() => { setLoginMethod('email'); setOtpSent(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] uppercase tracking-[0.1em] font-medium transition-colors ${
                  loginMethod === 'email'
                    ? 'bg-foreground/5 text-foreground'
                    : 'text-muted-foreground/50 hover:text-foreground'
                }`}
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('mobile'); setOtpSent(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] uppercase tracking-[0.1em] font-medium transition-colors ${
                  loginMethod === 'mobile'
                    ? 'bg-foreground/5 text-foreground'
                    : 'text-muted-foreground/50 hover:text-foreground'
                }`}
              >
                <Phone className="h-3.5 w-3.5" /> Mobile
              </button>
            </div>
          )}

          {/* ── Mobile OTP Login ── */}
          {isLogin && loginMethod === 'mobile' ? (
            <div className="space-y-4">
              {!otpSent ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">
                      Phone Number
                    </Label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="bg-background border border-border h-10 px-2 text-[13px] text-foreground"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="bg-background border-border h-10 text-[13px] flex-1"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={sendOtp}
                    className="w-full bg-primary hover:bg-primary/85 text-primary-foreground h-10 text-[11px] tracking-[0.12em] uppercase font-medium transition-all duration-200"
                    disabled={otpLoading || phoneNumber.length < 7}
                  >
                    {otpLoading ? 'Sending…' : 'Send OTP'}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
                    Enter the 6-digit code sent to<br />
                    <span className="text-foreground/80 font-medium">{countryCode}{phoneNumber}</span>
                  </p>
                  <OtpInput onComplete={verifyOtp} disabled={otpLoading} />
                  {otpLoading && (
                    <p className="text-[10px] text-muted-foreground/50 text-center">Verifying…</p>
                  )}
                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-[10px] text-muted-foreground/40">
                        Resend code in <span className="text-foreground/60 font-medium">{resendTimer}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={otpLoading}
                        className="text-[11px] text-primary hover:text-primary/80 transition-colors"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors text-center"
                  >
                    ← Change phone number
                  </button>
                </>
              )}
            </div>
          ) : (
            /* ── Email Login / Signup Form ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">
                      Full Name
                    </Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your Name"
                      className="bg-background border-border h-10 text-[13px]"
                    />
                  </div>
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
                </>
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
                  autoComplete="email"
                  className="bg-background border-border h-10 text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={isLogin ? 6 : 8}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    className="bg-background border-border h-10 text-[13px] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => { navigate('/forgot-password'); setResetSent(false); }}
                      className="text-[10px] text-muted-foreground/50 hover:text-primary transition-colors"
                    >
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
                          {passes ? (
                            <Check className="h-3 w-3 text-primary" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground/30" />
                          )}
                          <span className={`text-[10px] ${passes ? 'text-primary' : 'text-muted-foreground/40'}`}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile number — signup only */}
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">
                    Mobile Number <span className="normal-case text-muted-foreground/40">(optional)</span>
                  </Label>
                  <Input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 9876543210"
                    className="bg-background border-border h-10 text-[13px]"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/85 text-primary-foreground h-10 text-[11px] tracking-[0.12em] uppercase font-medium mt-2 transition-all duration-200"
                disabled={loading || (!isLogin && !allPasswordRulesPass && password.length > 0)}
              >
                {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => { navigate(isLogin ? '/register' : '/login'); setPassword(''); setShowPassword(false); setOtpSent(false); setLoginMethod('email'); }}
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
