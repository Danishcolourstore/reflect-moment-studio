import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Eye, EyeOff, Check, X } from 'lucide-react';

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
];

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const allPasswordRulesPass = passwordRules.every((r) => r.test(password));

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const errorDescription = hashParams.get('error_description');

    if (errorDescription) {
      setError(errorDescription.replace(/\+/g, ' '));
    } else if (type !== 'recovery') {
      const queryParams = new URLSearchParams(window.location.search);
      const queryError = queryParams.get('error_description');
      if (queryError) {
        setError(queryError.replace(/\+/g, ' '));
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') {
            // Recovery session established
          }
        });
        return () => subscription.unsubscribe();
      }
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allPasswordRulesPass) {
      toast({ title: 'Weak password', description: 'Please meet all password requirements.', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('expired') || msg.includes('invalid')) {
        toast({ title: 'Link expired', description: 'Please request a new password reset link.', variant: 'destructive' });
      } else if (msg.includes('weak') || msg.includes('short')) {
        toast({ title: 'Weak password', description: 'Please choose a stronger password.', variant: 'destructive' });
      } else if (msg.includes('same')) {
        toast({ title: 'Same password', description: 'New password must be different from your current password.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } else {
      setSuccess(true);
      await supabase.auth.signOut();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 pb-safe">
      <div className="w-full max-w-sm space-y-10">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-semibold text-primary tracking-tight">MirrorAI</h1>
          <div className="w-6 h-px bg-primary/30 mx-auto" />
          <p className="text-[9px] text-muted-foreground/50 tracking-[0.2em] uppercase font-medium">
            Reflections of Your Moments
          </p>
        </div>

        <div className="bg-card border border-border p-8">
          {error ? (
            <div className="text-center py-4 space-y-3">
              <p className="font-serif text-lg font-semibold text-foreground">Link Expired</p>
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                This password reset link has expired or is invalid.<br />
                Please request a new one.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="bg-primary hover:bg-primary/85 text-primary-foreground h-10 text-[11px] tracking-[0.12em] uppercase font-medium transition-all duration-200 mt-2"
              >
                Back to Sign In
              </Button>
            </div>
          ) : success ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-fade-in">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <p className="font-serif text-sm text-foreground font-medium">Password successfully reset</p>
              <p className="text-[11px] text-muted-foreground/60">You can now sign in with your new password.</p>
              <Button
                onClick={() => navigate('/login')}
                className="bg-primary hover:bg-primary/85 text-primary-foreground h-10 text-[11px] tracking-[0.12em] uppercase font-medium transition-all duration-200 mt-2"
              >
                Sign In
              </Button>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">Set New Password</h2>
              <p className="text-[11px] text-muted-foreground/60 mb-5 leading-relaxed">
                Choose a new password for your account.
              </p>
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      autoComplete="new-password"
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

                  {password.length > 0 && (
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
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="bg-background border-border h-10 text-[13px]"
                  />
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-[10px] text-destructive/70 flex items-center gap-1">
                      <X className="h-3 w-3" /> Passwords do not match
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/85 text-primary-foreground h-10 text-[11px] tracking-[0.12em] uppercase font-medium transition-all duration-200"
                  disabled={loading || !allPasswordRulesPass || password !== confirmPassword}
                >
                  {loading ? 'Please wait…' : 'Reset Password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
