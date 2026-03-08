import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_PORTFOLIO_PHOTOS = 20;

export function usePortfolioPhotos(userId: string | undefined) {
  const [portfolioPhotoIds, setPortfolioPhotoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await (supabase.from('studio_profiles').select('portfolio_photo_ids') as any)
        .eq('user_id', userId).maybeSingle();
      if (data?.portfolio_photo_ids) {
        setPortfolioPhotoIds(data.portfolio_photo_ids as string[]);
      }
      setLoading(false);
    })();
  }, [userId]);

  const isPortfolioPhoto = useCallback((photoId: string) => {
    return portfolioPhotoIds.includes(photoId);
  }, [portfolioPhotoIds]);

  const togglePortfolioPhoto = useCallback(async (photoId: string) => {
    if (!userId) return;

    let newIds: string[];
    if (portfolioPhotoIds.includes(photoId)) {
      newIds = portfolioPhotoIds.filter(id => id !== photoId);
    } else {
      if (portfolioPhotoIds.length >= MAX_PORTFOLIO_PHOTOS) {
        toast.error(`Maximum ${MAX_PORTFOLIO_PHOTOS} portfolio images allowed`);
        return;
      }
      newIds = [...portfolioPhotoIds, photoId];
    }

    setPortfolioPhotoIds(newIds);

    const { data: existing } = await (supabase.from('studio_profiles').select('id') as any)
      .eq('user_id', userId).maybeSingle();

    if (existing) {
      await (supabase.from('studio_profiles').update({ portfolio_photo_ids: newIds } as any) as any)
        .eq('user_id', userId);
    } else {
      await (supabase.from('studio_profiles').insert({ user_id: userId, portfolio_photo_ids: newIds } as any) as any);
    }

    if (newIds.includes(photoId)) {
      toast.success(`Added to portfolio (${newIds.length}/${MAX_PORTFOLIO_PHOTOS})`);
    } else {
      toast.success('Removed from portfolio');
    }
  }, [userId, portfolioPhotoIds]);

  return { portfolioPhotoIds, isPortfolioPhoto, togglePortfolioPhoto, loading, count: portfolioPhotoIds.length, max: MAX_PORTFOLIO_PHOTOS };
}
