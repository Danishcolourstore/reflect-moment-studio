import { ReactNode, useState } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { useViewMode } from '@/lib/ViewModeContext';

interface FloatingActionButtonProps {
  className?: string;
}

function shouldShowFab(pathname: string): boolean {
  if (pathname.startsWith('/studio/storybook')) return true;
  if (/^\/studio\/weddings\/[^/]+$/.test(pathname)) return true;
  return false;
}

/**
 * Pencil FAB — visible only on Grid Builder and wedding event detail.
 */
export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useViewMode();

  if (!isMobile || !shouldShowFab(location.pathname)) {
    return null;
  }

  const handleClick = () => {
    if (location.pathname.startsWith('/studio/storybook')) {
      window.dispatchEvent(new CustomEvent('studio-fab:grid-edit'));
      return;
    }
    const id = location.pathname.split('/').pop();
    if (id) navigate(`/dashboard/events/${id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn('fixed z-40 lg:hidden', className)}
      aria-label="Edit"
      style={{
        bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 0,
        background: 'var(--ink, #1A1917)',
        border: '1px solid var(--border-default, #E8E6E1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Pencil className="h-5 w-5" style={{ color: 'var(--paper, #FAFAF8)' }} strokeWidth={1.5} />
    </button>
  );
}
