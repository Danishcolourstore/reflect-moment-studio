import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface EntiranButtonProps {
  onClick: () => void;
  unreadCount: number;
}

const TOOLTIP_KEY = 'mirrorbot_tooltip_dismissed';

export function EntiranButton({ onClick, unreadCount }: EntiranButtonProps) {
  const isMobile = useIsMobile();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(TOOLTIP_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setShowTooltip(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClick = () => {
    if (showTooltip) {
      setShowTooltip(false);
      localStorage.setItem(TOOLTIP_KEY, '1');
    }
    onClick();
  };

  return (
    <div
      className="fixed"
      style={{
        bottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom, 0px))' : 28,
        right: isMobile ? 16 : 28,
        zIndex: 10001,
      }}
    >
      {/* First-time tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full right-0 mb-3 whitespace-nowrap animate-fade-in"
          style={{
            background: '#111111',
            border: '1px solid rgba(200,169,126,0.12)',
            borderRadius: 12,
            padding: '10px 16px',
            color: '#F4F1EA',
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 13,
            letterSpacing: '0.02em',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          Ask anything with Daan
          <div
            className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45"
            style={{ background: '#111111', border: '1px solid rgba(200,169,126,0.12)', borderTop: 'none', borderLeft: 'none' }}
          />
        </div>
      )}

      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex items-center justify-center transition-all duration-300 ease-out active:scale-[0.94]"
        style={{
          width: isMobile ? 48 : 52,
          height: isMobile ? 48 : 52,
          borderRadius: 16,
          background: isHovered
            ? 'linear-gradient(145deg, rgba(200,169,126,0.2), rgba(200,169,126,0.08))'
            : 'linear-gradient(145deg, rgba(200,169,126,0.12), rgba(200,169,126,0.04))',
          border: `1px solid ${isHovered ? 'rgba(200,169,126,0.3)' : 'rgba(200,169,126,0.1)'}`,
          boxShadow: isHovered
            ? '0 0 30px rgba(200,169,126,0.12), 0 8px 32px rgba(0,0,0,0.4)'
            : '0 4px 24px rgba(0,0,0,0.3)',
        }}
        aria-label="Open Daan AI"
      >
        <Sparkles
          className="transition-all duration-300"
          style={{
            width: isMobile ? 20 : 22,
            height: isMobile ? 20 : 22,
            color: isHovered ? '#C8A97E' : 'rgba(200,169,126,0.65)',
          }}
        />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full"
            style={{
              width: 18,
              height: 18,
              fontSize: 9,
              fontWeight: 700,
              backgroundColor: '#C8A97E',
              color: '#080808',
              boxShadow: '0 0 8px rgba(200,169,126,0.3)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
