import { formatDistanceToNow } from "date-fns";
import { StudioLayout } from "@/components/studio/StudioLayout";
import { PageError, PageSkeleton } from "@/components/PageStates";
import { useFavoritesSubmissions } from "@/hooks/use-favorites-submissions";

function FavoritesEmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        gap: 12,
        padding: "0 16px",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 24,
          fontWeight: 300,
          fontStyle: "italic",
          color: "var(--ink, #1A1917)",
          margin: 0,
        }}
      >
        No favorites yet.
      </h2>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          fontWeight: 300,
          color: "var(--ink-muted, #6E6E6E)",
          maxWidth: 320,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        When guests submit favorites from your gallery,
        <br />
        they will appear here.
      </p>
    </div>
  );
}

function FavoriteCard({
  guestName,
  weddingName,
  photoCount,
  submittedAt,
  whatsappNumber,
}: {
  guestName: string;
  weddingName: string;
  photoCount: number;
  submittedAt: string;
  whatsappNumber?: string | null;
}) {
  const relativeTime = formatDistanceToNow(new Date(submittedAt), { addSuffix: true });

  return (
    <article
      style={{
        border: "1px solid #E8E6E1",
        background: "#FFFFFF",
        padding: "20px 22px",
      }}
    >
      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 22,
          fontWeight: 400,
          color: "#1A1917",
          margin: "0 0 4px",
          lineHeight: 1.2,
        }}
      >
        {guestName}
      </p>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          fontWeight: 400,
          color: "#1A1917",
          margin: "0 0 10px",
        }}
      >
        {weddingName}
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 16px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          fontWeight: 300,
          color: "#6E6E6E",
        }}
      >
        <span>
          {photoCount} {photoCount === 1 ? "photo" : "photos"}
        </span>
        <span>{relativeTime}</span>
        {whatsappNumber ? <span>{whatsappNumber}</span> : null}
      </div>
    </article>
  );
}

export default function Audience() {
  const { submissions, loading, error, reload } = useFavoritesSubmissions();

  return (
    <StudioLayout>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 4px" }}>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(26px, 6vw, 32px)",
            fontWeight: 300,
            color: "#1A1A1A",
            letterSpacing: "0.01em",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Favorites
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 300,
            color: "#6E6E6E",
            marginTop: 8,
            marginBottom: 28,
          }}
        >
          Guest submissions from your galleries
        </p>

        {loading ? (
          <PageSkeleton rows={4} />
        ) : error ? (
          <PageError message={error} onRetry={reload} />
        ) : submissions.length === 0 ? (
          <FavoritesEmptyState />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {submissions.map((submission) => (
              <FavoriteCard key={submission.id} {...submission} />
            ))}
          </div>
        )}
      </div>
    </StudioLayout>
  );
}
