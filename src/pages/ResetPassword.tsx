import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Eye, EyeOff, Check, X } from 'lucide-react';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
];

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const allRulesPass = PASSWORD_RULES.every((r) => r.test(password));

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const errorDesc = hashParams.get('error_description');

    if (errorDesc) {
      setPageError(errorDesc.replace(/\+/g, ' '));
    } else if (type !== 'recovery') {
      const queryError = new URLSearchParams(window.location.search).get('error_description');
      if (queryError) {
        setPageError(queryError.replace(/\+/g, ' '));
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') {
            console.log('[ResetPassword] Recovery session established');
          }
        });
        return () => subscription.unsubscribe();
      }
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesPass) {
      toast({ title: 'Weak password', description: 'Please meet all requirements.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('expired') || msg.includes('invalid')) {
          toast({ title: 'Link expired', description: 'Please request a new reset link.', variant: 'destructive' });
        } else if (msg.includes('same')) {
          toast({ title: 'Same password', description: 'Choose a different password.', variant: 'destructive' });
        } else {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
      } else {
        setSuccess(true);
        toast({ title: 'Password updated', description: 'Redirecting…' });
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch {
      toast({ title: 'Network error', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden w-screen bg-[hsl(20,22%,5%)]">
      {/* Layer 1: Blurred ambient background fill */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(60px) saturate(0.4) brightness(0.3)",
          opacity: 0.6,
          transform: "scale(1.3)",
        }}
      />
      
      {/* Layer 2: Contained photograph */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/images/login-bg.png"
          alt=""
          className="max-h-full max-w-full object-contain"
          style={{ opacity: 0.85 }}
        />
      </div>

      {/* Layer 3: Dark luxury overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(26,20,16,0.30) 0%, rgba(26,20,16,0.40) 40%, rgba(26,20,16,0.65) 100%)",
        }}
      />

      {/* Layer 4: Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 45%, rgba(10,9,8,0.35) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div
          className="w-full max-w-[380px] flex flex-col gap-6 p-9 sm:p-10 animate-[fade-in_1s_ease-out_forwards]"
          style={{
            background: "rgba(44, 33, 24, 0.45)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          {/* Brand */}
          <div className="text-center mb-2">
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontSize: "clamp(2rem, 5vw, 2.8rem)",
                fontWeight: 300,
                color: '#FFFFFF',
                letterSpacing: '0.12em',
                lineHeight: 1,
              }}
            >
              MirrorAI
            </h1>
            <p
              className="mt-3"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontSize: "13px",
                fontStyle: "italic",
                fontWeight: 300,
                color: "rgba(255,255,255,0.55)",
                letterSpacing: "0.1em",
              }}
            >
              Mirror never lies
            </p>
          </div>

          {/* Card content */}
          {pageError ? (
            <div className="text-center py-4 space-y-3">
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 400, color: '#E8E2DA' }}>Link Expired</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: '11px', color: 'rgba(232,226,218,0.4)', lineHeight: '1.6' }}>This reset link has expired or is invalid.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full h-12 rounded-xl transition-all duration-200"
                style={{
                  fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: '10px',
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  background: 'rgba(232,226,218,0.9)', color: '#2C2118', marginTop: '8px',
                }}
              >
                Back to Sign In
              </button>
            </div>
          ) : success ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(232,226,218,0.1)' }}>
                <CheckCircle2 className="h-5 w-5" style={{ color: 'rgba(232,226,218,0.6)' }} />
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 400, color: '#E8E2DA' }}>Password successfully reset</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: '11px', color: 'rgba(232,226,218,0.4)' }}>You can now sign in with your new password.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full h-12 rounded-xl transition-all duration-200"
                style={{
                  fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: '10px',
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  background: 'rgba(232,226,218,0.9)', color: '#2C2118', marginTop: '8px',
                }}
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              <p
                className="text-center"
                style={{
                  fontFamily: "Inter, sans-serif", fontSize: '8px', fontWeight: 400,
                  color: 'rgba(232,226,218,0.35)', letterSpacing: '0.3em', textTransform: 'uppercase',
                }}
              >
                Set New Password
              </p>

              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label style={{ fontFamily: "Inter, sans-serif", fontSize: '8px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(139,115,85,0.6)' }}>New Password</label>
                  <div className="relative">
                    <div
                      className="flex items-center gap-3 px-4 h-12 rounded-xl transition-colors duration-200"
                      style={{ background: 'rgba(26,24,22,0.45)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="bg-transparent w-full outline-none placeholder:text-[rgba(139,115,85,0.3)]"
                        style={{ fontFamily: "Inter, sans-serif", fontWeight: 300, fontSize: '13px', color: '#E8E2DA', letterSpacing: '0.03em' }}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0" tabIndex={-1} style={{ color: 'rgba(139,115,85,0.5)' }}>
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  {password.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {PASSWORD_RULES.map((rule) => {
                        const ok = rule.test(password);
                        return (
                          <div key={rule.label} className="flex items-center gap-1.5">
                            {ok ? <Check className="h-3 w-3" style={{ color: 'rgba(232,226,218,0.5)' }} /> : <X className="h-3 w-3" style={{ color: 'rgba(139,115,85,0.3)' }} />}
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: '10px', color: ok ? 'rgba(232,226,218,0.5)' : 'rgba(139,115,85,0.3)' }}>{rule.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label style={{ fontFamily: "Inter, sans-serif", fontSize: '8px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(139,115,85,0.6)' }}>Confirm Password</label>
                  <div
                    className="flex items-center gap-3 px-4 h-12 rounded-xl transition-colors duration-200"
                    style={{ background: 'rgba(26,24,22,0.45)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="bg-transparent w-full outline-none placeholder:text-[rgba(139,115,85,0.3)]"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 300, fontSize: '13px', color: '#E8E2DA', letterSpacing: '0.03em' }}
                    />
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="flex items-center gap-1" style={{ fontSize: '10px', color: '#E57373' }}><X className="h-3 w-3" /> Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !allRulesPass || password !== confirmPassword}
                  className="w-full h-12 rounded-xl transition-all duration-200 disabled:opacity-50"
                  style={{
                    fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: '10px',
                    letterSpacing: '0.22em', textTransform: 'uppercase',
                    background: 'rgba(232,226,218,0.9)', color: '#2C2118',
                  }}
                >
                  {loading ? 'Please wait…' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p
          className="mt-14 animate-[fade-in_1.2s_ease-out_0.8s_forwards] opacity-0"
          style={{
            fontFamily: "Inter, sans-serif", fontSize: '7px', letterSpacing: '0.45em',
            textTransform: 'uppercase', color: 'rgba(232,226,218,0.08)',
          }}
        >
          Private Photography Platform
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
