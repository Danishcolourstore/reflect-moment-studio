import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { OtpInput } from '@/components/OtpInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, ShieldAlert } from 'lucide-react';

const SESSION_KEY = 'mirrorai_admin_pin_session';
const ATTEMPTS_KEY = 'mirrorai_admin_pin_attempts';
const MAX_ATTEMPTS = 3;

export default function AdminPinGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'pin' | 'verified' | 'locked'>('checking');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [lockMessage, setLockMessage] = useState('');

  useEffect(() => {
    // Check if already verified this session
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session === 'verified') {
      setStatus('verified');
      return;
    }

    // Check stored attempts
    const stored = localStorage.getItem(ATTEMPTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.count >= MAX_ATTEMPTS) {
        setStatus('locked');
        setAttempts(parsed.count);
        return;
      }
      setAttempts(parsed.count);
    }

    setStatus('pin');
  }, []);

  const handlePinComplete = useCallback(async (pin: string) => {
    if (verifying || status === 'locked') return;
    setVerifying(true);
    setError('');

    try {
      const { data, error: rpcError } = await (supabase.rpc as any)('verify_admin_pin', { pin_input: pin });

      if (rpcError) throw rpcError;

      if (data?.valid) {
        sessionStorage.setItem(SESSION_KEY, 'verified');
        localStorage.removeItem(ATTEMPTS_KEY);
        setStatus('verified');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem(ATTEMPTS_KEY, JSON.stringify({ count: newAttempts, at: Date.now() }));
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setStatus('locked');
          setLockMessage('Access locked. Reset email sent to admin.');
          // Trigger reset email
          try {
            await supabase.functions.invoke('admin-pin-reset', {
              body: { action: 'request_reset' },
            });
          } catch (e) {
            console.error('Failed to send reset email:', e);
          }
        } else {
          setError(`Incorrect code. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`);
        }
      }
    } catch (e) {
      setError('Verification failed. Try again.');
    } finally {
      setVerifying(false);
    }
  }, [attempts, verifying, status]);

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (status === 'verified') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-border/20 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
            {status === 'locked' ? (
              <ShieldAlert className="w-5 h-5 text-destructive" />
            ) : (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-lg">
            {status === 'locked' ? 'Access Locked' : 'Enter Admin Access Code'}
          </CardTitle>
          {status === 'locked' ? (
            <CardDescription>
              {lockMessage || 'Too many incorrect attempts. A reset link has been sent to the admin email.'}
            </CardDescription>
          ) : (
            <CardDescription>Enter your 6-digit PIN to continue</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {status !== 'locked' && (
            <>
              <OtpInput
                length={6}
                onComplete={handlePinComplete}
                disabled={verifying}
              />
              {error && (
                <p className="text-center text-sm text-destructive animate-in fade-in duration-300">
                  {error}
                </p>
              )}
              {verifying && (
                <p className="text-center text-xs text-muted-foreground">Verifying...</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
