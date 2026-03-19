import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { OtpInput } from '@/components/OtpInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KeyRound, CheckCircle } from 'lucide-react';

export default function AdminPinReset() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [newPin, setNewPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground">Invalid or missing reset token.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!newPin || newPin.length !== 6) return;
    setSubmitting(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-pin-reset', {
        body: { action: 'reset_pin', token, new_pin: newPin },
      });

      if (fnError) throw fnError;
      if (data?.success) {
        setSuccess(true);
        localStorage.removeItem('mirrorai_admin_pin_attempts');
        setTimeout(() => navigate('/admin'), 2000);
      } else {
        setError(data?.error || 'Reset failed. Token may be expired.');
      }
    } catch (err) {
      console.error('PIN reset failed:', err);
      setError('Reset failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 text-center space-y-4">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
            <p className="text-foreground font-medium">PIN updated successfully</p>
            <p className="text-sm text-muted-foreground">Redirecting to admin...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-border/20">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">Set New Admin PIN</CardTitle>
          <CardDescription>Enter a new 6-digit PIN</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <OtpInput
            length={6}
            onComplete={(pin) => setNewPin(pin)}
            disabled={submitting}
          />
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || newPin.length !== 6}
          >
            {submitting ? 'Updating...' : 'Update PIN'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
