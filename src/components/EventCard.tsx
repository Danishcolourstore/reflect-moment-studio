import { Image, Share2, Pencil, Trash2, Heart, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface EventCardProps {
  id: string;
  name: string;
  slug: string;
  date: string;
  photoCount: number;
  coverUrl: string | null;
  favCount?: number;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export function EventCard({ name, slug, date, photoCount, coverUrl, favCount, onShare, onEdit, onDelete, onClick }: EventCardProps) {
  const { toast } = useToast();

  const copyGalleryLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/event/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: 'Copied!', description: 'Gallery link copied to clipboard.' });
    });
  };

  return (
    <div className="group cursor-pointer animate-fade-in" onClick={onClick}>
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform [transition-duration:800ms] ease-out group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image className="h-8 w-8 text-muted-foreground/15" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              style={{ border: "1px solid rgba(250,250,248,0.3)", background: "rgba(14,13,11,0.7)", color: "#FAFAF8", fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <Share2 style={{ width: 10, height: 10 }} />Share
            </button>
            <button
              onClick={copyGalleryLink}
              style={{ border: "1px solid rgba(250,250,248,0.3)", background: "rgba(14,13,11,0.7)", color: "#FAFAF8", fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <Link2 style={{ width: 10, height: 10 }} />Copy
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              style={{ border: "1px solid rgba(250,250,248,0.3)", background: "rgba(14,13,11,0.7)", color: "#FAFAF8", fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <Pencil style={{ width: 10, height: 10 }} />Edit
            </button>
            <div style={{ flex: 1 }} />
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{ border: "1px solid rgba(168,97,91,0.4)", background: "rgba(14,13,11,0.7)", color: "#A8615B", padding: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
            >
              <Trash2 style={{ width: 12, height: 12 }} />
            </button>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 8, paddingLeft: 1 }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, fontWeight: 300, fontStyle: "italic", color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 300, color: "var(--ink-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
          {format(new Date(date), 'MMM d, yyyy')}
          {photoCount > 0 && <span>· {photoCount} photos</span>}
          {(favCount ?? 0) > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
              <Heart style={{ width: 10, height: 10, color: "#B8953F" }} fill="#B8953F" />{favCount}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
