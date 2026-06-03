import { supabase } from "@/integrations/supabase/client";

export interface FavoriteSubmission {
  id: string;
  guestName: string;
  weddingName: string;
  photoCount: number;
  submittedAt: string;
  whatsappNumber?: string | null;
}

function weddingLabel(event: { name?: string | null; hero_couple_name?: string | null } | null | undefined) {
  const couple = event?.hero_couple_name?.trim();
  const name = event?.name?.trim();
  return couple || name || "Untitled event";
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    msg.includes("favorites_submissions") && msg.includes("does not exist")
  );
}

async function fetchFromFavoritesSubmissions(userId: string): Promise<FavoriteSubmission[] | null> {
  const { data, error } = await (supabase
    .from("favorites_submissions" as any)
    .select(
      `
      id,
      guest_name,
      whatsapp_number,
      photo_ids,
      submitted_at,
      events!inner (
        name,
        hero_couple_name,
        user_id
      )
    `,
    )
    .eq("events.user_id", userId)
    .order("submitted_at", { ascending: false }) as any);

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }

  return ((data as any[]) || []).map((row) => {
    const photoIds = Array.isArray(row.photo_ids) ? row.photo_ids : [];
    return {
      id: row.id,
      guestName: row.guest_name?.trim() || "Anonymous",
      weddingName: weddingLabel(row.events),
      photoCount: photoIds.length,
      submittedAt: row.submitted_at,
      whatsappNumber: row.whatsapp_number?.trim() || null,
    };
  });
}

async function fetchFromGuestSelections(userId: string): Promise<FavoriteSubmission[]> {
  const { data, error } = await (supabase
    .from("guest_selections")
    .select(
      `
      id,
      guest_name,
      created_at,
      events!inner (
        name,
        hero_couple_name,
        user_id
      ),
      guest_selection_photos (count)
    `,
    )
    .eq("events.user_id", userId)
    .order("created_at", { ascending: false }) as any);

  if (error) throw error;

  return ((data as any[]) || []).map((row) => ({
    id: row.id,
    guestName: row.guest_name?.trim() || "Anonymous",
    weddingName: weddingLabel(row.events),
    photoCount: row.guest_selection_photos?.[0]?.count ?? 0,
    submittedAt: row.created_at,
    whatsappNumber: null,
  }));
}

export async function fetchFavorites(userId: string): Promise<FavoriteSubmission[]> {
  const fromSubmissions = await fetchFromFavoritesSubmissions(userId);
  const fromSelections = await fetchFromGuestSelections(userId);

  const merged = [...(fromSubmissions ?? []), ...fromSelections];
  merged.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );

  return merged;
}
