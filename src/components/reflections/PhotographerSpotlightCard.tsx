import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Award, Camera, ExternalLink, Instagram, Globe, CalendarCheck,
  Sparkles, ArrowRight, Quote, Image
} from 'lucide-react';
import { type PhotographerSpotlight } from '@/hooks/use-reflections';

const DEMO_SPOTLIGHT: PhotographerSpotlight = {
  id: 'spotlight-demo',
  photographer_name: 'Arun Vasanth',
  tagline: 'Light is the story. I just press the shutter.',
  story: 'From documenting temple festivals in Madurai to shooting luxury weddings across South India, Arun\'s journey spans 12 years and 400+ weddings. His work is defined by a rare ability to find cinematic beauty in candid chaos — the stolen glance during a mehendi ceremony, the trembling hands tying a thali. "Every wedding has a film inside it," he says. "You just need to know which frames to keep."',
  style_description: 'Cinematic documentary with warm earth tones. Known for his dramatic use of natural window light and long-lens candid work during ceremonies.',
  portrait_url: null,
  showcase_images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
  specialties: ['Wedding', 'Candid', 'Cinematic', 'Documentary'],
  gallery_url: 'https://mirrorai.site',
  booking_url: null,
  instagram_handle: 'arunvasanth',
  website_url: null,
  packages: [
    { name: 'Essential', description: '8 hours · 300 photos · Online gallery', price: '₹45,000' },
    { name: 'Premium', description: '2 days · 600 photos · Album · Reel', price: '₹1,20,000' },
  ],
  week_number: 12,
  year: 2026,
  created_at: new Date().toISOString(),
};

interface PhotographerSpotlightCardProps {
  spotlight?: PhotographerSpotlight | null;
}

export function PhotographerSpotlightCard({ spotlight: propSpotlight }: PhotographerSpotlightCardProps) {
  const spotlight = propSpotlight || DEMO_SPOTLIGHT;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Award className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Photographer Spotlight</h2>
            <p className="text-[10px] text-muted-foreground">Featured this week</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] h-5 gap-1 border-primary/20 text-primary">
          <Sparkles className="h-2.5 w-2.5" /> Week {spotlight.week_number}
        </Badge>
      </div>

      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-card to-card">
        {/* Portrait & Name */}
        <div className="relative h-44 bg-gradient-to-br from-primary/20 via-secondary to-card flex items-end p-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.2),transparent_70%)]" />
          <div className="absolute top-3 right-3">
            <Badge className="text-[8px] px-2 h-5 bg-primary/80 text-primary-foreground gap-1">
              <Award className="h-2.5 w-2.5" /> SPOTLIGHT
            </Badge>
          </div>
          {/* Portrait Placeholder */}
          <div className="absolute top-4 left-4 h-16 w-16 rounded-2xl bg-secondary border-2 border-primary/20 flex items-center justify-center overflow-hidden">
            {spotlight.portrait_url ? (
              <img src={spotlight.portrait_url} alt={spotlight.photographer_name} className="w-full h-full object-cover" />
            ) : (
              <Camera className="h-6 w-6 text-muted-foreground/20" />
            )}
          </div>
          <div className="relative z-10 mt-auto">
            <h3
              className="text-foreground leading-tight"
              style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 600 }}
            >
              {spotlight.photographer_name}
            </h3>
            {spotlight.tagline && (
              <p className="text-[11px] text-primary/80 mt-0.5 italic flex items-center gap-1">
                <Quote className="h-2.5 w-2.5" /> {spotlight.tagline}
              </p>
            )}
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Specialties */}
          <div className="flex flex-wrap gap-1.5">
            {spotlight.specialties.map(spec => (
              <Badge key={spec} variant="outline" className="text-[9px] h-5 px-2 border-primary/20 text-primary/70">
                {spec}
              </Badge>
            ))}
          </div>

          {/* Story */}
          <div className="space-y-1.5">
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">Their Story</p>
            <p className="text-[11px] text-foreground/80 leading-relaxed">{spotlight.story}</p>
          </div>

          {/* Style */}
          {spotlight.style_description && (
            <div className="space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">Signature Style</p>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-[11px] text-foreground/70 leading-relaxed italic">{spotlight.style_description}</p>
              </div>
            </div>
          )}

          {/* Showcase */}
          {spotlight.showcase_images.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">Selected Work</p>
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-1">
                  {spotlight.showcase_images.map((img, i) => (
                    <div key={i} className="w-28 h-20 rounded-lg bg-secondary border border-border/50 shrink-0 flex items-center justify-center overflow-hidden">
                      {img === '/placeholder.svg' ? (
                        <Image className="h-4 w-4 text-muted-foreground/15" />
                      ) : (
                        <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Packages */}
          {spotlight.packages.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">Packages</p>
              <div className="space-y-1.5">
                {(spotlight.packages as any[]).map((pkg: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border/30">
                    <div>
                      <p className="text-[11px] font-medium text-foreground">{pkg.name}</p>
                      <p className="text-[9px] text-muted-foreground">{pkg.description}</p>
                    </div>
                    <span className="text-xs font-bold text-primary">{pkg.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {spotlight.gallery_url && (
              <Button
                size="sm"
                className="flex-1 text-[10px] h-8 gap-1.5"
                onClick={() => window.open(spotlight.gallery_url!, '_blank')}
              >
                <ExternalLink className="h-3 w-3" /> View Gallery
              </Button>
            )}
            {spotlight.instagram_handle && (
              <Button
                size="sm"
                variant="outline"
                className="text-[10px] h-8 gap-1.5 border-primary/20 text-primary hover:bg-primary/10"
                onClick={() => window.open(`https://instagram.com/${spotlight.instagram_handle}`, '_blank')}
              >
                <Instagram className="h-3 w-3" />
              </Button>
            )}
            {spotlight.booking_url && (
              <Button
                size="sm"
                variant="outline"
                className="text-[10px] h-8 gap-1.5 border-primary/20 text-primary hover:bg-primary/10"
                onClick={() => window.open(spotlight.booking_url!, '_blank')}
              >
                <CalendarCheck className="h-3 w-3" /> Book
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
