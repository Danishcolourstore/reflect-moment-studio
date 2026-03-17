import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image, Star, Trash2, ArrowUp, ArrowDown, Sparkles, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface PortfolioPhoto {
  id: string;
  original_url: string;
  thumbnail_url: string | null;
  is_hero?: boolean;
  sort_order: number;
}

export function PortfolioManager() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPhotos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('photos')
      .select('id, original_url, thumbnail_url, sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .limit(50);
    setPhotos((data || []).map((p: any, i: number) => ({ ...p, is_hero: i === 0, sort_order: p.sort_order ?? i })));
    setLoading(false);
  }, [user]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const setHero = (id: string) => {
    setPhotos(prev => {
      const target = prev.find(p => p.id === id);
      if (!target) return prev;
      return [{ ...target, is_hero: true, sort_order: 0 }, ...prev.filter(p => p.id !== id).map((p, i) => ({ ...p, is_hero: false, sort_order: i + 1 }))];
    });
    toast.success('Hero image updated');
  };

  const movePhoto = (id: string, dir: 'up' | 'down') => {
    setPhotos(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx < 0) return prev;
      const newIdx = dir === 'up' ? Math.max(0, idx - 1) : Math.min(prev.length - 1, idx + 1);
      if (newIdx === idx) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr.map((p, i) => ({ ...p, sort_order: i, is_hero: i === 0 }));
    });
  };

  const deletePhoto = async (id: string) => {
    await supabase.from('photos').delete().eq('id', id);
    setPhotos(prev => prev.filter(p => p.id !== id));
    toast.success('Photo removed');
  };

  // AI insights (simulated)
  const getInsight = (idx: number) => {
    if (idx === 0) return { text: 'Hero image — gets 3× more saves', type: 'positive' as const };
    if (idx > photos.length - 3 && photos.length > 5) return { text: 'Low-performing — consider replacing', type: 'warning' as const };
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{photos.length} photos in portfolio</p>
        <Button size="sm" variant="outline">
          <Upload className="h-4 w-4 mr-1" /> Upload
        </Button>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <Image className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <p className="mt-3 font-serif text-lg text-foreground">No portfolio images</p>
          <p className="text-sm text-muted-foreground">Upload your best work to attract clients</p>
        </div>
      ) : (
        <div className="space-y-2">
          {photos.map((photo, idx) => {
            const insight = getInsight(idx);
            return (
              <div key={photo.id} className={`bg-card border rounded-xl p-3 flex items-center gap-3 ${photo.is_hero ? 'border-primary/30' : 'border-border'}`}>
                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                  <img
                    src={photo.thumbnail_url || photo.original_url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {photo.is_hero && (
                    <div className="absolute top-0.5 left-0.5">
                      <Badge className="text-[8px] px-1 py-0 bg-primary text-primary-foreground">HERO</Badge>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">#{idx + 1}</p>
                  {insight && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Sparkles className={`h-3 w-3 ${insight.type === 'positive' ? 'text-primary' : 'text-yellow-500'}`} />
                      <p className={`text-[10px] ${insight.type === 'positive' ? 'text-primary' : 'text-yellow-500'}`}>{insight.text}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {!photo.is_hero && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setHero(photo.id)}>
                      <Star className="h-3.5 w-3.5 text-primary" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => movePhoto(photo.id, 'up')} disabled={idx === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => movePhoto(photo.id, 'down')} disabled={idx === photos.length - 1}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deletePhoto(photo.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
