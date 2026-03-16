import { useNavigate } from 'react-router-dom';
import { type Suggestion } from '@/hooks/use-studio-brain';
import { Sparkles, X } from 'lucide-react';

interface StudioBrainCardsProps {
  suggestions: Suggestion[];
  onDismiss: (id: string) => void;
  onAct: (id: string) => void;
}

export function StudioBrainCards({ suggestions, onDismiss, onAct }: StudioBrainCardsProps) {
  const navigate = useNavigate();
  const visible = suggestions.filter(s => !s.is_dismissed).slice(0, 3);

  if (visible.length === 0) return null;

  const handleAction = (s: Suggestion) => {
    onAct(s.id);
    const data = s.action_data as any;
    switch (s.suggestion_type) {
      case 'album_from_selections':
        navigate(`/dashboard/album-designer?event=${data?.event_id}`);
        break;
      case 'share_gallery':
        navigate(`/dashboard/gallery/${data?.event_id}`);
        break;
      case 'remind_client':
        navigate(`/dashboard/gallery/${data?.event_id}`);
        break;
      case 'export_album':
        navigate(`/dashboard/album-editor/${data?.album_id}`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4" style={{ color: '#C9A96E' }} />
        <h3 className="text-sm font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1A1A1A' }}>
          Studio Brain
        </h3>
      </div>
      {visible.map(s => (
        <div
          key={s.id}
          className="rounded-xl p-4 border-l-[3px] bg-white shadow-sm transition-all animate-in fade-in"
          style={{ borderLeftColor: '#C9A96E', borderColor: '#E8E0D4', borderWidth: '1px', borderLeftWidth: '3px' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-3">
              <p className="text-sm font-semibold mb-1" style={{ color: '#1A1A1A' }}>{s.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: '#1A1A1A', opacity: 0.7 }}>{s.body}</p>
            </div>
            <button onClick={() => onDismiss(s.id)} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
              <X className="h-3.5 w-3.5" style={{ color: '#1A1A1A', opacity: 0.3 }} />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleAction(s)}
              className="text-xs px-3 py-1.5 rounded-lg text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#C9A96E' }}
            >
              Take Action
            </button>
            <button
              onClick={() => onDismiss(s.id)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-black/5"
              style={{ color: '#1A1A1A', opacity: 0.5 }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
