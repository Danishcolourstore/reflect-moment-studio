import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Step = 'upload' | 'processing' | 'results' | 'error';

export const useGuestFinder = (eventId: string, qrAccessId: string) => {
  const [step, setStep] = useState<Step>('upload');
  const [matchedPhotos, setMatchedPhotos] = useState<any[]>([]);

  const submitSelfie = useCallback(async (file: File) => {
    if (!eventId || !qrAccessId) return;
    setStep('processing');
    try {
      const sessionToken = crypto.randomUUID();
      const timestamp = Date.now();
      const fileName = `${eventId}/${sessionToken}/${timestamp}.jpg`;

      // Upload to guest-selfies bucket
      const { error: uploadError } = await supabase.storage
        .from('guest-selfies')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('guest-selfies')
        .getPublicUrl(fileName);

      // Insert selfie record — wait for confirmation before processing
      const { data: selfie, error } = await (supabase
        .from('guest_selfies' as any)
        .insert({
          event_id: eventId,
          qr_access_id: qrAccessId,
          image_url: publicUrl,
        } as any)
        .select()
        .single() as any);
      if (error) throw error;

      // Now invoke face processing
      await supabase.functions.invoke('process-guest-selfie', {
        body: { selfieId: selfie.id, eventId },
      });

      let pollActive = true;
      const poll = setInterval(async () => {
        if (!pollActive) return;
        const { data } = await (supabase
          .from('guest_selfies' as any)
          .select('processing_status, match_results')
          .eq('id', selfie.id)
          .single() as any);
        if (data?.processing_status === 'completed') {
          clearInterval(poll);
          pollActive = false;
          const matchIds: string[] = (data.match_results as string[]) || [];
          if (matchIds.length > 0) {
            const { data: photos } = await supabase
              .from('photos')
              .select('*')
              .in('id', matchIds);
            setMatchedPhotos(photos || []);
          }
          setStep('results');
        } else if (data?.processing_status === 'failed') {
          clearInterval(poll);
          pollActive = false;
          setStep('error');
        }
      }, 1500);

      setTimeout(() => {
        if (pollActive) {
          clearInterval(poll);
          pollActive = false;
          setStep('results');
        }
      }, 30000);
    } catch {
      setStep('error');
    }
  }, [eventId, qrAccessId]);

  return { step, matchedPhotos, submitSelfie };
};
