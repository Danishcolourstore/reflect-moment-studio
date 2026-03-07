import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/OtpInput';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ArrowLeft, Loader2 } from 'lucide-react';

const SESSION_KEY = 'storybook_access_verified';

export function StorybookGate({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (verified) return <>{children}</>;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('send-storybook-otp', {
        body: { email: email.trim().toLowerCase(), action: 'send' },
      });
      if (fnErr) throw fnErr;
      setStep('otp');
    } catch {
      setError('Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setError('');
    setLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('send-storybook-otp', {
        body: { email: email.trim().toLowerCase(), action: 'verify', otp },
      });
      if (fnErr) throw fnErr;
      if (data?.valid) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        sessionStorage.setItem('storybook_email', email.trim().toLowerCase());
        setVerified(true);
      } else {
        setError('Invalid or expired code. Please try again.');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6" style={{ background: '#0B0B0B' }}>
      <div className="w-full max-w-[380px] flex flex-col gap-7">
        {/* Logo */}
        <div className="text-center mb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <BookOpen className="h-5 w-5 text-white/60" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            Storybook Creator
          </h1>
          <p className="mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', fontStyle: 'italic', fontWeight: 300, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
            {step === 'email' ? 'Enter your email to get access' : 'Enter the verification code'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-center"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
            />
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="h-12 rounded-xl font-medium"
              style={{ background: '#D4AF37', color: '#000', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', letterSpacing: '0.05em' }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Access Code'}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-center" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Code sent to {email}
            </p>
            <OtpInput length={6} onComplete={handleVerifyOtp} disabled={loading} />
            <button
              onClick={() => { setStep('email'); setError(''); }}
              className="flex items-center justify-center gap-1.5 mt-2 text-white/30 hover:text-white/60 transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px' }}
            >
              <ArrowLeft className="h-3 w-3" /> Change email
            </button>
          </div>
        )}

        {error && (
          <p className="text-center" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#ef4444' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
