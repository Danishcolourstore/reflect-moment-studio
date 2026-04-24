import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface EntiranButtonProps {
  onClick: () => void;
  unreadCount: number;
}

const TOOLTIP_KEY = 'daan_tooltip_dismissed';

export function EntiranButton({ onClick, unreadCount }: EntiranButtonProps) {
  const isMobile = useIsMobile();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(TOOLTIP_KEY);
    if (!dismissed) {
      const t = setTimeout(() => setShowTooltip(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClick = () => {
    if (showTooltip) {
      setShowTooltip(false);
      localStorage.setItem(TOOLTIP_KEY, '1');
    }
    onClick();
  };

  const size = isMobile ? 48 : 52;

  return (
    <div
      className="fixed"
      style={{
        bottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom, 0px))' : 28,
        left: isMobile ? 16 : undefined,
        right: isMobile ? undefined : 28,
        zIndex: 10001,
      }}
    >
      {/* First-time tooltip */}
      {showTooltip && (
        <div
          className={`absolute bottom-full ${isMobile ? 'left-0' : 'right-0'} mb-3 whitespace-nowrap animate-fade-in`}
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
            className={`absolute -bottom-1.5 ${isMobile ? 'left-6' : 'right-6'} w-3 h-3 rotate-45`}
            style={{
              background: '#111111',
              borderRight: '1px solid rgba(200,169,126,0.12)',
              borderBottom: '1px solid rgba(200,169,126,0.12)',
            }}
          />
        </div>
      )}

      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        aria-label="Open Daan AI"
        className="relative flex items-center justify-center"
        style={{
          width: size,
          height: size,
          borderRadius: 16,
          background: 'linear-gradient(145deg, rgba(200,169,126,0.14), rgba(200,169,126,0.04))',
          border: `1px solid ${isHovered ? 'rgba(200,169,126,0.32)' : 'rgba(200,169,126,0.12)'}`,
          boxShadow: isHovered
            ? '0 8px 32px rgba(0,0,0,0.40)'
            : '0 4px 18px rgba(0,0,0,0.30)',
          transform: isPressed ? 'scale(0.94)' : 'scale(1)',
          transition: 'transform 120ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease-out',
        }}
      >
        <Sparkles
          style={{
            width: 22,
            height: 22,
            color: 'rgba(200,169,126,0.70)',
          }}
        />

        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full"
            style={{
              width: 18,
              height: 18,
              fontSize: 9,
              fontWeight: 700,
              backgroundColor: '#C8A97E',
              color: '#111111',
              boxShadow: '0 0 8px rgba(200,169,126,0.30)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
