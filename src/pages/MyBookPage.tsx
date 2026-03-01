import { useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { BookOpen } from 'lucide-react';

const MyBookPage = () => {
  useEffect(() => { document.title = 'MirrorAI — MyBook'; }, []);

  return (
    <DashboardLayout>
      <div className="page-fade-in flex flex-col items-center justify-center py-24 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground/15 mb-4" />
        <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">MyBook</h1>
        <p className="text-[12px] text-muted-foreground/50">Curated photo books — coming soon</p>
        <p className="mt-2 text-[10px] text-muted-foreground/35 max-w-xs">
          Design and order premium printed photo books directly from your event galleries.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default MyBookPage;
