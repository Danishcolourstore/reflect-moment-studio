import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const GUEST_SESSION_KEY = 'mirrorai_guest_session_id';

export function useGuestSession(eventId: string | undefined) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const init = async () => {
      // Check localStorage for existing guest session id
      let guestId = localStorage.getItem(GUEST_SESSION_KEY);
      
      if (!guestId) {
        guestId = crypto.randomUUID();
        localStorage.setItem(GUEST_SESSION_KEY, guestId);
      }

      const tokenKey = `session_token_${eventId}`;
      const idKey = `session_id_${eventId}`;

      const existingToken = localStorage.getItem(tokenKey);
      const existingId = localStorage.getItem(idKey);

      if (existingToken && existingId) {
        setSessionId(existingId);
        // Update last_seen_at
        await (supabase.from('guest_sessions' as any).update({ last_seen_at: new Date().toISOString() } as any) as any).eq('id', existingId);
        setReady(true);
        return;
      }

      // Generate new session
      const token = crypto.randomUUID();
      const { data, error } = await (supabase.from('guest_sessions' as any).insert({
        event_id: eventId,
        session_token: token,
      } as any).select('id').single() as any);

      if (!error && data) {
        localStorage.setItem(tokenKey, token);
        localStorage.setItem(idKey, data.id);
        setSessionId(data.id);
      }
      setReady(true);
    };

    init();
  }, [eventId]);

  return { sessionId, ready };
}
