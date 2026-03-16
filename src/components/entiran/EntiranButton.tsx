import { Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface EntiranButtonProps {
  onClick: () => void;
  unreadCount: number;
}

export function EntiranButton({ onClick, unreadCount }: EntiranButtonProps) {
  const isMobile = useIsMobile();

  return (
    <button
      onClick={onClick}
      className="fixed rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-105 hover:shadow-xl active:scale-95 bg-primary text-primary-foreground"
      style={{
        bottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom, 0px))' : 24,
        right: isMobile ? 16 : 24,
        width: isMobile ? 52 : 56,
        height: isMobile ? 52 : 56,
        zIndex: 10001,
      }}
      aria-label="Open Entiran AI Assistant"
    >
      <Sparkles className="h-5 w-5" />
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground font-bold"
          style={{
            minWidth: unreadCount > 1 ? 20 : 12,
            height: unreadCount > 1 ? 20 : 12,
            fontSize: unreadCount > 1 ? 10 : 0,
            padding: unreadCount > 1 ? '0 4px' : 0,
          }}
        >
          {unreadCount > 1 ? unreadCount : ''}
        </span>
      )}
    </button>
  );
}
