import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
    if (!allRulesPass) { toast({ title: 'Weak password', description: 'Please meet all requirements.', variant: 'destructive' }); return; }
    if (password !== confirmPassword) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('expired') || msg.includes('invalid')) toast({ title: 'Link expired', description: 'Please request a new reset link.', variant: 'destructive' });
        else if (msg.includes('same')) toast({ title: 'Same password', description: 'Choose a different password.', variant: 'destructive' });
        else toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setSuccess(true);
        toast({ title: 'Password updated', description: 'Redirecting…' });
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch { toast({ title: 'Network error', description: 'Please try again.', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-[400px] flex flex-col">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-semibold text-foreground tracking-tight">Mirror AI</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Set your new password</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-8 shadow-sm space-y-6">
          {pageError ? (
            <div className="text-center py-4 space-y-4">
              <p className="text-base font-medium text-foreground">Link Expired</p>
              <p className="text-sm text-muted-foreground">This reset link has expired or is invalid.</p>
              <button onClick={() => navigate('/login')}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
                Back to Sign In
              </button>
            </div>
          ) : success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-5 w-5 text-foreground" />
              </div>
              <p className="text-base font-medium text-foreground">Password updated</p>
              <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
              <button onClick={() => navigate('/login')}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
                Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <div className="flex items-center gap-3 px-4 h-11 rounded-lg border border-border bg-background transition-all focus-within:ring-2 focus-within:ring-ring">
                  <input
                    type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required minLength={8} autoComplete="new-password"
                    className="bg-transparent w-full outline-none text-sm text-foreground placeholder:text-muted-foreground/40"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <div key={rule.label} className="flex items-center gap-1.5">
                          {ok ? <Check className="h-3 w-3 text-foreground/50" /> : <X className="h-3 w-3 text-muted-foreground/40" />}
                          <span className={`text-xs ${ok ? 'text-foreground/50' : 'text-muted-foreground/40'}`}>{rule.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <div className="flex items-center gap-3 px-4 h-11 rounded-lg border border-border bg-background transition-all focus-within:ring-2 focus-within:ring-ring">
                  <input
                    type={showPassword ? 'text' : 'password'} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" required minLength={8} autoComplete="new-password"
                    className="bg-transparent w-full outline-none text-sm text-foreground placeholder:text-muted-foreground/40"
                  />
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="flex items-center gap-1 text-xs text-destructive"><X className="h-3 w-3" /> Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !allRulesPass || password !== confirmPassword}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Please wait…' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
