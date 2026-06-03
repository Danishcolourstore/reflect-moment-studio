import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchFavorites, type FavoriteSubmission } from "@/store/favoritesStore";

export function useFavoritesSubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<FavoriteSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setSubmissions([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rows = await fetchFavorites(user.id);
      setSubmissions(rows);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load favorites submissions.";
      setError(message);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return { submissions, loading, error, reload: load };
}
