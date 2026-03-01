import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useEventQR = (eventId: string) => {
  const [loading, setLoading] = useState(false);

  const generateQRToken = useCallback(async (expiresInDays?: number) => {
    setLoading(true);
    try {
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
        : null;
      const { data: qrAccess, error } = await (supabase
        .from('event_qr_access' as any)
        .insert({ event_id: eventId, expires_at: expiresAt } as any)
        .select()
        .single() as any);
      if (error) throw error;
      await (supabase
        .from('events')
        .update({ qr_token: qrAccess.public_token, qr_enabled: true } as any)
        .eq('id', eventId) as any);
      return qrAccess.public_token as string;
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const disableQR = useCallback(async () => {
    await (supabase
      .from('events')
      .update({ qr_enabled: false } as any)
      .eq('id', eventId) as any);
    await (supabase
      .from('event_qr_access' as any)
      .update({ is_active: false } as any)
      .eq('event_id', eventId) as any);
  }, [eventId]);

  return { generateQRToken, disableQR, loading };
};
