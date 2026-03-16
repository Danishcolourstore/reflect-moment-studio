import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { WebsiteProfile } from '@/pages/WebsiteBuilder';

const BUILD_STEPS = [
  'Analyzing your style...',
  'Generating SEO content...',
  'Optimizing images...',
  'Building pages...',
  'Configuring domain...',
  'Website is live! 🎉',
];

interface Props {
  profile: WebsiteProfile;
  userId: string;
  onComplete: (websiteId: string) => void;
}

export function BuildingStep({ profile, userId, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      if (!mounted) return;
      setProgress(prev => {
        const next = Math.min(prev + 2, 100);
        const stepIndex = Math.min(Math.floor((next / 100) * BUILD_STEPS.length), BUILD_STEPS.length - 1);
        setActiveStep(stepIndex);
        setCompletedSteps(Array.from({ length: stepIndex }, (_, i) => i));
        return next;
      });
    }, 100);

    // Create website record
    const seoData = {
      home: { title: `${profile.studioName} | ${profile.specialty} Photographer in ${profile.city}`, description: `Professional ${profile.specialty.toLowerCase()} photography by ${profile.studioName} in ${profile.city}. Book your session today.`, slug: '/' },
      portfolio: { title: `Portfolio | ${profile.studioName}`, description: `Explore the stunning ${profile.specialty.toLowerCase()} photography portfolio of ${profile.studioName}, based in ${profile.city}.`, slug: '/portfolio' },
      about: { title: `About | ${profile.studioName}`, description: profile.aboutBio?.slice(0, 155) || `Meet ${profile.studioName}, a passionate ${profile.specialty.toLowerCase()} photographer in ${profile.city}.`, slug: '/about' },
      contact: { title: `Contact | ${profile.studioName}`, description: `Get in touch with ${profile.studioName} for ${profile.specialty.toLowerCase()} photography in ${profile.city}. Book now.`, slug: '/contact' },
    };

    const createWebsite = async () => {
      const { data, error } = await (supabase.from('photographer_websites').insert({
        user_id: userId,
        studio_name: profile.studioName,
        city: profile.city,
        specialty: profile.specialty,
        about_bio: profile.aboutBio,
        subdomain: profile.subdomain,
        selected_photos: profile.selectedPhotos as any,
        seo_data: seoData as any,
        is_published: true,
        build_status: 'complete',
      } as any).select('id').single() as any);

      // Wait for animation to complete
      setTimeout(() => {
        if (mounted && data?.id) {
          onComplete(data.id);
        }
      }, 5500);
    };

    createWebsite();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full max-w-md text-center animate-in fade-in duration-500">
      {/* Gold ring spinner */}
      <div className="relative mx-auto h-32 w-32 mb-10">
        <div className="absolute inset-0 rounded-full border-2 border-secondary" />
        <div
          className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"
          style={{ animationDuration: '1.5s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        </div>
      </div>

      <h2 className="font-display text-2xl font-semibold text-foreground mb-2">Building your website</h2>
      <p className="text-muted-foreground text-sm mb-8">This usually takes less than a minute</p>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Build log */}
      <div className="space-y-3 text-left">
        {BUILD_STEPS.map((step, i) => {
          const isActive = i === activeStep;
          const isComplete = completedSteps.includes(i);
          const isVisible = i <= activeStep;

          if (!isVisible) return null;

          return (
            <div
              key={i}
              className={`flex items-center gap-3 text-sm transition-all duration-500 animate-in fade-in slide-in-from-left-2 ${
                isComplete ? 'text-primary' : isActive ? 'text-foreground' : 'text-muted-foreground/40'
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                isComplete ? 'bg-primary' : isActive ? 'bg-foreground animate-pulse' : 'bg-muted-foreground/30'
              }`} />
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}
