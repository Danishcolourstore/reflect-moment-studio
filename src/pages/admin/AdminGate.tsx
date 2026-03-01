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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-6xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground mt-2 text-sm">Page not found</p>
      <form onSubmit={handleSubmit} className="mt-8 w-full max-w-[200px]">
        <Input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="..."
          className="bg-background text-center text-xs border-border/40 focus:border-border"
          autoFocus
        />
      </form>
    </div>
  );
}
