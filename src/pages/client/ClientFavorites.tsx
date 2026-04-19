import { useEffect, useState } from 'react';
import { Heart, Camera } from 'lucide-react';
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

const ClientFavorites = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: client } = await (supabase.from('clients').select('id') as any).eq('user_id', user.id).maybeSingle();
      if (!client) { setLoading(false); return; }
      setClientId(client.id);

      const { data: favs } = await (supabase.from('client_favorites').select('id, photo_id, created_at') as any)
        .eq('client_id', client.id).order('created_at', { ascending: false });
      if (favs && favs.length > 0) {
        const photoIds = favs.map((f: any) => f.photo_id);
        const { data: ph } = await (supabase.from('photos').select('id, url, file_name, event_id') as any).in('id', photoIds);
        if (ph) setPhotos(ph);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const removeFavorite = async (photoId: string) => {
    if (!clientId) return;
    await (supabase.from('client_favorites').delete() as any).eq('client_id', clientId).eq('photo_id', photoId);
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  return (
    <ClientDashboardLayout>
      <h1 className="font-serif text-2xl font-semibold text-foreground mb-6">Favorites</h1>

      {loading ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="py-24 text-center">
          <h2 className="font-serif text-[28px] font-light text-foreground leading-tight">No favorites.</h2>
        </div>
      ) : (
        <>
          <p className="text-[11px] text-muted-foreground mb-4">{photos.length} photos favorited</p>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group break-inside-avoid">
                <img src={photo.url} alt={photo.file_name || ''} className="w-full rounded-lg" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
                  <Button size="icon" variant="ghost" className="h-8 w-8 bg-card/90 backdrop-blur-sm hover:bg-card"
                    onClick={() => removeFavorite(photo.id)}>
                    <Heart className="h-4 w-4 fill-destructive text-destructive" />
                  </Button>
                </div>
                <div className="absolute top-2 right-2">
                  <Heart className="h-4 w-4 fill-destructive text-destructive" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </ClientDashboardLayout>
  );
};

export default ClientFavorites;
