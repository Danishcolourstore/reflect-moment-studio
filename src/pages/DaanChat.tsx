import { DashboardLayout } from '@/components/DashboardLayout';
import { EntiranPanel } from '@/components/entiran/EntiranPanel';
import { useStudioBrain } from '@/hooks/use-studio-brain';

export default function DaanChat() {
  const { unreadCount } = useStudioBrain();

  return (
    <DashboardLayout>
      <div className="-mx-4 -my-6 sm:-mx-10 sm:-my-10">
        <EntiranPanel open embedded pendingSuggestionCount={unreadCount} />
      </div>
    </DashboardLayout>
  );
}
