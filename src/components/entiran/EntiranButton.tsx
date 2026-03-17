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
      className="fixed flex items-center justify-center transition-all duration-300 ease-out active:scale-95 group"
      style={{
        bottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom, 0px))' : 28,
        right: isMobile ? 16 : 28,
        width: isMobile ? 54 : 58,
        height: isMobile ? 54 : 58,
        zIndex: 10001,
        borderRadius: '50%',
        background: '#0A0A0A',
        boxShadow: '0 0 0 2px #D4AF37, 0 0 20px rgba(212,175,55,0.15), 0 8px 32px rgba(0,0,0,0.6)',
      }}
      aria-label="Open Daan AI Assistant"
    >
      {/* Pulse ring */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          border: '2px solid rgba(212,175,55,0.3)',
          animation: 'daan-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      />
      {/* Inner label */}
      <span
        className="text-[10px] font-semibold tracking-[0.2em] uppercase select-none"
        style={{ color: '#D4AF37', letterSpacing: '0.15em' }}
      >
        D
      </span>
      {/* Unread indicator */}
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full"
          style={{
            width: 16,
            height: 16,
            fontSize: 9,
            fontWeight: 700,
            backgroundColor: '#8B0000',
            color: '#F4F1EA',
            boxShadow: '0 0 8px rgba(139,0,0,0.5)',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      <style>{`
        @keyframes daan-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.25); opacity: 0; }
        }
      `}</style>
    </button>
  );
}
