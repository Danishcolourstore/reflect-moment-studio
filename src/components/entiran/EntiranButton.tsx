import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';

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
          className="absolute bottom-full right-0 mb-3 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{
            background: '#0B0B0B',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '8px 14px',
            color: '#F4F1EA',
            fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
            fontSize: 13,
            letterSpacing: '0.02em',
          }}
        >
          Ask anything with Mirror Bot
          <div
            className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45"
            style={{ background: '#0B0B0B', border: '1px solid rgba(255,255,255,0.1)', borderTop: 'none', borderLeft: 'none' }}
          />
        </div>
      )}

      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex items-center gap-2.5 transition-all duration-300 ease-out active:scale-[0.97]"
        style={{
          height: isMobile ? 42 : 46,
          padding: isMobile ? '0 18px 0 14px' : '0 22px 0 16px',
          borderRadius: 9999,
          background: '#0B0B0B',
          border: `1px solid ${isHovered ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: isHovered
            ? '0 0 20px rgba(212,175,55,0.08), 0 4px 20px rgba(0,0,0,0.5)'
            : '0 4px 20px rgba(0,0,0,0.4)',
        }}
        aria-label="Open Mirror Bot"
      >
        {/* Mirror icon – thin outline */}
        <svg
          width={isMobile ? 16 : 18}
          height={isMobile ? 16 : 18}
          viewBox="0 0 24 24"
          fill="none"
          stroke={isHovered ? '#D4AF37' : '#F4F1EA'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-300 shrink-0"
        >
          <ellipse cx="12" cy="13" rx="7" ry="9" />
          <ellipse cx="12" cy="13" rx="4.5" ry="6" opacity="0.4" />
          <line x1="12" y1="4" x2="12" y2="2" />
          <line x1="8.5" y1="4.5" x2="7.5" y2="3" />
          <line x1="15.5" y1="4.5" x2="16.5" y2="3" />
        </svg>

        {/* Label */}
        <span
          className="select-none transition-colors duration-300"
          style={{
            fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
            fontSize: isMobile ? 13 : 14,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: isHovered ? '#D4AF37' : '#F4F1EA',
          }}
        >
          Mirror Bot
        </span>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full"
            style={{
              width: 18,
              height: 18,
              fontSize: 9,
              fontWeight: 700,
              backgroundColor: '#8B0000',
              color: '#F4F1EA',
              boxShadow: '0 0 8px rgba(139,0,0,0.4)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
