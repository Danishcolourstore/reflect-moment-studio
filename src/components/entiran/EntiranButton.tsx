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
      className="fixed rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 hover:shadow-xl active:scale-95"
      style={{
        bottom: isMobile ? 88 : 24,
        right: isMobile ? 16 : 24,
        width: 56,
        height: 56,
        backgroundColor: '#C9A96E',
        zIndex: 10001,
      }}
      aria-label="Open Entiran AI Assistant"
    >
      <Sparkles className="h-6 w-6 text-white" />
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white font-bold"
          style={{
            backgroundColor: '#ef4444',
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
