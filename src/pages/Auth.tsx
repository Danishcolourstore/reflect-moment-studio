import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        navigate('/');
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { studio_name: studioName || 'My Studio' },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Check your email', description: 'We sent you a confirmation link.' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-semibold text-gold">MirrorAI</h1>
          <p className="mt-2 text-sm text-muted-foreground tracking-wide">Reflections of Your Moments</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
            {isLogin ? 'Welcome Back' : 'Create Your Studio'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Studio Name</Label>
                <Input
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="Your Studio Name"
                  className="bg-background"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-background"
              />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-gold-hover text-primary-foreground" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gold hover:text-gold-hover transition-colors"
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
