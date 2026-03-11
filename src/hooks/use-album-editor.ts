import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FavouritePhoto {
  id: string;
  photo_id: string;
  event_id: string;
  client_token: string;
  url: string;
  created_at: string;
}

// ── For CLIENT: toggle favourite on a photo ──
export function useClientFavourites(
  eventId: string | null,
  clientToken: string | null
) {
  const [favourites, setFavourites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!eventId || !clientToken) return;
    (async () => {
      const { data } = await supabase
        .from("photo_favourites")
        .select("photo_id")
        .eq("event_id", eventId)
        .eq("client_token", clientToken);
      if (data) setFavourites(new Set(data.map((r) => r.photo_id)));
    })();
  }, [eventId, clientToken]);

  const toggleFavourite = useCallback(
    async (photoId: string) => {
      if (!eventId || !clientToken) return;
      const isFav = favourites.has(photoId);

      // Optimistic update
      setFavourites((prev) => {
        const next = new Set(prev);
        isFav ? next.delete(photoId) : next.add(photoId);
        return next;
      });

      if (isFav) {
        await supabase
          .from("photo_favourites")
          .delete()
          .eq("photo_id", photoId)
          .eq("event_id", eventId)
          .eq("client_token", clientToken);
      } else {
        await supabase.from("photo_favourites").insert({
          photo_id: photoId,
          event_id: eventId,
          client_token: clientToken,
        });
      }
    },
    [eventId, clientToken, favourites]
  );

  return { favourites, toggleFavourite };
}

// ── For PHOTOGRAPHER: load all favourites for an event ──
export function useEventFavourites(eventId: string | null) {
  const [favouritePhotos, setFavouritePhotos] = useState<FavouritePhoto[]>([]);
  const [favouriteCount, setFavouriteCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadFavourites = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    const { data } = await supabase
      .from("photo_favourites")
      .select("id, photo_id, event_id, client_token, created_at, photos(url)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (data) {
      const mapped: FavouritePhoto[] = data.map((r: any) => ({
        id: r.id,
        photo_id: r.photo_id,
        event_id: r.event_id,
        client_token: r.client_token,
        url: r.photos?.url || "",
        created_at: r.created_at,
      }));

      // Deduplicate by photo_id
      const seen = new Set<string>();
      const unique = mapped.filter((p) => {
        if (seen.has(p.photo_id)) return false;
        seen.add(p.photo_id);
        return true;
      });

      setFavouritePhotos(unique);
      setFavouriteCount(unique.length);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    loadFavourites();
  }, [loadFavourites]);

  return { favouritePhotos, favouriteCount, loading, reload: loadFavourites };
}