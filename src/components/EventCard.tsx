import { CalendarDays, Image, Share2, Pencil, Trash2 } from 'lucide-react';
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
      <div className="relative aspect-square overflow-hidden bg-muted">
        {coverUrl ? (
          <img src={coverUrl} alt={name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary/50">
            <Image className="h-10 w-10 text-muted-foreground/20" />
          </div>
        )}
        {/* Pic-Time style hover overlay — subtle bottom gradient with actions */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-foreground/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center gap-1 p-3">
            <button onClick={(e) => { e.stopPropagation(); onShare(); }} className="rounded-full bg-card/90 backdrop-blur-sm px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-card">
              <Share2 className="inline h-3 w-3 mr-1" />Share
            </button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="rounded-full bg-card/90 backdrop-blur-sm px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-card">
              <Pencil className="inline h-3 w-3 mr-1" />Edit
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded-full bg-card/90 backdrop-blur-sm px-3 py-1.5 text-[11px] font-medium text-destructive transition-colors hover:bg-card">
              <Trash2 className="inline h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
      {/* Minimal metadata — Pixieset style */}
      <div className="mt-2.5 px-0.5">
        <h3 className="font-serif text-[15px] font-medium text-foreground leading-tight truncate">{name}</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {format(new Date(date), 'MMM d, yyyy')} · {photoCount} photos
        </p>
      </div>
    </div>
  );
}
