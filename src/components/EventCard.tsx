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
    <div className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md animate-fade-in cursor-pointer" onClick={onClick}>
      <div className="relative h-48 overflow-hidden bg-muted">
        {coverUrl ? (
          <img src={coverUrl} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg font-medium text-foreground truncate">{name}</h3>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{format(new Date(date), 'MMM d, yyyy')}</span>
          <span className="flex items-center gap-1"><Image className="h-3 w-3" />{photoCount} photos</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onShare(); }} className="rounded px-2 py-1 text-xs text-gold hover:bg-muted transition-colors">
            <Share2 className="inline h-3 w-3 mr-1" />Share
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors">
            <Pencil className="inline h-3 w-3 mr-1" />Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded px-2 py-1 text-xs text-destructive hover:bg-muted transition-colors">
            <Trash2 className="inline h-3 w-3 mr-1" />Delete
          </button>
        </div>
      </div>
    </div>
  );
}
