import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EntiranPanel } from '@/components/entiran/EntiranPanel';
import { useStudioBrain } from '@/hooks/use-studio-brain';
import { useViewMode } from '@/lib/ViewModeContext';

export default function DaanChat() {
  const { unreadCount } = useStudioBrain();
  const { isMobile } = useViewMode();
  const navigate = useNavigate();

  // Mobile: full-screen chat with safe-area back button (bypass DashboardLayout chrome)
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 flex flex-col"
        style={{ background: '#080808', zIndex: 100 }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="absolute left-3 flex items-center justify-center h-10 w-10 rounded-full active:bg-white/5 transition-colors"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
            color: 'rgba(244,241,234,0.5)',
            zIndex: 10,
          }}
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
        <EntiranPanel open embedded pendingSuggestionCount={unreadCount} />
      </div>
    );
  }

  // Desktop: keep dashboard chrome
  return (
    <DashboardLayout>
      <div className="-mx-4 -my-6 sm:-mx-10 sm:-my-10">
        <EntiranPanel open embedded pendingSuggestionCount={unreadCount} />
      </div>
    </DashboardLayout>
  );
}
