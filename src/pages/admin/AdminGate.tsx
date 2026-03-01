import { useState, useEffect, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const HARDCODED_CODE = '291294';

function getAccessCode(): string {
  return localStorage.getItem('mirrorai_admin_code') || HARDCODED_CODE;
}

export default function AdminGate({ children }: { children: ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('mirrorai_admin_session');
    if (session === 'true_admin') setAuthorized(true);
    setChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === getAccessCode()) {
      localStorage.setItem('mirrorai_admin_session', 'true_admin');
      setAuthorized(true);
    } else {
      toast.error('Invalid access code');
      setCode('');
    }
  };

  if (checking) return null;

  if (authorized) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8 text-center space-y-6 shadow-lg">
        <h2 className="font-display text-xl italic text-foreground">MirrorAI</h2>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-1">This area is restricted</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter access code"
            className="bg-background text-center"
            autoFocus
          />
          <Button type="submit" className="w-full">Enter</Button>
        </form>
      </div>
    </div>
  );
}
