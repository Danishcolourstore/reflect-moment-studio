import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { WebsiteProfile } from '@/pages/WebsiteBuilder';

const SPECIALTIES = ['Wedding', 'Portrait', 'Event', 'Commercial', 'Fashion', 'Travel'];

interface Props {
  profile: WebsiteProfile;
  onComplete: (data: Partial<WebsiteProfile>) => void;
  userId: string;
}

export function ProfileStep({ profile, onComplete, userId }: Props) {
  const [studioName, setStudioName] = useState(profile.studioName);
  const [city, setCity] = useState(profile.city);
  const [specialty, setSpecialty] = useState(profile.specialty);
  const [aboutBio, setAboutBio] = useState(profile.aboutBio);
  const [generating, setGenerating] = useState(false);

  const generateBio = async () => {
    if (!studioName.trim() || !city.trim()) {
      toast.error('Enter your studio name and city first');
      return;
    }
    setGenerating(true);
    // Simulate AI bio generation
    await new Promise(r => setTimeout(r, 1500));
    const bio = `${studioName} is a premier ${specialty.toLowerCase()} photography studio based in ${city}, dedicated to capturing life's most extraordinary moments with an artistic eye and meticulous attention to detail. With a passion for storytelling through imagery, we transform fleeting moments into timeless visual narratives.`;
    setAboutBio(bio);
    setGenerating(false);
    toast.success('Bio generated!');
  };

  const handleSubmit = () => {
    if (!studioName.trim()) { toast.error('Studio name is required'); return; }
    if (!city.trim()) { toast.error('City is required'); return; }
    const subdomain = studioName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30);
    onComplete({ studioName, city, specialty, aboutBio, subdomain });
  };

  return (
    <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs tracking-widest uppercase mb-6">
          <Sparkles className="h-3 w-3" /> AI Website Builder
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground tracking-tight leading-tight">
          Tell us about<br />your studio
        </h1>
        <p className="text-muted-foreground text-sm mt-3 max-w-sm mx-auto">
          We'll use this to craft your perfect photography website in seconds.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium block mb-2">Studio Name</label>
          <Input
            value={studioName}
            onChange={e => setStudioName(e.target.value)}
            placeholder="Lumière Studios"
            className="bg-secondary/50 border-border/50 h-12 text-foreground placeholder:text-muted-foreground/40"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium block mb-2">City</label>
          <Input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Mumbai, India"
            className="bg-secondary/50 border-border/50 h-12 text-foreground placeholder:text-muted-foreground/40"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium block mb-2">Specialty</label>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map(s => (
              <button
                key={s}
                onClick={() => setSpecialty(s)}
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ${
                  specialty === s
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-secondary/50 text-muted-foreground border border-border/50 hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">About / Bio</label>
            <button
              onClick={generateBio}
              disabled={generating}
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              {generating ? 'Generating...' : '✦ AI Generate'}
            </button>
          </div>
          <Textarea
            value={aboutBio}
            onChange={e => setAboutBio(e.target.value)}
            placeholder="Tell your story or let AI write one for you..."
            rows={4}
            className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground/40 resize-none"
          />
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full h-12 text-sm font-medium tracking-wider uppercase bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
