import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { ProfileStep } from '@/components/website-builder/ProfileStep';
import { PhotoSelectionStep } from '@/components/website-builder/PhotoSelectionStep';
import { BuildingStep } from '@/components/website-builder/BuildingStep';
import { BuilderDashboard } from '@/components/website-builder/BuilderDashboard';

export interface WebsiteProfile {
  studioName: string;
  city: string;
  specialty: string;
  aboutBio: string;
  selectedPhotos: string[];
  subdomain: string;
}

const WebsiteBuilder = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<WebsiteProfile>({
    studioName: '',
    city: '',
    specialty: 'Wedding',
    aboutBio: '',
    selectedPhotos: [],
    subdomain: '',
  });
  const [websiteId, setWebsiteId] = useState<string | null>(null);

  const handleProfileComplete = useCallback((data: Partial<WebsiteProfile>) => {
    setProfile(prev => ({ ...prev, ...data }));
    setStep(1);
  }, []);

  const handlePhotosComplete = useCallback((photos: string[]) => {
    setProfile(prev => ({ ...prev, selectedPhotos: photos }));
    setStep(2);
  }, []);

  const handleBuildComplete = useCallback((id: string) => {
    setWebsiteId(id);
    setStep(3);
  }, []);

  if (!user) return null;

  if (step === 3 && websiteId) {
    return <BuilderDashboard websiteId={websiteId} profile={profile} userId={user.id} />;
  }

  return (
    <div className="min-h-screen bg-[#080808] text-foreground relative overflow-hidden">
      {/* Subtle grain texture */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }}
      />

      <div className="relative z-10">
        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${((step + 1) / 3) * 100}%` }}
            />
          </div>
          <div className="flex justify-between px-8 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className={step >= 0 ? 'text-primary' : ''}>Step {step + 1} of 3</span>
            <span className="font-display text-sm tracking-wider text-foreground/60">Mirror AI</span>
          </div>
        </div>

        <div className="pt-16 min-h-screen flex items-center justify-center px-4">
          {step === 0 && (
            <ProfileStep
              profile={profile}
              onComplete={handleProfileComplete}
              userId={user.id}
            />
          )}
          {step === 1 && (
            <PhotoSelectionStep
              profile={profile}
              onComplete={handlePhotosComplete}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <BuildingStep
              profile={profile}
              userId={user.id}
              onComplete={handleBuildComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WebsiteBuilder;
