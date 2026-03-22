import { useState, ReactNode } from 'react';
import { BookOpen } from 'lucide-react';

const SESSION_KEY = 'storybook_access_verified';
const VALID_CODES = ['291219', '141220', '150847', '010120'];

export function StorybookGate({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState('');

  if (verified) return <>{children}</>;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setStep('code');
  };

  const handleCodeSubmit = () => {
    if (VALID_CODES.includes(code)) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      sessionStorage.setItem('storybook_email', email.trim().toLowerCase());
      setVerified(true);
    } else {
      setError('Invalid access code. Please use the code provided by MirrorAI.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6" style={{ background: '#0B0B0B' }}>
      <div className="w-full max-w-[380px] flex flex-col gap-7">
        <div className="text-center mb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <BookOpen className="h-5 w-5 text-white/60" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            Storybook Creator
          </h1>
          <p className="mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', fontStyle: 'italic', fontWeight: 300, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
            {step === 'email' ? 'Enter your email to get access' : 'Enter the Access Code'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="h-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-center outline-none focus:border-[#D4AF37] transition-colors px-4"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
            />
            <button
              type="submit"
              disabled={!email.trim()}
              className="h-12 rounded-xl transition-all duration-200 disabled:opacity-40 hover:brightness-110 active:scale-[0.98]"
              style={{ background: '#D4AF37', color: '#000', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}
            >
              Continue
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div
              className="flex items-center px-4 h-12 rounded-xl transition-all duration-200 focus-within:border-[#D4AF37]"
              style={{ background: '#111111', border: '1px solid #2A2A2A' }}
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                placeholder="Enter code"
                className="bg-transparent w-full outline-none placeholder:text-[rgba(255,255,255,0.2)] text-center"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '18px', color: '#E8E2DA', letterSpacing: '0.35em' }}
              />
            </div>
            <p className="text-center" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Access code provided by Colour Store
            </p>
            <button
              onClick={handleCodeSubmit}
              disabled={code.length < 6}
              className="w-full h-12 rounded-xl transition-all duration-200 disabled:opacity-40 hover:brightness-110 active:scale-[0.98]"
              style={{ background: '#D4AF37', color: '#000', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}
            >
              Verify & Continue
            </button>
          </div>
        )}

        {error && (
          <div className="px-4 py-2.5 rounded-lg" style={{ border: '1px solid rgba(192,97,74,0.25)', background: 'rgba(192,97,74,0.08)', color: '#E57373', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
