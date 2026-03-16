import { Sparkles } from 'lucide-react';
import type { WebsiteProfile } from '@/pages/WebsiteBuilder';

interface SEOCard {
  page: string;
  title: string;
  description: string;
  slug: string;
}

export function SEOTab({ profile }: { profile: WebsiteProfile }) {
  const cards: SEOCard[] = [
    {
      page: 'Home',
      title: `${profile.studioName} | ${profile.specialty} Photographer in ${profile.city}`,
      description: `Professional ${profile.specialty.toLowerCase()} photography by ${profile.studioName} in ${profile.city}. Book your session today for stunning, timeless imagery.`,
      slug: '/',
    },
    {
      page: 'Portfolio',
      title: `Portfolio | ${profile.studioName} — ${profile.specialty} Photography`,
      description: `Explore the stunning ${profile.specialty.toLowerCase()} photography portfolio of ${profile.studioName}, based in ${profile.city}. View our finest work.`,
      slug: '/portfolio',
    },
    {
      page: 'About',
      title: `About | ${profile.studioName} — ${profile.city}`,
      description: profile.aboutBio?.slice(0, 155) || `Meet ${profile.studioName}, a passionate ${profile.specialty.toLowerCase()} photographer in ${profile.city}.`,
      slug: '/about',
    },
    {
      page: 'Contact',
      title: `Contact | ${profile.studioName} — Book a Session`,
      description: `Get in touch with ${profile.studioName} for ${profile.specialty.toLowerCase()} photography in ${profile.city}. Book your session now.`,
      slug: '/contact',
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="font-display text-lg text-foreground">SEO Configuration</h2>
        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.15em] text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          <Sparkles className="h-2.5 w-2.5" /> Auto-Generated
        </span>
      </div>

      {cards.map((card, i) => (
        <div
          key={card.page}
          className="p-5 rounded-lg border border-border/30 bg-card/50 animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">{card.page}</span>
            <span className="inline-flex items-center gap-1 text-[9px] text-primary">
              <Sparkles className="h-2.5 w-2.5" /> ✦ Auto-Generated
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-0.5 block">Title Tag</label>
              <p className="text-sm text-foreground font-medium">{card.title}</p>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-0.5 block">Meta Description</label>
              <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-0.5 block">URL</label>
              <p className="text-xs text-primary font-mono">{profile.subdomain}.mirrorai.site{card.slug}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
