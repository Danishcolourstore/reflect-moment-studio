import { Image, Share2, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface EventCardProps {
  id: string;
  name: string;
  date: string;
  photoCount: number;
  coverUrl: string | null;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export function EventCard({ name, date, photoCount, coverUrl, onShare, onEdit, onDelete, onClick }: EventCardProps) {
  return (
    <div className="group cursor-pointer animate-fade-in" onClick={onClick}>
      {/* Square cover — Pixieset album grid style */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image className="h-8 w-8 text-muted-foreground/15" />
          </div>
        )}
        {/* Hover overlay — bottom gradient only, Pic-Time style */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              className="inline-flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium text-foreground transition hover:bg-card"
            >
              <Share2 className="h-2.5 w-2.5" />Share
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="inline-flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium text-foreground transition hover:bg-card"
            >
              <Pencil className="h-2.5 w-2.5" />Edit
            </button>
            <div className="flex-1" />
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="rounded-full bg-card/90 backdrop-blur-sm p-1.5 text-destructive transition hover:bg-card"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
      {/* Minimal metadata strip */}
      <div className="mt-2 px-px">
        <h3 className="font-serif text-sm font-medium text-foreground leading-snug truncate">{name}</h3>
        <p className="text-[10px] text-muted-foreground/70 mt-px">
          {format(new Date(date), 'MMM d, yyyy')}{photoCount > 0 ? ` · ${photoCount}` : ''}
        </p>
      </div>
    </div>
  );
}
